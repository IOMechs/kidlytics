import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { StoryMetaResolver } from './services/story-meta.resolver';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    StoryMetaResolver,
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
