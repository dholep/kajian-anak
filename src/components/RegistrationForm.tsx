import React, { useState } from 'react';
import { EventConfig, Gender, Participant } from '../types';
import { popularDomiciles } from '../data/initialData';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  UserCheck, 
  Sparkles, 
  AlertCircle, 
  Users, 
  ShieldCheck, 
  Check, 
  Lock, 
  HelpCircle, 
  PhoneCall, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { formatIndonesianPhone, normalizeWhatsAppNumber } from '../utils/whatsapp';

interface RegistrationFormProps {
  config: EventConfig;
  participants: Participant[];
  onRegisterSuccess: (participant: Participant) => void;
  onOpenMyTicket: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  config,
  participants,
  onRegisterSuccess,
  onOpenMyTicket,
}) => {
  // Form State
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState<number | ''>(7);
  const [gender, setGender] = useState<Gender | ''>('ikhwan');
  const [parentName, setParentName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedDomicile, setSelectedDomicile] = useState(popularDomiciles[0]);
  const [customDomicile, setCustomDomicile] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Validation & Submit State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quota Calculations
  const ikhwanCount = participants.filter((p) => p.gender === 'ikhwan').length;
  const akhwatCount = participants.filter((p) => p.gender === 'akhwat').length;
  const ikhwanRemaining = Math.max(0, config.ikhwanQuota - ikhwanCount);
  const akhwatRemaining = Math.max(0, config.akhwatQuota - akhwatCount);

  const isIkhwanAvailable = config.isIkhwanOpen && ikhwanRemaining > 0 && config.isGlobalRegistrationOpen;
  const isAkhwatAvailable = config.isAkhwatOpen && akhwatRemaining > 0 && config.isGlobalRegistrationOpen;
  const isAllClosed = !config.isGlobalRegistrationOpen || (!isIkhwanAvailable && !isAkhwatAvailable);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!childName.trim()) {
      errs.childName = 'Nama anak wajib diisi';
    } else if (childName.trim().length < 3) {
      errs.childName = 'Nama anak minimal 3 karakter';
    }

    if (!age || age < 3 || age > 16) {
      errs.age = 'Usia anak antara 3 - 16 tahun';
    }

    if (!gender) {
      errs.gender = 'Pilih jenis kelamin anak';
    } else {
      if (gender === 'ikhwan' && !isIkhwanAvailable) {
        errs.gender = 'Mohon maaf, kuota Ikhwan sudah penuh atau ditutup.';
      }
      if (gender === 'akhwat' && !isAkhwatAvailable) {
        errs.gender = 'Mohon maaf, kuota Akhwat sudah penuh atau ditutup.';
      }
    }

    if (!parentName.trim()) {
      errs.parentName = 'Nama orang tua / wali wajib diisi';
    }

    const cleanPhone = normalizeWhatsAppNumber(whatsappNumber);
    if (!whatsappNumber.trim()) {
      errs.whatsappNumber = 'Nomor WhatsApp wajib diisi untuk kirim tiket';
    } else if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      errs.whatsappNumber = 'Nomor WhatsApp tidak valid (contoh: 081234567890)';
    }

    if (selectedDomicile === 'Lainnya' && !customDomicile.trim()) {
      errs.domicile = 'Tuliskan kota/wilayah asal domisili Anda';
    }

    if (!termsAccepted) {
      errs.terms = 'Anda harus menyetujui ketentuan kajian anak';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const domicileValue = selectedDomicile === 'Lainnya' ? customDomicile.trim() : selectedDomicile;
      
      // Generate Unique Registration Code
      const genderPrefix = gender === 'ikhwan' ? 'IKH' : 'AKH';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newId = `KJN-${genderPrefix}-${randomSuffix}`;

      const newParticipant: Participant = {
        id: newId,
        childName: childName.trim(),
        age: Number(age),
        gender: gender as Gender,
        parentName: parentName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        domicile: domicileValue,
        notes: notes.trim(),
        registeredAt: new Date().toISOString(),
        attendanceStatus: 'belum_hadir',
        notificationStatus: 'terkirim',
      };

      onRegisterSuccess(newParticipant);
      setIsSubmitting(false);

      // Reset form fields
      setChildName('');
      setParentName('');
      setWhatsappNumber('');
      setNotes('');
    }, 450);
  };

  return (
    <div id="registration-section" className="max-w-4xl mx-auto py-6 sm:py-10 px-4">
      
      {/* Event Header Hero Banner */}
      <div className="relative rounded-2xl bg-slate-900 text-white p-6 sm:p-8 shadow-sm overflow-hidden mb-6 border border-slate-800">
        
        {/* Subtle decorative elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3 h-3 text-amber-300" />
              PENDAFTARAN RESMI 2026
            </span>

            <button
              onClick={onOpenMyTicket}
              className="text-xs text-slate-300 hover:text-white underline underline-offset-4 flex items-center gap-1 transition-colors"
            >
              Sudah pernah mendaftar? Cek tiket di sini →
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display mb-2 text-white">
            {config.eventName}
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm mb-5 max-w-2xl font-sans leading-relaxed">
            {config.eventTheme}
          </p>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs sm:text-sm text-slate-200">
            <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Waktu & Tanggal</p>
                <p className="font-semibold text-white">{config.date}</p>
                <p className="text-[11px] text-slate-300">{config.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Lokasi Acara</p>
                <p className="font-semibold text-white truncate">{config.location}</p>
                <p className="text-[11px] text-slate-300">{config.targetAge}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Narasumber / Ustadz</p>
                <p className="font-semibold text-white truncate">{config.speaker.split('&')[0]}</p>
                <p className="text-[11px] text-slate-300">Kisah Sahabat & Dongeng Islami</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Real-Time Quota Status Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700" />
              Status Ketersediaan Kuota Real-Time
            </h2>
            <p className="text-xs text-slate-500">
              Pembatasan kuota otomatis untuk kenyamanan dan ketertiban ruang kajian ananda.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Update Otomatis</span>
          </div>
        </div>

        {/* Quota Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Ikhwan Quota Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            isIkhwanAvailable 
              ? 'bg-indigo-50/40 border-indigo-200/80' 
              : 'bg-slate-100 border-slate-300 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  IKH
                </div>
                <span className="font-bold text-slate-900 text-sm">Peserta Ikhwan (Laki-laki)</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isIkhwanAvailable 
                  ? 'bg-indigo-100 text-indigo-800' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {isIkhwanAvailable ? `Sisa ${ikhwanRemaining} Kursi` : 'Kuota Penuh / Ditutup'}
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden my-2.5">
              <div 
                className={`h-full transition-all duration-500 ${isIkhwanAvailable ? 'bg-indigo-600' : 'bg-slate-400'}`}
                style={{ width: `${Math.min(100, (ikhwanCount / config.ikhwanQuota) * 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-600">
              <span>Terdaftar: <strong>{ikhwanCount}</strong> anak</span>
              <span>Batas Kuota: <strong>{config.ikhwanQuota}</strong></span>
            </div>
          </div>

          {/* Akhwat Quota Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            isAkhwatAvailable 
              ? 'bg-rose-50/40 border-rose-200/80' 
              : 'bg-slate-100 border-slate-300 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                  AKH
                </div>
                <span className="font-bold text-slate-900 text-sm">Peserta Akhwat (Perempuan)</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isAkhwatAvailable 
                  ? 'bg-rose-100 text-rose-800' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {isAkhwatAvailable ? `Sisa ${akhwatRemaining} Kursi` : 'Kuota Penuh / Ditutup'}
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden my-2.5">
              <div 
                className={`h-full transition-all duration-500 ${isAkhwatAvailable ? 'bg-rose-500' : 'bg-slate-400'}`}
                style={{ width: `${Math.min(100, (akhwatCount / config.akhwatQuota) * 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-600">
              <span>Terdaftar: <strong>{akhwatCount}</strong> anak</span>
              <span>Batas Kuota: <strong>{config.akhwatQuota}</strong></span>
            </div>
          </div>

        </div>

        {/* If All Closed Notification */}
        {isAllClosed && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-bold text-rose-900">Pendaftaran Saat Ini Telah Ditutup</p>
              <p className="mt-0.5">
                Alhamdulillah seluruh kuota peserta telah terpenuhi atau registrasi sedang dinonaktifkan oleh panitia.
                Silakan hubungi kontak panitia di <strong>{config.contactPersonPhone}</strong> jika ada pertanyaan.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Registration Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display">
            Formulir Pendaftaran Peserta
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lengkapi data diri ananda dan orang tua dengan benar untuk mendapatkan e-ticket & QR Code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          
          {/* SECTION 1: DATA ANAK */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-wide">Data Ananda (Peserta)</h3>
            </div>

            {/* Nama Lengkap Anak */}
            <div>
              <label htmlFor="child-name-input" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Nama Lengkap Anak <span className="text-rose-500">*</span>
              </label>
              <input
                id="child-name-input"
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Contoh: Muhammad Fatih Al-Faruq"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 transition-colors focus:outline-hidden focus:ring-2 ${
                  errors.childName 
                    ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/30' 
                    : 'border-slate-200 bg-slate-50/30 focus:bg-white focus:border-slate-900 focus:ring-slate-900/10'
                }`}
              />
              {errors.childName && (
                <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.childName}
                </p>
              )}
            </div>

            {/* Usia dan Jenis Kelamin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Usia Anak */}
              <div>
                <label htmlFor="child-age-select" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Usia Anak (Tahun) <span className="text-rose-500">*</span>
                </label>
                <select
                  id="child-age-select"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                >
                  {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
                    <option key={num} value={num}>
                      {num} Tahun
                    </option>
                  ))}
                </select>
                {errors.age && (
                  <p className="text-rose-600 text-xs mt-1">{errors.age}</p>
                )}
              </div>

              {/* Jenis Kelamin (Ikhwan vs Akhwat with Quota Check) */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Jenis Kelamin <span className="text-rose-500">*</span>
                </label>
                
                <div className="grid grid-cols-2 gap-2.5">
                  
                  {/* Option Ikhwan */}
                  <button
                    type="button"
                    id="gender-ikhwan-btn"
                    disabled={!isIkhwanAvailable}
                    onClick={() => setGender('ikhwan')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      gender === 'ikhwan'
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-300'
                        : isIkhwanAvailable
                        ? 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm">Ikhwan</span>
                    <span className="text-[11px] text-slate-500">Laki-laki</span>
                    {!isIkhwanAvailable && (
                      <span className="text-[10px] text-rose-600 font-bold mt-0.5">Penuh</span>
                    )}
                  </button>

                  {/* Option Akhwat */}
                  <button
                    type="button"
                    id="gender-akhwat-btn"
                    disabled={!isAkhwatAvailable}
                    onClick={() => setGender('akhwat')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      gender === 'akhwat'
                        ? 'border-rose-500 bg-rose-50/80 text-rose-950 ring-2 ring-rose-300'
                        : isAkhwatAvailable
                        ? 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm">Akhwat</span>
                    <span className="text-[11px] text-slate-500">Perempuan</span>
                    {!isAkhwatAvailable && (
                      <span className="text-[10px] text-rose-600 font-bold mt-0.5">Penuh</span>
                    )}
                  </button>
                </div>

                {errors.gender && (
                  <p className="text-rose-600 text-xs mt-1">{errors.gender}</p>
                )}
              </div>

            </div>
          </div>

          {/* SECTION 2: DATA ORANG TUA & KONTAK */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-wide">Data Orang Tua & Domisili</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Nama Orang Tua / Wali */}
              <div>
                <label htmlFor="parent-name-input" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Nama Orang Tua / Wali <span className="text-rose-500">*</span>
                </label>
                <input
                  id="parent-name-input"
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Contoh: Hendro Wibowo / Bunda Nurul"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 transition-colors focus:outline-hidden focus:ring-2 ${
                    errors.parentName 
                      ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/30' 
                      : 'border-slate-200 bg-slate-50/30 focus:bg-white focus:border-slate-900 focus:ring-slate-900/10'
                  }`}
                />
                {errors.parentName && (
                  <p className="text-rose-600 text-xs mt-1">{errors.parentName}</p>
                )}
              </div>

              {/* Nomor WhatsApp Aktif */}
              <div>
                <label htmlFor="whatsapp-input" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Nomor WhatsApp Aktif <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-emerald-700 font-semibold">Notifikasi Otomatis</span>
                </label>
                <div className="relative">
                  <input
                    id="whatsapp-input"
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="081234567890"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 transition-colors focus:outline-hidden focus:ring-2 ${
                      errors.whatsappNumber 
                        ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/30' 
                        : 'border-slate-200 bg-slate-50/30 focus:bg-white focus:border-slate-900 focus:ring-slate-900/10'
                    }`}
                  />
                </div>
                {whatsappNumber && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format: {formatIndonesianPhone(whatsappNumber)}
                  </p>
                )}
                {errors.whatsappNumber && (
                  <p className="text-rose-600 text-xs mt-1">{errors.whatsappNumber}</p>
                )}
              </div>

            </div>

            {/* Asal Domisili */}
            <div>
              <label htmlFor="domicile-select" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Asal Domisili / Wilayah <span className="text-rose-500">*</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  id="domicile-select"
                  value={selectedDomicile}
                  onChange={(e) => setSelectedDomicile(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                >
                  {popularDomiciles.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>

                {selectedDomicile === 'Lainnya' && (
                  <input
                    id="custom-domicile-input"
                    type="text"
                    value={customDomicile}
                    onChange={(e) => setCustomDomicile(e.target.value)}
                    placeholder="Ketik nama kota/daerah Anda..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                )}
              </div>
              {errors.domicile && (
                <p className="text-rose-600 text-xs mt-1">{errors.domicile}</p>
              )}
            </div>

            {/* Catatan Khusus / Alergi */}
            <div>
              <label htmlFor="notes-input" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Catatan Khusus Ananda <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                id="notes-input"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Alergi kacang / Butuh pendampingan khusus / Pemalu"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

          </div>

          {/* Terms Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 rounded mt-0.5 text-slate-900 focus:ring-slate-900 border-slate-300"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                Saya menyetujui ananda didaftarkan pada kajian ini, berkomitmen hadir tepat waktu, dan memahami bahwa QR Code tiket akan diverifikasi di meja registrasi.
              </span>
            </label>
            {errors.terms && (
              <p className="text-rose-600 text-xs mt-1">{errors.terms}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              id="submit-registration-btn"
              type="submit"
              disabled={isSubmitting || isAllClosed}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-all ${
                isAllClosed 
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                  : isSubmitting
                  ? 'bg-slate-800 text-white cursor-wait opacity-90'
                  : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses Pendaftaran & Tiket...</span>
                </>
              ) : isAllClosed ? (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Pendaftaran Sedang Ditutup</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Daftarkan Sekarang & Dapatkan Tiket QR Code</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400 mt-2.5 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Data tersimpan aman dan terintegrasi dengan WhatsApp notifikasi otomatis.
            </p>
          </div>

        </form>
      </div>

    </div>
  );
};
