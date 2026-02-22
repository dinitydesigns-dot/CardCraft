import { useState, useCallback } from 'react';
import {
  CustomTemplateConfig,
  DEFAULT_CUSTOM_CONFIG,
  LayoutStyle,
  DEFAULT_PRODUCT_DATA,
} from '../types';
import { saveCustomTemplate } from '../store';
import { CustomTemplate } from './templates/CustomTemplate';
import {
  X,
  Check,
  Palette,
  Layout,
  Sliders,
  Eye,
  ChevronRight,
  ChevronLeft,
  Wand2,
  RotateCcw,
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editConfig?: CustomTemplateConfig;
}

// ─── Layout option cards ───────────────────────────────────────────────────────
const LAYOUT_OPTIONS: { id: LayoutStyle; label: string; desc: string; icon: string }[] = [
  {
    id: 'classic',
    label: 'Classic',
    desc: 'Image on top, content below',
    icon: '⬛\n⬜',
  },
  {
    id: 'card-float',
    label: 'Card Float',
    desc: 'Content on floating card',
    icon: '⬛\n🃏',
  },
  {
    id: 'side-accent',
    label: 'Side Accent',
    desc: 'Bold left color strip',
    icon: '▌⬛',
  },
  {
    id: 'full-bleed',
    label: 'Full Bleed',
    desc: 'Image fills background',
    icon: '🖼️',
  },
  {
    id: 'banner',
    label: 'Banner',
    desc: 'Wide banner title bar',
    icon: '══\n⬛',
  },
];

// ─── Colour presets ────────────────────────────────────────────────────────────
const COLOR_PRESETS: { name: string; config: Partial<CustomTemplateConfig> }[] = [
  {
    name: 'Midnight',
    config: {
      bgColor: '#0f172a', bgColor2: '#1e1b4b', accentColor: '#818cf8',
      textColor: '#f1f5f9', subTextColor: '#94a3b8', priceColor: '#fbbf24',
      btnBgColor: '#6366f1', btnTextColor: '#ffffff', useGradientBg: true,
    },
  },
  {
    name: 'Forest',
    config: {
      bgColor: '#064e3b', bgColor2: '#065f46', accentColor: '#34d399',
      textColor: '#ecfdf5', subTextColor: '#6ee7b7', priceColor: '#fef08a',
      btnBgColor: '#10b981', btnTextColor: '#ffffff', useGradientBg: true,
    },
  },
  {
    name: 'Blush',
    config: {
      bgColor: '#fce7f3', bgColor2: '#ede9fe', accentColor: '#ec4899',
      textColor: '#1f2937', subTextColor: '#6b7280', priceColor: '#db2777',
      btnBgColor: '#ec4899', btnTextColor: '#ffffff', useGradientBg: true,
    },
  },
  {
    name: 'Sunset',
    config: {
      bgColor: '#92400e', bgColor2: '#7c3aed', accentColor: '#f59e0b',
      textColor: '#fffbeb', subTextColor: '#fde68a', priceColor: '#fcd34d',
      btnBgColor: '#f97316', btnTextColor: '#ffffff', useGradientBg: true,
    },
  },
  {
    name: 'Ocean',
    config: {
      bgColor: '#0c4a6e', bgColor2: '#0e7490', accentColor: '#38bdf8',
      textColor: '#f0f9ff', subTextColor: '#bae6fd', priceColor: '#fde68a',
      btnBgColor: '#0284c7', btnTextColor: '#ffffff', useGradientBg: true,
    },
  },
  {
    name: 'Clean',
    config: {
      bgColor: '#ffffff', bgColor2: '#f9fafb', accentColor: '#6366f1',
      textColor: '#111827', subTextColor: '#6b7280', priceColor: '#4f46e5',
      btnBgColor: '#4f46e5', btnTextColor: '#ffffff', useGradientBg: false,
    },
  },
  {
    name: 'Gold',
    config: {
      bgColor: '#1c1917', bgColor2: '#292524', accentColor: '#f59e0b',
      textColor: '#fef3c7', subTextColor: '#d97706', priceColor: '#fbbf24',
      btnBgColor: '#b45309', btnTextColor: '#fef3c7', useGradientBg: true,
    },
  },
  {
    name: 'Rose',
    config: {
      bgColor: '#881337', bgColor2: '#9f1239', accentColor: '#fb7185',
      textColor: '#fff1f2', subTextColor: '#fda4af', priceColor: '#fbbf24',
      btnBgColor: '#f43f5e', btnTextColor: '#ffffff', useGradientBg: true,
    },
  },
];

