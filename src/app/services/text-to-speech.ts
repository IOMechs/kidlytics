import { Injectable, Signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TextToSpeech {
  private synth = window.speechSynthesis;

  speak(text: string) {
    this.stop();
    if (!this.synth) {
      alert('Text To Speech is not supported by this browser');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'urdu';
    utterance.rate = 1;
    utterance.pitch = 1;
    this.synth.speak(utterance);
    utterance.onend = () => {
      this.synth.cancel();
    };
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
