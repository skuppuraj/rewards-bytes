import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../../lib/publicApi';
import { useCustomerStore } from '../../../store/customerStore';

export default function PlayCatchPopcorn() {
  const { orgSlug, sessionId } = useParams();
  const navigate = useNavigate();
  const { token } = useCustomerStore();
  const [gameDone, setGameDone] = useState(false);
  const savedRef = useRef(false);
  const [iframeSrc, setIframeSrc] = useState(null);

  // Auth guard — redirect to login, return here after
  useEffect(() => {
    if (!token) {
      navigate(`/play/${orgSlug}/login`, {
        replace: true,
        state: { returnTo: `/play/${orgSlug}/play/popcorn/${sessionId}` }
      });
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    publicApi.get(`/game/session/${sessionId}`).then(r => {
      const cfg = r.data?.orgGameId;
      const durationSecs = Math.round((cfg?.timerMinutes || 0) * 60) || (cfg?.gameConfig?.durationSeconds) || 20;
      const winThreshold = cfg?.gameConfig?.winThreshold || 10;
      setIframeSrc(`/games/catch-popcorn/index.html?duration=${durationSecs}&winThreshold=${winThreshold}`);
    }).catch(() => {
      setIframeSrc('/games/catch-popcorn/index.html?duration=20&winThreshold=10');
    });
  }, [sessionId, token]);

  useEffect(() => {
    if (!token) return;
    const handleMessage = async (event) => {
      if (event.data?.type === 'GAME_COMPLETE' && !savedRef.current) {
        savedRef.current = true;
        const { score, won } = event.data;
        setGameDone(true);
        try {
          await publicApi.post('/game/complete', {
            sessionId,
            result: { won, score, type: 'catch_popcorn' }
          });
        } catch (err) {
          console.error('Error saving game result', err);
        }
      }
      if (event.data?.type === 'GO_TO_REWARDS') {
        navigate(`/play/${orgSlug}/complete/${sessionId}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sessionId, orgSlug, navigate, token]);

  // Don't render anything while redirecting
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
      {gameDone && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px', textAlign: 'center',
          background: 'rgba(0,0,0,0.4)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>✅ Score saved!</p>
        </div>
      )}
    </div>
  );
}
