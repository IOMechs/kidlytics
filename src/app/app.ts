import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { ConsentBanner } from './components/consent-banner/consent-banner';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { registerIcons } from './app.config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ConsentBanner],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'kidelytics';

  constructor() {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);
    registerIcons(iconRegistry, sanitizer);
  }
}
