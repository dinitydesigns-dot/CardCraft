import { BgPattern } from '../../types';

interface Props {
  pattern: BgPattern;
  color?: string; // pattern stroke color (default: white at low opacity)
}

export function PatternOverlay({ pattern, color = 'rgba(255,255,255,0.07)' }: Props) {
  if (pattern === 'none') return null;

  const getSvgPattern = (): string => {
    switch (pattern) {
      case 'dots':
        return `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='2' cy='2' r='1.5' fill='${encodeURIComponent(color)}'/></svg>`;
      case 'grid':
        return `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><path d='M20 0L0 0L0 20' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='0.8'/></svg>`;
      case 'diagonal':
        return `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><path d='M0 20L20 0' stroke='${encodeURIComponent(color)}' stroke-width='1'/></svg>`;
      case 'circles':
        return `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='20' cy='20' r='16' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='1'/></svg>`;
      case 'waves':
        return `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='20'><path d='M0 10 Q10 0 20 10 Q30 20 40 10' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='1'/></svg>`;
      default:
        return '';
    }
  };

  const svgStr = getSvgPattern();
  if (!svgStr) return null;

  const dataUri = `url("data:image/svg+xml,${svgStr}")`;

  return (
    <div
      className="absolute inset-0 z-[1] pointer-events-none"
      style={{ backgroundImage: dataUri, backgroundRepeat: 'repeat' }}
    />
  );
}
