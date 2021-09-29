import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginbarComponent } from './loginbar.component';

describe('LoginbarComponent', () => {
  let component: LoginbarComponent;
  let fixture: ComponentFixture<LoginbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoginbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
