import React, { createContext, useContext, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * GameContext - جسر توافقي (Compatibility Bridge)
 * يقوم بربط Context API مباشرة مع مخزن Zustand المركزي (useGameStore)
 * لضمان عمل كافة المكونات القديمة والحديثة على نفس مصدر الحقيقة (Single Source of Truth).
 */
const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const store = useGameStore();

  useEffect(() => {
    store.rehydrateSession();
  }, []);

  return <GameContext.Provider value={store}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  // Directly return the reactive Zustand store state and actions
  return useGameStore();
};
