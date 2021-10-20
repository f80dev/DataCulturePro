import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilsScannerComponent } from './profils-scanner.component';

describe('ProfilsScannerComponent', () => {
  let component: ProfilsScannerComponent;
  let fixture: ComponentFixture<ProfilsScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfilsScannerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilsScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
