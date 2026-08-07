import React from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../../../src/store/useWizardStore';
import { Card } from '../../../../src/components/ui/Card';
import { Button } from '../../../../src/components/ui/Button';

export default function Step7Facturacion() {
  const router = useRouter();
  const { documentos, addDocumento, removeDocumento, user, navigateNext, navigatePrev, contrato } = useWizardStore();

  const isComercial = user?.role === 'comercial';
  const canUploadFacturacion = !isComercial;

  const isObservador = user?.role === 'observador';
  const isEditing = !!contrato.id;
  const canEditFields = !isObservador && (!isComercial || !isEditing || 
    ['pendiente comercial', 'incidencia'].includes(String(contrato.estado || '').toLowerCase()));

  const handleAddFacturacionDoc = () => {
    if (!canUploadFacturacion) {
      Alert.alert('Acceso Restringido', 'Los agentes comerciales no tienen permisos para adjuntar facturación.');
      return;
    }
    addDocumento({
      uri: 'file://billing_invoice_attachment.pdf',
      name: `Factura_Comercializadora_${Date.now()}.pdf`,
      type: 'application/pdf',
    });
  };

  const facturacionDocs = documentos.filter((d) => d.name.toLowerCase().includes('factura_comercializadora') || d.name.toLowerCase().includes('liq'));

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      {isEditing && !canEditFields && (
        <View className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl mb-4">
          <Text className="text-xs text-amber-700 font-bold leading-normal">
            ⚠️ Contrato en estado no editable. Se muestra en modo lectura.
          </Text>
        </View>
      )}

      <Text className="text-xl font-bold text-slate-800 mb-2">Paso 7: Facturación de Clientes</Text>
      <Text className="text-xs text-slate-500 mb-4">Sección reservada para la gestión y verificación de la facturación del contrato.</Text>

      <View pointerEvents={canEditFields && canUploadFacturacion ? 'auto' : 'none'}>

      {/* Permissions banner */}
      {isComercial && (
        <View className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl mb-4">
          <Text className="text-xs text-rose-700 leading-normal font-medium">
            ⚠️ Tu rol de comercial tiene privilegios restringidos para esta pestaña. Solo los usuarios de administración, backoffice o master pueden cargar documentos de facturación.
          </Text>
        </View>
      )}

      {/* Billing Docs Card */}
      <Card title="Documentación de Facturación">
        {canUploadFacturacion && (
          <Button
            title="Adjuntar Factura/Autofactura"
            variant="outline"
            onPress={handleAddFacturacionDoc}
            className="mb-4"
          />
        )}

        {facturacionDocs.length > 0 ? (
          <View>
            <Text className="text-xs font-bold text-slate-500 mb-2">FACTURAS ADJUNTAS ({facturacionDocs.length})</Text>
            {facturacionDocs.map((doc, idx) => (
              <View key={idx} className="flex-row justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                <Text className="text-xs text-slate-700 font-semibold truncate max-w-[70%]">{doc.name}</Text>
                {canUploadFacturacion && (
                  <TouchableOpacity onPress={() => removeDocumento(documentos.indexOf(doc))}>
                    <Text className="text-xs text-rose-500 font-bold">Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-xs text-slate-400 text-center py-6">Sin facturas adjuntas en este contrato.</Text>
        )}
      </Card>

      {/* Details mock */}
      <Card title="Detalles de Autofacturación">
        <View className="flex-row justify-between py-2 border-b border-slate-100">
          <Text className="text-xs text-slate-600">Número de Certificación</Text>
          <Text className="text-xs text-slate-800 font-semibold">N/D</Text>
        </View>
        <View className="flex-row justify-between py-2">
          <Text className="text-xs text-slate-600">Autofactura Asociada</Text>
          <Text className="text-xs text-slate-800 font-semibold">No emitida</Text>
        </View>
      </Card>
      </View>

      {/* Navigation Buttons */}
      <View className="mt-4 flex-row space-x-3">
        <Button title="Atrás" variant="outline" onPress={() => navigatePrev(router, 7)} className="flex-1" />
        <Button title="Siguiente" variant="primary" onPress={() => navigateNext(router, 7)} className="flex-1" />
      </View>
    </ScrollView>
  );
}
