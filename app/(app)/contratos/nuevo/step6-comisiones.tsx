import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../../../src/store/useWizardStore';
import { contratosService } from '../../../../src/api/contratos.service';
import client from '../../../../src/api/client';
import { Card } from '../../../../src/components/ui/Card';
import { Button } from '../../../../src/components/ui/Button';
import { Input } from '../../../../src/components/ui/Input';

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

const resolveItemLabel = (item: any, index: number): string => {
  if (!item) return `Línea ${index + 1}`;
  
  if (item.concepto) return String(item.concepto);
  if (item.nombre) return String(item.nombre);
  
  if (item._tipo === 'supervisado') {
    return 'Comercial (Neto)';
  }
  if (item._tipo === 'supervisor') {
    return item._supervisor_nombre ? `Supervisor (${item._supervisor_nombre})` : 'Supervisor';
  }
  if (item._destinatario === 'supervisor') {
    return 'Supervisor';
  }
  if (item._destinatario === 'comercial') {
    return 'Comercial';
  }
  
  return `Línea ${index + 1}`;
};

const renderSectionRows = (items: any[]) =>
  items.map((item, index) => {
    const keys = Object.keys(item || {});
    const amountKey = keys.find((k) => /(importe|amount|total|valor)/i.test(k)) || 'importe';
    const statusKey = keys.find((k) => /(estado|status)/i.test(k)) || 'estado';
    const dateKey = keys.find((k) => /(fecha|date)/i.test(k)) || 'fecha';

    const label = resolveItemLabel(item, index);
    const amount = item[amountKey] ?? item?.valor ?? item?.importe;
    const status = item[statusKey];
    const date = item[dateKey];
    const ref = item.n_certif || item.autofactura || '';

    return (
      <View key={index} className="border-b border-slate-100 py-2">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xs text-slate-700 font-semibold">{label}</Text>
          <Text className="text-xs text-slate-800 font-bold">{formatMoney(amount)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-[10px] text-slate-500">
            {date ? String(date) : ''} {ref ? `| Ref: ${ref}` : ''}
          </Text>
          <Text className="text-[10px] text-slate-500 capitalize">{status ? String(status) : ''}</Text>
        </View>
      </View>
    );
  });

export default function Step6Comisiones() {
  const router = useRouter();
  const {
    contrato,
    updateContrato,
    user,
    navigateNext,
    navigatePrev,
    pagos_vivivan,
    pagos_comercial,
    decomisiones_vivivan,
    decomisiones_comercial,
  } = useWizardStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comisionData, setComisionData] = useState<any>(null);

  // Local state for interactive table rows
  const [cobrosList, setCobrosList] = useState<any[]>([]);
  const [pagosList, setPagosList] = useState<any[]>([]);
  const [decomVivivanList, setDecomVivivanList] = useState<any[]>([]);
  const [decomComercialList, setDecomComercialList] = useState<any[]>([]);

  useEffect(() => {
    if (pagos_vivivan && pagos_vivivan.length > 0) setCobrosList(pagos_vivivan);
    if (pagos_comercial && pagos_comercial.length > 0) setPagosList(pagos_comercial);
    if (decomisiones_vivivan && decomisiones_vivivan.length > 0) setDecomVivivanList(decomisiones_vivivan);
    if (decomisiones_comercial && decomisiones_comercial.length > 0) setDecomComercialList(decomisiones_comercial);
  }, [pagos_vivivan, pagos_comercial, decomisiones_vivivan, decomisiones_comercial]);

  const fetchComision = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let dbContractData: any = null;
      if (contrato.id) {
        try {
          dbContractData = await contratosService.getContratoCompleto(contrato.id);
        } catch (e) {
          console.warn('Could not fetch getContratoCompleto:', e);
        }
      }

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
        ...potObject,
        potencias: potObject,
        comercial_id: String(contrato.comercial_id || contrato.codigo_comercial || user?.codigo || user?.id || ''),
        codigo_comercial: user?.codigo || 0,
      };

      const response = await client.post('/api/comisiones/calcular', payload);
      const merged = {
        ...(response.data?.data || response.data || {}),
        ...(dbContractData || {}),
      };
      setComisionData(merged);

      // Auto-populate initial row if empty
      const base = Number(merged.comision_base || merged.base_vivivan || 0);
      if (base > 0 && cobrosList.length === 0) {
        setCobrosList([{ id: Date.now(), concepto: 'Principal', fecha: '', importe: base, estado: 'no_cobrado', n_certif: '' }]);
      }
    } catch (e: any) {
      console.warn('Error calculating comision', e);
      setError(e?.response?.data?.message || e?.message || 'Error al calcular comisiones.');
    } finally {
      setLoading(false);
    }
  }, [contrato, user, cobrosList.length]);

  useEffect(() => {
    fetchComision();
  }, [fetchComision]);

  const data = comisionData?.data ?? comisionData;

  const baseVivivan = contrato.comision_base !== undefined && contrato.comision_base !== null
    ? contrato.comision_base
    : (getNumberFromKeys(data, ['comision_base', 'base_vivivan', 'base']) || 0);

  const porcentajeComision = contrato.porcentaje_comision !== undefined && contrato.porcentaje_comision !== null
    ? contrato.porcentaje_comision
    : (getNumberFromKeys(data, ['porcentaje', 'porcentaje_comision', 'porcentaje_comercial']) || 0);

  const comisionBrutaComercial = contrato.comision_comercial !== undefined && contrato.comision_comercial !== null
    ? contrato.comision_comercial
    : (getNumberFromKeys(data, ['comision_comercial', 'comision_agente']) || 0);

  const comisionSupervisor = contrato.comision_supervisor !== undefined && contrato.comision_supervisor !== null
    ? contrato.comision_supervisor
    : (getNumberFromKeys(data, ['comision_supervisor', 'corte_supervisor']) || 0);

  const supervisorNombre = contrato.supervisor_nombre || data?.supervisor_nombre || '';

  const comisionNetaComercial = contrato.comision_neta_comercial !== undefined && contrato.comision_neta_comercial !== null
    ? contrato.comision_neta_comercial
    : (getNumberFromKeys(data, ['comision_neta_comercial', 'comision_neta']) || Math.max(0, comisionBrutaComercial - comisionSupervisor));

  const comisionVivivan = contrato.beneficio_vivivan !== undefined && contrato.beneficio_vivivan !== null
    ? contrato.beneficio_vivivan
    : (getNumberFromKeys(data, ['comision_vivivan', 'beneficio_vivivan']) || Math.max(0, baseVivivan - comisionBrutaComercial));

  // Interactive Table Helpers
  const addCobroRow = (tipo: 'Cobro' | 'Bono') => {
    setCobrosList(prev => [...prev, { id: Date.now(), concepto: tipo, fecha: '', importe: 0, estado: 'no_cobrado', n_certif: '' }]);
  };

  const addPagoRow = () => {
    setPagosList(prev => [...prev, { id: Date.now(), _tipo: 'comercial', concepto: 'Extra', fecha: '', importe: 0, estado: 'no_pagado', autofactura: '' }]);
  };

  const addDecomVivivanRow = () => {
    setDecomVivivanList(prev => [...prev, { id: Date.now(), concepto: 'Baja', fecha_baja: '', fecha: '', importe: 0, estado: 'no_decomisionado', n_certif: '' }]);
  };

  const addDecomComercialRow = () => {
    setDecomComercialList(prev => [...prev, { id: Date.now(), _tipo: 'comercial', concepto: 'Baja', fecha_baja: '', fecha: '', importe: 0, estado: 'no_decomisionado', autofactura: '' }]);
  };

  const fraccionarList = (list: any[], setList: (v: any[]) => void) => {
    if (list.length === 0) return;
    const next: any[] = [];
    list.forEach(row => {
      const currentAmt = Number(row.importe || 0);
      const half = Math.round((currentAmt / 2) * 100) / 100;
      next.push({ ...row, importe: half, concepto: `${row.concepto || 'Línea'} (1/2)` });
      next.push({ ...row, id: Date.now() + Math.random(), importe: half, concepto: `${row.concepto || 'Línea'} (2/2)` });
    });
    setList(next);
  };

  const totalCobrado = cobrosList.reduce((acc, item) => acc + (item.estado === 'cobrado' ? (Number(item.importe) || 0) : 0), 0);
  const totalPagado = pagosList.reduce((acc, item) => acc + (item.estado === 'pagado' ? (Number(item.importe) || 0) : 0), 0);
  const totalDecomVivivan = decomVivivanList.reduce((acc, item) => acc + (item.estado === 'decomisionado' ? (Number(item.importe) || 0) : 0), 0);
  const totalDecomComercial = decomComercialList.reduce((acc, item) => acc + (item.estado === 'decomisionado' ? (Number(item.importe) || 0) : 0), 0);

  const margenNeto = totalCobrado - totalPagado - totalDecomVivivan + totalDecomComercial;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Text className="text-xl font-bold text-slate-800 mb-1">Paso 6: Liquidación y Comisiones</Text>
      <Text className="text-xs text-slate-500 mb-4">Gestión completa de cobros, pagos, decomisiones, observaciones y seguimiento.</Text>

      {loading ? (
        <View className="py-12 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-xs text-slate-400 mt-2">Calculando comisiones...</Text>
        </View>
      ) : (
        <>
          {/* Summary Cards */}
          <Card title="Comisión Estimada y Reparto">
            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] rounded-2xl border border-slate-200 bg-white p-3 mb-3">
                <Text className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Base Vivivan</Text>
                <Text className="text-lg font-bold text-slate-900">{formatMoney(baseVivivan)}</Text>
              </View>
              <View className="w-[48%] rounded-2xl border border-slate-200 bg-white p-3 mb-3">
                <Text className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Porcentaje %</Text>
                <Text className="text-lg font-bold text-emerald-600">{porcentajeComision}%</Text>
              </View>
              <View className="w-[48%] rounded-2xl border border-slate-200 bg-white p-3 mb-3">
                <Text className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Bruto Comercial</Text>
                <Text className="text-lg font-bold text-slate-900">{formatMoney(comisionBrutaComercial)}</Text>
              </View>
              <View className="w-[48%] rounded-2xl border border-slate-200 bg-white p-3 mb-3">
                <Text className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Corte Supervisor</Text>
                <Text className="text-lg font-bold text-amber-600">{formatMoney(comisionSupervisor)}</Text>
                {supervisorNombre ? <Text className="text-[10px] text-slate-400 font-semibold mt-1" numberOfLines={1}>{supervisorNombre}</Text> : null}
              </View>
              <View className="w-[48%] rounded-2xl border border-slate-200 bg-white p-3 mb-3">
                <Text className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Neto Comercial</Text>
                <Text className="text-lg font-bold text-blue-600">{formatMoney(comisionNetaComercial)}</Text>
              </View>
              <View className="w-[48%] rounded-2xl border border-slate-200 bg-white p-3 mb-3">
                <Text className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Margen Vivivan Neto</Text>
                <Text className="text-lg font-bold text-slate-900">{formatMoney(comisionVivivan)}</Text>
              </View>
            </View>
          </Card>

          {/* 1. COBROS VIVIVAN */}
          <Card title="↑ COBROS VIVIVAN">
            <View className="flex-row flex-wrap gap-2 mb-3">
              <Button title="🧮 Calcular" variant="outline" onPress={fetchComision} className="px-3 py-1 text-xs" />
              <Button title="⚪ Fraccionar" variant="outline" onPress={() => fraccionarList(cobrosList, setCobrosList)} className="px-3 py-1 text-xs" />
              <Button title="+ Cobro" variant="primary" onPress={() => addCobroRow('Cobro')} className="px-3 py-1 text-xs" />
              <Button title="+ Bono" variant="primary" onPress={() => addCobroRow('Bono')} className="px-3 py-1 text-xs" />
            </View>

            {cobrosList.map((item, idx) => (
              <View key={item.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-2">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs font-bold text-slate-800">{item.concepto || `Cobro #${idx + 1}`}</Text>
                  <TouchableOpacity onPress={() => setCobrosList(prev => prev.filter((_, i) => i !== idx))}>
                    <Text className="text-xs font-bold text-rose-500">🗑️ Eliminar</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row gap-2 mb-2">
                  <View className="flex-1">
                    <Input
                      label="IMPORTE (€)"
                      keyboardType="numeric"
                      value={String(item.importe || '')}
                      onChangeText={(val) => {
                        const copy = [...cobrosList];
                        copy[idx].importe = val;
                        setCobrosList(copy);
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-slate-500 mb-1">ESTADO</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const copy = [...cobrosList];
                        copy[idx].estado = copy[idx].estado === 'cobrado' ? 'no_cobrado' : 'cobrado';
                        setCobrosList(copy);
                      }}
                      className={`p-3 rounded-xl border items-center justify-center ${
                        item.estado === 'cobrado' ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${item.estado === 'cobrado' ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {item.estado === 'cobrado' ? '✓ Cobrado' : 'No cobrado'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            <View className="flex-row justify-between pt-2 border-t border-slate-100">
              <Text className="text-xs text-slate-500 font-bold">TOTAL COBRADO</Text>
              <Text className="text-sm text-slate-900 font-black">{formatMoney(totalCobrado)}</Text>
            </View>
          </Card>

          {/* 2. PAGO COMERCIAL & SUPERVISOR */}
          <Card title="↓ PAGO COMERCIAL & SUPERVISOR">
            <View className="flex-row flex-wrap gap-2 mb-3">
              <Button title="⚪ Fraccionar" variant="outline" onPress={() => fraccionarList(pagosList, setPagosList)} className="px-3 py-1 text-xs" />
              <Button title="+ Pago" variant="primary" onPress={addPagoRow} className="px-3 py-1 text-xs" />
            </View>

            {pagosList.map((item, idx) => (
              <View key={item.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-2">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs font-bold text-slate-800">
                    {item._tipo === 'supervisor' ? `Supervisor (${item._supervisor_nombre || supervisorNombre || 'General'})` : (item._tipo === 'supervisado' ? 'Comercial (Neto)' : 'Comercial')}
                  </Text>
                  <TouchableOpacity onPress={() => setPagosList(prev => prev.filter((_, i) => i !== idx))}>
                    <Text className="text-xs font-bold text-rose-500">🗑️ Eliminar</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row gap-2 mb-2">
                  <View className="flex-1">
                    <Input
                      label="IMPORTE (€)"
                      keyboardType="numeric"
                      value={String(item.importe || '')}
                      onChangeText={(val) => {
                        const copy = [...pagosList];
                        copy[idx].importe = val;
                        setPagosList(copy);
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-slate-500 mb-1">ESTADO</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const copy = [...pagosList];
                        copy[idx].estado = copy[idx].estado === 'pagado' ? 'no_pagado' : 'pagado';
                        setPagosList(copy);
                      }}
                      className={`p-3 rounded-xl border items-center justify-center ${
                        item.estado === 'pagado' ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${item.estado === 'pagado' ? 'text-blue-700' : 'text-slate-600'}`}>
                        {item.estado === 'pagado' ? '✓ Pagado' : 'No pagado'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            <View className="flex-row justify-between pt-2 border-t border-slate-100">
              <Text className="text-xs text-slate-500 font-bold">TOTAL PAGADO</Text>
              <Text className="text-sm text-slate-900 font-black">{formatMoney(totalPagado)}</Text>
            </View>
          </Card>

          {/* 3. DECOMISIÓN VIVIVAN */}
          <Card title="↓ DECOMISIÓN VIVIVAN">
            <View className="flex-row flex-wrap gap-2 mb-3">
              <Button title="🧮 Calcular" variant="outline" onPress={fetchComision} className="px-3 py-1 text-xs" />
              <Button title="+ Baja" variant="primary" onPress={addDecomVivivanRow} className="px-3 py-1 text-xs" />
            </View>

            {decomVivivanList.map((item, idx) => (
              <View key={item.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-2">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs font-bold text-slate-800">Decomisión Vivivan #{idx + 1}</Text>
                  <TouchableOpacity onPress={() => setDecomVivivanList(prev => prev.filter((_, i) => i !== idx))}>
                    <Text className="text-xs font-bold text-rose-500">🗑️ Eliminar</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row gap-2 mb-2">
                  <View className="flex-1">
                    <Input
                      label="IMPORTE (€)"
                      keyboardType="numeric"
                      value={String(item.importe || '')}
                      onChangeText={(val) => {
                        const copy = [...decomVivivanList];
                        copy[idx].importe = val;
                        setDecomVivivanList(copy);
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-slate-500 mb-1">ESTADO</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const copy = [...decomVivivanList];
                        copy[idx].estado = copy[idx].estado === 'decomisionado' ? 'no_decomisionado' : 'decomisionado';
                        setDecomVivivanList(copy);
                      }}
                      className={`p-3 rounded-xl border items-center justify-center ${
                        item.estado === 'decomisionado' ? 'bg-amber-50 border-amber-500' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${item.estado === 'decomisionado' ? 'text-amber-700' : 'text-slate-600'}`}>
                        {item.estado === 'decomisionado' ? '⚠ Decomisionado' : 'No Decomisionado'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            <View className="flex-row justify-between pt-2 border-t border-slate-100">
              <Text className="text-xs text-slate-500 font-bold">TOTAL DECOMISIÓN GLOBAL</Text>
              <Text className="text-sm text-slate-900 font-black">{formatMoney(totalDecomVivivan)}</Text>
            </View>
          </Card>

          {/* 4. DECOMISIÓN DEL COMERCIAL */}
          <Card title="DECOMISIÓN DEL COMERCIAL">
            <View className="flex-row flex-wrap gap-2 mb-3">
              <Button title="+ Línea" variant="primary" onPress={addDecomComercialRow} className="px-3 py-1 text-xs" />
            </View>

            {decomComercialList.map((item, idx) => (
              <View key={item.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-2">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs font-bold text-slate-800">Decomisión Comercial #{idx + 1}</Text>
                  <TouchableOpacity onPress={() => setDecomComercialList(prev => prev.filter((_, i) => i !== idx))}>
                    <Text className="text-xs font-bold text-rose-500">🗑️ Eliminar</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row gap-2 mb-2">
                  <View className="flex-1">
                    <Input
                      label="IMPORTE (€)"
                      keyboardType="numeric"
                      value={String(item.importe || '')}
                      onChangeText={(val) => {
                        const copy = [...decomComercialList];
                        copy[idx].importe = val;
                        setDecomComercialList(copy);
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-slate-500 mb-1">ESTADO</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const copy = [...decomComercialList];
                        copy[idx].estado = copy[idx].estado === 'decomisionado' ? 'no_decomisionado' : 'decomisionado';
                        setDecomComercialList(copy);
                      }}
                      className={`p-3 rounded-xl border items-center justify-center ${
                        item.estado === 'decomisionado' ? 'bg-amber-50 border-amber-500' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${item.estado === 'decomisionado' ? 'text-amber-700' : 'text-slate-600'}`}>
                        {item.estado === 'decomisionado' ? '⚠ Decomisionado' : 'No Decomisionado'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            <View className="flex-row justify-between pt-2 border-t border-slate-100">
              <Text className="text-xs text-slate-500 font-bold">TOTAL RECUPERADO AL AGENTE</Text>
              <Text className="text-sm text-slate-900 font-black">{formatMoney(totalDecomComercial)}</Text>
            </View>
          </Card>

          {/* 5. OBSERVACIONES Y SEGUIMIENTO */}
          <Card title="Observaciones de Liquidación y Seguimiento Interno">
            <View className="mb-4">
              <Input
                label="OBSERVACIONES DE LIQUIDACIÓN"
                placeholder="Anotaciones sobre cobro de comisiones, pagos o incidencias..."
                value={contrato.observaciones_liquidacion || (contrato as any).observaciones_pago || ''}
                onChangeText={(val) => updateContrato({ observaciones_liquidacion: val })}
              />
            </View>

            {['master', 'admin', 'developer'].includes(String(user?.role || '').toLowerCase()) && (
              <View className="mb-2">
                <Input
                  label="SEGUIMIENTO INTERNO / HISTORIAL DE GESTIÓN"
                  placeholder="Incidencias con la distribuidora, recordatorios o seguimiento de oficina..."
                  value={contrato.seguimiento_interno || (contrato as any).observaciones_internas || ''}
                  onChangeText={(val) => updateContrato({ seguimiento_interno: val })}
                />
              </View>
            )}
          </Card>
        </>
      )}

      <View className="mt-4 flex-row gap-3">
        <Button title="Atrás" variant="outline" onPress={() => navigatePrev(router, 6)} className="flex-1 mr-3" />
        <Button title="Siguiente" variant="primary" onPress={() => navigateNext(router, 6)} className="flex-1" />
      </View>
    </ScrollView>
  );
}
