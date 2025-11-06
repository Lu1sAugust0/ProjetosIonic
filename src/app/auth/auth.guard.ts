import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map } from 'rxjs/operators';

// O Guardião usa o stream 'user' do AngularFire para reagir ao estado de autenticação em tempo real
export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    map(firebaseUser => {
      // Se houver um usuário logado (firebaseUser não é null), permite o acesso (true)
      if (firebaseUser) {
        console.log('Auth Guard: Usuário autenticado. Permite acesso a rota protegida.');
        return true;
      }

      // Se NÃO houver usuário, bloqueia e redireciona para a página de login
      console.log('Auth Guard: Usuário NÃO autenticado. Redirecionando para /login.');
      return router.createUrlTree(['/login']);
    })
  );
};