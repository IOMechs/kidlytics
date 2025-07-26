import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-social-share',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltip],
  templateUrl: './social-share.html',
})
export class SocialShare {
  @Input() shareUrl: string = '';
  @Input() imageUrl: string = '';
  @Input() title: string = '';

  shareOnLinkedIn() {
    // Add timestamp query parameter for cache busting
    const timestamp = new Date().getTime();
    const cachebustedUrl = `${this.shareUrl}${
      this.shareUrl.includes('?') ? '&' : '?'
    }v=${timestamp}`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      cachebustedUrl
    )}`;
    window.open(linkedInUrl, '_blank');
  }

  shareOnReddit() {
    // Add timestamp query parameter for cache busting
    const timestamp = new Date().getTime();
    const cachebustedUrl = `${this.shareUrl}${
      this.shareUrl.includes('?') ? '&' : '?'
    }v=${timestamp}`;
    const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(
      cachebustedUrl
    )}&title=${encodeURIComponent(this.title)}`;
    window.open(redditUrl, '_blank');
  }

  shareOnX() {
    // Add timestamp query parameter for cache busting
    const timestamp = new Date().getTime();
    const cachebustedUrl = `${this.shareUrl}${
      this.shareUrl.includes('?') ? '&' : '?'
    }v=${timestamp}`;
    const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      cachebustedUrl
    )}&text=${encodeURIComponent(this.title)}`;
    window.open(xUrl, '_blank');
  }
}
