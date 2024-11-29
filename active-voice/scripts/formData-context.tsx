// src/FormDataContext.tsx (ou FormDataContext.js)
import { MyFormData } from '@/components/AppForm';
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Definindo a interface para o contexto
interface FormDataContextType {
  myformData: MyFormData | undefined;
  setFormData: (data: MyFormData) => void;
}

// Criando o contexto
const FormDataContext = createContext<FormDataContextType | undefined>(undefined);

interface FormDataProviderProps {
  children: ReactNode;
}

// Provedor do contexto
export const FormDataProvider = ({ children }: FormDataProviderProps) => {
  const [myformData, setFormData] = useState<MyFormData | undefined>(undefined);

  return (
    <FormDataContext.Provider value={{ myformData, setFormData }}>
      {children}
    </FormDataContext.Provider>
  );
};

// Hook para usar o contexto em outros componentes
export const useFormData = () => {
  const context = useContext(FormDataContext);
  
  if (context === undefined) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }

  return context;
};
