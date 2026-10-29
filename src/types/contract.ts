export interface ContratoPayload {
  codigo_unico: string;
  vertical: string;
  ecosistema_portal: string;
  es_piloto: boolean;
  nombre_comercial: string;
  ruc_cedula: string;
  representante_legal: string;
  direccion: string;
  canton: string;
  whatsapp: string;
  email?: string;
  modalidad_plan: string;
  subtotal: number;
  iva: number;
  recargo_pasarela: number;
  total_cobrado: number;
  metodo_pago: string;
  dominio_web?: string;
  carta_recogida?: boolean;
  menu_fotos_urls?: string[]; // URLs en BunnyCDN
  pdf_base64?: string;
}

export interface CuposResponse {
  gastro: { ocupados: number; limite: number };
  hotelesSm: { ocupados: number; limite: number };
  operadores: { ocupados: number; limite: number };
}
