import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { MappingRule } from '../Pages/HomePage';

function readSettingsFromStorage() {
  const settingsPromise: Promise<Settings> = new Promise((resolve) => {
    window.electron.ipcRenderer.once('read-settings', (settings) => {
      resolve(settings as Settings);
    });
  });

  window.electron.ipcRenderer.sendMessage('read-settings');
  return settingsPromise;
}

function saveSettingsToStorage(settings: Settings) {
  window.electron.ipcRenderer.sendMessage('save-settings', settings);
}

export type CallLogEntry = {
  url: string;
  to: string;
  callerID: string;
  matched: boolean;
  matchID?: string;
  at: number;
};

export interface Settings {
  mappingRules?: MappingRule[];
  defaultCallerId?: string;
  availableCallerIds?: string[];
  zoomAccessToken?: string;
  zoomRefreshToken?: string;
  zoomTokenExpiration?: number;
  callLog?: CallLogEntry[];
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on initial mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await readSettingsFromStorage();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Function to update settings
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prevSettings) => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      // Save to storage
      saveSettingsToStorage(updatedSettings);
      return updatedSettings;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};
