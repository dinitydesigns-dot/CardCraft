import { useState, useRef, useCallback, useEffect } from 'react';
import { User, ProductData, LogoPosition, LogoSize, CardSize, CardFont, BgPattern, BadgeLabel, CARD_SIZES, FONTS, BG_PATTERNS, BADGE_OPTIONS } from '../types';
import { updateProductData, logActivity, } from '../store';
import { TemplateRenderer } from './templates/TemplateRenderer';
import { toBlob, toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';
import {
  LogOut, Download, Image as ImageIcon, Type, DollarSign, FileText, Phone,
  MousePointerClick, Sparkles, X, Check, Loader2, Palette, BadgeCheck,
  Layers, Share2, Eye, KeyRound, ChevronLeft, ChevronRight, Plus,
  Sun, Moon, Monitor, Copy, ExternalLink, Tag, QrCode, Maximize2,
} from 'lucide-react';

import { changeAdminPassword } from '../store';

const [downloading, setDownloading] = useState(false);



interface Props {
  user: User;
  onLogout: () => void;
}

const LOGO_POSITIONS: { id: LogoPosition; label: string; gridRow: number; gridCol: number }[] = [
  { id: 'top-left', label: 'Top Left', gridRow: 1, gridCol: 1 },
  { id: 'top-center', label: 'Top Center', gridRow: 1, gridCol: 2 },
  { id: 'top-right', label: 'Top Right', gridRow: 1, gridCol: 3 },
  { id: 'bottom-left', label: 'Bottom Left', gridRow: 2, gridCol: 1 },
  { id: 'bottom-right', label: 'Bottom Right', gridRow: 2, gridCol: 3 },
];

const LOGO_SIZES: { id: LogoSize; label: string; desc: string }[] = [
  { id: 'small', label: 'S', desc: 'Small' },
  { id: 'medium', label: 'M', desc: 'Medium' },
  { id: 'large', label: 'L', desc: 'Large' },
];

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@400;600;700;900&family=Poppins:wght@400;600;700;900&family=Raleway:wght@400;600;700;900&family=Oswald:wght@400;600;700&display=swap';

function safeFileName(name: string, ext: 'png' | 'pdf') {
  const base = (name || 'card')
    .trim()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  return `${base}_card.${ext}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // don't revoke immediately (Android can fail if revoked too fast)
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function getExportPixelRatio() {
  return /Android/i.test(navigator.userAgent) ? 1 : 2;
}

type Tab = 'product' | 'logo' | 'design' | 'export' | 'account';
type Theme = 'light' | 'dark' | 'system';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{children}</p>;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-violet-500' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

const [androidDownload, setAndroidDownload] = useState<{ url: string; filename: string } | null>(null);

export function EditorPage({ user, onLogout }: Props) {
  const [productData, setProductData] = useState<ProductData>(user.productData);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState<null | 'png' | 'pdf'>(null);
  const [activeTab, setActiveTab] = useState<Tab>('product');
  const [theme, setTheme] = useState<Theme>('light');
  const [shareUrl, setShareUrl] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [_previewSize, setPreviewSize] = useState<CardSize>(productData.cardSize ?? 'square'); void _previewSize;
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Mobile: show preview panel
  const [showPreview, setShowPreview] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const exportRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.classList.toggle('dark', isDark);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (androidDownload) URL.revokeObjectURL(androidDownload.url);
    };
  }, [androidDownload]);

  const updateField = useCallback(<K extends keyof ProductData>(field: K, value: ProductData[K]) => {
    setProductData(prev => {
      const updated = { ...prev, [field]: value };
      updateProductData(user.id, updated);
      logActivity(user.id, 'edit', field === 'imageUrl' ? 'Updated product image' : `Updated ${field}`);
      return updated;
    });
    setSaved(false);
  }, [user.id]);

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

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Logo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => updateField('logoUrl', ev.target?.result as string);
    reader.readAsDataURL(file);
  }, [updateField]);

  const handleSave = useCallback(() => {
    updateProductData(user.id, productData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [user.id, productData]);

  const getCardBlob = async (): Promise<Blob | null> => {
    const node = exportRef.current ?? cardRef.current; // prefer offscreen export node
    if (!node) return null;

    try {
      // @ts-ignore
      await document.fonts?.ready;

      // wait for images inside the node (helps Android a lot)
      const imgs = Array.from(node.querySelectorAll('img'));
      await Promise.all(imgs.map(img => img.decode?.().catch(() => { }) ?? Promise.resolve()));

      return await toBlob(node, {
        pixelRatio: getExportPixelRatio(),
        cacheBust: true,
        quality: 0.98,
        skipFonts: true, // mobile safety
      });
    } catch (e) {
      console.error('toBlob failed:', e);
      return null;
    }
  };

  const getCardCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const node = exportRef.current ?? cardRef.current;
    if (!node) return null;

    try {
      // @ts-ignore
      await document.fonts?.ready;

      const imgs = Array.from(node.querySelectorAll('img'));
      await Promise.all(imgs.map(img => img.decode?.().catch(() => { }) ?? Promise.resolve()));

      return await toCanvas(node, {
        pixelRatio: getExportPixelRatio(),
        cacheBust: true,
        skipFonts: true,
      });
    } catch (e) {
      console.error('toCanvas failed:', e);
      return null;
    }
  };
  const handleDownloadPNG = useCallback(async () => {
    if (exporting) return;          // prevent double-trigger
    setExporting('png');

    try {
      // ... your existing PNG export code
    } catch (e) {
      console.error(e);
      alert('Download failed. Please try again.');
    } finally {
      setExporting(null);
    }
  }, [exporting, /* keep your other deps */]);

  const handleDownloadPDF = useCallback(async () => {
    if (exporting) return;
    setExporting('pdf');

    try {
      // ... your existing PDF export code
    } catch (e) {
      console.error(e);
      alert('PDF export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  }, [exporting, /* keep your other deps */]);

  const handleGenerateShareLink = useCallback(() => {
    const state = btoa(JSON.stringify({ t: user.assignedTemplate, d: { n: productData.productName, p: productData.price, d: productData.description, c: productData.contactNumber } }));
    const url = `${window.location.origin}?share=${state}`;
    setShareUrl(url);
  }, [user.assignedTemplate, productData]);

  const handleCopyShare = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [shareUrl]);

  const handleChangePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const err = await changeAdminPassword(
      user.id,
      currentPass,
      newPass,
      confirmPass
    );

    if (err) {
      setPassMsg({ type: 'error', text: err });
      return;
    }

    setPassMsg({ type: 'success', text: 'Password changed successfully!' });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassMsg(null), 3000);
  }, [currentPass, newPass, confirmPass, user.id]);
  const isDark = theme === 'dark';
  const previewBg = isDark ? 'from-gray-900 via-gray-800 to-gray-900' : 'from-gray-100 via-gray-50 to-gray-100';

  const tabs: { id: Tab; icon: React.ReactNode; label: string; dot?: boolean }[] = [
    { id: 'product', icon: <Type className="w-4 h-4" />, label: 'Product' },
    { id: 'logo', icon: <BadgeCheck className="w-4 h-4" />, label: 'Logo', dot: !!productData.logoUrl },
    { id: 'design', icon: <Layers className="w-4 h-4" />, label: 'Design' },
    { id: 'export', icon: <Share2 className="w-4 h-4" />, label: 'Export' },
    { id: 'account', icon: <KeyRound className="w-4 h-4" />, label: 'Account' },
  ];

  return (
    <div className={`min-h-dvh ${isDark ? 'bg-gray-950' : 'bg-gray-50'} transition-colors`}>

      {/* ── Header ── */}
      <header className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-50 transition-colors`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-base sm:text-lg font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>CardCraft</h1>
              <p className={`text-[10px] sm:text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[120px] sm:max-w-none`}>{user.displayName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme toggle — desktop only */}
            <div className={`hidden sm:flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              {([['light', <Sun className="w-3.5 h-3.5" />], ['system', <Monitor className="w-3.5 h-3.5" />], ['dark', <Moon className="w-3.5 h-3.5" />]] as [Theme, React.ReactNode][]).map(([t, icon]) => (
                <button key={t} onClick={() => setTheme(t)} className={`p-1.5 rounded-md transition-all ${theme === t ? 'bg-violet-500 text-white shadow-sm' : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>{icon}</button>
              ))}
            </div>

            {/* Mobile: preview toggle */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`lg:hidden flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${showPreview
                ? isDark ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700'
                : isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{showPreview ? 'Editor' : 'Preview'}</span>
            </button>

            <button onClick={handleSave} className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              {saved ? <Check className="w-4 h-4 text-green-500" /> : <Sparkles className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save'}
            </button>

            <button onClick={handleDownloadPNG} disabled={!!exporting}>
              {exporting === 'png' ? 'Exporting PNG...' : 'Download as PNG'}
            </button>

            <button onClick={handleDownloadPDF} disabled={!!exporting}>
              {exporting === 'pdf' ? 'Exporting PDF...' : 'Download as PDF'}
            </button>

            <button onClick={onLogout} className={`flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">

          {/* ── Editor Panel ── */}
          <div className={`lg:w-[400px] shrink-0 ${showPreview ? 'hidden lg:block' : 'block'}`}>
            <div className={`rounded-2xl border shadow-sm overflow-hidden lg:sticky lg:top-20 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>

              {/* Tab bar */}
              <div className={`flex border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} overflow-x-auto scrollbar-hide`}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[60px] flex flex-col items-center gap-0.5 py-3 text-[11px] font-medium transition-all relative ${activeTab === tab.id
                      ? isDark ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-900/20' : 'text-violet-700 border-b-2 border-violet-600 bg-violet-50/40'
                      : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.dot && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-500 rounded-full ring-1 ring-white" />}
                  </button>
                ))}
              </div>

              <div className="max-h-[calc(100dvh-180px)] overflow-y-auto overscroll-contain">

                {/* ── PRODUCT TAB ── */}
                {activeTab === 'product' && (
                  <div className="p-4 sm:p-5 space-y-5">
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Changes update the preview instantly</p>

                    {/* Main product image */}
                    <div>
                      <SectionLabel>Main Product Image</SectionLabel>
                      {productData.imageUrl ? (
                        <div className={`relative rounded-xl overflow-hidden border group ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <img src={productData.imageUrl} alt="Product" className="w-full h-36 object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <label className="cursor-pointer bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100">
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
                        <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all group ${isDark ? 'border-gray-700 hover:border-violet-500 hover:bg-violet-900/20' : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50/50'}`}>
                          <ImageIcon className={`w-8 h-8 mb-2 transition-colors ${isDark ? 'text-gray-600 group-hover:text-violet-400' : 'text-gray-300 group-hover:text-purple-400'}`} />
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tap to upload image</span>
                          <span className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>PNG, JPG up to 5MB</span>
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
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                              <label className="cursor-pointer bg-white/80 text-gray-800 p-1 rounded">
                                <ChevronLeft className="w-3 h-3" />
                                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, true, i)} className="hidden" />
                              </label>
                              <button onClick={() => removeExtraImage(i)} className="bg-red-500 text-white p-1 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {productData.extraImages.length < 3 && (
                          <label className={`aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${isDark ? 'border-gray-700 hover:border-violet-500' : 'border-gray-200 hover:border-violet-400'}`}>
                            <Plus className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                            <input type="file" accept="image/*" onChange={e => handleImageUpload(e, true)} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Text fields */}
                    {[
                      { field: 'productName' as const, label: 'Product Name', icon: <Type className="w-4 h-4" />, placeholder: 'Enter product name', inputMode: 'text' },
                      { field: 'price' as const, label: 'Price', icon: <DollarSign className="w-4 h-4" />, placeholder: '$0.00', inputMode: 'text' },
                      { field: 'contactNumber' as const, label: 'WhatsApp / Contact', icon: <Phone className="w-4 h-4" />, placeholder: '+234 916 784 2902', inputMode: 'tel' },
                      { field: 'ctaText' as const, label: 'Button Text', icon: <MousePointerClick className="w-4 h-4" />, placeholder: 'Order Now', inputMode: 'text' },
                    ].map(({ field, label, icon, placeholder, inputMode }) => (
                      <div key={field}>
                        <label className={`text-sm font-medium mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{icon}</span>{label}
                        </label>
                        <input
                          type="text"
                          inputMode={inputMode as React.HTMLAttributes<HTMLInputElement>['inputMode']}
                          value={productData[field] as string}
                          onChange={e => updateField(field, e.target.value)}
                          placeholder={placeholder}
                          className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                        />
                      </div>
                    ))}

                    {/* Description */}
                    <div>
                      <label className={`text-sm font-medium mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <FileText className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />Short Description
                      </label>
                      <textarea
                        value={productData.description}
                        onChange={e => updateField('description', e.target.value)}
                        placeholder="Describe your product..."
                        rows={3}
                        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                      />
                    </div>
                  </div>
                )}

                {/* ── LOGO TAB ── */}
                {activeTab === 'logo' && (
                  <div className="p-4 sm:p-5 space-y-5">
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Add your brand logo to appear on the product card</p>

                    {productData.logoUrl ? (
                      <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 flex items-center justify-center min-h-[80px]">
                          <div className={productData.logoBgVisible ? 'bg-white/90 rounded-xl shadow-lg ring-1 ring-black/10 p-2' : ''}>
                            <img src={productData.logoUrl} alt="Logo" className={`object-contain ${productData.logoSize === 'small' ? 'w-10 h-10' : productData.logoSize === 'large' ? 'w-20 h-20' : 'w-14 h-14'}`} />
                          </div>
                        </div>
                        <div className="flex border-t border-gray-100">
                          <label className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer border-r border-gray-100 active:bg-gray-100">
                            <ImageIcon className="w-3.5 h-3.5" />Replace Logo
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          </label>
                          <button onClick={() => updateField('logoUrl', '')} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-red-500 hover:bg-red-50 active:bg-red-100">
                            <X className="w-3.5 h-3.5" />Remove Logo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all group ${isDark ? 'border-gray-700 hover:border-violet-500' : 'border-gray-200 hover:border-violet-400 hover:bg-violet-50/50'}`}>
                        <BadgeCheck className={`w-9 h-9 mb-2 transition-colors ${isDark ? 'text-gray-600 group-hover:text-violet-400' : 'text-gray-300 group-hover:text-violet-400'}`} />
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tap to upload logo</span>
                        <span className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>PNG with transparency · Max 2MB</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    )}

                    {productData.logoUrl && (
                      <>
                        {/* Position */}
                        <div>
                          <SectionLabel>Position on Card</SectionLabel>
                          <div className={`border rounded-xl p-3 aspect-[2/1.2] relative grid grid-cols-3 grid-rows-2 gap-1.5 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="row-start-2 col-start-2 rounded-lg bg-gray-200/60 flex items-center justify-center">
                              <span className="text-[9px] text-gray-400 font-medium">card</span>
                            </div>
                            {LOGO_POSITIONS.map(pos => {
                              const isActive = productData.logoPosition === pos.id;
                              return (
                                <button key={pos.id} onClick={() => updateField('logoPosition', pos.id)} title={pos.label}
                                  style={{ gridRow: pos.gridRow, gridColumn: pos.gridCol }}
                                  className={`rounded-lg flex items-center justify-center transition-all text-[10px] font-semibold leading-tight text-center p-1 ${isActive ? 'bg-violet-600 text-white shadow-md scale-105' : isDark ? 'bg-gray-700 text-gray-400' : 'bg-white border border-gray-200 text-gray-400 hover:border-violet-400'}`}
                                >
                                  {isActive ? <Check className="w-3.5 h-3.5" /> : <span className="leading-tight">{pos.label.replace(' ', '\n')}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Size */}
                        <div>
                          <SectionLabel>Logo Size</SectionLabel>
                          <div className="flex gap-2">
                            {LOGO_SIZES.map(size => {
                              const isActive = productData.logoSize === size.id;
                              return (
                                <button key={size.id} onClick={() => updateField('logoSize', size.id)}
                                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${isActive ? 'border-violet-500 bg-violet-50 text-violet-700' : isDark ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-200 bg-white text-gray-500'}`}
                                >
                                  <div className="h-8 flex items-center justify-center">
                                    <div className={`rounded-md ${isActive ? 'bg-violet-400' : 'bg-gray-300'} ${size.id === 'small' ? 'w-4 h-4' : size.id === 'medium' ? 'w-6 h-6' : 'w-8 h-8'}`} />
                                  </div>
                                  <span className="text-xs font-semibold">{size.desc}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Background toggle */}
                        <div>
                          <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <div>
                              <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Background Pill</p>
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>White background behind logo</p>
                            </div>
                            <Toggle checked={productData.logoBgVisible} onChange={() => updateField('logoBgVisible', !productData.logoBgVisible)} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── DESIGN TAB ── */}
                {activeTab === 'design' && (
                  <div className="p-4 sm:p-5 space-y-6">
                    {/* Badge */}
                    <div>
                      <SectionLabel>Sticker Badge</SectionLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {BADGE_OPTIONS.map(opt => {
                          const isActive = productData.badge === opt.id;
                          return (
                            <button key={opt.id} onClick={() => updateField('badge', opt.id as BadgeLabel)}
                              className={`px-3 py-2.5 rounded-lg text-xs font-semibold border-2 transition-all text-left ${isActive ? 'border-violet-500 ring-2 ring-violet-200' : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`}
                              style={isActive ? { background: opt.bg, color: opt.color, borderColor: opt.bg } : {}}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Accent color */}
                    <div>
                      <SectionLabel>Accent Color Override</SectionLabel>
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                        <input type="color" value={productData.accentColorOverride || '#6366f1'} onChange={e => updateField('accentColorOverride', e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            {productData.accentColorOverride ? 'Custom accent active' : 'Using template default'}
                          </p>
                          <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {productData.accentColorOverride || 'Tap swatch to override'}
                          </p>
                        </div>
                        {productData.accentColorOverride && (
                          <button onClick={() => updateField('accentColorOverride', '')} className="text-xs text-red-500 font-medium shrink-0">Reset</button>
                        )}
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
                              className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${isActive ? 'border-violet-500 bg-violet-50 text-violet-700' : isDark ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-200 bg-white text-gray-600'}`}
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
                      <div className="space-y-2">
                        {(Object.entries(FONTS) as [CardFont, { label: string; family: string }][]).map(([id, { label, family }]) => {
                          const isActive = productData.font === id;
                          return (
                            <button key={id} onClick={() => updateField('font', id)}
                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${isActive ? 'border-violet-500 bg-violet-50' : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                            >
                              <span className={`text-sm font-medium ${isActive ? 'text-violet-700' : isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontFamily: family }}>{label}</span>
                              {isActive && <Check className="w-4 h-4 text-violet-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* QR info */}
                    <div className={`rounded-xl p-4 border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50 border-blue-100'}`}>
                      <div className="flex items-start gap-3">
                        <QrCode className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        <div>
                          <p className={`text-sm font-semibold mb-0.5 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>WhatsApp QR Code</p>
                          <p className={`text-xs leading-relaxed ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            Auto-generated from your contact number. Include country code (e.g., +234...).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── EXPORT TAB ── */}
                {activeTab === 'export' && (
                  <div className="p-4 sm:p-5 space-y-6">
                    {/* Card size */}
                    <div>
                      <SectionLabel>Card Size</SectionLabel>
                      <div className="space-y-2">
                        {(Object.entries(CARD_SIZES) as [CardSize, typeof CARD_SIZES[CardSize]][]).map(([id, info]) => {
                          const isActive = productData.cardSize === id;
                          return (
                            <button key={id} onClick={() => { updateField('cardSize', id); setPreviewSize(id); }}
                              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 transition-all ${isActive ? 'border-violet-500 bg-violet-50' : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                            >
                              <div className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 text-lg font-mono shrink-0 ${isActive ? 'border-violet-400 bg-violet-100 text-violet-700' : isDark ? 'border-gray-600 bg-gray-700 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                                {info.icon}
                              </div>
                              <div className="text-left flex-1">
                                <p className={`text-sm font-semibold ${isActive ? 'text-violet-700' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>{info.label}</p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{info.desc} · {info.width}×{info.height}px</p>
                              </div>
                              {isActive && <Check className="w-4 h-4 text-violet-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {androidDownload && (
                      <a
                        href={androidDownload.url}
                        download={androidDownload.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block text-center px-4 py-3 rounded-xl bg-green-600 text-white font-semibold"
                      >
                        Tap to download: {androidDownload.filename}
                      </a>
                    )}

                    {/* Download */}
                    <div>
                      <SectionLabel>Download</SectionLabel>
                      <div className="space-y-2">
                        <button onClick={handleDownloadPNG} disabled={downloading}
                          className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-violet-500 hover:to-purple-500 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
                        >
                          {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                          <div className="text-left">
                            <p className="font-semibold">Download as PNG</p>
                            <p className="text-xs opacity-80">High-quality 2x resolution</p>
                          </div>
                        </button>
                        <button onClick={handleDownloadPDF} disabled={downloading}
                          className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold text-sm hover:from-rose-400 hover:to-pink-500 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
                        >
                          {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                          <div className="text-left">
                            <p className="font-semibold">Download as PDF</p>
                            <p className="text-xs opacity-80">Print-ready format</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Share link */}
                    <div>
                      <SectionLabel>Share Preview Link</SectionLabel>
                      {!shareUrl ? (
                        <button onClick={handleGenerateShareLink}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-all ${isDark ? 'border-gray-700 text-gray-400 hover:border-violet-500' : 'border-gray-200 text-gray-500 hover:border-violet-400'}`}
                        >
                          <Share2 className="w-5 h-5" />
                          Generate share link
                        </button>
                      ) : (
                        <div className={`rounded-xl border p-3 space-y-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs break-all ${isDark ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700 border border-gray-200'}`}>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            <span className="flex-1 truncate">{shareUrl}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleCopyShare} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${shareCopied ? 'bg-green-100 text-green-700' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-white border border-gray-200 text-gray-600'}`}>
                              {shareCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              {shareCopied ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button onClick={() => setShareUrl('')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-white border border-gray-200 text-gray-500'}`}>
                              <X className="w-3.5 h-3.5" />Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── ACCOUNT TAB ── */}
                {activeTab === 'account' && (
                  <div className="p-4 sm:p-5 space-y-6">
                    {/* Profile */}
                    <div className={`rounded-xl p-4 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.displayName}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>@{user.username}</p>
                          <p className={`text-xs mt-0.5 capitalize inline-flex items-center gap-1 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                            <Eye className="w-3 h-3" />{user.role}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Password change */}
                    <div>
                      <SectionLabel>Change Password</SectionLabel>
                      <form onSubmit={handleChangePassword} className="space-y-3">
                        {[
                          { label: 'Current Password', value: currentPass, setter: setCurrentPass },
                          { label: 'New Password', value: newPass, setter: setNewPass },
                          { label: 'Confirm Password', value: confirmPass, setter: setConfirmPass },
                        ].map(({ label, value, setter }) => (
                          <div key={label}>
                            <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</label>
                            <input type="password" value={value} onChange={e => setter(e.target.value)} required
                              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-900'}`}
                            />
                          </div>
                        ))}
                        {passMsg && (
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${passMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                            {passMsg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            {passMsg.text}
                          </div>
                        )}
                        <button type="submit" className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-violet-500 hover:to-purple-500 transition-all shadow-sm flex items-center justify-center gap-2">
                          <KeyRound className="w-4 h-4" />Update Password
                        </button>
                      </form>
                    </div>

                    {/* Theme */}
                    <div>
                      <SectionLabel>Interface Theme</SectionLabel>
                      <div className={`grid grid-cols-3 gap-2 p-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        {([['light', <Sun className="w-4 h-4" />, 'Light'], ['system', <Monitor className="w-4 h-4" />, 'System'], ['dark', <Moon className="w-4 h-4" />, 'Dark']] as [Theme, React.ReactNode, string][]).map(([t, icon, label]) => (
                          <button key={t} onClick={() => setTheme(t)}
                            className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-all ${theme === t ? 'bg-violet-600 text-white shadow-sm' : isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-white'}`}
                          >
                            {icon}{label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logout */}
                    <button onClick={onLogout}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 active:bg-red-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />Sign Out
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── Preview Panel ── */}
          <div className={`flex-1 ${showPreview ? 'block' : 'hidden lg:block'}`}>
            <div className={`rounded-2xl border shadow-sm p-4 sm:p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Live Preview
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {productData.badge !== 'none' && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${isDark ? 'bg-orange-900/30 text-orange-400 border border-orange-800' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                      <Tag className="w-3 h-3" />{productData.badge}
                    </span>
                  )}
                  {productData.logoUrl && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${isDark ? 'bg-violet-900/30 text-violet-400 border border-violet-800' : 'bg-violet-50 text-violet-700 border border-violet-200'}`}>
                      <BadgeCheck className="w-3 h-3" />Logo active
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${isDark ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
              </div>

              {/* Card Preview — responsive scaling */}
              <div className={`flex items-start justify-center bg-gradient-to-br ${previewBg} rounded-xl overflow-hidden`}
                style={{ minHeight: 320, padding: '24px 16px' }}>
                <div style={{
                  transform: 'scale(var(--card-scale, 0.75))',
                  transformOrigin: 'top center',
                  // CSS custom property set via inline style for responsiveness
                }}>
                  <style>{`
                    @media (max-width: 400px) { :root { --card-scale: 0.55; } }
                    @media (min-width: 401px) and (max-width: 640px) { :root { --card-scale: 0.7; } }
                    @media (min-width: 641px) and (max-width: 1024px) { :root { --card-scale: 0.85; } }
                    @media (min-width: 1025px) { :root { --card-scale: 1; } }
                  `}</style>
                  <div ref={cardRef}>
                    <TemplateRenderer templateId={user.assignedTemplate} data={productData} />
                  </div>
                </div>
              </div>

              {/* Info bar */}
              <div className={`flex items-center justify-between mt-3 text-xs flex-wrap gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" />
                    {CARD_SIZES[productData.cardSize ?? 'square'].label} — {CARD_SIZES[productData.cardSize ?? 'square'].desc}
                  </span>
                  <span className="flex items-center gap-1">
                    <Type className="w-3 h-3" />
                    {FONTS[productData.font ?? 'inter'].label}
                  </span>
                </div>
                <span>Template: <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} capitalize`}>{user.assignedTemplate.replace(/-/g, ' ')}</span></span>
              </div>

              {/* Extra images thumbnails */}
              {productData.extraImages.length > 0 && (
                <div className={`mt-4 p-3 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}>
                  <p className={`text-xs font-medium mb-2 flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <ChevronRight className="w-3 h-3" />
                    {productData.extraImages.length + (productData.imageUrl ? 1 : 0)} image carousel
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {productData.imageUrl && <img src={productData.imageUrl} alt="Main" className="w-10 h-10 rounded-lg object-cover border-2 border-violet-500 shrink-0" />}
                    {productData.extraImages.map((img, i) => <img key={i} src={img} alt={`Extra ${i + 1}`} className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" />)}
                  </div>
                </div>
              )}

              {/* Mobile: quick download button */}
              <div className="mt-4 lg:hidden">
                <button onClick={handleDownloadPNG} disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {downloading ? 'Preparing...' : 'Download PNG'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Offscreen render for export (always rendered even when preview is hidden) */}
      <div style={{ position: 'fixed', left: -10000, top: 0, opacity: 0, pointerEvents: 'none' }}>
        <div ref={exportRef}>
          <TemplateRenderer templateId={user.assignedTemplate} data={productData} />
        </div>
      </div>

    </div>
  );
}
