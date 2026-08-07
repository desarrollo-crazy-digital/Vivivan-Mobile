import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { contratosService } from '../../api/contratos.service';
import { Button } from '../ui/Button';

interface CameraOCRProps {
  onOcrCompleted: (data: any) => void;
  onCancel: () => void;
}

export const CameraOCR: React.FC<CameraOCRProps> = ({ onOcrCompleted, onCancel }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    // Camera permissions are still loading.
    return (
      <View className="flex-1 justify-center items-center bg-slate-900 p-4">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-white text-sm mt-3">Cargando permisos de cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View className="flex-1 justify-center items-center bg-slate-900 p-6">
        <Text className="text-white text-base text-center mb-6">
          Necesitamos permisos de acceso a la cámara para poder capturar y escanear el DNI o la factura.
        </Text>
        <Button title="Conceder Permiso" onPress={requestPermission} />
        <TouchableOpacity onPress={onCancel} className="mt-4">
          <Text className="text-slate-400 text-sm font-semibold">Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        if (photo?.uri) {
          setPhotoUri(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'No se ha podido capturar la foto.');
      }
    }
  };

  const analyzePhoto = async () => {
    if (!photoUri) return;

    setAnalyzing(true);
    try {
      // Send photo to the OCR endpoint
      const result = await contratosService.analyzeInvoiceOCR(
        photoUri,
        'ocr_capture.jpg',
        'image/jpeg'
      );

      if (result.success && result.data) {
        Alert.alert('Éxito', 'Documento procesado por IA correctamente.');
        onOcrCompleted(result.data);
      } else {
        Alert.alert('OCR Completado', 'No se pudieron extraer datos del documento.');
      }
    } catch (error: any) {
      console.error('OCR analysis failed:', error);
      Alert.alert('Error de OCR', 'Error enviando el archivo para su análisis. Asegúrate de estar conectado a internet.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      {photoUri ? (
        // Preview Screen
        <View className="flex-1 justify-between p-6">
          <Text className="text-white text-lg font-bold text-center mt-8 mb-4">¿Usar esta imagen?</Text>
          <View className="flex-1 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
            <Image source={{ uri: photoUri }} className="w-full h-full" resizeMode="contain" />
          </View>
          
          {analyzing ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-blue-400 text-sm mt-3 font-semibold">Analizando documento con IA...</Text>
            </View>
          ) : (
            <View className="flex-row justify-between py-6 space-x-3">
              <Button
                title="Repetir Foto"
                variant="secondary"
                onPress={() => setPhotoUri(null)}
                className="flex-1"
              />
              <Button
                title="Procesar OCR"
                variant="primary"
                onPress={analyzePhoto}
                className="flex-1"
              />
            </View>
          )}
        </View>
      ) : (
        // Live Camera View
        <CameraView style={StyleSheet.absoluteFill} ref={cameraRef}>
          <View className="flex-1 justify-between p-6">
            <View className="flex-row justify-between items-center mt-10">
              <TouchableOpacity
                onPress={onCancel}
                className="bg-black/50 px-4 py-2 rounded-full border border-white/20"
              >
                <Text className="text-white font-bold text-xs">Cerrar</Text>
              </TouchableOpacity>
              <Text className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-full">
                Coloca el documento en el encuadre
              </Text>
            </View>

            <View className="items-center mb-10">
              <TouchableOpacity
                onPress={takePhoto}
                className="w-20 h-20 bg-white rounded-full items-center justify-center border-4 border-slate-300 shadow-lg"
              >
                <View className="w-16 h-16 bg-white rounded-full border-2 border-slate-900" />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      )}
    </View>
  );
};
