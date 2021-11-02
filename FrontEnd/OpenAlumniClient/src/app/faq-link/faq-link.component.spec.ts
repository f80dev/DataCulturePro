import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FaqLinkComponent } from './faq-link.component';

describe('FaqLinkComponent', () => {
  let component: FaqLinkComponent;
  let fixture: ComponentFixture<FaqLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FaqLinkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FaqLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
