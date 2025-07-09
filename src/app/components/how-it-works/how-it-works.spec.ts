import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowItWorks } from './how-it-works';

describe('HowItWorks', () => {
  let component: HowItWorks;
  let fixture: ComponentFixture<HowItWorks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowItWorks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HowItWorks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
