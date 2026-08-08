import { create } from 'zustand';
import { Cliente, Contrato, Direccion } from '../types/db.types';
import { UserSession } from '../api/auth.service';

const resolveEstadoContrato = (data: any) => {
  const contratoPayload = data?.contrato || data || {};
  const estadoCandidates = [
    contratoPayload?.estado,
    contratoPayload?.estado_label,
    contratoPayload?.estado_nombre,
    contratoPayload?.estado_comercializadora?.label,
    contratoPayload?.estado_comercializadora?.estado,
    contratoPayload?.estado_comercializadora?.nombre,
    contratoPayload?.estado_comercializadora_nombre,
    contratoPayload?.estado_comercializadora_label,
    contratoPayload?.estado_actual,
    contratoPayload?.estado_actual_label,
    data?.estado,
    data?.estado_label,
    data?.estado_nombre,
    data?.estado_comercializadora?.label,
    data?.estado_comercializadora?.estado,
    data?.estado_comercializadora?.nombre,
    data?.estado_comercializadora_nombre,
    data?.estado_comercializadora_label,
    data?.estado_actual,
    data?.estado_actual_label,
  ];

  const estadoLabel = estadoCandidates.find((value) => Boolean(value)) || '';

  const estadoIdCandidates = [
    contratoPayload?.id_estado_comercializadora,
    contratoPayload?.estado_id,
    contratoPayload?.estado_id_comercializadora,
    contratoPayload?.estado_comercializadora_id,
    contratoPayload?.estado_comercializadora?.id,
    data?.id_estado_comercializadora,
    data?.estado_id,
    data?.estado_id_comercializadora,
    data?.estado_comercializadora_id,
    data?.estado_comercializadora?.id,
  ];

  const estadoId = estadoIdCandidates.find((value) => value !== undefined && value !== null && value !== '') ?? undefined;

  return {
    estado: estadoLabel || contratoPayload?.estado || '',
    id_estado_comercializadora: estadoId ? Number(estadoId) : undefined,
  };
};

export interface WizardStep {
  id: number;
  name: string;
  description?: string;
}

export const WIZARD_STEP_ROUTES: Record<number, string> = {
  1: '/(app)/contratos/nuevo/step1-cliente',
  2: '/(app)/contratos/nuevo/step2-suministro',
  3: '/(app)/contratos/nuevo/step3-oferta',
  4: '/(app)/contratos/nuevo/step4-vigencia',
  5: '/(app)/contratos/nuevo/step5-infocomercial',
  6: '/(app)/contratos/nuevo/step6-comisiones',
  7: '/(app)/contratos/nuevo/step7-facturacion',
  8: '/(app)/contratos/nuevo/step8-confirmar',
};

interface WizardState {
  currentStep: number;
  availableSteps: WizardStep[];
  user: UserSession | null;
  cliente: Partial<Cliente>;
  direccion_fiscal: Partial<Direccion>;
  direccion_facturacion: Partial<Direccion>;
  punto_suministro: Partial<Direccion>;
  contrato: Partial<Contrato>;
  documentos: { uri: string; name: string; type: string }[];
  firmaBase64: string | null;
  isEditing: boolean;

  // Financial arrays for parity
  pagos_vivivan: any[];
  pagos_comercial: any[];
  decomisiones_vivivan: any[];
  decomisiones_comercial: any[];
  cobros_servicio: any[];
  pagos_servicio: any[];
  decomisiones_servicio: any[];

