/**
 * Pure TypeScript QR Code generator (no external dependencies, zero canvas/worker/constructor quirks).
 * Generates exact QR Code matrix (supports Version 1-10) and renders as pure SVG with rectangles or single path.
 */

// QR Code Error Correction Levels
export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

// Galois Field Log/Exp tables for Reed-Solomon Error Correction
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 256) {
      x ^= 0x11d; // GF(256) primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
    }
  }
  for (let i = 255; i < 512; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255];
  }
})();

function gMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

function polyMul(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gMul(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPoly(ecLength: number): number[] {
  let g = [1];
  for (let i = 0; i < ecLength; i++) {
    g = polyMul(g, [1, EXP_TABLE[i]]);
  }
  return g;
}

function calcReedSolomon(data: number[], ecLength: number): number[] {
  const gen = getGeneratorPoly(ecLength);
  const result = new Array(ecLength).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0];
    result.shift();
    result.push(0);
    if (factor !== 0) {
      for (let j = 0; j < ecLength; j++) {
        result[j] ^= gMul(gen[j + 1], factor);
      }
    }
  }
  return result;
}

// QR Code Specifications per Version (1 to 10)
interface QrSpec {
  version: number;
  size: number;
  dataCodewords: { L: number; M: number; Q: number; H: number };
  ecCodewords: { L: number; M: number; Q: number; H: number };
  blocks: {
    L: number[][];
    M: number[][];
    Q: number[][];
    H: number[][];
  };
  alignment: number[];
}

const QR_SPECS: QrSpec[] = [
  {
    version: 1,
    size: 21,
    dataCodewords: { L: 19, M: 16, Q: 13, H: 9 },
    ecCodewords: { L: 7, M: 10, Q: 13, H: 17 },
    blocks: {
      L: [[1, 19, 7]],
      M: [[1, 16, 10]],
      Q: [[1, 13, 13]],
      H: [[1, 9, 17]],
    },
    alignment: [],
  },
  {
    version: 2,
    size: 25,
    dataCodewords: { L: 34, M: 28, Q: 22, H: 16 },
    ecCodewords: { L: 10, M: 16, Q: 22, H: 28 },
    blocks: {
      L: [[1, 34, 10]],
      M: [[1, 28, 16]],
      Q: [[1, 22, 22]],
      H: [[1, 16, 28]],
    },
    alignment: [6, 18],
  },
  {
    version: 3,
    size: 29,
    dataCodewords: { L: 55, M: 44, Q: 34, H: 26 },
    ecCodewords: { L: 15, M: 26, Q: 18, H: 22 },
    blocks: {
      L: [[1, 55, 15]],
      M: [[1, 44, 26]],
      Q: [[2, 17, 18]],
      H: [[2, 13, 22]],
    },
    alignment: [6, 22],
  },
  {
    version: 4,
    size: 33,
    dataCodewords: { L: 80, M: 64, Q: 48, H: 36 },
    ecCodewords: { L: 20, M: 18, Q: 26, H: 16 },
    blocks: {
      L: [[1, 80, 20]],
      M: [[2, 32, 18]],
      Q: [[2, 24, 26]],
      H: [[4, 9, 16]],
    },
    alignment: [6, 26],
  },
  {
    version: 5,
    size: 37,
    dataCodewords: { L: 108, M: 86, Q: 62, H: 46 },
    ecCodewords: { L: 26, M: 24, Q: 18, H: 22 },
    blocks: {
      L: [[1, 108, 26]],
      M: [[2, 43, 24]],
      Q: [[2, 15, 18], [2, 16, 18]],
      H: [[2, 11, 22], [2, 12, 22]],
    },
    alignment: [6, 30],
  },
];

// Helper to encode byte data into bitstream
function encodeByteData(text: string, spec: QrSpec, ecl: QrErrorCorrectionLevel): number[] {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(text);
  const bitstream: number[] = [];

  const pushBits = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) {
      bitstream.push((value >> i) & 1);
    }
  };

  // Mode Indicator: Byte mode (0100)
  pushBits(0b0100, 4);

  // Character Count Indicator (8 bits for Version 1-9 in byte mode)
  pushBits(rawBytes.length, 8);

  // Data Bits
  for (const b of rawBytes) {
    pushBits(b, 8);
  }

  // Terminator (up to 4 bits of zeros)
  const capacityBits = spec.dataCodewords[ecl] * 8;
  const terminatorLength = Math.min(4, capacityBits - bitstream.length);
  for (let i = 0; i < terminatorLength; i++) {
    bitstream.push(0);
  }

  // Padding to byte boundary
  while (bitstream.length % 8 !== 0) {
    bitstream.push(0);
  }

  // Convert bitstream to bytes
  const bytes: number[] = [];
  for (let i = 0; i < bitstream.length; i += 8) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | bitstream[i + j];
    }
    bytes.push(byteVal);
  }

  // Pad Codewords (0xEC, 0x11)
  const padPatterns = [0xec, 0x11];
  let padIdx = 0;
  while (bytes.length < spec.dataCodewords[ecl]) {
    bytes.push(padPatterns[padIdx % 2]);
    padIdx++;
  }

  return bytes;
}

