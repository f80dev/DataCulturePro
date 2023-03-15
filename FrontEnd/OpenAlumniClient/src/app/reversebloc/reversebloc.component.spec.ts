import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReverseblocComponent } from './reversebloc.component';

describe('ReverseblocComponent', () => {
  let component: ReverseblocComponent;
  let fixture: ComponentFixture<ReverseblocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReverseblocComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReverseblocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
