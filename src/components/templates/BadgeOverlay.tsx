import { BadgeLabel, BADGE_OPTIONS } from '../../types';

interface Props {
  badge: BadgeLabel;
  /** Position on card: default is top-left */
  position?: 'top-left' | 'top-right';
}

export function BadgeOverlay({ badge, position = 'top-right' }: Props) {
  if (badge === 'none') return null;
  const opt = BADGE_OPTIONS.find(b => b.id === badge);
  if (!opt) return null;

  const posClass = position === 'top-right' ? 'top-4 right-4' : 'top-4 left-4';

  return (
    <div
      className={`absolute ${posClass} z-30 px-3 py-1.5 rounded-full text-xs font-black shadow-lg select-none`}
      style={{ background: opt.bg, color: opt.color, letterSpacing: '0.05em' }}
    >
      {opt.label}
    </div>
  );
}
