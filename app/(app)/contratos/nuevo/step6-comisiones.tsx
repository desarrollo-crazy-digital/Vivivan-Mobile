import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../../../src/store/useWizardStore';
import client from '../../../../src/api/client';
import { Card } from '../../../../src/components/ui/Card';
import { Button } from '../../../../src/components/ui/Button';

const formatMoney = (value: unknown) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '0,00 €';
  return `${amount.toFixed(2).replace('.', ',')} €`;
};

const findValueByKeys = (source: any, keys: string[]): any => {
  if (!source || typeof source !== 'object') return undefined;

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return source[key];
    }
  }

  const lowerKeys = keys.map((key) => key.toLowerCase());
  for (const [key, value] of Object.entries(source)) {
    if (lowerKeys.includes(key.toLowerCase())) {
      return value;
    }
  }

  for (const value of Object.values(source)) {
    if (typeof value === 'object' && value !== null) {
      const found = findValueByKeys(value, keys);
      if (found !== undefined) {
        return found;
      }
    }
  }

  return undefined;
};

const findValueByKeyFragments = (source: any, fragments: string[]): any => {
  if (!source || typeof source !== 'object') return undefined;

  const lowerFragments = fragments.map((fragment) => fragment.toLowerCase());

  for (const [key, value] of Object.entries(source)) {
    const lowerKey = String(key).toLowerCase();
    if (lowerFragments.some((fragment) => lowerKey.includes(fragment))) {
      return value;
    }
  }

  for (const value of Object.values(source)) {
    if (typeof value === 'object' && value !== null) {
      const found = findValueByKeyFragments(value, fragments);
      if (found !== undefined) {
        return found;
      }
    }
  }

  return undefined;
};

const getNumberFromKeys = (source: any, keys: string[], fragments: string[] = []) => {
  const value = findValueByKeys(source, keys) ?? findValueByKeyFragments(source, fragments);
  if (value === undefined || value === null || value === '') return undefined;
  
  let cleaned = String(value).replace(/[^0-9,.-]+/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/,/g, '.');
  } else if ((cleaned.match(/\./g) || []).length > 1) {
    cleaned = cleaned.replace(/\./g, '');
  }
  
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const getArrayFromKeys = (source: any, keys: string[], fragments: string[] = []) => {
  const value = findValueByKeys(source, keys) ?? findValueByKeyFragments(source, fragments);
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    return Object.values(value).filter(Array.isArray).flat();
  }
  return [];
};

const getRawSections = (source: any, keys: string[], fragments: string[] = []) => {
  const value = findValueByKeys(source, keys) ?? findValueByKeyFragments(source, fragments);
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    return Object.values(value).filter(Array.isArray).flat();
  }
  return [];
};

