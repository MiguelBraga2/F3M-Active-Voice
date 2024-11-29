import React, { createContext, useContext, useState } from 'react';

interface FormDataContextProps {
  text: string;
  setText: (text: string) => void;
}

const FormDataContext = createContext<FormDataContextProps | undefined>(undefined);

export const useTextData = () => {
  const context = useContext(FormDataContext);
  if (!context) {
    throw new Error('useTextData must be used within a FormDataProvider');
  }
  return context;
};

export const FormTextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [text, setText] = useState('');  // Estado para armazenar o valor do campo de texto

  return (
    <FormDataContext.Provider value={{ text, setText }}>
      {children}
    </FormDataContext.Provider>
  );
};
