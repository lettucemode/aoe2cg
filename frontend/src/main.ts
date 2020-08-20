import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { Twitch } from './app/models/twitch';

if (environment.production) {
  enableProdMode();
}

declare global {
  interface Window {
    Twitch: Twitch;
  }
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
