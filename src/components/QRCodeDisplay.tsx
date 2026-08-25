import React, { useMemo } from 'react';
import { generateQRMatrix, QrErrorCorrectionLevel } from '../utils/qrEncoder';

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
  const matrix = useMemo(() => {
    const validLevel: QrErrorCorrectionLevel = (level === 'L' || level === 'Q' || level === 'H') ? level : 'M';
    try {
      return generateQRMatrix(value || 'N/A', validLevel);
    } catch {
      // Fallback matrix if encoding fails
      return generateQRMatrix('DEMO', 'M');
    }
  }, [value, level]);

  const moduleCount = matrix.length;
  const margin = includeMargin ? 2 : 0;
  const viewBoxSize = moduleCount + margin * 2;

  // Build SVG Path to draw all black modules in a single path for high performance
  const pathData = useMemo(() => {
    let d = '';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (matrix[r][c]) {
          const x = c + margin;
          const y = r + margin;
          d += `M${x},${y}h1v1h-1z `;
        }
      }
    }
    return d;
  }, [matrix, moduleCount, margin]);

  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      className={`block ${className}`}
      style={{ shapeRendering: 'crispEdges' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
      <path d={pathData} fill={fgColor} />
    </svg>
  );
};
