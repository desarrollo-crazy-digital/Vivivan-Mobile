import client from './client';
import { Contrato, Comercializadora, Producto, DocumentoContrato } from '../types/db.types';

export interface ContratosResponse {
  total: number;
  contratos: any[];
  page: number;
  page_size: number;
}

export interface CupsVerificarResponse {
  existe: boolean;
  cups: string;
  direccion?: string;
  codigo_postal?: string;
  poblacion?: string;
  provincia?: string;
  total_contratos: number;
  contrato_activo?: any;
  permite_nuevo_contrato: boolean;
  advertencia: boolean;
}

export interface SipsInfoResponse {
  cups: string;
  found: boolean;
  nombre_via?: string;
  numero?: string;
  codigo_postal?: string;
  poblacion?: string;
  provincia?: string;
  annualKwh: number;
  message?: string;
  potencias?: {
    p1?: number;
    p2?: number;
    p3?: number;
    p4?: number;
    p5?: number;
    p6?: number;
  };
}

export const contratosService = {
  getContratos: async (params: {
    codigo_comercial?: number;
    cliente?: string;
    cups?: string;
    dni?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    limit?: number;
    skip?: number;
  }): Promise<ContratosResponse> => {
    const response = await client.get<ContratosResponse>('/api/contratos', { params });
    return response.data;
  },

  getContratoById: async (id: string): Promise<Contrato & { cliente_nombre?: string; punto_suministro?: any; documentos_rel?: DocumentoContrato[] }> => {
    const response = await client.get<Contrato & { cliente_nombre?: string; punto_suministro?: any; documentos_rel?: DocumentoContrato[] }>(`/api/contratos/${id}`);
    return response.data;
  },

  getContratoCompleto: async (id: string): Promise<any> => {
    const response = await client.get<any>(`/api/contratos/${id}/completo`);
    return response.data;
  },

  actualizarContrato: async (id: string, payload: any): Promise<any> => {
    const response = await client.put<any>(`/api/contratos/${id}/completo`, payload);
    return response.data;
  },

  getComercializadoras: async (): Promise<Comercializadora[]> => {
    const response = await client.get<Comercializadora[]>('/api/comercializadoras');
    return response.data;
  },

  getEstados: async (): Promise<{ id: number; label: string; categoria?: string; comercializadora_id?: string }[]> => {
    const response = await client.get<{ id: number; label: string; categoria?: string; comercializadora_id?: string }[]>('/api/estados');
    return response.data;
  },

  getProductosPorComercializadora: async (comercializadoraId: string, tarifa?: string): Promise<Producto[]> => {
    const response = await client.get<Producto[]>(`/api/comercializadoras/${comercializadoraId}/productos`, {
      params: { tarifa },
    });
    return response.data;
  },

  verificarCupsLocal: async (cups: string): Promise<CupsVerificarResponse> => {
    const response = await client.get<CupsVerificarResponse>(`/api/cups/verificar/${cups}`);
    return response.data;
  },

  consultarCupsSips: async (cups: string): Promise<SipsInfoResponse> => {
    const response = await client.get<SipsInfoResponse>(`/api/sips/${cups}`);
    return response.data;
  },

  crearContrato: async (payload: {
    cliente: any;
    direccion_fiscal?: any;
    direccion_facturacion?: any;
    punto_suministro?: any;
    contrato: any;
  }): Promise<{ status: string; contrato_id: string; cliente_id: string; id_iban?: string }> => {
    const response = await client.post<{ status: string; contrato_id: string; cliente_id: string; id_iban?: string }>(
      '/api/contratos/crear',
      payload
    );
    return response.data;
  },

  uploadDocumento: async (
    contratoId: string,
    fileUri: string,
    fileName: string,
    fileMimeType: string,
    tipoDocumento: string = 'Firma'
  ): Promise<any> => {
    const formData = new FormData();
    // In React Native FormData, appending a file requires an object structure
    formData.append('files', {
      uri: fileUri,
      name: fileName,
      type: fileMimeType,
    } as any);
    formData.append('tipo_documento', tipoDocumento);

    const response = await client.post(`/api/contratos/${contratoId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  analyzeInvoiceOCR: async (
    fileUri: string,
    fileName: string,
    fileMimeType: string
  ): Promise<{ success: boolean; data: any }> => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: fileMimeType,
    } as any);

    const response = await client.post<{ success: boolean; data: any }>('/api/ocr/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  analyzeContractOCR: async (
    fileUri: string,
    fileName: string,
    fileMimeType: string
  ): Promise<{ success: boolean; data: any; txt?: string }> => {
    const formData = new FormData();
    formData.append('files', {
      uri: fileUri,
      name: fileName,
      type: fileMimeType,
    } as any);

    const response = await client.post<{ success: boolean; data: any; txt?: string }>('/api/ocr/contrato-desde-archivos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
