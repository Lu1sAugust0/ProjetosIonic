import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
// 🛑 CORRIGIDO: Importação do IonicRouteStrategy deve ser de '/standalone'
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone'; 

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// ❗ Opcional: Adicionar importação do HttpClientModule se você for usá-lo em outros serviços ou componentes.
import { HttpClientModule } from '@angular/common/http'; 


if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    // 1. Provedor de Estratégia de Roteamento (Ionic)
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    
    // 2. Provedor de Inicialização do Ionic 
    provideIonicAngular({
      // Adicione configurações globais aqui, se necessário
    }),

    // 3. Provedor de Roteamento Principal
    provideRouter(routes),

    // 4. Módulos Legados/Gerais: HttpClientModule (Usado para a API de Receitas)
    // ❗ MANTENDO DESCOMENTADO, pois você provavelmente está usando para as receitas
    importProvidersFrom(HttpClientModule),

    // 🛑 REMOVIDOS E COMENTADOS:
    // Não precisamos de provideFirebaseApp/provideAuth aqui, 
    // pois a inicialização é feita no auth.service.ts.
    // Isso evita o conflito e a necessidade do environment.firebase.
    // O auth.service.ts já fará o getAuth() após o initializeApp() interno.

  ],
}).catch(err => console.error(err));