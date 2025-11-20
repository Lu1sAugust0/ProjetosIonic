import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonLabel, 
  IonIcon,
  IonButtons,
  AlertController,
  // 💡 ADICIONADO: ToastController e LoadingController para feedback visual
  ToastController, 
  LoadingController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  createOutline, 
  personCircleOutline, 
  mailOutline, 
  lockClosedOutline,
  arrowBackOutline,
  logOutOutline, 
  trashOutline, 
  cameraOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service'; 

// Adicionando os ícones que serão usados
addIcons({ createOutline, personCircleOutline, mailOutline, lockClosedOutline, arrowBackOutline, logOutOutline, trashOutline, cameraOutline });

interface UserData {
  name: string;
  email: string;
  photoURL: string | null | undefined; 
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonLabel, IonIcon,
    IonButtons
  ]
})
export class ProfilePage implements OnInit {
  private authService = inject(AuthService);
  private storageService = inject(StorageService); 
  private alertController = inject(AlertController);
  // 💡 NOVO: Injeção dos controladores de feedback
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  
  private router = inject(Router);
  
  public user: UserData = {
    name: 'Carregando...',
    email: 'Carregando...',
    photoURL: undefined
  };

  ngOnInit() {
    this.loadUserProfile();
  }

  // --- Funções de Navegação e Perfil ---

  /**
   * Navega para a página principal (Home).
   */
  goHome() {
    this.router.navigateByUrl('/home');
  }

  loadUserProfile() {
    const firebaseUser = this.authService.getCurrentUser(); 
    
    if (firebaseUser) {
      this.user.name = firebaseUser.displayName || 'Utilizador Sem Nome';
      this.user.email = firebaseUser.email || 'Email Indisponível';
      this.user.photoURL = firebaseUser.photoURL; 
    } else {
      this.user.name = 'Erro ao Carregar';
      this.user.email = 'Erro ao Carregar';
      this.user.photoURL = undefined;
    }
  }

  // --- Lógica de Upload de Imagem ---

  /**
   * Chamado quando o usuário seleciona um arquivo através do input file.
   * @param event O evento de mudança do input file.
   */
  handleFileInput(event: any) {
    const file = event.target.files[0] as File;
    if (file) {
      this.uploadProfilePicture(file);
    }
    // 💡 ATUALIZADO: Limpa o valor do input file para permitir selecionar o mesmo arquivo novamente
    event.target.value = null; 
  }

  /**
   * Inicia o processo de upload da imagem e atualização do perfil.
   * @param file O arquivo de imagem selecionado.
   */
  private async uploadProfilePicture(file: File) {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.presentToast('Erro: Nenhum utilizador logado.', 'danger'); // 💡 ATUALIZADO
      return;
    }

    // 1. Apresenta o loading
    const loading = await this.loadingController.create({
      message: 'Aguarde, carregando imagem...',
      spinner: 'crescent'
    });
    await loading.present();

    const path = 'profile_images';
    const filename = user.uid;

    try {
        // Tenta fazer o upload
        const downloadURL = await this.storageService.uploadFile(file, path, filename);
        
        // 2. Atualiza a foto de perfil no Firebase Auth. 
        await this.authService.updateUserPhoto(downloadURL);
        
        // 3. Atualiza a variável local e notifica o usuário
        this.user.photoURL = this.authService.getCurrentUser()?.photoURL;
        await this.presentToast('Foto de perfil atualizada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro no upload ou na atualização do perfil:', error);
        await this.presentToast('Erro ao atualizar a foto. Tente novamente.', 'danger');
    } finally {
        // 4. Fecha o loading
        await loading.dismiss();
    }
  }

  // --- Lógica de Logout ---

  /**
   * Efetua o logout do utilizador e redireciona para a página de autenticação.
   */
  logout() {
    this.authService.logout().subscribe({
      next: () => {
        // Redireciona para a tela de autenticação após o logout
        this.router.navigateByUrl('/auth', { replaceUrl: true }); 
      },
      error: (err) => {
        console.error('Erro durante o logout:', err);
        this.presentToast('Erro ao sair. Tente novamente.', 'danger'); // 💡 ATUALIZADO
      }
    });
  }

  // --- Lógica de Exclusão de Conta ---

  /**
   * Apresenta um alerta de confirmação antes de excluir a conta.
   */
  async confirmDeleteAccount() {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: 'ATENÇÃO: Esta ação é irreversível. Tem certeza que deseja excluir sua conta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.deleteAccount();
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Exclui a conta do utilizador chamando o service.
   */
  private deleteAccount() {
    const user = this.authService.getCurrentUser();
    if (!user) {
        this.presentToast('Nenhum utilizador logado para excluir.', 'warning'); // 💡 ATUALIZADO
        return;
    }

    this.authService.deleteAccount(user)
        .then(() => {
            this.presentToast('Conta excluída com sucesso! Redirecionando...', 'success'); // 💡 ATUALIZADO
            this.router.navigateByUrl('/auth');
        })
        .catch((error) => {
            console.error('Erro ao excluir conta:', error);
            let errorMessage = 'Erro ao excluir conta. Tente fazer login novamente e exclua.';
            
            if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Por favor, faça logout, login novamente e tente excluir a conta.';
            }

            this.presentToast(errorMessage, 'danger'); // 💡 ATUALIZADO
        });
  }
  
  // --- Funções Auxiliares (com chamadas de feedback atualizadas) ---

  /**
   * Abre um alerta para editar o nome do utilizador.
   */
  async editName() {
    const alert = await this.alertController.create({
      header: 'Editar Nome',
      inputs: [
        {
          name: 'newName',
          type: 'text',
          placeholder: 'Novo nome',
          value: this.user.name,
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar',
          handler: (data) => {
            if (data.newName && data.newName.trim() !== '') {
              this.updateName(data.newName.trim());
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Abre um alerta para iniciar a alteração de senha (envio de link).
   */
  async editPassword() {
    const alert = await this.alertController.create({
      header: 'Alterar Senha',
      message: 'Será enviado um link de redefinição para seu email cadastrado.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar Link',
          handler: () => {
            this.sendPasswordResetEmail(this.user.email);
          }
        }
      ]
    });
    await alert.present();
  }

  private updateName(newName: string) {
    this.authService.updateUserName(newName)
      .then(() => {
        this.user.name = newName;
        this.presentToast('Nome atualizado com sucesso!', 'success'); // 💡 ATUALIZADO
      })
      .catch(error => {
        console.error('Erro ao atualizar nome:', error);
        this.presentToast('Erro ao atualizar nome.', 'danger'); // 💡 ATUALIZADO
      });
  }

  private sendPasswordResetEmail(email: string) {
    this.authService.sendPasswordReset(email)
      .then(() => {
        this.presentToast('Link de redefinição de senha enviado com sucesso para o seu email.', 'success'); // 💡 ATUALIZADO
      })
      .catch(error => {
        console.error('Erro ao enviar link de redefinição:', error);
        this.presentToast('Erro ao enviar link. Tente novamente mais tarde.', 'danger'); // 💡 ATUALIZADO
      });
  }

  // 💡 NOVO: Função para exibir Toast de forma consistente (substitui console.log)
  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }
}