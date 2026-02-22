import { useState } from 'react';
import { ProductData, CustomTemplateConfig, CARD_SIZES, FONTS } from '../../types';
import { Phone, ShoppingBag, MessageCircle, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { LogoBadge } from './LogoBadge';
import { BadgeOverlay } from './BadgeOverlay';
import { PatternOverlay } from './PatternOverlay';
import { QRCodeCanvas } from './QROverlay';

interface Props {
  config: CustomTemplateConfig;
  data: ProductData;
}

function ImagePlaceholder({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-2" style={{ color }}>
      <svg className="w-14 h-14 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
      </svg>
      <span className="text-xs opacity-50">Product Image</span>
    </div>
  );
}

function ImageCarousel({ images, accent, rounded }: { images: string[]; accent: string; rounded: boolean; placeholder: string }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;
  return (
    <>
      <img src={images[idx]} alt="Product" className={`w-full h-full object-cover ${rounded ? 'rounded-xl' : ''}`} />
      {images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5 z-20">
          <button onClick={() => setIdx((idx - 1 + images.length) % images.length)} className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center">
            <ChevronLeft className="w-3 h-3 text-white" />
          </button>
          {images.map((_, i) => <button key={i} onClick={() => setIdx(i)} className="w-1 h-1 rounded-full" style={{ background: i === idx ? accent : 'rgba(255,255,255,0.5)' }} />)}
          <button onClick={() => setIdx((idx + 1) % images.length)} className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center">
            <ChevronRight className="w-3 h-3 text-white" />
          </button>
        </div>
      )}
    </>
  );
}

function ClassicLayout({ config, data, allImages, qrValue, w, h, fontFamily }: Props & { allImages: string[]; qrValue: string; w: number; h: number; fontFamily: string }) {
  const bg = config.useGradientBg ? `linear-gradient(135deg, ${config.bgColor}, ${config.bgColor2})` : config.bgColor;
  const accent = data.accentColorOverride || config.accentColor;
  const imgH = Math.round(h * 0.42);

  return (
    <div className="relative overflow-hidden shadow-2xl flex flex-col" style={{ width: w, height: h, background: bg, borderRadius: 16, fontFamily }}>
      <PatternOverlay pattern={data.bgPattern} />
      {config.showAccentBar && <div className="h-1.5 w-full z-10 relative" style={{ background: accent }} />}
      <div className={`relative overflow-hidden flex items-center justify-center z-10 ${config.imageRounded ? 'mx-4 mt-3 rounded-xl' : ''}`} style={{ height: imgH, background: `${accent}22` }}>
        {allImages.length > 0 ? <ImageCarousel images={allImages} accent={accent} rounded={false} placeholder={config.accentColor} /> : <ImagePlaceholder color={accent} />}
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold shadow-lg z-10" style={{ background: config.priceColor, color: config.btnTextColor }}>{data.price}</div>
        <BadgeOverlay badge={data.badge} position="top-left" />
        <LogoBadge data={data} />
      </div>
      <div className="flex-1 p-4 flex flex-col z-10">
        <h2 className="text-lg font-bold leading-tight mb-1" style={{ color: config.textColor }}>{data.productName}</h2>
        <p className="text-sm leading-relaxed flex-1 mb-3" style={{ color: config.subTextColor }}>{data.description}</p>
        <div className="flex items-center gap-2 mb-2">
          <button className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md" style={{ background: config.btnBgColor, color: config.btnTextColor }}>
            <ShoppingBag className="w-4 h-4" />{data.ctaText}
          </button>
          {qrValue && <div className="rounded-lg overflow-hidden shrink-0" style={{ border: `1px solid ${accent}44` }}><QRCodeCanvas value={qrValue} size={42} fgColor={config.textColor} bgColor={config.bgColor} /></div>}
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs" style={{ color: config.subTextColor }}>
          <Phone className="w-3.5 h-3.5" style={{ color: accent }} />{data.contactNumber}
        </div>
      </div>
    </div>
  );
}