  // Actions
  setStep: (step: number) => void;
  setAvailableSteps: (steps: WizardStep[]) => void;
  setUser: (user: UserSession | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  navigateNext: (router: any, fromId?: number) => void;
  navigatePrev: (router: any, fromId?: number) => void;
  loadContractForEdit: (data: any) => void;
  updateCliente: (fields: Partial<Cliente>) => void;
  updateDireccionFiscal: (fields: Partial<Direccion>) => void;
  updateDireccionFacturacion: (fields: Partial<Direccion>) => void;
  updatePuntoSuministro: (fields: Partial<Direccion>) => void;
  updateContrato: (fields: Partial<Contrato>) => void;
  addDocumento: (doc: { uri: string; name: string; type: string }) => void;
  removeDocumento: (index: number) => void;
  setFirmaBase64: (base64: string | null) => void;
  resetWizard: () => void;
}

const initialClienteState: Partial<Cliente> = {
  nombre: '',
  nif_cif: '',
  email: '',
  movil: '',
  telefono: '',
  metodo_pago: 'DOMICILIACION',
  iban: '',
  es_empresa: false,
  nombre_firmante: '',
  apellidos_firmante: '',
  nif_cif_firmante: '',
  movil_firmante: '',
  email_firmante: '',
  fecha_nacimiento_firmante: '',
};

const initialDireccionState = (tipo: 'Suministro' | 'Fiscal' | 'Envio'): Partial<Direccion> => ({
  tipo_direcion: tipo,
  nombre_via: '',
  numero: '',
  puerta: '',
  piso: '',
  codigo_postal: '',
  poblacion: '',
  provincia: '',
  pais: 'España',
  cups: '',
});

const initialContratoState: Partial<Contrato> = {
  tipo_alta: 'Nueva',
  cambio_titular: false,
  cambio_potencia: false,
  tarifa: '2.0TD',
  p1: undefined,
  p2: undefined,
  p3: undefined,
  p4: undefined,
  p5: undefined,
  p6: undefined,
  consumo_sips: undefined,
  observaciones_contrato: '',
  observaciones_internas: '',
  tipo_suministro: 'Luz',
  fecha_alta: '',
  fecha_vencimiento: '',
  fecha_baja: '',
  id_estado_comercializadora: undefined,
  firma: 'DIGITAL_SMS',
};

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: 1,
  availableSteps: [],
  user: null,
  cliente: initialClienteState,
  direccion_fiscal: initialDireccionState('Fiscal'),
  direccion_facturacion: initialDireccionState('Envio'),
  punto_suministro: initialDireccionState('Suministro'),
  contrato: initialContratoState,
  documentos: [],
  firmaBase64: null,
  isEditing: false,

  // Financial arrays for parity
  pagos_vivivan: [],
  pagos_comercial: [],
  decomisiones_vivivan: [],
  decomisiones_comercial: [],
  cobros_servicio: [],
  pagos_servicio: [],
  decomisiones_servicio: [],

  setStep: (step) => set({ currentStep: step }),
  setAvailableSteps: (steps) => set({ availableSteps: steps }),
  setUser: (user) => set({ user }),

  nextStep: () =>
    set((state) => {
      const idx = state.availableSteps.findIndex((s) => s.id === state.currentStep);
      if (idx !== -1 && idx < state.availableSteps.length - 1) {
        return { currentStep: state.availableSteps[idx + 1].id };
      }
      return {};
    }),

  prevStep: () =>
    set((state) => {
      const idx = state.availableSteps.findIndex((s) => s.id === state.currentStep);
      if (idx > 0) {
        return { currentStep: state.availableSteps[idx - 1].id };
      }
      return {};
    }),

  navigateNext: (router, fromId) =>
    set((state) => {
      const activeStep = fromId !== undefined ? fromId : state.currentStep;
      const idx = state.availableSteps.findIndex((s) => s.id === activeStep);
      if (idx !== -1 && idx < state.availableSteps.length - 1) {
        const nextId = state.availableSteps[idx + 1].id;
        router.push(WIZARD_STEP_ROUTES[nextId] as any);
        return { currentStep: nextId };
      }
      return {};
    }),

  navigatePrev: (router, fromId) =>
    set((state) => {
      const activeStep = fromId !== undefined ? fromId : state.currentStep;
      const idx = state.availableSteps.findIndex((s) => s.id === activeStep);
      if (idx > 0) {
        const prevId = state.availableSteps[idx - 1].id;
        router.push(WIZARD_STEP_ROUTES[prevId] as any);
        return { currentStep: prevId };
      }
      return {};
    }),

