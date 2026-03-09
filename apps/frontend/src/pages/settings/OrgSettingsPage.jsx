import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/PageHeader';

const FONTS = ['Inter', 'Roboto', 'Poppins', 'Nunito', 'Lato', 'Montserrat'];

export default function OrgSettingsPage() {
  const [form, setForm] = useState({
    orgName: '', websiteUrl: '', fontStyle: 'Inter',
    primaryButtonColor: '#6366f1', secondaryButtonColor: '#8b5cf6',
    primaryTextColor: '#111827', secondaryTextColor: '#6b7280',
    googleReviewLink: '',
    socialMedia: { instagram: '', whatsapp: '', twitter: '', facebook: '' },
    whatsappOtpEnabled: true, marketingConsentEnabled: true,
    onePlayPerDayPerPhone: true, onePlayPerIp: false, feedbackEnabled: true,
    logo: null, backgroundImage: null
  });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState({ logo: null, bg: null });

  useEffect(() => {
    api.get('/org-settings').then(r => {
      if (r.data) {
        setForm(prev => ({ ...prev, ...r.data, socialMedia: { ...prev.socialMedia, ...r.data.socialMedia } }));
        if (r.data.logoUrl) setPreview(p => ({ ...p, logo: r.data.logoUrl }));
        if (r.data.backgroundImageUrl) setPreview(p => ({ ...p, bg: r.data.backgroundImageUrl }));
      }
    });
  }, []);

  const handleFile = (field, file) => {
    setForm(p => ({ ...p, [field]: file }));
    const previewKey = field === 'logo' ? 'logo' : 'bg';
    setPreview(p => ({ ...p, [previewKey]: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'logo' || k === 'backgroundImage') {
          if (v) fd.append(k === 'logo' ? 'logo' : 'backgroundImage', v);
        } else if (k === 'socialMedia') {
          fd.append('socialMedia', JSON.stringify(v));
        } else if (v !== null && v !== undefined) {
          fd.append(k, v);
        }
      });
      await api.patch('/org-settings', fd);
      toast.success('Settings saved!');
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving settings'); }
    finally { setSaving(false); }
  };

  const Section = ({ title, children }) => (
    <div className="card p-5 mb-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  );

  const Toggle = ({ label, field, sublabel }) => (
    <div className="flex items-center justify-between py-2">
      <div><p className="text-sm text-gray-700">{label}</p>{sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}</div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={!!form[field]}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.checked }))} />
        <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-brand peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
      </label>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl">
      <PageHeader title="Organization Settings" subtitle="Customize your game page branding and rules" />
      <form onSubmit={handleSubmit}>
        <Section title="Organization">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Organization Name</label><input className="input" value={form.orgName || ''} onChange={e => setForm(p=>({...p,orgName:e.target.value}))} /></div>
            <div><label className="label">Website URL</label><input className="input" type="url" value={form.websiteUrl || ''} onChange={e => setForm(p=>({...p,websiteUrl:e.target.value}))} /></div>
          </div>
        </Section>

        <Section title="Branding">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Logo</label>
              <input className="input" type="file" accept="image/*" onChange={e => handleFile('logo', e.target.files[0])} />
              {preview.logo && <img src={preview.logo} alt="Logo" className="mt-2 h-12 object-contain rounded" />}
            </div>
            <div>
              <label className="label">Background Image</label>
              <input className="input" type="file" accept="image/*" onChange={e => handleFile('backgroundImage', e.target.files[0])} />
              {preview.bg && <img src={preview.bg} alt="Background" className="mt-2 h-12 w-full object-cover rounded" />}
            </div>
            <div><label className="label">Font Style</label>
              <select className="input" value={form.fontStyle} onChange={e => setForm(p=>({...p,fontStyle:e.target.value}))}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 col-span-1">
              <div><label className="label text-xs">Primary Button</label><input className="input" type="color" value={form.primaryButtonColor} onChange={e => setForm(p=>({...p,primaryButtonColor:e.target.value}))} /></div>
              <div><label className="label text-xs">Secondary Button</label><input className="input" type="color" value={form.secondaryButtonColor} onChange={e => setForm(p=>({...p,secondaryButtonColor:e.target.value}))} /></div>
              <div><label className="label text-xs">Primary Text</label><input className="input" type="color" value={form.primaryTextColor} onChange={e => setForm(p=>({...p,primaryTextColor:e.target.value}))} /></div>
              <div><label className="label text-xs">Secondary Text</label><input className="input" type="color" value={form.secondaryTextColor} onChange={e => setForm(p=>({...p,secondaryTextColor:e.target.value}))} /></div>
            </div>
          </div>
        </Section>

        <Section title="Social Media">
          <div className="grid grid-cols-2 gap-4">
            {['instagram', 'whatsapp', 'twitter', 'facebook'].map(s => (
              <div key={s}><label className="label capitalize">{s}</label>
                <input className="input" placeholder={`${s} URL or handle`} value={form.socialMedia?.[s] || ''}
                  onChange={e => setForm(p => ({ ...p, socialMedia: { ...p.socialMedia, [s]: e.target.value } }))} />
              </div>
            ))}
            <div className="col-span-2"><label className="label">Google Review Link</label>
              <input className="input" type="url" value={form.googleReviewLink || ''} onChange={e => setForm(p=>({...p,googleReviewLink:e.target.value}))} />
            </div>
          </div>
        </Section>

        <Section title="Game Rules & Settings">
          <Toggle label="WhatsApp OTP Verification" field="whatsappOtpEnabled" sublabel="Require OTP to play" />
          <Toggle label="Marketing Consent Checkbox" field="marketingConsentEnabled" sublabel="Show consent at login" />
          <Toggle label="One Play Per Day Per Phone" field="onePlayPerDayPerPhone" sublabel="Limits 1 game per phone number daily" />
          <Toggle label="One Play Per IP" field="onePlayPerIp" sublabel="Limits 1 game per device/IP daily" />
          <Toggle label="Customer Feedback" field="feedbackEnabled" sublabel="Ask for ratings after game" />
        </Section>

        <button type="submit" className="btn-primary w-full py-3" disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </form>
    </div>
  );
}
