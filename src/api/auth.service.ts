import * as SecureStore from 'expo-secure-store';
import client from './client';

export interface UserSession {
  access_token: string;
  token_type: string;
  role: string;
  email: string;
  id: string;
  codigo: number;
  nombre: string;
  apellidos: string;
  can_view_global: boolean;
  modulos_accesibles?: string[];
  permisos_especiales?: boolean;
}

export const authService = {
  login: async (email: string, password: string): Promise<UserSession> => {
    const response = await client.post<UserSession>('/login', {
      email,
      password,
    });
    
    const data = response.data;
    if (data.access_token) {
      await SecureStore.setItemAsync('user_token', data.access_token);
      await SecureStore.setItemAsync('user_profile', JSON.stringify(data));
    }
    return data;
  },

  logout: async (): Promise<void> => {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_profile');
  },

  getCurrentUser: async (): Promise<UserSession | null> => {
    try {
      const profileStr = await SecureStore.getItemAsync('user_profile');
      return profileStr ? JSON.parse(profileStr) : null;
    } catch (e) {
      console.warn('Failed to parse current user from SecureStore', e);
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await SecureStore.getItemAsync('user_token');
    return !!token;
  },
};
