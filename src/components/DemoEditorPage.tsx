import { useState, useRef, useCallback, useEffect } from 'react';
import {
  DemoSession, ProductData, DEMO_TEMPLATES, DEMO_MAX_TRIES,
  CARD_SIZES, FONTS, CardFont, BgPattern, BG_PATTERNS, BADGE_OPTIONS, BadgeLabel,
} from '../types';
import {
  useDemoTry, updateDemoProductData, cycleDemoTemplate, getDemoTriesLeft,
} from '../store';
import { TemplateRenderer } from './templates/TemplateRenderer';
import { DemoBanner } from './DemoBanner';
import { DemoExpiredModal } from './DemoExpiredModal';
import { toPng } from 'html-to-image';
import {
  Download, Image as ImageIcon, Type, DollarSign, FileText, Phone,
  MousePointerClick, Sparkles, X, Check, Loader2, Layers, Tag,
  Plus, Maximize2, Lock, BadgeCheck, Info, Eye,
} from 'lucide-react';

interface Props {
  session: DemoSession;
  onSessionUpdate: (s: DemoSession) => void;
  onExitDemo: () => void;
  onSignIn: () => void;
}

type Tab = 'product' | 'design';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{children}</p>;
}

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@400;600;700;900&family=Poppins:wght@400;600;700;900&family=Raleway:wght@400;600;700;900&family=Oswald:wght@400;600;700&display=swap';

