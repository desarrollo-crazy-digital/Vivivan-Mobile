import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { contratosService } from '../../../src/api/contratos.service';
import { authService } from '../../../src/api/auth.service';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { ComisionEstimadaViewer } from '../../../src/components/contratos/ComisionEstimadaViewer';

export default function ContratoDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('Cliente');

  // Fetch current user details
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
  });

  const { data: contractData, isLoading, error } = useQuery({
    queryKey: ['contrato', id],
    queryFn: () => contratosService.getContratoById(id),
    enabled: !!id,
  });

  const contract = contractData as any;

  const handleShare = async () => {
    if (!contract) return;
    try {
      await Share.share({
        message: `Contrato Vivivan #${contract.codigo_contrato || contract.id.substring(0, 8)}:
Cliente: ${contract.cliente_nombre || '—'}
CUPS: ${contract.punto_suministro?.cups || '—'}
Estado: ${contract.estado || 'Borrador'}`,
      });
    } catch (e) {
      console.warn('Error sharing contract', e);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-slate-400 text-sm mt-3">Cargando detalles...</Text>
      </View>
    );
  }

  if (error || !contract) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 p-6">
        <Text className="text-red-500 font-bold text-base text-center">
          No se ha podido cargar la información de este contrato.
        </Text>
        <Button title="Volver al Listado" onPress={() => router.back()} className="mt-4" />
      </View>
    );
  }

  const pSum = contract.punto_suministro || {};

  // Compute tabs matching CRM logic
  const isComercial = user?.role === 'comercial';
  const canVerComisiones = user?.role === 'master' || (user?.modulos_accesibles || []).includes('VerComisiones');
  const isAdministrativo = user?.role === 'admin' || user?.role === 'administracion';
  const isBackoffice = user?.role === 'backoffice';

  const tabs = ['Cliente', 'Dirección', 'Contratación', 'Vigencia', 'Info Comercial'];

  // Paso 6: Comisiones
  const showComisiones = canVerComisiones && !( !isComercial && (isAdministrativo || isBackoffice) );
  if (showComisiones) {
    tabs.push('Comisiones');
  }

  // Paso 7: Facturación (visible only to admin/backoffice/master, hidden for commercial)
  if (!isComercial) {
    tabs.push('Facturación');
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Quick Summary Header */}
      <View className="bg-slate-900 p-6 rounded-b-[24px] shadow-lg shadow-slate-900/10">
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text className="text-xs text-blue-400 font-bold uppercase tracking-wider">
              Código Contrato
            </Text>
            <Text className="text-white text-2xl font-bold">
              #{contract.codigo_contrato || contract.id.substring(0, 8)}
            </Text>
          </View>
          <Badge status={contract.estado || 'Borrador'} />
        </View>

        <Text className="text-slate-300 text-sm mt-2">
          Creado el: {contract.fecha_creacion ? new Date(contract.fecha_creacion).toLocaleDateString('es-ES') : '—'}
        </Text>

        <View className="flex-row mt-4">
          <Button
            title="Compartir Ficha"
            variant="outline"
            onPress={handleShare}
            className="flex-grow border-blue-400 py-2"
          />
        </View>
      </View>

      {/* Tabs Selector Bar */}
      <View className="bg-white border-b border-slate-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          {tabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full mr-2 border ${
                  active ? 'bg-slate-900 border-slate-900' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-600'}`}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Contents */}
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {activeTab === 'Cliente' && (
          <Card title="Datos del Cliente">
            <View className="space-y-3">
              <View className="flex-row justify-between py-1 border-b border-slate-50">
                <Text className="text-xs text-slate-400 font-bold uppercase">Nombre/Razón Social</Text>
                <Text className="text-xs text-slate-700 font-semibold">{contract.cliente_nombre || '—'}</Text>
              </View>
              <View className="flex-row justify-between py-1 border-b border-slate-50">
                <Text className="text-xs text-slate-400 font-bold uppercase">NIF/CIF</Text>
                <Text className="text-xs text-slate-700 font-semibold">{contract.dni || '—'}</Text>
              </View>
              {contract.cliente && (
                <>
                  <View className="flex-row justify-between py-1 border-b border-slate-50">
                    <Text className="text-xs text-slate-400 font-bold uppercase">Móvil</Text>
                    <Text className="text-xs text-slate-700 font-semibold">{(contract.cliente as any).movil || '—'}</Text>
                  </View>
                  <View className="flex-row justify-between py-1 border-b border-slate-50">
                    <Text className="text-xs text-slate-400 font-bold uppercase">IBAN</Text>
                    <Text className="text-xs text-slate-700 font-semibold truncate max-w-[200px]">{(contract.cliente as any).iban || '—'}</Text>
                  </View>
                  <View className="flex-row justify-between py-1 border-b border-slate-50">
                    <Text className="text-xs text-slate-400 font-bold uppercase">Método Pago</Text>
                    <Text className="text-xs text-slate-700 font-semibold">{(contract.cliente as any).metodo_pago || 'DOMICILIACION'}</Text>
                  </View>
                  {/* Firmante */}
                  <View className="border-t border-slate-100 my-2 pt-2" />
                  <View className="flex-row justify-between py-1 border-b border-slate-50">
                    <Text className="text-xs text-slate-400 font-bold uppercase">Firmante</Text>
                    <Text className="text-xs text-slate-700 font-semibold">{(contract.cliente as any).nombre_firmante || '—'} {(contract.cliente as any).apellidos_firmante || ''}</Text>
                  </View>
                  <View className="flex-row justify-between py-1">
                    <Text className="text-xs text-slate-400 font-bold uppercase">NIF Firmante</Text>
                    <Text className="text-xs text-slate-700 font-semibold">{(contract.cliente as any).nif_cif_firmante || '—'}</Text>
                  </View>
                </>
              )}
            </View>
          </Card>
        )}

        {activeTab === 'Dirección' && (
          <Card title="Dirección de Suministro">
            <View className="space-y-3">
              <View className="flex-row justify-between py-1 border-b border-slate-50">
                <Text className="text-xs text-slate-400 font-bold uppercase">CUPS</Text>
                <Text className="text-xs text-slate-700 font-semibold">{pSum.cups || '—'}</Text>
              </View>
              <View className="flex-row justify-between py-1 border-b border-slate-50">
                <Text className="text-xs text-slate-400 font-bold uppercase">Vía/Calle</Text>
                <Text className="text-xs text-slate-700 font-semibold">{pSum.nombre_via || '—'}</Text>
              </View>
              <View className="flex-row justify-between py-1 border-b border-slate-50">
                <Text className="text-xs text-slate-400 font-bold uppercase">Número</Text>
                <Text className="text-xs text-slate-700 font-semibold">{pSum.numero || '—'}</Text>
              </View>
              <View className="flex-row justify-between py-1 border-b border-slate-50">
                <Text className="text-xs text-slate-400 font-bold uppercase">Código Postal</Text>
                <Text className="text-xs text-slate-700 font-semibold">{pSum.codigo_postal || '—'}</Text>
              </View>
              <View className="flex-row justify-between py-1 border-b border-slate-50">
                <Text className="text-xs text-slate-400 font-bold uppercase">Población</Text>
                <Text className="text-xs text-slate-700 font-semibold">{pSum.poblacion || '—'}</Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className="text-xs text-slate-400 font-bold uppercase">Provincia</Text>
                <Text className="text-xs text-slate-700 font-semibold">{pSum.provincia || '—'}</Text>
              </View>
            </View>
          </Card>
        )}

        {activeTab === 'Contratación' && (
          <View>
            <Card title="Parámetros de Oferta">
              <View className="space-y-3">
                <View className="flex-row justify-between py-1 border-b border-slate-50">
                  <Text className="text-xs text-slate-400 font-bold uppercase">Comercializadora</Text>
                  <Text className="text-xs text-slate-700 font-semibold">{contract.comercializadora || '—'}</Text>
                </View>
                <View className="flex-row justify-between py-1 border-b border-slate-50">
                  <Text className="text-xs text-slate-400 font-bold uppercase">Producto</Text>
                  <Text className="text-xs text-slate-700 font-semibold">{contract.producto || '—'}</Text>
                </View>
                <View className="flex-row justify-between py-1 border-b border-slate-50">
                  <Text className="text-xs text-slate-400 font-bold uppercase">Tarifa</Text>
                  <Text className="text-xs text-slate-700 font-semibold">{contract.tarifa || '—'}</Text>
                </View>
                <View className="flex-row justify-between py-1 border-b border-slate-50">
                  <Text className="text-xs text-slate-400 font-bold uppercase">Suministro</Text>
                  <Text className="text-xs text-slate-700 font-semibold">{contract.suministro || 'Luz'}</Text>
                </View>
                <View className="flex-row justify-between py-1 border-b border-slate-50">
                  <Text className="text-xs text-slate-400 font-bold uppercase">Tipo Alta</Text>
                  <Text className="text-xs text-slate-700 font-semibold">{contract.tipo_alta || 'Nueva'}</Text>
                </View>
                <View className="flex-row justify-between py-1 border-b border-slate-50">
                  <Text className="text-xs text-slate-400 font-bold uppercase">Cambio Titular</Text>
                  <Text className="text-xs text-slate-700 font-semibold">{contract.cambio_titular ? 'Sí' : 'No'}</Text>
                </View>
                <View className="flex-row justify-between py-1">
                  <Text className="text-xs text-slate-400 font-bold uppercase">Cambio Potencia</Text>
                  <Text className="text-xs text-slate-700 font-semibold">{contract.cambio_potencia ? 'Sí' : 'No'}</Text>
                </View>
              </View>
            </Card>

            <Card title="Potencias Contratadas (kW)">
              <View className="flex-row justify-between flex-wrap">
                <View className="w-1/3 mb-2">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">P1</Text>
                  <Text className="text-sm text-slate-700 font-semibold">{contract.p1 ? `${contract.p1} kW` : '—'}</Text>
                </View>
                <View className="w-1/3 mb-2">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">P2</Text>
                  <Text className="text-sm text-slate-700 font-semibold">{contract.p2 ? `${contract.p2} kW` : '—'}</Text>
                </View>
                <View className="w-1/3 mb-2">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">P3</Text>
                  <Text className="text-sm text-slate-700 font-semibold">{contract.p3 ? `${contract.p3} kW` : '—'}</Text>
                </View>
                <View className="w-1/3">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">P4</Text>
                  <Text className="text-sm text-slate-700 font-semibold">{contract.p4 ? `${contract.p4} kW` : '—'}</Text>
                </View>
                <View className="w-1/3">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">P5</Text>
                  <Text className="text-sm text-slate-700 font-semibold">{contract.p5 ? `${contract.p5} kW` : '—'}</Text>
                </View>
                <View className="w-1/3">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">P6</Text>
                  <Text className="text-sm text-slate-700 font-semibold">{contract.p6 ? `${contract.p6} kW` : '—'}</Text>
                </View>
              </View>

              <View className="border-t border-slate-100 my-3 pt-3" />

              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-400 font-bold uppercase">Consumo SIPS Estimado</Text>
                <Text className="text-xs text-slate-700 font-semibold">
                  {contract.consumo_sips ? `${contract.consumo_sips.toLocaleString()} kWh` : '—'}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {activeTab === 'Vigencia' && (
          <Card title="Vigencia y Plazos">
            <View className="space-y-3">
              <View className="flex-row justify-between py-1 border-b border-slate-50">
                <Text className="text-xs text-slate-400 font-bold uppercase">Fecha de Registro</Text>
                <Text className="text-xs text-slate-700 font-semibold">
                  {contract.fecha_registro ? new Date(contract.fecha_registro).toLocaleDateString('es-ES') : '—'}
                </Text>
              </View>
              <View className="flex-row justify-between py-1 border-b border-slate-50">
                <Text className="text-xs text-slate-400 font-bold uppercase">Fecha de Firma</Text>
                <Text className="text-xs text-slate-700 font-semibold">
                  {contract.fecha_firma ? new Date(contract.fecha_firma).toLocaleDateString('es-ES') : '—'}
                </Text>
              </View>
              <View className="flex-row justify-between py-1 border-b border-slate-50">
                <Text className="text-xs text-slate-400 font-bold uppercase">Fecha de Alta</Text>
                <Text className="text-xs text-slate-700 font-semibold">
                  {contract.fecha_alta ? new Date(contract.fecha_alta).toLocaleDateString('es-ES') : '—'}
                </Text>
              </View>
              <View className="flex-row justify-between py-1 border-b border-slate-50">
                <Text className="text-xs text-slate-400 font-bold uppercase">Fecha de Vencimiento</Text>
                <Text className="text-xs text-slate-700 font-semibold">
                  {contract.fecha_vencimiento ? new Date(contract.fecha_vencimiento).toLocaleDateString('es-ES') : '—'}
                </Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className="text-xs text-slate-400 font-bold uppercase">Fecha de Baja</Text>
                <Text className="text-xs text-slate-700 font-semibold">
                  {contract.fecha_baja ? new Date(contract.fecha_baja).toLocaleDateString('es-ES') : '—'}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {activeTab === 'Info Comercial' && (
          <View>
            <Card title="Observaciones e Historial">
              <View className="mb-3">
                <Text className="text-xs text-slate-400 font-bold uppercase mb-1">Observaciones Contrato</Text>
                <Text className="text-xs text-slate-700 leading-normal">{contract.observaciones_contrato || '—'}</Text>
              </View>
              <View className="border-t border-slate-100 pt-3">
                <Text className="text-xs text-slate-400 font-bold uppercase mb-1">Observaciones Internas</Text>
                <Text className="text-xs text-slate-700 leading-normal">{contract.observaciones_internas || '—'}</Text>
              </View>
            </Card>

            <Card title="Documentación y Adjuntos">
              {contract.documentos_rel && contract.documentos_rel.length > 0 ? (
                contract.documentos_rel.map((doc, idx) => (
                  <View key={doc.id || idx} className="flex-row justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                    <View>
                      <Text className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{doc.nombre_archivo}</Text>
                      <Text className="text-[10px] text-slate-400">
                        Tipo: {doc.tipo_documento} | Subido:{' '}
                        {doc.fecha_subida ? new Date(doc.fecha_subida).toLocaleDateString('es-ES') : '—'}
                      </Text>
                    </View>
                    <Text className="text-xs text-blue-500 font-semibold">Cargado</Text>
                  </View>
                ))
              ) : (
                <Text className="text-slate-400 text-xs text-center py-3">
                  No hay documentos adjuntos a este contrato.
                </Text>
              )}
            </Card>
          </View>
        )}

        {activeTab === 'Comisiones' && (
          <View>
            <ComisionEstimadaViewer contrato={contract} user={user} />
            <Card title="Comisión de Venta del Contrato">
              <View className="space-y-3">
                <View className="flex-row justify-between py-1 border-b border-slate-50">
                  <Text className="text-xs text-slate-400 font-bold uppercase">Porcentaje Comisión</Text>
                  <Text className="text-xs text-emerald-600 font-bold">
                    {contract.id_comision ? 'Asignado' : 'Pendiente de cálculo'}
                  </Text>
                </View>
                <View className="flex-row justify-between py-1 border-b border-slate-50">
                  <Text className="text-xs text-slate-400 font-bold uppercase">Estado Comisión Estados</Text>
                  <Text className="text-xs text-slate-700 font-semibold">{contract.id_comisiones_estados || 'Pendiente'}</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {activeTab === 'Facturación' && (
          <Card title="Facturas de Clientes">
            <Text className="text-slate-400 text-xs text-center py-6">
              No hay liquidaciones ni autofacturas generadas para este contrato.
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
