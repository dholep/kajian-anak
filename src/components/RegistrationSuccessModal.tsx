import React, { useEffect } from 'react';
import { QRCodeDisplay } from './QRCodeDisplay';
import { triggerConfetti } from '../utils/confetti';
import { EventConfig, Participant } from '../types';
import { 
  CheckCircle2, 
  Send, 
  Printer, 
  Download, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Copy, 
  Share2, 
  X,
  Sparkles,
  QrCode
} from 'lucide-react';
import { generateWhatsAppMessage, getWhatsAppDirectUrl } from '../utils/whatsapp';

interface RegistrationSuccessModalProps {
  participant: Participant;
  config: EventConfig;
  onClose: () => void;
  onRegisterAnother: () => void;
}

export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  participant,
  config,
  onClose,
  onRegisterAnother,
}) => {
  useEffect(() => {
    // Trigger confetti celebration on successful registration
    triggerConfetti();
  }, []);

  const [copied, setCopied] = React.useState(false);
  const waMessage = generateWhatsAppMessage(participant, config);
  const waUrl = getWhatsAppDirectUrl(participant, config);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="registration-success-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div 
        id="registration-success-modal"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Top Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            id="close-success-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs border border-white/30">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold text-xs mb-1">
                Pendaftaran Berhasil!
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display text-white">
                Tiket & Konfirmasi Pendaftaran
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm">
                Alhamdulillah, data ananda telah tersimpan dalam sistem.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* E-Ticket Box */}
          <div 
            id="printable-e-ticket"
            className="bg-slate-50 border-2 border-dashed border-emerald-300 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xs"
          >
            {/* Ticket Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4 gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded">
                  E-TICKET KAJIAN ANAK
                </span>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-1">
                  {config.eventName}
                </h3>
                <p className="text-xs text-slate-700 italic">
                  "{config.eventTheme}"
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-700 font-medium">Kode Registrasi</span>
                <div className="font-mono font-extrabold text-sm sm:text-base text-emerald-800 bg-white px-2.5 py-1 rounded border border-emerald-300 shadow-xs">
                  {participant.id}
                </div>
              </div>
            </div>

            {/* Ticket Body & QR Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              
              {/* Participant Details */}
              <div className="sm:col-span-2 space-y-3 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-700 text-xs">Nama Lengkap Ananda:</span>
                  <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                    {participant.childName}
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      participant.gender === 'ikhwan' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-pink-100 text-pink-700'
                    }`}>
                      {participant.gender === 'ikhwan' ? 'Ikhwan' : 'Akhwat'} • {participant.age} thn
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-700">Orang Tua / Wali:</span>
                    <p className="font-semibold text-slate-800">{participant.parentName}</p>
                  </div>
                  <div>
                    <span className="text-slate-700">Domisili:</span>
                    <p className="font-semibold text-slate-800">{participant.domicile}</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span><strong>{config.date}</strong> ({config.time})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="truncate">{config.location}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Presentation */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs text-center">
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <QRCodeDisplay 
                    value={participant.id} 
                    size={110}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-700 mt-1.5">
                  {participant.id}
                </span>
                <span className="text-[10px] text-slate-700 mt-0.5 flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-emerald-700" /> Scan saat hadir
                </span>
              </div>
            </div>

            {/* Ticket Footer Notes */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-700">
              <span>*Tunjukkan tiket & QR Code ini di meja registrasi panitia.</span>
              <span className="font-mono text-[10px]">{new Date(participant.registeredAt).toLocaleDateString('id-ID')}</span>
            </div>
          </div>

          {/* WhatsApp Notification Center */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Konfirmasi Notifikasi WhatsApp
                  </h4>
                  <p className="text-xs text-slate-600">
                    Kirim rincian pendaftaran & tiket langsung ke WhatsApp orang tua ({participant.whatsappNumber})
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                Otomatis / 1-Klik
              </span>
            </div>

            {/* WhatsApp Message Box Preview */}
            <div className="bg-white rounded-lg p-3 border border-emerald-100 text-xs font-sans text-slate-700 whitespace-pre-line max-h-36 overflow-y-auto mb-3 shadow-inner">
              {waMessage}
            </div>

            {/* Actions for WhatsApp */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                id="send-wa-direct-btn"
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Buka & Kirim WhatsApp Sekarang</span>
              </a>

              <button
                id="copy-wa-message-btn"
                onClick={handleCopyMessage}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Teks Tersalin! ✓' : 'Salin Pesan'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="print-ticket-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Tiket / Simpan PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="register-another-child-btn"
              onClick={onRegisterAnother}
              className="px-3.5 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs sm:text-sm font-semibold transition-colors"
            >
              + Daftar Anak Lain
            </button>
            <button
              id="finish-registration-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
