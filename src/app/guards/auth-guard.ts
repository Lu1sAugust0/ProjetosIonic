import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
// Removemos importações de rxjs (map, take)

/**
 * Auth Guard Funcional (CanActivateFn)
 *
 * Esta função usa uma Promessa para garantir que o Angular espere pela 
 * resolução do estado do Firebase (logado ou não) antes de ativar a rota.
 * Isso resolve problemas de timing (race conditions) comuns com take(1).
 */
export const authGuard: CanActivateFn = (): Promise<boolean | UrlTree> => {
  // Injeta o AuthService e o Router
  const authService = inject(AuthService);
  const router = inject(Router);

  // Retorna uma nova Promessa que encapsula o onAuthStateChanged do Firebase.
  return new Promise((resolve) => {
    // Escutamos o estado de autenticação UMA VEZ.
    const unsubscribe = authService.getAuthInstance().onAuthStateChanged(user => {
      // 1. Paramos de escutar imediatamente após receber o primeiro estado
      unsubscribe(); 

      // 2. DEBUG: Para ver exatamente o que o Guard está recebendo
      console.log('Guard [Auth Check - PROMISE]: Usuário recebido:', user ? user.uid : 'NULO');

      if (user) {
        // Se logado: Resolve para 'true', permitindo a navegação.
        resolve(true);
      } else {
        // Se deslogado: Resolve para 'UrlTree', redirecionando para a autenticação.
        console.log('Guard [Redirecionamento]: Acesso negado, redirecionando para /auth');
        resolve(router.createUrlTree(['/auth']));
      }
    });
  });
};