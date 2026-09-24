import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Single app-wide date adapter, the pattern Angular Material recommends
    // for standalone apps (more reliable than importing MatNativeDateModule
    // per-component, which can fail to wire up the datepicker's overlay).
    provideNativeDateAdapter(),
    // en-GB gives DD/MM/YYYY typed-date parsing (matches how most of the
    // world, incl. India, writes dates) instead of the US MM/DD/YYYY default.
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
  ],
};
