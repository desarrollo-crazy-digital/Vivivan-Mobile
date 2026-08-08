import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator, TouchableOpacity, Text, InteractionManager } from 'react-native';
import { authService } from '../../src/api/auth.service';
import { useWizardStore } from '../../src/store/useWizardStore';

export default function AppLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const isEditing = useWizardStore((s) => s.isEditing);
  const resetWizard = useWizardStore((s) => s.resetWizard);

  const handleCancel = () => {
    router.replace('/(app)/contratos');
    InteractionManager.runAfterInteractions(() => {
      resetWizard();
    });
  };

  const renderCancelHeaderButton = () => (
    <TouchableOpacity onPress={handleCancel} className="mr-2">
      <Text className="text-sm font-semibold text-white">Cancelar</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    async function checkAuth() {
      try {
        const authenticated = await authService.isAuthenticated();
        if (!authenticated) {
          router.replace('/(auth)/login');
        }
      } catch (e) {
        console.warn('Failed check auth', e);
        router.replace('/(auth)/login');
      } finally {
        setChecking(false);
      }
    }
    checkAuth();
  }, []);

  if (checking) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // If authenticated, render current sub-routes stack (contratos, clientes, etc)
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0F172A', // Slate-900 corporate header
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="contratos/index"
        options={{
          title: 'Vivivan Mobile',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="contratos/[id]"
        options={{
          title: 'Detalle del Contrato',
        }}
      />
      <Stack.Screen
        name="contratos/nuevo/step1-cliente"
        options={{
          title: 'Nuevo Contrato - Cliente',
          headerBackVisible: !isEditing,
          headerRight: renderCancelHeaderButton,
        }}
      />
      <Stack.Screen
        name="contratos/nuevo/step2-suministro"
        options={{
          title: 'Nuevo Contrato - Suministro',
          headerRight: renderCancelHeaderButton,
        }}
      />
      <Stack.Screen
        name="contratos/nuevo/step3-oferta"
        options={{
          title: 'Nuevo Contrato - Oferta',
          headerRight: renderCancelHeaderButton,
        }}
      />
      <Stack.Screen
        name="contratos/nuevo/step4-vigencia"
        options={{
          title: 'Nuevo Contrato - Vigencia',
          headerRight: renderCancelHeaderButton,
        }}
      />
      <Stack.Screen
        name="contratos/nuevo/step5-infocomercial"
        options={{
          title: 'Nuevo Contrato - Info Comercial',
          headerRight: renderCancelHeaderButton,
        }}
      />
      <Stack.Screen
        name="contratos/nuevo/step6-comisiones"
        options={{
          title: 'Nuevo Contrato - Comisiones',
          headerRight: renderCancelHeaderButton,
        }}
      />
      <Stack.Screen
        name="contratos/nuevo/step7-facturacion"
        options={{
          title: 'Nuevo Contrato - Facturación',
          headerRight: renderCancelHeaderButton,
        }}
      />
      <Stack.Screen
        name="contratos/nuevo/step8-confirmar"
        options={{
          title: 'Nuevo Contrato - Confirmar',
          headerRight: renderCancelHeaderButton,
        }}
      />
      <Stack.Screen
        name="clientes/[id]"
        options={{
          title: 'Ficha de Cliente',
        }}
      />
    </Stack>
  );
}
