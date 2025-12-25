'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeComponentProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
}

export async function generateQRDataURL(
  value: string,
  size: number = 200
): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: size,
    margin: 1,
  });
}

export function QRCodeComponent({
  value,
  size = 200,
  level = 'H',
  includeMargin = true,
}: QRCodeComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          errorCorrectionLevel: level,
          width: size,
          margin: includeMargin ? 1 : 0,
        },
        (error: Error | null | undefined) => {
          if (error) console.error('QR Code generation error:', error);
        }
      );
    }
  }, [value, size, level, includeMargin]);

  return <canvas ref={canvasRef} />;
}
