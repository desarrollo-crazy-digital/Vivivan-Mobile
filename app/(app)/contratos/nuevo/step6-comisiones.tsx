import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../../../src/store/useWizardStore';
import client from '../../../../src/api/client';
import { Card } from '../../../../src/components/ui/Card';
import { Button } from '../../../../src/components/ui/Button';

export default function Step6Comisiones() {
  const router = useRouter();
  const { contrato, user, navigateNext, navigatePrev } = useWizardStore();
  const [loading, setLoading] = useState(false);
  const [comisionData, setComisionData] = useState<{ porcentaje?: number; comision_vivivan?: number; mensaje?: string } | null>(null);

  useEffect(() => {
    const fetchComision = async () => {
      setLoading(true);
      try {
        const payload = {
          comercializadora_id: contrato.comercializadora_id || '',
          comercializadora_nombre: contrato.comercializadora_nombre || '',
          producto_id: contrato.id_producto || '',
          producto_nombre: contrato.producto_nombre || '',
          tarifa_acceso: contrato.tarifa || '',
          consumo_anual: Number(contrato.consumo_sips) || 0,
          potencia_max: Math.max(
            Number(contrato.p1) || 0,
            Number(contrato.p2) || 0,
            Number(contrato.p3) || 0,
            Number(contrato.p4) || 0,
            Number(contrato.p5) || 0,
            Number(contrato.p6) || 0
          ),
          codigo_comercial: user?.codigo || 0,
        };

        const response = await client.post('/api/comisiones/calcular', payload);
        setComisionData(response.data);
      } catch (e) {
        console.warn('Error calculating comision', e);
      } finally {
        setLoading(false);
      }
    };

    fetchComision();
  }, [contrato]);

  return (
    <ScrollView className="flex-1 bg-slate-50 p-4">
      <Text className="text-xl font-bold text-slate-800 mb-2">Paso 6: Liquidación y Comisiones</Text>
      <Text className="text-xs text-slate-500 mb-4">Detalle de ingresos y pagos estimados para el contrato.</Text>

      {loading ? (
        <View className="py-12 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-xs text-slate-400 mt-2">Calculando comisiones...</Text>
        </View>
      ) : (
        <Card title="Cálculo de Comisión Estimada">
          <View className="mb-4">
            <Text className="text-xs text-slate-400 font-bold mb-1">PORCENTAJE DE COMISIÓN</Text>
            <Text className="text-lg font-bold text-emerald-600">
              {comisionData?.porcentaje ? `${comisionData.porcentaje}%` : 'No asignado'}
            </Text>
          </View>

          <View className="mb-4 border-t border-slate-100 pt-3">
            <Text className="text-xs text-slate-400 font-bold mb-1">INGRESOS DE VIVIVAN (EST.)</Text>
            <Text className="text-sm font-semibold text-slate-800">
              {comisionData?.comision_vivivan ? `${comisionData.comision_vivivan} €` : 'N/D'}
            </Text>
          </View>

          {comisionData?.mensaje && (
            <View className="bg-blue-50 border border-blue-100 p-3 rounded-lg mt-2">
              <Text className="text-xs text-blue-700 leading-normal">{comisionData.mensaje}</Text>
            </View>
          )}
        </Card>
      )}

      {/* Breakdown list */}
      <Card title="Estados de Pago y Cobro">
        <View className="flex-row justify-between py-2 border-b border-slate-100">
          <Text className="text-xs text-slate-600">Estado Cobro Comercializadora</Text>
          <Text className="text-xs text-slate-800 font-bold">Pendiente</Text>
        </View>
        <View className="flex-row justify-between py-2 border-b border-slate-100">
          <Text className="text-xs text-slate-600">Estado Pago Comercial</Text>
          <Text className="text-xs text-slate-800 font-bold">Pendiente de Liquidar</Text>
        </View>
      </Card>

      {/* Navigation Buttons */}
      <View className="flex-row justify-between mt-4 mb-12">
        <Button title="Atrás" variant="outline" onPress={() => navigatePrev(router, 6)} className="w-[45%]" />
        <Button title="Siguiente" variant="primary" onPress={() => navigateNext(router, 6)} className="w-[45%]" />
      </View>
    </ScrollView>
  );
}
