import { useState, useCallback, useEffect } from 'react';
import {
  User, BUILT_IN_TEMPLATES, TemplateId,
  CustomTemplateConfig, AnyTemplate, CustomTemplateEntry,
} from '../types';
import {
  getUsers, updateUserTemplate, addUser, deleteUser,
  getCustomTemplates, deleteCustomTemplate, getUserActivity,
  changeAdminPassword,
} from '../store';
import { TemplateRenderer } from './templates/TemplateRenderer';
import { TemplateBuilder } from './TemplateBuilder';
import {
  LogOut, Users, LayoutGrid, Plus, Trash2, ChevronRight, X, Palette,
  Shield, Wand2, Pencil, Eye, EyeOff, Star, Clock, Activity,
  Download, LogIn as LoginIcon, Edit3, KeyRound, Check, Lock,
  AlertCircle, CheckCircle2, EyeOff as EyeOffIcon,
} from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
  onSwitchToEditor: () => void;
}

function buildAllTemplates(customConfigs: CustomTemplateConfig[]): AnyTemplate[] {
  const builtIn: AnyTemplate[] = BUILT_IN_TEMPLATES.map(t => ({ ...t, isCustom: false as const }));
  const custom: CustomTemplateEntry[] = customConfigs.map(cfg => ({
    id: cfg.id, name: cfg.name, description: cfg.description || 'Custom template',
    previewColor: 'from-violet-500 to-purple-600', isCustom: true as const, config: cfg,
  }));
  return [...builtIn, ...custom];
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function AdminPage({ user, onLogout, onSwitchToEditor }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [customTemplateConfigs, setCustomTemplateConfigs] = useState<CustomTemplateConfig[]>([]);

  // Load data on mount
  useEffect(() => {
    getUsers().then(u => setUsers(u));
    getCustomTemplates().then(t => setCustomTemplateConfigs(t));
  }, []);
  const [activeTab, setActiveTab] = useState<'users' | 'templates' | 'security'>('users');
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);

  // Add User modal
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newTemplate, setNewTemplate] = useState<TemplateId>('elegant-dark');

  // Template builder
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CustomTemplateConfig | undefined>(undefined);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  // Admin password change
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passSaving, setPassSaving] = useState(false);

  const allTemplates = buildAllTemplates(customTemplateConfigs);
  const refreshUsers = useCallback(() => { getUsers().then(u => setUsers(u)); }, []);
  const refreshCustomTemplates = useCallback(() => { getCustomTemplates().then(t => setCustomTemplateConfigs(t)); }, []);

  const handleAssignTemplate = useCallback((userId: string, templateId: TemplateId) => {
    updateUserTemplate(userId, templateId);
    refreshUsers();
  }, [refreshUsers]);

  const handleAddUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newDisplayName) return;
    await addUser(newUsername, newPassword, newDisplayName, newTemplate);
    refreshUsers();
    setShowAddUser(false);
    setNewUsername(''); setNewPassword(''); setNewDisplayName(''); setNewTemplate('elegant-dark');
  }, [newUsername, newPassword, newDisplayName, newTemplate, refreshUsers]);

  const handleDeleteUser = useCallback((userId: string) => {
    if (confirm('Delete this user?')) { deleteUser(userId); refreshUsers(); }
  }, [refreshUsers]);

  const handleDeleteTemplate = useCallback((id: string) => {
    if (confirm('Delete this custom template?')) { deleteCustomTemplate(id); refreshCustomTemplates(); }
  }, [refreshCustomTemplates]);

  const handleEditTemplate = useCallback((cfg: CustomTemplateConfig) => {
    setEditingConfig(cfg); setShowBuilder(true);
  }, []);

  const handleBuilderSaved = useCallback(() => {
    setShowBuilder(false); setEditingConfig(undefined); refreshCustomTemplates();
  }, [refreshCustomTemplates]);

  // Password change handler
  const handleChangeAdminPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSaving(true);
    const error = await changeAdminPassword(user.id, currentPass, newPass, confirmPass);
    setPassSaving(false);
    if (error) {
      setPassMsg({ type: 'error', text: error });
    } else {
      setPassMsg({ type: 'success', text: 'Password updated successfully! Use your new password next time you log in.' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
    setTimeout(() => setPassMsg(null), 5000);
  }, [user.id, currentPass, newPass, confirmPass]);

  // Password strength calculator
  const getPasswordStrength = (p: string): { label: string; color: string; width: string; score: number } => {
    if (!p) return { label: '', color: '', width: '0%', score: 0 };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '20%', score };
    if (score === 2) return { label: 'Fair', color: '#f97316', width: '40%', score };
    if (score === 3) return { label: 'Good', color: '#eab308', width: '65%', score };
    if (score === 4) return { label: 'Strong', color: '#22c55e', width: '85%', score };
    return { label: 'Very Strong', color: '#10b981', width: '100%', score };
  };

  const strength = getPasswordStrength(newPass);

  const clientUsers = users.filter(u => u.role === 'client');
  // historyUser reserved for future detail panel
  const historyEntries = historyUserId ? getUserActivity(historyUserId) : [];

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">CardCraft</h1>
              <p className="text-xs text-gray-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onSwitchToEditor} className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors">
              My Editor <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors">
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-fit mb-5 sm:mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Users className="w-4 h-4" /> Manage Users
          </button>
          <button onClick={() => setActiveTab('templates')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'templates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <LayoutGrid className="w-4 h-4" /> Templates
            {customTemplateConfigs.length > 0 && (
              <span className="bg-violet-100 text-violet-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">{customTemplateConfigs.length}</span>
            )}
          </button>
          <button onClick={() => setActiveTab('security')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Lock className="w-4 h-4" /> Security
          </button>
        </div>

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Client Users ({clientUsers.length})</h2>
              <button onClick={() => setShowAddUser(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-sm">
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {clientUsers.map(u => {
                const tpl = allTemplates.find(t => t.id === u.assignedTemplate);
                const isCustomTpl = tpl && 'isCustom' in tpl && tpl.isCustom;
                const lastActivity = u.activity?.[0];
                return (
                  <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{u.displayName}</h3>
                        <p className="text-sm text-gray-500">@{u.username}</p>
                        {lastActivity && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lastActivity.type === 'download' ? '↓' : lastActivity.type === 'edit' ? '✎' : '→'} {timeAgo(lastActivity.timestamp)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setHistoryUserId(historyUserId === u.id ? null : u.id)}
                          className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View activity"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1.5">Assigned Template</p>
                      <div className="relative">
                        <select
                          value={u.assignedTemplate}
                          onChange={e => handleAssignTemplate(u.id, e.target.value as TemplateId)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        >
                          <optgroup label="Built-in Templates">
                            {BUILT_IN_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </optgroup>
                          {customTemplateConfigs.length > 0 && (
                            <optgroup label="Custom Templates">
                              {customTemplateConfigs.map(t => <option key={t.id} value={t.id}>✦ {t.name}</option>)}
                            </optgroup>
                          )}
                        </select>
                        {isCustomTpl && <span className="absolute right-8 top-1/2 -translate-y-1/2 text-violet-500"><Wand2 className="w-3.5 h-3.5" /></span>}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Current Product</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{u.productData.productName}</p>
                      <p className="text-sm text-purple-600 font-semibold">{u.productData.price}</p>
                    </div>

                    {/* Activity history panel */}
                    {historyUserId === u.id && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" /> Activity History
                        </p>
                        {historyEntries.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No activity yet</p>
                        ) : (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {historyEntries.slice(0, 15).map((entry, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                  entry.type === 'download' ? 'bg-green-100 text-green-600' :
                                  entry.type === 'edit' ? 'bg-blue-100 text-blue-600' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {entry.type === 'download' ? <Download className="w-2.5 h-2.5" /> :
                                   entry.type === 'edit' ? <Edit3 className="w-2.5 h-2.5" /> :
                                   <LoginIcon className="w-2.5 h-2.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-gray-700 capitalize font-medium">{entry.type}</span>
                                  {entry.detail && <span className="text-gray-400 ml-1 truncate">— {entry.detail}</span>}
                                </div>
                                <span className="text-gray-400 shrink-0">{timeAgo(entry.timestamp)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {clientUsers.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No clients yet</p>
                <p className="text-sm mt-1">Add your first client to get started</p>
              </div>
            )}
          </div>
        )}

        {/* ── TEMPLATES TAB ── */}
        {activeTab === 'templates' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Custom Templates</h2>
                <p className="text-sm text-gray-500">Create your own fully customized card designs</p>
              </div>
              <button
                onClick={() => { setEditingConfig(undefined); setShowBuilder(true); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-sm"
              >
                <Wand2 className="w-4 h-4" /> Create Template
              </button>
            </div>

            {customTemplateConfigs.length === 0 ? (
              <div
                className="border-2 border-dashed border-violet-200 rounded-2xl p-10 text-center mb-8 cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-all group"
                onClick={() => { setEditingConfig(undefined); setShowBuilder(true); }}
              >
                <div className="w-14 h-14 bg-violet-100 group-hover:bg-violet-200 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors">
                  <Wand2 className="w-7 h-7 text-violet-500" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">No custom templates yet</h3>
                <p className="text-sm text-gray-500 mb-4">Click <strong>Create Template</strong> to design your first custom card layout.</p>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium">
                  <Plus className="w-4 h-4" /> Get Started
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {customTemplateConfigs.map(cfg => (
                  <div key={cfg.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-20 w-full flex items-center justify-center relative" style={{ background: cfg.useGradientBg ? `linear-gradient(135deg, ${cfg.bgColor}, ${cfg.bgColor2})` : cfg.bgColor }}>
                      <Wand2 className="w-7 h-7 text-white/60 drop-shadow" />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: cfg.accentColor, color: cfg.btnTextColor }}>{cfg.layout}</div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 leading-tight">{cfg.name}</h3>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button onClick={() => handleEditTemplate(cfg)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setPreviewTemplate(previewTemplate === cfg.id ? null : cfg.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            {previewTemplate === cfg.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleDeleteTemplate(cfg.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{cfg.description || 'No description'}</p>
                      <div className="flex items-center gap-1.5 mb-3">
                        {[cfg.bgColor, cfg.accentColor, cfg.priceColor, cfg.btnBgColor].map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
                        ))}
                        <span className="text-xs text-gray-400 ml-1 capitalize">{cfg.layout.replace('-', ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{users.filter(u => u.assignedTemplate === cfg.id).length} user(s) assigned</span>
                        <span>{new Date(cfg.createdAt).toLocaleDateString()}</span>
                      </div>
                      {previewTemplate === cfg.id && (
                        <div className="mt-4 bg-gray-50 rounded-xl p-3 flex justify-center overflow-hidden">
                          <div className="transform scale-[0.48] origin-top">
                            <TemplateRenderer templateId={cfg.id} data={user.productData} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Built-in templates */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1"><Star className="w-3 h-3" /> Built-in Templates</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {BUILT_IN_TEMPLATES.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`h-20 rounded-lg bg-gradient-to-r ${t.previewColor} mb-4 flex items-center justify-center`}>
                    <Palette className="w-7 h-7 text-white/80 drop-shadow-sm" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 text-xs">{t.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{users.filter(u => u.assignedTemplate === t.id && u.role === 'client').length} user(s)</span>
                    <button onClick={() => setPreviewTemplate(previewTemplate === t.id ? null : t.id)} className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                      {previewTemplate === t.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {previewTemplate === t.id ? 'Hide' : 'Preview'}
                    </button>
                  </div>
                  {previewTemplate === t.id && (
                    <div className="mt-4 bg-gray-50 rounded-xl p-3 flex justify-center overflow-hidden">
                      <div className="transform scale-[0.48] origin-top">
                        <TemplateRenderer templateId={t.id} data={user.productData} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

        {/* ── SECURITY TAB ── */}
        {activeTab === 'security' && (
          <div className="max-w-xl">
            {/* Admin profile card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">{user.displayName}</p>
                  <p className="text-violet-200 text-sm">@{user.username}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-white/80 bg-white/10 px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" /> Administrator
                  </span>
                </div>
              </div>
              <div className="px-6 py-4 flex items-center gap-3 bg-amber-50 border-b border-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  Your admin password is <strong>not visible</strong> in the demo account list on the login page. Keep it secure.
                </p>
              </div>
            </div>

            {/* Password change form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-5 h-5 text-violet-600" />
                <h3 className="text-base font-bold text-gray-900">Change Admin Password</h3>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                Choose a strong password with at least 6 characters, a mix of letters, numbers, and symbols.
              </p>

              <form onSubmit={handleChangeAdminPassword} className="space-y-4" autoComplete="off">
                {/* Current password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPass}
                      onChange={e => setCurrentPass(e.target.value)}
                      autoComplete="current-password"
                      required
                      placeholder="Enter your current password"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-11 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <button type="button" onClick={() => setShowCurrentPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showCurrentPass ? <EyeOffIcon className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                      autoComplete="new-password"
                      required
                      placeholder="At least 6 characters"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-11 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <button type="button" onClick={() => setShowNewPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showNewPass ? <EyeOffIcon className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {newPass.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: strength.width, background: strength.color }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium" style={{ color: strength.color }}>{strength.label}</span>
                        <span className="text-gray-400">
                          {strength.score < 3 ? 'Add uppercase, numbers & symbols to strengthen' : 'Looking good!'}
                        </span>
                      </div>
                      {/* Requirements checklist */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1.5">
                        {[
                          { label: '6+ characters', met: newPass.length >= 6 },
                          { label: 'Uppercase letter', met: /[A-Z]/.test(newPass) },
                          { label: 'Number', met: /[0-9]/.test(newPass) },
                          { label: 'Special character', met: /[^A-Za-z0-9]/.test(newPass) },
                        ].map(req => (
                          <div key={req.label} className={`flex items-center gap-1 text-xs ${req.met ? 'text-green-600' : 'text-gray-400'}`}>
                            {req.met
                              ? <Check className="w-3 h-3 shrink-0" />
                              : <div className="w-3 h-3 shrink-0 rounded-full border border-gray-300" />}
                            {req.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm new password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPass}
                      onChange={e => setConfirmPass(e.target.value)}
                      autoComplete="new-password"
                      required
                      placeholder="Re-enter new password"
                      className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                        confirmPass && confirmPass !== newPass
                          ? 'border-red-300 focus:ring-red-300'
                          : confirmPass && confirmPass === newPass
                          ? 'border-green-300 focus:ring-green-300'
                          : 'border-gray-200 focus:ring-violet-500'
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirmPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showConfirmPass ? <EyeOffIcon className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {confirmPass && confirmPass === newPass && (
                      <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {confirmPass && confirmPass !== newPass && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Passwords do not match
                    </p>
                  )}
                </div>

                {/* Status message */}
                {passMsg && (
                  <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm ${
                    passMsg.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {passMsg.type === 'success'
                      ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                      : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />}
                    {passMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passSaving || !currentPass || !newPass || !confirmPass}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-violet-500 hover:to-purple-500 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  {passSaving ? 'Updating Password...' : 'Update Admin Password'}
                </button>
              </form>
            </div>

            {/* Tips card */}
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Security Tips</p>
                <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
                  <li>Never share your admin password with clients</li>
                  <li>Use a unique password not used elsewhere</li>
                  <li>Change it regularly, especially after sharing access</li>
                  <li>The admin login button is hidden from the client login page</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Add New Client</h3>
              <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddUser} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input type="text" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="e.g., My Coffee Shop" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="login username" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="initial password" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Template</label>
                <select value={newTemplate} onChange={e => setNewTemplate(e.target.value as TemplateId)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                  <optgroup label="Built-in Templates">
                    {BUILT_IN_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </optgroup>
                  {customTemplateConfigs.length > 0 && (
                    <optgroup label="Custom Templates">
                      {customTemplateConfigs.map(t => <option key={t.id} value={t.id}>✦ {t.name}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-violet-500 hover:to-purple-500">Add Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Builder Modal */}
      {showBuilder && (
        <TemplateBuilder
          onClose={() => { setShowBuilder(false); setEditingConfig(undefined); }}
          onSaved={handleBuilderSaved}
          editConfig={editingConfig}
        />
      )}
    </div>
  );
}
