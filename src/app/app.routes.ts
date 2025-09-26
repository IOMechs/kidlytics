import { Routes } from '@angular/router';
import { Story } from './story/story';
import { Home } from './home/home';
import { DisplayStory } from './components/display-story/display-story';
import { Signin } from './components/signin/signin';
import { Signup } from './components/signup/signup';
import { UserStoriesComponent } from './components/my-stories/my-stories';

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
  {
    path: 'signin',
    component: Signin,
  },
  {
    path: 'signup',
    component: Signup,
  },
  {
    path: 'my-stories',
    component: UserStoriesComponent,
  },
];
