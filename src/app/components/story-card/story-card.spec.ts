import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryCard } from './story-card';

describe('StoryCard', () => {
  let component: StoryCard;
  let fixture: ComponentFixture<StoryCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoryCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
