import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { contratosService } from '../../../src/api/contratos.service';
import { authService, UserSession } from '../../../src/api/auth.service';
import { useWizardStore } from '../../../src/store/useWizardStore';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';

export default function ContratosListScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const { loadContractForEdit, resetWizard } = useWizardStore();
  const [loadingContractId, setLoadingContractId] = useState<string | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');

  const handleEditContract = async (id: string) => {
    if (loadingContractId) return; // Prevent double clicks
    setLoadingContractId(id);
    try {
      const completoData = await contratosService.getContratoCompleto(id);
      loadContractForEdit(completoData);
      router.push('/contratos/nuevo/step1-cliente');
    } catch (e) {
      console.error('Failed to load contract details:', e);
      Alert.alert('Error', 'No se ha podido cargar la información detallada de este contrato.');
    } finally {
      setLoadingContractId(null);
    }
  };
  
  useEffect(() => {
    async function loadUser() {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    }
    loadUser();
  }, []);

  // Fetch contracts using React Query
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['contratos', currentUser?.codigo, searchQuery, selectedEstado],
    queryFn: async () => {
      if (!currentUser) return { total: 0, contratos: [] };

      // Set up parameters
      const params: any = {
        limit: 100,
        skip: 0,
      };

      // RBAC isolation by default: filter by comercial code unless admin/master/backoffice/observador/etc.
      const isManager = ['master', 'developer', 'administracion', 'backoffice', 'director_comercial', 'observador'].includes(currentUser.role) || currentUser.permisos_especiales;
      if (!isManager) {
        params.codigo_comercial = currentUser.codigo;
      }

      // Add query terms (check if it looks like CUPS or DNI or name)
      if (searchQuery.trim()) {
        const queryClean = searchQuery.trim().toUpperCase();
        if (queryClean.startsWith('ES')) {
          params.cups = queryClean;
        } else if (/^[A-Z0-9]/i.test(queryClean) && queryClean.length <= 10) {
          params.dni = queryClean;
        } else {
          params.cliente = searchQuery.trim();
        }
      }

      if (selectedEstado !== 'TODOS') {
        params.estado = selectedEstado;
      }

      return contratosService.getContratos(params);
    },
    enabled: !!currentUser,
  });

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/(auth)/login');
  };

  const renderContractItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleEditContract(item.id)}
      >
        <Card className="mb-3">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-xs text-slate-400 font-bold uppercase">
                CONTRATO #{item.codigo_contrato || item.id.substring(0, 8)}
              </Text>
              <Text className="text-sm font-bold text-slate-800 mt-0.5" numberOfLines={1} ellipsizeMode="tail">
                {item.cliente || 'Cliente sin nombre'}
              </Text>
            </View>
            <View className="shrink-0">
              <Badge status={item.estado || 'Borrador'} />
            </View>
          </View>

          <View className="border-t border-slate-100 my-2" />

          <View className="flex-row justify-between flex-wrap">
            <View className="w-1/2 mb-1.5">
              <Text className="text-[10px] text-slate-400 font-bold">CUPS</Text>
              <Text className="text-xs text-slate-700 font-semibold truncate">
                {item.cups || '—'}
              </Text>
            </View>
            <View className="w-1/2 mb-1.5">
              <Text className="text-[10px] text-slate-400 font-bold">COMERCIALIZADORA</Text>
              <Text className="text-xs text-slate-700 font-semibold">
                {item.comercializadora || '—'}
              </Text>
            </View>
            <View className="w-1/2">
              <Text className="text-[10px] text-slate-400 font-bold">TARIFA</Text>
              <Text className="text-xs text-slate-700 font-semibold">{item.tarifa || '—'}</Text>
            </View>
            <View className="w-1/2">
              <Text className="text-[10px] text-slate-400 font-bold">SUMINISTRO</Text>
              <Text className="text-xs text-slate-700 font-semibold">
                {item.suministro || 'Luz'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const estadosFiltro = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'Borrador', label: 'Borradores' },
    { value: 'Pendiente Firma', label: 'Firmas Pendientes' },
    { value: 'Activado', label: 'Activados' },
    { value: 'Rechazado', label: 'Rechazados' },
  ];

  return (
    <View className="flex-1 bg-slate-50">
      {/* Search Header */}
      <View className="bg-slate-900 px-6 pt-4 pb-6 rounded-b-[32px] shadow-lg shadow-slate-900/10">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-xs text-blue-400 font-bold">BIENVENIDO,</Text>
            <Text className="text-white text-lg font-bold">
              {currentUser ? `${currentUser.nombre} ${currentUser.apellidos}` : 'Comercial'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-slate-800/80 px-3.5 py-2 rounded-full border border-slate-700"
          >
            <Text className="text-white text-xs font-bold">Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View className="flex-row items-center bg-slate-800 rounded-2xl px-4 py-3 border border-slate-700">
          <TextInput
            placeholder="Buscar por CUPS, DNI o Nombre..."
            placeholderTextColor="#94A3B8"
            className="flex-1 text-white text-sm"
            autoCapitalize="none"
            autoCorrect={false}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text className="text-slate-400 text-xs font-semibold mr-1">Limpiar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="my-4 px-6">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={estadosFiltro}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => {
            const active = selectedEstado === item.value;
            return (
              <TouchableOpacity
                onPress={() => setSelectedEstado(item.value)}
                className={`px-4 py-2 rounded-full mr-2 border ${
                  active ? 'bg-blue-600 border-blue-500' : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main List */}
      <View className="flex-grow px-6">
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="text-slate-400 text-sm mt-3">Cargando contratos...</Text>
          </View>
        ) : (
          <FlatList
            data={data?.contratos || []}
            renderItem={renderContractItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#2563EB" />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-16 bg-white rounded-2xl border border-slate-100 p-6">
                <Text className="text-slate-500 text-sm font-bold text-center">
                  No se han encontrado contratos
                </Text>
                <Text className="text-slate-400 text-xs text-center mt-1">
                  Intenta cambiar los términos de búsqueda o filtros.
                </Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      {/* Floating Action Button (FAB) */}
      <View className="absolute bottom-20 right-6">
        <TouchableOpacity
          onPress={() => {
            resetWizard();
            router.push('/contratos/nuevo/step1-cliente');
          }}
          activeOpacity={0.8}
          className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center shadow-xl shadow-blue-600/30 border border-blue-500"
        >
          <Text className="text-white text-3xl font-light mb-1">+</Text>
        </TouchableOpacity>
      </View>

      {/* Global Absolute Loader Overlay */}
      {loadingContractId !== null && (
        <View className="absolute inset-0 bg-slate-900/15 items-center justify-center z-50">
          <View className="bg-white p-5 rounded-2xl shadow-2xl flex-row items-center space-x-3 border border-slate-50">
            <ActivityIndicator size="small" color="#2563EB" />
            <Text className="text-sm font-bold text-slate-800">Cargando previsualización...</Text>
          </View>
        </View>
      )}
    </View>
  );
}
