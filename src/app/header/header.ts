import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../services/auth.store';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [MatTooltip, RouterLink],
  standalone: true,
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly authStore = inject(AuthStore);
  readonly authService = inject(AuthService);

  onLogout() {
    this.authService.logout();
  }
}
