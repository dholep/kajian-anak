import React, { useState, useEffect } from 'react';
import { ActiveTab, AdminUser, EventConfig, Participant } from './types';
import { 
  loadEventConfig, 
  loadParticipants, 
  saveEventConfig, 
  saveParticipants,
  addOrUpdateParticipantSync,
  deleteParticipantSync,
  deleteAllParticipantsSync,
  updateConfigSync,
  checkInParticipantSync,
  resetAllDataSync
} from './utils/storage';
import { 
  subscribeParticipants, 
  subscribeEventConfig 
} from './firebase';
import { getAdminSession, logoutAdmin } from './utils/auth';
import { Navbar } from './components/Navbar';
import { RegistrationForm } from './components/RegistrationForm';
import { RegistrationSuccessModal } from './components/RegistrationSuccessModal';
import { MyTicketLookup } from './components/MyTicketLookup';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { QRScannerModal } from './components/QRScannerModal';
import { 
  Sparkles, 
  ShieldCheck, 
  QrCode,
  Calendar,
  MapPin,
  Clock,
  Phone,
  Lock,
  Cloud
} from 'lucide-react';

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>(loadParticipants());
  const [config, setConfig] = useState<EventConfig>(loadEventConfig());
  const [activeTab, setActiveTab] = useState<ActiveTab>('registration');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(getAdminSession());
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // Success Modal state
  const [newlyRegistered, setNewlyRegistered] = useState<Participant | null>(null);

  // Scanner Modal state (can also be triggered as a popup)
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Real-time Cloud Firebase Subscription
  useEffect(() => {
    // 1. Subscribe to Realtime Firestore Participants
    const unsubscribeParticipants = subscribeParticipants((cloudParticipants) => {
      if (cloudParticipants && cloudParticipants.length >= 0) {
        setParticipants(cloudParticipants);
        saveParticipants(cloudParticipants);
        setIsCloudSynced(true);
      }
    });

    // 2. Subscribe to Realtime Firestore Event Configuration
    const unsubscribeConfig = subscribeEventConfig((cloudConfig) => {
      if (cloudConfig) {
        setConfig(cloudConfig);
        saveEventConfig(cloudConfig);
        setIsCloudSynced(true);
      }
    });

    setAdminUser(getAdminSession());

    return () => {
      if (unsubscribeParticipants) unsubscribeParticipants();
      if (unsubscribeConfig) unsubscribeConfig();
    };
  }, []);

  // Save changes to storage & Cloud
  const handleUpdateParticipants = async (updated: Participant[]) => {
    setParticipants(updated);
    saveParticipants(updated);

    // If clearing all participants
    if (updated.length === 0) {
      try {
        await deleteAllParticipantsSync();
      } catch (err) {
        console.warn('Delete all participants error:', err);
      }
      return;
    }

    // Sync all to Firestore (detect if added/updated or deleted)
    try {
      // Find deleted ids
      const currentIds = new Set(updated.map((p) => p.id));
      for (const oldP of participants) {
        if (!currentIds.has(oldP.id)) {
          await deleteParticipantSync(oldP.id);
        }
      }
      // Upsert updated ones
      for (const p of updated) {
        await addOrUpdateParticipantSync(p);
      }
    } catch (err) {
      console.warn('Sync participants warning:', err);
    }
  };

  const handleUpdateConfig = async (updatedConfig: EventConfig) => {
    setConfig(updatedConfig);
    saveEventConfig(updatedConfig);
    try {
      await updateConfigSync(updatedConfig);
    } catch (err) {
      console.warn('Sync config warning:', err);
    }
  };

  // Participant Registration Success
  const handleRegisterSuccess = async (participant: Participant) => {
    const updated = [participant, ...participants.filter((p) => p.id !== participant.id)];
    setParticipants(updated);
    saveParticipants(updated);
    setNewlyRegistered(participant);

    try {
      await addOrUpdateParticipantSync(participant);
    } catch (err) {
      console.warn('Sync new participant warning:', err);
    }
  };

  // Admin Authentication Handlers
  const handleAdminLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setAdminUser(null);
    setActiveTab('registration');
  };

  // Check-In / Presensi Participant by ID
  const handleCheckInParticipant = (id: string): Participant | null => {
    let foundUpdated: Participant | null = null;

    const updated = participants.map((p) => {
      if (p.id.toUpperCase() === id.toUpperCase()) {
        foundUpdated = {
          ...p,
          attendanceStatus: 'hadir',
          attendedAt: new Date().toISOString(),
        };
        return foundUpdated;
      }
      return p;
    });

    if (foundUpdated) {
      setParticipants(updated);
      saveParticipants(updated);
      checkInParticipantSync(id).catch(() => {});
    }
    return foundUpdated;
  };

  // Reset to initial mock demo data
  const handleResetDefaults = async () => {
    try {
      const defaults = await resetAllDataSync();
      setParticipants(defaults.participants);
      setConfig(defaults.config);
    } catch {
      // fallback
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        participants={participants}
        adminUser={adminUser}
        onLogout={handleAdminLogout}
      />

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1">
        {activeTab === 'registration' && (
          <RegistrationForm
            config={config}
            participants={participants}
            onRegisterSuccess={handleRegisterSuccess}
            onOpenMyTicket={() => setActiveTab('my-ticket')}
          />
        )}

        {activeTab === 'my-ticket' && (
          <MyTicketLookup
            participants={participants}
            config={config}
            onGoToRegister={() => setActiveTab('registration')}
          />
        )}

        {activeTab === 'admin' && (
          adminUser ? (
            <AdminDashboard
              participants={participants}
              config={config}
              adminUser={adminUser}
              onLogout={handleAdminLogout}
              onUpdateParticipants={handleUpdateParticipants}
              onUpdateConfig={handleUpdateConfig}
              onOpenScanner={() => setIsScannerOpen(true)}
              onResetDefaults={handleResetDefaults}
            />
          ) : (
            <AdminLogin
              onLoginSuccess={handleAdminLoginSuccess}
              onCancel={() => setActiveTab('registration')}
            />
          )
        )}

        {activeTab === 'scanner' && (
          adminUser ? (
            <div className="py-6 px-4">
              <div className="max-w-4xl mx-auto mb-4 text-center">
                <h1 className="text-2xl font-bold text-slate-900 font-display">
                  Scanner Presensi On-Site (Meja Registrasi)
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Gunakan scanner kamera untuk memindai QR Code tiket peserta secara langsung.
                </p>
              </div>

              <QRScannerModal
                participants={participants}
                config={config}
                onCheckInParticipant={handleCheckInParticipant}
                onClose={() => setActiveTab('admin')}
              />
            </div>
          ) : (
            <AdminLogin
              onLoginSuccess={handleAdminLoginSuccess}
              onCancel={() => setActiveTab('registration')}
            />
          )
        )}
      </main>

      {/* Floating QR Scanner Button (Shortcut for Admin & Panitia on Mobile) */}
      {activeTab !== 'scanner' && !isScannerOpen && (
        <button
          id="floating-qr-scanner-btn"
          onClick={() => {
            if (!adminUser) {
              setActiveTab('admin');
            } else {
              setIsScannerOpen(true);
            }
          }}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl active:scale-95 transition-all border border-slate-700/80 cursor-pointer"
          title={adminUser ? "Buka Scanner QR Code" : "Login Admin untuk Scan QR"}
        >
          {adminUser ? (
            <QrCode className="w-5 h-5 text-indigo-400 animate-pulse" />
          ) : (
            <Lock className="w-4 h-4 text-amber-400" />
          )}
          <span className="hidden sm:inline">{adminUser ? 'Scan QR Presensi' : 'Admin & Scanner'}</span>
          <span className="sm:hidden">{adminUser ? 'Scan QR' : 'Admin'}</span>
        </button>
      )}

      {/* Registration Success E-Ticket Modal */}
      {newlyRegistered && (
        <RegistrationSuccessModal
          participant={newlyRegistered}
          config={config}
          onClose={() => setNewlyRegistered(null)}
          onRegisterAnother={() => setNewlyRegistered(null)}
        />
      )}

      {/* Standalone Scanner Modal Popup */}
      {isScannerOpen && (
        <QRScannerModal
          participants={participants}
          config={config}
          onCheckInParticipant={handleCheckInParticipant}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* Application Footer */}
      <footer id="app-footer" className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            
            {/* Col 1: Brand Info */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <span>KajianAnak<span className="text-emerald-400">.ID</span></span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                Platform sistem pendaftaran online kajian anak terintegrasi dengan pembatasan kuota ikhwan & akhwat, konfirmasi otomatis pesan WhatsApp, tiket QR Code digital, dan verifikasi presensi instan.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 pt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Sistem Registrasi & Presensi Cloud Firestore Terverifikasi</span>
              </div>
            </div>

            {/* Col 2: Event Details */}
            <div className="space-y-2">
              <p className="font-bold text-slate-200 text-xs uppercase tracking-wider">Informasi Kajian</p>
              <p className="text-slate-300 font-semibold">{config.eventName}</p>
              <p className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> {config.date}
              </p>
              <p className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" /> {config.time}
              </p>
              <p className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {config.location.split(',')[0]}
              </p>
            </div>

            {/* Col 3: Contact & Bantuan */}
            <div className="space-y-2">
              <p className="font-bold text-slate-200 text-xs uppercase tracking-wider">Kontak Panitia</p>
              <p className="text-slate-300">{config.contactPerson}</p>
              <a
                href={`https://wa.me/62${config.contactPersonPhone.replace(/^0/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{config.contactPersonPhone} (WhatsApp)</span>
              </a>
              <p className="text-slate-500 text-[11px] pt-2">
                Pusat Bantuan & Konfirmasi Kehadiran
              </p>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
            <p>© 2026 Sistem Pendaftaran Kajian Anak. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveTab('registration')} className="hover:text-slate-300">Formulir</button>
              <button onClick={() => setActiveTab('my-ticket')} className="hover:text-slate-300">Cek Tiket</button>
              <button onClick={() => setActiveTab('admin')} className="hover:text-slate-300">Dasbor Admin</button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
