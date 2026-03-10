import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import { useAuthStore } from '../../store/authStore';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────
function GamePageTab({ org, onSlugUpdate }) {
  const [slug, setSlug]           = useState(org?.slug || '');
  const [editSlug, setEditSlug]   = useState(org?.slug || '');
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [copied, setCopied]       = useState(false);
  const [promoText, setPromoText] = useState(
    `🎉 Play & Win Exciting Rewards!\n\nScan the QR code or visit the link below to play our exclusive games and unlock amazing offers just for you.\n\n🏆 Instant Wins  •  🎫 Exclusive Coupons  •  🔁 Play Daily`
  );
  const qrRef = useRef(null);

  const portalUrl = slug ? `${window.location.origin}/play/${slug}` : null;

  useEffect(() => {
    setSlug(org?.slug || '');
    setEditSlug(org?.slug || '');
  }, [org?.slug]);

  const handleCopy = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSlug = async () => {
    const trimmed = editSlug.trim().toLowerCase();
    if (trimmed === slug) { setEditing(false); return; }
    setSaving(true);
    try {
      const r = await api.patch('/org-settings/slug', { slug: trimmed });
      setSlug(r.data.slug);
      setEditSlug(r.data.slug);
      onSlugUpdate?.(r.data.slug);
      toast.success('Game page URL updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update slug');
    } finally { setSaving(false); }
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-qr.png`;
    a.click();
  };

  const handlePrint = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';
    const orgName = org?.name || 'Our Store';

    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Game Page - ${orgName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 20px; }
          .flyer { width: 400px; border: 3px solid #7c3aed; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(124,58,237,0.15); }
          .header { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 28px 24px 24px; text-align: center; }
          .header .brand { font-size: 13px; font-weight: 600; opacity: 0.85; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
          .header h1 { font-size: 26px; font-weight: 900; margin-bottom: 6px; }
          .header p { font-size: 13px; opacity: 0.85; line-height: 1.5; }
          .qr-section { background: #f8f7ff; padding: 28px 24px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
          .qr-label { font-size: 13px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: 1px; }
          .qr-img { width: 180px; height: 180px; border: 4px solid #7c3aed; border-radius: 12px; padding: 6px; background: white; }
          .url-box { background: white; border: 2px dashed #7c3aed; border-radius: 10px; padding: 10px 16px; text-align: center; width: 100%; }
          .url-box .url-label { font-size: 10px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .url-box .url-text { font-size: 13px; font-weight: 700; color: #4f46e5; word-break: break-all; }
          .steps { background: white; padding: 20px 24px; border-top: 2px solid #ede9fe; }
          .steps h3 { font-size: 13px; font-weight: 800; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
          .step { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
          .step-num { background: #7c3aed; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }
          .step-text { font-size: 12px; color: #4b5563; line-height: 1.5; padding-top: 3px; }
          .promo { background: #fdf4ff; border-top: 2px solid #ede9fe; padding: 16px 24px; }
          .promo p { font-size: 12px; color: #6d28d9; line-height: 1.7; white-space: pre-line; }
          .footer { background: #7c3aed; color: white; text-align: center; padding: 12px; font-size: 11px; font-weight: 600; opacity: 0.9; letter-spacing: 0.5px; }
          @media print { body { padding: 0; } .flyer { box-shadow: none; border-radius: 0; border: none; } }
        </style>
      </head>
      <body>
        <div class="flyer">
          <div class="header">
            <div class="brand">${orgName}</div>
            <h1>🎉 Play & Win!</h1>
            <p>Scan QR or visit the link below<br/>to play games & win exclusive rewards</p>
          </div>
          <div class="qr-section">
            <div class="qr-label">📸 Scan to Play</div>
            ${qrDataUrl ? `<img src="${qrDataUrl}" class="qr-img" />` : '<div style="width:180px;height:180px;background:#eee;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px">QR Code</div>'}
            <div class="url-box">
              <div class="url-label">Or visit this link</div>
              <div class="url-text">${portalUrl}</div>
            </div>
          </div>
          <div class="steps">
            <h3>📍 How to Play</h3>
            <div class="step"><div class="step-num">1</div><div class="step-text">Open your phone camera and scan the QR code above</div></div>
            <div class="step"><div class="step-num">2</div><div class="step-text">Or type the link in your browser</div></div>
            <div class="step"><div class="step-num">3</div><div class="step-text">Enter your mobile number to verify</div></div>
            <div class="step"><div class="step-num">4</div><div class="step-text">Play the game & win exciting offers!</div></div>
          </div>
          <div class="promo"><p>${promoText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p></div>
          <div class="footer">Powered by RewardBytes &bull; rewards made fun</div>
        </div>
        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(printHTML);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-1">Your Customer Game Page URL</h3>
        <p className="text-sm text-gray-400 mb-4">Share this link with your customers so they can play games and win rewards.</p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3">
          <span className="text-purple-500 text-sm">🔗</span>
          {portalUrl ? (
            <a href={portalUrl} target="_blank" rel="noreferrer"
              className="flex-1 text-sm font-mono text-purple-600 hover:underline truncate">{portalUrl}</a>
          ) : (
            <span className="flex-1 text-sm text-gray-400 italic">No slug set yet</span>
          )}
          {portalUrl && (
            <button onClick={handleCopy}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                copied ? 'bg-green-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}>{copied ? '✅ Copied!' : '📋 Copy'}</button>
          )}
        </div>
        <div className="border border-dashed border-purple-200 rounded-xl p-4 bg-purple-50/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">⚙️ Customize URL</p>
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="text-xs px-3 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700">Edit</button>
            )}
          </div>
          {editing ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center flex-1 bg-white border border-purple-300 rounded-xl overflow-hidden min-w-0">
                <span className="px-3 text-xs text-gray-400 whitespace-nowrap border-r border-gray-200 py-2.5">{window.location.origin}/play/</span>
                <input type="text" value={editSlug}
                  onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="your-store-name"
                  className="flex-1 px-3 py-2 text-sm outline-none bg-transparent min-w-0" />
              </div>
              <button onClick={handleSaveSlug} disabled={saving}
                className="text-xs px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              <button onClick={() => { setEditing(false); setEditSlug(slug); }}
                className="text-xs px-3 py-2 rounded-xl bg-gray-200 text-gray-600 hover:bg-gray-300">Cancel</button>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Current slug: <span className="font-mono font-semibold text-purple-700">{slug || 'not set'}</span><span className="ml-2 text-gray-400">— only lowercase letters, numbers, hyphens allowed</span></p>
          )}
        </div>
      </div>

      {portalUrl && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-1">QR Code</h3>
            <p className="text-sm text-gray-400 mb-4">Print or display this QR code at your store counter.</p>
            <div className="flex flex-col items-center gap-4">
              <div ref={qrRef} className="p-4 bg-white border-2 border-purple-200 rounded-2xl shadow-sm">
                <QRCodeCanvas value={portalUrl} size={200} bgColor="#ffffff" fgColor="#4f46e5" level="H"
                  imageSettings={{ src: '/favicon.ico', x: undefined, y: undefined, height: 32, width: 32, excavate: true }} />
              </div>
              <div className="flex gap-2 w-full">
                <button onClick={downloadQR} className="flex-1 btn-secondary text-sm py-2">⬇️ Download PNG</button>
                <button onClick={handlePrint} className="flex-1 btn-primary text-sm py-2">🖨️ Print Flyer</button>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-1">Promotional Text</h3>
            <p className="text-sm text-gray-400 mb-4">This text appears on the printed flyer.</p>
            <textarea value={promoText} onChange={e => setPromoText(e.target.value)} rows={7}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-purple-400 bg-gray-50"
              placeholder="Enter promotional text for the flyer..." />
            <p className="text-xs text-gray-400 mt-1">{promoText.length} chars &bull; Tip: use emojis 🚀</p>
            <button onClick={handlePrint} className="btn-primary w-full mt-3 text-sm">🖨️ Preview & Print Flyer</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const { org, setAuth, token, user } = useAuthStore();
  const [tab, setTab]   = useState('customers');
  const [data, setData] = useState({ customers: [], total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(false);
  const [localOrg, setLocalOrg] = useState(org);

  const load = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { page, limit: perPage, search, ...overrides };
      const r = await api.get('/customers', { params });
      setData(r.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, perPage, search]);

  useEffect(() => { load(); }, [page, perPage]);

  const handleSearch = () => { setPage(1); load({ page: 1 }); };
  const handleClear  = () => { setSearch(''); setPage(1); load({ search: '', page: 1 }); };

  const handleSlugUpdate = (newSlug) => {
    setLocalOrg(prev => ({ ...prev, slug: newSlug }));
    setAuth(token, user, { ...org, slug: newSlug });
  };

  const TABS = [
    { key: 'customers', label: '👥 Customers' },
    { key: 'gamepage',  label: '🎞️ Game Page & QR' },
  ];

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Customers" subtitle={`${data.total} total customers`} />

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'gamepage' ? (
        <GamePageTab org={localOrg} onSlugUpdate={handleSlugUpdate} />
      ) : (
        <>
          <div className="card p-4 mb-4 flex gap-3">
            <input className="input flex-1" placeholder="Search by name or phone"
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <button className="btn-primary" onClick={handleSearch}>Search</button>
            <button className="btn-secondary" onClick={handleClear}>Clear</button>
          </div>

          <div className="card overflow-hidden">
            {loading && <div className="text-center py-4 text-sm text-gray-400">Loading...</div>}
            {/* overflow-x-auto fixes hidden list on mobile */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['#', 'Name', 'Phone', 'Games Played', 'Offers Redeemed'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.customers.map((c, i) => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">{(page - 1) * perPage + i + 1}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{c.name}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.phone}</td>
                      <td className="px-4 py-3">{c.totalGamesPlayed}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-green-600">{c.totalOffersRedeemed}</span>
                        <span className="text-gray-400"> / {c.totalOffersObtained}</span>
                      </td>
                    </tr>
                  ))}
                  {!loading && data.customers.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400">No customers yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage}
                perPage={perPage} onPerPageChange={p => { setPerPage(p); setPage(1); }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
