import { Component } from '@angular/core';
import { CreateStory } from '../components/create-story/create-story';

@Component({
  selector: 'app-story',
  imports: [CreateStory],
  templateUrl: './story.html',
  styleUrl: './story.css',
})
export class Story {}
