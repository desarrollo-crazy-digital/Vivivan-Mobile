import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useWizardStore } from '../../../../src/store/useWizardStore';
import { contratosService } from '../../../../src/api/contratos.service';
import { Card } from '../../../../src/components/ui/Card';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';

export default function Step3Oferta() {
  const router = useRouter();
  const { contrato, updateContrato, resetWizard, navigateNext, navigatePrev, currentStep, availableSteps, user } = useWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Fetch active comercializadoras
  const { data: comercializadoras = [], isLoading: loadingComs } = useQuery({
    queryKey: ['comercializadoras'],
    queryFn: contratosService.getComercializadoras,
  });

  // 2. Fetch products cascade
  const { data: productos = [], isLoading: loadingProds } = useQuery({
    queryKey: ['productos', contrato.comercializadora_id],
    queryFn: () => contratosService.getProductosPorComercializadora(contrato.comercializadora_id!),
    enabled: !!contrato.comercializadora_id,
  });

  const handleComercializadoraChange = (comId: string, comNombre: string) => {
    updateContrato({
      comercializadora_id: comId,
      comercializadora_nombre: comNombre,
      // Clear product and tariff when commercializadora changes
      id_producto: undefined,
      producto_nombre: undefined,
    });
  };

  const handleProductoChange = (prodId: string, prodNombre: string, tariff?: string) => {
    updateContrato({
      id_producto: prodId,
      producto_nombre: prodNombre,
      tarifa: tariff || contrato.tarifa || '2.0TD',
    });
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};
    if (!contrato.comercializadora_id) newErrors.comercializadora = 'La comercializadora es obligatoria';
    if (!contrato.id_producto) newErrors.producto = 'El producto es obligatorio';
    if (!contrato.tarifa) newErrors.tarifa = 'La tarifa es obligatoria';

    // Validation for electric powers P1-P6 if Luz is selected
    if (contrato.tipo_suministro === 'Luz') {
      const parsePow = (val: any) => val ? Number(String(val).replace(',', '.')) : NaN;
      
      const p1 = parsePow(contrato.p1);
      if (isNaN(p1) || p1 <= 0) {
        newErrors.p1 = 'La potencia P1 debe ser mayor a 0';
      }
      if (contrato.tarifa === '2.0TD') {
        const p2 = parsePow(contrato.p2);
        if (isNaN(p2) || p2 <= 0) {
          newErrors.p2 = 'La potencia P2 debe ser mayor a 0';
        }
      } else if (contrato.tarifa === '3.0TD' || contrato.tarifa === '6.1TD') {
        // Require P1 to P6
        ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].forEach((pow) => {
          const val = parsePow((contrato as any)[pow]);
          if (isNaN(val) || val <= 0) {
            newErrors[pow] = `La potencia ${pow.toUpperCase()} es obligatoria para tarifas industriales`;
          }
        });
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert('Campos Incompletos', 'Por favor, revise los campos técnicos y de oferta.');
      return;
    }

    navigateNext(router, 3);
  };

  const tarifasDisponibles =
    contrato.tipo_suministro === 'Luz'
      ? ['2.0TD', '3.0TD', '6.1TD']
      : ['RL.1', 'RL.2', 'RL.3', 'RL.4'];

  const tiposAlta = [
    { label: 'Alta Nueva', value: 'Nueva' },
    { label: 'Cambio Comercializadora', value: 'Cambio comercializadora' },
    { label: 'Cambio Titular', value: 'Cambio titular' },
    { label: 'Renovación', value: 'Renovación' },
  ];

  const isComercial = user?.role === 'comercial';
  const isObservador = user?.role === 'observador';
  const isEditing = !!contrato.id;

  const canEditFields = !isObservador && (!isComercial || !isEditing || 
    ['pendiente comercial', 'incidencia'].includes(String(contrato.estado || '').toLowerCase()));

  const stepIdx = availableSteps.findIndex((s) => s.id === 3) + 1;
  const totalSteps = availableSteps.length;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 }}>
      {isEditing && !canEditFields && (
        <View className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl mb-4">
          <Text className="text-xs text-amber-700 font-bold leading-normal">
            ⚠️ Contrato en estado no editable. Se muestra en modo lectura.
          </Text>
        </View>
      )}

      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-xs text-blue-600 font-bold uppercase">Paso {stepIdx > 0 ? stepIdx : 1} de {totalSteps > 0 ? totalSteps : 8}</Text>
          <Text className="text-xl font-bold text-slate-800">Parámetros de la Oferta</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            resetWizard();
            router.replace('/contratos');
          }}
        >
          <Text className="text-xs text-slate-400 font-bold">Cancelar</Text>
        </TouchableOpacity>
      </View>

      <View pointerEvents={canEditFields ? 'auto' : 'none'}>
        {/* Supply Type Toggle */}
      <Card title="Tipo de Suministro">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={() => updateContrato({ tipo_suministro: 'Luz', tarifa: '2.0TD' })}
            className={`flex-1 p-4 rounded-xl border items-center justify-center ${
              contrato.tipo_suministro === 'Luz'
                ? 'bg-blue-50 border-blue-500'
                : 'bg-white border-slate-200'
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                contrato.tipo_suministro === 'Luz' ? 'text-blue-600' : 'text-slate-600'
              }`}
            >
              Luz (Electricidad)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => updateContrato({ tipo_suministro: 'Gas', tarifa: 'RL.1' })}
            className={`flex-1 p-4 rounded-xl border items-center justify-center ${
              contrato.tipo_suministro === 'Gas'
                ? 'bg-blue-50 border-blue-500'
                : 'bg-white border-slate-200'
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                contrato.tipo_suministro === 'Gas' ? 'text-blue-600' : 'text-slate-600'
              }`}
            >
              Gas
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Selectors cascade */}
      <Card title="Comercializadora y Producto">
        <Text className="text-xs font-semibold text-slate-500 mb-1.5">SELECCIONAR COMERCIALIZADORA</Text>
        {loadingComs ? (
          <ActivityIndicator size="small" color="#2563EB" />
        ) : (
          <View className="flex-row flex-wrap mb-4">
            {comercializadoras.map((c) => {
              const active = contrato.comercializadora_id === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => handleComercializadoraChange(c.id, c.nombre)}
                  className={`px-3.5 py-2 rounded-full border mr-2 mb-2 ${
                    active ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>
                    {c.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {errors.comercializadora && <Text className="text-xs text-red-500 mb-2">{errors.comercializadora}</Text>}

        {contrato.comercializadora_id && (
          <>
            <Text className="text-xs font-semibold text-slate-500 mb-1.5 mt-2">SELECCIONAR PRODUCTO</Text>
            {loadingProds ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : productos.length > 0 ? (
              <View className="flex-row flex-wrap mb-2">
                {productos.map((p, index) => {
                  const active = contrato.id_producto === p.id;
                  return (
                    <TouchableOpacity
                      key={`${p.id}-${index}`}
                      onPress={() => handleProductoChange(p.id, p.nombre, (p as any).tarifa_acceso)}
                      className={`px-3.5 py-2 rounded-full border mr-2 mb-2 ${
                        active ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>
                        {p.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text className="text-xs text-slate-400 mb-4">No hay productos disponibles para esta comercializadora.</Text>
            )}
            {errors.producto && <Text className="text-xs text-red-500 mb-2">{errors.producto}</Text>}
          </>
        )}
      </Card>

      {/* Technical parameters */}
      <Card title="Parámetros Técnicos">
        <Text className="text-xs font-semibold text-slate-500 mb-2">TARIFA DE ACCESO</Text>
        <View className="flex-row flex-wrap mb-4">
          {tarifasDisponibles.map((t) => {
            const active = contrato.tarifa === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => updateContrato({ tarifa: t })}
                className={`px-4 py-2 rounded-xl border mr-2 mb-2 ${
                  active ? 'bg-blue-600 border-blue-500' : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.tarifa && <Text className="text-xs text-red-500 mb-4">{errors.tarifa}</Text>}

        <Text className="text-xs font-semibold text-slate-500 mb-2">TIPO ALTA</Text>
        <View className="flex-row flex-wrap mb-4">
          {tiposAlta.map((alt) => {
            const active = contrato.tipo_alta === alt.value;
            return (
              <TouchableOpacity
                key={alt.value}
                onPress={() => updateContrato({ tipo_alta: alt.value })}
                className={`px-3 py-1.5 rounded-full border mr-2 mb-2 ${
                  active ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>
                  {alt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="flex-row justify-between items-center mb-4 pt-2 border-t border-slate-100">
          <Text className="text-xs font-semibold text-slate-600">¿Hay Cambio de Titular?</Text>
          <Switch
            value={contrato.cambio_titular}
            onValueChange={(val) => updateContrato({ cambio_titular: val })}
            trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
            thumbColor={contrato.cambio_titular ? '#2563EB' : '#F1F5F9'}
          />
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xs font-semibold text-slate-600">¿Hay Cambio de Potencia?</Text>
          <Switch
            value={contrato.cambio_potencia}
            onValueChange={(val) => updateContrato({ cambio_potencia: val })}
            trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
            thumbColor={contrato.cambio_potencia ? '#2563EB' : '#F1F5F9'}
          />
        </View>
      </Card>

      {/* Potencies inputs depending on Tariff and Suministro type */}
      {contrato.tipo_suministro === 'Luz' && (
        <Card title="Potencias en cada Periodo (kW)">
          {contrato.tarifa === '2.0TD' ? (
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Input
                  label="P1 (VALOR EN KW)"
                  placeholder="3.45"
                  keyboardType="numeric"
                  value={contrato.p1 !== undefined ? String(contrato.p1) : ''}
                  onChangeText={(val) => {
                    updateContrato({ p1: val as any });
                    if (errors.p1) setErrors({ ...errors, p1: '' });
                  }}
                  error={errors.p1}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="P2 (VALOR EN KW)"
                  placeholder="3.45"
                  keyboardType="numeric"
                  value={contrato.p2 !== undefined ? String(contrato.p2) : ''}
                  onChangeText={(val) => {
                    updateContrato({ p2: val as any });
                    if (errors.p2) setErrors({ ...errors, p2: '' });
                  }}
                  error={errors.p2}
                />
              </View>
            </View>
          ) : (
            <View className="space-y-2">
              <View className="flex-row space-x-3">
                <View className="flex-grow">
                  <Input
                    label="P1 (KW)"
                    placeholder="15.0"
                    keyboardType="numeric"
                    value={contrato.p1 !== undefined ? String(contrato.p1) : ''}
                    onChangeText={(val) => {
                      updateContrato({ p1: val as any });
                      if (errors.p1) setErrors({ ...errors, p1: '' });
                    }}
                    error={errors.p1}
                  />
                </View>
                <View className="flex-grow">
                  <Input
                    label="P2 (KW)"
                    placeholder="15.0"
                    keyboardType="numeric"
                    value={contrato.p2 !== undefined ? String(contrato.p2) : ''}
                    onChangeText={(val) => {
                      updateContrato({ p2: val as any });
                      if (errors.p2) setErrors({ ...errors, p2: '' });
                    }}
                    error={errors.p2}
                  />
                </View>
                <View className="flex-grow">
                  <Input
                    label="P3 (KW)"
                    placeholder="15.0"
                    keyboardType="numeric"
                    value={contrato.p3 !== undefined ? String(contrato.p3) : ''}
                    onChangeText={(val) => {
                      updateContrato({ p3: val as any });
                      if (errors.p3) setErrors({ ...errors, p3: '' });
                    }}
                    error={errors.p3}
                  />
                </View>
              </View>
              <View className="flex-row space-x-3">
                <View className="flex-grow">
                  <Input
                    label="P4 (KW)"
                    placeholder="15.0"
                    keyboardType="numeric"
                    value={contrato.p4 !== undefined ? String(contrato.p4) : ''}
                    onChangeText={(val) => {
                      updateContrato({ p4: val as any });
                      if (errors.p4) setErrors({ ...errors, p4: '' });
                    }}
                    error={errors.p4}
                  />
                </View>
                <View className="flex-grow">
                  <Input
                    label="P5 (KW)"
                    placeholder="15.0"
                    keyboardType="numeric"
                    value={contrato.p5 !== undefined ? String(contrato.p5) : ''}
                    onChangeText={(val) => {
                      updateContrato({ p5: val as any });
                      if (errors.p5) setErrors({ ...errors, p5: '' });
                    }}
                    error={errors.p5}
                  />
                </View>
                <View className="flex-grow">
                  <Input
                    label="P6 (KW)"
                    placeholder="15.0"
                    keyboardType="numeric"
                    value={contrato.p6 !== undefined ? String(contrato.p6) : ''}
                    onChangeText={(val) => {
                      updateContrato({ p6: val as any });
                      if (errors.p6) setErrors({ ...errors, p6: '' });
                    }}
                    error={errors.p6}
                  />
                </View>
              </View>
            </View>
          )}
        </Card>
      )}

      {/* Sips consumption inputs */}
      <Card title="Consumo Estimado">
        <Input
          label="CONSUMO ANUAL ESTIMADO (KWH)"
          placeholder="3000"
          keyboardType="number-pad"
          value={contrato.consumo_sips !== undefined ? String(contrato.consumo_sips) : ''}
          onChangeText={(val) => updateContrato({ consumo_sips: val as any })}
        />

        <Input
          label="OBSERVACIONES DEL CONTRATO"
          placeholder="Observaciones..."
          multiline
          numberOfLines={3}
          value={contrato.observaciones_contrato}
          onChangeText={(val) => updateContrato({ observaciones_contrato: val })}
        />
      </Card>
      </View>

      {/* Nav Actions */}
      <View className="mt-4 flex-row space-x-3">
        <Button title="Atrás" variant="outline" onPress={() => navigatePrev(router, 3)} className="flex-1" />
        <Button
          title="Siguiente Paso"
          onPress={handleNext}
          className="flex-1"
        />
      </View>
    </ScrollView>
  );
}
