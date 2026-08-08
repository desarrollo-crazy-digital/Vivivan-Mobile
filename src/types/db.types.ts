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
  tipo_cliente?: string;
  mostrar_direccion_fiscal?: boolean;
  mostrar_direccion_facturacion?: boolean;
  fecha_nacimiento?: string;
  es_sandbox?: boolean;
  log?: string;
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
  codigo_contrato?: string;
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
  comercial_id?: string;
  comercializadora?: string;
  comercializadora_id?: string;
  comercializadora_nombre?: string;
  producto_nombre?: string;
  firma?: string;
  tipo_firma?: string;
  estado?: string;

  // Campos adicionales añadidos para paridad
  es_sandbox?: boolean;
  consumo_anual?: number;
  consumo_comercializadora?: number;
  fecha_alta_liquidacion?: string;
  fecha_activacion_futura?: string;
  tension?: string;
  tipo_factura?: string;
  en_vuelo?: boolean;
  id_contrato?: string;
  excluir_liquidacion?: boolean;
  pago_fraccionado?: boolean;
  bateria_virtual?: boolean;
  multipunto?: boolean;
  numero_contrato_comercializadora?: string;
  importe_servicio_1?: number;
  importe_servicio_2?: number;
  observaciones_liquidacion?: string;
  seguimiento_interno?: string;
  renovacion_ignorada?: boolean;
  id_iban?: string;
  id_sistema_decomision?: number;
  decomision_snapshot?: any;
  origen_crm?: string;
  id_contrato_loviluz?: string;
  excluir_estadisticas?: boolean;

  // Campos calculados y comisionado
  comision_base?: number;
  porcentaje_comision?: number;
  comision_comercial?: number;
  comision_estimada?: number;
  beneficio_vivivan?: number;
  comision_supervisor?: number;
  comision_neta_comercial?: number;
  supervisor_nombre?: string;
  supervisor_codigo?: number;
  decomision_supervisor?: number;
  nombre_servicio_1?: string;
  nombre_servicio_2?: string;
  estado_servicio?: boolean;
  fecha_servicio?: string;
  fecha_servicio_updated?: string;
  cobrado?: boolean;
  pagado?: boolean;
  decomision_vivivan?: number;
  decomisionado_vivivan?: boolean;
  decomision_comercial?: number;
  decomisionado_comercial?: boolean;
}

export interface Direccion {
  id: string; // UUID of the contrato
  id_direcion?: string; // PK real
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
  referencia_catastral?: string;
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

export interface ComisionesEstado {
  id: string;
  cobrado: boolean;
  fecha_cobrado?: string;
  pagado: boolean;
  fecha_pagado?: string;
  liquidado: boolean;
  fecha_liquidado?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CuentaBancaria {
  id: string;
  nombre_cuenta?: string;
  iban: string;
  id_cliente: string;
  created_at?: string;
}
