import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'; // 💡 NOVO IMPORT

import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { HttpClient } from '@angular/common/http';

import { finalize } from 'rxjs/operators';



@Component({

  selector: 'app-recipe-detail',

  templateUrl: './recipe-detail.page.html',

  styleUrls: ['./recipe-detail.page.scss'],

  standalone: true,

  imports: [IonicModule, CommonModule, RouterModule]

})

export class RecipeDetailPage implements OnInit {

 

  public mealId: string | null = null;

  public recipe: any = null;

  public isLoading: boolean = true;

  public ingredients: { name: string, measure: string }[] = [];

  public instructionSteps: string[] = []; // Array para armazenar os passos do modo de preparo (para o novo design)



  private route = inject(ActivatedRoute);

  private http = inject(HttpClient);

  private router = inject(Router);



  // Endpoint para buscar detalhes de uma receita por ID

  private readonly DETAIL_API_URL = 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=';



  constructor() { }



  ngOnInit() {

    this.mealId = this.route.snapshot.paramMap.get('id');

    if (this.mealId) {

      this.loadRecipeDetails();

    } else {

      // Se não houver ID, retorna para a home

      this.router.navigateByUrl('/home');

    }

  }

 

  loadRecipeDetails() {

    this.isLoading = true;

    const url = `${this.DETAIL_API_URL}${this.mealId}`;



    this.http.get<any>(url)

      .pipe(

        finalize(() => {

          this.isLoading = false;

        })

      )

      .subscribe({

        next: (data) => {

          if (data.meals && data.meals.length > 0) {

            this.recipe = data.meals[0];

            this.extractIngredients();

            this.extractInstructions();

          } else {

            console.warn('Receita não encontrada.');

            this.recipe = null;

          }

        },

        error: (err) => {

          console.error('Erro ao buscar detalhes da receita:', err);

          this.recipe = null;

        }

      });

  }



  /**

   * Extrai e formata as instruções em uma lista de passos, dividindo pelo salto de linha.

   */

  extractInstructions() {

    if (!this.recipe || !this.recipe.strInstructions) {

        this.instructionSteps = [];

        return;

    }



    // Divide as instruções por quebras de linha (CRLF ou LF) e remove passos vazios

    this.instructionSteps = this.recipe.strInstructions

        .split(/[\r\n]+/)

        .map((step: string) => step.trim())

        .filter((step: string) => step.length > 0);

  }



  /**

   * Extrai ingredientes e medidas do objeto da API.

   */

  extractIngredients() {

    if (!this.recipe) return;



    this.ingredients = [];

    for (let i = 1; i <= 20; i++) {

      const ingredient = this.recipe[`strIngredient${i}`];

      const measure = this.recipe[`strMeasure${i}`];

     

      if (ingredient && ingredient.trim() !== '') {

        this.ingredients.push({

          name: ingredient,

          measure: measure?.trim() || ''

        });

      }

    }

  }

 

/**
 * MÉTODO DE SALVAR: Formata a receita e salva o arquivo .txt no dispositivo
 * usando o Capacitor Filesystem.
 */
async saveRecipeAsFile() {
  if (!this.recipe) {
    console.warn('Nenhuma receita carregada para salvar.');
    return;
  }

  // 1. Formata o conteúdo do arquivo (Mantido igual)
  let fileContent = `## Receita: ${this.recipe.strMeal}\n\n`;
  fileContent += `### Categoria: ${this.recipe.strCategory}\n`;
  fileContent += `### Origem: ${this.recipe.strArea}\n\n`;

  fileContent += `--- Ingredientes ---\n`;
  this.ingredients.forEach(item => {
    fileContent += `${item.measure.padEnd(15)} - ${item.name}\n`;
  });
  fileContent += `\n`;

  fileContent += `--- Modo de Preparo ---\n`;
  this.instructionSteps.forEach((step, index) => {
    fileContent += `${index + 1}. ${step}\n\n`;
  });
  
  if (this.recipe.strYoutube) {
    fileContent += `--- Vídeo ---\n`;
    fileContent += `Link do YouTube: ${this.recipe.strYoutube}\n`;
  }
  
  // 2. Define o nome do arquivo, removendo caracteres inválidos
  const safeFilename = `${this.recipe.strMeal.replace(/[^a-zA-Z0-9\s]/g, '_').substring(0, 50)}_receita.txt`;

  try {
    // 3. Salva o arquivo usando o Capacitor Filesystem
    await Filesystem.writeFile({
      path: safeFilename, // Nome do arquivo
      data: fileContent, // O conteúdo que será salvo
      directory: Directory.Documents, // Salva na pasta de Documentos (Disponível no Android/iOS)
      encoding: Encoding.UTF8,
    });

    console.log(`Receita salva com sucesso em Documents/${safeFilename}.`);
    // 💡 Em uma aplicação real, você deve notificar o usuário (ex: um Toast)
    alert(`Receita salva com sucesso! O arquivo "${safeFilename}" está na pasta Documentos do seu dispositivo.`);

  } catch (e) {
    console.error('Erro ao salvar o arquivo:', e);
    alert('Erro ao salvar a receita. Verifique as permissões de armazenamento.');
  }
}



  /**

   * Função para retornar para a página anterior (Home)

   */

  goBack() {

    this.router.navigateByUrl('/home');

  }

}