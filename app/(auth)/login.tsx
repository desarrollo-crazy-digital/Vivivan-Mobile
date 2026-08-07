import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../src/api/auth.service';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }
    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.login(email.trim(), password);
      router.replace('/(app)/contratos');
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = error.response?.data?.detail || 'No se pudo iniciar sesión. Verifica tus credenciales.';
      Alert.alert('Error de Acceso', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-900"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo & Header */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <Text className="text-white text-3xl font-bold">V</Text>
            </View>
            <Text className="text-white text-2xl font-bold font-title">Soluciones Vivivan</Text>
            <Text className="text-slate-400 text-sm mt-1">Plataforma Móvil Comercial</Text>
          </View>

          {/* Form Card */}
          <View className="bg-white rounded-3xl p-6 shadow-xl shadow-black/10">
            <Text className="text-slate-800 text-lg font-bold mb-6 text-center">
              Iniciar Sesión
            </Text>

            <Input
              label="CORREO ELECTRÓNICO"
              placeholder="ejemplo@vivivan.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
            />

            <Input
              label="CONTRASEÑA"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
            />

            <Button
              title="Entrar"
              onPress={handleLogin}
              loading={loading}
              className="mt-4"
            />
          </View>

          {/* Footer note */}
          <Text className="text-center text-xs text-slate-500 mt-8">
            Vivivan Mobile v1.0.0 — Todos los derechos reservados.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
