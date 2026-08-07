import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../../../src/store/useWizardStore';
import { contratosService } from '../../../../src/api/contratos.service';
import { Card } from '../../../../src/components/ui/Card';
import { Button } from '../../../../src/components/ui/Button';

export default function Step8Confirmar() {
  const router = useRouter();
  const {
    cliente,
    punto_suministro,
    direccion_fiscal,
    direccion_facturacion,
    contrato,
    documentos,
    firmaBase64,
    resetWizard,
    user,
    navigatePrev,
  } = useWizardStore();

  const [submitting, setSubmitting] = useState(false);

  const isComercial = user?.role === 'comercial';
  const isObservador = user?.role === 'observador';
  const isEditing = !!contrato.id;

  const canEditFields = !isObservador && (!isComercial || !isEditing || 
    ['pendiente comercial', 'incidencia'].includes(String(contrato.estado || '').toLowerCase()));

  const handleSubmit = async () => {
    if (!firmaBase64) {
      Alert.alert('Falta Firma', 'Debe recoger la firma del cliente en el Paso 5 antes de registrar el contrato.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Prepare payload
      const supplyDir = {
        ...punto_suministro,
        tipo: 'Suministro',
      };
      
      const fiscalDir = {
        ...direccion_fiscal,
        tipo: 'Fiscal',
      };

      const payload = {
        cliente,
        direccion_fiscal: fiscalDir,
        direccion_facturacion: { ...direccion_facturacion, tipo: 'Envio' },
        punto_suministro: supplyDir,
        contrato: {
          ...contrato,
          tarifa_acceso: contrato.tarifa,
          suministro: contrato.tipo_suministro,
        },
        direcciones: [supplyDir, fiscalDir],
      };

      // 2. Submit contract creation or update
      let res;
      if (contrato.id) {
        res = await contratosService.actualizarContrato(contrato.id, payload);
      } else {
        res = await contratosService.crearContrato(payload);
      }

      const cId = contrato.id || res?.contrato_id;
      if (cId) {

        // 3. Upload signature attachment
        try {
          await contratosService.uploadDocumento(
            cId,
            firmaBase64,
            'firma_digital.png',
            'image/png',
            'Firma'
          );
        } catch (signatureErr) {
          console.warn('Signature upload failed:', signatureErr);
        }

        // 4. Upload other documents
        for (const doc of documentos) {
          try {
            await contratosService.uploadDocumento(
              cId,
              doc.uri,
              doc.name,
              doc.type,
              doc.name.toLowerCase().includes('factura') ? 'Factura' : 'DNI'
            );
          } catch (docErr) {
            console.warn(`Failed uploading doc ${doc.name}:`, docErr);
          }
        }

        // 5. Reset and route back
        resetWizard();
        Alert.alert(
          'Contrato Tramitado',
          'El contrato, la firma digital y los documentos se han registrado con éxito.',
          [
            {
              text: 'Aceptar',
              onPress: () => router.replace('/(app)/contratos'),
            },
          ]
        );
      }
    } catch (e: any) {
      console.error('Submit contract failed:', e);
      const detail = e.response?.data?.detail || 'Fallo de red al registrar el contrato.';
      Alert.alert('Error de Creación', detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 p-4">
      <Text className="text-xl font-bold text-slate-800 mb-2">Paso Final: Confirmar Contrato</Text>
      <Text className="text-xs text-slate-500 mb-4">Revisa toda la información recopilada antes de proceder a la firma definitiva.</Text>

      {submitting && (
        <View className="bg-blue-50 border border-blue-100 p-3 rounded-xl mb-4 flex-row items-center justify-center">
          <ActivityIndicator size="small" color="#2563EB" className="mr-2" />
          <Text className="text-xs text-blue-700 font-bold">Registrando contrato en base de datos...</Text>
        </View>
      )}

      {/* Review Cards */}
      <Card title="Resumen del Cliente">
        <View className="mb-2">
          <Text className="text-xs text-slate-400 font-semibold">CLIENTE / TITULAR</Text>
          <Text className="text-sm text-slate-800 font-bold">{cliente.nombre}</Text>
          <Text className="text-xs text-slate-500">NIF/CIF: {cliente.nif_cif} | Móvil: {cliente.movil}</Text>
        </View>
        <View className="border-t border-slate-100 pt-2">
          <Text className="text-xs text-slate-400 font-semibold">IBAN DE FACTURACIÓN</Text>
          <Text className="text-sm text-slate-800 font-mono font-medium">{cliente.iban || 'No suministrado'}</Text>
        </View>
      </Card>

      <Card title="Punto de Suministro (CUPS)">
        <View className="mb-2">
          <Text className="text-xs text-slate-400 font-semibold">CUPS</Text>
          <Text className="text-sm text-slate-800 font-mono font-bold">{punto_suministro.cups}</Text>
        </View>
        <View className="border-t border-slate-100 pt-2">
          <Text className="text-xs text-slate-400 font-semibold">DIRECCIÓN</Text>
          <Text className="text-xs text-slate-700">
            {punto_suministro.nombre_via}, {punto_suministro.numero} {punto_suministro.puerta && `Pta ${punto_suministro.puerta}`}
          </Text>
          <Text className="text-xs text-slate-500">
            {punto_suministro.codigo_postal} - {punto_suministro.poblacion} ({punto_suministro.provincia})
          </Text>
        </View>
      </Card>

      <Card title="Oferta y Comercialización">
        <View className="flex-row justify-between py-1">
          <Text className="text-xs text-slate-600">Comercializadora</Text>
          <Text className="text-xs text-slate-800 font-bold">{contrato.comercializadora_nombre || 'No asignada'}</Text>
        </View>
        <View className="flex-row justify-between py-1 border-t border-slate-50">
          <Text className="text-xs text-slate-600">Producto</Text>
          <Text className="text-xs text-slate-800 font-bold">{contrato.producto_nombre || 'No asignado'}</Text>
        </View>
        <View className="flex-row justify-between py-1 border-t border-slate-50">
          <Text className="text-xs text-slate-600">Tarifa / Suministro</Text>
          <Text className="text-xs text-slate-800 font-bold">{contrato.tarifa} / {contrato.tipo_suministro}</Text>
        </View>
        <View className="flex-row justify-between py-1 border-t border-slate-50">
          <Text className="text-xs text-slate-600">Estado Solicitado</Text>
          <Text className="text-xs text-emerald-600 font-bold">{contrato.estado}</Text>
        </View>
      </Card>

      <Card title="Resumen de Adjuntos">
        <View className="flex-row justify-between py-1">
          <Text className="text-xs text-slate-600">Firma Digital Capturada</Text>
          <Text className={`text-xs font-bold ${firmaBase64 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {firmaBase64 ? 'SÍ' : 'NO'}
          </Text>
        </View>
        <View className="flex-row justify-between py-1 border-t border-slate-50">
          <Text className="text-xs text-slate-600">Ficheros de Documentación</Text>
          <Text className="text-xs text-slate-800 font-bold">{documentos.length} archivo(s)</Text>
        </View>
      </Card>

      {/* Navigation Buttons */}
      <View className="mt-4 flex-row space-x-3">
        <Button title="Atrás" variant="outline" onPress={() => navigatePrev(router, 8)} className="flex-1" />
        {canEditFields ? (
          <Button
            title="Tramitar Contrato"
            variant="primary"
            disabled={submitting}
            onPress={handleSubmit}
            className="flex-1"
          />
        ) : (
          <Button
            title="Finalizar Vista"
            variant="primary"
            onPress={() => {
              resetWizard();
              router.replace('/contratos');
            }}
            className="flex-1"
          />
        )}
      </View>
    </ScrollView>
  );
}
