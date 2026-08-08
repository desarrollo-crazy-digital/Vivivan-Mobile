import client from './client';
import { Cliente } from '../types/db.types';

export interface SearchClientesResponse {
  total?: number;
  clientes: Cliente[];
}

export const clientesService = {
  buscarClientes: async (searchTerm: string, limit: number = 20): Promise<Cliente[]> => {
    const cleanTerm = searchTerm.trim();
    if (!cleanTerm || cleanTerm.length < 2) return [];

    const endpoints = [
      '/api/clientes',
      '/api/clientes/',
      '/clientes/',
      '/api/contactos',
      '/api/clientes/buscar',
    ];

    const paramList = [
      { search: cleanTerm, limit },
      { q: cleanTerm, limit },
      { dni_cif: cleanTerm, limit },
      { nombre: cleanTerm, limit },
      { nif_cif: cleanTerm, limit },
      { cliente: cleanTerm, limit },
    ];

    for (const ep of endpoints) {
      for (const params of paramList) {
        try {
          const response = await client.get(ep, { params });
          const data = response.data;
          const list = Array.isArray(data)
            ? data
            : (data?.clientes || data?.items || data?.data || data?.results || []);

          if (Array.isArray(list) && list.length > 0) {
            return list;
          }
        } catch (e) {
          // Continuar al siguiente endpoint/parámetro si falla
        }
      }
    }

    // Fallback secundario: Buscar contratos con ese nombre/NIF para extraer la ficha del cliente
    try {
      const response = await client.get('/api/contratos', {
        params: { cliente: cleanTerm, dni: cleanTerm, limit },
      });
      const data = response.data;
      const contratos = Array.isArray(data) ? data : (data?.contratos || []);
      const extractedClientes: Cliente[] = [];
      const seenIds = new Set<string>();

      for (const c of contratos) {
        const cId = c.id_cliente || c.cliente_id || c.cliente?.id;
        const cNombre = c.cliente_nombre || c.cliente?.nombre || c.titular;
        const cNif = c.dni_cif || c.nif_cif || c.cliente?.nif_cif;

        if (cNombre && !seenIds.has(cId || cNombre)) {
          seenIds.add(cId || cNombre);
          extractedClientes.push({
            id: cId,
            nombre: cNombre,
            nif_cif: cNif,
            movil: c.movil || c.telefono || c.cliente?.movil || '',
            email: c.email || c.cliente?.email || '',
            iban: c.iban || c.id_iban || '',
            es_empresa: false,
          } as Cliente);
        }
      }
      return extractedClientes;
    } catch (e) {
      // Ignore
    }

    return [];
  },

  buscarClientePorNifLocal: async (nif: string): Promise<{ encontrado: boolean; cliente_id?: string; [key: string]: any }> => {
    const response = await client.get<{ encontrado: boolean; cliente_id?: string; [key: string]: any }>(
      `/api/contactos/buscar-nif/${nif}`
    );
    return response.data;
  },

  upsertClienteSolo: async (clientePayload: Partial<Cliente> & { tipo_cliente?: string }): Promise<{
    status: string;
    cliente_id: string;
    id_iban?: string;
    mensaje: string;
  }> => {
    // Map es_empresa boolean to tipo_cliente parameter for upsert_cliente_solo
    const mappedPayload = {
      ...clientePayload,
      tipo_cliente: clientePayload.es_empresa ? 'Empresa' : 'Particular',
    };
    const response = await client.post<{
      status: string;
      cliente_id: string;
      id_iban?: string;
      mensaje: string;
    }>('/api/clientes/upsert-solo', mappedPayload);
    return response.data;
  },

  getClientDocuments: async (clienteId: string): Promise<Array<{ id: string; nombre: string; tipo: string; fecha_subida: string; url: string }>> => {
    try {
      const response = await client.get(`/api/client-docs/${clienteId}/list`);
      return response.data || [];
    } catch (e) {
      console.warn('Error loading client documents:', e);
      return [];
    }
  },

  uploadClientDocument: async (clienteId: string, fileUri: string, fileName: string, fileType: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: fileType || 'application/pdf',
    } as any);
    formData.append('tipo', 'Otros');
    const response = await client.post(`/api/client-docs/${clienteId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
