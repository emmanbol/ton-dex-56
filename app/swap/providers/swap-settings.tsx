"use client";

import { createContext, useContext, useState } from "react";

type SwapSettings = {
  slippageTolerance: number;
  setSlippageTolerance: (value: SwapSettings["slippageTolerance"]) => void;
  autoSlippageTolerance: boolean;
  setAutoSlippageTolerance: (value: SwapSettings["autoSlippageTolerance"]) => void;
  omniston: boolean;
  setOmniston: (value: boolean) => void;
};

export const SLIPPAGE_TOLERANCE_OPTIONS = [0.005, 0.01, 0.05] as const;

export const DEFAULT_SLIPPAGE_TOLERANCE: SwapSettings["slippageTolerance"] = 0.05;
const DEFAULT_AUTO_SLIPPAGE_TOLERANCE: SwapSettings["autoSlippageTolerance"] = false;

const SwapSettingsContext = createContext<SwapSettings>({} as SwapSettings);

export const SwapSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [slippageTolerance, setSlippageTolerance] = useState(DEFAULT_SLIPPAGE_TOLERANCE);
  const [autoSlippageTolerance, setAutoSlippageTolerance] = useState(DEFAULT_AUTO_SLIPPAGE_TOLERANCE);
  const [omniston, setOmniston] = useState(true); // on by default = best price routing

  return (
    <SwapSettingsContext.Provider
      value={{
        slippageTolerance,
        setSlippageTolerance,
        autoSlippageTolerance,
        setAutoSlippageTolerance,
        omniston,
        setOmniston,
      }}
    >
      {children}
    </SwapSettingsContext.Provider>
  );
};

export const useSwapSettings = () => {
  const context = useContext(SwapSettingsContext);
  if (!context) {
    throw new Error("useSwapSettings must be used within a SwapSettingsProvider");
  }
  return context;
};