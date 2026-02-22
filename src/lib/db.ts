/**
 * ─── Backend Database Operations ─────────────────────────────────────────────
 *
 * This module handles all Supabase (PostgreSQL) database operations.
 * When Supabase is not configured, all functions return null/false and
 * the app gracefully falls back to localStorage (see store.ts).
 */

import { supabase, isSupabaseConfigured } from './supabase';
import {
  User,
  ProductData,
  CustomTemplateConfig,
  ActivityEntry,
  DEFAULT_PRODUCT_DATA,
  INITIAL_USERS,
} from '../types';

// ─── Types that mirror the DB schema ──────────────────────────────────────────

export interface DBUser {
  id: string;
  auth_id: string | null;
  username: string;
  display_name: string;
  role: 'client' | 'admin';
  assigned_template: string;
  product_data: ProductData;
  created_at: string;
}

export interface DBActivityLog {
  id: number;
  user_id: string;
  type: 'login' | 'edit' | 'download';
  detail: string | null;
  created_at: string;
}

export interface DBCustomTemplate {
  id: string;
  name: string;
  config: CustomTemplateConfig;
  created_at: string;
}

// ─── Helper: convert DB row → app User ────────────────────────────────────────

function dbUserToAppUser(row: DBUser, password = '••••••••', activity: ActivityEntry[] = []): User {
  return {
    id: row.id,
    username: row.username,
    password, // passwords are NOT stored in DB (Supabase Auth handles them)
    displayName: row.display_name,
    role: row.role,
    assignedTemplate: row.assigned_template,
    productData: { ...DEFAULT_PRODUCT_DATA, ...(row.product_data ?? {}) },
    activity,
  };
}

// ─── Helper: normalize identifier to email ────────────────────────────────────
// Supports:
// - real email login: "user@gmail.com"
// - legacy username login: "client1" -> "client1@cardcraft.internal"
function toAuthEmail(identifier: string): string {
  const raw = (identifier ?? '').trim().toLowerCase();
  if (raw.includes('@')) return raw;
  return `${raw}@cardcraft.internal`;
}

// ─── Connection check ─────────────────────────────────────────────────────────

export async function checkConnection(): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    // If we can reach PostgREST at all, Supabase is "reachable".
    // Even if RLS blocks the query, we still consider the backend connected.
    await supabase.from('app_users').select('id').limit(1);
    return true;
  } catch {
    return false;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Sign in with email + password (preferred).
 * If a non-email username is provided, we fall back to "username@cardcraft.internal"
 * for compatibility with seeded/demo users.
 */
export async function dbSignIn(identifier: string, password: string): Promise<User | null> {
  if (!supabase) return null;

  try {
    const email = toAuthEmail(identifier);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) return null;

    // Fetch the user's profile row by auth_id
    const { data: profile, error: profileError } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (profileError || !profile) return null;

    // Fetch recent activity
    const { data: activityRows } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const activity: ActivityEntry[] = (activityRows ?? []).map((r: DBActivityLog) => ({
      type: r.type,
      timestamp: new Date(r.created_at).getTime(),
      detail: r.detail ?? undefined,
    }));

    // Never store raw password in app state; return masked password
    return dbUserToAppUser(profile as DBUser, '••••••••', activity);
  } catch {
    return null;
  }
}

/**
 * Sign out from Supabase Auth.
 */
export async function dbSignOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Get current session (if exists) and return the user profile.
 */
export async function dbGetSession(): Promise<User | null> {
  if (!supabase) return null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return null;

    const { data: profile, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_id', session.user.id)
      .single();

    if (error || !profile) return null;

    const { data: activityRows } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const activity: ActivityEntry[] = (activityRows ?? []).map((r: DBActivityLog) => ({
      type: r.type,
      timestamp: new Date(r.created_at).getTime(),
      detail: r.detail ?? undefined,
    }));

    return dbUserToAppUser(profile as DBUser, '••••••••', activity);
  } catch {
    return null;
  }
}

// ─── User CRUD ────────────────────────────────────────────────────────────────

/**
 * Fetch all app users (admin only).
 */
