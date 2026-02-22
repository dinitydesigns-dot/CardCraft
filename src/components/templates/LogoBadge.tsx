import { ProductData, LogoPosition, LogoSize } from '../../types';

interface Props {
  data: ProductData;
  /** Override position if needed by a specific layout */
  positionOverride?: LogoPosition;
  /** Extra class names on the wrapper */
  className?: string;
  /** Whether the wrapper should be absolute-positioned inside a relative parent */
  absolute?: boolean;
}

const SIZE_MAP: Record<LogoSize, { img: string; wrapper: string }> = {
  small:  { img: 'w-8 h-8',   wrapper: 'p-1' },
  medium: { img: 'w-12 h-12', wrapper: 'p-1.5' },
  large:  { img: 'w-16 h-16', wrapper: 'p-2' },
};

const POSITION_MAP: Record<LogoPosition, string> = {
  'top-left':    'top-3 left-3',
  'top-right':   'top-3 right-3',
  'top-center':  'top-3 left-1/2 -translate-x-1/2',
  'bottom-left': 'bottom-3 left-3',
  'bottom-right':'bottom-3 right-3',
};

export function LogoBadge({ data, positionOverride, className = '', absolute = true }: Props) {
  if (!data.logoUrl) return null;

  const pos = positionOverride ?? data.logoPosition;
  const size = SIZE_MAP[data.logoSize];
  const posClass = absolute ? `absolute ${POSITION_MAP[pos]} z-20` : '';

  return (
    <div className={`${posClass} ${className}`}>
      <div
        className={`${size.wrapper} rounded-xl shadow-lg ${
          data.logoBgVisible
            ? 'bg-white/90 backdrop-blur-sm ring-1 ring-black/10'
            : 'bg-transparent'
        }`}
      >
        <img
          src={data.logoUrl}
          alt="Brand Logo"
          className={`${size.img} object-contain rounded-lg`}
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>
    </div>
  );
}
