/**
 * ─── Hybrid Store ─────────────────────────────────────────────────────────────
 *
 * This store is the single source of truth for the app.
 * It tries to use the Supabase backend first. If Supabase is not configured
 * or a DB call fails, it gracefully falls back to localStorage.
 *
 * localStorage key structure:
 *   cardcraft_users             → User[]
 *   cardcraft_session           → userId string
 *   cardcraft_custom_templates  → CustomTemplateConfig[]
 *   cardcraft_demo              → DemoSession
 *   cardcraft_backend_mode      → 'supabase' | 'local'
 *   cardcraft_demo_lock_until   → timestamp (number)
 */

import {
  User, INITIAL_USERS, ProductData, TemplateId,
  CustomTemplateConfig, ActivityEntry, DEFAULT_PRODUCT_DATA,
  DemoSession, DEMO_TEMPLATES, DEMO_MAX_TRIES,
} from './types';

import { isSupabaseConfigured } from './lib/supabase';

import {
  dbSignIn, dbSignOut, dbGetSession, dbGetAllUsers,
  dbCreateUser, dbDeleteUser, dbUpdateUserTemplate,
  dbUpdateProductData, dbChangePassword, dbLogActivity,
  dbGetActivity, dbGetCustomTemplates, dbSaveCustomTemplate,
  dbDeleteCustomTemplate, checkConnection,
  dbReauthenticate,
} from './lib/db';

// ─── Storage keys ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cardcraft_users';
const SESSION_KEY = 'cardcraft_session';
const CUSTOM_TEMPLATES_KEY = 'cardcraft_custom_templates';
const DEMO_KEY = 'cardcraft_demo';
const BACKEND_MODE_KEY = 'cardcraft_backend_mode';

// demo lock (prevents “refresh to get 3 more tries”)
const DEMO_LOCK_KEY = 'cardcraft_demo_lock_until';
const DEMO_LOCK_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// ─── Backend mode tracking ────────────────────────────────────────────────────

type BackendMode = 'supabase' | 'local';
let _backendMode: BackendMode = 'local';
let _connectionChecked = false;

export function getBackendMode(): BackendMode {
  return _backendMode;
}

export function isBackendConnected(): boolean {
  return _backendMode === 'supabase';
}

/**
 * Check the backend connection status.
 * Call this once at app startup.
 */
export async function initBackend(): Promise<BackendMode> {
  if (!isSupabaseConfigured()) {
    _backendMode = 'local';
    _connectionChecked = true;
    return 'local';
  }

  const connected = await checkConnection();
  _backendMode = connected ? 'supabase' : 'local';
  _connectionChecked = true;
  localStorage.setItem(BACKEND_MODE_KEY, _backendMode);
  return _backendMode;
}

export function isConnectionChecked(): boolean {
  return _connectionChecked;
}

// ─── Local storage helpers ────────────────────────────────────────────────────

function migrateUser(
  u: Partial<User> & {
    id: string;
    username: string;
    password: string;
    displayName: string;
    role: 'client' | 'admin';
  },
): User {
  const pd = u.productData ?? {};
  return {
    ...u,
    assignedTemplate: u.assignedTemplate ?? 'elegant-dark',
    role: u.role ?? 'client',
    activity: u.activity ?? [],
    productData: {
      ...DEFAULT_PRODUCT_DATA,
      ...pd,
      extraImages: (pd as ProductData).extraImages ?? [],
      badge: (pd as ProductData).badge ?? 'none',
      accentColorOverride: (pd as ProductData).accentColorOverride ?? '',
      cardSize: (pd as ProductData).cardSize ?? 'square',
      font: (pd as ProductData).font ?? 'inter',
      bgPattern: (pd as ProductData).bgPattern ?? 'none',
    },
  } as User;
}

function loadLocalUsers(): User[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as User[];
      return parsed.map(migrateUser);
    }
  } catch {
    /* ignore */
  }

  const users = INITIAL_USERS.map(migrateUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return users;
}

function saveLocalUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// ─── Authentication ────────────────────────────────────────────────────────────

/**
 * Authenticate a user.
 * Uses Supabase Auth if connected, otherwise localStorage.
 */
export async function authenticate(username: string, password: string): Promise<User | null> {
  if (_backendMode === 'supabase') {
    const user = await dbSignIn(username, password);
    if (user) {
      localStorage.setItem(SESSION_KEY, user.id);
      await dbLogActivity(user.id, 'login', `Logged in as ${user.displayName}`);
    }
    return user;
  }

  // Local fallback
  const users = loadLocalUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem(SESSION_KEY, user.id);
    logActivityLocal(user.id, 'login', `Logged in as ${user.displayName}`);
    return migrateUser(user);
  }
  return null;
}

/**
 * Restore session on page load.
 */
export async function getSession(): Promise<User | null> {
  if (_backendMode === 'supabase') {
    return dbGetSession();
  }

  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;

  const users = loadLocalUsers();
  const user = users.find(u => u.id === id);
  return user ? migrateUser(user) : null;
}