function CardFloatLayout({ config, data, allImages, qrValue, w, h, fontFamily }: Props & { allImages: string[]; qrValue: string; w: number; h: number; fontFamily: string }) {
  const bg = config.useGradientBg ? `linear-gradient(135deg, ${config.bgColor}, ${config.bgColor2})` : config.bgColor;
  const accent = data.accentColorOverride || config.accentColor;
  const cardBg = config.cardStyle === 'glass' ? 'rgba(255,255,255,0.12)' : config.cardStyle === 'raised' ? '#ffffff' : `${config.bgColor}cc`;
  const cardText = config.cardStyle === 'raised' ? '#1f2937' : config.textColor;
  const cardSub = config.cardStyle === 'raised' ? '#6b7280' : config.subTextColor;
  const imgH = Math.round(h * 0.42);

  return (
    <div className="relative overflow-hidden shadow-2xl flex flex-col" style={{ width: w, height: h, background: bg, borderRadius: 16, fontFamily }}>
      <PatternOverlay pattern={data.bgPattern} />
      {config.showAccentBar && <div className="h-1.5 w-full z-10 relative" style={{ background: accent }} />}
      <div className="px-4 pt-3 relative z-10" style={{ height: imgH + 16 }}>
        <div className={`w-full overflow-hidden flex items-center justify-center ${config.imageRounded ? 'rounded-xl' : ''}`} style={{ height: imgH, background: `${accent}22` }}>
          {allImages.length > 0 ? <ImageCarousel images={allImages} accent={accent} rounded={false} placeholder={accent} /> : <ImagePlaceholder color={accent} />}
        </div>
        <BadgeOverlay badge={data.badge} position="top-left" />
        <LogoBadge data={data} />
      </div>
      <div className="mx-4 -mt-4 flex-1 rounded-2xl p-4 flex flex-col shadow-xl backdrop-blur-sm z-10" style={{ background: cardBg, border: config.cardStyle === 'glass' ? '1px solid rgba(255,255,255,0.2)' : undefined }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: `${accent}33`, color: accent }}>{data.price}</span>
          <Heart className="w-4 h-4" style={{ color: accent }} />
        </div>
        <h2 className="font-bold text-base leading-tight mb-1" style={{ color: cardText }}>{data.productName}</h2>
        <p className="text-xs leading-relaxed flex-1" style={{ color: cardSub }}>{data.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <button className="flex-1 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 shadow" style={{ background: config.btnBgColor, color: config.btnTextColor }}>
            <MessageCircle className="w-3.5 h-3.5" />{data.ctaText}
          </button>
          {qrValue && <div className="rounded-lg overflow-hidden shrink-0"><QRCodeCanvas value={qrValue} size={36} fgColor={cardText} bgColor={config.cardStyle === 'raised' ? '#f9fafb' : config.bgColor} /></div>}
        </div>
        <p className="text-center text-xs mt-1.5" style={{ color: cardSub }}>{data.contactNumber}</p>
      </div>
    </div>
  );
}

