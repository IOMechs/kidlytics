import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { ConsentBanner } from './components/consent-banner/consent-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ConsentBanner],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'kidelytics';
}
