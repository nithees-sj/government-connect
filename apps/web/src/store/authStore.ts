import { create } from 'zustand';
import axios from 'axios';
import { api, setAccessToken } from '@/lib/api';
import type { UserRole, IUser, ICitizen } from '@govconnect/shared-types';

interface AuthState {
  user: IUser | null;
  citizen: ICitizen | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    phone?: string;
    dob?: string;
    aadhaarNumber?: string;
    panNumber?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: IUser | null, citizen?: ICitizen | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  citizen: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken, user, citizen } = data.data;
    setAccessToken(accessToken);
    set({ user, citizen: citizen || null, isAuthenticated: true, isLoading: false });
  },

  register: async (registerData) => {
    const { data } = await api.post('/auth/register', registerData);
    const { accessToken, user, citizen } = data.data;
    setAccessToken(accessToken);
    set({ user, citizen: citizen || null, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API network errors
    }
    setAccessToken(null);
    set({ user: null, citizen: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    try {
      // Try refresh to establish in-memory access token from HTTP-only cookie
      const refreshRes = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
      const token = refreshRes.data?.data?.accessToken;
      if (token) {
        setAccessToken(token);
        const { data } = await api.get('/auth/me');
        set({
          user: data.data.user || data.data,
          citizen: data.data.citizen || null,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch {
      // Refresh token cookie not present or expired
    }
    setAccessToken(null);
    set({ user: null, citizen: null, isAuthenticated: false, isLoading: false });
  },

  setUser: (user: IUser | null, citizen?: ICitizen | null) =>
    set({ user, citizen: citizen || null, isAuthenticated: !!user, isLoading: false }),
}));
