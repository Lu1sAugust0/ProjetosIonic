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

// Importações do Firebase/Firestore
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

// Importações de Plugins Capacitor (NÃO usaremos .geocode)
import { Geolocation } from '@capacitor/geolocation'; 


// --------------------------------------------------------------------------
const GOOGLE_MAPS_API_KEY = "AIzaSyA-PHske1BAsvZZbJDbR2953SlgS4BbGdI"; 
// --------------------------------------------------------------------------


// Interface para tipagem do resultado do ViaCEP
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

// Interface para Coordenadas
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
  
  // Novo estado para Geocoordenadas
  coordinates: Coordinates | null = null;
  geocodingError: string | null = null;

  private http: HttpClient = inject(HttpClient);
  private alertController: AlertController = inject(AlertController);
  
  // Injeções de Dependência do Firebase
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  private userId: string | null = null;


  constructor() { 
    // Adicionando todos os ícones utilizados no HTML
    addIcons({ locationOutline, searchOutline, saveOutline });
  }

  async ngOnInit() {
    try {
      // Obtém o usuário logado para uso no Firestore
      const firebaseUser = await firstValueFrom(user(this.auth));
      if (firebaseUser) {
        this.userId = firebaseUser.uid;
      }
    } catch (e) {
      console.error('Erro ao obter usuário de autenticação:', e);
    }
  }

  /**
   * 1. Limpa o CEP para apenas números.
   * 2. Faz a requisição à API do ViaCEP.
   * 3. Se sucesso, tenta buscar as coordenadas geográficas.
   */
  async searchCep() {
    this.address = null;
    this.coordinates = null;
    this.geocodingError = null;
    const cleanCep = this.cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      this.presentAlert('Erro', 'O CEP deve ter 8 dígitos.');
      return;
    }

    this.isLoading = true;
    try {
      const url = `https://viacep.com.br/ws/${cleanCep}/json/`;
      const response = await firstValueFrom(this.http.get<ViaCepResponse>(url));

      if (response.erro) {
        this.presentAlert('Erro', 'CEP não encontrado.');
        this.address = null;
      } else {
        this.address = response;
        // Tenta buscar as coordenadas após encontrar o endereço
        await this.getCoordinatesForAddress();
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      this.presentAlert('Erro de Conexão', 'Não foi possível buscar o CEP. Tente novamente.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Função que busca as coordenadas de um endereço encontrado usando a API de Geocoding do Google Maps (HTTP).
   */
  async getCoordinatesForAddress() {
    if (!this.address) return;

    this.geocodingError = null;
    
    // Constrói a string de endereço completa (incluindo o Brasil para escopo)
    const fullAddress = `${this.address.logradouro}, ${this.address.bairro}, ${this.address.localidade}, ${this.address.uf}, Brasil`;

    try {
      if (GOOGLE_MAPS_API_KEY === "AIzaSyA-PHske1BAsvZZbJDbR2953SlgS4BbGdI") {
          this.geocodingError = "Chave da Google Maps API não configurada. Edite a constante GOOGLE_MAPS_API_KEY.";
          return;
      }

      const geocodingUrl = 
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const result = await firstValueFrom(this.http.get<any>(geocodingUrl));
      
      if (result.status === 'OK' && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        this.coordinates = {
          latitude: location.lat,
          longitude: location.lng
        };
        console.log('Coordenadas encontradas via Google Maps:', this.coordinates);
      } else {
        // Trata status diferentes de OK ou nenhum resultado
        this.geocodingError = `Coordenadas não encontradas (Status: ${result.status}).`;
        console.warn('Geocoding não retornou coordenadas válidas:', result);
      }
      
    } catch (e) {
      // Este catch é para erros de rede, chave de API inválida, etc.
      this.geocodingError = 'Erro ao buscar coordenadas. Verifique a chave da API e a conexão.';
      console.error('Erro no Geocoding via Google Maps:', e);
    }
  }

  /**
   * Função para Salvar Endereço (Firestore)
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
        localidade: this.address.localidade,
        uf: this.address.uf,
        // Adiciona as coordenadas, se existirem (agora buscadas via Google Maps)
        latitude: this.coordinates?.latitude || null,
        longitude: this.coordinates?.longitude || null,
        savedAt: new Date().toISOString()
      };
      
      const addressesCollection = collection(this.firestore, `users/${this.userId}/savedAddresses`);
      await addDoc(addressesCollection, addressToSave);

      this.presentAlert('Sucesso!', 'Endereço salvo com sucesso na sua lista!');
      
    } catch (e) {
      console.error('Erro ao salvar endereço no Firestore:', e);
      this.presentAlert('Erro', 'Falha ao salvar o endereço. Tente novamente.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Função auxiliar para exibir alertas.
   */
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}