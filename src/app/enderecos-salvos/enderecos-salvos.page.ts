import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonButtons,
  IonBackButton,
  IonIcon,
  AlertController,
  IonNote,
  IonItemSliding, // Para o gesto de deslizar (swipe)
  IonItemOptions,
  IonItemOption
} from '@ionic/angular/standalone';
import { Firestore, collection, collectionData, query, where, doc, deleteDoc, getFirestore } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

// Interface para garantir a tipagem dos endereços
interface EnderecoSalvo {
  id: string; // Adicionamos ID para exclusão
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

@Component({
  selector: 'app-enderecos-salvos',
  templateUrl: './enderecos-salvos.page.html',
  styleUrls: ['./enderecos-salvos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButton, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonButtons, 
    IonBackButton, 
    IonIcon, 
    IonNote,
    IonItemSliding, 
    IonItemOptions, 
    IonItemOption
  ],
})
export class EnderecosSalvosPage implements OnInit, OnDestroy {

  savedAddresses: EnderecoSalvo[] = [];
  private authSubscription: Subscription | null = null;
  private addressesSubscription: Subscription | null = null;
  private userId: string | null = null;

  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private alertController: AlertController = inject(AlertController);
  private router: Router = inject(Router);

  constructor() {
  }
  
  ngOnInit() {
    // 1. Monitora o estado de autenticação
    this.authSubscription = user(this.auth).subscribe(firebaseUser => {
      if (firebaseUser) {
        this.userId = firebaseUser.uid;
        this.loadSavedAddresses();
      } else {
        this.savedAddresses = [];
      }
    });
  }

  ngOnDestroy() {
    // 3. Cancela as subscriptions para evitar vazamento de memória
    this.authSubscription?.unsubscribe();
    this.addressesSubscription?.unsubscribe();
  }

  /**
   * Configura o listener em tempo real para os endereços do usuário.
   */
  loadSavedAddresses() {
    if (!this.userId) return;

    // Cria uma referência à subcoleção específica do usuário logado
    // Coleção: users/{userId}/savedAddresses
    const addressesCollection = collection(this.firestore, `users/${this.userId}/savedAddresses`);
    
    // Converte a coleção em um Observable e monitora em tempo real (onSnapshot)
    this.addressesSubscription = (collectionData(addressesCollection, { idField: 'id' }) as any).subscribe({
      next: (addresses: EnderecoSalvo[]) => {
        this.savedAddresses = addresses;
        console.log('Endereços carregados:', this.savedAddresses);
      },
      error: (e: any) => {
        console.error('Erro ao carregar endereços:', e);
        // Em um aplicativo real, você trataria erros de permissão ou conexão aqui.
        this.presentAlert('Erro', 'Não foi possível carregar seus endereços.');
      }
    });
  }

  /**
   * Confirmação e exclusão de um endereço.
   * @param address O objeto endereço a ser excluído.
   */
  async confirmDelete(address: EnderecoSalvo) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Tem certeza que deseja remover o endereço ${address.logradouro}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Exclusão cancelada');
          },
        },
        {
          text: 'Excluir',
          cssClass: 'alert-danger',
          handler: () => {
            this.deleteAddress(address.id);
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Exclui um documento do Firestore.
   * @param addressId O ID do documento a ser excluído.
   */
  async deleteAddress(addressId: string) {
    if (!this.userId) return;
    
    try {
      // Cria a referência ao documento específico
      const docRef = doc(this.firestore, `users/${this.userId}/savedAddresses`, addressId);
      
      await deleteDoc(docRef);
      console.log('Endereço excluído com sucesso:', addressId);
      // A lista será atualizada automaticamente via onSnapshot
      
    } catch (e) {
      console.error('Erro ao excluir endereço:', e);
      this.presentAlert('Erro', 'Falha ao excluir o endereço.');
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