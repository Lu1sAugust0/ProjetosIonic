import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonInput, 
  IonButton, 
  IonLabel, 
  IonItem,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonBackButton,
  AlertController,
  IonSpinner
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
//  INCLUSÃO dos imports do Firebase e RxJS 
import { Auth, user } from '@angular/fire/auth'; 
import { Firestore, collection, addDoc } from '@angular/fire/firestore'; 
import { lastValueFrom, Subscription } from 'rxjs';

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
    IonInput,
    IonButton,
    IonLabel,
    IonItem,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonBackButton,
    IonSpinner
  ]
})

export class BuscarEnderecoPage implements OnInit, OnDestroy { 

  cep: string = '';
  endereco: any | null = null; // Alterado para 'any' para flexibilidade com o ViaCEP
  isLoading: boolean = false;
  
  private userId: string | null = null;
  private authSubscription: Subscription | null = null;
  
  private alertController: AlertController = inject(AlertController);
  private router: Router = inject(Router);
  // INJEÇÃO dos serviços Firebase
  private auth: Auth = inject(Auth); 
  private firestore: Firestore = inject(Firestore); 

  constructor() { }
  
  //  LÓGICA DE AUTENTICAÇÃO MOVIDA PARA ngOnInit  
  ngOnInit(): void {
    // Assina o Observable 'user' do AngularFire para obter o estado de autenticação uma vez
    this.authSubscription = user(this.auth).subscribe(firebaseUser => {
      if (firebaseUser) {
        // Armazena o UID do usuário no contexto da classe
        this.userId = firebaseUser.uid;
        console.log('User ID obtido corretamente no ngOnInit:', this.userId);
      } else {
        this.userId = null;
      }
    });
  }

  ngOnDestroy(): void {
    // Garante que a inscrição seja cancelada para evitar vazamentos de memória
    this.authSubscription?.unsubscribe();
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

  /**
    * Remove caracteres não numéricos do CEP.
    */
  formatCep() {
    this.cep = this.cep.replace(/\D/g, '');
  }

  /**
    * Busca o endereço na API do ViaCEP.
    */
  async searchCep() {
    this.endereco = null; // Limpa resultados anteriores
    this.formatCep();

    if (this.cep.length !== 8) {
      this.presentAlert('Atenção', 'O CEP deve ter 8 dígitos.');
      return;
    }

    this.isLoading = true;
    const url = `https://viacep.com.br/ws/${this.cep}/json/`;

    try {
      const response = await fetch(url);
      const data: any = await response.json();
      
      this.isLoading = false;

      if (data.erro) {
        this.presentAlert('Não Encontrado', 'CEP não encontrado ou inválido.');
        return;
      }

      this.endereco = data;
      console.log('Endereço encontrado:', this.endereco);

    } catch (error) {
      this.isLoading = false;
      console.error('Erro ao buscar CEP:', error);
      this.presentAlert('Erro de Conexão', 'Não foi possível buscar o endereço. Verifique sua conexão.');
    }
  }

  /**
    * Salva o endereço encontrado no Firestore.
    */
  async saveAddress() {
    if (!this.endereco) return;
    
    // MUDANÇA PRINCIPAL: Usamos o userId que foi pré-carregado no ngOnInit 
    if (!this.userId) {
      this.presentAlert('Erro de Autenticação', 'Você precisa estar logado para salvar endereços. Redirecionando...');
      this.router.navigateByUrl('/login');
      return;
    }

    try {
      const addressesCollection = collection(this.firestore, `users/${this.userId}/savedAddresses`);
      
      // Objeto a ser salvo (filtramos os dados do ViaCEP)
      const addressToSave = {
        cep: this.endereco.cep,
        logradouro: this.endereco.logradouro,
        bairro: this.endereco.bairro,
        localidade: this.endereco.localidade,
        uf: this.endereco.uf,
        savedAt: new Date() // Adiciona um timestamp de salvamento
      };

      await addDoc(addressesCollection, addressToSave);
      
      this.presentAlert('Sucesso!', 'Endereço salvo com sucesso! O endereço aparece na tela "Meus Endereços Salvos".');
      
      // Limpa a tela de busca para uma nova pesquisa
      this.endereco = null; 
      this.cep = '';

    } catch (e) {
      console.error('Erro ao salvar endereço:', e);
      // Se houver erro, geralmente é por causa das regras do Firestore
      this.presentAlert('Erro ao Salvar', 'Falha ao salvar o endereço. Verifique as regras de segurança do Firestore (Coleção: users/{userId}/savedAddresses).');
    }
  }
}