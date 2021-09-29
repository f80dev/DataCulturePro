import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddpowComponent } from './addpow.component';

describe('AddpowComponent', () => {
  let component: AddpowComponent;
  let fixture: ComponentFixture<AddpowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddpowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddpowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
