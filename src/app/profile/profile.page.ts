import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton,
  AlertController,
  IonInput, 
  IonNote,
  IonItemDivider
} from '@ionic/angular/standalone';
// Imports adicionais para autenticação e Firestore
import { Auth, user, signOut, updateProfile, updatePassword } from '@angular/fire/auth'; 
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore'; // <<< Adicionado updateDoc
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons, 
    IonBackButton, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonIcon,
    IonButton,
    IonInput,
    IonNote,
    IonItemDivider
  ]
})
export class ProfilePage implements OnInit, OnDestroy {
  
  // Propriedades para exibir os dados do usuário
  userEmail: string | null = null;
  currentUserName: string = 'Carregando...'; 
  
  // Variáveis para edição
  newUserName: string = ''; 
  newPassword = ''; // Campo para a nova senha
  confirmPassword = ''; // Campo para confirmação
  
  // Estado para controlar o modo de edição
  isEditing: boolean = false;
  
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore); 
  private router: Router = inject(Router);
  private alertController: AlertController = inject(AlertController);
  private authSubscription: Subscription | null = null;

  constructor() { }

  ngOnInit() {
    // Monitora o estado de autenticação para carregar os dados
    this.authSubscription = user(this.auth).subscribe(firebaseUser => {
      if (firebaseUser) {
        this.userEmail = firebaseUser.email;
        this.currentUserName = firebaseUser.displayName || 'Usuário Sem Nome';
        this.newUserName = this.currentUserName;
        
        // Se o displayName estiver vazio, busca o nome no Firestore
        if (this.currentUserName === 'Usuário Sem Nome') {
          this.loadNameFromFirestore(firebaseUser.uid);
        } else {
          console.log('Nome carregado do Auth:', this.currentUserName);
        }
      } else {
        // Se deslogado, redireciona (embora o AuthGuard já deva fazer isso)
        this.router.navigateByUrl('/login');
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }
  
  /**
   * Busca o nome do usuário na coleção 'users' no Firestore.
   */
  private async loadNameFromFirestore(uid: string) {
    const docRef = doc(this.firestore, 'users', uid);
    
    try {
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData && userData['name']) {
          this.currentUserName = userData['name'];
          this.newUserName = this.currentUserName;
          this.updateAuthDisplayName(userData['name']);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar nome no Firestore:', e);
    }
  }

  /**
   * Atualiza o displayName no Firebase Auth.
   */
  private async updateAuthDisplayName(name: string) {
    const firebaseUser = this.auth.currentUser;
    if (firebaseUser && firebaseUser.displayName !== name) {
      try {
        await updateProfile(firebaseUser, { displayName: name });
        console.log('displayName do Auth sincronizado com o Firestore.');
      } catch (e) {
        console.warn('Falha ao sincronizar displayName do Auth:', e);
      }
    }
  }

  /**
   * Função que alterna o modo de edição.
   */
  toggleEditMode() {
    this.isEditing = !this.isEditing;
    // Se sair do modo de edição, reseta os campos de senha
    if (!this.isEditing) {
      this.newPassword = '';
      this.confirmPassword = '';
      this.newUserName = this.currentUserName; // Volta para o nome atual
    }
  }
  
  /**
   * Atualiza o nome de exibição do usuário no Firebase Auth E NO FIRESTORE.
   */
  async updateUserName() {
    const firebaseUser = this.auth.currentUser;
    const trimmedName = this.newUserName.trim();
    
    if (!firebaseUser || !trimmedName) {
      this.presentAlert('Erro', 'Nome inválido ou usuário não logado.');
      return;
    }
    
    if (trimmedName === this.currentUserName) {
      this.presentAlert('Atenção', 'O nome inserido é o mesmo que o atual.');
      return;
    }

    try {
      // 1. Atualiza o displayName no Firebase Auth
      await updateProfile(firebaseUser, { displayName: trimmedName });
      
      // 2. NOVO: Atualiza o campo 'name' no documento do Firestore (/users/{userId})
      const userDocRef = doc(this.firestore, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, {
        name: trimmedName // Atualiza o campo 'name' no Firestore
      });
      
      this.currentUserName = trimmedName;
      this.newUserName = trimmedName;
      
      this.presentAlert('Sucesso', 'Nome de usuário atualizado com sucesso no Auth e no Firestore!');
      
    } catch (e: any) {
      console.error('Erro ao atualizar nome:', e);
      this.presentAlert('Erro', `Falha ao atualizar o nome: ${e.message}`);
    }
  }

  /**
   * Atualiza a senha do usuário logado diretamente.
   */
  async updatePasswordInPlace() {
    const firebaseUser = this.auth.currentUser;
    
    if (!firebaseUser) {
      this.presentAlert('Erro', 'Usuário não logado.');
      return;
    }

    if (!this.newPassword || !this.confirmPassword) {
      this.presentAlert('Atenção', 'Por favor, preencha os campos de senha e confirmação.');
      return;
    }
    
    if (this.newPassword !== this.confirmPassword) {
      this.presentAlert('Atenção', 'A nova senha e a confirmação não coincidem.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.presentAlert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    try {
      // O updatePassword exige que o usuário tenha feito login recentemente (reautenticação)
      await updatePassword(firebaseUser, this.newPassword);
      
      this.presentAlert(
        'Sucesso', 
        'Senha alterada com sucesso! Você pode precisar fazer login novamente.'
      );
      
      // Limpa os campos após o sucesso
      this.newPassword = '';
      this.confirmPassword = '';
      
    } catch (e: any) {
      console.error('Erro ao alterar senha:', e);
      let errorMessage = 'Falha ao alterar a senha.';

      // Tratar o erro de reautenticação mais comum
      if (e.code === 'auth/requires-recent-login') {
        errorMessage = 'Você deve ter feito login recentemente para alterar a senha. Por favor, saia e faça login novamente para reautenticar-se.';
      } else {
        errorMessage += ` (Detalhe: ${e.message})`;
      }

      this.presentAlert('Erro', errorMessage);
    }
  }

  /**
   * Realiza o Logout do usuário. (Função existente)
   */
  async logout() {
    try {
      await signOut(this.auth);
      this.presentAlert('Sessão Encerrada', 'Você foi desconectado com sucesso.', () => {
        // Navega para a tela de login após o logout ser concluído
        this.router.navigateByUrl('/login');
      });
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
      this.presentAlert('Erro', 'Não foi possível desconectar. Tente novamente.');
    }
  }

  /**
   * Função auxiliar para exibir alertas.
   */
  async presentAlert(header: string, message: string, handler?: () => void) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: [
        {
          text: 'OK',
          handler: handler, // Chama o handler (navegação) se fornecido
        },
      ],
    });
    await alert.present();
  }
}