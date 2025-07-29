import { TestBed } from '@angular/core/testing';

import { TextToSpeech } from './text-to-speech';

describe('TextToSpeech', () => {
  let service: TextToSpeech;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextToSpeech);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
