import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../lib/publicApi';
import { useCustomerStore } from '../../store/customerStore';
import { OrgContext } from './GamePortal';
import { format } from 'date-fns';

const STAR_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };

function StarRating({ icon, label, field, value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          {active > 0 && (
            <p className="text-xs text-purple-500 font-medium" style={{ lineHeight: 1.3 }}>
              {STAR_LABELS[active]}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(field, n)}
            className="text-2xl focus:outline-none select-none"
            style={{
              transition: 'transform 0.1s, filter 0.1s',
              transform: n <= active ? 'scale(1.15)' : 'scale(1)',
              filter: n <= active ? 'drop-shadow(0 0 3px rgba(250,204,21,0.8))' : 'grayscale(1) opacity(0.4)',
              cursor: 'pointer',
            }}
          >
            ⭐
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GameComplete() {
  const { orgSlug, sessionId } = useParams();
  const orgData  = useContext(OrgContext);
  const { customer } = useCustomerStore();
  const navigate = useNavigate();

  const [latestCoupon, setLatestCoupon] = useState(null);
  const [feedback, setFeedback] = useState({ gameRating: 0, offerRating: 0, enjoymentRating: 0, comment: '' });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  useEffect(() => {
    publicApi.get('/my/offers').then(r => {
      const sorted = r.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (sorted.length > 0) setLatestCoupon(sorted[0]);
    });
  }, []);

  const handleStarChange = (field, val) => setFeedback(p => ({ ...p, [field]: val }));

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!feedback.gameRating && !feedback.offerRating && !feedback.enjoymentRating) {
      toast.error('Please rate at least one category');
      return;
    }
    setSubmitting(true);
    try {
      await publicApi.post('/feedback', { sessionId, ...feedback });
      setSubmitDone(true);
      setTimeout(() => {
        setFeedbackSubmitted(true);
        toast.success('Thanks for your feedback! 🙏');
      }, 1200);
    } catch { toast.error('Could not submit feedback'); }
    finally { setSubmitting(false); }
  };

  const allRated = feedback.gameRating > 0 && feedback.offerRating > 0 && feedback.enjoymentRating > 0;

  const shareText = `🎉 I just won ${latestCoupon?.offerId?.name || 'a reward'} from ${orgData?.org?.name}! Play now and win amazing offers! 🎁`;
  const shareUrl  = window.location.origin + `/play/${orgSlug}`;

  const shareLinks = [
    { name: 'WhatsApp', icon: '💬', url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, color: '#25D366' },
    { name: 'Twitter',  icon: '🐦', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, color: '#1DA1F2' },
    { name: 'Facebook', icon: '👤', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, color: '#1877F2' },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-6">

      {/* Celebration header */}
      <div className="text-center mb-4">
        <div className="text-6xl animate-bounce mb-2">{latestCoupon ? '🎉' : '🙏'}</div>
        <h2 className="text-white text-2xl font-bold">{latestCoupon ? 'You Won!' : 'Game Over!'}</h2>
        <p className="text-white/70 text-sm mt-1">
          {latestCoupon ? "Congratulations! Here's your reward" : 'Better luck next time!'}
        </p>
      </div>

      {/* Coupon card */}
      {latestCoupon && (
        <div className="bg-white rounded-2xl shadow-2xl p-5 mb-4 border-2 border-dashed border-purple-200">
          <div className="flex items-start gap-3">
            {latestCoupon.offerId?.imageUrl && (
              <img src={latestCoupon.offerId.imageUrl} className="w-14 h-14 rounded-xl object-cover" alt="" />
            )}
            <div className="flex-1">
              <p className="font-bold text-gray-900">{latestCoupon.offerId?.name}</p>
              <p className="text-sm text-purple-600">
                {latestCoupon.offerId?.discountType === 'percentage'
                  ? `${latestCoupon.offerId?.discountValue}% off`
                  : `₹${latestCoupon.offerId?.discountValue} off`}
              </p>
              <p className="text-xs text-gray-500 mt-1">{latestCoupon.offerId?.shortDescription}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-purple-50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">Your Coupon Code</p>
            <p className="text-2xl font-mono font-bold text-brand tracking-widest">{latestCoupon.code}</p>
            <p className="text-xs text-gray-400 mt-1">
              Valid till {latestCoupon.expiresAt ? format(new Date(latestCoupon.expiresAt), 'dd MMM yyyy') : '-'}
            </p>
          </div>
          <p className="text-xs text-center text-green-600 mt-3">💬 Coupon sent to your WhatsApp!</p>
        </div>
      )}

      {/* Feedback Section */}
      {orgData?.settings?.feedbackEnabled && !feedbackSubmitted && (
        <div className="bg-white rounded-2xl shadow-lg mb-4 overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📝</span>
              <h4 className="font-bold text-gray-900 text-base">How was your experience?</h4>
            </div>
            <p className="text-xs text-gray-400">Share your honest feedback — it takes just 10 seconds!</p>
          </div>

          <form onSubmit={handleFeedback}>
            <div className="px-5 divide-y divide-gray-100">
              <StarRating icon="🎮" label="Game Experience"  field="gameRating"     value={feedback.gameRating}     onChange={handleStarChange} />
              <StarRating icon="🎁" label="Offer / Reward"   field="offerRating"    value={feedback.offerRating}    onChange={handleStarChange} />
              <StarRating icon="😄" label="Overall Enjoyment" field="enjoymentRating" value={feedback.enjoymentRating} onChange={handleStarChange} />
            </div>

            <div className="px-5 pt-3 pb-2">
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
                rows={2}
                placeholder="Anything else you'd like to share? (optional)"
                value={feedback.comment}
                onChange={e => setFeedback(p => ({ ...p, comment: e.target.value }))}
              />
            </div>

            <div className="px-5 pb-5">
              <button
                type="submit"
                disabled={submitting || submitDone}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-300"
                style={{
                  background: submitDone ? '#22c55e' : submitting ? '#a78bfa' : allRated ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e5e7eb',
                  color: allRated || submitting || submitDone ? 'white' : '#9ca3af',
                  cursor: allRated && !submitting && !submitDone ? 'pointer' : 'not-allowed',
                  boxShadow: allRated && !submitting && !submitDone ? '0 4px 14px rgba(99,102,241,0.4)' : 'none',
                  transform: submitting ? 'scale(0.98)' : 'scale(1)',
                }}
              >
                {submitDone ? (
                  <span className="flex items-center justify-center gap-2">
                    <span style={{ display: 'inline-block', animation: 'popIn 0.4s ease' }}>✅</span>
                    Feedback Submitted!
                  </span>
                ) : submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Submitting...
                  </span>
                ) : allRated ? (
                  '🙏 Submit Feedback'
                ) : (
                  '🙏 Submit Feedback (rate all 3 to unlock)'
                )}
              </button>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mt-2">
                {['gameRating', 'offerRating', 'enjoymentRating'].map(f => (
                  <div
                    key={f}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{ background: feedback[f] > 0 ? '#8b5cf6' : '#e5e7eb' }}
                  />
                ))}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Feedback success */}
      {feedbackSubmitted && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4 text-center">
          <div className="text-3xl mb-1">🙏</div>
          <p className="text-sm font-semibold text-green-700">Thank you for your feedback!</p>
          <p className="text-xs text-green-500 mt-0.5">Your opinion helps us improve 💚</p>
        </div>
      )}

      {/* Google Review */}
      {orgData?.settings?.googleReviewLink && (
        <a href={orgData.settings.googleReviewLink} target="_blank" rel="noreferrer"
          className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 mb-4 shadow hover:shadow-md transition-shadow">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Leave a Google Review</p>
            <p className="text-xs text-gray-400">Your feedback helps us grow!</p>
          </div>
          <span className="ml-auto text-gray-400">›</span>
        </a>
      )}

      {/* Social share */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
        <p className="text-white text-sm font-semibold text-center mb-3">🚀 Share & Spread the Joy!</p>
        <div className="flex gap-2 justify-center">
          {shareLinks.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold"
              style={{ background: s.color }}>
              <span className="text-base">{s.icon}</span>
              <span>{s.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate(`/play/${orgSlug}`)}
          className="flex-1 py-3 rounded-xl bg-white/20 text-white font-medium text-sm">
          🎮 Play Again
        </button>
        <button onClick={() => navigate(`/play/${orgSlug}/dashboard`)}
          className="flex-1 py-3 rounded-xl text-white font-medium text-sm"
          style={{ background: 'var(--brand-btn, #6366f1)' }}>
          My Rewards →
        </button>
      </div>

      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.3); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
