import { useState } from 'react';
import { ProductData, CARD_SIZES, FONTS } from '../../types';
import { Heart, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { LogoBadge } from './LogoBadge';
import { BadgeOverlay } from './BadgeOverlay';
import { PatternOverlay } from './PatternOverlay';
import { QRCodeCanvas } from './QROverlay';

interface Props { data: ProductData; }

function ImagePlaceholder() {
  return (
    <div className="flex flex-col items-center gap-2 text-purple-300">
      <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
      </svg>
      <span className="text-sm">Product Image</span>
    </div>
  );
}

export function PastelSoft({ data }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const allImages = [data.imageUrl, ...data.extraImages].filter(Boolean);
  const accent = data.accentColorOverride || '#ec4899';
  const { width, height } = CARD_SIZES[data.cardSize ?? 'square'];
  const fontFamily = FONTS[data.font ?? 'inter'].family;
  const imgHeight = Math.round(height * 0.42);
  const whatsappNumber = data.contactNumber.replace(/\D/g, '');
  const qrValue = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '';

  return (
    <div
      className="relative overflow-hidden shadow-2xl flex flex-col"
      style={{ width, height, background: 'linear-gradient(135deg, #fce7f3, #ede9fe, #ddd6fe)', borderRadius: 16, fontFamily }}
    >
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-pink-200/50 to-purple-200/50 pointer-events-none" />
      <PatternOverlay pattern={data.bgPattern} color="rgba(236,72,153,0.07)" />

      {data.cardSize === 'landscape' ? (
        <div className="flex flex-1 relative z-10 p-4 gap-4">
          <div className="relative rounded-2xl overflow-hidden flex items-center justify-center border border-white/80 shadow-sm" style={{ width: Math.round(width * 0.42), background: 'rgba(255,255,255,0.6)' }}>
            {allImages.length > 0
              ? <img src={allImages[imgIdx]} alt={data.productName} className="w-full h-full object-cover" />
              : <ImagePlaceholder />}
            <BadgeOverlay badge={data.badge} position="top-left" />
            <LogoBadge data={data} />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 fill-current" style={{ color: accent }} />
              <span className="font-bold text-xl" style={{ color: accent }}>{data.price}</span>
            </div>
            <h2 className="text-gray-800 text-xl font-bold leading-tight mb-2">{data.productName}</h2>
            <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-3">{data.description}</p>
            <div className="flex items-center gap-2">
              <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 shadow-md" style={{ background: `linear-gradient(135deg, ${accent}, #a855f7)` }}>
                <Heart className="w-3.5 h-3.5" />{data.ctaText}
              </button>
              {qrValue && <div className="rounded-lg overflow-hidden border border-pink-100 shrink-0"><QRCodeCanvas value={qrValue} size={40} fgColor="#9d174d" bgColor="#fff0f6" /></div>}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-gray-400 text-xs">
              <Phone className="w-3 h-3" style={{ color: accent }} />{data.contactNumber}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 pb-0 relative z-10">
            <div className="relative rounded-2xl overflow-hidden flex items-center justify-center border border-white/80 shadow-sm" style={{ height: imgHeight, background: 'rgba(255,255,255,0.6)' }}>
              {allImages.length > 0
                ? <img src={allImages[imgIdx]} alt={data.productName} className="w-full h-full object-cover" />
                : <ImagePlaceholder />}
              <BadgeOverlay badge={data.badge} position="top-left" />
              <LogoBadge data={data} />
              {allImages.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2 z-20">
                  <button onClick={() => setImgIdx((imgIdx - 1 + allImages.length) % allImages.length)} className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center">
                    <ChevronLeft className="w-3 h-3 text-gray-600" />
                  </button>
                  <div className="flex gap-1">
                    {allImages.map((_, i) => <button key={i} onClick={() => setImgIdx(i)} className="w-1.5 h-1.5 rounded-full" style={{ background: i === imgIdx ? accent : 'rgba(236,72,153,0.3)' }} />)}
                  </div>
                  <button onClick={() => setImgIdx((imgIdx + 1) % allImages.length)} className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 p-4 pt-3 flex flex-col z-10">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 fill-current" style={{ color: accent }} />
              <span className="font-bold text-xl" style={{ color: accent }}>{data.price}</span>
            </div>
            <h2 className="text-gray-800 text-xl font-bold tracking-tight leading-tight mb-2">{data.productName}</h2>
            <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-3">{data.description}</p>
            <div className="flex items-center gap-2 mb-2">
              <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md" style={{ background: `linear-gradient(135deg, ${accent}, #a855f7)` }}>
                <Heart className="w-4 h-4" />{data.ctaText}
              </button>
              {qrValue && <div className="rounded-lg overflow-hidden border border-pink-100 shrink-0"><QRCodeCanvas value={qrValue} size={42} fgColor="#9d174d" bgColor="#fff0f6" /></div>}
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Phone className="w-4 h-4" style={{ color: accent }} />{data.contactNumber}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
