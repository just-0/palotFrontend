import { Component } from '@angular/core';

interface ConfigSection {
  name: string;
  icon: string;
}

@Component({
  selector: 'app-configuracion',
  standalone: false,
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent {
  activeSection: number = 0;

  configSections: ConfigSection[] = [
    {
      name: 'Apariencia',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>`
    },
    {
      name: 'Sistema',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>`
    },
    {
      name: 'Notificaciones',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM11 17H6l5 5v-5zM12 3v9m0 0l3-3m-3 3l-3-3"></path>`
    },
    {
      name: 'Seguridad',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>`
    }
  ];
}
