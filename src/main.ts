import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';

// Importações do Angular/HTTP para a correção
import { provideHttpClient } from '@angular/common/http'; // 👈 Importação NECESSÁRIA

// Importações do Ionic/Angular
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes'; // As suas rotas
import { AppComponent } from './app/app.component'; // Seu componente raiz
import { provideIonicAngular } from '@ionic/angular/standalone';

// Importação do arquivo de configuração na pasta 'auth'
import { FIREBASE_CREDENTIALS } from './app/auth/auth.config'; 

// Importações do Firebase
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    // Providers base do Ionic e Roteamento
    provideIonicAngular(),
    provideRouter(routes),

    // 🌟🌟 SOLUÇÃO: Adiciona o provedor para requisições HTTP 🌟🌟
    provideHttpClient(), 

    // 1. Inicializa o App Firebase
    provideFirebaseApp(() => initializeApp(FIREBASE_CREDENTIALS)), 

    // 2. Habilita o Serviço de Autenticação (Auth)
    provideAuth(() => getAuth()),

    provideFirestore(() => getFirestore()),
    
    // Se for usar Storage:
    //provideStorage(() => getStorage()),

  ],
}).catch(err => console.error(err));