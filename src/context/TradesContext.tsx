import React, { createContext, useContext, useState } from 'react';
import { FetchedTrade } from '../pages/OptionsDB';

type TradesContextType = {
  trades: FetchedTrade[];
  setTrades: React.Dispatch<React.SetStateAction<FetchedTrade[]>>;
};

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export const TradesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trades, setTrades] = useState<FetchedTrade[]>([]);
  return (
    <TradesContext.Provider value={{ trades, setTrades }}>
      {children}
    </TradesContext.Provider>
  );
};

export const useTrades = () => {
  const ctx = useContext(TradesContext);
  if (!ctx) throw new Error('useTrades must be used within a TradesProvider');
  return ctx;
}; 