/**
 * Log out.
 */
export async function logout(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
  if (_backendMode === 'supabase') {
    await dbSignOut();
  }
}

// ─── Product Data ──────────────────────────────────────────────────────────────

export async function updateProductData(userId: string, data: ProductData): Promise<void> {
  if (_backendMode === 'supabase') {
    await dbUpdateProductData(userId, data);
  }

  // Always update local copy as a cache
  const users = loadLocalUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    users[idx].productData = data;
    saveLocalUsers(users);
  }
}

// ─── User Management ──────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  if (_backendMode === 'supabase') {
    const users = await dbGetAllUsers();
    if (users) {
      saveLocalUsers(users); // cache
      return users;
    }
  }
  return loadLocalUsers();
}

export async function addUser(
  username: string,
  password: string,
  displayName: string,
  assignedTemplate: TemplateId,
): Promise<User | null> {
  if (_backendMode === 'supabase') {
    return dbCreateUser(username, password, displayName, assignedTemplate);
  }

  const users = loadLocalUsers();
  const newUser: User = migrateUser({
    id: Date.now().toString(),
    username,
    password,
    displayName,
    assignedTemplate,
    productData: { ...DEFAULT_PRODUCT_DATA },
    role: 'client',
    activity: [],
  });

  users.push(newUser);
  saveLocalUsers(users);
  return newUser;
}

export async function deleteUser(userId: string): Promise<void> {
  if (_backendMode === 'supabase') {
    await dbDeleteUser(userId);
  }
  const users = loadLocalUsers().filter(u => u.id !== userId);
  saveLocalUsers(users);
}

export async function updateUserTemplate(userId: string, templateId: TemplateId): Promise<void> {
  if (_backendMode === 'supabase') {
    await dbUpdateUserTemplate(userId, templateId);
  }
  const users = loadLocalUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    users[idx].assignedTemplate = templateId;
    saveLocalUsers(users);
  }
}

// ─── Password Management ──────────────────────────────────────────────────────

/**
 * Verify current password:
 * - Supabase mode: re-auth with Supabase using email+password
 * - Local mode: compare against localStorage
 */
export async function verifyCurrentPassword(email: string, currentPassword: string): Promise<boolean> {
  if (_backendMode === 'supabase') {
    return dbReauthenticate(email, currentPassword);
  }

  const users = loadLocalUsers();
  const e = email.trim().toLowerCase();
  return Boolean(
    users.find(u => u.username.trim().toLowerCase() === e && u.password === currentPassword),
  );
}

/**
 * Verify a user's password (LOCAL ONLY).
 * Supabase does not expose passwords. Use verifyCurrentPassword for Supabase mode.
 */
export function verifyPassword(userId: string, password: string): boolean {
  if (_backendMode === 'supabase') return false;

  const users = loadLocalUsers();
  const user = users.find(u => u.id === userId);
  return user?.password === password;
}

/**
 * Update password.
 * - In Supabase mode: calls Supabase Auth updateUser (via dbChangePassword)
 * - In local mode: updates localStorage
 */
export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  if (_backendMode === 'supabase') {
    return dbChangePassword(newPassword);
  }

  const users = loadLocalUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    users[idx].password = newPassword;
    saveLocalUsers(users);
    return true;
  }
  return false;
}

/**
 * Admin password change with validation.
 * Returns:
 *  - null on success
 *  - string error message on failure
 */
export async function changeAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<string | null> {
  if (newPassword.length < 6) return 'New password must be at least 6 characters.';
  if (newPassword !== confirmPassword) return 'Passwords do not match.';
  if (newPassword === currentPassword) return 'New password must be different from the current password.';

  if (_backendMode === 'supabase') {
    const sessionUser = await getSession();
    if (!sessionUser) return 'No active session. Please sign in again.';
    if (sessionUser.id !== adminId) return 'You can only change your own password.';

    const ok = await verifyCurrentPassword(sessionUser.username, currentPassword);
    if (!ok) return 'Current password is incorrect.';

    const updated = await updateUserPassword(adminId, newPassword);
    if (!updated) return 'Failed to update password. Please try again.';
    return null;
  }

  // Local mode
  const users = loadLocalUsers();
  const admin = users.find(u => u.id === adminId);
  if (!admin) return 'Admin user not found.';
  if (admin.password !== currentPassword) return 'Current password is incorrect.';

  const updated = await updateUserPassword(adminId, newPassword);
  if (!updated) return 'Failed to update password. Please try again.';
  return null;
}

// Friendly name for UI (works for both admin + normal users)
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<string | null> {
  return changeAdminPassword(userId, currentPassword, newPassword, confirmPassword);
}

// ─── Activity Log ──────────────────────────────────────────────────────────────

function logActivityLocal(userId: string, type: ActivityEntry['type'], detail?: string) {
  const users = loadLocalUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    if (!users[idx].activity) users[idx].activity = [];
    users[idx].activity.unshift({ type, timestamp: Date.now(), detail });
    users[idx].activity = users[idx].activity.slice(0, 50);
    saveLocalUsers(users);
  }
}

