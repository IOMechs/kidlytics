import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhyChoose } from './why-choose';

describe('WhyChoose', () => {
  let component: WhyChoose;
  let fixture: ComponentFixture<WhyChoose>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhyChoose]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhyChoose);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
