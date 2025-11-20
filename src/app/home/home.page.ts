import { Component, OnInit, inject, OnDestroy } from '@angular/core'; // 💡 OnDestroy adicionado
import { IonicModule, InfiniteScrollCustomEvent } from '@ionic/angular';
import {
  IonButtons, 
  IonMenuButton, 
  IonSearchbar 
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http'; 
// 💡 Imports RxJS movidos para a linha correta e adicionado pipe
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs'; // 💡 Subject e Subscription

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, 
    IonButtons, 
    IonMenuButton, 
    IonSearchbar 
  ], 
})
// 💡 Implementa OnDestroy
export class HomePage implements OnInit, OnDestroy { 
  
  public meals: any[] = []; 
  public isLoading: boolean = false;
  public searchTerm: string = '';
  
  private http = inject(HttpClient); 
  
  // 💡 NOVO: Subject para lidar com o fluxo de pesquisa assíncrona
  private searchSubject = new Subject<string>(); 
  // 💡 NOVO: Variável para armazenar a subscrição e fazer o unsubscribe
  private searchSubscription: Subscription | undefined; 
  
  public searchTerms: string[] = ['chicken', 'beef', 'pasta', 'fish', 'dessert', 'salad'];
  public currentSearchIndex: number = 0; 
  private readonly BASE_API_URL = 'https://www.themealdb.com/api/json/v1/1/search.php?s=';

  constructor() {} 

  ngOnInit() {
    this.setupSearchDebounce(); // 💡 Inicializa o debounce
    this.loadData();
  }

  // 💡 NOVO MÉTODO: Configura o fluxo de debounce
  setupSearchDebounce() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400), // Espera 400ms para o usuário parar de digitar
      distinctUntilChanged() // Ignora se o termo digitado for o mesmo que o anterior
    ).subscribe((query) => {
      this.executeSearch(query); // Chama a função de busca real
    });
  }

  /**
   * 💡 ATUALIZADO: Apenas envia o valor digitado para o Subject
   */
  handleSearch(event: any) {
    const query = event.target.value.toLowerCase().trim();
    this.searchSubject.next(query); // Envia o valor para o Subject
  }

  /**
   * 💡 NOVO MÉTODO: Lógica de busca centralizada (chamada pelo debounce)
   */
  executeSearch(query: string) {
    if (query === '') {
      this.searchTerm = '';
      this.meals = []; 
      this.currentSearchIndex = 0; 
      this.loadData();
    } else {
      this.searchTerm = query;
      this.meals = []; 
      this.currentSearchIndex = this.searchTerms.length; 
      this.loadData(undefined, query); 
    }
  }

  /**
   * 💡 NOVO: Implementação para limpar a subscrição ao sair do componente (evita memory leak)
   */
  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  /**
   * Função principal para buscar e carregar receitas da API.
   * Não alterada, mas agora chamada por executeSearch()
   */
  loadData(event?: InfiniteScrollCustomEvent, specificTerm?: string) {
    
    let currentTerm: string;
    let isSpecificSearch = !!specificTerm;
    
    if (isSpecificSearch) {
      currentTerm = specificTerm!;
    } else {
      if (this.currentSearchIndex >= this.searchTerms.length) {
          if (event) {
              event.target.complete();
              event.target.disabled = true;
          }
          return;
      }
      currentTerm = this.searchTerms[this.currentSearchIndex];
    }
    
    if (this.isLoading) {
      if (event) event.target.complete();
      return;
    }
    
    this.isLoading = true;
    const url = `${this.BASE_API_URL}${currentTerm}`;
    
    this.http.get<any>(url)
        .pipe(
            finalize(() => {
                this.isLoading = false;
                if (event) {
                    event.target.complete();
                }
            })
        )
        .subscribe({
            next: (data) => {
                if (data.meals) {
                    this.meals = [...this.meals, ...data.meals]; 
                }
                
                if (!isSpecificSearch) {
                    this.currentSearchIndex++;
                }
            },
            error: (err) => {
                console.error('Erro ao buscar receitas:', err);
                if (!isSpecificSearch) {
                    this.currentSearchIndex++; 
                }
            }
        });
  }
}