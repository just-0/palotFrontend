# Configuración de Environments - PalotFrontend

## 📁 Estructura de Environments

Angular utiliza su propio sistema de environments ubicado en:
- `src/environments/environment.ts` - **Desarrollo**
- `src/environments/environment.prod.ts` - **Producción**

## ⚙️ Configuración Actual

### Desarrollo (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000',
  cameraBaseUrl: 'http://192.168.1.64',
  plateImageBaseUrl: 'http://192.168.1.120',
  defaultPlayaImageUrl: 'https://concepto.de/wp-content/uploads/2015/03/paisaje-2-e1549600987975.jpg'
};
```

### Producción (`environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://your-production-api.com', // ⚠️ CAMBIAR POR TU API DE PRODUCCIÓN
  cameraBaseUrl: 'http://192.168.1.64',
  plateImageBaseUrl: 'http://192.168.1.120',
  defaultPlayaImageUrl: 'https://concepto.de/wp-content/uploads/2015/03/paisaje-2-e1549600987975.jpg'
};
```

## 🚀 Comandos de Build

### Desarrollo
```bash
ng serve
# o
ng build --configuration=development
```

### Producción
```bash
ng build --configuration=production
```

## 🔧 Cómo Funciona

1. **Desarrollo**: Angular usa `environment.ts`
2. **Producción**: Angular automáticamente reemplaza `environment.ts` con `environment.prod.ts`
3. **URLs Dinámicas**: Todos los servicios construyen URLs usando estas variables base

## 📝 Ejemplo de Uso en Servicios

```typescript
import { environment } from '../../environments/environment';

@Injectable()
export class MiServicio {
  private apiUrl = `${environment.apiBaseUrl}/mi-endpoint`;
  
  getData() {
    return this.http.get(`${environment.apiBaseUrl}/datos`);
  }
}
```

## ⚠️ Importante

- **NO** uses archivos `.env` - Angular no los soporta nativamente
- **SÍ** modifica los archivos de environment según tu entorno
- **Cambia** `apiBaseUrl` en producción por tu URL real
- **Mantén** las URLs base simples y construye endpoints dinámicamente