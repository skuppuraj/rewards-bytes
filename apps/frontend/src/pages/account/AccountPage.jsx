import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import PageHeader from '../../components/PageHeader';

function Section({ title, children }) {
  return (
    <div className="card p-5 mb-5">
      <h3 className="font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, currentSub, onBuy, buying }) {
  const activeSub     = currentSub?.status === 'active';
  const isThisPlan    = activeSub && String(currentSub?.planId?._id) === String(plan._id);
  const isTrialActive = activeSub && currentSub?.isTrial;

  const price     = plan.price === 0 ? 'Free' : `₹${(plan.price / 100).toLocaleString('en-IN')}`;
  const expiresAt = isThisPlan && currentSub?.expiresAt ? new Date(currentSub.expiresAt) : null;
  const daysLeft  = expiresAt ? Math.ceil((expiresAt - Date.now()) / 86400000) : null;

  // Decide CTA ─────────────────────────────────────────────────────────────
  //  1. This is the currently active PAID plan  → show "Current Plan" (renew if ≤14d)
  //  2. This is the currently active TRIAL plan → show "Current (Trial)" — NO upgrade on this card
  //  3. Org is on trial & this is a PAID plan   → show "⬆️ Upgrade"
  //  4. No active sub                           → show Buy / Activate Trial
  let cta;
  if (isThisPlan && !isTrialActive) {
    // Active paid plan
    cta = daysLeft <= 14
      ? { label: `🔄 Renew — ${price}`, action: () => onBuy(plan), warn: true }
      : { label: '✅ Current Plan', disabled: true };
  } else if (isThisPlan && isTrialActive) {
    // This card IS the trial plan — just show status, no buy button
    cta = { label: '🧪 Active Trial', disabled: true, trial: true };
  } else if (isTrialActive && !plan.isTrial) {
    // On trial, this is a different PAID plan → Upgrade CTA
    cta = { label: `⬆️ Upgrade — ${price}`, action: () => onBuy(plan) };
  } else if (plan.isTrial || plan.price === 0) {
    cta = { label: 'Activate Free Trial', action: () => onBuy(plan) };
  } else {
    cta = { label: `Buy — ${price}`, action: () => onBuy(plan) };
  }

  const isLoading = buying === plan._id;

  return (
    <div className={`border-2 rounded-2xl p-5 flex flex-col gap-3 transition-all ${
      isThisPlan && !isTrialActive ? 'border-purple-400 bg-purple-50' :
      isThisPlan && isTrialActive  ? 'border-blue-300 bg-blue-50' :
      isTrialActive && !plan.isTrial ? 'border-purple-200 hover:border-purple-400 shadow-sm' :
      'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-gray-900 text-base">{plan.name}</p>
          <div className="flex gap-1.5 flex-wrap mt-1">
            {plan.isTrial     && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Trial</span>}
            {isThisPlan && isTrialActive  && <span className="text-xs bg-blue-100   text-blue-700   px-2 py-0.5 rounded-full">🧪 Active</span>}
            {isThisPlan && !isTrialActive && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">✅ Active</span>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-purple-600">{price}</p>
          <p className="text-xs text-gray-400">{plan.durationDays}d</p>
        </div>
      </div>

      {plan.description && <p className="text-sm text-gray-500">{plan.description}</p>}

      {plan.features?.length > 0 && (
        <ul className="space-y-1">
          {plan.features.map((f, i) => (
            <li key={i} className="text-sm text-gray-600 flex gap-2">
              <span className="text-green-500 flex-shrink-0">✓</span>{f}
            </li>
          ))}
        </ul>
      )}

      {/* Expiry badge for active plan */}
      {isThisPlan && expiresAt && (
        <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
          daysLeft <= 7 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
        }`}>
          ⏳ Expires {expiresAt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
          {daysLeft !== null && ` · ${daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}`}
        </div>
      )}

      {/* CTA Button */}
      {cta.disabled ? (
        <div className={`mt-auto py-2.5 text-center text-sm font-bold rounded-xl ${
          cta.trial ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {cta.label}
        </div>
      ) : (
        <button
          onClick={cta.action}
          disabled={!!buying}
          className={`mt-auto text-sm py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 ${
            cta.warn
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'btn-primary'
          }`}>
          {isLoading ? 'Processing...' : cta.label}
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { org, user, token, setAuth } = useAuthStore();
  const [plans, setPlans]             = useState([]);
  const [sub, setSub]                 = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [pwForm, setPwForm]           = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [orgName, setOrgName]         = useState(org?.name || '');
  const [savingPw, setSavingPw]       = useState(false);
  const [savingName, setSavingName]   = useState(false);
  const [buyingPlan, setBuyingPlan]   = useState(null);

  const loadSub = () =>
    api.get('/subscriptions/active')
       .then(r => setSub(r.data))
       .catch(() => setSub(null));

  useEffect(() => {
    Promise.all([api.get('/plans'), api.get('/subscriptions/active')])
      .then(([pr, sr]) => { setPlans(pr.data); setSub(sr.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6)         return toast.error('Min 6 characters');
    setSavingPw(true);
    try {
      await api.patch('/account/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSavingPw(false); }
  };

  const handleChangeName = async () => {
    if (!orgName.trim()) return toast.error('Name cannot be empty');
    setSavingName(true);
    try {
      const r = await api.patch('/account/org-name', { name: orgName });
      setAuth(token, user, { ...org, name: r.data.name });
      toast.success('Organization name updated!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSavingName(false); }
  };

  const handleBuy = async (plan) => {
    setBuyingPlan(plan._id);
    try {
      const r = await api.post('/subscriptions/create-order', { planId: plan._id });

      // Free trial activated directly
      if (r.data.trial) {
        toast.success('Trial activated! 🎉');
        await loadSub();
        return;
      }

      // Paid plan — open Razorpay checkout
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s    = document.createElement('script');
          s.src      = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload   = resolve;
          s.onerror  = reject;
          document.body.appendChild(s);
        });
      }

      const rzp = new window.Razorpay({
        key:         r.data.keyId,
        amount:      r.data.amount,
        currency:    r.data.currency,
        order_id:    r.data.orderId,
        name:        'RewardBytes',
        description: `${plan.name} Plan`,
        handler: async (response) => {
          try {
            await api.post('/subscriptions/verify', response);
            toast.success('Payment successful! Plan activated 🎉');
            await loadSub();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => toast('Payment cancelled', { icon: 'ℹ️' }),
        },
        prefill: { email: user?.email },
        theme:   { color: '#7c3aed' },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setBuyingPlan(null);
    }
  };

  const isActive  = sub?.status === 'active';
  const isTrial   = isActive && sub?.isTrial;
  const expiresAt = sub?.expiresAt ? new Date(sub.expiresAt) : null;
  const daysLeft  = expiresAt ? Math.ceil((expiresAt - Date.now()) / 86400000) : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Account" subtitle="Manage your account settings and subscription" />

      {/* Current Plan Banner */}
      {isActive ? (
        <div className={`rounded-2xl p-4 mb-5 flex items-center justify-between border-2 ${
          daysLeft <= 7 ? 'bg-red-50 border-red-200' :
          isTrial       ? 'bg-blue-50 border-blue-200' :
                          'bg-purple-50 border-purple-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-gray-800">{sub.planId?.name}</p>
              {isTrial && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🧪 Trial</span>}
            </div>
            <p className={`text-sm ${ daysLeft <= 7 ? 'text-red-600 font-semibold' : 'text-gray-500' }`}>
              Expires {expiresAt?.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
              {daysLeft !== null && ` · ${daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}`}
            </p>
          </div>
          {daysLeft <= 7 && <span className="text-2xl">⚠️</span>}
        </div>
      ) : (
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-4 border-2 bg-red-50 border-red-200">
          <span className="text-3xl">⚠️</span>
          <div>
            <p className="font-bold text-red-700">No Active Subscription</p>
            <p className="text-sm text-red-500">Purchase a plan below to unlock all features.</p>
          </div>
        </div>
      )}

      {/* Organization Name */}
      <Section title="🏢 Organization Name">
        <div className="flex gap-3">
          <input className="input flex-1" value={orgName}
            onChange={e => setOrgName(e.target.value)} placeholder="Organization name" />
          <button className="btn-primary" onClick={handleChangeName} disabled={savingName}>
            {savingName ? 'Saving...' : 'Update'}
          </button>
        </div>
      </Section>

      {/* Change Password */}
      <Section title="🔒 Change Password">
        <div className="space-y-3">
          <input className="input w-full" type="password" placeholder="Current password"
            value={pwForm.currentPassword}
            onChange={e => setPwForm(p => ({...p, currentPassword: e.target.value}))} />
          <input className="input w-full" type="password" placeholder="New password (min 6 chars)"
            value={pwForm.newPassword}
            onChange={e => setPwForm(p => ({...p, newPassword: e.target.value}))} />
          <input className="input w-full" type="password" placeholder="Confirm new password"
            value={pwForm.confirm}
            onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))} />
          <button className="btn-primary" onClick={handleChangePassword} disabled={savingPw}>
            {savingPw ? 'Updating...' : 'Change Password'}
          </button>
        </div>
      </Section>

      {/* Plans */}
      <Section title="💳 Subscription Plans">
        {isTrial && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
            🧪 You're on a <strong>free trial</strong>. Upgrade to a paid plan anytime — your data stays safe.
          </div>
        )}
        {loadingPlans ? (
          <div className="text-center py-8 text-gray-400">⏳ Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No plans available yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {plans.map(p => (
              <PlanCard
                key={p._id}
                plan={p}
                currentSub={sub}
                onBuy={handleBuy}
                buying={buyingPlan}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
