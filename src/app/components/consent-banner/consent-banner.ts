import { Component } from '@angular/core';

@Component({
  selector: 'app-consent-banner',
  imports: [],
  templateUrl: './consent-banner.html',
})
export class ConsentBanner {
  showBanner = !localStorage.getItem('analytics_consent');

  accept() {
    this.setConsent('granted');
    this.showBanner = false;
    localStorage.setItem('analytics_consent', 'granted');
  }

  decline() {
    this.setConsent('denied');
    this.showBanner = false;
    localStorage.setItem('analytics_consent', 'denied');
  }

  setConsent(state: 'granted' | 'denied') {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: state,
      });
    }
  }
}
