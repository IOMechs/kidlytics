import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayStory } from './display-story';

describe('DisplayStory', () => {
  let component: DisplayStory;
  let fixture: ComponentFixture<DisplayStory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayStory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayStory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
