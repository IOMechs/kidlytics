import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-social-share',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './social-share.html',
  styleUrls: ['./social-share.css'],
})
export class SocialShare {
  @Input() shareUrl: string = '';
  @Input() imageUrl: string = '';
  @Input() title: string = '';

  shareOnLinkedIn() {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.shareUrl)}`;
    window.open(linkedInUrl, '_blank');
  }

  shareOnReddit() {
    const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(this.shareUrl)}&title=${encodeURIComponent(this.title)}`;
    window.open(redditUrl, '_blank');
  }

  shareOnX() {
    const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(this.shareUrl)}&text=${encodeURIComponent(this.title)}`;
    window.open(xUrl, '_blank');
  }
}
