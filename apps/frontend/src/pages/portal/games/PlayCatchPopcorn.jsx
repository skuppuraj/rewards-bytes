import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../../lib/publicApi';

export default function PlayCatchPopcorn() {
  const { orgSlug, sessionId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [gameComplete, setGameComplete] = useState(false);

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data?.type === 'GAME_COMPLETE') {
        const { score } = event.data;
        setGameComplete(true);
        try {
          await publicApi.post('/game/complete', {
            sessionId,
            result: { won: score >= 10, score, type: 'catch_popcorn' }
          });
          navigate(`/play/${orgSlug}/complete/${sessionId}`);
        } catch (err) {
          toast.error(err.response?.data?.error || 'Error completing game');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sessionId, orgSlug, navigate]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1a0a2e', zIndex: 50 }}>
      <iframe
        ref={iframeRef}
        src="/games/catch-popcorn/index.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Catch the Popcorn"
        allow="autoplay"
      />
      {gameComplete && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)'
        }}>
          <p style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700 }}>⏳ Saving your score...</p>
        </div>
      )}
    </div>
  );
}
