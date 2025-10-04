import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageSwitcher } from './shared/language-switcher/language-switcher';
import { MatToolbar } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LanguageSwitcher, MatToolbar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('web');
}