export async function dbGetAllUsers(): Promise<User[] | null> {
  if (!supabase) return null;

  try {
    const { data: profiles, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return null;

    const users: User[] = [];

    for (const profile of (profiles ?? []) as DBUser[]) {
      const { data: activityRows } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const activity: ActivityEntry[] = (activityRows ?? []).map((r: DBActivityLog) => ({
        type: r.type,
        timestamp: new Date(r.created_at).getTime(),
        detail: r.detail ?? undefined,
      }));

      users.push(dbUserToAppUser(profile, '••••••••', activity));
    }

    return users;
  } catch {
    return null;
  }
}

/**
 * Create a new client user.
 *
 * IMPORTANT:
 * - If `username` contains "@", we treat it as a REAL email and create Auth user with it.
 * - Otherwise we create a legacy internal email: `${username}@cardcraft.internal`
 *
 * This keeps your existing store.ts function signatures working.
 */
export async function dbCreateUser(
  username: string,
  password: string,
  displayName: string,
  assignedTemplate: string,
): Promise<User | null> {
  if (!supabase) return null;

  try {
    const email = toAuthEmail(username); // if username is already an email, this keeps it

    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email,
        password,
        displayName,
        assignedTemplate,
        role: 'client',
      },
    });

    if (error) {
      console.error('admin-create-user invoke error:', error);
      return null;
    }

    const profile = (data as any)?.profile;
    if (!profile) return null;

    return dbUserToAppUser(profile as DBUser, '••••••••', []);
  } catch (err) {
    console.error('dbCreateUser failed:', err);
    return null;
  }
}

/**
 * Delete a user (profile + auth account).
 */
export async function dbDeleteUser(userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('app_users').delete().eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Update a user's assigned template.
 */
export async function dbUpdateUserTemplate(userId: string, templateId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('app_users').update({ assigned_template: templateId }).eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Save product data for a user.
 */
export async function dbUpdateProductData(userId: string, productData: ProductData): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('app_users').update({ product_data: productData }).eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Change a user's password via Supabase Auth.
 */
export async function dbChangePassword(newPassword: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return !error;
  } catch {
    return false;
  }
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

/**
 * Log a user activity to the DB.
 */
export async function dbLogActivity(
  userId: string,
  type: 'login' | 'edit' | 'download',
  detail?: string,
): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.from('activity_log').insert({
      user_id: userId,
      type,
      detail: detail ?? null,
    });
  } catch {
    /* ignore — activity logging should never block the UI */
  }
}

/**
 * Get activity log for a user.
 */
export async function dbGetActivity(userId: string): Promise<ActivityEntry[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return [];

    return (data ?? []).map((r: DBActivityLog) => ({
      type: r.type,
      timestamp: new Date(r.created_at).getTime(),
      detail: r.detail ?? undefined,
    }));
  } catch {
    return [];
  }
}

// ─── Custom Templates ─────────────────────────────────────────────────────────

export async function dbGetCustomTemplates(): Promise<CustomTemplateConfig[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('custom_templates').select('*').order('created_at', { ascending: true });
    if (error) return null;

    return (data ?? []).map((r: DBCustomTemplate) => r.config as CustomTemplateConfig);
  } catch {
    return null;
  }
}

export async function dbSaveCustomTemplate(config: CustomTemplateConfig): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('custom_templates')
      .upsert({ id: config.id, name: config.name, config }, { onConflict: 'id' });

    return !error;
  } catch {
    return false;
  }
}

export async function dbDeleteCustomTemplate(id: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('custom_templates').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ─── Seed initial users (first-time setup) ────────────────────────────────────

/**
 * Check if the database has been seeded yet.
 * Returns true if at least one user exists.
 */
export async function dbIsSeedNeeded(): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { count } = await supabase.from('app_users').select('*', { count: 'exact', head: true });
    return (count ?? 0) === 0;
  } catch {
    return false;
  }
}

/**
 * Seed the database with the default users from INITIAL_USERS.
 * NOTE: These seeded users will be created as `${username}@cardcraft.internal`.
 */
export async function dbSeedInitialUsers(): Promise<void> {
  if (!supabase) return;

  for (const user of INITIAL_USERS) {
    try {
      const email = toAuthEmail(user.username);

      const { data: authData } = await supabase.auth.signUp({
        email,
        password: user.password,
      });

      if (!authData.user) continue;

      await supabase.from('app_users').insert({
        auth_id: authData.user.id,
        username: user.username,
        display_name: user.displayName,
        role: user.role,
        assigned_template: user.assignedTemplate,
        product_data: user.productData,
      });
    } catch {
      /* ignore seed errors */
    }
  }
}

export async function dbReauthenticate(email: string, currentPassword: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: currentPassword,
  });

  return !error;
}

