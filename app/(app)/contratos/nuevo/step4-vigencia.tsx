import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useWizardStore } from '../../../../src/store/useWizardStore';
import { contratosService } from '../../../../src/api/contratos.service';
import { Card } from '../../../../src/components/ui/Card';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';

// Simple picker mock/styled list since standard Picker can be clunky across OS
import { TouchableOpacity } from 'react-native';

const normalizeStateValue = (value?: string | number | null) =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const resolveContractState = ({
  statusOptions,
  contrato,
}: {
  statusOptions: Array<{ id: number; label: string }>;
  contrato: any;
}) => {
  const explicitId = contrato?.id_estado_comercializadora;
  if (explicitId) {
    const matchingOption = statusOptions.find((option) => String(option.id) === String(explicitId));
    if (matchingOption) {
      return { id: matchingOption.id, label: matchingOption.label };
    }
  }

  const candidates = [
    contrato?.estado,
    contrato?.estado_label,
    contrato?.estado_nombre,
    contrato?.estado_comercializadora?.label,
    contrato?.estado_comercializadora?.estado,
    contrato?.estado_comercializadora?.nombre,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeStateValue(candidate);
    const matchingOption = statusOptions.find((option) => normalizeStateValue(option.label) === normalizedCandidate);
    if (matchingOption) {
      return { id: matchingOption.id, label: matchingOption.label };
    }
  }

  return null;
};

