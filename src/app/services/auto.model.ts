export interface Auto {
    id_auto: number;
    id_playa: number;
    placa: string;
    hora_entrada: string; // Almacena el timestamp como cadena
    hora_salida: string;  // Almacena el timestamp como cadena
    state: number;
    img?: string;          // Almacena la imagen en base64 como cadena
  }