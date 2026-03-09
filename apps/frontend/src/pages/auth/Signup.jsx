import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ orgName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/signup', { orgName: form.orgName, email: form.email, password: form.password });
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

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
          <CardHeader>
            <h1 className="text-xl font-semibold text-gray-900">Create your organization</h1>
            <p className="text-sm text-gray-500 mt-1">Start rewarding your customers with game-based loyalty</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Organization Name</label>
                <Input name="orgName" placeholder="Acme Corp" value={form.orgName} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <Input name="email" type="email" placeholder="you@company.com" value={form.email} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Input name="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} required minLength={8} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                <Input name="confirmPassword" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} required />
              </div>
              {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Organization'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
