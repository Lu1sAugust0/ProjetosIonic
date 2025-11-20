import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// ❗ IMPORTAÇÕES DE COMPONENTES IONIC NO MODO STANDALONE
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonText, 
  IonList, 
  IonItem, 
  IonInput, 
  AlertController // O AlertController também é importado do pacote principal
} from '@ionic/angular/standalone'; 
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { User } from 'firebase/auth'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms'; 
// Observação: Não precisamos do 'IonicModule' porque estamos usando os imports específicos acima.

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    // Lista de imports específicos do Ionic (Standalone)
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButton, 
    IonText,
    IonList,
    IonItem,
    IonInput
  ] 
})
export class AuthPage implements OnInit {
  
  mode: 'login' | 'register' = 'login'; 
  authForm!: FormGroup;

  constructor(
    private authService: AuthService, 
    private alertController: AlertController,
    private router: Router,
    private fb: FormBuilder
  ) {
    // A chamada addIcons (se necessário) deve estar no main.ts
  }

  ngOnInit() {
    this.initForm();
  }

  /**
   * Inicializa o FormGroup com os controles e validadores.
   */
  initForm() {
    this.authForm = this.fb.group({
      // Campos compartilhados
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      
      // Campos do Cadastro (inicialmente sem validação de required)
      name: [''],
      confirmPassword: ['']
    }, { 
      // Adiciona um validador a nível de grupo para checar senhas
      validators: this.passwordMatchValidator() 
    });
    
    // Configura os validadores iniciais para o modo 'login'
    this.updateValidators();
  }
  
  /**
   * Validador Customizado: Verifica se as senhas coincidem, apenas no modo 'register'.
   */
  passwordMatchValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      // Retorna null (válido) se não for modo 'register'
      if (this.mode !== 'register') return null;
      
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      
      return password && confirmPassword && password !== confirmPassword ? 
            { passwordsDoNotMatch: true } : 
            null;
    };
  }

  /**
   * Alterna entre o modo Login e Cadastro e atualiza os validadores.
   */
  toggleMode() {
    this.mode = this.mode === 'login' ? 'register' : 'login';
    this.authForm.reset(); 
    this.updateValidators();
  }
  
  /**
   * Adiciona ou remove validadores de campos específicos com base no modo.
   */
  updateValidators() {
    const nameControl = this.authForm.get('name');
    const confirmPasswordControl = this.authForm.get('confirmPassword');
    
    if (this.mode === 'register') {
      nameControl?.addValidators(Validators.required);
      confirmPasswordControl?.addValidators(Validators.required);
    } else {
      nameControl?.removeValidators(Validators.required);
      confirmPasswordControl?.removeValidators(Validators.required);
    }
    
    nameControl?.updateValueAndValidity();
    confirmPasswordControl?.updateValueAndValidity();
    this.authForm.updateValueAndValidity(); 
  }

  /**
   * Verifica se o controle é inválido e foi tocado/modificado.
   */
  isInvalid(controlName: string): boolean {
    const control = this.authForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  /**
   * Função principal chamada ao submeter o formulário.
   */
  handleSubmit() {
    this.authForm.markAllAsTouched(); 
    
    if (this.authForm.invalid) {
      if (this.authForm.errors?.['passwordsDoNotMatch']) {
        this.presentAlert('Erro de Cadastro', 'As senhas não coincidem.');
      } else {
        this.presentAlert('Erro de Formulário', 'Por favor, preencha todos os campos corretamente.');
      }
      return;
    }
    
    const { email, password, name } = this.authForm.value;
    
    if (this.mode === 'login') {
      this.login(email, password);
    } else {
      this.register(email, password, name);
    }
  }

  login(email: string, password: string) {
    // Assumindo que this.authService está implementado
    this.authService.login(email, password).subscribe({
      next: (res) => {
        console.log('Login bem-sucedido!', res.user);
        this.router.navigateByUrl('/home'); 
      },
      error: (err: any) => { 
        this.presentAlert('Erro de Login', this.getErrorMessage(err.code));
      }
    });
  }

  register(email: string, password: string, name: string) {
    // Assumindo que this.authService está implementado
    this.authService.register(email, password).subscribe({
      next: (res) => {
        const firebaseUser: User = res.user;
        
        // Tenta salvar o nome do usuário após o registro
        this.authService.updateUserName(name, firebaseUser)
          .then(() => {
            console.log('Cadastro e Nome salvos com sucesso!');
            this.presentAlert('Sucesso!', `Conta de ${name} criada e você está logado.`);
            this.router.navigateByUrl('/home'); 
          })
          .catch((nameError) => {
            console.error('Erro ao salvar nome:', nameError);
            this.presentAlert('Aviso', 'Conta criada, mas houve um erro ao salvar seu nome. Você pode atualizá-lo no perfil.');
            this.router.navigateByUrl('/home'); 
          });
      },
      error: (err: any) => { 
        this.presentAlert('Erro de Cadastro', this.getErrorMessage(err.code));
      }
    });
  }

  // Função para lidar com a recuperação de senha
  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Esqueceu Senha',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Digite seu e-mail de cadastro'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Enviar', handler: (data) => this.sendResetEmail(data.email) }
      ]
    });
    await alert.present();
  }
  
  private sendResetEmail(email: string) {
    if (!email || email.trim() === '') {
        this.presentAlert('Aviso', 'Por favor, forneça um e-mail para a recuperação de senha.');
        return;
    }
    
    // Assumindo que this.authService está implementado
    this.authService.sendPasswordReset(email)
      .then(() => {
        this.presentAlert('E-mail Enviado', 'Verifique sua caixa de entrada para resetar sua senha.');
      })
      .catch((err: any) => {
        this.presentAlert('Erro', this.getErrorMessage(err.code));
      });
  }

  // Função para exibir o alerta
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
  
  // Função para traduzir códigos de erro do Firebase (melhorando UX)
  getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found': return 'Nenhum usuário encontrado com este e-mail.';
      case 'auth/wrong-password': return 'Senha incorreta.';
      case 'auth/email-already-in-use': return 'Este e-mail já está cadastrado.';
      case 'auth/invalid-email': return 'O formato do e-mail é inválido.';
      case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
      case 'auth/missing-email': return 'O e-mail é obrigatório.';
      case 'auth/too-many-requests': return 'Bloqueamos temporariamente todos os pedidos deste dispositivo devido a muitas tentativas de login falhadas. Tente novamente mais tarde.';
      default: return 'Ocorreu um erro inesperado. Tente novamente. Código: ' + errorCode;
    }
  }
}