export async function logActivity(
  userId: string,
  type: ActivityEntry['type'],
  detail?: string,
): Promise<void> {
  if (_backendMode === 'supabase') {
    await dbLogActivity(userId, type as 'login' | 'edit' | 'download', detail);
  }
  logActivityLocal(userId, type, detail);
}

export async function getUserActivity(userId: string): Promise<ActivityEntry[]> {
  if (_backendMode === 'supabase') {
    const entries = await dbGetActivity(userId);
    if (entries.length > 0) return entries;
  }
  const users = loadLocalUsers();
  return users.find(u => u.id === userId)?.activity ?? [];
}

// ─── Custom Templates ──────────────────────────────────────────────────────────

export async function getCustomTemplates(): Promise<CustomTemplateConfig[]> {
  if (_backendMode === 'supabase') {
    const templates = await dbGetCustomTemplates();
    if (templates) {
      localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
      return templates;
    }
  }

  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (stored) return JSON.parse(stored) as CustomTemplateConfig[];
  } catch { /* ignore */ }

  return [];
}

export async function saveCustomTemplate(config: CustomTemplateConfig): Promise<void> {
  if (_backendMode === 'supabase') {
    await dbSaveCustomTemplate(config);
  }

  const templates = getCustomTemplatesSync();
  const idx = templates.findIndex(t => t.id === config.id);
  if (idx >= 0) templates[idx] = config;
  else templates.push(config);

  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
}

export async function deleteCustomTemplate(id: string): Promise<void> {
  if (_backendMode === 'supabase') {
    await dbDeleteCustomTemplate(id);
  }

  const templates = getCustomTemplatesSync();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(filtered));
}

export function getCustomTemplateById(id: string): CustomTemplateConfig | null {
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (stored) {
      const templates = JSON.parse(stored) as CustomTemplateConfig[];
      return templates.find(t => t.id === id) ?? null;
    }
  } catch { /* ignore */ }
  return null;
}

function getCustomTemplatesSync(): CustomTemplateConfig[] {
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (stored) return JSON.parse(stored) as CustomTemplateConfig[];
  } catch { /* ignore */ }
  return [];
}

// ─── Demo Session ─────────────────────────────────────────────────────────────

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createDemoSession(): DemoSession {
  if (isDemoLocked()) {
    throw new Error('Demo limit reached. Please sign in, or try again in 3 days.');
  }

  const session: DemoSession = {
    id: randomId(),
    triesUsed: 0,
    currentTemplateIndex: 0,
    productData: {
      ...DEFAULT_PRODUCT_DATA,
      productName: 'My Amazing Product',
      price: '$29.99',
      description:
        'A fantastic product your customers will love. Edit this text to describe your own product.',
      contactNumber: '+2349167842902',
      ctaText: 'Order Now',
    },
    startedAt: Date.now(),
    expired: false,
  };

  localStorage.setItem(DEMO_KEY, JSON.stringify(session));
  return session;
}

export function getDemoSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export function saveDemoSession(session: DemoSession) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(session));
}

export function clearDemoSession() {
  localStorage.removeItem(DEMO_KEY);
}

export function getDemoTriesLeft(session: DemoSession): number {
  return Math.max(0, DEMO_MAX_TRIES - session.triesUsed);
}

export function useDemoTry(session: DemoSession): DemoSession {
  const updated: DemoSession = {
    ...session,
    triesUsed: session.triesUsed + 1,
    expired: session.triesUsed + 1 >= DEMO_MAX_TRIES,
  };

  saveDemoSession(updated);

  if (updated.expired) lockDemo();
  return updated;
}

export function cycleDemoTemplate(session: DemoSession): DemoSession {
  const next = (session.currentTemplateIndex + 1) % DEMO_TEMPLATES.length;
  const updated: DemoSession = { ...session, currentTemplateIndex: next };
  saveDemoSession(updated);
  return updated;
}

export function updateDemoProductData(session: DemoSession, data: ProductData): DemoSession {
  const updated: DemoSession = { ...session, productData: data };
  saveDemoSession(updated);
  return updated;
}

// ─── Reset (dev/testing only) ──────────────────────────────────────────────────

export function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(CUSTOM_TEMPLATES_KEY);
  localStorage.removeItem(DEMO_KEY);
  localStorage.removeItem(BACKEND_MODE_KEY);
  localStorage.removeItem(DEMO_LOCK_KEY);
}

// ─── Demo Lock Helpers ─────────────────────────────────────────────────────────

export function getDemoLockUntil(): number {
  const raw = localStorage.getItem(DEMO_LOCK_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function isDemoLocked(): boolean {
  return Date.now() < getDemoLockUntil();
}

function lockDemo(): void {
  localStorage.setItem(DEMO_LOCK_KEY, String(Date.now() + DEMO_LOCK_MS));
}

export function clearDemoLock(): void {
  localStorage.removeItem(DEMO_LOCK_KEY);
}

