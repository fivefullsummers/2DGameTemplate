import { createContext, useContext, ReactNode } from 'react';
import { useControls } from '../hooks/useControls';

interface ControlsContextType {
  getControlsDirection: ReturnType<typeof useControls>['getControlsDirection'];
  consumeShootPress: ReturnType<typeof useControls>['consumeShootPress'];
  isShootHeld: ReturnType<typeof useControls>['isShootHeld'];
  setJoystickDirection: ReturnType<typeof useControls>['setJoystickDirection'];
}

const ControlsContext = createContext<ControlsContextType | null>(null);

export const ControlsProvider = ({ children }: { children: ReactNode }) => {
  const controls = useControls();
  
  return (
    <ControlsContext.Provider value={controls}>
      {children}
    </ControlsContext.Provider>
  );
};

export const useControlsContext = () => {
  const context = useContext(ControlsContext);
  if (!context) {
    throw new Error('useControlsContext must be used within a ControlsProvider');
  }
  return context;
};
