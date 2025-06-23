import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateStory } from './create-story';

describe('CreateStory', () => {
  let component: CreateStory;
  let fixture: ComponentFixture<CreateStory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateStory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateStory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
