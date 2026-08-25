import React from 'react';
import { ActiveTab, AdminUser, EventConfig, Participant } from '../types';
import { 
  ClipboardPenLine, 
  Search, 
  LayoutDashboard, 
  QrCode, 
  Sparkles, 
  Users, 
  Lock, 
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LogOut,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  config: EventConfig;
  participants: Participant[];
  adminUser?: AdminUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  participants,
  adminUser,
  onLogout,
}) => {
  const ikhwanCount = participants.filter((p) => p.gender === 'ikhwan').length;
  const akhwatCount = participants.filter((p) => p.gender === 'akhwat').length;
  const totalCount = participants.length;
  const maxTotal = config.ikhwanQuota + config.akhwatQuota;

  const isIkhwanFull = ikhwanCount >= config.ikhwanQuota || !config.isIkhwanOpen;
  const isAkhwatFull = akhwatCount >= config.akhwatQuota || !config.isAkhwatOpen;

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Title */}
          <div 
            id="brand-logo-btn"
            onClick={() => setActiveTab('registration')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm group-hover:bg-indigo-700 transition-all duration-200">
              <span className="font-extrabold text-lg">K</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight font-display">
                  KajianAnak <span className="text-indigo-600 font-semibold">Portal</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Sistem Online
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Sistem Pendaftaran & Verifikasi Presensi QR
              </p>
            </div>
          </div>

          {/* Quota Mini Bar (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-slate-600">Total:</span>
              <span className="font-bold text-slate-900">{totalCount}<span className="text-slate-400 font-normal">/{maxTotal}</span></span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-slate-600">Ikhwan:</span>
              <span className={`font-bold ${isIkhwanFull ? 'text-rose-600' : 'text-indigo-600'}`}>
                {ikhwanCount}/{config.ikhwanQuota}
              </span>
              {isIkhwanFull && <Lock className="w-3 h-3 text-rose-500" />}
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-600">Akhwat:</span>
              <span className={`font-bold ${isAkhwatFull ? 'text-rose-600' : 'text-rose-600'}`}>
                {akhwatCount}/{config.akhwatQuota}
              </span>
              {isAkhwatFull && <Lock className="w-3 h-3 text-rose-500" />}
            </div>
          </div>

          {/* Navigation Buttons */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="nav-tab-registration"
              onClick={() => setActiveTab('registration')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'registration'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ClipboardPenLine className="w-4 h-4" />
              <span className="hidden sm:inline">Pendaftaran</span>
              <span className="sm:hidden">Daftar</span>
            </button>

            <button
              id="nav-tab-my-ticket"
              onClick={() => setActiveTab('my-ticket')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'my-ticket'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Cek Tiket</span>
              <span className="sm:hidden">Tiket</span>
            </button>

            <button
              id="nav-tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : adminUser
                  ? 'text-slate-900 bg-slate-100/90 hover:bg-slate-200 border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={adminUser ? `Masuk sebagai ${adminUser.name}` : 'Login Admin diperlukan'}
            >
              {adminUser ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="hidden md:inline">Dasbor Admin</span>
              <span className="md:hidden">Admin</span>
              {adminUser && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>

            <button
              id="nav-tab-scanner"
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-slate-900 text-white shadow-xs ring-2 ring-indigo-500'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span className="font-bold">Scan QR</span>
            </button>

            {adminUser && onLogout && (
              <button
                id="nav-logout-btn"
                onClick={() => {
                  onLogout();
                }}
                className="hidden lg:flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Keluar / Logout Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            )}
          </nav>

        </div>
      </div>
    </header>
  );
};
