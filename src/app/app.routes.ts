import { Routes } from '@angular/router';
import { Story } from './story/story';
import { Home } from './home/home';
import { DisplayStory } from './components/display-story/display-story';

export const routes: Routes = [
  {
    path: 'story',
    component: Story,
  },
  {
    path: '',
    component: Home,
  },
  {
    path: 'viewStory',
    component: DisplayStory,
  },
];
