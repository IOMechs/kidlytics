import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
  DomSanitizer,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    importProvidersFrom(MatDialogModule, MatIconModule),
  ],
};

export function registerIcons(
  iconRegistry: MatIconRegistry,
  sanitizer: DomSanitizer
) {
  iconRegistry.addSvgIcon(
    'linkedin',
    sanitizer.bypassSecurityTrustResourceUrl('assets/icons/linkedin.svg')
  );
  iconRegistry.addSvgIcon(
    'reddit',
    sanitizer.bypassSecurityTrustResourceUrl('assets/icons/reddit.svg')
  );
  iconRegistry.addSvgIcon(
    'x',
    sanitizer.bypassSecurityTrustResourceUrl('assets/icons/x.svg')
  );
}
