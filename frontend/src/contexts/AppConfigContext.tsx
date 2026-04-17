import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface AppConfig {
  [key: string]: string | number | boolean;
}

interface AppConfigContextType {
  appConfig: AppConfig | null;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/settings');
      const settings = response.data.data || response.data;
      const settingsArray = Array.isArray(settings) ? settings : [];

      // Convert settings array to key-value object
      const config: AppConfig = {};
      settingsArray.forEach((setting: any) => {
        config[setting.key] = setting.value;
      });

      setAppConfig(config);
    } catch (err) {
      console.error('Failed to fetch app configuration:', err);
      setError('Failed to load application configuration');
      // Set default values on error
      setAppConfig(getDefaultConfig());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <AppConfigContext.Provider value={{ appConfig, loading, error, refreshConfig: fetchConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return context;
};

// Default configuration values (fallback)
const getDefaultConfig = (): AppConfig => ({
  store_name: 'NexusMart',
  store_tagline: 'Where Excellence Meets Convenience',
  tax_rate: '10',
  chart_color_primary: '#3B82F6',
  chart_color_success: '#10B981',
  chart_color_warning: '#F59E0B',
  chart_color_danger: '#EF4444',
  chart_color_purple: '#8B5CF6',
  chart_color_pink: '#EC4899',
});

// Helper functions to parse config values
export const getConfigValue = (config: AppConfig | null, key: string, defaultValue: any = null) => {
  if (!config || !(key in config)) {
    return defaultValue;
  }
  return config[key];
};

export const getConfigAsNumber = (config: AppConfig | null, key: string, defaultValue: number = 0) => {
  const value = getConfigValue(config, key, defaultValue);
  return typeof value === 'number' ? value : parseFloat(value as string) || defaultValue;
};

export const getConfigAsString = (config: AppConfig | null, key: string, defaultValue: string = '') => {
  const value = getConfigValue(config, key, defaultValue);
  return String(value);
};
