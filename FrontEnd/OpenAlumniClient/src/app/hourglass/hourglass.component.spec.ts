import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HourglassComponent } from './hourglass.component';

describe('HourglassComponent', () => {
  let component: HourglassComponent;
  let fixture: ComponentFixture<HourglassComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HourglassComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HourglassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
