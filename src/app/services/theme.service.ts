import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkMode = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this.isDarkMode.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    // Verificar si hay una preferencia guardada en localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      const isDark = savedTheme === 'dark';
      this.isDarkMode.next(isDark);
      this.applyTheme(isDark);
    } else {
      // Por defecto, iniciar en modo claro
      this.isDarkMode.next(false);
      this.applyTheme(false);
      localStorage.setItem('theme', 'light');
    }
  }

  private applyTheme(isDark: boolean) {
    // Aplicar al elemento html
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    if (isDark) {
      htmlElement.classList.add('dark');
      bodyElement.classList.add('dark');
      console.log('Aplicando modo oscuro - clases agregadas');
    } else {
      htmlElement.classList.remove('dark');
      bodyElement.classList.remove('dark');
      console.log('Aplicando modo claro - clases removidas');
    }
    
    // Debug: verificar que las clases se aplicaron
    console.log('HTML classes:', htmlElement.className);
    console.log('Body classes:', bodyElement.className);
  }

  toggleTheme() {
    this.setDarkMode(!this.isDarkMode.value);
  }

  setDarkMode(isDark: boolean) {
    this.isDarkMode.next(isDark);
    this.applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  getCurrentTheme(): boolean {
    return this.isDarkMode.value;
  }
}