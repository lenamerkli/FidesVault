import { Component, Inject, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-language-switcher',
  imports: [
    CommonModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule
  ],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss'
})
export class LanguageSwitcher {
  currentLocale: string;

  languages: Language[] = [
    { code: 'en-CH', name: 'English', flag: '🇺🇸' },
    { code: 'de-CH', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr-CH', name: 'Français', flag: '🇫🇷' }
  ];

  constructor(@Inject(LOCALE_ID) locale: string) {
    this.currentLocale = locale;
  }

  switchLanguage(langCode: string): void {
    // Store the selected language in localStorage
    localStorage.setItem('preferred-language', langCode);

    // Reload the page to apply the new locale
    window.location.reload();
  }

  getCurrentLanguage(): Language {
    return this.languages.find(lang => lang.code === this.currentLocale) || this.languages[0];
  }
}
