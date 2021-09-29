import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisgraphComponent } from './visgraph.component';

describe('VisgraphComponent', () => {
  let component: VisgraphComponent;
  let fixture: ComponentFixture<VisgraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisgraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisgraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
