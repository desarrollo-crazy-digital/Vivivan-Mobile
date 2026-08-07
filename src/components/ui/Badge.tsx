import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  status: string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    const raw = status.toLowerCase().trim();

    // Map according to "categoria_global" rules
    if (
      raw.includes('estimada') ||
      raw.includes('borrador') ||
      raw.includes('pendiente') ||
      raw.includes('firma')
    ) {
      return {
        bg: 'bg-amber-100 border border-amber-200',
        text: 'text-amber-700',
        label: 'Estimada / Borrador',
      };
    }

    if (
      raw.includes('activo') ||
      raw.includes('activado') ||
      raw.includes('tramitado') ||
      raw.includes('enviado')
    ) {
      return {
        bg: 'bg-emerald-100 border border-emerald-200',
        text: 'text-emerald-700',
        label: 'Activado / Tramitado',
      };
    }

    if (
      raw.includes('ko') ||
      raw.includes('rechazado') ||
      raw.includes('incidencia') ||
      raw.includes('cancelado')
    ) {
      return {
        bg: 'bg-rose-100 border border-rose-200',
        text: 'text-rose-700',
        label: 'Rechazado / KO',
      };
    }

    if (
      raw.includes('baja') ||
      raw.includes('renovado')
    ) {
      return {
        bg: 'bg-slate-100 border border-slate-200',
        text: 'text-slate-700',
        label: 'Baja / Renovado',
      };
    }

    // Fallback
    return {
      bg: 'bg-blue-100 border border-blue-200',
      text: 'text-blue-700',
      label: status,
    };
  };

  const style = getBadgeStyle();

  return (
    <View className={`px-2.5 py-1 rounded-full self-start items-center justify-center max-w-[160px] ${style.bg}`}>
      <Text 
        numberOfLines={1} 
        ellipsizeMode="tail" 
        className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}
      >
        {status}
      </Text>
    </View>
  );
};
