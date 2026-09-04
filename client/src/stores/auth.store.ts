import { create } from 'zustand';
import { api } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    connectSocket(accessToken);

    set({ user, accessToken, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    disconnectSocket();

    set({ user: null, accessToken: null, isLoading: false });
  },

  fetchMe: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const cachedUser = localStorage.getItem('user');

      if (cachedUser && token) {
        set({
          user: JSON.parse(cachedUser),
          accessToken: token
        });
      }

      if (!token) {
        set({ isLoading: false });
        return;
      }

      const { data } = await api.get('/auth/me');

      localStorage.setItem('user', JSON.stringify(data));

      connectSocket(token);

      set({
        user: data,
        accessToken: token,
        isLoading: false
      });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      set({
        user: null,
        accessToken: null,
        isLoading: false
      });
    }
  },
}));