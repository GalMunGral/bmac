import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: definePreset(Aura, {
          semantic: {
            primary: {
              50: '{gray.50}',
              100: '{gray.100}',
              200: '{gray.200}',
              300: '{gray.300}',
              400: '{gray.400}',
              500: '{gray.500}',
              600: '{gray.600}',
              700: '{gray.700}',
              800: '{gray.800}',
              900: '{gray.900}',
              950: '{gray.950}',
            },
          },
        }),
        options: {
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
          darkModeSelector: '.darkmode',
        },
      },
    }),
  ],
};