function SideAccentLayout({ config, data, allImages, qrValue, w, h, fontFamily }: Props & { allImages: string[]; qrValue: string; w: number; h: number; fontFamily: string }) {
  const bg = config.useGradientBg ? `linear-gradient(135deg, ${config.bgColor}, ${config.bgColor2})` : config.bgColor;
  const accent = data.accentColorOverride || config.accentColor;
  const imgH = Math.round(h * 0.42);

  return (
    <div className="relative overflow-hidden shadow-2xl flex flex-row" style={{ width: w, height: h, borderRadius: 16, fontFamily }}>
      <div className="w-3 shrink-0 flex flex-col items-center py-6 gap-3" style={{ background: accent }}>
        {[...Array(6)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-white/50" />)}
      </div>
      <div className="flex-1 flex flex-col" style={{ background: bg }}>
        <PatternOverlay pattern={data.bgPattern} />
        <div className={`relative overflow-hidden flex items-center justify-center z-10 ${config.imageRounded ? 'm-3 rounded-xl' : ''}`} style={{ height: imgH, background: `${accent}22` }}>
          {allImages.length > 0 ? <ImageCarousel images={allImages} accent={accent} rounded={false} placeholder={accent} /> : <ImagePlaceholder color={accent} />}
          <BadgeOverlay badge={data.badge} position="top-left" />
          <LogoBadge data={data} />
        </div>
        <div className="flex-1 px-3 pb-4 flex flex-col z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px flex-1" style={{ background: accent }} />
            <span className="text-lg font-black" style={{ color: config.priceColor }}>{data.price}</span>
            <div className="h-px flex-1" style={{ background: accent }} />
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ color: config.textColor }}>{data.productName}</h2>
          <p className="text-xs leading-relaxed flex-1 mb-2" style={{ color: config.subTextColor }}>{data.description}</p>
          <div className="flex items-center gap-2 mb-1">
            <button className="flex-1 py-2 rounded-lg font-bold text-sm" style={{ background: config.btnBgColor, color: config.btnTextColor }}>{data.ctaText}</button>
            {qrValue && <div className="rounded-lg overflow-hidden shrink-0" style={{ border: `1px solid ${accent}33` }}><QRCodeCanvas value={qrValue} size={36} fgColor={config.textColor} bgColor={config.bgColor} /></div>}
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: config.subTextColor }}>
            <Phone className="w-3 h-3" style={{ color: accent }} />{data.contactNumber}
          </div>
        </div>
      </div>
    </div>
  );
}

function FullBleedLayout({ config, data, allImages, qrValue, w, h, fontFamily }: Props & { allImages: string[]; qrValue: string; w: number; h: number; fontFamily: string }) {
  const [idx, setIdx] = useState(0);
  const accent = data.accentColorOverride || config.accentColor;
  const overlayBg = config.useGradientBg
    ? `linear-gradient(to top, ${config.bgColor}f0, ${config.bgColor}99 55%, transparent)`
    : `linear-gradient(to top, ${config.bgColor}f5, ${config.bgColor}80 55%, transparent)`;

  return (
    <div className="relative overflow-hidden shadow-2xl flex flex-col" style={{ width: w, height: h, background: config.bgColor, borderRadius: 16, fontFamily }}>
      <div className="absolute inset-0">
        {allImages.length > 0
          ? <img src={allImages[idx]} alt="Product" className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: config.bgColor }} />}
      </div>
      {allImages.length > 1 && (
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 z-20">
          <button onClick={() => setIdx((idx - 1 + allImages.length) % allImages.length)} className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setIdx((idx + 1) % allImages.length)} className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
      <div className="absolute inset-0" style={{ background: overlayBg }} />
      <PatternOverlay pattern={data.bgPattern} />
      {config.showAccentBar && <div className="relative z-10 h-1.5 w-full" style={{ background: accent }} />}
      <div className="relative z-10 flex justify-between items-start p-4">
        <BadgeOverlay badge={data.badge} position="top-left" />
        <div className="ml-auto px-4 py-1.5 rounded-full font-bold text-sm shadow-lg backdrop-blur-sm" style={{ background: config.priceColor, color: '#1f2937' }}>{data.price}</div>
      </div>
      <LogoBadge data={data} />
      <div className="flex-1" />
      <div className="relative z-10 p-5">
        <h2 className="text-2xl font-black leading-tight mb-1 drop-shadow" style={{ color: config.textColor }}>{data.productName}</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: config.subTextColor }}>{data.description}</p>
        <div className="flex items-center gap-2 mb-2">
          <button className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg" style={{ background: config.btnBgColor, color: config.btnTextColor }}>
            <ShoppingBag className="w-4 h-4" />{data.ctaText}
          </button>
          {qrValue && <div className="rounded-lg overflow-hidden shrink-0 border border-white/20"><QRCodeCanvas value={qrValue} size={42} fgColor={config.textColor} bgColor="rgba(0,0,0,0)" /></div>}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm" style={{ color: config.subTextColor }}>
          <Phone className="w-3.5 h-3.5" style={{ color: accent }} />{data.contactNumber}
        </div>
      </div>
    </div>
  );
}

