// contexts/SystemSettingsContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const SystemSettingsContext = createContext();

export const SystemSettingsProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);

  const [settings, setSettings2] = useState({
    factoryName: "",
    invoiceFactoryName: "",
    systemFont: "Cairo",
    invoiceFont: "Hooz",
    theme: {
      primary: "#0A2947",
      secondary: "#8B5E3C",
      accent: "#8B5E3C",
      background: "#F3E4C9",
    },
    financialPinUpdatedDate: null,
    updatedBy: null,
    financialPinUpdatedBy: null,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/settings");

      if (data.success) {
        setSettings2(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
  const root = document.documentElement;

  root.style.setProperty("--primary", settings.theme.primary);
  root.style.setProperty("--secondary", settings.theme.secondary);
  root.style.setProperty("--accent", settings.theme.accent);
  root.style.setProperty("--background", settings.theme.background);
}, [settings]);

  return (
    <SystemSettingsContext.Provider
      value={{
        settings,
        setSettings2,
        fetchSettings,
        loading,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => {
  return useContext(SystemSettingsContext);
};