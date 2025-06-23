import { TestBed } from '@angular/core/testing';

import { GenerateStory } from './generate-story';

describe('GenerateStory', () => {
  let service: GenerateStory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GenerateStory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
