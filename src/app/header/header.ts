import { Component } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [MatTooltip, RouterLink],
  templateUrl: './header.html',
})
export class Header {}
