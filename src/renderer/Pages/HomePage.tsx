import { useState, useEffect } from 'react';
import 'react-phone-number-input/style.css';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import './HomePage.css';
import { useSettings } from '../context/SettingsContext';
import Banner from '../components/Banner';
import { EPage } from '../../shared/Page';

// Define the interface for a mapping rule
export interface MappingRule {
  id: string;
  pattern: string;
  zoomNumber: string;
  description: string;
}

export default function HomePage() {
  const { settings, updateSettings } = useSettings();
  const [isCurrentTelHandler, setIsCurrentTelHandler] = useState<boolean>(true);

  // State for the mapping rules
  const [mappingRules, setMappingRules] = useState<MappingRule[]>(
    settings.mappingRules || [],
  );

  // State for the form
  const [newRule, setNewRule] = useState<Omit<MappingRule, 'id'>>({
    pattern: '',
    zoomNumber: '',
    description: '',
  });

  // State for the default caller ID
  const [defaultCallerId, setDefaultCallerId] = useState<string>(
    settings.defaultCallerId || '',
  );
  const [availableCallerIds, setAvailableCallerIds] = useState<string[]>(
    settings.availableCallerIds || [],
  );

  // State for the edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<MappingRule | null>(null);

  // Load data from settings on component mount
  useEffect(() => {
    if (settings.mappingRules) setMappingRules(settings.mappingRules);

    if (settings.defaultCallerId) setDefaultCallerId(settings.defaultCallerId);

    if (settings.availableCallerIds)
      setAvailableCallerIds(settings.availableCallerIds);
  }, [
    settings.mappingRules,
    settings.defaultCallerId,
    settings.availableCallerIds,
  ]);

  // Save data to settings
  useEffect(() => {
    const mappingRulesChanged =
      JSON.stringify(mappingRules) !== JSON.stringify(settings.mappingRules);
    const callerIdChanged = defaultCallerId !== settings.defaultCallerId;

    if (mappingRulesChanged || callerIdChanged) {
      updateSettings({
        mappingRules,
        defaultCallerId,
        availableCallerIds,
      });
    }
  }, [
    mappingRules,
    defaultCallerId,
    availableCallerIds,
    settings.mappingRules,
    settings.defaultCallerId,
  ]);

  // Check if the app is the current tel handler
  useEffect(() => {
    const checkTelHandler = async () => {
      try {
        const isHandler =
          await window.electron.ipcRenderer.invoke('check-tel-handler');
        setIsCurrentTelHandler(isHandler);
      } catch (error) {
        console.error('Error checking tel handler:', error);
        setIsCurrentTelHandler(false);
      }
    };

    checkTelHandler();
  }, []);

  // Navigate to settings page
  const goToSettings = () => {
    window.electron.ipcRenderer.sendMessage('set-page', EPage.Settings);
  };

  // Handle input changes for the new rule form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewRule((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle default caller ID change
  const handleDefaultCallerIdChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setDefaultCallerId(e.target.value);
  };

  // Add a new rule
  const handleAddRule = () => {
    if (!newRule.pattern || !newRule.zoomNumber) {
      return; // Don't add if required fields are empty
    }

    const newId = Date.now().toString();
    setMappingRules((prev) => [
      ...prev,
      {
        id: newId,
        ...newRule,
      },
    ]);

    // Reset the form
    setNewRule({
      pattern: '',
      zoomNumber: '',
      description: '',
    });
  };

  // Delete a rule
  const handleDeleteRule = (id: string) => {
    setMappingRules((prev) => prev.filter((rule) => rule.id !== id));
  };

  // Open the edit dialog
  const handleOpenEditDialog = (rule: MappingRule) => {
    setEditingRule(rule);
    setEditDialogOpen(true);
  };

  // Close the edit dialog
  const handleCloseEditDialog = () => {
    setEditingRule(null);
    setEditDialogOpen(false);
  };

  // Save the edited rule
  const handleSaveEdit = () => {
    if (editingRule) {
      setMappingRules((prev) =>
        prev.map((rule) => (rule.id === editingRule.id ? editingRule : rule)),
      );
      handleCloseEditDialog();
    }
  };

  // Handle input changes for the editing rule
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (editingRule) {
      setEditingRule(
        (prev) =>
          ({
            ...prev,
            [name]: value,
          }) as MappingRule,
      );
    }
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Home</h1>

      {/* Banners for missing configurations */}
      {!isCurrentTelHandler && (
        <Banner
          type="warning"
          message="This app is not set as the default handler for tel: links. Set it as the default handler to enable automatic call handling."
          actionText="Go to Settings"
          onActionClick={goToSettings}
        />
      )}

      {availableCallerIds.length === 0 && (
        <Banner
          type="warning"
          message="You have no caller IDs configured. Please add caller IDs in the Settings page."
          actionText="Go to Settings"
          onActionClick={goToSettings}
        />
      )}

      {availableCallerIds.length > 0 && mappingRules.length === 0 && (
        <Banner
          type="info"
          message="You have no mapping rules configured. Add rules below to map incoming calls to specific Zoom numbers."
        />
      )}

      {/* Default Caller ID */}
      <div className="section">
        <h2 className="section-title">Default Caller ID</h2>
        <p className="section-description">
          Set the default caller ID to use for outgoing calls when no mapping
          rule matches.
        </p>
        <div className="form-group">
          <select
            id="default-caller-id"
            value={defaultCallerId}
            onChange={handleDefaultCallerIdChange}
            className="select-input"
          >
            <option value="">None</option>
            {availableCallerIds.map((id) => (
              <option key={id} value={id}>
                {parsePhoneNumber(id)?.formatInternational() || id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add New Rule */}
      <div className="section">
        <h2 className="section-title">Add New Mapping Rule</h2>
        <p className="section-description">
          Create rules to map incoming phone numbers to specific Zoom phone
          numbers.
        </p>
        <div className="form">
          <div className="form-group">
            <label htmlFor="pattern">Phone Number Pattern:</label>
            <PhoneInput
              className="text-input"
              id="pattern"
              placeholder="Enter phone number"
              defaultCountry="US"
              countryCallingCodeEditable={false}
              value={newRule.pattern}
              onChange={(val) => {
                setNewRule((prev) => ({
                  ...prev,
                  pattern: val as string,
                }));
              }}
              required
            />
            <small className="help-text">
              Any phone number that starts with this pattern will be matched.
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="zoomNumber">Zoom Phone Number:</label>
            <select
              id="zoomNumber"
              name="zoomNumber"
              value={newRule.zoomNumber}
              onChange={handleInputChange}
              className="select-input"
              required
            >
              <option value="">Select a Zoom number</option>
              {availableCallerIds.map((id) => (
                <option key={id} value={id}>
                  {parsePhoneNumber(id)?.formatInternational() || id}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <input
              type="text"
              id="description"
              name="description"
              value={newRule.description}
              onChange={handleInputChange}
              className="text-input"
              placeholder="Optional description for this rule"
            />
          </div>
          <button
            onClick={handleAddRule}
            disabled={
              !newRule.pattern ||
              !newRule.zoomNumber ||
              newRule.pattern.trim() === '' ||
              newRule.zoomNumber.trim() === ''
            }
            className="button primary-button"
          >
            Add Rule
          </button>
        </div>
      </div>

      {/* Mapping Rules */}
      <div className="section">
        <h2 className="section-title">Mapping Rules</h2>
        <p className="section-description">
          Manage your existing mapping rules between phone number patterns and
          Zoom phone numbers.
        </p>
        <div className="table-container">
          <table className="rules-table">
            <thead>
              <tr>
                <th>Phone Number Pattern</th>
                <th>Zoom Phone Number</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappingRules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    {parsePhoneNumber(rule.pattern)?.formatInternational() ||
                      rule.pattern}
                  </td>
                  <td>
                    {parsePhoneNumber(rule.zoomNumber)?.formatInternational() ||
                      rule.zoomNumber}
                  </td>
                  <td>{rule.description}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleOpenEditDialog(rule)}
                      className="button icon-button edit-button"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="button icon-button delete-button"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {mappingRules.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-table-message">
                    No mapping rules found. Add your first rule above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit */}
      {editDialogOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Mapping Rule</h2>
              <button onClick={handleCloseEditDialog} className="close-button">
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="form">
                <div className="form-group">
                  <label htmlFor="edit-pattern">Phone Number Pattern:</label>
                  <PhoneInput
                    className="text-input"
                    id="edit-pattern"
                    placeholder="Enter phone number"
                    defaultCountry="US"
                    countryCallingCodeEditable={false}
                    value={editingRule?.pattern || ''}
                    onChange={(val) => {
                      setEditingRule(
                        (prev) =>
                          ({
                            ...prev,
                            pattern: val as string,
                          }) as MappingRule,
                      );
                    }}
                    required
                  />
                  <small className="help-text">
                    Any phone number that starts with this pattern will be
                    matched
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-zoomNumber">Zoom Phone Number:</label>
                  <select
                    id="edit-zoomNumber"
                    name="zoomNumber"
                    value={editingRule?.zoomNumber || ''}
                    onChange={handleEditInputChange}
                    className="select-input"
                    required
                  >
                    <option value="">Select a Zoom number</option>
                    {availableCallerIds.map((id) => (
                      <option key={id} value={id}>
                        {parsePhoneNumber(id)?.formatInternational() || id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-description">Description:</label>
                  <input
                    type="text"
                    id="edit-description"
                    name="description"
                    value={editingRule?.description || ''}
                    onChange={handleEditInputChange}
                    className="text-input"
                    placeholder="Optional description for this rule"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={handleCloseEditDialog}
                className="button secondary-button"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="button primary-button"
                disabled={!editingRule?.pattern || !editingRule?.zoomNumber}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
