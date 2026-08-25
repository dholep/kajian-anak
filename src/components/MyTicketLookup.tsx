import React, { useState } from 'react';
import { EventConfig, Participant } from '../types';
import { QRCodeDisplay } from './QRCodeDisplay';
import { 
  Search, 
  Ticket, 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Send, 
  Printer, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { getWhatsAppDirectUrl } from '../utils/whatsapp';

interface MyTicketLookupProps {
  participants: Participant[];
  config: EventConfig;
  onGoToRegister: () => void;
}

export const MyTicketLookup: React.FC<MyTicketLookupProps> = ({
  participants,
  config,
  onGoToRegister,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Participant | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSelectedTicket(null);
      return;
    }

    const cleanNumber = q.replace(/[^0-9]/g, '');

    const found = participants.find((p) => {
      const matchId = p.id.toLowerCase().includes(q);
      const matchName = p.childName.toLowerCase().includes(q);
      const matchParent = p.parentName.toLowerCase().includes(q);
      const matchPhone = cleanNumber && p.whatsappNumber.replace(/[^0-9]/g, '').includes(cleanNumber);

      return matchId || matchName || matchParent || matchPhone;
    });

    setSelectedTicket(found || null);
  };

  return (
    <div id="my-ticket-lookup-section" className="max-w-3xl mx-auto py-8 px-4">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Ticket className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          Cek Tiket & Status Pendaftaran
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Masukkan Kode Registrasi (ID), Nomor WhatsApp, atau Nama Ananda untuk melihat kembali e-ticket QR Code Anda.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="ticket-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Contoh: KJN-IKH-1001 atau 081289123451 atau Fatih"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/40 text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            />
          </div>

          <button
            id="ticket-search-submit-btn"
            type="submit"
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Cari Tiket</span>
          </button>
        </form>

        {/* Quick search chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
          <span>Contoh cepat:</span>
          {participants.slice(0, 3).map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                setSearchQuery(sample.id);
                setSelectedTicket(sample);
                setHasSearched(true);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] border border-slate-200/80 transition-colors"
            >
              {sample.id} ({sample.childName.split(' ')[0]})
            </button>
          ))}
        </div>
      </div>

      {/* Search Result */}
      {hasSearched && (
        <div>
          {selectedTicket ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Status Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Data Ditemukan!</span> Pendaftaran valid dan aktif terdaftar di sistem.
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedTicket.attendanceStatus === 'hadir'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {selectedTicket.attendanceStatus === 'hadir' ? '✓ Sudah Hadir' : 'Belum Check-In'}
                </span>
              </div>

              {/* Digital E-Ticket Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      TIKET RESMI KAJIAN ANAK
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1.5 font-display">
                      {config.eventName}
                    </h2>
                    <p className="text-xs text-slate-500 italic">
                      "{config.eventTheme}"
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Kode Registrasi</span>
                    <div className="font-mono font-extrabold text-sm sm:text-base text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                      {selectedTicket.id}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  
                  {/* Left Info */}
                  <div className="sm:col-span-2 space-y-3 text-sm">
                    <div>
                      <span className="text-slate-400 text-xs">Nama Peserta:</span>
                      <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {selectedTicket.childName}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          selectedTicket.gender === 'ikhwan' 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {selectedTicket.gender === 'ikhwan' ? 'Ikhwan' : 'Akhwat'} • {selectedTicket.age} thn
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">Orang Tua / Wali:</span>
                        <p className="font-semibold text-slate-800">{selectedTicket.parentName}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Nomor WhatsApp:</span>
                        <p className="font-semibold text-slate-800">{selectedTicket.whatsappNumber}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Domisili:</span>
                        <p className="font-semibold text-slate-800">{selectedTicket.domicile}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Waktu Mendaftar:</span>
                        <p className="font-semibold text-slate-800">
                          {new Date(selectedTicket.registeredAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-700" />
                        <span><strong>{config.date}</strong> ({config.time})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-700" />
                        <span className="truncate">{config.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right QR Code */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-center">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <QRCodeDisplay 
                        value={selectedTicket.id} 
                        size={115}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-900 mt-2">
                      {selectedTicket.id}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Verifikasi Presensi Lokasi
                    </span>
                  </div>

                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={getWhatsAppDirectUrl(selectedTicket, config)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Ulang ke WhatsApp</span>
                  </a>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Tiket</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-100">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Data Pendaftaran Tidak Ditemukan
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Pastikan nomor WhatsApp atau ID Registrasi yang dimasukkan sudah benar. Jika belum mendaftar, silakan isi formulir pendaftaran terlebih dahulu.
              </p>
              <button
                onClick={onGoToRegister}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>Buka Formulir Pendaftaran</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
