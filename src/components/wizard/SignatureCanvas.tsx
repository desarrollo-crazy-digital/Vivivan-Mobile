import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Signature from 'react-native-signature-canvas';

interface SignatureCanvasProps {
  onOK: (signature: string) => void;
  onClear?: () => void;
  onClose: () => void;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onOK, onClear, onClose }) => {
  const ref = useRef<any>(null);

  const handleOK = (signature: string) => {
    // Signature is a base64 encoded PNG
    onOK(signature);
  };

  const handleClear = () => {
    ref.current?.clearSignature();
    if (onClear) onClear();
  };

  const handleConfirm = () => {
    ref.current?.readSignature();
  };

  const style = `.m-signature-pad--footer {display: none; margin: 0px;} body,html {width: 100%; height: 100%;}`;

  return (
    <View className="flex-1 bg-slate-900 justify-between p-6">
      <View className="flex-row justify-between items-center mt-10 mb-4">
        <TouchableOpacity
          onPress={onClose}
          className="bg-black/50 px-4 py-2 rounded-full border border-white/20"
        >
          <Text className="text-white font-bold text-xs">Cerrar</Text>
        </TouchableOpacity>
        <Text className="text-white text-base font-bold">Firma Digital del Suministro</Text>
        <TouchableOpacity
          onPress={handleClear}
          className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700"
        >
          <Text className="text-slate-300 font-bold text-xs">Limpiar</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 bg-white rounded-2xl overflow-hidden shadow-md">
        <Signature
          ref={ref}
          onOK={handleOK}
          webStyle={style}
          descriptionText="Firme dentro del cuadro blanco con el dedo"
          clearText="Borrar"
          confirmText="Confirmar"
          autoClear={false}
          imageType="image/png"
        />
      </View>

      <View className="py-6">
        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.8}
          className="w-full bg-blue-600 rounded-xl py-4 items-center justify-center shadow-lg"
        >
          <Text className="text-white font-bold text-base">Guardar y Vincular Firma</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
