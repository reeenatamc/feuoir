import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

export function AdminLogin({ isAuthenticated }: { isAuthenticated: boolean }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(t('login.error'));
      setPassword('');
    } else {
      navigate('/admin', { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-[320px]">
        <div className="text-center mb-12">
          <img
            src="/logo.png"
            alt="Feuoir"
            className="mx-auto mb-4"
            style={{ height: '120px', width: '120px', objectFit: 'contain', mixBlendMode: 'multiply' }}
          />
          <p className="text-[10px] tracking-[0.3em] uppercase text-black/30">{t('login.panel')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.3em] uppercase text-black/35">{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className="w-full py-3 bg-transparent border-b border-black/15 focus:border-black focus:outline-none text-sm tracking-wide transition-colors"
              autoFocus
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.3em] uppercase text-black/35">{t('login.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className={`w-full py-3 pr-9 bg-transparent border-b focus:outline-none text-sm tracking-wide transition-colors ${
                  error ? 'border-red-300' : 'border-black/15 focus:border-black'
                }`}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-black/25 hover:text-black/50 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && <p className="text-[11px] tracking-wide text-red-400">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={!email || !password || loading}
            className="w-full py-4 bg-black text-white text-[11px] tracking-[0.3em] uppercase hover:bg-black/80 active:bg-black/70 transition-colors disabled:opacity-35 disabled:cursor-not-allowed relative overflow-hidden group"
          >
            <span className="relative z-10">{loading ? t('login.submitting') : t('login.submit')}</span>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(90deg, rgba(255,90,31,0.1), rgba(193,18,31,0.1))' }}
            />
          </button>
        </form>
      </div>
    </div>
  );
}
