import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuscarEnderecoPage } from './buscar-endereco.page';

describe('BuscarEnderecoPage', () => {
  let component: BuscarEnderecoPage;
  let fixture: ComponentFixture<BuscarEnderecoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BuscarEnderecoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
