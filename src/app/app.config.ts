import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  DomSanitizer,
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { importProvidersFrom, isDevMode } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    importProvidersFrom(MatDialogModule, MatIconModule),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
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
