import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile,
  deleteUser, 
  Auth,
  signOut,
  User // ❗ Importa o tipo User
} from 'firebase/auth';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth;
  
  // ⚠️ Substitua pelos seus dados do Firebase ⚠️
  private firebaseConfig = {
    apiKey: "AIzaSyBuWpZ-LvjCXYe0ybFepsKky_W_ggBcPLA",
    authDomain: "sabor-app-5516a.firebaseapp.com",
    projectId: "sabor-app-5516a",
    storageBucket: "sabor-app-5516a.firebasestorage.app",
    messagingSenderId: "444889910847",
    appId: "1:444889910847:web:9717e862344bf86075b28a",
    measurementId: "G-WYKN2D2HJD"
  };

  constructor() {
    const app = initializeApp(this.firebaseConfig);
    this.auth = getAuth(app);
  }

  register(email: string, password: string): Observable<any> {
    // Retorna o Observable da criação da conta
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  /**
   * Método para enviar email de redefinição de senha.
   */
  sendPasswordReset(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }
  
  // --- MÉTODOS PARA A TELA DE PERFIL / CADASTRO ---

  /**
   * Retorna o objeto User do Firebase para acessar nome e email.
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * ❗ ATUALIZADO:
   * Atualiza o nome de exibição (displayName) do usuário.
   * Pode receber um objeto 'user' específico (usado no cadastro) ou usar o usuário logado.
   */
  updateUserName(newName: string, targetUser?: User): Promise<void> {
    // Usa o usuário passado como argumento, ou o usuário logado
    const userToUpdate = targetUser || this.auth.currentUser;
    
    if (userToUpdate) {
      // updateProfile retorna uma Promise<void>
      return updateProfile(userToUpdate, { displayName: newName });
    } else {
      // Devemos rejeitar a Promise se o usuário não estiver logado
      return Promise.reject(new Error("Nenhum usuário logado ou fornecido para atualizar o nome."));
    }
  }

  /**
   * Atualiza a foto de perfil (photoURL) do usuário logado.
   * @param photoURL A URL da imagem no Firebase Storage.
   */
  updateUserPhoto(photoURL: string): Promise<void> {
    const user = this.auth.currentUser;
    
    if (user) {
      return updateProfile(user, { photoURL: photoURL });
    } else {
      return Promise.reject(new Error("Nenhum usuário logado para atualizar a foto."));
    }
  }

  /**
   * Exclui o utilizador atualmente logado.
   * @param user O objeto User a ser excluído.
   * @returns Uma Promise<void> que se resolve após a exclusão.
   */
  deleteAccount(user: User): Promise<void> {
      // A função deleteUser do Firebase retorna uma Promise<void>
      return deleteUser(user);
  }

  // --- MÉTODOS DE ROTEAMENTO/ESTADO ---

  getAuthInstance(): Auth {
    return this.auth;
  }

  getAuthState(): Observable<User | null> {
    return new Observable(subscriber => {
      const unsubscribe = this.auth.onAuthStateChanged(user => {
        subscriber.next(user);
      });
      return { unsubscribe };
    });
  }

  logout(): Observable<void> {
    return from(signOut(this.auth)); 
  }
}