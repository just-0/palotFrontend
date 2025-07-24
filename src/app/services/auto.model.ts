export interface Auto {
    id_auto: number;
    id_playa: number;
    placa: string;
    hora_entrada: string; // Almacena el timestamp como cadena
    hora_salida: string;  // Almacena el timestamp como cadena
    state: number;
    image?: string;        // Almacena la URL de la imagen
  }
export interface Moto {
    id_moto: number;
    id_playa: number;
    placa: string;
    hora_entrada: string; // Almacena el timestamp como cadena
    hora_salida: string;  // Almacena el timestamp como cadena
    state: number;
    image?: string;        // Almacena la URL de la imagen
  }