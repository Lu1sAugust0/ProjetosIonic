import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard'; 

export const routes: Routes = [
  // Rotas Protegidas
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [authGuard] 
  },

  {
    // Rota para a página de detalhes. O :id é o parâmetro da receita.
    path: 'receita/:id',
    loadComponent: () => import('./recipe-detail/recipe-detail.page').then(m => m.RecipeDetailPage)
  },
  
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage),
    canActivate: [authGuard]
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about.page').then(m => m.AboutPage),
    canActivate: [authGuard]
  },

  {
    path: 'recipe-detail',
    loadComponent: () => import('./recipe-detail/recipe-detail.page').then( m => m.RecipeDetailPage)
  },
  // Rota de Autenticação
  {
    path: 'auth',
    loadComponent: () => import('./auth/auth.page').then(m => m.AuthPage)
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
];