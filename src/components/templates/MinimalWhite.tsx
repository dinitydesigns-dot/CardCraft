import { useState } from 'react';
import { ProductData, CARD_SIZES, FONTS } from '../../types';
import { Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { LogoBadge } from './LogoBadge';
import { BadgeOverlay } from './BadgeOverlay';
import { PatternOverlay } from './PatternOverlay';
import { QRCodeCanvas } from './QROverlay';

interface Props { data: ProductData; }

function ImagePlaceholder() {
  return (
    <div className="flex flex-col items-center gap-2 text-gray-300">
      <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
      </svg>
      <span className="text-sm">Product Image</span>
    </div>
  );
}

export function MinimalWhite({ data }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const allImages = [data.imageUrl, ...data.extraImages].filter(Boolean);
  const accent = data.accentColorOverride || '#111827';
  const { width, height } = CARD_SIZES[data.cardSize ?? 'square'];
  const fontFamily = FONTS[data.font ?? 'inter'].family;
  const imgHeight = Math.round(height * 0.46);
  const whatsappNumber = data.contactNumber.replace(/\D/g, '');
  const qrValue = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '';

  return (
    <div
      className="relative overflow-hidden shadow-2xl flex flex-col bg-white border border-gray-100"
      style={{ width, height, borderRadius: 16, fontFamily }}
    >
      <PatternOverlay pattern={data.bgPattern} color="rgba(0,0,0,0.04)" />

      {data.cardSize === 'landscape' ? (
        <div className="flex flex-1 relative z-10">
          <div className="relative overflow-hidden flex items-center justify-center bg-gray-50" style={{ width: Math.round(width * 0.45) }}>
            {allImages.length > 0
              ? <img src={allImages[imgIdx]} alt={data.productName} className="w-full h-full object-cover" />
              : <ImagePlaceholder />}
            <BadgeOverlay badge={data.badge} position="top-left" />
            <LogoBadge data={data} />
          </div>
          <div className="flex-1 p-6 flex flex-col border-l border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-gray-900 text-lg font-semibold leading-tight flex-1 mr-3">{data.productName}</h2>
              <span className="text-2xl font-bold whitespace-nowrap" style={{ color: accent }}>{data.price}</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{data.description}</p>
            <div className="flex items-center gap-3">
              <button className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-white" style={{ background: accent }}>{data.ctaText}</button>
              {qrValue && <div className="rounded-lg overflow-hidden border border-gray-200 shrink-0"><QRCodeCanvas value={qrValue} size={40} fgColor={accent} /></div>}
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-gray-400 text-xs">
              <Phone className="w-3.5 h-3.5" />{data.contactNumber}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden bg-gray-50 flex items-center justify-center z-10" style={{ height: imgHeight }}>
            {allImages.length > 0
              ? <img src={allImages[imgIdx]} alt={data.productName} className="w-full h-full object-cover" />
              : <ImagePlaceholder />}
            <BadgeOverlay badge={data.badge} position="top-left" />
            <LogoBadge data={data} />
            {allImages.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2 z-20">
                <button onClick={() => setImgIdx((imgIdx - 1 + allImages.length) % allImages.length)} className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center">
                  <ChevronLeft className="w-3 h-3 text-gray-700" />
                </button>
                <div className="flex gap-1">
                  {allImages.map((_, i) => <button key={i} onClick={() => setImgIdx(i)} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: i === imgIdx ? accent : '#d1d5db' }} />)}
                </div>
                <button onClick={() => setImgIdx((imgIdx + 1) % allImages.length)} className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center">
                  <ChevronRight className="w-3 h-3 text-gray-700" />
                </button>
              </div>
            )}
          </div>
          <div className="h-px bg-gray-100 z-10" />
          <div className="flex-1 p-5 flex flex-col z-10">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-gray-900 text-xl font-semibold tracking-tight leading-tight flex-1 mr-3">{data.productName}</h2>
              <span className="text-2xl font-bold whitespace-nowrap" style={{ color: accent }}>{data.price}</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{data.description}</p>
            <div className="flex items-center gap-3 mb-3">
              <button className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-white" style={{ background: accent }}>{data.ctaText}</button>
              {qrValue && <div className="rounded-lg overflow-hidden border border-gray-200 shrink-0"><QRCodeCanvas value={qrValue} size={44} fgColor={accent} /></div>}
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Phone className="w-4 h-4" />{data.contactNumber}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
