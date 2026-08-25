import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { EventConfig, Participant } from '../types';
import { 
  Camera, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Keyboard, 
  UserCheck, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  X,
  SwitchCamera,
  Upload,
  Zap,
  ZapOff,
  Image as ImageIcon
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';

interface QRScannerModalProps {
  participants: Participant[];
  config: EventConfig;
  onCheckInParticipant: (id: string) => Participant | null;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  participants,
  config,
  onCheckInParticipant,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Manual code input state
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Verification result state
  const [verificationResult, setVerificationResult] = useState<{
    status: 'success' | 'already_attended' | 'not_found';
    participant?: Participant;
    message: string;
    scannedCode: string;
    timestamp: string;
  } | null>(null);

  // Recent scans feed
  const [recentScans, setRecentScans] = useState<Array<{
    participant: Participant;
    scannedAt: string;
    isDuplicate: boolean;
  }>>([]);

  // Audio Beep Generator using Web Audio API
  const playBeep = useCallback((type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08); // E6
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Audio playback failsafe
    }
  }, [soundEnabled]);

  // Extract ID from raw scanned text
  const extractCode = (raw: string): string => {
    if (!raw) return '';
    const trimmed = raw.trim();

    // Check if it is a JSON object with 'id'
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.id) return String(parsed.id).trim();
      } catch {}
    }

    // Check if it is a URL with ID parameter
    if (trimmed.includes('http://') || trimmed.includes('https://')) {
      try {
        const url = new URL(trimmed);
        const idParam = url.searchParams.get('id') || url.searchParams.get('ticket') || url.searchParams.get('code');
        if (idParam) return idParam.trim();
        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length > 0) return segments[segments.length - 1].trim();
      } catch {}
    }

    return trimmed;
  };

  // Process a Scanned Code (from camera, image, or manual input)
  const processCode = useCallback((rawCode: string) => {
    if (!rawCode || isProcessing) return;
    const cleanCode = extractCode(rawCode).toUpperCase();
    if (!cleanCode) return;

    setIsProcessing(true);

    // Look up by ID, WhatsApp number, or Exact Child Name
    const existing = participants.find(
      (p) =>
        p.id.toUpperCase() === cleanCode ||
        p.whatsappNumber.replace(/\D/g, '').includes(cleanCode.replace(/\D/g, '')) ||
        p.childName.trim().toUpperCase() === cleanCode
    );

    const nowStr = new Date().toLocaleTimeString('id-ID');

    if (!existing) {
      playBeep('error');
      setVerificationResult({
        status: 'not_found',
        message: `ID "${cleanCode}" tidak ditemukan di data peserta.`,
        scannedCode: cleanCode,
        timestamp: nowStr,
      });
      setTimeout(() => setIsProcessing(false), 1400);
      return;
    }

    if (existing.attendanceStatus === 'hadir') {
      playBeep('warning');
      setVerificationResult({
        status: 'already_attended',
        participant: existing,
        message: `Ananda sudah diverifikasi hadir sebelumnya.`,
        scannedCode: cleanCode,
        timestamp: nowStr,
      });

      setRecentScans((prev) => [
        { participant: existing, scannedAt: nowStr, isDuplicate: true },
        ...prev.filter(item => item.participant.id !== existing.id).slice(0, 6),
      ]);
      setTimeout(() => setIsProcessing(false), 1400);
      return;
    }

    // New valid attendance
    const updated = onCheckInParticipant(existing.id);
    playBeep('success');
    triggerConfetti();

    const finalParticipant = updated || {
      ...existing,
      attendanceStatus: 'hadir',
      attendedAt: new Date().toISOString(),
    };

    setVerificationResult({
      status: 'success',
      participant: finalParticipant,
      message: 'Presensi Kehadiran Berhasil Diverifikasi!',
      scannedCode: cleanCode,
      timestamp: nowStr,
    });

    setRecentScans((prev) => [
      { participant: finalParticipant, scannedAt: nowStr, isDuplicate: false },
      ...prev.filter(item => item.participant.id !== finalParticipant.id).slice(0, 6),
    ]);

    setTimeout(() => setIsProcessing(false), 1400);
  }, [isProcessing, participants, playBeep, onCheckInParticipant]);

  // Start Camera Stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    try {
      setCameraError(null);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      let stream: MediaStream | null = null;
      try {
        // Try ideal constraints first
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback to generic video
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (stream && videoRef.current) {
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);

        // Check if torch/flashlight is supported
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : null;
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      }
    } catch (err: any) {
      console.warn('Camera stream initialisation notice:', err);
      setCameraError(
        'Kamera tidak dapat diakses atau izin kamera ditolak. Silakan izinkan kamera di browser atau gunakan tombol "Unggah Foto QR" / input manual di bawah.'
      );
      setCameraActive(false);
    }
  }, []);

  // Toggle Front/Back Camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Torch constraint error:', e);
      }
    }
  };

  // Setup Continuous QR Decoding Loop
  useEffect(() => {
    startCamera(facingMode);

    let animationFrameId: number;
    let barcodeDetector: any = null;

    // Initialize native BarcodeDetector if available
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch {}
    }

    const scanFrame = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        canvasRef.current &&
        !isProcessing
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // 1. Try Native BarcodeDetector first (super fast hardware decoding)
          let detected = false;
          if (barcodeDetector) {
            try {
              const barcodes = await barcodeDetector.detect(canvas);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                processCode(barcodes[0].rawValue);
                detected = true;
              }
            } catch {}
          }

          // 2. Failsafe: Fallback to jsQR
          if (!detected) {
            try {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
              });

              if (code && code.data) {
                processCode(code.data);
              }
            } catch {}
          }
        }
      }

      animationFrameId = requestAnimationFrame(scanFrame);
    };

    animationFrameId = requestAnimationFrame(scanFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode, isProcessing, processCode, startCamera]);

  // Decode QR from uploaded image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          processCode(code.data);
        } else {
          playBeep('error');
          setVerificationResult({
            status: 'not_found',
            message: 'QR Code tidak terdeteksi pada gambar yang diunggah. Pastikan gambar jelas.',
            scannedCode: file.name,
            timestamp: new Date().toLocaleTimeString('id-ID'),
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processCode(manualCode.trim());
    setManualCode('');
  };

  return (
    <div 
      id="qr-scanner-overlay" 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      <div 
        id="qr-scanner-modal" 
        className="bg-slate-900 border border-slate-800 text-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Scanner Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold tracking-tight text-white font-display">
                  Scanner Presensi Kehadiran
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Scanner
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Arahkan QR Code peserta ke kamera atau pilih foto QR untuk verifikasi otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Front/Back Camera Switcher */}
            <button
              onClick={toggleFacingMode}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Ganti Kamera Depan/Belakang"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>

            {/* Flashlight Torch if supported */}
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  torchOn
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title={torchOn ? 'Matikan Lampu Flash' : 'Nyalakan Lampu Flash'}
              >
                {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 border-slate-700 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={soundEnabled ? 'Suara Beep Aktif' : 'Suara Beep Nonaktif'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Tutup Scanner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scanner Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6">
          
          {/* Left Column: Camera Viewfinder & Actions (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Camera Frame */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
              
              {/* Hidden Canvas for QR decoding */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Video Feed */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />

              {/* Scanning Target Laser Reticle */}
              {cameraActive && !cameraError && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-52 h-52 sm:w-60 sm:h-60 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    {/* Reticle Corners */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />
                    
                    {/* Animated Scanning Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {/* Camera Error / Blocked State */}
              {cameraError && (
                <div className="p-6 text-center max-w-sm z-10 bg-slate-900/90 rounded-2xl m-4 border border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-300 mb-3">{cameraError}</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Coba Buka Kamera Lagi</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pilih Foto QR dari Galeri</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-20">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400 shadow-xl">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menganalisis QR Code...</span>
                  </div>
                </div>
              )}

            </div>

            {/* Upload QR File and Manual Bar */}
            <div className="space-y-2">
              <div className="flex gap-2">
                {/* Hidden File Input for scanning from Gallery/File */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  title="Pilih gambar atau screenshot QR Code dari galeri HP / file laptop"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Unggah Foto QR</span>
                  <span className="sm:hidden">Foto QR</span>
                </button>

                {/* Manual Code Input Bar */}
                <form onSubmit={handleManualSubmit} className="flex-1 flex gap-1.5">
                  <div className="relative flex-1">
                    <Keyboard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="scanner-manual-code-input"
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Ketik ID (cth: KJN-IKH-1001)..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-xs focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-3 sm:px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Verifikasi
                  </button>
                </form>
              </div>

              {/* Quick Test Demo Codes */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 pt-1">
                <span className="text-[11px] text-slate-500">Klik Tes Cepat:</span>
                {participants.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => processCode(p.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                      p.attendanceStatus === 'hadir'
                        ? 'bg-slate-800 text-slate-500 line-through'
                        : 'bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60'
                    }`}
                  >
                    {p.id} ({p.childName.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Verification Result Card & Live Feed (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Live Verification Result Box */}
            {verificationResult ? (
              <div 
                className={`p-4 sm:p-5 rounded-2xl border transition-all animate-in fade-in zoom-in-95 duration-150 ${
                  verificationResult.status === 'success'
                    ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-100'
                    : verificationResult.status === 'already_attended'
                    ? 'bg-amber-950/50 border-amber-500/70 text-amber-100'
                    : 'bg-rose-950/50 border-rose-500/70 text-rose-100'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {verificationResult.status === 'success' && (
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}
                  {verificationResult.status === 'already_attended' && (
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  )}
                  {verificationResult.status === 'not_found' && (
                    <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 font-bold">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
                      {verificationResult.status === 'success'
                        ? 'PRESENSI BERHASIL'
                        : verificationResult.status === 'already_attended'
                        ? 'SUDAH HADIR SEBELUMNYA'
                        : 'KODE TIDAK DITEMUKAN'}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-white mt-0.5">
                      {verificationResult.message}
                    </h3>
                  </div>
                </div>

                {verificationResult.participant && (
                  <div className="space-y-2.5 pt-3 border-t border-white/10 text-xs text-slate-300">
                    <div>
                      <span className="text-[11px] text-slate-400">Nama Ananda:</span>
                      <p className="font-bold text-base text-white">
                        {verificationResult.participant.childName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {verificationResult.participant.gender === 'ikhwan' ? 'Ikhwan' : 'Akhwat'} • {verificationResult.participant.age} Tahun • {verificationResult.participant.domicile}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5 text-[11px]">
                      <div>
                        <span className="text-slate-400">Orang Tua:</span>
                        <p className="font-semibold text-white truncate">{verificationResult.participant.parentName}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">ID Tiket:</span>
                        <p className="font-mono font-bold text-emerald-400">{verificationResult.participant.id}</p>
                      </div>
                    </div>

                    {verificationResult.participant.notes && (
                      <p className="text-[11px] text-amber-300/90 italic">
                        Catatan: {verificationResult.participant.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-800/30 text-center text-slate-400">
                <QrCode className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-sm text-slate-300">Siap Memindai QR Code</p>
                <p className="text-xs text-slate-500 mt-1">
                  Arahkan kamera ke QR Code tiket peserta di HP atau kertas untuk verifikasi instan.
                </p>
              </div>
            )}

            {/* Recent Check-Ins Feed */}
            <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Presensi Terkini
                </span>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {participants.filter((p) => p.attendanceStatus === 'hadir').length} Hadir Total
                </span>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {recentScans.length > 0 ? (
                  recentScans.map((item, idx) => (
                    <div
                      key={`${item.participant.id}-${idx}`}
                      className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-200">{item.participant.childName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{item.participant.id}</p>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.isDuplicate
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}>
                          {item.isDuplicate ? 'Duplikat' : '✓ Hadir'}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.scannedAt}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Belum ada presensi yang dipindai pada sesi scanner ini.
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Kamera & Scanner Presensi Aktif</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
