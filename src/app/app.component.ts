import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importa o Router e o RouterLink para navegação e uso no template
import { Router, RouterLink } from '@angular/router'; 
import { 
  MenuController, // Service para controlar o menu
  IonMenu, 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonMenuToggle,
  IonIcon,
  IonLabel,
  IonButtons, 
  IonMenuButton,
  IonRouterOutlet // Componente essencial que hospeda as páginas
} from '@ionic/angular/standalone'; 

import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  
  // Define o componente como Standalone
  standalone: true, 
  imports: [
    CommonModule, 
    // Módulos do Router para links no menu
    RouterLink, 
    // Lista completa de componentes Ionic usados no template app.component.html
    IonRouterOutlet, 
    IonMenu, 
    IonHeader, 
    IonToolbar, 
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonMenuToggle,
    IonIcon,
    IonLabel,
    IonButtons,
    IonMenuButton
  ], 
})
export class AppComponent {
  
  // Injeção de dependências no construtor
  constructor(
    private authService: AuthService, 
    private router: Router,
    private menu: MenuController // Service para manipular o menu lateral
  ) {
    // Lógica de inicialização pode ir aqui, se necessário.
  }

  /**
   * Navega para a página de perfil ('/profile') e fecha o menu lateral.
   */
  async navigateToProfile() {
    // 1. Fecha o menu lateral
    await this.menu.close();
    // 2. Navega para a rota de perfil
    this.router.navigateByUrl('/profile'); 
  }

  /**
   * Executa o processo de logout:
   * 1. Fecha o menu lateral.
   * 2. Chama o método de logout do AuthService (que retorna um Observable).
   * 3. Em caso de sucesso, redireciona o usuário para a tela de autenticação.
   */
  async logout() {
    // 1. Fecha o menu lateral
    await this.menu.close();

    // 2. Chama o logout do service e lida com o resultado
    this.authService.logout().subscribe({
      next: () => {
        // Sucesso: Redireciona para a rota de autenticação (trocando a URL no histórico)
        this.router.navigateByUrl('/auth', { replaceUrl: true }); 
        console.log('Usuário deslogado com sucesso.');
      },
      error: (e) => {
        console.error('Erro ao fazer logout:', e);
        // Em um app real, você mostraria um Toast ou Alert aqui
      }
    });
  }
}