type Step = 'info' | 'layout' | 'colors' | 'preview';

const STEPS: Step[] = ['info', 'layout', 'colors', 'preview'];

function StepIndicator({ current }: { current: Step }) {
  const labels: Record<Step, string> = {
    info: 'Name & Info',
    layout: 'Layout',
    colors: 'Colors',
    preview: 'Preview',
  };
  const icons: Record<Step, React.ReactNode> = {
    info: <Sliders className="w-3.5 h-3.5" />,
    layout: <Layout className="w-3.5 h-3.5" />,
    colors: <Palette className="w-3.5 h-3.5" />,
    preview: <Eye className="w-3.5 h-3.5" />,
  };

  return (
    <div className="flex items-center gap-1 px-5 py-3 bg-gray-50 border-b border-gray-100">
      {STEPS.map((step, idx) => {
        const isActive = step === current;
        const isDone = STEPS.indexOf(current) > idx;
        return (
          <div key={step} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm'
                  : isDone
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isDone ? <Check className="w-3 h-3" /> : icons[step]}
              <span className="hidden sm:inline">{labels[step]}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-4 h-px mx-0.5 ${isDone ? 'bg-violet-300' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Color picker row ──────────────────────────────────────────────────────────
function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-600">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-mono uppercase">{value}</span>
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function TemplateBuilder({ onClose, onSaved, editConfig }: Props) {
  const [step, setStep] = useState<Step>('info');
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<CustomTemplateConfig>(() => {
    if (editConfig) return { ...editConfig };
    return {
      id: `custom_${Date.now()}`,
      name: '',
      description: '',
      createdAt: Date.now(),
      ...DEFAULT_CUSTOM_CONFIG,
    };
  });

  const update = useCallback(<K extends keyof CustomTemplateConfig>(key: K, value: CustomTemplateConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyPreset = useCallback((preset: Partial<CustomTemplateConfig>) => {
    setConfig((prev) => ({ ...prev, ...preset }));
  }, []);

  const stepIndex = STEPS.indexOf(step);

  const canGoNext = () => {
    if (step === 'info') return config.name.trim().length >= 2;
    return true;
  };

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1]);
  };
  const goBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  };

  const handleSave = () => {
    setSaving(true);
    const finalConfig: CustomTemplateConfig = {
      ...config,
      name: config.name.trim(),
      description: config.description.trim(),
    };
    saveCustomTemplate(finalConfig);
    setTimeout(() => {
      setSaving(false);
      onSaved();
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {editConfig ? 'Edit Template' : 'Create New Template'}
              </h2>
              <p className="text-xs text-gray-500">Design a custom product card layout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className={`flex flex-col lg:flex-row h-full`}>

            {/* ── Left: Controls ─────────────────────────────────────────── */}
            <div className="lg:w-[420px] shrink-0 p-5 lg:border-r border-gray-100 space-y-5">

              {/* STEP: Info */}
              {step === 'info' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Template Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="e.g., Bakery Special, Summer Sale..."
                      maxLength={40}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">{config.name.length}/40 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={config.description}
                      onChange={(e) => update('description', e.target.value)}
                      placeholder="Brief description of when to use this template..."
                      rows={3}
                      maxLength={120}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">{config.description.length}/120 characters</p>
                  </div>

                  <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                    <h4 className="text-sm font-semibold text-violet-800 mb-1 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      Quick Start Tips
                    </h4>
                    <ul className="text-xs text-violet-700 space-y-1 list-disc list-inside">
                      <li>Give your template a clear, descriptive name</li>
                      <li>Choose a layout on the next step</li>
                      <li>Pick a color preset or mix your own colors</li>
                      <li>Preview before saving</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* STEP: Layout */}
              {step === 'layout' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <p className="text-sm text-gray-500">Choose how content and image are arranged on the card:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {LAYOUT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => update('layout', opt.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          config.layout === opt.id
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                            config.layout === opt.id ? 'bg-violet-100' : 'bg-white border border-gray-200'
                          }`}
                        >
                          {opt.icon.split('\n').map((line, i) => (
                            <span key={i} className="text-base leading-none">{line}</span>
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold ${config.layout === opt.id ? 'text-violet-700' : 'text-gray-800'}`}>
                              {opt.label}
                            </span>
                            {config.layout === opt.id && (
                              <Check className="w-4 h-4 text-violet-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP: Colors */}
              {step === 'colors' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Presets */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Color Presets</p>
                    <div className="grid grid-cols-4 gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => applyPreset(preset.config)}
                          title={preset.name}
                          className="group flex flex-col items-center gap-1"
                        >
                          <div
                            className="w-full h-10 rounded-lg border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
                            style={{
                              background: preset.config.useGradientBg
                                ? `linear-gradient(135deg, ${preset.config.bgColor}, ${preset.config.bgColor2})`
                                : preset.config.bgColor,
                              outline: '2px solid transparent',
                            }}
                          />
                          <span className="text-[10px] text-gray-500 font-medium">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100" />

                  {/* Color pickers */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Custom Colors</p>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Gradient Background</span>
                      <button
                        onClick={() => update('useGradientBg', !config.useGradientBg)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${config.useGradientBg ? 'bg-violet-500' : 'bg-gray-200'}`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                            config.useGradientBg ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <ColorRow label="Background" value={config.bgColor} onChange={(v) => update('bgColor', v)} />
                    {config.useGradientBg && (
                      <ColorRow label="Background 2 (gradient)" value={config.bgColor2} onChange={(v) => update('bgColor2', v)} />
                    )}
                    <ColorRow label="Accent / Highlights" value={config.accentColor} onChange={(v) => update('accentColor', v)} />
                    <ColorRow label="Heading Text" value={config.textColor} onChange={(v) => update('textColor', v)} />
                    <ColorRow label="Body Text" value={config.subTextColor} onChange={(v) => update('subTextColor', v)} />
                    <ColorRow label="Price Color" value={config.priceColor} onChange={(v) => update('priceColor', v)} />
                    <ColorRow label="Button Background" value={config.btnBgColor} onChange={(v) => update('btnBgColor', v)} />
                    <ColorRow label="Button Text" value={config.btnTextColor} onChange={(v) => update('btnTextColor', v)} />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100" />

                  {/* Style options */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Style Options</p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rounded Image</span>
                      <button
                        onClick={() => update('imageRounded', !config.imageRounded)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${config.imageRounded ? 'bg-violet-500' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${config.imageRounded ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Show Accent Bar</span>
                      <button
                        onClick={() => update('showAccentBar', !config.showAccentBar)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${config.showAccentBar ? 'bg-violet-500' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${config.showAccentBar ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    {(config.layout === 'card-float') && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1.5">Card Style</p>
                        <div className="flex gap-2">
                          {(['flat', 'raised', 'glass'] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => update('cardStyle', s)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                                config.cardStyle === s
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reset button */}
                  <button
                    onClick={() => applyPreset(DEFAULT_CUSTOM_CONFIG)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to defaults
                  </button>
                </div>
              )}

              {/* STEP: Preview */}
              {step === 'preview' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Ready to Save
                    </h4>
                    <p className="text-xs text-green-700">
                      Review your template in the live preview on the right. When you're happy, click <strong>Save Template</strong>.
                    </p>
                  </div>

                  <div className="border border-gray-100 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Name</span>
                      <span className="font-semibold text-gray-800">{config.name || '(unnamed)'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Layout</span>
                      <span className="font-semibold text-gray-800 capitalize">{config.layout.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Background</span>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-sm border border-gray-200"
                          style={{ background: config.useGradientBg ? `linear-gradient(135deg, ${config.bgColor}, ${config.bgColor2})` : config.bgColor }}
                        />
                        <span className="text-xs text-gray-500 font-mono">{config.bgColor}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Accent</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-sm border border-gray-200" style={{ background: config.accentColor }} />
                        <span className="text-xs text-gray-500 font-mono">{config.accentColor}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving || !config.name.trim()}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:from-violet-500 hover:to-purple-500 transition-all shadow-md disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              )}
            </div>

            {/* ── Right: Live Preview ─────────────────────────────────────── */}
            <div className="flex-1 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 p-6 flex flex-col items-center justify-start gap-4 min-h-[360px] lg:min-h-0">
              <div className="flex items-center gap-2 self-start">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Live Preview</span>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>

              <div className="transform scale-[0.65] sm:scale-75 lg:scale-[0.82] origin-top transition-transform">
                <CustomTemplate config={config} data={DEFAULT_PRODUCT_DATA} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={goBack}
            disabled={stepIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <span className="text-xs text-gray-400">
            Step {stepIndex + 1} of {STEPS.length}
          </span>

          {step !== 'preview' ? (
            <button
              onClick={goNext}
              disabled={!canGoNext()}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-violet-500 hover:to-purple-500 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || !config.name.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-violet-500 hover:to-purple-500 transition-all shadow-sm disabled:opacity-40"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
