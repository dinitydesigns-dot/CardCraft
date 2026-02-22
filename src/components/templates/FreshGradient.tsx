import { useState } from 'react';
import { ProductData, CARD_SIZES, FONTS } from '../../types';
import { MessageCircle, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { LogoBadge } from './LogoBadge';
import { BadgeOverlay } from './BadgeOverlay';
import { PatternOverlay } from './PatternOverlay';
import { QRCodeCanvas } from './QROverlay';

interface Props { data: ProductData; }

function ImagePlaceholder() {
  return (
    <div className="flex flex-col items-center gap-2 text-white/60">
      <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
      </svg>
      <span className="text-sm">Product Image</span>
    </div>
  );
}

export function FreshGradient({ data }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const allImages = [data.imageUrl, ...data.extraImages].filter(Boolean);
  const accent = data.accentColorOverride || '#10b981';
  const { width, height } = CARD_SIZES[data.cardSize ?? 'square'];
  const fontFamily = FONTS[data.font ?? 'inter'].family;
  const imgHeight = data.cardSize === 'landscape' ? height : Math.round(height * 0.42);

  const whatsappNumber = data.contactNumber.replace(/\D/g, '');
  const qrValue = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '';

  return (
    <div
      className="relative overflow-hidden shadow-2xl flex flex-col"
      style={{ width, height, background: `linear-gradient(135deg, #059669, #0d9488, #0891b2)`, borderRadius: 16, fontFamily }}
    >
      <PatternOverlay pattern={data.bgPattern} color="rgba(255,255,255,0.08)" />

      {data.cardSize === 'landscape' ? (
        <div className="flex flex-1 relative z-10 p-4 gap-4">
          {/* Image */}
          <div className="relative rounded-xl overflow-hidden flex items-center justify-center" style={{ width: Math.round(width * 0.4), background: 'rgba(255,255,255,0.15)' }}>
            {allImages.length > 0
              ? <img src={allImages[imgIdx]} alt={data.productName} className="w-full h-full object-cover" />
              : <ImagePlaceholder />}
            <BadgeOverlay badge={data.badge} position="top-left" />
            <LogoBadge data={data} />
            {allImages.length > 1 && (
              <div className="absolute bottom-2 flex gap-1">
                {allImages.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className="w-1.5 h-1.5 rounded-full" style={{ background: i === imgIdx ? accent : 'rgba(255,255,255,0.5)' }} />
                ))}
              </div>
            )}
          </div>
          {/* Content card */}
          <div className="flex-1 bg-white rounded-xl p-4 flex flex-col shadow-lg">
            <span className="inline-flex self-start px-2.5 py-0.5 rounded-full text-xs font-bold mb-2" style={{ background: `${accent}22`, color: accent }}>{data.price}</span>
            <h2 className="text-gray-900 text-lg font-bold leading-tight mb-2">{data.productName}</h2>
            <p className="text-gray-500 text-xs leading-relaxed flex-1 mb-3">{data.description}</p>
            <div className="flex items-center gap-2">
              <button className="flex-1 py-2 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5" style={{ background: accent }}>
                <MessageCircle className="w-4 h-4" />{data.ctaText}
              </button>
              {qrValue && <div className="rounded-lg overflow-hidden border border-gray-100"><QRCodeCanvas value={qrValue} size={36} /></div>}
            </div>
            <p className="text-center text-gray-400 text-xs mt-2">{data.contactNumber}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 pb-0 relative z-10">
            <div className="relative rounded-xl overflow-hidden flex items-center justify-center" style={{ height: imgHeight, background: 'rgba(255,255,255,0.2)' }}>
              {allImages.length > 0
                ? <img src={allImages[imgIdx]} alt={data.productName} className="w-full h-full object-cover" />
                : <ImagePlaceholder />}
              <BadgeOverlay badge={data.badge} position="top-left" />
              <LogoBadge data={data} />
              {allImages.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2 z-20">
                  <button onClick={() => setImgIdx((imgIdx - 1 + allImages.length) % allImages.length)} className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white">
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <div className="flex gap-1">
                    {allImages.map((_, i) => <button key={i} onClick={() => setImgIdx(i)} className="w-1.5 h-1.5 rounded-full" style={{ background: i === imgIdx ? '#ffffff' : 'rgba(255,255,255,0.4)' }} />)}
                  </div>
                  <button onClick={() => setImgIdx((imgIdx + 1) % allImages.length)} className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 mx-4 mt-4 mb-4 bg-white rounded-xl p-4 flex flex-col shadow-lg z-10">
            <span className="inline-flex self-start px-3 py-0.5 rounded-full text-sm font-bold mb-2" style={{ background: `${accent}22`, color: accent }}>{data.price}</span>
            <h2 className="text-gray-900 text-xl font-bold leading-tight mb-2">{data.productName}</h2>
            <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-3">{data.description}</p>
            <div className="flex items-center gap-2 mb-2">
              <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2" style={{ background: accent }}>
                <MessageCircle className="w-4 h-4" />{data.ctaText}
              </button>
              {qrValue && <div className="rounded-lg overflow-hidden border border-gray-100 shrink-0"><QRCodeCanvas value={qrValue} size={40} /></div>}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs">
              <Phone className="w-3 h-3" />{data.contactNumber}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
