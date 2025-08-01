import { Injectable, Signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

export interface TTSResponseItem {
  index: number;
  text: string;
  base64: string; // 'data:audio/mp3;base64,...'
}

export interface TTSApiResponse {
  status: string;
  data: TTSResponseItem[];
}

@Injectable({
  providedIn: 'root',
})
export class TextToSpeech {
  private readonly API_URL = `${environment.apiUrl}/api/text-to-speech`;

  constructor(private http: HttpClient) {}

  /**
   * Convert an array of text strings to TTS audio using your backend.
   */
  getAudioFromText(content: string[]) {
    return this.http.post<TTSApiResponse>(this.API_URL, { content });
  }
}
