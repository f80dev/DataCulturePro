import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PowsComponent } from './pows.component';

describe('PowsComponent', () => {
  let component: PowsComponent;
  let fixture: ComponentFixture<PowsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PowsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
