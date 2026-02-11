import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  getRetroScanlinesEnabled,
  setRetroScanlinesEnabled as persistRetroEnabled,
  getMotionBlurEnabled,
  setMotionBlurEnabled as persistMotionBlurEnabled,
  getCRTSettings,
  setCRTSettings as persistCRTSettings,
  getMotionBlurSettings,
  setMotionBlurSettings as persistMotionBlurSettings,
  getDitherEnabled,
  setDitherEnabled as persistDitherEnabled,
  type CRTSettings,
  type MotionBlurSettings,
} from "../utils/visualSettings";

interface VisualSettingsContextType {
  retroScanlinesEnabled: boolean;
  motionBlurEnabled: boolean;
  ditherEnabled: boolean;
  crtSettings: CRTSettings;
  motionBlurSettings: MotionBlurSettings;
  setRetroScanlinesEnabled: (enabled: boolean) => void;
  setMotionBlurEnabled: (enabled: boolean) => void;
  setDitherEnabled: (enabled: boolean) => void;
  setCRTSettings: (settings: Partial<CRTSettings>) => void;
  setMotionBlurSettings: (settings: Partial<MotionBlurSettings>) => void;
}

const VisualSettingsContext = createContext<VisualSettingsContextType | null>(null);

export const VisualSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [retroScanlinesEnabled, setRetroState] = useState(getRetroScanlinesEnabled);
  const [motionBlurEnabled, setMotionBlurState] = useState(getMotionBlurEnabled);
  const [ditherEnabled, setDitherState] = useState(getDitherEnabled);
  const [crtSettings, setCRTState] = useState(getCRTSettings);
  const [motionBlurSettings, setMotionBlurSettingsState] = useState(getMotionBlurSettings);

  useEffect(() => {
    setRetroState(getRetroScanlinesEnabled());
    setMotionBlurState(getMotionBlurEnabled());
    setDitherState(getDitherEnabled());
    setCRTState(getCRTSettings());
    setMotionBlurSettingsState(getMotionBlurSettings());
  }, []);

  const setRetroScanlinesEnabled = useCallback((enabled: boolean) => {
    setRetroState(enabled);
    persistRetroEnabled(enabled);
  }, []);

  const setMotionBlurEnabled = useCallback((enabled: boolean) => {
    setMotionBlurState(enabled);
    persistMotionBlurEnabled(enabled);
  }, []);

  const setDitherEnabled = useCallback((enabled: boolean) => {
    setDitherState(enabled);
    persistDitherEnabled(enabled);
  }, []);

  const setCRTSettings = useCallback((settings: Partial<CRTSettings>) => {
    persistCRTSettings(settings);
    setCRTState((prev) => ({ ...prev, ...settings }));
  }, []);

  const setMotionBlurSettings = useCallback((settings: Partial<MotionBlurSettings>) => {
    persistMotionBlurSettings(settings);
    setMotionBlurSettingsState((prev) => ({ ...prev, ...settings }));
  }, []);

  const value: VisualSettingsContextType = {
    retroScanlinesEnabled,
    motionBlurEnabled,
    ditherEnabled,
    crtSettings,
    motionBlurSettings,
    setRetroScanlinesEnabled,
    setMotionBlurEnabled,
    setDitherEnabled,
    setCRTSettings,
    setMotionBlurSettings,
  };

  return (
    <VisualSettingsContext.Provider value={value}>
      {children}
    </VisualSettingsContext.Provider>
  );
};

export function useVisualSettings(): VisualSettingsContextType {
  const context = useContext(VisualSettingsContext);
  if (!context) {
    throw new Error("useVisualSettings must be used within a VisualSettingsProvider");
  }
  return context;
}