function BannerLayout({ config, data, allImages, qrValue, w, h, fontFamily }: Props & { allImages: string[]; qrValue: string; w: number; h: number; fontFamily: string }) {
  const bg = config.useGradientBg ? `linear-gradient(135deg, ${config.bgColor}, ${config.bgColor2})` : config.bgColor;
  const accent = data.accentColorOverride || config.accentColor;
  const imgH = Math.round(h * 0.42);

  return (
    <div className="relative overflow-hidden shadow-2xl flex flex-col" style={{ width: w, height: h, background: bg, borderRadius: 16, fontFamily }}>
      <PatternOverlay pattern={data.bgPattern} />
      <div className="relative px-4 pt-4 pb-2 flex items-center justify-between z-10">
        <div>
          <h2 className="text-xl font-black leading-tight" style={{ color: config.textColor }}>{data.productName}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="h-px w-6" style={{ background: accent }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>New Arrival</span>
          </div>
        </div>
        <div className="text-xl font-black px-3 py-1 rounded-xl" style={{ background: config.priceColor, color: '#1f2937' }}>{data.price}</div>
      </div>
      <BadgeOverlay badge={data.badge} position="top-left" />
      {config.showAccentBar && <div className="mx-4 h-0.5 rounded-full mb-2 z-10" style={{ background: accent }} />}
      <div className={`mx-4 relative overflow-hidden flex items-center justify-center z-10 ${config.imageRounded ? 'rounded-xl' : ''}`} style={{ height: imgH, background: `${accent}22` }}>
        {allImages.length > 0 ? <ImageCarousel images={allImages} accent={accent} rounded={false} placeholder={accent} /> : <ImagePlaceholder color={accent} />}
        <LogoBadge data={data} />
      </div>
      <div className="flex-1 px-4 py-3 flex flex-col justify-between z-10">
        <p className="text-xs leading-relaxed" style={{ color: config.subTextColor }}>{data.description}</p>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md" style={{ background: config.btnBgColor, color: config.btnTextColor }}>
              <MessageCircle className="w-4 h-4" />{data.ctaText}
            </button>
            {qrValue && <div className="rounded-lg overflow-hidden shrink-0" style={{ border: `1px solid ${accent}33` }}><QRCodeCanvas value={qrValue} size={40} fgColor={config.textColor} bgColor={config.bgColor} /></div>}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs" style={{ color: config.subTextColor }}>
            <Phone className="w-3 h-3" style={{ color: accent }} />{data.contactNumber}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomTemplate({ config, data }: Props) {
  const allImages = [data.imageUrl, ...data.extraImages].filter(Boolean);
  const whatsappNumber = data.contactNumber.replace(/\D/g, '');
  const qrValue = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '';
  const { width: w, height: h } = CARD_SIZES[data.cardSize ?? 'square'];
  const fontFamily = FONTS[data.font ?? 'inter'].family;

  const layoutProps = { config, data, allImages, qrValue, w, h, fontFamily };

  switch (config.layout) {
    case 'card-float':  return <CardFloatLayout {...layoutProps} />;
    case 'side-accent': return <SideAccentLayout {...layoutProps} />;
    case 'full-bleed':  return <FullBleedLayout {...layoutProps} />;
    case 'banner':      return <BannerLayout {...layoutProps} />;
    default:            return <ClassicLayout {...layoutProps} />;
  }
}
