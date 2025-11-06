import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnderecosSalvosPage } from './enderecos-salvos.page';

describe('EnderecosSalvosPage', () => {
  let component: EnderecosSalvosPage;
  let fixture: ComponentFixture<EnderecosSalvosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EnderecosSalvosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
