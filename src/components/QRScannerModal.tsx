import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { EventConfig, Participant } from '../types';
import { 
  Camera, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Keyboard, 
  Sparkles, 
  UserCheck, 
  Clock, 
  Phone, 
  MapPin, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  X,
  Printer,
  ChevronRight
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

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  // Audio Beep Generator using Web Audio API (gracefully protected)
  const playBeep = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      
      let ctx: AudioContext | null = null;
      try {
        ctx = new AudioContextClass();
      } catch {
        return;
      }
      if (!ctx) return;

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
      // Ignore audio context errors if blocked by browser policy
    }
  };

  // Process a Scanned Code (from camera or manual input)
  const processCode = (rawCode: string) => {
    if (!rawCode || isProcessing) return;
    const cleanCode = rawCode.trim().toUpperCase();

    setIsProcessing(true);

    const existing = participants.find(
      (p) => p.id.toUpperCase() === cleanCode || p.whatsappNumber.includes(cleanCode)
    );

    const nowStr = new Date().toLocaleTimeString('id-ID');

    if (!existing) {
      playBeep('error');
      setVerificationResult({
        status: 'not_found',
        message: `ID "${cleanCode}" tidak terdaftar di sistem.`,
        scannedCode: cleanCode,
        timestamp: nowStr,
      });
      setTimeout(() => setIsProcessing(false), 1200);
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
        ...prev.slice(0, 7),
      ]);
      setTimeout(() => setIsProcessing(false), 1200);
      return;
    }

    // New valid attendance!
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
      ...prev.slice(0, 7),
    ]);

    setTimeout(() => setIsProcessing(false), 1200);
  };

  // Setup Camera Stream and Frame Processor
  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setCameraActive(true);
          scanFrame();
        }
      } catch (err: any) {
        console.warn('Camera access error:', err);
        setCameraError(
          'Akses kamera tidak tersedia atau diblokir. Anda dapat menggunakan input kode manual di bawah.'
        );
        setCameraActive(false);
      }
    };

    const scanFrame = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data && !isProcessing) {
            processCode(code.data);
          }
        }
      }

      animationFrameId = requestAnimationFrame(scanFrame);
    };

    startCamera();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processCode(manualCode.trim());
    setManualCode('');
  };

  return (
    <div 
      id="qr-scanner-overlay" 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div 
        id="qr-scanner-modal" 
        className="bg-slate-900 border border-slate-800 text-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Scanner Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display">
                  Scanner Presensi Kehadiran
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Scanner
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Arahkan QR Code peserta ke kamera atau ketik ID registrasi untuk verifikasi otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-slate-800 border-slate-700 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={soundEnabled ? 'Suara Beep Aktif' : 'Suara Beep Nonaktif'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Tutup Scanner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scanner Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6">
          
          {/* Left Column: Camera Viewfinder & Manual Input (7 Cols) */}
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
              />

              {/* Laser Target Scanning Reticle */}
              {cameraActive && !cameraError && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                    {/* Reticle Corner Marks */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />
                    
                    {/* Animated Scanning Beam */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {/* Camera Error / Fallback State */}
              {cameraError && (
                <div className="p-6 text-center max-w-sm">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-300 mb-2">{cameraError}</p>
                  <p className="text-[11px] text-slate-500">
                    Gunakan kolom input ID manual di bawah untuk mencatat kehadiran.
                  </p>
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menganalisis Kode...</span>
                  </div>
                </div>
              )}

            </div>

            {/* Manual Code Input Bar */}
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Keyboard className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="scanner-manual-code-input"
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ketik ID (cth: KJN-IKH-1001) atau No. WA..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
              >
                Cek / Hadir
              </button>
            </form>

            {/* Quick Test Codes */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[11px]">Tes Cepat:</span>
              {participants.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => processCode(p.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    p.attendanceStatus === 'hadir'
                      ? 'bg-slate-800 text-slate-500 line-through'
                      : 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50'
                  }`}
                >
                  {p.id} ({p.childName.split(' ')[0]})
                </button>
              ))}
            </div>

          </div>

          {/* Right Column: Verification Result Card & Recent Feed (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Live Verification Result Box */}
            {verificationResult ? (
              <div 
                className={`p-5 rounded-2xl border transition-all animate-in fade-in zoom-in-95 duration-150 ${
                  verificationResult.status === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100'
                    : verificationResult.status === 'already_attended'
                    ? 'bg-amber-950/40 border-amber-500/60 text-amber-100'
                    : 'bg-rose-950/40 border-rose-500/60 text-rose-100'
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
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                      {verificationResult.status === 'success'
                        ? 'VERIFIKASI BERHASIL'
                        : verificationResult.status === 'already_attended'
                        ? 'SUDAH TERCATAT HADIR'
                        : 'KODE TIDAK VALID'}
                    </span>
                    <h3 className="font-bold text-base text-white">
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
                        <p className="font-semibold text-white">{verificationResult.participant.parentName}</p>
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
                <p className="font-semibold text-sm text-slate-300">Menunggu Pemindaian QR Code</p>
                <p className="text-xs text-slate-500 mt-1">
                  Posisikan QR Code di tengah kotak scanner kamera untuk verifikasi instan.
                </p>
              </div>
            )}

            {/* Recent Check-Ins Feed */}
            <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Presensi Terakhir
                </span>
                <span className="text-[11px] text-slate-500">
                  {participants.filter((p) => p.attendanceStatus === 'hadir').length} Hadir Total
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
                    Belum ada presensi yang discan pada sesi scanner ini.
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
            <span>Kamera & Scanner Siap</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            Selesai & Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
