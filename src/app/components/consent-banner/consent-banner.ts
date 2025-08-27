import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-consent-banner',
  imports: [],
  templateUrl: './consent-banner.html',
})
export class ConsentBanner implements OnInit {
  showBanner = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    // Only check localStorage on the client side
    if (isPlatformBrowser(this.platformId)) {
      this.showBanner = !localStorage.getItem('analytics_consent');
    }
  }

  accept() {
    this.setConsent('granted');
    this.showBanner = false;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('analytics_consent', 'granted');
    }
  }

  decline() {
    this.setConsent('denied');
    this.showBanner = false;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('analytics_consent', 'denied');
    }
  }

  setConsent(state: 'granted' | 'denied') {
    if (isPlatformBrowser(this.platformId) && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: state,
      });
    }
  }
}
