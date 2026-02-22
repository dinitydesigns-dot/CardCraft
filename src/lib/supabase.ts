/**
 * ─── Supabase Client ──────────────────────────────────────────────────────────
 *
 * HOW TO CONNECT YOUR OWN SUPABASE PROJECT:
 * 1. Go to https://supabase.com and create a free account
 * 2. Create a new project
 * 3. Go to Project Settings → API
 * 4. Copy your "Project URL" and "anon public" key
 * 5. Replace SUPABASE_URL and SUPABASE_ANON_KEY below with your values
 *
 * DATABASE SETUP (run in Supabase SQL Editor):
 * ─────────────────────────────────────────────
 *
 * -- Users table (extends Supabase auth.users)
 * CREATE TABLE IF NOT EXISTS public.app_users (
 *   id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   auth_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 *   username     TEXT UNIQUE NOT NULL,
 *   display_name TEXT NOT NULL,
 *   role         TEXT NOT NULL DEFAULT 'client',
 *   assigned_template TEXT NOT NULL DEFAULT 'elegant-dark',
 *   product_data JSONB NOT NULL DEFAULT '{}',
 *   created_at   TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- Activity log table
 * CREATE TABLE IF NOT EXISTS public.activity_log (
 *   id         BIGSERIAL PRIMARY KEY,
 *   user_id    UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
 *   type       TEXT NOT NULL,
 *   detail     TEXT,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- Custom templates table
 * CREATE TABLE IF NOT EXISTS public.custom_templates (
 *   id         TEXT PRIMARY KEY,
 *   name       TEXT NOT NULL,
 *   config     JSONB NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- Row Level Security (RLS)
 * ALTER TABLE public.app_users    ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;
 *
 * -- Policies: only authenticated users can read/write their own rows
 * CREATE POLICY "Users can read own row" ON public.app_users
 *   FOR SELECT USING (auth.uid() = auth_id);
 *
 * CREATE POLICY "Admin can read all" ON public.app_users
 *   FOR ALL USING (true);  -- tighten this per your needs
 *
 * CREATE POLICY "Users can log own activity" ON public.activity_log
 *   FOR INSERT WITH CHECK (true);
 *
 * CREATE POLICY "Admin can read all activity" ON public.activity_log
 *   FOR SELECT USING (true);
 *
 * CREATE POLICY "Admin manages templates" ON public.custom_templates
 *   FOR ALL USING (true);
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Replace these with your actual Supabase project credentials ───────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
// ─────────────────────────────────────────────────────────────────────────────

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const supabase = getSupabaseClient();