  loadContractForEdit: (data) =>
    set((state) => {
      const contratoPayload = data?.contrato || data || {};
      const estadoContrato = resolveEstadoContrato(data);

      return {
        cliente: {
          ...(data.cliente || {}),
          id: String(data.cliente?.id || data.id_cliente || contratoPayload?.id_cliente || contratoPayload?.cliente_id || ''),
          iban: data.cliente?.iban || contratoPayload?.iban || '',
        },
        direccion_fiscal: data.direccion_fiscal || {},
        direccion_facturacion: data.direccion_facturacion || {},
        punto_suministro: data.punto_suministro || {},
        contrato: {
          ...contratoPayload,
          ...estadoContrato,
          tarifa: contratoPayload?.tarifa_acceso || contratoPayload?.tarifa || '',
          tipo_suministro: contratoPayload?.suministro || contratoPayload?.tipo_suministro || 'Luz',
          id_producto: contratoPayload?.producto_id || contratoPayload?.id_producto || '',
          comercializadora_id: contratoPayload?.comercializadora_id || contratoPayload?.id_comercializadora || '',
          comercial_id: String(contratoPayload?.comercial_id || contratoPayload?.codigo_comercial || data?.comercial_id || data?.codigo_comercial || ''),
          codigo_comercial: contratoPayload?.codigo_comercial || data?.codigo_comercial || undefined,
          firma: contratoPayload?.firma || contratoPayload?.tipo_firma || 'DIGITAL_SMS',
          tipo_firma: contratoPayload?.tipo_firma || contratoPayload?.firma || 'DIGITAL_SMS',
          numero_contrato_comercializadora: contratoPayload?.numero_contrato_comercializadora || contratoPayload?.n_contrato || '',
          tension: contratoPayload?.tension || '',
          nombre_servicio_1: contratoPayload?.nombre_servicio_1 || '',
          importe_servicio_1: contratoPayload?.importe_servicio_1 || 0,
          nombre_servicio_2: contratoPayload?.nombre_servicio_2 || '',
          importe_servicio_2: contratoPayload?.importe_servicio_2 || 0,
        },
        documentos: (data.documentos_rel || []).map((doc: any) => ({
          uri: doc.url || '',
          name: doc.nombre_archivo || '',
          type: doc.tipo_documento || '',
        })),
        firmaBase64: contratoPayload?.firma || null,
        currentStep: 1,
        isEditing: true,

        // Populate financial arrays from completo response
        pagos_vivivan: data.pagos_vivivan || [],
        pagos_comercial: data.pagos_comercial || [],
        decomisiones_vivivan: data.decomisiones_vivivan || [],
        decomisiones_comercial: data.decomisiones_comercial || [],
        cobros_servicio: data.cobros_servicio || [],
        pagos_servicio: data.pagos_servicio || [],
        decomisiones_servicio: data.decomisiones_servicio || [],
      };
    }),

  updateCliente: (fields) =>
    set((state) => ({
      cliente: { ...state.cliente, ...fields },
    })),

  updateDireccionFiscal: (fields) =>
    set((state) => ({
      direccion_fiscal: { ...state.direccion_fiscal, ...fields },
    })),

  updateDireccionFacturacion: (fields) =>
    set((state) => ({
      direccion_facturacion: { ...state.direccion_facturacion, ...fields },
    })),

  updatePuntoSuministro: (fields) =>
    set((state) => ({
      punto_suministro: { ...state.punto_suministro, ...fields },
    })),

  updateContrato: (fields) =>
    set((state) => ({
      contrato: { ...state.contrato, ...fields },
    })),

  addDocumento: (doc) =>
    set((state) => ({
      documentos: [...state.documentos, doc],
    })),

  removeDocumento: (index) =>
    set((state) => ({
      documentos: state.documentos.filter((_, i) => i !== index),
    })),

  setFirmaBase64: (base64) => set({ firmaBase64: base64 }),

  resetWizard: () =>
    set({
      currentStep: 1,
      availableSteps: [],
      cliente: initialClienteState,
      direccion_fiscal: initialDireccionState('Fiscal'),
      direccion_facturacion: initialDireccionState('Envio'),
      punto_suministro: initialDireccionState('Suministro'),
      contrato: initialContratoState,
      documentos: [],
      firmaBase64: null,
      isEditing: false,

      // Reset financial arrays
      pagos_vivivan: [],
      pagos_comercial: [],
      decomisiones_vivivan: [],
      decomisiones_comercial: [],
      cobros_servicio: [],
      pagos_servicio: [],
      decomisiones_servicio: [],
    }),
}));
