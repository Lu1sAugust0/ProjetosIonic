import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  AlertController,
  IonLoading,
  IonText,
  IonButtons,
  IonBackButton,
  IonItemDivider
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { locationOutline, searchOutline, saveOutline } from 'ionicons/icons';

// Capacitor Browser para abrir link externo (Google Maps)
import { Browser } from '@capacitor/browser';

// Firestore / Auth
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

import { environment } from 'src/environments/environment';
const GOOGLE_MAPS_API_KEY = environment.googleMapsApiKey;

// Tipagem do ViaCEP
interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-buscar-endereco',
  templateUrl: './buscar-endereco.page.html',
  styleUrls: ['./buscar-endereco.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonLoading,
    IonText,
    IonButtons,
    IonBackButton,
    IonItemDivider
  ],
})
export class BuscarEnderecoPage implements OnInit {

  cep: string = '';
  address: ViaCepResponse | null = null;
  isLoading: boolean = false;

  coordinates: Coordinates | null = null;
  geocodingError: string | null = null;

  private http: HttpClient = inject(HttpClient);
  private alertController: AlertController = inject(AlertController);

  // Firebase
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  private userId: string | null = null;

  constructor() {
    addIcons({ locationOutline, searchOutline, saveOutline });
  }

  async ngOnInit() {
    try {
      const firebaseUser = await firstValueFrom(user(this.auth));
      if (firebaseUser) this.userId = firebaseUser.uid;
    } catch (e) {
      console.error('Erro ao obter usuário de autenticação:', e);
    }
  }

  /**
   * Busca CEP via ViaCEP e, se encontrado, chama geocoding.
   */
  async searchCep() {
    this.address = null;
    this.coordinates = null;
    this.geocodingError = null;

    const cleanCep = (this.cep || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      this.presentAlert('Erro', 'O CEP deve ter 8 dígitos.');
      return;
    }

    this.isLoading = true;
    try {
      const url = `https://viacep.com.br/ws/${cleanCep}/json/`;
      const response = await firstValueFrom(this.http.get<ViaCepResponse>(url));

      if ((response as any).erro) {
        this.presentAlert('Erro', 'CEP não encontrado.');
        this.address = null;
      } else {
        this.address = response;
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      this.presentAlert('Erro de Conexão', 'Não foi possível buscar o CEP. Tente novamente.');
    } finally {
      this.isLoading = false;
    }
  }

 
  /**
   * Salva o endereço no Firestore (incluindo coordenadas se existirem)
   */
  async saveAddress() {
    if (!this.address) {
      this.presentAlert('Atenção', 'Nenhum endereço para salvar.');
      return;
    }
    if (!this.userId) {
      this.presentAlert('Atenção', 'Você precisa estar logado para salvar endereços.');
      return;
    }

    this.isLoading = true;
    try {
      const addressToSave = {
        cep: this.address.cep,
        logradouro: this.address.logradouro || '',
        bairro: this.address.bairro || '',
        localidade: this.address.localidade || '',
        uf: this.address.uf || '',
        latitude: this.coordinates?.latitude ?? null,
        longitude: this.coordinates?.longitude ?? null,
        savedAt: new Date().toISOString()
      };

      const addressesCollection = collection(this.firestore, `users/${this.userId}/savedAddresses`);
      await addDoc(addressesCollection, addressToSave);

      this.presentAlert('Sucesso', 'Endereço salvo com sucesso!');
    } catch (e) {
      console.error('Erro ao salvar endereço:', e);
      this.presentAlert('Erro', 'Não foi possível salvar o endereço. Tente novamente.');
    } finally {
      this.isLoading = false;
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
