// Database types reflecting Vivivan DB schema

export type RoleUsuario = 'comercial' | 'jefe_equipo' | 'observador' | 'backoffice' | 'administracion' | 'master';

export type MetodoPago = 'DOMICILIACION' | 'TRANSFERENCIA' | 'TARJETA';

export interface User {
  id_user: string; // UUID
  nombre: string;
  apellidos: string;
  nif_cif?: string;
  email: string;
  codigo: number;
  role: RoleUsuario;
  telefono?: string;
  is_active: boolean;
  modulos_accesibles?: string[];
  supervisor_codigo?: number;
  supervisor_porcentaje?: number;
  director_comercial_codigo?: number;
  observador_codigo?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id: string; // UUID
  nombre: string;
  nif_cif: string;
  email?: string;
  movil: string;
  telefono?: string;
  metodo_pago?: MetodoPago;
  iban: string;
  exento_iva?: boolean;
  cnae?: string;
  nombre_firmante: string;
  apellidos_firmante: string;
  fecha_nacimiento_firmante: string; // ISO date string
  nif_cif_firmante: string;
  telefono_firmante?: string;
  movil_firmante: string;
  email_firmante: string;
  codigo_comercial: number;
  codigo_otros_repres?: number;
  created_at?: string;
  updated_at?: string;
  es_empresa: boolean;
  fecha_nacimiento?: string;
}

export interface Contrato {
  id: string; // UUID
  id_cliente: string;
  codigo_comercial: number;
  codigo_comercial_2?: number;
  fecha_creacion?: string;
  fecha_registro?: string;
  fecha_firma: string;
  cambio_titular?: boolean;
  cambio_potencia?: boolean;
  tipo_alta: string;
  grabacion_voz?: string;
  nivel_comision?: 'Colaborador' | 'Supervisor' | 'Distribuidor';
  nivel_comision_2?: string;
  verificado?: boolean;
  goh?: number;
  codigo_contrato?: number;
  tarifa: string;
  id_producto: string;
  p1?: number;
  p2?: number;
  p3?: number;
  p4?: number;
  p5?: number;
  p6?: number;
  consumo_sips?: number;
  fecha_alta?: string;
  fecha_vencimiento?: string;
  fecha_baja?: string;
  id_comision?: string;
  n_certificacion?: string;
  autofactura?: string;
  documentos?: string;
  observaciones_contrato?: string;
  observaciones_internas?: string;
  log?: string;
  id_comisiones_estados: string;
  id_estado_comercializadora?: number;
  tipo_suministro?: 'Luz' | 'Gas';
  comercializadora_id?: string;
  comercializadora_nombre?: string;
  producto_nombre?: string;
  firma?: string;
  tipo_firma?: string;
  estado?: string;
}

export interface Direccion {
  id: string; // UUID of the contrato
  cliente_id?: string;
  tipo_direcion: 'Suministro' | 'Fiscal' | 'Envio';
  nombre_via?: string;
  numero?: string;
  puerta?: string;
  piso?: string;
  aclarador?: string;
  codigo_postal?: string;
  poblacion?: string;
  provincia?: string;
  pais?: string;
  cups?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Comercializadora {
  id: string;
  nombre: string;
  nif_cif?: string;
  telefono?: string;
  email?: string;
  activa: boolean;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  activo: boolean;
  id_comercializadora: string;
  created_at?: string;
  updated_at?: string;
}

export interface EstadoComercializadora {
  id: number;
  id_comercializadora: string;
  estado: string;
  categoria_global: 'estimada' | 'activado' | 'renovado' | 'baja' | 'ko';
  created_at?: string;
  updated_at?: string;
}

export interface DocumentoContrato {
  id: string;
  contrato_id: string;
  nombre_archivo: string;
  tipo_documento: string;
  ruta_archivo: string;
  fecha_subida?: string;
}
