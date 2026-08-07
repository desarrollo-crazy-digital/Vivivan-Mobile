import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../../../src/store/useWizardStore';
import { Card } from '../../../../src/components/ui/Card';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { CameraOCR } from '../../../../src/components/wizard/CameraOCR';
import { SignatureCanvas } from '../../../../src/components/wizard/SignatureCanvas';

export default function Step5InfoComercial() {
  const router = useRouter();
  const {
    contrato,
    updateContrato,
    documentos,
    addDocumento,
    removeDocumento,
    firmaBase64,
    setFirmaBase64,
    user,
    navigateNext,
    navigatePrev,
    updateCliente,
    updatePuntoSuministro,
    cliente,
    punto_suministro,
  } = useWizardStore();

  const [cameraVisible, setCameraVisible] = useState(false);
  const [signatureVisible, setSignatureVisible] = useState(false);

  // Role permissions
  const isComercial = user?.role === 'comercial';
  const savedStatusLabel = String(contrato.estado || '').toLowerCase();
  
  // Can upload if admin/backoffice/master, OR if commercial and status is pending/incidence/reviewing
  const canUploadDocs = !isComercial || 
    ['pendiente comercial', 'incidencia', 'pendiente revisar documentación'].includes(savedStatusLabel);

  const isObservador = user?.role === 'observador';
  const isEditing = !!contrato.id;
  const canEditFields = !isObservador && (!isComercial || !isEditing || 
    ['pendiente comercial', 'incidencia'].includes(String(contrato.estado || '').toLowerCase()));

  const handleOcrCompleted = (data: any) => {
    setCameraVisible(false);
    
    // Auto-update missing fields via OCR parsing
    if (data.cliente) {
      updateCliente({
        nombre: data.cliente.nombre || cliente.nombre,
        nif_cif: data.cliente.nif_cif || cliente.nif_cif,
        iban: data.cliente.iban || cliente.iban,
      });
    }
    
    if (data.cups) {
      updatePuntoSuministro({
        cups: data.cups || punto_suministro.cups,
        nombre_via: data.nombre_via || punto_suministro.nombre_via,
        numero: data.numero || punto_suministro.numero,
        codigo_postal: data.codigo_postal || punto_suministro.codigo_postal,
        poblacion: data.poblacion || punto_suministro.poblacion,
        provincia: data.provincia || punto_suministro.provincia,
      });
    }

    if (data.potencia_p1 || data.p1) {
      updateContrato({
        p1: data.potencia_p1 || data.p1 || contrato.p1,
        p2: data.potencia_p2 || data.p2 || contrato.p2,
        p3: data.potencia_p3 || data.p3 || contrato.p3,
        p4: data.potencia_p4 || data.p4 || contrato.p4,
        p5: data.potencia_p5 || data.p5 || contrato.p5,
        p6: data.potencia_p6 || data.p6 || contrato.p6,
        consumo_sips: data.consumo_anual || data.consumo_sips || contrato.consumo_sips,
      });
    }

    // Append to documents
    addDocumento({
      uri: 'file://ocr_invoice_image.jpg',
      name: `Factura_OCR_${Date.now()}.jpg`,
      type: 'image/jpeg',
    });
    Alert.alert('OCR Completado', 'Se han extraído y actualizado los datos técnicos del contrato.');
  };

  const handleSignatureCaptured = (signaturePngBase64: string) => {
    setFirmaBase64(signaturePngBase64);
    setSignatureVisible(false);
  };

  const handleAddMockFile = () => {
    if (!canUploadDocs) {
      Alert.alert('Acceso Restringido', 'Tu rol o el estado del contrato no permiten subir documentos.');
      return;
    }
    addDocumento({
      uri: 'file://contract_attachment.pdf',
      name: `Contrato_Doc_${Date.now()}.pdf`,
      type: 'application/pdf',
    });
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 p-4">
      {isEditing && !canEditFields && (
        <View className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl mb-4">
          <Text className="text-xs text-amber-700 font-bold leading-normal">
            ⚠️ Contrato en estado no editable. Se muestra en modo lectura.
          </Text>
        </View>
      )}

      <Text className="text-xl font-bold text-slate-800 mb-2">Paso 5: Info Comercial y Firma</Text>
      <Text className="text-xs text-slate-500 mb-4">Añade observaciones, adjunta documentos, realiza OCR y captura la firma del cliente.</Text>

      <View pointerEvents={canEditFields ? 'auto' : 'none'}>
        {/* Observations Card */}
        <Card title="Observaciones">
        <Input
          label="OBSERVACIONES DEL CONTRATO"
          placeholder="Escribe observaciones visibles para el cliente..."
          multiline
          numberOfLines={3}
          value={contrato.observaciones_contrato}
          onChangeText={(val) => updateContrato({ observaciones_contrato: val })}
        />

        <Input
          label="OBSERVACIONES INTERNAS"
          placeholder="Escribe notas internas para administración..."
          multiline
          numberOfLines={3}
          value={contrato.observaciones_internas}
          onChangeText={(val) => updateContrato({ observaciones_internas: val })}
        />
      </Card>

      {/* Attachments Card */}
      <Card title="Documentación y Escáner OCR">
        <View className="flex-row justify-between mb-4">
          <Button
            title="Escanear Factura (OCR)"
            variant="outline"
            disabled={!canUploadDocs}
            onPress={() => setCameraVisible(true)}
            className="w-[48%]"
          />
          <Button
            title="Adjuntar PDF"
            variant="outline"
            disabled={!canUploadDocs}
            onPress={handleAddMockFile}
            className="w-[48%]"
          />
        </View>

        {documentos.length > 0 ? (
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-500 mb-2">DOCUMENTOS ADJUNTOS ({documentos.length})</Text>
            {documentos.map((doc, idx) => (
              <View key={idx} className="flex-row justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                <Text className="text-xs text-slate-700 font-semibold truncate max-w-[70%]">{doc.name}</Text>
                {canUploadDocs && (
                  <TouchableOpacity onPress={() => removeDocumento(idx)}>
                    <Text className="text-xs text-rose-500 font-bold">Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-xs text-slate-400 text-center py-4 mb-4">Sin documentos adjuntos</Text>
        )}
      </Card>

      {/* Signature Card */}
      <Card title="Firma Digital">
        {firmaBase64 ? (
          <View className="items-center mb-4">
            <Image
              source={{ uri: `data:image/png;base64,${firmaBase64}` }}
              className="w-full h-32 border border-slate-200 rounded-xl bg-white mb-2"
              resizeMode="contain"
            />
            <Button
              title="Cambiar Firma"
              variant="outline"
              onPress={() => setSignatureVisible(true)}
              className="w-full"
            />
          </View>
        ) : (
          <View className="py-6 items-center">
            <Text className="text-xs text-slate-400 text-center mb-3">La firma del cliente es necesaria para validar el trámite.</Text>
            <Button
              title="Recoger Firma del Cliente"
              variant="primary"
              onPress={() => setSignatureVisible(true)}
              className="w-full"
            />
          </View>
        )}
      </Card>
      </View>

      {/* Navigation Buttons */}
      <View className="flex-row justify-between mt-4 mb-12">
        <Button title="Atrás" variant="outline" onPress={() => navigatePrev(router, 5)} className="w-[45%]" />
        <Button title="Siguiente" variant="primary" onPress={() => navigateNext(router, 5)} className="w-[45%]" />
      </View>

      {/* Camera OCR Modal */}
      <Modal visible={cameraVisible} animationType="slide">
        <CameraOCR onOcrCompleted={handleOcrCompleted} onCancel={() => setCameraVisible(false)} />
      </Modal>

      {/* Signature Canvas Modal */}
      <Modal visible={signatureVisible} animationType="slide">
        <SignatureCanvas onOK={handleSignatureCaptured} onClose={() => setSignatureVisible(false)} />
      </Modal>
    </ScrollView>
  );
}
