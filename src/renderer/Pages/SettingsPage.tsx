/*
- Import/Export settings
- Set default tel handler
*/

import { useState, useEffect } from 'react';
import { useSettings, Settings } from '../context/SettingsContext';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import './SettingsPage.css';
import { TelHandler } from '../../shared/ipc';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [newCallerId, setNewCallerId] = useState('');
  const [currentTelHandler, setCurrentTelHandler] = useState<TelHandler | null>(
    null,
  );

  useEffect(() => {
    const getCurrentHandler = async () => {
      const handler = (await window.electron.ipcRenderer.invoke(
        'get-tel-handler',
      )) as TelHandler;
      setCurrentTelHandler(handler);
    };

    getCurrentHandler();
  }, []);

  // Function to add a new caller ID
  const handleAddCallerId = () => {
    if (!newCallerId || newCallerId.trim() === '') return;

    const currentCallerIds = settings.availableCallerIds || [];
    if (!currentCallerIds.includes(newCallerId)) {
      const updatedCallerIds = [...currentCallerIds, newCallerId];
      updateSettings({ availableCallerIds: updatedCallerIds });
      setNewCallerId('');
    }
  };

  // Function to remove a caller ID
  const handleRemoveCallerId = (cId: string) => {
    const currentCallerIds = settings.availableCallerIds || [];
    const updatedCallerIds = currentCallerIds.filter(
      (callerId) => callerId !== cId,
    );
    updateSettings({ availableCallerIds: updatedCallerIds });

    if (cId == settings.defaultCallerId) {
      updateSettings({
        defaultCallerId: '',
      });
    }
  };

  // Export settings as JSON
  const handleExportSettings = () => {
    const cleanedSettings: Settings = JSON.parse(JSON.stringify(settings));
    delete cleanedSettings.zoomAccessToken;
    delete cleanedSettings.zoomRefreshToken;
    delete cleanedSettings.zoomTokenExpiration;
    delete cleanedSettings.callLog;

    const settingsJson = JSON.stringify(cleanedSettings, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'zoom-call-manager-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import settings from JSON file
  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        updateSettings(importedSettings);
        alert('Settings imported successfully');
      } catch (error) {
        console.error('Error importing settings:', error);
        alert('Failed to import settings. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-container">
      <h1 className="settings-title">Settings</h1>

      <div className="settings-section">
        <h2 className="section-title">Caller IDs</h2>
        <p className="section-description">
          Manage the list of available caller IDs that can be used for outgoing
          calls.
        </p>

        <div className="caller-id-form">
          <PhoneInput
            className="text-input"
            id="pattern"
            placeholder="Enter phone number"
            defaultCountry="US"
            countryCallingCodeEditable={false}
            onChange={(val) => {
              if (val) setNewCallerId(val);
            }}
            required
          />
          <button
            onClick={handleAddCallerId}
            className="button primary-button"
            disabled={!newCallerId.trim()}
          >
            Add Caller ID
          </button>
        </div>

        <div className="table-container">
          <h3>Available Caller IDs:</h3>
          {settings.availableCallerIds &&
          settings.availableCallerIds.length > 0 ? (
            <table className="calls-table">
              <thead>
                <tr>
                  <th>Phone Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {settings.availableCallerIds.map((id) => (
                  <tr key={id}>
                    <td>{parsePhoneNumber(id)?.formatInternational()}</td>
                    <td>
                      <button
                        onClick={() => handleRemoveCallerId(id)}
                        className="button icon-button delete-button"
                        title="Remove"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-table-message">
              No caller IDs available. Add your first one above.
            </p>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-title">Import/Export Settings</h2>
        <p className="section-description">
          Backup your settings or restore from a previous backup.
        </p>

        <div className="import-export-buttons">
          <button
            onClick={handleExportSettings}
            className="button primary-button"
          >
            Export Settings
          </button>

          <label className="button secondary-button file-input-label">
            Import Settings
            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="file-input"
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-title">Tel Protocol Handler</h2>
        <p className="section-description">
          Set this app as the default handler for <b>tel:</b> links. This allows
          you to click on phone numbers in your browser and have them
          automatically handled by Zoom Call Manager.
        </p>
        <p className="section-description">
          Your current tel protocol handler is:{' '}
          <b>{currentTelHandler?.progId}</b>
        </p>

        <div className="import-export-buttons">
          {settings.previousTelHandler &&
          settings.previousTelHandler.progId !== currentTelHandler?.progId ? (
            <button
              onClick={async () => {
                window.electron.ipcRenderer.sendMessage(
                  'force-tel-handler',
                  settings.previousTelHandler,
                );

                const handler = (await window.electron.ipcRenderer.invoke(
                  'get-tel-handler',
                )) as TelHandler;
                setCurrentTelHandler(handler);
              }}
              className="button primary-button"
            >
              Revert to {settings.previousTelHandler.progId}
            </button>
          ) : (
            ''
          )}

          <button
            onClick={() => {
              if (
                currentTelHandler &&
                currentTelHandler.progId !== 'Zoom Call Manager.tel'
              ) {
                settings.previousTelHandler = currentTelHandler;
              }

              // When we call the handler change, it will first change to '', then to the actual new handler
              let currentStage = 'pre-disassociate';
              async function checkAssociation() {
                const handler = (await window.electron.ipcRenderer.invoke(
                  'get-tel-handler',
                )) as TelHandler;

                if (
                  currentStage === 'pre-disassociate' &&
                  (typeof handler.progId === 'undefined' ||
                    (typeof handler.progId !== 'undefined' &&
                      handler.progId !== currentTelHandler?.progId))
                ) {
                  currentStage = 'disassociated';
                } else if (
                  currentStage == 'disassociated' &&
                  typeof handler.progId !== 'undefined'
                ) {
                  currentStage = 're-associated';
                  setCurrentTelHandler(handler);
                  clearInterval(checkInterval);
                }
              }
              const checkInterval = setInterval(checkAssociation, 50);
              checkAssociation();

              window.electron.ipcRenderer.sendMessage('associate-tel');
            }}
            className="button primary-button"
          >
            Set as Default Tel Handler
          </button>
        </div>
      </div>
    </div>
  );
}
