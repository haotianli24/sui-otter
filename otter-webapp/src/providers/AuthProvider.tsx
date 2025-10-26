import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from 'react';

interface AuthContextType {
  address: string | null;
  setAddress: (addr: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [address, setAddr] = useState<string | null>(null);

  const setAddress = useCallback((addr: string | null) => {
    try {
      if (addr) localStorage.setItem('zklogin_address', addr);
      else localStorage.removeItem('zklogin_address');
    } catch {}
    setAddr(addr);
  }, []);

  const logout = useCallback(() => {
    setAddress(null);
    const google: any = (window as any).google;
    if (google?.accounts?.id?.disableAutoSelect) {
      google.accounts.id.disableAutoSelect();
    }
  }, [setAddress]);

  const value = useMemo(() => ({ address, setAddress, logout }), [address, setAddress, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
