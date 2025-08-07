"use client";

import { createContext, useState, useEffect, ReactNode } from "react";

interface ModelContextType {
  model: string;
  setModel: (model: string) => void;
}

export const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider = ({ children }: { children: ReactNode }) => {
  const [model, setModel] = useState<string>("gpt-4o-mini");

  useEffect(() => {
    const storedModel = localStorage.getItem("selectedModel");
    if (storedModel) {
      setModel(storedModel);
    }
  }, []);

  const handleSetModel = (newModel: string) => {
    setModel(newModel);
    localStorage.setItem("selectedModel", newModel);
  };

  return (
    <ModelContext.Provider value={{ model, setModel: handleSetModel }}>
      {children}
    </ModelContext.Provider>
  );
};

