import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { ConsentBanner } from './components/consent-banner/consent-banner';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { registerIcons } from './app.config';
import { PwaUpdateService } from './services/pwa-update.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ConsentBanner],
  templateUrl: './app.html',
})
export class App {
  protected title = 'kidlytics';

  constructor() {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);
    registerIcons(iconRegistry, sanitizer);
    inject(PwaUpdateService);
  }
}
