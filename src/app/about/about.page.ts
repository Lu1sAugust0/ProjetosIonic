import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButtons,
  IonBackButton, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonList, 
  IonItem, 
  IonLabel,
  IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, heartHalfOutline, cloudOfflineOutline, personCircle } from 'ionicons/icons';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    // Imports dos componentes Ionic usados no about.page.html
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons,
    IonBackButton, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonList, 
    IonItem, 
    IonLabel,
    IonIcon 
  ]
})
export class AboutPage implements OnInit {

  constructor() {
    // Adiciona os ícones utilizados no template HTML
    addIcons({ searchOutline, heartHalfOutline, cloudOfflineOutline, personCircle });
  }

  ngOnInit() {
    // Inicialização, se houver
  }

}