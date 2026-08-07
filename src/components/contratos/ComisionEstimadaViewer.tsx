import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import client from '../../api/client';
import { Card } from '../ui/Card';

const formatMoney = (value: unknown) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '0,00 €';
  return `${amount.toFixed(2).replace('.', ',')} €`;
};

const findValueByKeys = (source: any, keys: string[]): any => {
  if (!source || typeof source !== 'object') return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
  }
  const lowerKeys = keys.map((key) => key.toLowerCase());
  for (const [key, value] of Object.entries(source)) {
    if (lowerKeys.includes(key.toLowerCase())) return value;
  }
  for (const value of Object.values(source)) {
    if (typeof value === 'object' && value !== null) {
      const found = findValueByKeys(value, keys);
      if (found !== undefined) return found;
    }
  }
  return undefined;
};

const findValueByKeyFragments = (source: any, fragments: string[]): any => {
  if (!source || typeof source !== 'object') return undefined;
  const lowerFragments = fragments.map((fragment) => fragment.toLowerCase());
  for (const [key, value] of Object.entries(source)) {
    const lowerKey = String(key).toLowerCase();
    if (lowerFragments.some((fragment) => lowerKey.includes(fragment))) return value;
  }
  for (const value of Object.values(source)) {
    if (typeof value === 'object' && value !== null) {
      const found = findValueByKeyFragments(value, fragments);
      if (found !== undefined) return found;
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

export const ComisionEstimadaViewer = ({ contrato, user }: { contrato: any; user: any }) => {
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

      const p1_val = parseParamNumber(contrato.p1) || parseParamNumber(contrato.potencia_max);
      const p2_val = parseParamNumber(contrato.p2) || parseParamNumber(contrato.potencia_max);
      const p3_val = parseParamNumber(contrato.p3) || parseParamNumber(contrato.potencia_max);
      const p4_val = parseParamNumber(contrato.p4) || parseParamNumber(contrato.potencia_max);
      const p5_val = parseParamNumber(contrato.p5) || parseParamNumber(contrato.potencia_max);
      const p6_val = parseParamNumber(contrato.p6) || parseParamNumber(contrato.potencia_max);

      const potObject = {
        p1: p1_val, p2: p2_val, p3: p3_val, p4: p4_val, p5: p5_val, p6: p6_val,
        P1: p1_val, P2: p2_val, P3: p3_val, P4: p4_val, P5: p5_val, P6: p6_val,
        potencia_p1: p1_val, potencia_p2: p2_val, potencia_p3: p3_val, potencia_p4: p4_val, potencia_p5: p5_val, potencia_p6: p6_val,
        potencia_1: p1_val, potencia_2: p2_val, potencia_3: p3_val, potencia_4: p4_val, potencia_5: p5_val, potencia_6: p6_val,
        potencia1: p1_val, potencia2: p2_val, potencia3: p3_val, potencia4: p4_val, potencia5: p5_val, potencia6: p6_val,
      };

      const payload = {
        comercializadora_id: contrato.comercializadora_id || contrato.id_comercializadora || '',
        comercializadora_nombre: contrato.comercializadora_nombre || '',
        producto_id: contrato.producto_id || contrato.id_producto || '',
        producto_nombre: contrato.producto_nombre || '',
        tarifa_acceso: contrato.tarifa || contrato.tarifa_acceso || '',
        tarifa: contrato.tarifa || contrato.tarifa_acceso || '',
        suministro: contrato.tipo_suministro || contrato.suministro || 'Luz',
        tipo_alta: contrato.tipo_alta || 'Nueva',
        cambio_titular: contrato.cambio_titular || false,
        cambio_potencia: contrato.cambio_potencia || false,
        consumo_anual: parseParamNumber(contrato.consumo_sips ?? contrato.consumo_anual),
        
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
      const response = await client.post('/api/comisiones/calcular', payload);
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

  if (loading) {
    return (
      <View className="py-8 items-center justify-center">
        <ActivityIndicator size="small" color="#2563EB" />
        <Text className="text-xs text-slate-400 mt-2">Calculando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="p-3 bg-rose-50 border border-rose-200 rounded-xl mb-4">
        <Text className="text-xs text-rose-700">{error}</Text>
      </View>
    );
  }

  return (
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
  );
};
