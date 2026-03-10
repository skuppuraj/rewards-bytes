import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../../lib/publicApi';
import { useCustomerStore } from '../../../store/customerStore';

export default function PlayCatchPopcorn() {
  const { orgSlug, sessionId } = useParams();
  const navigate = useNavigate();
  const { token } = useCustomerStore();

  const [iframeSrc, setIframeSrc]   = useState(null);
  const [gameDone, setGameDone]     = useState(false);
  const [attempts, setAttempts]     = useState(1);   // current attempt displayed in HUD
  const [maxTries, setMaxTries]     = useState(1);

  // We use refs so the message-handler closure always sees fresh values
  const savedRef     = useRef(false);   // has the *best* (or winning) result been saved?
  const attemptsRef  = useRef(1);
  const maxTriesRef  = useRef(1);
  const bestScoreRef = useRef(0);
  const bestWonRef   = useRef(false);

  // Auth guard
  useEffect(() => {
    if (!token) {
      navigate(`/play/${orgSlug}/login`, {
        replace: true,
        state: { returnTo: `/play/${orgSlug}/play/popcorn/${sessionId}` },
      });
    }
  }, [token]);

  // Load session config & build iframe URL
  useEffect(() => {
    if (!token) return;
    publicApi.get(`/game/session/${sessionId}`).then(r => {
      const cfg = r.data?.orgGameId;
      const durationSecs = Math.round((cfg?.timerMinutes || 0) * 60)
        || cfg?.gameConfig?.durationSeconds
        || 20;
      const winThreshold = cfg?.gameConfig?.winThreshold || 10;
      const maxTriesVal  = Math.max(1, cfg?.gameConfig?.maxTries || 1);

      setMaxTries(maxTriesVal);
      maxTriesRef.current = maxTriesVal;

      setIframeSrc(
        `/games/catch-popcorn/index.html` +
        `?duration=${durationSecs}` +
        `&winThreshold=${winThreshold}` +
        `&maxTries=${maxTriesVal}`
      );
    }).catch(() => {
      setIframeSrc('/games/catch-popcorn/index.html?duration=20&winThreshold=10&maxTries=1');
    });
  }, [sessionId, token]);

  // Message handler from iframe
  useEffect(() => {
    if (!token) return;

    const handleMessage = async (event) => {

      // ── Try Again: player clicked "Try Again" inside the iframe ──
      if (event.data?.type === 'TRY_AGAIN') {
        const nextAttempt = event.data.attempt;
        attemptsRef.current = nextAttempt;
        setAttempts(nextAttempt);
        // reset savedRef so we can save a new result if they win
        // but only if they haven't won yet
        if (!bestWonRef.current) {
          savedRef.current = false;
        }
        return;
      }

      // ── Game Complete ──
      if (event.data?.type === 'GAME_COMPLETE') {
        const { score, won, triesLeft } = event.data;

        // Update best score tracking
        if (score > bestScoreRef.current) bestScoreRef.current = score;
        if (won) bestWonRef.current = true;

        setGameDone(true);

        // Save result:
        //   - Always save if player WON (first win saves immediately)
        //   - Save on last attempt (triesLeft === 0) even if not won (records best effort)
        const isLastAttempt = triesLeft === 0;
        const shouldSave    = (won && !savedRef.current) || (isLastAttempt && !savedRef.current);

        if (shouldSave) {
          savedRef.current = true;
          try {
            await publicApi.post('/game/complete', {
              sessionId,
              result: {
                won:   bestWonRef.current,
                score: bestScoreRef.current,
                type:  'catch_popcorn',
              },
            });
          } catch (err) {
            console.error('Error saving game result', err);
          }
        }
        return;
      }

      // ── Navigate to rewards ──
      if (event.data?.type === 'GO_TO_REWARDS') {
        navigate(`/play/${orgSlug}/complete/${sessionId}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sessionId, orgSlug, navigate, token]);

  if (!token) return null;

  if (!iframeSrc) return (
    <div style={{ position: 'fixed', inset: 0, background: '#1a0a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'white', fontSize: '1rem' }}>⏳ Loading game...</p>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1a0a2e', zIndex: 50 }}>
      <iframe
        src={iframeSrc}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Catch the Popcorn"
        allow="autoplay"
      />
      {/* Attempt HUD — only show when maxTries > 1 */}
      {maxTries > 1 && (
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '4px 14px',
          color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700,
          pointerEvents: 'none', zIndex: 60,
        }}>
          🎯 Attempt {attempts} / {maxTries}
        </div>
      )}
      {gameDone && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '10px', textAlign: 'center',
          background: 'rgba(0,0,0,0.4)',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>✅ Score saved!</p>
        </div>
      )}
    </div>
  );
}
