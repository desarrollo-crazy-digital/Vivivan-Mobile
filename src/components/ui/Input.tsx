import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle = '',
  className = '',
  ...props
}) => {
  return (
    <View className={`mb-4 ${containerStyle}`}>
      <Text className="text-xs font-semibold text-slate-500 mb-1">{label}</Text>
      <TextInput
        className={`bg-slate-50 border ${
          error ? 'border-red-500' : 'border-slate-200'
        } text-slate-800 text-sm rounded-xl px-4 py-3 focus:border-blue-500 ${className}`}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      {error && <Text className="text-xs text-red-500 mt-1 font-medium">{error}</Text>}
    </View>
  );
};
