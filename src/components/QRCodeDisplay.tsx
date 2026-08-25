import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  level?: QrErrorCorrectionLevel;
  className?: string;
  fgColor?: string;
  bgColor?: string;
  includeMargin?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 140,
  level = 'M',
  className = '',
  fgColor = '#0f172a',
  bgColor = '#ffffff',
  includeMargin = true,
}) => {
  return (
    <div className={`inline-block bg-white p-1 rounded-lg ${className}`}>
      <QRCodeSVG
        value={value || 'KAJIAN-ANAK'}
        size={size}
        level={level}
        fgColor={fgColor}
        bgColor={bgColor}
        includeMargin={includeMargin}
        className="block max-w-full h-auto"
      />
    </div>
  );
};
