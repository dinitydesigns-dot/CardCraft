import { useState } from 'react';
import type { User, DemoSession } from '../types';
import { authenticate, createDemoSession } from '../store';
import { DEMO_MAX_TRIES } from '../types';
import {
  Palette,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
  onStartDemo: (session: DemoSession) => void;
}

type PageTab = 'signin' | 'demo';

const DEMO_PERKS = [
  '3 free card downloads (PNG)',
  'Access to 3 premium templates',
  'Full editor — image, text, badges',
  'Live preview updates instantly',
  'No sign-up required',
];

export function LoginPage({ onLogin, onStartDemo }: Props) {
  const [tab, setTab] = useState<PageTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authenticate(email.trim(), password);
      if (user) onLogin(user);
      else setError('Invalid email or password');
    } catch (err: any) {
      console.error('LOGIN ERROR:', err);
      setError(err?.message ?? JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: catches the demo-lock error thrown by createDemoSession()
  const handleStartDemo = () => {
    setError('');
    setDemoLoading(true);

    setTimeout(() => {
      try {
        const session = createDemoSession(); // may throw if demo is locked
        onStartDemo(session);
      } catch (err: any) {
        console.error('DEMO START ERROR:', err);
        setError(err?.message ?? 'Demo limit reached. Please try again later.');
      } finally {
        setDemoLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/30 mb-3">
            <Palette className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">CardCraft</h1>
          <p className="text-purple-300/70 mt-1 text-xs sm:text-sm">
            Product Card Designer for Small Businesses
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-4 gap-1">
          <button
            type="button"
            onClick={() => setTab('signin')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'signin'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => setTab('demo')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === 'demo'
              ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm'
              : 'text-purple-300 hover:text-purple-100'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Try Demo
          </button>
        </div>

        {/* ── SIGN IN PANEL ── */}
        {tab === 'signin' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-5 sm:p-7 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">Welcome back</h2>
            <p className="text-gray-400 text-sm mb-5">Sign in to access your template</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── DEMO PANEL ── */}
        {tab === 'demo' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Demo header */}
            <div className="bg-gradient-to-r from-violet-600/80 to-purple-600/80 px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Free Demo</h2>
                  <p className="text-purple-200 text-xs">No sign-up required</p>
                </div>
              </div>

              {/* Tries indicator */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-purple-200 font-medium">Free downloads:</span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: DEMO_MAX_TRIES }).map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border-2 border-white/40 bg-white/20 flex items-center justify-center text-xs font-bold text-white"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <span className="text-purple-200 text-xs">= {DEMO_MAX_TRIES} total</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Show demo lock error here */}
              {error && (
                <div className="flex items-center gap-2 text-red-300 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* What you get */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                  What's included
                </p>
                <div className="space-y-2">
                  {DEMO_PERKS.map((perk) => (
                    <div key={perk} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                      <span className="text-sm text-gray-200">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">How it works</p>
                {[
                  { step: '1', text: 'Click "Start Free Demo" below' },
                  { step: '2', text: 'Edit your product details & design' },
                  { step: '3', text: 'Download your card (uses 1 of 3 tries)' },
                  { step: '4', text: 'Sign in any time for unlimited access' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-500/30 border border-violet-400/40 flex items-center justify-center text-[10px] font-bold text-violet-300 shrink-0">
                      {step}
                    </div>
                    <span className="text-sm text-gray-300">{text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleStartDemo}
                disabled={demoLoading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:scale-[0.98] text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50"
              >
                {demoLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up demo…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Start Free Demo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-gray-500 text-xs">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="text-purple-400 hover:text-purple-300 font-medium underline underline-offset-2 transition-colors"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}