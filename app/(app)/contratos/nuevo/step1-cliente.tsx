import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Switch, Alert, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../../../src/store/useWizardStore';
import { clientesService } from '../../../../src/api/clientes.service';
import { authService } from '../../../../src/api/auth.service';
import { Card } from '../../../../src/components/ui/Card';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { Badge } from '../../../../src/components/ui/Badge';

// Spanish IBAN validator helper
function validateSpanishIBAN(iban: string): boolean {
  const cleanIban = iban.toUpperCase().replace(/\s/g, '');
  if (cleanIban.length !== 24) return false;
  if (!cleanIban.startsWith('ES')) return false;
  return /^[A-Z]{2}\d{22}$/.test(cleanIban);
}

export default function Step1Cliente() {
  const router = useRouter();
  const { cliente, updateCliente, resetWizard, setUser, setAvailableSteps, setStep, navigateNext, currentStep, availableSteps, contrato, user } = useWizardStore();
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [clientDocs, setClientDocs] = useState<Array<{ id: string; nombre: string; tipo: string; fecha_subida: string; url: string }>>([]);

  const targetClientId = cliente.id || (contrato as any).id_cliente || (contrato as any).cliente_id;

  const loadClientDocs = useCallback(async () => {
    if (targetClientId) {
      const docs = await clientesService.getClientDocuments(String(targetClientId));
      setClientDocs(docs);
    }
  }, [targetClientId]);

  useEffect(() => {
    loadClientDocs();
  }, [loadClientDocs]);

  const handleUploadClientDoc = async () => {
    if (!targetClientId) {
      Alert.alert('Cliente no guardado', 'Por favor, guarde o busque un cliente existente antes de adjuntar documentos.');
      return;
    }
    setUploadingDoc(true);
    try {
      const fileName = `DNI_Cliente_${Date.now()}.pdf`;
      await clientesService.uploadClientDocument(
        String(targetClientId),
        'file://documento_cliente.pdf',
        fileName,
        'application/pdf'
      );
      Alert.alert('Documento Subido', 'El documento se ha adjuntado correctamente al perfil del cliente en la base de datos.');
      await loadClientDocs();
    } catch (e: any) {
      console.warn('Error uploading client doc:', e);
      Alert.alert('Error al subir', 'No se pudo vincular el documento al cliente.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cifPrefixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'N', 'P', 'Q', 'R', 'S', 'U', 'V', 'W'];
  useEffect(() => {
    const val = (cliente.nif_cif || '').toUpperCase().trim();
    if (!val) return;
    const firstChar = val.charAt(0);
    const isCif = cifPrefixes.includes(firstChar);
    const newTipo = isCif ? 'Pyme' : 'Residencial';
    if (!cliente.tipo_cliente || (isCif && cliente.tipo_cliente === 'Residencial') || (!isCif && cliente.tipo_cliente === 'Pyme')) {
      updateCliente({
        tipo_cliente: newTipo,
        es_empresa: isCif,
        cnae: isCif ? (cliente.cnae === '9820' ? '' : cliente.cnae) : '9820',
      });
    }
  }, [cliente.nif_cif]);

  useEffect(() => {
    async function initWizard() {
      // 1. Fetch current user session
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      // 2. Compute available steps matching CRM availableSteps logic
      const isComercial = currentUser?.role === 'comercial';
      const canVerComisiones = currentUser?.role === 'master' || (currentUser?.modulos_accesibles || []).includes('VerComisiones');
      
      const steps = [
        { id: 1, name: 'Cliente' },
        { id: 2, name: 'Dirección' },
        { id: 3, name: 'Contratación' },
        { id: 4, name: 'Vigencia' },
        { id: 5, name: 'Info Comercial' },
      ];

      // Step 6: Comisiones
      const isAdministrativo = currentUser?.role === 'admin' || currentUser?.role === 'administracion';
      const isBackoffice = currentUser?.role === 'backoffice';
      const showComisiones = canVerComisiones && !( !isComercial && (isAdministrativo || isBackoffice) );
      if (showComisiones) {
        steps.push({ id: 6, name: 'Comisiones' });
      }

      // Step 7: Facturación (only visible on update for non-comercial users)
      const isEditing = !!contrato.id;
      if (isEditing && !isComercial) {
        steps.push({ id: 7, name: 'Facturación' });
      }
      
      // Step 8: Confirmar
      steps.push({ id: 8, name: 'Confirmar' });

      setAvailableSteps(steps);
      setStep(1);
    }
    initWizard();
  }, [contrato.id]);

  const handleSearch = async (text: string) => {
    setSearchTerm(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await clientesService.buscarClientes(text);
      setSearchResults(results);
    } catch (e) {
      console.warn('Search failed', e);
    } finally {
      setSearching(false);
    }
  };

  const selectExistingClient = (selected: any) => {
    const nombreVal = selected.nombre || selected.nombre_razon_social || selected.razon_social || selected.nombre_completo || selected.titular || '';
    const nifVal = selected.nif_cif || selected.cif_nif || selected.nif || selected.dni || '';
    const movilVal = selected.movil || selected.telefono || selected.phone || '';
    updateCliente({
      id: selected.id || selected.id_cliente,
      nombre: nombreVal,
      nif_cif: nifVal,
      email: selected.email || '',
      movil: movilVal,
      telefono: selected.telefono || movilVal,
      metodo_pago: selected.metodo_pago || 'DOMICILIACION',
      iban: selected.iban || selected.id_iban || '',
      es_empresa: !!selected.es_empresa,
      nombre_firmante: selected.nombre_firmante || nombreVal,
      apellidos_firmante: selected.apellidos_firmante || '',
      nif_cif_firmante: selected.nif_cif_firmante || nifVal,
      movil_firmante: selected.movil_firmante || movilVal,
      email_firmante: selected.email_firmante || selected.email || '',
      fecha_nacimiento_firmante: selected.fecha_nacimiento_firmante || '',
      cnae: selected.cnae || '',
    });
    setSearchTerm('');
    setSearchResults([]);
    Alert.alert('Cliente Vinculado', `Se ha seleccionado a ${nombreVal}`);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!cliente.nombre) newErrors.nombre = 'El nombre/razón social es obligatorio';
    if (!cliente.nif_cif) newErrors.nif_cif = 'El NIF/CIF es obligatorio';
    if (!cliente.movil) newErrors.movil = 'El móvil es obligatorio';
    
    // Firmante validations
    if (!cliente.nombre_firmante) newErrors.nombre_firmante = 'El nombre del firmante es obligatorio';
    if (!cliente.apellidos_firmante) newErrors.apellidos_firmante = 'Los apellidos son obligatorios';
    if (!cliente.nif_cif_firmante) newErrors.nif_cif_firmante = 'El NIF del firmante es obligatorio';
    if (!cliente.movil_firmante) newErrors.movil_firmante = 'El móvil del firmante es obligatorio';
    if (!cliente.email_firmante) newErrors.email_firmante = 'El email del firmante es obligatorio';

    // IBAN check
    if (cliente.iban) {
      if (!validateSpanishIBAN(cliente.iban)) {
        newErrors.iban = 'IBAN español inválido (Formato: ES + 22 dígitos)';
      }
    } else {
      newErrors.iban = 'El IBAN es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      Alert.alert('Campos Incompletos', 'Por favor, revise las alertas del formulario.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: upsert client solo to the backend
      const res = await clientesService.upsertClienteSolo(cliente);
      if (res.status === 'success') {
        // Save database identifiers in store
        updateCliente({
          id: res.cliente_id,
        });
        
        navigateNext(router, 1);
      }
    } catch (e: any) {
      console.error('Upsert client failed:', e);
      const detail = e.response?.data?.detail || 'Error al guardar los datos del cliente.';
      Alert.alert('Error', detail);
    } finally {
      setLoading(false);
    }
  };

  const stepIdx = availableSteps.findIndex((s) => s.id === 1) + 1;
  const totalSteps = availableSteps.length;

  const isComercial = user?.role === 'comercial';
  const isObservador = user?.role === 'observador';
  const isEditing = !!contrato.id;

  const canEditFields = !isObservador && (!isComercial || !isEditing || 
    ['pendiente comercial', 'incidencia'].includes(String(contrato.estado || '').toLowerCase()));

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 }}>
      {isEditing && !canEditFields && (
        <View className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl mb-4">
          <Text className="text-xs text-amber-700 font-bold leading-normal">
            ⚠️ Contrato en estado no editable. Se muestra en modo lectura.
          </Text>
        </View>
      )}

      {/* Step Indicator Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-xs text-blue-600 font-bold uppercase">Paso {stepIdx > 0 ? stepIdx : 1} de {totalSteps > 0 ? totalSteps : 8}</Text>
          <Text className="text-xl font-bold text-slate-800">Ficha del Cliente</Text>
        </View>
      </View>

      {/* Customer Search engine */}
      {canEditFields && (
        <Card title="Buscar Cliente Existente" subtitle="Filtra por NIF, Nombre o Teléfono">
          <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mb-2">
            <Input
              label=""
              placeholder="Buscar..."
              containerStyle="mb-0"
              value={searchTerm}
              onChangeText={handleSearch}
            />
          </View>
          {searching && <ActivityIndicator size="small" color="#2563EB" />}
          {searchResults.length > 0 && (
            <View className="max-h-[180px] border border-slate-100 rounded-xl bg-white mt-1 overflow-hidden">
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {searchResults.map((item, index) => {
                  const displayName = item.nombre || item.nombre_razon_social || item.razon_social || item.nombre_completo || item.titular || 'Cliente sin nombre';
                  const displayNif = item.nif_cif || item.cif_nif || item.nif || item.dni || '-';
                  const displayMovil = item.movil || item.telefono || item.phone || '-';

                  return (
                    <TouchableOpacity
                      key={String(item.id || item.id_cliente || index)}
                      onPress={() => selectExistingClient(item)}
                      className="p-3 border-b border-slate-100 last:border-0"
                    >
                      <Text className="text-xs font-bold text-slate-800">{displayName}</Text>
                      <Text className="text-[10px] text-slate-400">NIF: {displayNif} | Móvil: {displayMovil}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Card>
      )}

      {/* Inputs container pointer events block */}
      <View pointerEvents={canEditFields ? 'auto' : 'none'}>
        {/* Corporate toggle */}
        <Card title="Datos Principales">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-sm font-semibold text-slate-700">¿Es una empresa / Pyme?</Text>
          <Switch
            disabled={!canEditFields}
            value={cliente.es_empresa}
            onValueChange={(val) => updateCliente({ es_empresa: val })}
            trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
            thumbColor={cliente.es_empresa ? '#2563EB' : '#F1F5F9'}
          />
        </View>

        <Input
          label={cliente.es_empresa ? 'RAZÓN SOCIAL' : 'NOMBRE COMPLETO'}
          placeholder={cliente.es_empresa ? 'Empresa S.L.' : 'Juan Pérez'}
          value={cliente.nombre}
          onChangeText={(val) => {
            updateCliente({ nombre: val });
            if (errors.nombre) setErrors({ ...errors, nombre: '' });
          }}
          error={errors.nombre}
        />

        <Input
          label="NIF / CIF"
          placeholder="12345678A o B12345678"
          autoCapitalize="characters"
          value={cliente.nif_cif}
          onChangeText={(val) => {
            updateCliente({ nif_cif: val });
            if (errors.nif_cif) setErrors({ ...errors, nif_cif: '' });
          }}
          error={errors.nif_cif}
        />

        <Input
          label="TELÉFONO MÓVIL"
          placeholder="600000000"
          keyboardType="phone-pad"
          value={cliente.movil}
          onChangeText={(val) => {
            updateCliente({ movil: val });
            if (errors.movil) setErrors({ ...errors, movil: '' });
          }}
          error={errors.movil}
        />

        <View className="mb-4">
          <Text className="text-xs font-bold text-slate-700 uppercase mb-2">TIPO DE CLIENTE</Text>
          <View className="flex-row space-x-2">
            {['Residencial', 'Pyme', 'Gran Cuenta'].map((tipo) => {
              const active = (cliente.tipo_cliente || (cliente.es_empresa ? 'Pyme' : 'Residencial')) === tipo;
              return (
                <TouchableOpacity
                  key={tipo}
                  onPress={() => {
                    const isEmp = tipo !== 'Residencial';
                    updateCliente({
                      tipo_cliente: tipo,
                      es_empresa: isEmp,
                      cnae: tipo === 'Residencial' ? '9820' : (cliente.cnae === '9820' ? '' : cliente.cnae),
                    });
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl border items-center justify-center ${
                    active ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'
                  }`}
                >
                  <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-700'}`}>{tipo}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Input
          label="CNAE (CÓDIGO ACTIVIDAD)"
          placeholder="Ej: 9820"
          value={cliente.cnae || (cliente.es_empresa ? '' : '9820')}
          onChangeText={(val) => updateCliente({ cnae: val })}
        />

        <Input
          label="EMAIL (OPCIONAL)"
          placeholder="cliente@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={cliente.email}
          onChangeText={(val) => updateCliente({ email: val })}
        />
      </Card>

      {/* Firmante Obligatorio */}
      <Card title="Datos del Firmante (Obligatorio)">
        <Input
          label="NOMBRE"
          placeholder="Nombre"
          value={cliente.nombre_firmante}
          onChangeText={(val) => {
            updateCliente({ nombre_firmante: val });
            if (errors.nombre_firmante) setErrors({ ...errors, nombre_firmante: '' });
          }}
          error={errors.nombre_firmante}
        />

        <Input
          label="APELLIDOS"
          placeholder="Apellidos"
          value={cliente.apellidos_firmante}
          onChangeText={(val) => {
            updateCliente({ apellidos_firmante: val });
            if (errors.apellidos_firmante) setErrors({ ...errors, apellidos_firmante: '' });
          }}
          error={errors.apellidos_firmante}
        />

        <Input
          label="NIF FIRMANTE"
          placeholder="12345678A"
          autoCapitalize="characters"
          value={cliente.nif_cif_firmante}
          onChangeText={(val) => {
            updateCliente({ nif_cif_firmante: val });
            if (errors.nif_cif_firmante) setErrors({ ...errors, nif_cif_firmante: '' });
          }}
          error={errors.nif_cif_firmante}
        />

        <Input
          label="MÓVIL FIRMANTE"
          placeholder="600000000"
          keyboardType="phone-pad"
          value={cliente.movil_firmante}
          onChangeText={(val) => {
            updateCliente({ movil_firmante: val });
            if (errors.movil_firmante) setErrors({ ...errors, movil_firmante: '' });
          }}
          error={errors.movil_firmante}
        />

        <Input
          label="EMAIL FIRMANTE"
          placeholder="firmante@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={cliente.email_firmante}
          onChangeText={(val) => {
            updateCliente({ email_firmante: val });
            if (errors.email_firmante) setErrors({ ...errors, email_firmante: '' });
          }}
          error={errors.email_firmante}
        />

        <Input
          label="FECHA DE NACIMIENTO (OPCIONAL)"
          placeholder="1980-05-15"
          value={cliente.fecha_nacimiento_firmante}
          onChangeText={(val) => {
            updateCliente({ fecha_nacimiento_firmante: val });
            if (errors.fecha_nacimiento_firmante) setErrors({ ...errors, fecha_nacimiento_firmante: '' });
          }}
          error={errors.fecha_nacimiento_firmante}
        />
      </Card>

      {/* Datos Bancarios */}
      <Card title="Datos de Pago y Banco">
        <Input
          label="IBAN ESPAÑOL"
          placeholder="ES0000000000000000000000"
          autoCapitalize="characters"
          value={cliente.iban}
          onChangeText={(val) => {
            updateCliente({ iban: val });
            if (errors.iban) setErrors({ ...errors, iban: '' });
          }}
          error={errors.iban}
        />
      </Card>

      {/* Documentación Cliente */}
      <Card title="Documentación del Cliente" subtitle="Documentos adjuntos guardados en BD (DNI, NIF, Escrituras)">
        <View className="mb-3">
          <Button
            title={uploadingDoc ? "Subiendo..." : "➕ Adjuntar Documento al Cliente"}
            variant="outline"
            disabled={uploadingDoc}
            onPress={handleUploadClientDoc}
            className="w-full"
          />
        </View>

        {clientDocs.length > 0 ? (
          <View className="space-y-2">
            {clientDocs.map((doc) => (
              <View key={doc.id} className="flex-row justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-3 mb-2">
                <View className="flex-1 mr-2">
                  <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                    📄 {doc.nombre}
                  </Text>
                  {doc.fecha_subida ? (
                    <Text className="text-[10px] text-slate-400">Subido: {doc.fecha_subida}</Text>
                  ) : null}
                </View>
                <Badge status="Guardado" />
              </View>
            ))}
          </View>
        ) : (
          <View className="p-4 bg-slate-50 border border-slate-200 rounded-2xl items-center justify-center">
            <Text className="text-xs font-bold text-slate-700 mb-1">
              Sin documentos previos almacenados
            </Text>
            <Text className="text-[11px] text-slate-400 text-center">
              Los nuevos documentos cargados (DNI/CIF/Firmas) quedarán vinculados al cliente.
            </Text>
          </View>
        )}
      </Card>

      </View>

      {/* Nav Actions */}
      <View className="mt-4 flex-row space-x-3">
        <Button
          title="Siguiente Paso"
          onPress={handleNext}
          loading={loading}
          className="flex-grow"
        />
      </View>
    </ScrollView>
  );
}
