import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  isAuthReady: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setAuthReady: (isReady: boolean) => void;
}

const ADMIN_UID = "R5idvX3ZhUUieWCi0mYFCESwPSA3";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthReady: false,
  isAdmin: false,
  setUser: (user) => set({ user, isAdmin: user?.uid === ADMIN_UID }),
  setAuthReady: (isReady) => set({ isAuthReady: isReady }),
}));
