import { useState } from 'react';
import {
  Database, ChevronDown, ChevronUp, ExternalLink, Copy, Check,
  AlertTriangle, X, CheckCircle2, Wifi, WifiOff,
} from 'lucide-react';

interface Props {
  isConnected: boolean;
  onDismiss: () => void;
}

const SQL_SETUP = `-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.app_users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username       TEXT UNIQUE NOT NULL,
  display_name   TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'client',
  assigned_template TEXT NOT NULL DEFAULT 'elegant-dark',
  product_data   JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_log (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  detail     TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custom_templates (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  config     JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON public.app_users        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.activity_log     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.custom_templates FOR ALL USING (true) WITH CHECK (true);`;

const ENV_TEMPLATE = `# Create a file called .env in your project root:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`;

export function SetupBanner({ isConnected, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const copyText = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  };

  if (isConnected) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-200" />
          <span className="font-medium">Backend connected — Supabase database is active</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
        </div>
        <button onClick={onDismiss} className="text-emerald-200 hover:text-white transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      {/* Header row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4 text-amber-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-900">Running in offline mode — no backend connected</p>
            <p className="text-xs text-amber-700 hidden sm:block">
              Data is saved in browser only. Connect Supabase to enable persistent cloud storage.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Connect Backend <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold transition-colors border border-amber-300"
          >
            {expanded ? 'Hide' : 'Setup Guide'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onDismiss} className="text-amber-500 hover:text-amber-800 p-1 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded setup guide */}
      {expanded && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Step 1 */}
            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-black">1</div>
                <p className="text-sm font-bold text-gray-800">Create Supabase Project</p>
              </div>
              <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
                <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline font-medium">supabase.com</a></li>
                <li>Sign up for a free account</li>
                <li>Click <strong>"New Project"</strong></li>
                <li>Choose a name, password & region</li>
                <li>Wait ~2 minutes for setup</li>
              </ol>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-black">2</div>
                <p className="text-sm font-bold text-gray-800">Create Database Tables</p>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                In your Supabase project, go to <strong>SQL Editor</strong> and run this SQL:
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 text-[9px] p-2.5 rounded-lg overflow-x-auto max-h-32 scrollbar-thin">
                  {SQL_SETUP.slice(0, 300)}...
                </pre>
                <button
                  onClick={() => copyText(SQL_SETUP, setCopiedSql)}
                  className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                    copiedSql ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedSql ? 'Copied!' : 'Copy SQL'}
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-black">3</div>
                <p className="text-sm font-bold text-gray-800">Add Your API Keys</p>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Go to <strong>Project Settings → API</strong> and copy your keys. Create a <code className="bg-gray-100 px-1 rounded">.env</code> file:
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 text-[10px] p-2.5 rounded-lg overflow-x-auto">
                  {ENV_TEMPLATE}
                </pre>
                <button
                  onClick={() => copyText(ENV_TEMPLATE, setCopiedEnv)}
                  className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                    copiedEnv ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {copiedEnv ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedEnv ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Then restart the dev server: <code className="bg-gray-100 px-1 rounded">npm run dev</code></p>
            </div>
          </div>

          {/* What backend enables */}
          <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-violet-600" />
              <p className="text-sm font-bold text-gray-800">What the backend enables</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-700">
              {[
                { icon: '🔐', title: 'Real Authentication', desc: 'Supabase Auth handles login securely — no plain-text passwords' },
                { icon: '☁️', title: 'Cloud Storage', desc: 'User data, templates & activity logs saved to PostgreSQL' },
                { icon: '🔄', title: 'Multi-device Access', desc: 'Clients can log in from any device, data stays synced' },
                { icon: '👥', title: 'Scalable Users', desc: 'Add unlimited clients without localStorage limits' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-2.5">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{item.title}</p>
                    <p className="text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-bold mb-0.5">Currently running in localStorage mode</p>
              <p>
                All data (users, passwords, templates, activity) is saved in your browser's localStorage.
                This works fine for demo/testing but data will be lost if you clear browser storage.
                Connect Supabase for production-ready persistent storage.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
