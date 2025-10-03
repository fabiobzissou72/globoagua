'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EmpresaAuth } from '@/lib/auth';

interface EmpresaContextType {
  empresa: EmpresaAuth | null;
  login: (empresa: EmpresaAuth) => void;
  logout: () => void;
  isLoading: boolean;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<EmpresaAuth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar empresa do localStorage
    if (typeof window !== 'undefined') {
      const empresaStorage = localStorage.getItem('empresa');
      if (empresaStorage) {
        try {
          setEmpresa(JSON.parse(empresaStorage));
        } catch (e) {
          console.error('Erro ao carregar empresa:', e);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = (empresaData: EmpresaAuth) => {
    setEmpresa(empresaData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('empresa', JSON.stringify(empresaData));
    }
  };

  const logout = () => {
    setEmpresa(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('empresa');
    }
  };

  return (
    <EmpresaContext.Provider value={{ empresa, login, logout, isLoading }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error('useEmpresa deve ser usado dentro de EmpresaProvider');
  }
  return context;
}
