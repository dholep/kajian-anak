import React, { useState } from 'react';
import { AdminUser, EventConfig, Gender, Participant } from '../types';
import { 
  Users, 
  Settings, 
  BarChart3, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Send, 
  QrCode, 
  Trash2, 
  Edit, 
  Lock, 
  Unlock, 
  RefreshCw, 
  ChevronDown,
  ArrowUpDown,
  Phone,
  Calendar,
  Save,
  Check,
  AlertTriangle,
  LogOut,
  KeyRound,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { exportParticipantsToCSV, printAttendanceSheet } from '../utils/export';
import { getWhatsAppDirectUrl } from '../utils/whatsapp';
import { changeAdminPassword } from '../utils/auth';
import { DemographicsAnalytics } from './DemographicsAnalytics';
import { QRCodeDisplay } from './QRCodeDisplay';

interface AdminDashboardProps {
  participants: Participant[];
  config: EventConfig;
  adminUser?: AdminUser | null;
  onLogout?: () => void;
  onUpdateParticipants: (participants: Participant[]) => void;
  onUpdateConfig: (config: EventConfig) => void;
  onOpenScanner: () => void;
  onResetDefaults: () => void;
}

type AdminSubTab = 'recap' | 'quota' | 'analytics' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  participants,
  config,
  adminUser,
  onLogout,
  onUpdateParticipants,
  onUpdateConfig,
  onOpenScanner,
  onResetDefaults,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('recap');

  // Search & Filter State for Spreadsheet View
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'ikhwan' | 'akhwat'>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'hadir' | 'belum_hadir'>('all');
  const [domicileFilter, setDomicileFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'registeredAt' | 'childName' | 'age' | 'attendanceStatus'>('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selected participant for QR Modal / Edit Modal
  const [viewTicketParticipant, setViewTicketParticipant] = useState<Participant | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Participant Form State (Manual Walk-In)
  const [newChildName, setNewChildName] = useState('');
  const [newAge, setNewAge] = useState(7);
  const [newGender, setNewGender] = useState<Gender>('ikhwan');
  const [newParentName, setNewParentName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDomicile, setNewDomicile] = useState('Jakarta Selatan');
  const [newNotes, setNewNotes] = useState('');

  // Editable Event Settings State
  const [editConfig, setEditConfig] = useState<EventConfig>(config);
  const [savedNotice, setSavedNotice] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clear all data confirmation modal state
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (!currentPassword) {
      setPasswordNotice({ type: 'error', text: 'Masukkan password saat ini.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordNotice({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    const result = changeAdminPassword(currentPassword, newPassword);
    if (result.success) {
      setPasswordNotice({ type: 'success', text: result.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordNotice(null), 4000);
    } else {
      setPasswordNotice({ type: 'error', text: result.message });
    }
  };

  // Quota counts
  const ikhwanCount = participants.filter((p) => p.gender === 'ikhwan').length;
  const akhwatCount = participants.filter((p) => p.gender === 'akhwat').length;
  const totalCount = participants.length;
  const attendedCount = participants.filter((p) => p.attendanceStatus === 'hadir').length;

  // Toggle Attendance
  const handleToggleAttendance = (id: string) => {
    const updated = participants.map((p) => {
      if (p.id === id) {
        const isNowAttended = p.attendanceStatus !== 'hadir';
        return {
          ...p,
          attendanceStatus: isNowAttended ? ('hadir' as const) : ('belum_hadir' as const),
          attendedAt: isNowAttended ? new Date().toISOString() : undefined,
        };
      }
      return p;
    });
    onUpdateParticipants(updated);
  };

  // Delete Participant
  const handleDeleteParticipant = (id: string) => {
    const updated = participants.filter((p) => p.id !== id);
    onUpdateParticipants(updated);
  };

  // Clear All Participants
  const handleClearAllParticipants = () => {
    onUpdateParticipants([]);
    setIsClearAllModalOpen(false);
  };

  // Handle Manual Walk-In Add
  const handleAddManualParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim() || !newParentName.trim() || !newPhone.trim()) {
      alert('Mohon lengkapi nama anak, orang tua, dan nomor WA');
      return;
    }

    const genderPrefix = newGender === 'ikhwan' ? 'IKH' : 'AKH';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `KJN-${genderPrefix}-${randomSuffix}`;

    const created: Participant = {
      id: newId,
      childName: newChildName.trim(),
      age: Number(newAge),
      gender: newGender,
      parentName: newParentName.trim(),
      whatsappNumber: newPhone.trim(),
      domicile: newDomicile,
      notes: newNotes.trim() ? `[Walk-in] ${newNotes.trim()}` : '[Walk-in Panitia]',
      registeredAt: new Date().toISOString(),
      attendanceStatus: 'hadir', // Walk-in is present immediately
      attendedAt: new Date().toISOString(),
      notificationStatus: 'terkirim',
    };

    onUpdateParticipants([created, ...participants]);
    setIsAddModalOpen(false);
    // Reset form
    setNewChildName('');
    setNewParentName('');
    setNewPhone('');
    setNewNotes('');
  };

  // Handle Edit Participant
  const handleSaveEditParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;

    const updated = participants.map((p) =>
      p.id === editingParticipant.id ? editingParticipant : p
    );
    onUpdateParticipants(updated);
    setEditingParticipant(null);
  };

  // Save Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(editConfig);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Filter & Sort Logic
  const filteredParticipants = participants
    .filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        p.childName.toLowerCase().includes(q) ||
        p.parentName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.whatsappNumber.includes(q) ||
        p.domicile.toLowerCase().includes(q);

      const matchGender = genderFilter === 'all' || p.gender === genderFilter;
      const matchAttendance =
        attendanceFilter === 'all' || p.attendanceStatus === attendanceFilter;
      const matchDomicile = domicileFilter === 'all' || p.domicile === domicileFilter;

      return matchSearch && matchGender && matchAttendance && matchDomicile;
    })
    .sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

  // Unique Domiciles for filter
  const uniqueDomiciles = Array.from(new Set(participants.map((p) => p.domicile)));

  return (
    <div id="admin-dashboard-container" className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Header & Fast Toggles */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                ADMIN PANEL
              </span>
              {adminUser && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                  <span>{adminUser.name} ({adminUser.username})</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              Manajemen Pendaftaran Kajian
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Kontrol kuota pendaftaran, rekapitulasi data spreadsheet, scan absensi kehadiran, dan analitik demografi.
            </p>
          </div>

          {/* Quick Real-Time Quota Toggles & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200">
            
            {/* Toggle Ikhwan */}
            <button
              id="admin-toggle-ikhwan-btn"
              onClick={() =>
                onUpdateConfig({ ...config, isIkhwanOpen: !config.isIkhwanOpen })
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                config.isIkhwanOpen
                  ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
              title="Buka / Tutup Kuota Ikhwan"
            >
              {config.isIkhwanOpen ? <Unlock className="w-3.5 h-3.5 text-indigo-600" /> : <Lock className="w-3.5 h-3.5 text-rose-600" />}
              <span>Ikhwan: {config.isIkhwanOpen ? 'Buka' : 'Tutup'}</span>
            </button>

            {/* Toggle Akhwat */}
            <button
              id="admin-toggle-akhwat-btn"
              onClick={() =>
                onUpdateConfig({ ...config, isAkhwatOpen: !config.isAkhwatOpen })
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                config.isAkhwatOpen
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300'
              }`}
              title="Buka / Tutup Kuota Akhwat"
            >
              {config.isAkhwatOpen ? <Unlock className="w-3.5 h-3.5 text-rose-600" /> : <Lock className="w-3.5 h-3.5 text-slate-600" />}
              <span>Akhwat: {config.isAkhwatOpen ? 'Buka' : 'Tutup'}</span>
            </button>

            {/* Toggle Global */}
            <button
              id="admin-toggle-global-btn"
              onClick={() =>
                onUpdateConfig({
                  ...config,
                  isGlobalRegistrationOpen: !config.isGlobalRegistrationOpen,
                })
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                config.isGlobalRegistrationOpen
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
              title="Status Pendaftaran Keseluruhan"
            >
              {config.isGlobalRegistrationOpen ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Sistem Online</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-300" />
                  <span>Ditutup</span>
                </>
              )}
            </button>

            {/* Quick Scanner Launch */}
            <button
              id="admin-open-scanner-quick-btn"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR</span>
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                id="admin-logout-header-btn"
                onClick={() => {
                  onLogout();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold border border-slate-200 hover:border-rose-200 transition-colors shadow-2xs cursor-pointer"
                title="Keluar dari Dasbor Admin"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Keluar</span>
              </button>
            )}

          </div>

        </div>

        {/* 4 Professional KPI Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-slate-100">
          
          {/* Card 1: Total Peserta */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
              TOTAL PENDAFTAR
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {totalCount}<span className="text-slate-400 text-base sm:text-lg font-normal ml-1">/{config.ikhwanQuota + config.akhwatQuota}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-slate-700 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (totalCount / (config.ikhwanQuota + config.akhwatQuota)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Kuota Ikhwan */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="text-indigo-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>KUOTA IKHWAN</span>
              <span className="text-[10px] font-semibold text-slate-500">Sisa {Math.max(0, config.ikhwanQuota - ikhwanCount)}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {ikhwanCount}<span className="text-slate-400 text-base sm:text-lg font-normal ml-1">/{config.ikhwanQuota}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (ikhwanCount / config.ikhwanQuota) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Kuota Akhwat */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="text-rose-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>KUOTA AKHWAT</span>
              <span className="text-[10px] font-semibold text-slate-500">Sisa {Math.max(0, config.akhwatQuota - akhwatCount)}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {akhwatCount}<span className="text-slate-400 text-base sm:text-lg font-normal ml-1">/{config.akhwatQuota}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (akhwatCount / config.akhwatQuota) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 4: Hadir di Lokasi */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="text-emerald-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>HADIR DI LOKASI</span>
              <span className="text-[10px] font-semibold text-emerald-700">{totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0}%</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {attendedCount}<span className="text-slate-400 text-base sm:text-lg font-normal ml-1">/{totalCount}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-emerald-600 rounded-full transition-all duration-500" 
                style={{ width: `${totalCount > 0 ? Math.min(100, (attendedCount / totalCount) * 100) : 0}%` }}
              />
            </div>
          </div>

        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto pb-1">
          <button
            id="subtab-recap-btn"
            onClick={() => setActiveSubTab('recap')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'recap'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Data Pendaftar ({participants.length})</span>
          </button>

          <button
            id="subtab-quota-btn"
            onClick={() => setActiveSubTab('quota')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'quota'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Kontrol Kuota</span>
          </button>

          <button
            id="subtab-analytics-btn"
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'analytics'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Demografi & Analytics</span>
          </button>

          <button
            id="subtab-settings-btn"
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'settings'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Pengaturan & WhatsApp</span>
          </button>
        </div>

      </div>

      {/* SUB-TAB 1: REKAP DATA SPREADSHEET */}
      {activeSubTab === 'recap' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Action & Filter Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Search Field */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="recap-search-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari nama anak, orang tua, no. WA, kode registrasi, atau kota..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Action Buttons: Export CSV, Print Sheet, Add Walk-in */}
              <div className="flex flex-wrap items-center gap-2">
                
                <button
                  id="recap-export-csv-btn"
                  onClick={() => exportParticipantsToCSV(participants, config)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                  title="Unduh Rekap Spreadsheet CSV (Excel / Google Sheets)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Ekspor Spreadsheet (.CSV)</span>
                </button>

                <button
                  id="recap-print-sheet-btn"
                  onClick={() => printAttendanceSheet(participants, config)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  title="Cetak Lembar Presensi Kehadiran"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Presensi</span>
                </button>

                <button
                  id="recap-add-walkin-btn"
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Walk-in</span>
                </button>

                {participants.length > 0 && (
                  <button
                    id="recap-clear-all-btn"
                    onClick={() => setIsClearAllModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
                    title="Kosongkan / hapus semua data peserta"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Kosongkan Data ({participants.length})</span>
                  </button>
                )}

              </div>

            </div>

            {/* Filter Dropdowns Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
              
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <Filter className="w-3 h-3" />
                <span>Filter:</span>
              </div>

              {/* Gender Filter */}
              <select
                id="filter-gender-select"
                value={genderFilter}
                onChange={(e: any) => setGenderFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden focus:bg-white focus:border-slate-900 font-medium"
              >
                <option value="all">Semua Gender</option>
                <option value="ikhwan">Ikhwan ({ikhwanCount})</option>
                <option value="akhwat">Akhwat ({akhwatCount})</option>
              </select>

              {/* Attendance Filter */}
              <select
                id="filter-attendance-select"
                value={attendanceFilter}
                onChange={(e: any) => setAttendanceFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden focus:bg-white focus:border-slate-900 font-medium"
              >
                <option value="all">Semua Status Presensi</option>
                <option value="hadir">Sudah Hadir ({attendedCount})</option>
                <option value="belum_hadir">Belum Hadir ({totalCount - attendedCount})</option>
              </select>

              {/* Domicile Filter */}
              <select
                id="filter-domicile-select"
                value={domicileFilter}
                onChange={(e) => setDomicileFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden focus:bg-white focus:border-slate-900 font-medium"
              >
                <option value="all">Semua Wilayah Domisili</option>
                {uniqueDomiciles.map((dom) => (
                  <option key={dom} value={dom}>
                    {dom}
                  </option>
                ))}
              </select>

              {/* Reset filter button */}
              {(searchTerm || genderFilter !== 'all' || attendanceFilter !== 'all' || domicileFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setGenderFilter('all');
                    setAttendanceFilter('all');
                    setDomicileFilter('all');
                  }}
                  className="text-rose-600 hover:text-rose-800 text-xs font-semibold underline underline-offset-2 ml-auto"
                >
                  Reset Filter
                </button>
              )}

            </div>

          </div>

          {/* SPREADSHEET TABLE GRID */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                
                {/* Table Header */}
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">No</th>
                    <th className="px-4 py-3.5">ID Registrasi</th>
                    <th className="px-4 py-3.5">Nama Peserta & Usia</th>
                    <th className="px-4 py-3.5">Gender</th>
                    <th className="px-4 py-3.5">Orang Tua / No. WA</th>
                    <th className="px-4 py-3.5">Domisili</th>
                    <th className="px-4 py-3.5 text-center">Presensi Hadir</th>
                    <th className="px-4 py-3.5 text-right">Aksi & Tiket</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100">
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((p, index) => {
                      const isAttended = p.attendanceStatus === 'hadir';
                      return (
                        <tr 
                          key={p.id} 
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isAttended ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          {/* Number */}
                          <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">
                            {index + 1}
                          </td>

                          {/* ID Registrasi */}
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {p.id}
                            </span>
                          </td>

                          {/* Child Name & Age */}
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{p.childName}</p>
                            <p className="text-[11px] text-slate-500">
                              Usia: <strong>{p.age} Tahun</strong> {p.notes ? `• "${p.notes}"` : ''}
                            </p>
                          </td>

                          {/* Gender Badge */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              p.gender === 'ikhwan'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                                : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                            }`}>
                              {p.gender === 'ikhwan' ? 'Ikhwan' : 'Akhwat'}
                            </span>
                          </td>

                          {/* Parent & WA */}
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">{p.parentName}</p>
                            <a
                              href={getWhatsAppDirectUrl(p, config)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{p.whatsappNumber}</span>
                            </a>
                          </td>

                          {/* Domisili */}
                          <td className="px-4 py-3 text-slate-700 text-xs">
                            {p.domicile}
                          </td>

                          {/* Attendance Status Toggle */}
                          <td className="px-4 py-3 text-center">
                            <button
                              id={`toggle-attendance-${p.id}`}
                              onClick={() => handleToggleAttendance(p.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                                isAttended
                                  ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                              }`}
                              title={isAttended ? 'Klik untuk batalkan hadir' : 'Klik untuk tandai hadir'}
                            >
                              {isAttended ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Hadir</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                                  <span>Belum</span>
                                </>
                              )}
                            </button>
                            {p.attendedAt && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(p.attendedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              
                              {/* Open E-Ticket Card */}
                              <button
                                id={`view-ticket-${p.id}`}
                                onClick={() => setViewTicketParticipant(p)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors"
                                title="Lihat Tiket QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>

                              {/* Send WA */}
                              <a
                                href={getWhatsAppDirectUrl(p, config)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                                title="Kirim Pesan WhatsApp"
                              >
                                <Send className="w-4 h-4" />
                              </a>

                              {/* Edit Data */}
                              <button
                                onClick={() => setEditingParticipant(p)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                title="Edit Data"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteParticipant(p.id)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                        <div className="max-w-xs mx-auto space-y-2">
                          <p className="font-semibold text-sm text-slate-700">Tidak ada data yang cocok</p>
                          <p className="text-xs">Coba ubah kata kunci pencarian atau filter yang dipilih.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
              <div>
                Menampilkan <strong>{filteredParticipants.length}</strong> dari <strong>{participants.length}</strong> peserta terdaftar.
              </div>
              <div className="flex items-center gap-4">
                <span>Hadir: <strong>{attendedCount}</strong></span>
                <span>Belum: <strong>{totalCount - attendedCount}</strong></span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 2: KONTROL KUOTA REAL-TIME */}
      {activeSubTab === 'quota' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Pengaturan & Batas Kuota Peserta
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Atur kapasitas maksimal peserta ikhwan dan akhwat serta kendalikan pembukaan/penutupan pendaftaran secara real-time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Ikhwan Quota Card */}
              <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                      IKH
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Kuota Ikhwan (Laki-laki)</h3>
                      <p className="text-xs text-slate-500">Terdaftar: {ikhwanCount} Peserta</p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onUpdateConfig({ ...config, isIkhwanOpen: !config.isIkhwanOpen })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      config.isIkhwanOpen
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    {config.isIkhwanOpen ? 'Buka Pendaftaran' : 'Tutup Pendaftaran'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapasitas Maksimal Ikhwan (Kursi)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={ikhwanCount}
                      max={500}
                      value={config.ikhwanQuota}
                      onChange={(e) =>
                        onUpdateConfig({ ...config, ikhwanQuota: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-32 px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />
                    <span className="text-xs text-slate-500">
                      (Sisa {Math.max(0, config.ikhwanQuota - ikhwanCount)} kursi tersedia)
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (ikhwanCount / config.ikhwanQuota) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Akhwat Quota Card */}
              <div className="p-5 rounded-2xl border border-pink-200 bg-pink-50/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-pink-600 text-white font-bold flex items-center justify-center text-sm">
                      AKH
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Kuota Akhwat (Perempuan)</h3>
                      <p className="text-xs text-slate-500">Terdaftar: {akhwatCount} Peserta</p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onUpdateConfig({ ...config, isAkhwatOpen: !config.isAkhwatOpen })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      config.isAkhwatOpen
                        ? 'bg-pink-600 text-white hover:bg-pink-700'
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    {config.isAkhwatOpen ? 'Buka Pendaftaran' : 'Tutup Pendaftaran'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapasitas Maksimal Akhwat (Kursi)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={akhwatCount}
                      max={500}
                      value={config.akhwatQuota}
                      onChange={(e) =>
                        onUpdateConfig({ ...config, akhwatQuota: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-32 px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-500"
                    />
                    <span className="text-xs text-slate-500">
                      (Sisa {Math.max(0, config.akhwatQuota - akhwatCount)} kursi tersedia)
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-pink-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (akhwatCount / config.akhwatQuota) * 100)}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Master Global Registration Switch */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900 text-sm">Sakelar Utama Pendaftaran Online</p>
                <p className="text-xs text-slate-500">
                  Menonaktifkan ini akan mengunci seluruh formulir pendaftaran terlepas dari kuota yang tersisa.
                </p>
              </div>

              <button
                onClick={() =>
                  onUpdateConfig({
                    ...config,
                    isGlobalRegistrationOpen: !config.isGlobalRegistrationOpen,
                  })
                }
                className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors ${
                  config.isGlobalRegistrationOpen
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {config.isGlobalRegistrationOpen ? '✓ Sistem Online Terbuka' : '🔒 Sistem Terkunci (Tutup)'}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 3: ANALITIK DEMOGRAFI */}
      {activeSubTab === 'analytics' && (
        <div className="animate-in fade-in duration-150">
          <DemographicsAnalytics participants={participants} config={config} />
        </div>
      )}

      {/* SUB-TAB 4: PENGATURAN KAJIAN & TEMPLATE WA */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs animate-in fade-in duration-150 space-y-6">
          
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Pengaturan Informasi Event & Notifikasi WhatsApp
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Ubah judul kajian, tema, jadwal, lokasi, narasumber, serta format pesan konfirmasi otomatis.
            </p>
          </div>

          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan berhasil disimpan dan langsung diterapkan!</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Acara / Judul Kajian
                </label>
                <input
                  type="text"
                  value={editConfig.eventName}
                  onChange={(e) => setEditConfig({ ...editConfig, eventName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tema Acara
                </label>
                <input
                  type="text"
                  value={editConfig.eventTheme}
                  onChange={(e) => setEditConfig({ ...editConfig, eventTheme: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hari & Tanggal
                </label>
                <input
                  type="text"
                  value={editConfig.date}
                  onChange={(e) => setEditConfig({ ...editConfig, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Waktu Pelaksanaan
                </label>
                <input
                  type="text"
                  value={editConfig.time}
                  onChange={(e) => setEditConfig({ ...editConfig, time: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi / Masjid
                </label>
                <input
                  type="text"
                  value={editConfig.location}
                  onChange={(e) => setEditConfig({ ...editConfig, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pemateri / Ustadz
                </label>
                <input
                  type="text"
                  value={editConfig.speaker}
                  onChange={(e) => setEditConfig({ ...editConfig, speaker: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kontak Admin
                </label>
                <input
                  type="text"
                  value={editConfig.contactPerson}
                  onChange={(e) => setEditConfig({ ...editConfig, contactPerson: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Admin
                </label>
                <input
                  type="text"
                  value={editConfig.contactPersonPhone}
                  onChange={(e) => setEditConfig({ ...editConfig, contactPersonPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* WhatsApp Template Editor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Template Pesan WhatsApp Otomatis
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Variabel yang tersedia: {'{{nama_ortu}}, {{nama_anak}}, {{kode_registrasi}}, {{usia}}, {{gender}}, {{tanggal_acara}}, {{waktu_acara}}, {{lokasi_acara}}, {{pemateri}}, {{kontak_admin}}, {{wa_admin}}'}
              </p>
              <textarea
                rows={8}
                value={editConfig.whatsappMessageTemplate}
                onChange={(e) => setEditConfig({ ...editConfig, whatsappMessageTemplate: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsClearAllModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors"
                >
                  Kosongkan Semua Data Peserta
                </button>
                <button
                  type="button"
                  onClick={onResetDefaults}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 text-xs font-semibold transition-colors"
                  title="Mengisi kembali dengan 12 data contoh simulasi & jadwal default"
                >
                  Muat Data Demo (12 Peserta)
                </button>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>

          </form>

          {/* Keamanan & Ganti Password Admin */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Keamanan & Ganti Password Akun Admin
                </h3>
                <p className="text-xs text-slate-500">
                  Ubah kata sandi admin untuk menjaga keamanan akses sistem pendaftaran dan dasbor.
                </p>
              </div>
            </div>

            {passwordNotice && (
              <div className={`p-3.5 my-3 rounded-xl text-xs flex items-center gap-2 border ${
                passwordNotice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}>
                {passwordNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordNotice.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="mt-4 bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Saat Ini
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Password lama..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Baru (Min 6 karakter)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password baru..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ulangi Password Baru
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi password baru..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Password default awal: <strong className="text-slate-700 font-mono">admin123</strong>
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Perbarui Password
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* MODAL 1: VIEW TICKET MODAL */}
      {viewTicketParticipant && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setViewTicketParticipant(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              ✕
            </button>

            <div className="text-center mb-4">
              <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                TIKET QR CODE RESMI
              </span>
              <h3 className="font-bold text-lg text-slate-900 mt-1">
                {viewTicketParticipant.childName}
              </h3>
              <p className="text-xs text-slate-500">
                {viewTicketParticipant.gender === 'ikhwan' ? 'Ikhwan' : 'Akhwat'} • {viewTicketParticipant.age} Tahun
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 my-3">
              <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                <QRCodeDisplay 
                  value={viewTicketParticipant.id} 
                  size={150} 
                  level="H" 
                />
              </div>
              <p className="font-mono font-extrabold text-base text-slate-900 mt-3">
                {viewTicketParticipant.id}
              </p>
              <p className="text-xs text-slate-500">
                {viewTicketParticipant.parentName} ({viewTicketParticipant.whatsappNumber})
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={getWhatsAppDirectUrl(viewTicketParticipant, config)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim WA</span>
              </a>
              <button
                onClick={() => setViewTicketParticipant(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD WALK-IN MANUAL PARTICIPANT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              ✕
            </button>

            <h3 className="font-bold text-lg text-slate-900 mb-1">
              Tambah Peserta On-the-Spot (Walk-In)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pendaftaran langsung di lokasi kajian oleh panitia. Peserta otomatis tercatat "Hadir".
            </p>

            <form onSubmit={handleAddManualParticipant} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Anak</label>
                <input
                  type="text"
                  required
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="Contoh: Zaid bin Haritsah"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Usia (Tahun)</label>
                  <select
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                  >
                    {[4,5,6,7,8,9,10,11,12,13,14,15].map((n) => (
                      <option key={n} value={n}>{n} Tahun</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e: any) => setNewGender(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-semibold"
                  >
                    <option value="ikhwan">Ikhwan (Laki-laki)</option>
                    <option value="akhwat">Akhwat (Perempuan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Orang Tua / Pendamping</label>
                <input
                  type="text"
                  required
                  value={newParentName}
                  onChange={(e) => setNewParentName(e.target.value)}
                  placeholder="Contoh: Bapak Irfan"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Domisili</label>
                  <input
                    type="text"
                    value={newDomicile}
                    onChange={(e) => setNewDomicile(e.target.value)}
                    placeholder="Jakarta Selatan"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Simpan & Daftarkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT PARTICIPANT */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setEditingParticipant(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              ✕
            </button>

            <h3 className="font-bold text-lg text-slate-900 mb-1">
              Edit Data Peserta ({editingParticipant.id})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbarui rincian peserta atau orang tua.
            </p>

            <form onSubmit={handleSaveEditParticipant} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Anak</label>
                <input
                  type="text"
                  required
                  value={editingParticipant.childName}
                  onChange={(e) =>
                    setEditingParticipant({ ...editingParticipant, childName: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Usia (Tahun)</label>
                  <input
                    type="number"
                    value={editingParticipant.age}
                    onChange={(e) =>
                      setEditingParticipant({ ...editingParticipant, age: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={editingParticipant.gender}
                    onChange={(e: any) =>
                      setEditingParticipant({ ...editingParticipant, gender: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                  >
                    <option value="ikhwan">Ikhwan</option>
                    <option value="akhwat">Akhwat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Orang Tua</label>
                <input
                  type="text"
                  value={editingParticipant.parentName}
                  onChange={(e) =>
                    setEditingParticipant({ ...editingParticipant, parentName: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={editingParticipant.whatsappNumber}
                  onChange={(e) =>
                    setEditingParticipant({ ...editingParticipant, whatsappNumber: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Domisili</label>
                <input
                  type="text"
                  value={editingParticipant.domicile}
                  onChange={(e) =>
                    setEditingParticipant({ ...editingParticipant, domicile: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM CLEAR ALL PARTICIPANTS */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-lg text-center text-slate-900 mb-1">
              Kosongkan Semua Data Peserta?
            </h3>
            <p className="text-xs text-center text-slate-600 mb-5 leading-relaxed">
              Tindakan ini akan menghapus permanen <strong>{participants.length} data peserta</strong> dari database cloud Firestore dan browser. Data yang sudah dihapus tidak dapat dipulihkan.
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearAllParticipants}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Ya, Hapus Semua Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
