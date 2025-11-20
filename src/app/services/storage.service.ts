import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  StorageReference 
} from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storage: any; 

  // ⚠️ Configuração do Firebase. Em um projeto real, evite duplicar a configuração.
  private firebaseConfig = {
    apiKey: "AIzaSyBuWpZ-LvjCXYe0ybFepsKky_W_ggBcPLA",
    authDomain: "sabor-app-5516a.firebaseapp.com",
    projectId: "sabor-app-5516a",
    storageBucket: "sabor-app-5516a.firebasestorage.app", // Essencial para Storage
    messagingSenderId: "444889910847",
    appId: "1:444889910847:web:9717e862344bf86075b28a",
    measurementId: "G-WYKN2D2HJD"
  };

  constructor() {
    const app = initializeApp(this.firebaseConfig);
    this.storage = getStorage(app);
  }

  /**
   * Faz o upload de um arquivo (imagem) para o Firebase Storage.
   * @param file O arquivo a ser enviado.
   * @param path O caminho dentro do Storage (ex: 'profile_images/').
   * @param filename O nome do arquivo a ser salvo (ex: 'user_uid').
   * @returns Uma Promise<string> com a URL pública da imagem.
   */
  uploadFile(file: File, path: string, filename: string): Promise<string> {
    // Cria a referência completa para o local do arquivo no Storage
    const storageRef: StorageReference = ref(this.storage, `${path}/${filename}`);

    // Faz o upload do arquivo
    return uploadBytes(storageRef, file)
      .then(() => {
        // Pega a URL pública após o sucesso do upload
        return getDownloadURL(storageRef);
      });
  }
}