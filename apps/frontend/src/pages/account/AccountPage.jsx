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

function PlanCard({ plan, currentSub, onBuy }) {
  const isActive = currentSub?.planId?._id === plan._id && currentSub?.status === 'active';
  const price = plan.price === 0 ? 'Free' : `₹${(plan.price / 100).toLocaleString()}`;
  return (
    <div className={`border-2 rounded-2xl p-5 flex flex-col gap-3 transition-all ${
      isActive ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-gray-900">{plan.name}</p>
          {plan.isTrial && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Trial</span>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-purple-600">{price}</p>
          <p className="text-xs text-gray-400">{plan.durationDays} days</p>
        </div>
      </div>
      {plan.description && <p className="text-sm text-gray-500">{plan.description}</p>}
      {plan.features?.length > 0 && (
        <ul className="space-y-1">
          {plan.features.map((f, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-green-500">✓</span>{f}</li>)}
        </ul>
      )}
      {isActive ? (
        <div className="mt-auto py-2 text-center text-sm font-bold text-purple-600 bg-purple-100 rounded-xl">✅ Current Plan</div>
      ) : (
        <button onClick={() => onBuy(plan)}
          className="mt-auto btn-primary text-sm py-2.5">
          {plan.isTrial || plan.price === 0 ? 'Activate Free Trial' : `Buy — ${price}`}
        </button>
      )}
    </div>
  );
}

export default function AccountPage() {
  const { org, user, token, setAuth } = useAuthStore();
  const [plans, setPlans]       = useState([]);
  const [sub, setSub]           = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [pwForm, setPwForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [orgName, setOrgName]   = useState(org?.name || '');
  const [savingPw, setSavingPw] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [buyingPlan, setBuyingPlan] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/plans'),
      api.get('/subscriptions/active'),
    ]).then(([pr, sr]) => { setPlans(pr.data); setSub(sr.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Min 6 characters');
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

      // Trial / free — activated directly
      if (r.data.trial) {
        toast.success('Trial activated! 🎉');
        const subRes = await api.get('/subscriptions/active');
        setSub(subRes.data);
        return;
      }

      // Load Razorpay script dynamically
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve; s.onerror = reject;
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
            const subRes = await api.get('/subscriptions/active');
            setSub(subRes.data);
          } catch { toast.error('Payment verification failed'); }
        },
        prefill: { email: user?.email },
        theme: { color: '#7c3aed' },
      });
      rzp.open();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to initiate payment'); }
    finally { setBuyingPlan(null); }
  };

  const expiresAt = sub?.expiresAt ? new Date(sub.expiresAt) : null;
  const daysLeft  = expiresAt ? Math.ceil((expiresAt - Date.now()) / 86400000) : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Account" subtitle="Manage your account settings and subscription" />

      {/* Current Plan Banner */}
      {sub && (
        <div className={`rounded-2xl p-4 mb-5 flex items-center justify-between ${
          daysLeft <= 7 ? 'bg-red-50 border-2 border-red-200' : 'bg-purple-50 border-2 border-purple-200'
        }`}>
          <div>
            <p className="font-bold text-gray-800">{sub.planId?.name} Plan {sub.isTrial && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full ml-1">Trial</span>}</p>
            <p className={`text-sm mt-0.5 ${ daysLeft <= 7 ? 'text-red-600' : 'text-gray-500' }`}>
              Expires {expiresAt?.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
              {daysLeft !== null && ` • ${daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}`}
            </p>
          </div>
          {daysLeft <= 7 && <span className="text-2xl">⚠️</span>}
        </div>
      )}

      {/* Change Organization Name */}
      <Section title="🏢 Organization Name">
        <div className="flex gap-3">
          <input className="input flex-1" value={orgName}
            onChange={e => setOrgName(e.target.value)}
            placeholder="Organization name" />
          <button className="btn-primary" onClick={handleChangeName} disabled={savingName}>
            {savingName ? 'Saving...' : 'Update'}
          </button>
        </div>
      </Section>

      {/* Change Password */}
      <Section title="🔒 Change Password">
        <div className="space-y-3">
          <input className="input w-full" type="password" placeholder="Current password"
            value={pwForm.currentPassword} onChange={e => setPwForm(p => ({...p, currentPassword: e.target.value}))} />
          <input className="input w-full" type="password" placeholder="New password (min 6 chars)"
            value={pwForm.newPassword} onChange={e => setPwForm(p => ({...p, newPassword: e.target.value}))} />
          <input className="input w-full" type="password" placeholder="Confirm new password"
            value={pwForm.confirm} onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))} />
          <button className="btn-primary" onClick={handleChangePassword} disabled={savingPw}>
            {savingPw ? 'Updating...' : 'Change Password'}
          </button>
        </div>
      </Section>

      {/* Plans */}
      <Section title="💳 Subscription Plans">
        {loadingPlans ? (
          <div className="text-center py-8 text-gray-400">⏳ Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No plans available yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {plans.map(p => (
              <PlanCard key={p._id} plan={p} currentSub={sub}
                onBuy={buyingPlan ? () => {} : handleBuy} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
