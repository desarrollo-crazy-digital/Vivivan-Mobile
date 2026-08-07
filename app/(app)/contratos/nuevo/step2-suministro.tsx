import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../../../src/store/useWizardStore';
import { contratosService } from '../../../../src/api/contratos.service';
import { Card } from '../../../../src/components/ui/Card';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';

export default function Step2Suministro() {
  const router = useRouter();
  const { punto_suministro, updatePuntoSuministro, updateContrato, resetWizard, navigateNext, navigatePrev, currentStep, availableSteps, contrato, user } = useWizardStore();
  
  const [loading, setLoading] = useState(false);
  const [sipsSuccess, setSipsSuccess] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCUPS = (cups: string): boolean => {
    const cleanCups = cups.toUpperCase().replace(/\s/g, '');
    if (cleanCups.length < 20 || cleanCups.length > 22) return false;
    if (!cleanCups.startsWith('ES')) return false;
    return /^ES\d{16,18}[A-Z]{2}([0-9A-Z]{2})?$/.test(cleanCups);
  };

  const handleSipsLookup = async () => {
    const cups = punto_suministro.cups || '';
    if (!cups.trim()) {
      Alert.alert('Falta CUPS', 'Por favor, ingrese un código CUPS primero.');
      return;
    }

    if (!validateCUPS(cups)) {
      Alert.alert('CUPS Inválido', 'El formato del CUPS no es válido. Debe comenzar con "ES" seguido de 20 o 22 caracteres alfanuméricos.');
      return;
    }

    setLoading(true);
    setSipsSuccess(null);
    try {
      const data = await contratosService.consultarCupsSips(cups.trim().toUpperCase());
      if (data && data.found) {
        setSipsSuccess(true);
        Alert.alert('SIPS Encontrado', 'Se han importado los datos del suministro correctamente.');
        
        // Autocomplete address details
        updatePuntoSuministro({
          nombre_via: data.nombre_via || punto_suministro.nombre_via,
          numero: data.numero || punto_suministro.numero,
          codigo_postal: data.codigo_postal || punto_suministro.codigo_postal,
          poblacion: data.poblacion || punto_suministro.poblacion,
          provincia: data.provincia || punto_suministro.provincia,
        });

        // Autocomplete technical powers if present
        if (data.potencias) {
          updateContrato({
            p1: data.potencias.p1,
            p2: data.potencias.p2,
            p3: data.potencias.p3,
            p4: data.potencias.p4,
            p5: data.potencias.p5,
            p6: data.potencias.p6,
            consumo_sips: data.annualKwh,
          });
        } else {
          updateContrato({
            consumo_sips: data.annualKwh,
          });
        }
      } else {
        setSipsSuccess(false);
        Alert.alert('SIPS No Encontrado', 'No se han localizado registros en SIPS para este CUPS. Por favor, rellene los campos manualmente.');
      }
    } catch (e: any) {
      console.warn('SIPS Lookup failed:', e);
      setSipsSuccess(false);
      Alert.alert('Error SIPS', 'Fallo al conectar con el servicio de consulta SIPS. Ingrese los datos manualmente.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};
    if (!punto_suministro.cups) newErrors.cups = 'El código CUPS es obligatorio';
    else if (!validateCUPS(punto_suministro.cups)) newErrors.cups = 'Formato de CUPS incorrecto (ej. ES0000...)';

    if (!punto_suministro.nombre_via) newErrors.nombre_via = 'La calle/vía de suministro es obligatoria';
    if (!punto_suministro.numero) newErrors.numero = 'El número es obligatorio';
    
    const cpStr = String(punto_suministro.codigo_postal || '').trim();
    if (!cpStr) newErrors.codigo_postal = 'El código postal es obligatorio';
    else if (cpStr.length !== 5 || !/^\d+$/.test(cpStr)) newErrors.codigo_postal = 'Debe ser de 5 dígitos';

    if (!punto_suministro.poblacion) newErrors.poblacion = 'La población es obligatoria';
    if (!punto_suministro.provincia) newErrors.provincia = 'La provincia es obligatoria';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert('Campos Incompletos', 'Por favor, revise los errores en la dirección de suministro.');
      return;
    }

    navigateNext(router, 2);
  };

  const isComercial = user?.role === 'comercial';
  const isObservador = user?.role === 'observador';
  const isEditing = !!contrato.id;

  const canEditFields = !isObservador && (!isComercial || !isEditing || 
    ['pendiente comercial', 'incidencia'].includes(String(contrato.estado || '').toLowerCase()));

  const stepIdx = availableSteps.findIndex((s) => s.id === 2) + 1;
  const totalSteps = availableSteps.length;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
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
          <Text className="text-xl font-bold text-slate-800">Dirección y CUPS</Text>
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
        {/* CUPS lookup card */}
      <Card title="Código CUPS" subtitle="Inserta el CUPS del suministro y consulta SIPS">
        <View className="flex-row items-center space-x-3 mb-2">
          <View className="flex-grow">
            <Input
              label="CÓDIGO CUPS"
              placeholder="ES0000..."
              autoCapitalize="characters"
              containerStyle="mb-0"
              value={punto_suministro.cups}
              onChangeText={(val) => {
                updatePuntoSuministro({ cups: val });
                if (errors.cups) setErrors({ ...errors, cups: '' });
                setSipsSuccess(null);
              }}
              error={errors.cups}
            />
          </View>
          <Button
            title="SIPS"
            onPress={handleSipsLookup}
            loading={loading}
            className="h-[48px]"
          />
        </View>

        {sipsSuccess === true && (
          <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mt-3">
            <Text className="text-emerald-700 text-xs font-semibold">
              ✔ Autocompletado exitoso desde SIPS.
            </Text>
          </View>
        )}

        {sipsSuccess === false && (
          <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
            <Text className="text-amber-700 text-xs font-semibold">
              ⚠ CUPS no localizado en SIPS. Por favor, complete la dirección manualmente.
            </Text>
          </View>
        )}
      </Card>

      {/* Manual details card */}
      <Card title="Dirección de Suministro">
        <Input
          label="CALLE / VÍA"
          placeholder="Av. de la Constitución"
          value={punto_suministro.nombre_via}
          onChangeText={(val) => {
            updatePuntoSuministro({ nombre_via: val });
            if (errors.nombre_via) setErrors({ ...errors, nombre_via: '' });
          }}
          error={errors.nombre_via}
        />

        <View className="flex-row space-x-3">
          <View className="w-1/2">
            <Input
              label="NÚMERO"
              placeholder="12"
              value={punto_suministro.numero}
              onChangeText={(val) => {
                updatePuntoSuministro({ numero: val });
                if (errors.numero) setErrors({ ...errors, numero: '' });
              }}
              error={errors.numero}
            />
          </View>
          <View className="w-1/2">
            <Input
              label="PISO / PUERTA"
              placeholder="3º B"
              value={punto_suministro.puerta}
              onChangeText={(val) => updatePuntoSuministro({ puerta: val })}
            />
          </View>
        </View>

        <Input
          label="CÓDIGO POSTAL"
          placeholder="41001"
          keyboardType="number-pad"
          maxLength={5}
          value={punto_suministro.codigo_postal}
          onChangeText={(val) => {
            updatePuntoSuministro({ codigo_postal: val });
            if (errors.codigo_postal) setErrors({ ...errors, codigo_postal: '' });
          }}
          error={errors.codigo_postal}
        />

        <Input
          label="POBLACIÓN"
          placeholder="Sevilla"
          value={punto_suministro.poblacion}
          onChangeText={(val) => {
            updatePuntoSuministro({ poblacion: val });
            if (errors.poblacion) setErrors({ ...errors, poblacion: '' });
          }}
          error={errors.poblacion}
        />

        <Input
          label="PROVINCIA"
          placeholder="Sevilla"
          value={punto_suministro.provincia}
          onChangeText={(val) => {
            updatePuntoSuministro({ provincia: val });
            if (errors.provincia) setErrors({ ...errors, provincia: '' });
          }}
          error={errors.provincia}
        />
      </Card>
      </View>

      {/* Nav Actions */}
      <View className="mt-4 flex-row space-x-3">
        <Button
          title="Atrás"
          variant="outline"
          onPress={() => navigatePrev(router, 2)}
          className="flex-1"
        />
        <Button
          title="Siguiente Paso"
          onPress={handleNext}
          className="flex-1"
        />
      </View>
    </ScrollView>
  );
}
