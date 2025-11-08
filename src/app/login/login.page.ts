import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Importante para o two-way binding
// Importação de controladores para UI
import { IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonButton, IonLabel, IonItem, AlertController, LoadingController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

// Importa os módulos e funções de autenticação do AngularFire
import { Auth, signInWithEmailAndPassword, sendPasswordResetEmail } from '@angular/fire/auth'; // 👈 NOVO: sendPasswordResetEmail

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  // Importe todos os componentes Ionic usados no template, e o FormsModule!
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonInput, 
    IonButton, 
    IonLabel, 
    IonItem
  ]
})
export class LoginPage {

  email = '';
  password = '';

  // Injeção dos serviços
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);
  // Injeção de controladores para feedback ao usuário
  private alertController: AlertController = inject(AlertController); // 👈 NOVO
  private loadingController: LoadingController = inject(LoadingController); // 👈 NOVO

  constructor() { }
  
  /**
   * Função auxiliar para exibir alertas.
   */
  private async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Lógica de Login do Usuário.
   */
  async loginUser() {
    if (!this.email || !this.password) {
      await this.presentAlert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }
    
    const loading = await this.loadingController.create({
      message: 'Entrando...'
    });
    await loading.present();

    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, this.email, this.password);
      
      console.log('Login efetuado com sucesso:', userCredential.user);
      
      // Sucesso: Redireciona para a página principal
      this.router.navigateByUrl('/home', { replaceUrl: true }); 

    } catch (error: any) {
      console.error('Erro no login:', error.code, error.message);
      
      let errorMessage = 'Ocorreu um erro. Verifique seu e-mail e senha.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Nenhum usuário encontrado com este e-mail.';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Senha inválida ou credenciais incorretas.';
      }

      await this.presentAlert('Falha no Login', errorMessage);

    } finally {
      await loading.dismiss();
    }
  }
  
  /**
   * NOVO: Envia um e-mail de redefinição de senha para o e-mail fornecido.
   */
  async forgotPassword() {
    if (!this.email) {
      await this.presentAlert('Atenção', 'Por favor, digite seu e-mail no campo acima antes de solicitar a recuperação.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Enviando e-mail de redefinição...'
    });
    await loading.present();

    try {
      // Usa a função do Firebase para enviar o e-mail de recuperação
      await sendPasswordResetEmail(this.auth, this.email);

      await this.presentAlert(
        'E-mail Enviado',
        `Um link de redefinição de senha foi enviado para o e-mail **${this.email}**. Verifique sua caixa de spam se não encontrar.`
      );
    } catch (error: any) {
      console.error('Erro ao enviar e-mail de recuperação:', error);

      let errorMessage = 'Ocorreu um erro ao tentar enviar o e-mail. Verifique se o endereço é válido e tente novamente.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Nenhum usuário cadastrado com este e-mail.';
      } else if (error.code === 'auth/invalid-email') {
         errorMessage = 'O formato do e-mail é inválido.';
      }

      await this.presentAlert('Falha na Recuperação', errorMessage);
      
    } finally {
      await loading.dismiss();
    }
  }
}