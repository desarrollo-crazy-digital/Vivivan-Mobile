import React from 'react';
import { View, Text, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, children, className = '', ...props }) => {
  return (
    <View
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4 ${className}`}
      {...props}
    >
      {title && (
        <View className="mb-3">
          <Text className="text-lg font-bold text-slate-800">{title}</Text>
          {subtitle && <Text className="text-xs text-slate-400 mt-0.5">{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
};
