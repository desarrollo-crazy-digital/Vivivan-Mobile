import { create } from 'zustand';
import { Cliente, Contrato, Direccion } from '../types/db.types';
import { UserSession } from '../api/auth.service';

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
    set((state) => ({
      cliente: {
        ...(data.cliente || {}),
        iban: data.cliente?.iban || data.contrato?.iban || '',
      },
      direccion_fiscal: data.direccion_fiscal || {},
      direccion_facturacion: data.direccion_facturacion || {},
      punto_suministro: data.punto_suministro || {},
      contrato: {
        ...data.contrato,
        tarifa: data.contrato?.tarifa_acceso || data.contrato?.tarifa || '',
        tipo_suministro: data.contrato?.suministro || data.contrato?.tipo_suministro || 'Luz',
        id_producto: data.contrato?.producto_id || data.contrato?.id_producto || '',
        comercializadora_id: data.contrato?.comercializadora_id || data.contrato?.id_comercializadora || '',
      },
      documentos: (data.documentos_rel || []).map((doc: any) => ({
        uri: doc.url || '',
        name: doc.nombre_archivo || '',
        type: doc.tipo_documento || '',
      })),
      firmaBase64: data.contrato?.firma || null,
      currentStep: 1,
    })),

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
    }),
}));
