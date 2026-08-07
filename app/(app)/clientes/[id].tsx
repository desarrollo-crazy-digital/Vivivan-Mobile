import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { clientesService } from '../../../src/api/clientes.service';
import { contratosService } from '../../../src/api/contratos.service';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';

export default function ClienteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // 1. Fetch client detail
  // Note: we can look up clients by NIF, or search them in the client list.
  // In our service, we can search the specific client inside local results or fetch.
  // Let's call the search list by client ID or query by NIF.
  // Wait, is there a direct GET /clientes/{id} endpoint? Let's check main.py.
  // We saw PUT /clientes/{cliente_id}. Let's check if there is a GET /clientes/{id}.
  // In main.py, let's look for @app.get("/clientes/{id}"). Let's check if it exists.
  // If not, we can load all clients and filter by id, or search by NIF.
  // Let's do a search by DNI/NIF or query client list filtering by id!
  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      if (!id) return null;
      // Fetch via leer_clientes list filtering
      const list = await clientesService.buscarClientes('');
      const found = list.find((c) => c.id === id);
      return found || null;
    },
    enabled: !!id,
  });

  // 2. Fetch contract history for this client
  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ['cliente-contratos', client?.nif_cif],
    queryFn: () => {
      if (!client?.nif_cif) return { total: 0, contratos: [] };
      return contratosService.getContratos({ dni: client.nif_cif });
    },
    enabled: !!client?.nif_cif,
  });

  if (loadingClient) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-slate-400 text-sm mt-3">Cargando ficha...</Text>
      </View>
    );
  }

  if (!client) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 p-6">
        <Text className="text-red-500 font-bold text-base text-center">
          No se ha encontrado el expediente de este cliente.
        </Text>
        <Button title="Volver atrás" onPress={() => router.back()} className="mt-4" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      {/* Header card */}
      <View className="mb-6">
        <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">Expediente Comercial</Text>
        <Text className="text-slate-900 text-2xl font-bold mt-0.5">{client.nombre}</Text>
        <Text className="text-slate-500 text-sm">
          NIF/CIF: {client.nif_cif} | {client.es_empresa ? 'Empresa' : 'Particular'}
        </Text>
      </View>

      {/* Basic Contact Info */}
      <Card title="Datos de Contacto">
        <View className="space-y-3">
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400 font-bold uppercase">Móvil</Text>
            <Text className="text-xs text-slate-700 font-semibold">{client.movil || '—'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400 font-bold uppercase">Teléfono Fijo</Text>
            <Text className="text-xs text-slate-700 font-semibold">{client.telefono || '—'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400 font-bold uppercase">Email</Text>
            <Text className="text-xs text-slate-700 font-semibold truncate max-w-[220px]">
              {client.email || '—'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400 font-bold uppercase">Código CNAE</Text>
            <Text className="text-xs text-slate-700 font-semibold">{client.cnae || '—'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400 font-bold uppercase">Exento IVA</Text>
            <Text className="text-xs text-slate-700 font-semibold">{client.exento_iva ? 'Sí' : 'No'}</Text>
          </View>
        </View>
      </Card>

      {/* Firmante Info */}
      <Card title="Representante / Firmante">
        <View className="space-y-3">
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400 font-bold uppercase">Firmante</Text>
            <Text className="text-xs text-slate-700 font-semibold">
              {client.nombre_firmante} {client.apellidos_firmante}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400 font-bold uppercase">NIF Representante</Text>
            <Text className="text-xs text-slate-700 font-semibold">{client.nif_cif_firmante || '—'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400 font-bold uppercase">Móvil Firmante</Text>
            <Text className="text-xs text-slate-700 font-semibold">{client.movil_firmante || '—'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400 font-bold uppercase">Email Firmante</Text>
            <Text className="text-xs text-slate-700 font-semibold truncate max-w-[220px]">
              {client.email_firmante || '—'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400 font-bold uppercase">Fecha Nacimiento</Text>
            <Text className="text-xs text-slate-700 font-semibold">
              {client.fecha_nacimiento_firmante
                ? new Date(client.fecha_nacimiento_firmante).toLocaleDateString('es-ES')
                : '—'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Bank Details */}
      <Card title="Datos de Facturación">
        <View className="space-y-3">
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400 font-bold uppercase">Método Pago</Text>
            <Text className="text-xs text-slate-700 font-semibold">
              {client.metodo_pago || 'DOMICILIACION'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400 font-bold uppercase">Cuenta Bancaria IBAN</Text>
            <Text className="text-xs text-slate-700 font-semibold truncate max-w-[220px]">
              {client.iban || '—'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Contract History List */}
      <Card title="Historial de Contratos">
        {loadingContracts ? (
          <ActivityIndicator size="small" color="#2563EB" />
        ) : contractsData?.contratos && contractsData.contratos.length > 0 ? (
          contractsData.contratos.map((item, idx) => (
            <TouchableOpacity
              key={item.id || idx}
              onPress={() => router.push(`/(app)/contratos/${item.id}`)}
              className="flex-row justify-between items-center py-2.5 border-b border-slate-50 last:border-0"
            >
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-800">
                  {item.comercializadora || '—'} - {item.tarifa || '—'}
                </Text>
                <Text className="text-[10px] text-slate-400 truncate max-w-[200px]">
                  CUPS: {item.cups || '—'}
                </Text>
              </View>
              <Badge status={item.estado || 'Borrador'} />
            </TouchableOpacity>
          ))
        ) : (
          <Text className="text-slate-400 text-xs text-center py-3">
            Este cliente no tiene contratos tramitados.
          </Text>
        )}
      </Card>

      <Button title="Volver al Listado" variant="secondary" onPress={() => router.back()} className="mt-4" />
    </ScrollView>
  );
}
