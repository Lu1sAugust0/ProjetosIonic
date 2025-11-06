// src/app/home/home.page.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Adicionado Router e RouterModule
import { Firestore, doc, getDoc } from '@angular/fire/firestore'; // Importe Firestore
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonList, 
  IonItem, 
  IonIcon, 
  IonLabel, 
  IonMenu,         // Componente do menu lateral
  IonMenuButton,    // Botão que abre o menu
  IonButtons,
  IonCard,          // Componente de Card/Container
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular/standalone';

// Importa a função de logout do Firebase
import { Auth, signOut, user } from '@angular/fire/auth'; 

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButton, 
    IonList, 
    IonItem, 
    IonIcon, 
    IonLabel, 
    IonMenu, 
    IonMenuButton, 
    IonButtons,
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent
  ],
})


export class HomePage implements OnInit {

  userName: string = 'Usuário'; // Variável para armazenar o nome

  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);
  private firestore: Firestore = inject(Firestore);

  // Redireciona para a tela de Perfil
  goToProfile() {
    this.router.navigateByUrl('/profile');
  }

  // Função para fazer o Logout
  async logout() {
    try {
      await signOut(this.auth);
      
      console.log('Usuário deslogado com sucesso!');
      
      // Redireciona para a tela de Login
      this.router.navigateByUrl('/login', { replaceUrl: true });

    } catch (e) {
      console.error('Erro ao deslogar:', e);
      // Aqui você pode adicionar um alerta para o usuário
    }
  }

  ngOnInit() {
    this.loadUserName();
  }
  async loadUserName() {
    // Escuta o estado de autenticação para pegar o usuário logado
    user(this.auth).subscribe(async (currentUser) => {
      if (currentUser) {
        const userId = currentUser.uid;
        const userDocRef = doc(this.firestore, 'users', userId);

        try {
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            // Se o documento existe, atualiza o nome
            const userData = docSnap.data();
            this.userName = userData['name'] || 'Usuário'; // Usa o nome ou fallback
          } else {
            console.warn('Documento do usuário não encontrado no Firestore.');
          }
        } catch (e) {
          console.error('Erro ao carregar nome do usuário:', e);
        }
      } else {
        // Se não estiver logado, o Guard deveria ter impedido o acesso, mas garantimos o fallback
        this.userName = 'Visitante';
      }
    });
  }
}