import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonButtons,
  IonBackButton,
  IonIcon,
  AlertController,
  IonNote,
  IonItemSliding, 
  IonItemOptions,
  IonItemOption,
  IonSpinner // Adicionado para indicar carregamento/processamento
} from '@ionic/angular/standalone';
// Importações do Firebase
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { doc, deleteDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { trashOutline, saveOutline, shareOutline } from 'ionicons/icons';


//Importa os plugins Filesystem e Share do Capacitor
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'; 
import { Share } from '@capacitor/share'; 

// Adiciona ícones necessários
addIcons({ trashOutline, saveOutline, shareOutline });


// Interface para garantir a tipagem dos endereços
interface EnderecoSalvo {
  id: string; // Adicionamos ID para exclusão
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento?: string; // Adicionado como opcional, se estiver no seu model
}

@Component({
  selector: 'app-enderecos-salvos',
  templateUrl: './enderecos-salvos.page.html', // Presume-se que o HTML está separado
  styleUrls: ['./enderecos-salvos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButton, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonButtons, 
    IonBackButton, 
    IonIcon, 
    IonNote,
    IonItemSliding, 
    IonItemOptions, 
    IonItemOption,
    IonSpinner
  ],
})
export class EnderecosSalvosPage implements OnInit, OnDestroy {

  savedAddresses: EnderecoSalvo[] = [];
  isLoading = true; // Adicionado para controle de loading
  private authSubscription: Subscription | null = null;
  private addressesSubscription: Subscription | null = null;
  private userId: string | null = null;
  
  // Injeção de dependências usando inject()
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private alertController: AlertController = inject(AlertController);
  private router: Router = inject(Router);

  constructor() { }
  
  ngOnInit() {
    // 1. Monitora o estado de autenticação
    this.authSubscription = user(this.auth).subscribe(firebaseUser => {
      if (firebaseUser) {
        this.userId = firebaseUser.uid;
        this.loadSavedAddresses(); // 2. Se logado, carrega os endereços
      } else {
        this.savedAddresses = []; // Se deslogado, limpa a lista
        this.isLoading = false;
        // Opcional: Redirecionar para o login se não for anônimo
      }
    });
  }

  ngOnDestroy() {
    // 3. Cancela as subscriptions para evitar vazamento de memória
    this.authSubscription?.unsubscribe();
    this.addressesSubscription?.unsubscribe();
  }

  /**
    * Configura o listener em tempo real para os endereços do usuário.
    */
  loadSavedAddresses() {
    if (!this.userId) return;

    this.isLoading = true;

    // Acessa a coleção de endereços (garantindo o escopo do canvas/appId, se necessário)
    // NOTE: Se o seu app está usando 'users/{userId}/savedAddresses', mantenha assim.
    // Se estivesse usando a estrutura de segurança do Canvas, seria:
    // const appId = (window as any).__app_id || 'default-app-id';
    // const collectionPath = `artifacts/${appId}/users/${this.userId}/savedAddresses`;
    const collectionPath = `users/${this.userId}/savedAddresses`;

    const addressesCollection = collection(this.firestore, collectionPath);
    
    // Converte a coleção em um Observable e monitora em tempo real (onSnapshot)
    this.addressesSubscription = (collectionData(addressesCollection, { idField: 'id' }) as any).subscribe({
      next: (addresses: EnderecoSalvo[]) => {
        this.savedAddresses = addresses;
        this.isLoading = false;
        console.log('Endereços carregados:', this.savedAddresses);
      },
      error: (e: any) => {
        console.error('Erro ao carregar endereços:', e);
        this.presentAlert('Erro', 'Não foi possível carregar seus endereços.');
        this.isLoading = false;
      }
    });
  }

  /**
    * Confirmação e exclusão de um endereço.
    * @param address O objeto endereço a ser excluído.
    */
  async confirmDelete(address: EnderecoSalvo) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Tem certeza que deseja remover o endereço ${address.logradouro || address.cep}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', cssClass: 'alert-danger', handler: () => { this.deleteAddress(address.id); } },
      ],
    });
    await alert.present();
  }

  /**
    * Exclui um documento do Firestore.
    * @param addressId O ID do documento a ser excluído.
    */
  async deleteAddress(addressId: string) {
    if (!this.userId) return;
    
    try {
      // Cria a referência ao documento específico
      const collectionPath = `users/${this.userId}/savedAddresses`;
      const docRef = doc(this.firestore, collectionPath, addressId);
      
      await deleteDoc(docRef);
      // A lista é atualizada automaticamente pelo listener (onSnapshot)
      
    } catch (e) {
      console.error('Erro ao excluir endereço:', e);
      this.presentAlert('Erro', 'Falha ao excluir o endereço.');
    }
  }
  
  /**
    * Formata o endereço para o conteúdo do arquivo TXT.
    */
  private formatAddressContent(address: EnderecoSalvo): string {
    return (
      `Detalhes do Endereço:\n` +
      `--------------------\n` +
      `CEP: ${address.cep}\n` +
      `Rua: ${address.logradouro || 'N/A'}\n` +
      `Bairro: ${address.bairro || 'N/A'}\n` +
      `Cidade/UF: ${address.localidade || 'N/A'} / ${address.uf || 'N/A'}\n` +
      (address.complemento ? `Complemento: ${address.complemento}\n` : '') +
      `--------------------\n\n` +
      `Exportado via App de Endereços`
    );
  }

  /**
    * FUNÇÃO DE DOWNLOAD INDIVIDUAL
    * Tenta salvar o arquivo TXT diretamente na pasta de Documents ou Downloads do celular.
    * @param address O objeto EnderecoSalvo a ser exportado.
    */
  async exportSingleAddressToTxt(address: EnderecoSalvo) {
    
    // DEFINIÇÃO DE VARIÁVEIS FORA DO TRY/CATCH
    const content = this.formatAddressContent(address);
    // Limpa o nome do arquivo para garantir que não haja caracteres inválidos (o que causa falhas no Android/Capacitor)
    const safeLogradouro = (address.logradouro || 'Endereco').replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20);
    const fileName = `endereco_${address.cep.replace('-', '')}_${safeLogradouro}.txt`; 

    try {
      
      // 1. Tenta salvar o arquivo diretamente na pasta de Documentos do dispositivo.
      const result = await Filesystem.writeFile({
        path: fileName,
        data: content,
        directory: Directory.Documents, 
        encoding: Encoding.UTF8,
      });

      console.log('Arquivo salvo em:', result.uri);
      
      this.presentAlert('Sucesso!', `Endereço salvo como "${fileName}" na sua pasta de Documentos!`);
      
    } catch (e: any) {
      console.error('Erro ao salvar endereço diretamente:', e);
      
      // 2. CORREÇÃO APLICADA: Aciona o Fallback de Compartilhamento para QUALQUER ERRO.
      // Isso resolve o problema de erros de Permissão Genéricos que não ativam o IF anterior.
      await this.presentAlertWithShareFallback(address, content, fileName);
    }
  }
  
  /**
    * Função de fallback para o caso de a escrita direta falhar (navegador ou permissão).
    * Usa o menu de compartilhamento nativo para que o usuário possa salvar em 'Arquivos' ou compartilhar.
    */
  private async presentAlertWithShareFallback(address: EnderecoSalvo, content: string, fileName: string) {
      
      // Checa se o Share API é suportado antes de prosseguir
      const canShare = await Share.canShare();
      if (!canShare.value) {
          this.presentAlert('Aviso', 'O download direto falhou e o compartilhamento não é suportado neste dispositivo. Falha ao salvar o endereço.');
          return;
      }
      
      const alert = await this.alertController.create({
        header: 'Atenção',
        message: 'O download direto falhou (provavelmente devido a restrições de permissões no seu celular). Gostaria de tentar salvar usando o menu de Compartilhamento do celular?',
        buttons: [
          {
            text: 'Não',
            role: 'cancel',
          },
          {
            text: 'Sim, Compartilhar',
            handler: async () => {
              try {
                // 1. Salva temporariamente o arquivo no cache. Essa pasta tem menos restrições.
                await Filesystem.writeFile({ 
                    path: fileName, 
                    data: content, 
                    directory: Directory.Cache, // Usa Cache
                    encoding: Encoding.UTF8 
                });
                
                // 2. Obtém a URI do arquivo no cache
                const uriResult = await Filesystem.getUri({ directory: Directory.Cache, path: fileName });
                const fileUri = uriResult.uri;
                
                // 3. Abre o menu de compartilhamento do sistema operacional com a URI do arquivo
                await Share.share({
                  title: `Endereço Salvo: ${address.logradouro || address.cep}`,
                  text: 'Anexo: Arquivo de endereço .txt',
                  url: fileUri, // Passa a URI do arquivo temporário
                  dialogTitle: 'Selecione "Salvar em Arquivos" ou similar',
                });
                
                // 4. Deleta o arquivo temporário após o compartilhamento (limpeza)
                await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache });
                
                this.presentAlert('Ação Iniciada', 'A janela de compartilhamento foi aberta. Use a opção "Salvar em Arquivos" ou envie para si mesmo para salvar o TXT.');
                
              } catch (e: any) {
                console.error('Erro no fallback de compartilhamento:', e);
                this.presentAlert('Erro de Compartilhamento', 'Falha ao abrir o menu de compartilhamento. O recurso pode não estar disponível ou o arquivo temporário não pôde ser criado.');
              }
            },
          },
        ],
      });
      await alert.present();
  }


  /**
    * Função auxiliar para exibir alertas.
    */
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}