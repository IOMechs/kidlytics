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
      initials: 'MC',
      name: 'Michael Chen',
      title: 'Elementary Teacher',
      text: 'An amazing tool for engaging young minds and making learning fun through storytelling.',
    },
    {
      initials: 'ER',
      name: 'Emily Rodriguez',
      title: 'Parent of 3',
      text: 'The stories are creative, educational, and perfectly tailored to each child\'s interests.',
    },
  ];
}
