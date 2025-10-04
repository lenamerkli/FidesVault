import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Function to determine the locale based on stored preference or browser language
function getLocale(): string {
  // Check if user has a stored language preference
  const storedLang = localStorage.getItem('preferred-language');
  if (storedLang && ['en-CH', 'de-CH', 'fr-CH'].includes(storedLang)) {
    return storedLang;
  }

  // Check browser language
  const browserLang = navigator.language;
  if (['en-CH', 'de-CH', 'fr-CH', 'en-US', 'de-DE', 'fr-FR', 'en', 'de', 'fr'].includes(browserLang)) {
    // Map browser languages to our supported locales
    if (browserLang.startsWith('en')) return 'en-CH';
    if (browserLang.startsWith('de')) return 'de-CH';
    if (browserLang.startsWith('fr')) return 'fr-CH';
  }

  // Default to English (Switzerland)
  return 'en-CH';
}

// Set the locale for Angular i18n
const locale = getLocale();

// Dynamically import the appropriate locale data
if (locale === 'de-CH') {
  import('@angular/common/locales/de').then(() => {
    import('@angular/common/locales/extra/de').then(() => {
      bootstrapApplication(App, appConfig)
        .catch((err) => console.error(err));
    });
  });
} else if (locale === 'fr-CH') {
  import('@angular/common/locales/fr').then(() => {
    import('@angular/common/locales/extra/fr').then(() => {
      bootstrapApplication(App, appConfig)
        .catch((err) => console.error(err));
    });
  });
} else {
  // Default to English
  import('@angular/common/locales/en').then(() => {
    import('@angular/common/locales/extra/en').then(() => {
      bootstrapApplication(App, appConfig)
        .catch((err) => console.error(err));
    });
  });
}
