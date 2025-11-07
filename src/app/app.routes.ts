import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard'; // 1. Importação do Guardião

export const routes: Routes = [
  // Rota de Login (Acessível a todos)
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  // Rota de Cadastro (Acessível a todos)
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage)
  },
  
  // Rota Protegida: Home Page
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [authGuard] // 2. Aplicação do Guardião
  },
  
  // NOVAS ROTAS PROTEGIDAS (Adicionamos aqui para que a Home Page carregue)
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage),
    canActivate: [authGuard]
  },
  {
    path: 'buscar-endereco',
    loadComponent: () => import('./buscar-endereco/buscar-endereco.page').then(m => m.BuscarEnderecoPage),
    canActivate: [authGuard]
  },
  {
    path: 'enderecos-salvos',
    loadComponent: () => import('./enderecos-salvos/enderecos-salvos.page').then(m => m.EnderecosSalvosPage),
    canActivate: [authGuard]
  },
  
  // Rota padrão: redireciona para login (garante que a Home Page não seja o primeiro destino)
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];