const renderSectionRows = (items: any[]) =>
  items.map((item, index) => {
    const keys = Object.keys(item || {});
    const labelKey = keys.find((k) => /(concepto|concept|name|titulo)/i.test(k)) || keys[0];
    const amountKey = keys.find((k) => /(importe|amount|total|valor)/i.test(k));
    const statusKey = keys.find((k) => /(estado|status)/i.test(k));
    const dateKey = keys.find((k) => /(fecha|date)/i.test(k));

    return (
      <View key={index} className="border-b border-slate-100 py-2">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xs text-slate-700 font-semibold">{String(item[labelKey] ?? `Línea ${index + 1}`)}</Text>
          <Text className="text-xs text-slate-800 font-bold">{formatMoney(item[amountKey] ?? item?.valor ?? item?.importe)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-[10px] text-slate-500">{item[dateKey] ? String(item[dateKey]) : ''}</Text>
          <Text className="text-[10px] text-slate-500">{item[statusKey] ? String(item[statusKey]) : ''}</Text>
        </View>
      </View>
    );
  });

export default function Step6Comisiones() {
  const router = useRouter();
  const { contrato, user, navigateNext, navigatePrev } = useWizardStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comisionData, setComisionData] = useState<any>(null);

  const fetchComision = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parseParamNumber = (val: any) => {
        if (!val) return 0;
        const str = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
        return Number(str) || 0;
      };

      const p1_val = parseParamNumber(contrato.p1) || parseParamNumber((contrato as any).potencia_max);
      const p2_val = parseParamNumber(contrato.p2) || parseParamNumber((contrato as any).potencia_max);
      const p3_val = parseParamNumber(contrato.p3) || parseParamNumber((contrato as any).potencia_max);
      const p4_val = parseParamNumber(contrato.p4) || parseParamNumber((contrato as any).potencia_max);
      const p5_val = parseParamNumber(contrato.p5) || parseParamNumber((contrato as any).potencia_max);
      const p6_val = parseParamNumber(contrato.p6) || parseParamNumber((contrato as any).potencia_max);

      const potObject = {
        p1: p1_val, p2: p2_val, p3: p3_val, p4: p4_val, p5: p5_val, p6: p6_val,
        P1: p1_val, P2: p2_val, P3: p3_val, P4: p4_val, P5: p5_val, P6: p6_val,
        potencia_p1: p1_val, potencia_p2: p2_val, potencia_p3: p3_val, potencia_p4: p4_val, potencia_p5: p5_val, potencia_p6: p6_val,
        potencia_1: p1_val, potencia_2: p2_val, potencia_3: p3_val, potencia_4: p4_val, potencia_5: p5_val, potencia_6: p6_val,
        potencia1: p1_val, potencia2: p2_val, potencia3: p3_val, potencia4: p4_val, potencia5: p5_val, potencia6: p6_val,
      };

      const payload = {
        comercializadora_id: contrato.comercializadora_id || (contrato as any).id_comercializadora || '',
        comercializadora_nombre: contrato.comercializadora_nombre || (contrato as any).comercializadora_nombre || '',
        producto_id: contrato.id_producto || (contrato as any).producto_id || '',
        producto_nombre: contrato.producto_nombre || (contrato as any).producto_nombre || '',
        tarifa_acceso: contrato.tarifa || (contrato as any).tarifa_acceso || '',
        tarifa: contrato.tarifa || (contrato as any).tarifa_acceso || '',
        suministro: contrato.tipo_suministro || (contrato as any).suministro || 'Luz',
        tipo_alta: contrato.tipo_alta || 'Nueva',
        cambio_titular: contrato.cambio_titular || false,
        cambio_potencia: contrato.cambio_potencia || false,
        consumo_anual: parseParamNumber(contrato.consumo_sips ?? (contrato as any).consumo_anual),
        
        // Flat fields
        ...potObject,
        potencia_max: Math.max(p1_val, p2_val, p3_val, p4_val, p5_val, p6_val),

        // Nested objects
        potencias: potObject,
        potencias_contratadas: potObject,
        potencia: potObject,

        // Arrays
        potencias_array: [p1_val, p2_val, p3_val, p4_val, p5_val, p6_val],
        potencias_list: [p1_val, p2_val, p3_val, p4_val, p5_val, p6_val],

        codigo_comercial: user?.codigo || 0,
      };
      console.log('--- API_COMISIONES_CALCULAR_REQUEST ---', JSON.stringify(payload, null, 2));
      const response = await client.post('/api/comisiones/calcular', payload);
      console.log('--- API_COMISIONES_CALCULAR_RESPONSE ---', JSON.stringify(response.data, null, 2));
      setComisionData(response.data);
    } catch (e: any) {
      console.warn('Error calculating comision', e);
      setError(e?.response?.data?.message || e?.message || 'Error al calcular comisiones.');
    } finally {
      setLoading(false);
    }
  }, [contrato, user?.codigo]);

  useEffect(() => {
    fetchComision();
  }, [fetchComision]);

  const data = comisionData?.data ?? comisionData;

  const cobrosVivivan = getRawSections(data, ['cobros_vivivan', 'cobros', 'cobrosVivivan', 'cobros_vivivan_detalle', 'cobro_vivivan']);
  const pagoComercial = getRawSections(data, ['pago_comercial', 'pagoComercial', 'pagos', 'pagos_comercial', 'pago_comercial_detalle']);
  const decomisionVivivan = getRawSections(data, ['decomision_vivivan', 'decomisiones_vivivan', 'decomisiones', 'decomision', 'decomision_vivivan_detalle']);
  const decomisionComercial = getRawSections(data, ['decomision_comercial', 'decomisiones_comercial', 'decomisionesComercial', 'decomision_comercial_detalle']);

  const baseVivivan = getNumberFromKeys(data, ['comision_base', 'base_vivivan', 'base', 'base_vivivan_eur', 'baseVivivan', 'base_vivivan_bruto']) || 0;
  
  let estudios = getNumberFromKeys(data, ['estudios_vivivan', 'estudios', 'estudios_luz', 'estudios_luz_ivan_navarro_sl', 'estudios_vivivan_eur']);
  if (estudios === undefined && baseVivivan !== undefined) {
    if (String(data?.comercializadora || data?.comercializadora_nombre || '').toLowerCase().includes('loviluz')) {
      estudios = baseVivivan;
    }
  }
  if (estudios === undefined) {
    estudios = 0;
  }

  let margenBruto = getNumberFromKeys(data, ['margen_vivivan_bruto', 'margen_bruto', 'margenBruto', 'margen_vivivan_bruto_eur']);
  if (margenBruto === undefined && baseVivivan !== undefined) {
    const beneficio = getNumberFromKeys(data, ['beneficio_vivivan', 'beneficio']) || 0;
    margenBruto = Math.max(0, beneficio - (estudios || 0));
  }
  if (margenBruto === undefined) {
    margenBruto = 0;
  }

  let margenNeto = getNumberFromKeys(data, ['margen_vivivan_neto', 'margen_neto', 'margenNeto', 'margen_vivivan_neto_eur']);
  if (margenNeto === undefined && margenBruto !== undefined) {
    margenNeto = margenBruto;
  }
  if (margenNeto === undefined) {
    margenNeto = 0;
  }

  const porcentajeComision = getNumberFromKeys(data, ['porcentaje', 'porcentaje_comision', 'porcentaje_vivivan', 'porcentaje_comercial']) || 0;
  const comisionVivivan = getNumberFromKeys(data, ['comision_vivivan', 'comisionVivivan', 'ingresos_vivivan', 'ingreso_vivivan', 'ingresos', 'beneficio_vivivan']) || 0;
  const observacionesLiquidacion =
    findValueByKeys(data, ['observaciones_liquidacion', 'observacionesLiquidacion', 'observaciones', 'observacion']) || '';
  const seguimientoInterno =
    findValueByKeys(data, ['seguimiento_interno', 'seguimientoInterno', 'seguimiento', 'seguimiento_interno']) || '';

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Text className="text-xl font-bold text-slate-800 mb-2">Paso 6: Liquidación y Comisiones</Text>
      <Text className="text-xs text-slate-500 mb-4">Detalle de ingresos, pagos y márgenes exactamente para este contrato.</Text>

      <View className="flex-row justify-end mb-4">
        <Button title="Recalcular" variant="outline" onPress={fetchComision} className="w-[40%]" />
      </View>

      {loading ? (
        <View className="py-12 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-xs text-slate-400 mt-2">Calculando comisiones...</Text>
        </View>
      ) : error ? (
        <Card title="Error" className="border border-rose-200 bg-rose-50">
          <Text className="text-sm text-rose-700">{error}</Text>
        </Card>
      ) : (
        <>
          <Card title="Comisión Estimada">
            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] rounded-3xl border border-slate-200 bg-white p-4 mb-3">
                <Text className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-2">Base Vivivan</Text>
                <Text className="text-xl font-bold text-slate-900">{baseVivivan !== undefined ? formatMoney(baseVivivan) : '-'}</Text>
              </View>
              <View className="w-[48%] rounded-3xl border border-slate-200 bg-white p-4 mb-3">
                <Text className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-2">Estudios</Text>
                <Text className="text-xl font-bold text-slate-900">{estudios !== undefined ? formatMoney(estudios) : '-'}</Text>
              </View>
              <View className="w-[48%] rounded-3xl border border-slate-200 bg-white p-4 mb-3">
                <Text className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-2">Margen Vivivan Bruto</Text>
                <Text className="text-xl font-bold text-slate-900">{margenBruto !== undefined ? formatMoney(margenBruto) : '-'}</Text>
              </View>
              <View className="w-[48%] rounded-3xl border border-slate-200 bg-white p-4 mb-3">
                <Text className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-2">Margen Vivivan Neto</Text>
                <Text className="text-xl font-bold text-slate-900">{margenNeto !== undefined ? formatMoney(margenNeto) : '-'}</Text>
              </View>
            </View>
            <View className="mt-4 border-t border-slate-100 pt-4">
              <Text className="text-xs text-slate-400 font-bold mb-1">Porcentaje de Comisión</Text>
              <Text className="text-2xl font-bold text-emerald-600">{porcentajeComision !== undefined ? `${porcentajeComision}%` : '-'}</Text>
            </View>
            <View className="mt-4 border-t border-slate-100 pt-4">
              <Text className="text-xs text-slate-400 font-bold mb-1">Ingresos de Vivivan</Text>
              <Text className="text-lg font-semibold text-slate-800">{comisionVivivan !== undefined ? formatMoney(comisionVivivan) : '-'}</Text>
            </View>
          </Card>

          <Card title="Cobros Vivivan">
            {cobrosVivivan.length > 0 ? renderSectionRows(cobrosVivivan) : <Text className="text-xs text-slate-500">No hay datos de cobros disponibles para este contrato.</Text>}
          </Card>

          <Card title="Pago Comercial">
            {pagoComercial.length > 0 ? renderSectionRows(pagoComercial) : <Text className="text-xs text-slate-500">No hay datos de pago comercial disponibles para este contrato.</Text>}
          </Card>

          <Card title="Decomisión Vivivan">
            {decomisionVivivan.length > 0 ? renderSectionRows(decomisionVivivan) : <Text className="text-xs text-slate-500">No hay datos de decomisión Vivivan disponibles.</Text>}
          </Card>

          <Card title="Decomisión del Comercial">
            {decomisionComercial.length > 0 ? renderSectionRows(decomisionComercial) : <Text className="text-xs text-slate-500">No hay datos de decomisión del comercial disponibles.</Text>}
          </Card>

          {(observacionesLiquidacion || seguimientoInterno) && (
            <Card title="Observaciones y Seguimiento">
              {observacionesLiquidacion ? (
                <View className="mb-4">
                  <Text className="text-xs text-slate-400 uppercase mb-2">Observaciones de liquidación</Text>
                  <Text className="text-sm text-slate-700">{observacionesLiquidacion}</Text>
                </View>
              ) : null}
              {seguimientoInterno ? (
                <View>
                  <Text className="text-xs text-slate-400 uppercase mb-2">Seguimiento interno</Text>
                  <Text className="text-sm text-slate-700">{seguimientoInterno}</Text>
                </View>
              ) : null}
            </Card>
          )}
        </>
      )}

      <View className="mt-4 flex-row space-x-3">
        <Button title="Atrás" variant="outline" onPress={() => navigatePrev(router, 6)} className="flex-1" />
        <Button title="Siguiente" variant="primary" onPress={() => navigateNext(router, 6)} className="flex-1" />
      </View>
    </ScrollView>
  );
}