export default function Step4Vigencia() {
  const router = useRouter();
  const { contrato, updateContrato, user, navigateNext, navigatePrev } = useWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Fetch contract status list
  const { data: statusOptions = [], isLoading: loadingStatus } = useQuery({
    queryKey: ['estadosContrato'],
    queryFn: contratosService.getEstados,
  });

  // Filter status options: commercials can only select 'pendiente revisar documentación'
  const filteredStatusOptions = React.useMemo(() => {
    if (user?.role === 'comercial') {
      return statusOptions.filter((opt) => {
        const label = String(opt.label || '').toLowerCase();
        return label.includes('pendiente revisar') || label.includes('pendiente documentaci');
      });
    }
    return statusOptions;
  }, [statusOptions, user]);

  // Role helper logic
  const isComercial = user?.role === 'comercial';
  const isCreating = !contrato.id;
  const resolvedState = React.useMemo(
    () => resolveContractState({ statusOptions, contrato }),
    [statusOptions, contrato.estado, contrato.id_estado_comercializadora]
  );

  // Commercials can only edit status in creation or if active state is incidence/pendiente
  const canEditStatus = !isComercial || isCreating || 
    ['pendiente comercial', 'incidencia'].includes(String(contrato.estado || '').toLowerCase());

  const isObservador = user?.role === 'observador';
  const canEditFields = !isObservador && (!isComercial || isCreating || 
    ['pendiente comercial', 'incidencia'].includes(String(contrato.estado || '').toLowerCase()));

  // Default dates and default status for commercials
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (!contrato.fecha_registro) {
      updateContrato({ fecha_registro: todayStr });
    }
    if (!contrato.fecha_firma) {
      updateContrato({ fecha_firma: todayStr });
    }
    if (!contrato.fecha_alta) {
      updateContrato({ fecha_alta: todayStr });
    }
  }, []);

  useEffect(() => {
    if (statusOptions.length > 0) {
      const hasExistingState = Boolean(
        contrato.id_estado_comercializadora ||
        resolvedState?.id ||
        normalizeStateValue(contrato.estado)
      );

      if (!hasExistingState && isComercial) {
        const defaultOpt = statusOptions.find((opt) => {
          const label = String(opt.label || '').toLowerCase();
          return label.includes('pendiente revisar') || label.includes('pendiente documentaci');
        });
        if (defaultOpt) {
          updateContrato({
            id_estado_comercializadora: defaultOpt.id,
            estado: defaultOpt.label,
          });
        }
      }

      if (!contrato.id_estado_comercializadora && resolvedState?.id) {
        updateContrato({
          id_estado_comercializadora: resolvedState.id,
          estado: resolvedState.label,
        });
      }
    }
  }, [statusOptions, user, contrato.id_estado_comercializadora, contrato.estado, resolvedState?.id, resolvedState?.label, isComercial]);

  const validateDates = () => {
    const newErrors: Record<string, string> = {};
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!contrato.id_estado_comercializadora) {
      newErrors.estado = 'El estado es obligatorio';
    }

    if (contrato.fecha_registro && !dateRegex.test(contrato.fecha_registro)) {
      newErrors.fecha_registro = 'Formato inválido (AAAA-MM-DD)';
    }
    if (contrato.fecha_firma && !dateRegex.test(contrato.fecha_firma)) {
      newErrors.fecha_firma = 'Formato inválido (AAAA-MM-DD)';
    }
    if (contrato.fecha_alta && !dateRegex.test(contrato.fecha_alta)) {
      newErrors.fecha_alta = 'Formato inválido (AAAA-MM-DD)';
    }
    if (contrato.fecha_vencimiento && !dateRegex.test(contrato.fecha_vencimiento)) {
      newErrors.fecha_vencimiento = 'Formato inválido (AAAA-MM-DD)';
    }
    if (contrato.fecha_baja && !dateRegex.test(contrato.fecha_baja)) {
      newErrors.fecha_baja = 'Formato inválido (AAAA-MM-DD)';
    }

    // If status is 'baja', fecha_baja is required
    const selectedStateName = statusOptions.find(
      (o) => String(o.id) === String(contrato.id_estado_comercializadora)
    )?.label || '';
    if (selectedStateName.toLowerCase() === 'baja' && !contrato.fecha_baja) {
      newErrors.fecha_baja = 'La fecha de baja es obligatoria para este estado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateDates()) {
      navigateNext(router, 4);
    } else {
      Alert.alert('Formulario Incompleto', 'Por favor, corrige los errores antes de continuar.');
    }
  };

  const selectedStateName = resolvedState?.label || statusOptions.find(
    (o) => String(o.id) === String(contrato.id_estado_comercializadora)
  )?.label || 'Seleccionar...';

  return (
    <ScrollView className="flex-1 bg-slate-50 p-4">
      {!isCreating && !canEditFields && (
        <View className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl mb-4">
          <Text className="text-xs text-amber-700 font-bold leading-normal">
            ⚠️ Contrato en estado no editable. Se muestra en modo lectura.
          </Text>
        </View>
      )}

      <Text className="text-xl font-bold text-slate-800 mb-2">Paso 4: Vigencia del Contrato</Text>
      <Text className="text-xs text-slate-500 mb-4">Introduce los plazos y el estado de la tramitación.</Text>

      <View pointerEvents={canEditFields ? 'auto' : 'none'}>
        {/* Status Picker Card */}
        <Card title="Estado del Contrato">
          <Text className="text-xs font-bold text-slate-600 mb-1">ESTADO ACTUAL</Text>
        <TouchableOpacity
          disabled={!canEditStatus || loadingStatus}
          onPress={() => setShowStatusPicker(!showStatusPicker)}
          className={`p-3 border border-slate-200 rounded-xl bg-white mb-2 flex-row justify-between items-center ${
            !canEditStatus ? 'bg-slate-100' : ''
          }`}
        >
          {loadingStatus ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Text className="text-sm font-semibold text-slate-800">{selectedStateName}</Text>
          )}
          {canEditStatus && <Text className="text-xs text-blue-500 font-bold">Cambiar</Text>}
        </TouchableOpacity>
        {errors.estado && <Text className="text-xs text-rose-500 mb-2">{errors.estado}</Text>}

        {showStatusPicker && (
          <View className="border border-slate-100 rounded-xl bg-white max-h-[200px] overflow-hidden mb-4">
            <ScrollView nestedScrollEnabled>
              {filteredStatusOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  className="p-3 border-b border-slate-50 active:bg-slate-50"
                  onPress={() => {
                    updateContrato({
                      id_estado_comercializadora: opt.id,
                      estado: opt.label,
                    });
                    setShowStatusPicker(false);
                    setErrors((prev) => ({ ...prev, estado: '' }));
                  }}
                >
                  <Text className="text-sm text-slate-700">{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </Card>

      {/* Dates Inputs Card */}
      <Card title="Fechas de Tramitación">
        <Input
          label="FECHA DE REGISTRO (AAAA-MM-DD)"
          placeholder="AAAA-MM-DD"
          value={contrato.fecha_registro}
          onChangeText={(val) => {
            updateContrato({ fecha_registro: val });
            if (errors.fecha_registro) setErrors((prev) => ({ ...prev, fecha_registro: '' }));
          }}
          error={errors.fecha_registro}
        />

        <Input
          label="FECHA DE FIRMA (AAAA-MM-DD)"
          placeholder="AAAA-MM-DD"
          value={contrato.fecha_firma}
          onChangeText={(val) => {
            updateContrato({ fecha_firma: val });
            if (errors.fecha_firma) setErrors((prev) => ({ ...prev, fecha_firma: '' }));
          }}
          error={errors.fecha_firma}
        />

        <Input
          label="FECHA DE ALTA (AAAA-MM-DD)"
          placeholder="AAAA-MM-DD"
          value={contrato.fecha_alta}
          onChangeText={(val) => {
            updateContrato({ fecha_alta: val });
            if (errors.fecha_alta) setErrors((prev) => ({ ...prev, fecha_alta: '' }));
          }}
          error={errors.fecha_alta}
        />

        <Input
          label="FECHA DE VENCIMIENTO (AAAA-MM-DD)"
          placeholder="AAAA-MM-DD"
          value={contrato.fecha_vencimiento}
          onChangeText={(val) => {
            updateContrato({ fecha_vencimiento: val });
            if (errors.fecha_vencimiento) setErrors((prev) => ({ ...prev, fecha_vencimiento: '' }));
          }}
          error={errors.fecha_vencimiento}
        />

        <Input
          label="FECHA DE BAJA (AAAA-MM-DD)"
          placeholder="AAAA-MM-DD"
          value={contrato.fecha_baja}
          onChangeText={(val) => {
            updateContrato({ fecha_baja: val });
            if (errors.fecha_baja) setErrors((prev) => ({ ...prev, fecha_baja: '' }));
          }}
          error={errors.fecha_baja}
        />
      </Card>
      </View>

      {/* Navigation Buttons */}
      <View className="flex-row justify-between mt-4 mb-12">
        <Button title="Atrás" variant="outline" onPress={() => navigatePrev(router, 4)} className="w-[45%]" />
        <Button title="Siguiente" variant="primary" onPress={handleNext} className="w-[45%]" />
      </View>
    </ScrollView>
  );
}
