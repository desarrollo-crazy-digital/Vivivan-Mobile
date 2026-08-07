import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          button: 'bg-slate-100 border border-slate-200',
          text: 'text-slate-800 font-bold',
        };
      case 'danger':
        return {
          button: 'bg-red-500',
          text: 'text-white font-bold',
        };
      case 'outline':
        return {
          button: 'bg-transparent border border-blue-500',
          text: 'text-blue-500 font-bold',
        };
      case 'primary':
      default:
        return {
          button: 'bg-blue-600',
          text: 'text-white font-bold',
        };
    }
  };

  const styles = getStyles();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className={`rounded-xl py-3 px-5 flex-row items-center justify-center ${styles.button} ${
        isDisabled ? 'opacity-50' : ''
      } ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'secondary' || variant === 'outline' ? '#1E293B' : '#FFFFFF'} />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`text-sm text-center ${styles.text}`}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
