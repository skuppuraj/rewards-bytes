import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../lib/publicApi';
import { useCustomerStore } from '../../store/customerStore';
import { OrgContext } from './GamePortal';
import { format } from 'date-fns';

export default function GameComplete() {
  const { orgSlug, sessionId } = useParams();
  const orgData = useContext(OrgContext);
  const { customer } = useCustomerStore();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [latestCoupon, setLatestCoupon] = useState(null);
  const [feedback, setFeedback] = useState({ gameRating: 0, offerRating: 0, enjoymentRating: 0, comment: '' });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load customer's latest offer
    publicApi.get('/my/offers').then(r => {
      const sorted = r.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOffers(sorted);
      if (sorted.length > 0) setLatestCoupon(sorted[0]);
    });
  }, []);

  const handleFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await publicApi.post('/feedback', { sessionId, ...feedback });
      setFeedbackSubmitted(true);
      toast.success('Thanks for your feedback! 🙏');
    } catch { toast.error('Could not submit feedback'); }
    finally { setSubmitting(false); }
  };

  const StarRating = ({ label, field }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => setFeedback(p => ({...p, [field]: n}))}
            className={`text-xl transition-transform hover:scale-110 ${n <= feedback[field] ? '⭐' : '☆'}`}>
          </button>
        ))}
      </div>
    </div>
  );

  const shareText = `🎉 I just won ${latestCoupon?.offerId?.name || 'a reward'} from ${orgData?.org?.name}! Play now and win amazing offers! 🎁`;
  const shareUrl = window.location.origin + `/play/${orgSlug}`;

  const shareLinks = [
    { name: 'WhatsApp', icon: '💬', url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, color: 'bg-green-500' },
    { name: 'Twitter', icon: '🐦', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, color: 'bg-sky-500' },
    { name: 'Facebook', icon: '👤', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, color: 'bg-blue-600' },
    { name: 'Instagram', icon: '📸', url: `https://www.instagram.com/`, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Celebration */}
      <div className="text-center mb-4">
        <div className="text-6xl animate-bounce mb-2">{latestCoupon ? '🎉' : '🙏'}</div>
        <h2 className="text-white text-2xl font-bold">{latestCoupon ? 'You Won!' : 'Game Over!'}</h2>
        <p className="text-white/70 text-sm mt-1">{latestCoupon ? 'Congratulations! Here\'s your reward' : 'Better luck next time!'}</p>
      </div>

      {/* Coupon Card */}
      {latestCoupon && (
        <div className="bg-white rounded-2xl shadow-2xl p-5 mb-4 border-2 border-dashed border-purple-200">
          <div className="flex items-start gap-3">
            {latestCoupon.offerId?.imageUrl && <img src={latestCoupon.offerId.imageUrl} className="w-14 h-14 rounded-xl object-cover" alt="" />}
            <div className="flex-1">
              <p className="font-bold text-gray-900">{latestCoupon.offerId?.name}</p>
              <p className="text-sm text-purple-600">
                {latestCoupon.offerId?.discountType === 'percentage' ? `${latestCoupon.offerId?.discountValue}% off` : `₹${latestCoupon.offerId?.discountValue} off`}
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

      {/* Feedback */}
      {orgData?.settings?.feedbackEnabled && !feedbackSubmitted && (
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          {!showFeedback ? (
            <button onClick={() => setShowFeedback(true)} className="w-full text-sm text-brand font-medium">⭐ Rate your experience</button>
          ) : (
            <form onSubmit={handleFeedback} className="space-y-3">
              <h4 className="font-semibold text-gray-800 text-sm">How was your experience?</h4>
              <StarRating label="🎮 Game" field="gameRating" />
              <StarRating label="🎁 Offer" field="offerRating" />
              <StarRating label="😄 Enjoyment" field="enjoymentRating" />
              <textarea className="input text-sm" rows={2} placeholder="Any comments? (optional)" value={feedback.comment} onChange={e => setFeedback(p=>({...p, comment:e.target.value}))} />
              <button type="submit" className="btn-primary w-full" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Feedback'}</button>
            </form>
          )}
        </div>
      )}
      {feedbackSubmitted && <div className="bg-green-50 rounded-xl p-3 mb-4 text-center text-sm text-green-700">🙏 Thanks for your feedback!</div>}

      {/* Google Review */}
      {orgData?.settings?.googleReviewLink && (
        <a href={orgData.settings.googleReviewLink} target="_blank" rel="noreferrer" className="block bg-white rounded-xl p-4 mb-4 text-center shadow">
          <p className="text-sm font-medium text-gray-700">⭐ Leave a Google Review</p>
          <p className="text-xs text-gray-400 mt-0.5">Your feedback helps us grow!</p>
        </a>
      )}

      {/* Social Share */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
        <p className="text-white text-sm font-semibold text-center mb-3">🚀 Share & Spread the Joy!</p>
        <div className="grid grid-cols-4 gap-2">
          {shareLinks.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-white text-xs font-medium ${s.color}`}>
              <span className="text-xl">{s.icon}</span>
              <span>{s.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate(`/play/${orgSlug}`)} className="flex-1 py-3 rounded-xl bg-white/20 text-white font-medium text-sm">🎮 Play Again</button>
        <button onClick={() => navigate(`/play/${orgSlug}/dashboard`)} className="flex-1 py-3 rounded-xl text-white font-medium text-sm" style={{background: 'var(--brand-btn, #6366f1)'}}>My Rewards →</button>
      </div>
    </div>
  );
}
