// src/pages/OperatorLogin.jsx
import { useState } from 'react';
import { Droplets, Loader } from 'lucide-react';
import { authAPI } from '../utils/api';

export default function OperatorLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem('operator_token', res.data.token);
      localStorage.setItem('operator_info', JSON.stringify(res.data.operator));
      onLogin && onLogin(res.data.operator);
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">AquaAlert</h1>
          <p className="text-sm text-slate-400 mt-1">GWCL Operator Dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@gwcl.gov.gh"
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-xs text-red-400 bg-red-950/50 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
            Sign in to dashboard
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-4">
          GWCL staff access only · Northern Region
        </p>
      </div>
    </div>
  );
}
