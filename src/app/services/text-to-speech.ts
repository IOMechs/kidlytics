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
  private synth = window.speechSynthesis;

  private readonly API_URL = `${environment.apiUrl}/api/text-to-speech`;

  constructor(private http: HttpClient) {}

  /**
   * Convert an array of text strings to TTS audio using your backend.
   */
  getAudioFromText(content: string[]) {
    return this.http.post<TTSApiResponse>(this.API_URL, { content });
  }

  async speak(text: string) {
    // this.stop();
    // if (!this.synth) {
    //   alert('Text To Speech is not supported by this browser');
    //   return;
    // }
    // const utterance = new SpeechSynthesisUtterance(text);
    // utterance.lang = 'urdu';
    // utterance.rate = 1;
    // utterance.pitch = 1;
    // this.synth.speak(utterance);
    // utterance.onend = () => {
    //   this.synth.cancel();
    // };
  }

  stop() {
    this.synth.cancel();
  }

  isSpeaking(signal?: boolean): boolean {
    if (signal !== undefined) {
      return signal;
    }
    return this.synth.speaking;
  }
}
