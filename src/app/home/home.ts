import { Component } from '@angular/core';
import { HeroSection } from '../components/hero-section/hero-section';
import { WhyChoose } from '../components/why-choose/why-choose';
import { HowItWorks } from '../components/how-it-works/how-it-works';
import { Testimonials } from '../components/testimonials/testimonials';
import { CallToAction } from '../components/call-to-action/call-to-action';

@Component({
  selector: 'app-home',
  imports: [HeroSection, WhyChoose, HowItWorks, Testimonials, CallToAction],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
