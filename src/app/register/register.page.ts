import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  AlertController, // Importamos para mostrar mensagens
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

import { Firestore, doc, setDoc } from '@angular/fire/firestore';
// Importa a função de criação de usuário do AngularFire
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
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
    IonItem,
    IonButtons,
    IonBackButton
  ]
})
export class RegisterPage {

  name = '';
  email = '';
  password = '';
  passwordConfirm = ''; // 💡 VARIÁVEL ADICIONADA PARA O CAMPO DE CONFIRMAÇÃO

  // Injeção dos serviços
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);
  private alertController: AlertController = inject(AlertController); // Serviço de Alerta
  private firestore: Firestore = inject(Firestore);

  constructor() { }

  /**
   * Função auxiliar para exibir alertas ao usuário.
   * @param header Título do alerta.
   * @param message Mensagem de erro ou sucesso.
   */
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async registerUser() {
    // 1. Validação Simples de Campos Vazios
    if (!this.email || !this.password || !this.passwordConfirm || !this.name) {
      this.presentAlert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    // 2. Validação de Confirmação de Senha
    if (this.password !== this.passwordConfirm) {
      this.presentAlert('Erro', 'As senhas digitadas não conferem.');
      return;
    }

    // 3. Validação de Senha Fraca (Firebase exige mínimo de 6 caracteres)
    if (this.password.length < 6) {
      this.presentAlert('Erro', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    
    try {
      // 🚀 Chamada para criar o usuário no Firebase
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        this.email, 
        this.password
      );


      // 🌟 NOVO: SALVANDO O NOME NO FIRESTORE 🌟
      const userId = userCredential.user.uid;
      const userDocRef = doc(this.firestore, 'users', userId); // Ref para o documento 'users/UID_DO_USUARIO'
      
      await setDoc(userDocRef, {
        name: this.name,
        email: this.email,
        createdAt: new Date()
        // Você pode adicionar mais campos aqui, como telefone, etc.
      });
      
      console.log('Usuário registrado com sucesso!', userCredential.user);
      
      this.presentAlert('Sucesso!', 'Seu cadastro foi realizado com sucesso!');
      
      // Sucesso: Redireciona para a página principal
      this.router.navigateByUrl('/home', { replaceUrl: true }); 

    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro desconhecido durante o cadastro.';
      
      // Tradução de erros comuns do Firebase para o usuário
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este e-mail já está em uso. Tente fazer login.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'O formato do e-mail é inválido.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'O cadastro por e-mail/senha não está habilitado no Firebase.';
          break;
      }

      console.error('Erro no cadastro:', error.code, error.message);
      this.presentAlert('Falha no Cadastro', errorMessage);
    }
  }
}