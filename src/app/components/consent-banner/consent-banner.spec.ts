import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsentBanner } from './consent-banner';

describe('ConsentBanner', () => {
  let component: ConsentBanner;
  let fixture: ComponentFixture<ConsentBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsentBanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsentBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
