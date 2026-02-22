import { useState } from 'react';
import { ProductData, CARD_SIZES, FONTS } from '../../types';
import { Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { LogoBadge } from './LogoBadge';
import { BadgeOverlay } from './BadgeOverlay';
import { PatternOverlay } from './PatternOverlay';
import { QRCodeCanvas } from './QROverlay';

interface Props { data: ProductData; }

export function ElegantDark({ data }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const allImages = [data.imageUrl, ...data.extraImages].filter(Boolean);
  const accent = data.accentColorOverride || '#f59e0b';
  const { width, height } = CARD_SIZES[data.cardSize ?? 'square'];
  const fontFamily = FONTS[data.font ?? 'inter'].family;
  const isLandscape = data.cardSize === 'landscape';
  const imgHeight = isLandscape ? height : Math.round(height * 0.43);

  const whatsappNumber = data.contactNumber.replace(/\D/g, '');
  const qrValue = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '';

  return (
    <div
      className="relative overflow-hidden shadow-2xl flex flex-col"
      style={{ width, height, background: 'linear-gradient(135deg, #030712, #111827, #1f2937)', borderRadius: 16, fontFamily }}
    >
      {/* Pattern */}
      <PatternOverlay pattern={data.bgPattern} color="rgba(255,255,255,0.04)" />

      {/* Gold accent line */}
      <div className="relative z-10 h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, #fef08a, ${accent})` }} />

      {isLandscape ? (
        /* ── Landscape: side-by-side ── */
        <div className="flex flex-1 relative z-10">
          {/* Image */}
          <div className="relative overflow-hidden flex items-center justify-center" style={{ width: Math.round(width * 0.44) }}>
            {allImages.length > 0
              ? <img src={allImages[imgIdx]} alt={data.productName} className="w-full h-full object-cover" />
              : <ImagePlaceholder />}
            <BadgeOverlay badge={data.badge} position="top-left" />
            <LogoBadge data={data} />
            {allImages.length > 1 && (
              <ImageNav idx={imgIdx} total={allImages.length} onChange={setImgIdx} accent={accent} />
            )}
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col p-5">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-white text-xl font-bold leading-tight flex-1 mr-2">{data.productName}</h2>
              <span className="px-3 py-1 rounded-full font-bold text-sm text-gray-900 shrink-0" style={{ background: accent }}>{data.price}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-4">{data.description}</p>
            <div className="flex items-center gap-3">
              <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-900" style={{ background: accent }}>{data.ctaText}</button>
              {qrValue && <div className="rounded-lg overflow-hidden border border-white/10"><QRCodeCanvas value={qrValue} size={44} fgColor="#1f2937" bgColor="#f9fafb" /></div>}
            </div>
            <div className="flex items-center gap-2 mt-2.5 text-gray-400 text-xs">
              <Phone className="w-3.5 h-3.5" style={{ color: accent }} />
              <span>{data.contactNumber}</span>
            </div>
          </div>
        </div>
      ) : (
        /* ── Square / Story: stacked ── */
        <>
          {/* Image section */}
          <div className="relative overflow-hidden bg-gray-800 flex items-center justify-center z-10" style={{ height: imgHeight }}>
            {allImages.length > 0
              ? <img src={allImages[imgIdx]} alt={data.productName} className="w-full h-full object-cover" />
              : <ImagePlaceholder />}
            <div className="absolute top-4 right-4 px-4 py-1.5 rounded-full font-bold text-base shadow-lg text-gray-900" style={{ background: accent }}>{data.price}</div>
            <BadgeOverlay badge={data.badge} position="top-left" />
            <LogoBadge data={data} />
            {allImages.length > 1 && (
              <ImageNav idx={imgIdx} total={allImages.length} onChange={setImgIdx} accent={accent} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-5 flex flex-col z-10">
            <h2 className="text-white text-xl font-bold tracking-tight leading-tight mb-2">{data.productName}</h2>
            <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-4">{data.description}</p>
            <div className="flex items-center gap-3 mb-3">
              <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-900" style={{ background: accent }}>{data.ctaText}</button>
              {qrValue && (
                <div className="rounded-lg overflow-hidden border border-white/10 shrink-0">
                  <QRCodeCanvas value={qrValue} size={44} fgColor="#1f2937" bgColor="#f9fafb" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Phone className="w-4 h-4" style={{ color: accent }} />
              <span>{data.contactNumber}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ImagePlaceholder() {
  return (
    <div className="flex flex-col items-center gap-2 text-gray-600">
      <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
      </svg>
      <span className="text-sm">Product Image</span>
    </div>
  );
}

function ImageNav({ idx, total, onChange, accent }: { idx: number; total: number; onChange: (i: number) => void; accent: string }) {
  return (
    <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2 z-20">
      <button onClick={() => onChange((idx - 1 + total) % total)} className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} onClick={() => onChange(i)} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: i === idx ? accent : 'rgba(255,255,255,0.4)' }} />
        ))}
      </div>
      <button onClick={() => onChange((idx + 1) % total)} className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
