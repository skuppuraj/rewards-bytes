import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/PageHeader';

const FONTS = ['Inter', 'Roboto', 'Poppins', 'Nunito', 'Lato', 'Montserrat'];
const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function OrgSettingsPage() {
  const [form, setForm] = useState({
    orgName: '', slug: '', websiteUrl: '', fontStyle: 'Inter',
    primaryButtonColor: '#6366f1', secondaryButtonColor: '#8b5cf6',
    primaryTextColor: '#111827', secondaryTextColor: '#6b7280',
    googleReviewLink: '',
    socialMedia: { instagram: '', whatsapp: '', twitter: '', facebook: '' },
    whatsappOtpEnabled: true, marketingConsentEnabled: true,
    onePlayPerGame: false,
    onePlayPerDayPerPhone: false,
    onePlayPerIp: false,
    feedbackEnabled: true,
    logo: null, backgroundImage: null
  });
  const [saving, setSaving]   = useState(false);
  const [preview, setPreview] = useState({ logo: null, bg: null });
  const [slugEdited, setSlugEdited] = useState(false);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    api.get('/org-settings').then(r => {
      if (r.data) {
        setForm(prev => ({ ...prev, ...r.data, socialMedia: { ...prev.socialMedia, ...r.data.socialMedia } }));
        if (r.data.slug)             setSlugEdited(true);
        if (r.data.logoUrl)          setPreview(p => ({ ...p, logo: r.data.logoUrl }));
        if (r.data.backgroundImageUrl) setPreview(p => ({ ...p, bg: r.data.backgroundImageUrl }));
      }
    });
  }, []);

  const handleOrgNameChange = (val) => {
    setForm(p => ({ ...p, orgName: val, ...(slugEdited ? {} : { slug: toSlug(val) }) }));
  };
  const handleSlugChange = (val) => {
    setForm(p => ({ ...p, slug: val.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
    setSlugEdited(true);
  };

  const portalUrl = form.slug ? `${window.location.origin}/play/${form.slug}` : null;
  const handleCopy = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFile = (field, file) => {
    setForm(p => ({ ...p, [field]: file }));
    setPreview(p => ({ ...p, [field === 'logo' ? 'logo' : 'bg']: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.slug) return toast.error('Slug is required to generate your portal link');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'logo' || k === 'backgroundImage') { if (v) fd.append(k, v); }
        else if (k === 'socialMedia') fd.append('socialMedia', JSON.stringify(v));
        else if (v !== null && v !== undefined) fd.append(k, v);
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

  const Toggle = ({ label, field, sublabel, tag }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-700">{label}</p>
          {tag && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            tag === 'RECOMMENDED' ? 'bg-green-100 text-green-700' :
            tag === 'STRICT' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
          }`}>{tag}</span>}
        </div>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
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

        {/* Portal Link Banner */}
        <div className={`mb-4 rounded-2xl border-2 p-4 ${portalUrl ? 'border-brand/30 bg-primary-50' : 'border-dashed border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔗</span>
            <p className="text-sm font-semibold text-gray-700">Customer Portal Link</p>
          </div>
          {portalUrl ? (
            <>
              <p className="text-xs text-gray-500 mb-2">Share this link with your customers to let them play games and win offers.</p>
              <div className="flex items-center gap-2">
                <a href={portalUrl} target="_blank" rel="noreferrer"
                  className="flex-1 text-sm font-medium text-brand bg-white border border-brand/30 rounded-lg px-3 py-2 truncate hover:underline">
                  {portalUrl}
                </a>
                <button type="button" onClick={handleCopy}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-brand text-white hover:opacity-90'}`}>
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
                <a href={portalUrl} target="_blank" rel="noreferrer"
                  className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">
                  ↗ Open
                </a>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400">Set your organization slug below to generate the customer portal link.</p>
          )}
        </div>

        {/* Organization */}
        <Section title="Organization">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Organization Name</label>
              <input className="input" value={form.orgName || ''} onChange={e => handleOrgNameChange(e.target.value)} />
            </div>
            <div>
              <label className="label">Website URL</label>
              <input className="input" type="url" value={form.websiteUrl || ''} onChange={e => setForm(p => ({ ...p, websiteUrl: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Portal Slug <span className="ml-1 text-xs font-normal text-gray-400">(unique URL for your portal)</span></label>
              <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand/30">
                <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 whitespace-nowrap select-none">{window.location.origin}/play/</span>
                <input className="flex-1 px-3 py-2 text-sm outline-none bg-white font-medium text-brand" placeholder="your-business-name"
                  value={form.slug || ''} onChange={e => handleSlugChange(e.target.value)} />
                {form.slug && <span className="px-3 py-2 bg-gray-50 border-l border-gray-200"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span></span>}
              </div>
              <p className="text-xs text-gray-400 mt-1">Only lowercase letters, numbers, hyphens. Auto-generated from org name.</p>
            </div>
          </div>
        </Section>

        {/* Branding */}
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
            <div>
              <label className="label">Font Style</label>
              <select className="input" value={form.fontStyle} onChange={e => setForm(p => ({ ...p, fontStyle: e.target.value }))}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label text-xs">Primary Button</label><input className="input" type="color" value={form.primaryButtonColor} onChange={e => setForm(p => ({ ...p, primaryButtonColor: e.target.value }))} /></div>
              <div><label className="label text-xs">Secondary Button</label><input className="input" type="color" value={form.secondaryButtonColor} onChange={e => setForm(p => ({ ...p, secondaryButtonColor: e.target.value }))} /></div>
              <div><label className="label text-xs">Primary Text</label><input className="input" type="color" value={form.primaryTextColor} onChange={e => setForm(p => ({ ...p, primaryTextColor: e.target.value }))} /></div>
              <div><label className="label text-xs">Secondary Text</label><input className="input" type="color" value={form.secondaryTextColor} onChange={e => setForm(p => ({ ...p, secondaryTextColor: e.target.value }))} /></div>
            </div>
          </div>
        </Section>

        {/* Social Media */}
        <Section title="Social Media">
          <div className="grid grid-cols-2 gap-4">
            {['instagram', 'whatsapp', 'twitter', 'facebook'].map(s => (
              <div key={s}><label className="label capitalize">{s}</label>
                <input className="input" placeholder={`${s} URL or handle`} value={form.socialMedia?.[s] || ''}
                  onChange={e => setForm(p => ({ ...p, socialMedia: { ...p.socialMedia, [s]: e.target.value } }))} />
              </div>
            ))}
            <div className="col-span-2"><label className="label">Google Review Link</label>
              <input className="input" type="url" value={form.googleReviewLink || ''} onChange={e => setForm(p => ({ ...p, googleReviewLink: e.target.value }))} />
            </div>
          </div>
        </Section>

        {/* Game Rules */}
        <Section title="Game Rules & Play Limits">
          <Toggle
            label="One Play Per Game (Lifetime)"
            field="onePlayPerGame"
            sublabel="Each customer can play each game only once, ever. Best for one-time reward campaigns."
            tag="RECOMMENDED"
          />
          <Toggle
            label="One Play Per Day Per Phone"
            field="onePlayPerDayPerPhone"
            sublabel="Same phone number can play each game only once per calendar day."
          />
          <Toggle
            label="One Play Per IP"
            field="onePlayPerIp"
            sublabel="Blocks multiple plays from the same device/IP address in a day."
            tag="STRICT"
          />
          <div className="pt-2 border-t border-gray-50 mt-1">
            <p className="text-xs text-gray-400 mb-2">
              ℹ️ Play limits stack — e.g. enabling both <strong>Per Game</strong> and <strong>Per Day</strong> means a customer is blocked if either condition is true.
              Deleting a session in Game History will clear the play lock for that player.
            </p>
          </div>
          <Toggle label="WhatsApp OTP Verification" field="whatsappOtpEnabled" sublabel="Require OTP to play" />
          <Toggle label="Marketing Consent Checkbox"  field="marketingConsentEnabled" sublabel="Show consent at login" />
          <Toggle label="Customer Feedback"           field="feedbackEnabled" sublabel="Ask for ratings after game" />
        </Section>

        <button type="submit" className="btn-primary w-full py-3" disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </form>
    </div>
  );
}
