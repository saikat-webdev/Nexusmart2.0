import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface Setting {
  id: number;
  key: string;
  value: string;
  type: string;
  label: string;
  description: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      // Handle both direct array and wrapped responses
      const settingsData = response.data.data || response.data;
      const settingsArray = Array.isArray(settingsData) ? settingsData : [];
      setSettings(settingsArray);
      
      // Initialize form data
      const initialData: { [key: string]: string } = {};
      settingsArray.forEach((setting: Setting) => {
        initialData[setting.key] = setting.value;
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/settings', { settings: formData });
      toast.success('Settings saved successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  if (loading) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
        <p className="text-gray-600 mt-1">Configure your store settings and tax rates</p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">General Settings</h2>
        </div>

        <div className="p-6 space-y-6">
          {settings.map((setting) => (
            <div key={setting.id} className="border-b border-gray-200 pb-6 last:border-0">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {setting.label}
              </label>
              {setting.description && (
                <p className="text-xs text-gray-500 mb-3">{setting.description}</p>
              )}

              {setting.type === 'boolean' ? (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData[setting.key] === '1' || formData[setting.key] === 'true'}
                    onChange={(e) => handleChange(setting.key, e.target.checked ? '1' : '0')}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-600">
                    {formData[setting.key] === '1' || formData[setting.key] === 'true' ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ) : setting.type === 'number' ? (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    value={formData[setting.key] || ''}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {setting.key === 'tax_rate' && (
                    <span className="text-sm font-semibold text-blue-600">%</span>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={formData[setting.key] || ''}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {/* Preview for tax rate */}
              {setting.key === 'tax_rate' && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Example:</span> On a ₹100 purchase, tax will be ₹
                    {((parseFloat(formData[setting.key] || '0') / 100) * 100).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={() => fetchSettings()}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">💡 About Tax Settings</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Tax rate is applied to all sales automatically</li>
            <li>• Changes take effect immediately on new sales</li>
            <li>• Old invoices keep their original tax rates</li>
            <li>• You can disable tax calculation anytime</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">✅ Current Configuration</h3>
          <div className="text-sm text-green-700 space-y-2">
            <div className="flex justify-between">
              <span>Tax Rate:</span>
              <span className="font-bold">{formData.tax_rate || '0'}%</span>
            </div>
            <div className="flex justify-between">
              <span>Tax Status:</span>
              <span className="font-bold">
                {formData.tax_enabled === '1' ? '✓ Enabled' : '✗ Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax Label:</span>
              <span className="font-bold">{formData.tax_label || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Store Name:</span>
              <span className="font-bold">{formData.store_name || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