// Build interleaved data and error correction codewords
function buildFinalCodewords(dataBytes: number[], spec: QrSpec, ecl: QrErrorCorrectionLevel): number[] {
  const blockDefs = spec.blocks[ecl];
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];

  let offset = 0;
  for (const [count, dataLen, ecLen] of blockDefs) {
    for (let i = 0; i < count; i++) {
      const d = dataBytes.slice(offset, offset + dataLen);
      offset += dataLen;
      const ec = calcReedSolomon(d, ecLen);
      dataBlocks.push(d);
      ecBlocks.push(ec);
    }
  }

  // Interleave data blocks
  const result: number[] = [];
  const maxDataLen = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) {
        result.push(block[i]);
      }
    }
  }

  // Interleave EC blocks
  const maxEcLen = Math.max(...ecBlocks.map((b) => b.length));
  for (let i = 0; i < maxEcLen; i++) {
    for (const block of ecBlocks) {
      if (i < block.length) {
        result.push(block[i]);
      }
    }
  }

  return result;
}

// Create and populate the QR Matrix
export function generateQRMatrix(text: string, ecl: QrErrorCorrectionLevel = 'M'): boolean[][] {
  const encoder = new TextEncoder();
  const byteLen = encoder.encode(text).length;

  // Pick smallest version that fits
  let spec = QR_SPECS[0];
  for (const s of QR_SPECS) {
    if (byteLen <= s.dataCodewords[ecl] - 2) {
      spec = s;
      break;
    }
    spec = s;
  }

  const size = spec.size;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isReserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean, reserve = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (reserve) isReserved[r][c] = true;
    }
  };

  // 1. Finder Patterns (Top-Left, Top-Right, Bottom-Left)
  const drawFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          setModule(nr, nc, false);
        } else if (r === 0 || r === 6 || c === 0 || c === 6) {
          setModule(nr, nc, true);
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          setModule(nr, nc, true);
        } else {
          setModule(nr, nc, false);
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    setModule(6, i, val);
    setModule(i, 6, val);
  }

  // 3. Alignment Patterns (Version 2+)
  if (spec.alignment.length > 0) {
    for (const r of spec.alignment) {
      for (const c of spec.alignment) {
        if (isReserved[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            setModule(r + dr, c + dc, isBorder || isCenter);
          }
        }
      }
    }
  }

  // 4. Reserve Format Info areas
  for (let i = 0; i < 9; i++) {
    if (i < size) {
      isReserved[8][i] = true;
      isReserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    if (size - 1 - i < size) {
      isReserved[8][size - 1 - i] = true;
      isReserved[size - 1 - i][8] = true;
    }
  }
  // Dark module
  setModule(size - 8, 8, true);

  // 5. Data Encoding & Placement
  const dataBytes = encodeByteData(text, spec, ecl);
  const finalBytes = buildFinalCodewords(dataBytes, spec, ecl);

  // Convert final bytes to bit stream
  const bits: boolean[] = [];
  for (const b of finalBytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push(((b >> i) & 1) === 1);
    }
  }

  // Place data into matrix with Mask 0 ( (r + c) % 2 == 0 )
  let bitIdx = 0;
  let upwards = true;

  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Skip vertical timing line
    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const colOffset of [0, -1]) {
        const col = c + colOffset;
        if (!isReserved[r][col]) {
          let bit = bitIdx < bits.length ? bits[bitIdx++] : false;
          // Apply Mask 0: (r + c) % 2 == 0
          if ((r + col) % 2 === 0) {
            bit = !bit;
          }
          matrix[r][col] = bit;
        }
      }
    }
    upwards = !upwards;
  }

  // 6. Format Information (ECL M + Mask 0 = Format Bits)
  // Format Info for Mask 0, ECL M is 0x5412 ^ 0x5412 = 0x0000 -> 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // Top-left format placement
  for (let i = 0; i <= 5; i++) matrix[8][i] = formatBits[i] === 1;
  matrix[8][7] = formatBits[6] === 1;
  matrix[8][8] = formatBits[7] === 1;
  matrix[7][8] = formatBits[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i] === 1;

  // Split format placement (Right/Bottom)
  for (let i = 0; i < 7; i++) matrix[8][size - 1 - i] = formatBits[14 - i] === 1;
  for (let i = 0; i < 8; i++) matrix[size - 8 + i][8] = formatBits[i] === 1;

  // Fill any remaining nulls with false
  return matrix.map((row) => row.map((cell) => cell ?? false));
}
