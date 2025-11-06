import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Importante para o two-way binding
import { IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonButton, IonLabel, IonItem } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

// Importa os módulos e funções de autenticação do AngularFire
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  // 💡 Importe todos os componentes Ionic usados no template, e o FormsModule!
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

  constructor() { }

  async loginUser() {
    try {
      if (!this.email || !this.password) {
        // TODO: Mostrar erro: Campos vazios
        return;
      }
      
      const userCredential = await signInWithEmailAndPassword(this.auth, this.email, this.password);
      
      console.log('Login efetuado com sucesso:', userCredential.user);
      
      // 🚀 Sucesso: Redireciona para a página principal
      this.router.navigateByUrl('/home', { replaceUrl: true }); 

    } catch (error: any) {
      console.error('Erro no login:', error.code, error.message);
      // TODO: Mostrar uma mensagem de erro amigável (ex: 'E-mail ou senha inválidos')
    }
  }
}