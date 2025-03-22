import { MappingRule } from '../renderer/Pages/HomePage';

export type Settings = {
  mappingRules?: MappingRule[];
  defaultCallerId?: string;
  availableCallerIds?: string[];
  zoomAccessToken?: string;
  zoomRefreshToken?: string;
  zoomTokenExpiration?: number;
};

export function readSettings() {
  const settingsPromise: Promise<Settings> = new Promise((resolve) => {
    window.electron.ipcRenderer.once('read-settings', (settings) => {
      resolve(settings as Settings);
    });
  });

  window.electron.ipcRenderer.sendMessage('read-settings');
  return settingsPromise;
}

export function saveSettings(settings: Settings) {
  window.electron.ipcRenderer.sendMessage('save-settings', settings);
}