export function DemoEditorPage({ session, onSessionUpdate, onExitDemo, onSignIn }: Props) {
  const [productData, setProductData] = useState<ProductData>(session.productData);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('product');
  const [showExpiredModal, setShowExpiredModal] = useState(session.expired);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const triesLeft = getDemoTriesLeft(session);
  const currentTemplateId = DEMO_TEMPLATES[session.currentTemplateIndex];

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (session.expired) setShowExpiredModal(true);
  }, [session.expired]);

  const updateField = useCallback(<K extends keyof ProductData>(field: K, value: ProductData[K]) => {
    setProductData(prev => {
      const updated = { ...prev, [field]: value };
      const newSession = updateDemoProductData(session, updated);
      onSessionUpdate(newSession);
      return updated;
    });
  }, [session, onSessionUpdate]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, isExtra = false, idx = -1) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      if (isExtra) {
        if (idx >= 0) {
          const next = [...productData.extraImages]; next[idx] = url;
          updateField('extraImages', next);
        } else {
          updateField('extraImages', [...productData.extraImages, url]);
        }
      } else {
        updateField('imageUrl', url);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [productData.extraImages, updateField]);

  const removeExtraImage = useCallback((idx: number) => {
    const next = [...productData.extraImages];
    next.splice(idx, 1);
    updateField('extraImages', next);
  }, [productData.extraImages, updateField]);

  const handleDownload = useCallback(async () => {
    if (session.expired) { setShowExpiredModal(true); return; }
    if (triesLeft <= 0) { setShowExpiredModal(true); return; }

    setDownloading(true);
    try {
      if (!cardRef.current) throw new Error('No card');
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `${productData.productName.replace(/\s+/g, '_')}_card_demo.png`;
      link.href = dataUrl; link.click();

      const updated = useDemoTry(session);
      onSessionUpdate(updated);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);

      if (updated.expired) setTimeout(() => setShowExpiredModal(true), 1000);
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [session, triesLeft, productData.productName, onSessionUpdate]);

  const handleCycleTemplate = useCallback(() => {
    const updated = cycleDemoTemplate(session);
    onSessionUpdate(updated);
  }, [session, onSessionUpdate]);

  const { width, height } = CARD_SIZES[productData.cardSize ?? 'square'];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'product', label: 'Product', icon: <Type className="w-4 h-4" /> },
    { id: 'design', label: 'Design', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Demo Banner */}
      <DemoBanner
        triesUsed={session.triesUsed}
        currentTemplateIndex={session.currentTemplateIndex}
        onExit={onExitDemo}
        onCycleTemplate={handleCycleTemplate}
        onRequestUpgrade={() => setShowExpiredModal(true)}
      />

      {/* Expired modal */}
      {showExpiredModal && (
        <DemoExpiredModal
          onSignIn={onSignIn}
          onClose={() => setShowExpiredModal(false)}
        />
      )}

      {/* Sub-header */}
      <header className="bg-white border-b border-gray-200 sticky top-[44px] z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-13 flex items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 leading-none">CardCraft Demo</h1>
              <p className="text-[10px] text-gray-400 font-medium truncate">
                {triesLeft} of {DEMO_MAX_TRIES} downloads left
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile preview toggle */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`lg:hidden flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${showPreview ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'
                }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{showPreview ? 'Edit' : 'Preview'}</span>
            </button>

            {/* Tries badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${triesLeft > 1 ? 'bg-green-50 text-green-700 border border-green-200'
              : triesLeft === 1 ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
              {triesLeft} {triesLeft === 1 ? 'try' : 'tries'} left
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading || session.expired}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-[0.97] ${session.expired ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : downloadSuccess ? 'bg-green-500 text-white'
                  : triesLeft <= 1 ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white'
                }`}
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" />
                : downloadSuccess ? <Check className="w-4 h-4" />
                  : session.expired ? <Lock className="w-4 h-4" />
                    : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {downloading ? 'Saving…' : downloadSuccess ? 'Saved!' : session.expired ? 'Locked' : 'Download'}
              </span>
            </button>

            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-gray-900 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">

          {/* ── Editor Panel ── */}
          <div className={`lg:w-[380px] shrink-0 ${showPreview ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden lg:sticky lg:top-28">

              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[11px] font-medium transition-all ${activeTab === tab.id
                      ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50/40'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
                {/* Locked tabs */}
                {(['Logo', 'Export', 'Account'] as const).map(name => (
                  <button
                    key={name}
                    onClick={() => setShowExpiredModal(true)}
                    className="flex-1 flex flex-col items-center gap-0.5 py-3 text-[11px] text-gray-300 hover:bg-gray-50 transition-all relative group"
                    title="Sign in to unlock"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {name}
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>

              <div className="max-h-[calc(100dvh-260px)] overflow-y-auto overscroll-contain">

                {/* ── PRODUCT TAB ── */}
                {activeTab === 'product' && (
                  <div className="p-4 space-y-4">
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-violet-700 leading-relaxed">
                        <strong>Demo:</strong> Edit freely, download up to {DEMO_MAX_TRIES} cards.
                      </p>
                    </div>

                    {/* Main image */}
                    <div>
                      <SectionLabel>Product Image</SectionLabel>
                      {productData.imageUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                          <img src={productData.imageUrl} alt="Product" className="w-full h-32 object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <label className="cursor-pointer bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                                Replace
                                <input type="file" accept="image/*" onChange={e => handleImageUpload(e)} className="hidden" />
                              </label>
                              <button onClick={() => updateField('imageUrl', '')} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1">
                                <X className="w-3 h-3" /> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-200 hover:border-violet-400 hover:bg-violet-50/50 rounded-xl cursor-pointer transition-all group">
                          <ImageIcon className="w-7 h-7 mb-1.5 text-gray-300 group-hover:text-violet-400 transition-colors" />
                          <span className="text-sm font-medium text-gray-500">Tap to upload</span>
                          <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
                          <input type="file" accept="image/*" onChange={e => handleImageUpload(e)} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* Extra images */}
                    <div>
                      <SectionLabel>Additional Images ({productData.extraImages.length}/3)</SectionLabel>
                      <div className="grid grid-cols-4 gap-2">
                        {productData.extraImages.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                            <img src={img} alt={`Extra ${i + 1}`} className="w-full h-full object-cover" />
                            <button onClick={() => removeExtraImage(i)} className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {productData.extraImages.length < 3 && (
                          <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-violet-400 flex items-center justify-center cursor-pointer transition-all">
                            <Plus className="w-4 h-4 text-gray-400" />
                            <input type="file" accept="image/*" onChange={e => handleImageUpload(e, true)} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Text fields */}
                    {([
                      { field: 'productName' as const, label: 'Product Name', icon: <Type className="w-4 h-4" />, placeholder: 'Enter product name', inputMode: 'text' },
                      { field: 'price' as const, label: 'Price', icon: <DollarSign className="w-4 h-4" />, placeholder: '$0.00', inputMode: 'text' },
                      { field: 'contactNumber' as const, label: 'WhatsApp / Contact', icon: <Phone className="w-4 h-4" />, placeholder: '+2349167842902', inputMode: 'tel' },
                      { field: 'ctaText' as const, label: 'Button Text', icon: <MousePointerClick className="w-4 h-4" />, placeholder: 'Order Now', inputMode: 'text' },
                    ] as const).map(({ field, label, icon, placeholder, inputMode }) => (
                      <div key={field}>
                        <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 text-gray-700">
                          <span className="text-gray-400">{icon}</span>{label}
                        </label>
                        <input
                          type="text"
                          inputMode={inputMode as React.HTMLAttributes<HTMLInputElement>['inputMode']}
                          value={productData[field] as string}
                          onChange={e => updateField(field, e.target.value)}
                          placeholder={placeholder}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
                        />
                      </div>
                    ))}

                    {/* Description */}
                    <div>
                      <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 text-gray-700">
                        <FileText className="w-4 h-4 text-gray-400" />Short Description
                      </label>
                      <textarea
                        value={productData.description}
                        onChange={e => updateField('description', e.target.value)}
                        placeholder="Describe your product..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* ── DESIGN TAB ── */}
                {activeTab === 'design' && (
                  <div className="p-4 space-y-5">
                    {/* Badge */}
                    <div>
                      <SectionLabel>Sticker Badge</SectionLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {BADGE_OPTIONS.map(opt => {
                          const isActive = productData.badge === opt.id;
                          return (
                            <button key={opt.id} onClick={() => updateField('badge', opt.id as BadgeLabel)}
                              className={`px-3 py-2.5 rounded-lg text-xs font-semibold border-2 transition-all text-left ${isActive ? 'border-violet-500 ring-2 ring-violet-200' : 'border-gray-200'}`}
                              style={isActive ? { background: opt.bg, color: opt.color, borderColor: opt.bg } : {}}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Background pattern */}
                    <div>
                      <SectionLabel>Background Pattern</SectionLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {(Object.entries(BG_PATTERNS) as [BgPattern, { label: string; icon: string }][]).map(([id, { label, icon }]) => {
                          const isActive = productData.bgPattern === id;
                          return (
                            <button key={id} onClick={() => updateField('bgPattern', id)}
                              className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${isActive ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-600'}`}
                            >
                              <span className="text-lg font-mono">{icon}</span>
                              <span className="text-xs font-medium">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Font */}
                    <div>
                      <SectionLabel>Card Font</SectionLabel>
                      <div className="space-y-1.5">
                        {(Object.entries(FONTS) as [CardFont, { label: string; family: string }][]).map(([id, { label, family }]) => {
                          const isActive = productData.font === id;
                          return (
                            <button key={id} onClick={() => updateField('font', id)}
                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${isActive ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white'}`}
                            >
                              <span className={`text-sm font-medium ${isActive ? 'text-violet-700' : 'text-gray-700'}`} style={{ fontFamily: family }}>{label}</span>
                              {isActive && <Check className="w-4 h-4 text-violet-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Locked features */}
                    <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <p className="text-sm font-semibold text-amber-800">More in full version</p>
                      </div>
                      <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                        <li>Brand logo overlay</li>
                        <li>Accent color override</li>
                        <li>Multiple card sizes</li>
                        <li>PDF export + share links</li>
                      </ul>
                      <button onClick={() => setShowExpiredModal(true)} className="mt-2.5 text-xs font-semibold text-amber-700 underline underline-offset-2">
                        Unlock all features →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Preview Panel ── */}
          <div className={`flex-1 ${showPreview ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Live Preview
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {productData.badge !== 'none' && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200">
                      <Tag className="w-3 h-3" />{productData.badge}
                    </span>
                  )}
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-200">
                    <BadgeCheck className="w-3 h-3" />
                    {currentTemplateId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 bg-green-50 text-green-700 border border-green-200">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />Live
                  </span>
                </div>
              </div>

              {/* Card preview */}
              <div className="flex items-start justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 rounded-xl overflow-hidden"
                style={{ minHeight: 300, padding: '20px 12px' }}>
                <div style={{ transform: 'scale(var(--card-scale, 0.75))', transformOrigin: 'top center' }}>
                  <style>{`
                    @media (max-width: 400px) { :root { --card-scale: 0.52; } }
                    @media (min-width: 401px) and (max-width: 640px) { :root { --card-scale: 0.68; } }
                    @media (min-width: 641px) and (max-width: 1024px) { :root { --card-scale: 0.82; } }
                    @media (min-width: 1025px) { :root { --card-scale: 1; } }
                  `}</style>
                  <div ref={cardRef}>
                    <TemplateRenderer templateId={currentTemplateId} data={productData} />
                  </div>
                </div>
              </div>

              {/* Info bar */}
              <div className="flex items-center justify-between mt-3 text-xs text-gray-400 flex-wrap gap-2">
                <span className="flex items-center gap-1">
                  <Maximize2 className="w-3 h-3" />
                  {CARD_SIZES[productData.cardSize ?? 'square'].label} — {width}×{height}px
                </span>
                <div className="flex items-center gap-2">
                  {Array.from({ length: DEMO_MAX_TRIES }).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < session.triesUsed ? 'bg-gray-300' : 'bg-violet-400'}`} />
                  ))}
                  <span>{triesLeft} left</span>
                </div>
              </div>

              {/* Download section */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                {session.expired ? (
                  <button
                    onClick={() => setShowExpiredModal(true)}
                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-semibold text-sm"
                  >
                    <Lock className="w-5 h-5" />
                    Downloads locked — Sign in to continue
                  </button>
                ) : (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 ${downloadSuccess ? 'bg-green-500 text-white'
                      : triesLeft === 1 ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                        : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white'
                      }`}
                  >
                    {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : downloadSuccess ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                    <div className="text-left">
                      <p className="font-bold leading-tight">
                        {downloadSuccess ? 'Downloaded!' : downloading ? 'Preparing…' : `Download — Try ${session.triesUsed + 1} of ${DEMO_MAX_TRIES}`}
                      </p>
                      <p className="text-xs opacity-80 font-normal">
                        {triesLeft === 1 ? '⚠️ Last free try!' : `${triesLeft} of ${DEMO_MAX_TRIES} free downloads left`}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
