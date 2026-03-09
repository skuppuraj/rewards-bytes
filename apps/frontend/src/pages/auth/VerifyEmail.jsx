import { useEffect, useState } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, MailCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = location.state?.email;
  const [status, setStatus] = useState(token ? 'verifying' : 'pending');

  useEffect(() => {
    if (token) {
      api.get(`/auth/verify-email?token=${token}`)
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'));
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">Rewards Bytes</span>
        </div>
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            {status === 'pending' && (
              <>
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto">
                  <MailCheck className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Check your inbox</h2>
                <p className="text-sm text-gray-500">We sent a verification link to <strong>{email}</strong>.</p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>Back to Login</Button>
              </>
            )}
            {status === 'verifying' && <><Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" /><p className="text-gray-600">Verifying...</p></>}
            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Email Verified!</h2>
                <p className="text-sm text-gray-500">Your organization is now active.</p>
                <Button className="w-full" onClick={() => navigate('/login')}>Go to Login</Button>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Verification Failed</h2>
                <Button variant="outline" className="w-full" onClick={() => navigate('/signup')}>Try Again</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
