import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RgpdComponent } from './rgpd.component';

describe('RgpdComponent', () => {
  let component: RgpdComponent;
  let fixture: ComponentFixture<RgpdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RgpdComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RgpdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
