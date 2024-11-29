import React, { createContext, useState, ReactNode, useMemo } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const DEFAULT_LANGUAGE = 'pt-BR';

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  
  // Memoriza o valor do contexto para evitar renderizações desnecessárias
  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <LanguageContext.Provider value={ value }>
      {children}
    </LanguageContext.Provider>
  );
};
