import { Component } from '@angular/core';

@Component({
  selector: 'app-testimonials',
  imports: [],
  templateUrl: './testimonials.html',
})
export class Testimonials {
  testimonials = [
    {
      initials: 'SJ',
      name: 'Siraj ul Haq',
      title: 'Parent of 2',
      text: 'Creating a story from a real life event was quick, easy, and surprisingly fun. It kept my kids more engaged because the story felt personal and familiar to them. This has definitely made my life easier, no more struggling to come up with stories on the spot!',
    },
    {
      initials: 'YA',
      name: 'Yawar Abbas',
      title: 'Parent of 2',
      text: `The story could easily be tailored according to my kid's interest, and my son found it interesting and was excited to see his name on the book.:+1:`,
    },
  ];
}
