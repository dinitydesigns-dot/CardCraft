import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface Props {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

export function QRCodeCanvas({ value, size = 80, fgColor = '#000000', bgColor = '#ffffff', className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, value || ' ', {
      width: size,
      margin: 1,
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel: 'M',
    }).catch(() => {/* ignore */});
  }, [value, size, fgColor, bgColor]);

  if (!value) return null;

  return <canvas ref={canvasRef} className={className} style={{ width: size, height: size }} />;
}
