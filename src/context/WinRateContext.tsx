import React, { createContext, useContext, useState } from 'react';

// Define the context type
export type WinRateContextType = {
  winRate: number | null;
  setWinRate: (value: number) => void;
};

const WinRateContext = createContext<WinRateContextType | undefined>(undefined);

export const WinRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [winRate, setWinRate] = useState<number | null>(null);

  return (
    <WinRateContext.Provider value={{ winRate, setWinRate }}>
      {children}
    </WinRateContext.Provider>
  );
};

export const useWinRate = () => {
  const context = useContext(WinRateContext);
  if (!context) {
    throw new Error('useWinRate must be used within a WinRateProvider');
  }
  return context;
}; 