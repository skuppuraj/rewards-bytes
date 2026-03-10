import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import superAdminApi from '../../lib/superAdminApi';

export default function RazorpayConfigPage() {
  const [cfg, setCfg]     = useState({ mode: 'test', testKeyId: '', testKeySecret: '', liveKeyId: '', liveKeySecret: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    superAdminApi.get('/superadmin/razorpay-config')
      .then(r => setCfg(r.data))
      .catch(() => toast.error('Failed to load config'));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await superAdminApi.put('/superadmin/razorpay-config', cfg);
      toast.success('Razorpay config saved!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const Field = ({ label, fieldKey, placeholder, secret }) => (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block font-semibold uppercase tracking-wide">{label}</label>
      <input
        type={secret ? 'password' : 'text'}
        value={cfg[fieldKey] || ''}
        onChange={e => setCfg(p => ({...p, [fieldKey]: e.target.value}))}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 font-mono"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-black mb-1">Razorpay Integration</h1>
        <p className="text-gray-400 text-sm mb-6">Configure Razorpay keys for payment processing</p>

        {/* Mode Toggle */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold mb-3">Active Mode</p>
          <div className="flex gap-3">
            {['test', 'live'].map(m => (
              <button key={m} onClick={() => setCfg(p => ({...p, mode: m}))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                  cfg.mode === m
                    ? m === 'live' ? 'bg-green-600 border-green-600 text-white' : 'bg-yellow-600 border-yellow-600 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}>
                {m === 'test' ? '🧪 Test Mode' : '🚀 Live Mode'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {cfg.mode === 'live'
              ? '⚠️ Live mode: real payments will be processed'
              : '🧪 Test mode: no real payments, use Razorpay test cards'}
          </p>
        </div>

        {/* Test Keys */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            <p className="text-sm font-bold">Test Keys</p>
          </div>
          <div className="space-y-3">
            <Field label="Test Key ID"     fieldKey="testKeyId"     placeholder="rzp_test_xxxxxxxxxxxxxxxx" />
            <Field label="Test Key Secret" fieldKey="testKeySecret" placeholder="Enter new secret to update" secret />
          </div>
        </div>

        {/* Live Keys */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <p className="text-sm font-bold">Live Keys</p>
          </div>
          <div className="space-y-3">
            <Field label="Live Key ID"     fieldKey="liveKeyId"     placeholder="rzp_live_xxxxxxxxxxxxxxxx" />
            <Field label="Live Key Secret" fieldKey="liveKeySecret" placeholder="Enter new secret to update" secret />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-sm disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
