import client from './client';
import { Cliente } from '../types/db.types';

export interface SearchClientesResponse {
  total?: number;
  clientes: Cliente[];
}

export const clientesService = {
  buscarClientes: async (searchTerm: string, limit: number = 20): Promise<Cliente[]> => {
    // In leer_clientes endpoint (main.py):
    // query is filtered by dni_cif param which checks nif_cif, nombre, and movil.
    const response = await client.get<Cliente[]>('/clientes/', {
      params: {
        dni_cif: searchTerm,
        limit,
      },
    });
    return response.data;
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
};
