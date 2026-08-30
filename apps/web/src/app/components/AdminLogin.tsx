import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, } from 'react-router';
import { useTransitionNavigate } from '../lib/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { fireGradient } from '../theme/color';

export function AdminLogin({ isAuthenticated }: { isAuthenticated: boolean }) {
  const navigate = useTransitionNavigate();
  const { t } = useTranslation();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: FormEvent) => {
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
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-[320px]">
        <div className="text-center mb-12">
          <img
            src="/logo.png"
            alt="Feuoir"
            className="mx-auto mb-4"
            style={{ height: '120px', width: '120px', objectFit: 'contain', mixBlendMode: 'multiply' }}
          />
          <p className="text-[10px] tracking-[0.3em] uppercase text-ink/30">{t('login.panel')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.3em] uppercase text-ink/35">{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className="w-full py-3 bg-transparent border-b border-ink/15 focus:border-ink focus:outline-none text-sm tracking-wide transition-colors"
              autoFocus
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.3em] uppercase text-ink/35">{t('login.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className={`w-full py-3 pr-9 bg-transparent border-b focus:outline-none text-sm tracking-wide transition-colors ${
                  error ? 'border-red-300' : 'border-ink/15 focus:border-ink'
                }`}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-ink/25 hover:text-ink/50 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && <p className="text-[11px] tracking-wide text-red-400">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={!email || !password || loading}
            className="w-full py-4 bg-ink text-ink-inverse text-[11px] tracking-[0.3em] uppercase hover:bg-ink/80 active:bg-ink/70 transition-colors disabled:opacity-35 disabled:cursor-not-allowed relative overflow-hidden group"
          >
            <span className="relative z-10">{loading ? t('login.submitting') : t('login.submit')}</span>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: fireGradient([['orange', 10], ['red', 10]]) }}
            />
          </button>
        </form>
      </div>
    </div>
  );
}
