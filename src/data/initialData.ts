import { EventConfig, Participant } from '../types';

export const initialEventConfig: EventConfig = {
  eventName: 'Kajian Anak Sholeh & Sholihah 2026',
  eventTheme: 'Meneladani Akhlak Mulia Rasulullah ﷺ Sejak Usia Dini',
  date: 'Ahad, 30 Agustus 2026',
  time: '08.30 - 11.30 WIB',
  location: 'Masjid Agung Al-Ikhlas, Kebayoran Baru, Jakarta Selatan',
  speaker: 'Kak Erlan Iskandar & Ustadz Amru Khair (Dongeng & Cerita Sahabat)',
  targetAge: 'Usia 4 - 12 Tahun',
  ikhwanQuota: 40,
  akhwatQuota: 40,
  isIkhwanOpen: true,
  isAkhwatOpen: true,
  isGlobalRegistrationOpen: true,
  contactPerson: 'Admin Kajian Anak (Ukh Syifa)',
  contactPersonPhone: '081298765432',
  whatsappMessageTemplate: `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Bapak/Ibu *{{nama_ortu}}*,

Alhamdulillah pendaftaran kajian anak untuk ananda *{{nama_anak}}* telah *BERHASIL* terkonfirmasi.

📋 *Rincian Pendaftaran:*
• No. Registrasi: *{{kode_registrasi}}*
• Nama Anak: *{{nama_anak}}* ({{usia}} thn / {{gender}})
• Tanggal: *{{tanggal_acara}}*
• Waktu: *{{waktu_acara}}*
• Lokasi: *{{lokasi_acara}}*
• Pemateri: *{{pemateri}}*

📌 *Catatan Penting:*
1. Mohon simpan QR Code pada tiket untuk verifikasi kehadiran di meja registrasi.
2. Harap hadir 15 menit sebelum acara dimulai.
3. Membawa perlengkapan sholat & alat tulis pribadi.

Info & Bantuan: {{kontak_admin}} ({{wa_admin}})

Jazakumullahu Khairan Katsiran.
Wassalamu'alaikum Warahmatullahi Wabarakatuh.`
};

export const initialParticipants: Participant[] = [
  {
    id: 'KJN-IKH-1001',
    childName: 'Muhammad Fatih Al-Faruq',
    age: 7,
    gender: 'ikhwan',
    parentName: 'Hendro Wibowo',
    whatsappNumber: '081289123451',
    domicile: 'Jakarta Selatan',
    notes: 'Alergi kacang',
    registeredAt: '2026-08-20T08:15:00Z',
    attendanceStatus: 'hadir',
    attendedAt: '2026-08-24T08:32:10Z',
    notificationStatus: 'terkirim'
  },
  {
    id: 'KJN-IKH-1002',
    childName: 'Abdullah Azzam Pratama',
    age: 9,
    gender: 'ikhwan',
    parentName: 'Rahmat Hidayat',
    whatsappNumber: '081377889901',
    domicile: 'Depok',
    notes: '',
    registeredAt: '2026-08-20T09:22:00Z',
    attendanceStatus: 'hadir',
    attendedAt: '2026-08-24T08:40:05Z',
    notificationStatus: 'terkirim'
  },
  {
    id: 'KJN-AKH-2001',
    childName: 'Aisyah Humaira Salsabila',
    age: 6,
    gender: 'akhwat',
    parentName: 'Nurul Hasanah',
    whatsappNumber: '085712345678',
    domicile: 'Jakarta Timur',
    notes: 'Suka menggambar',
    registeredAt: '2026-08-20T10:05:00Z',
    attendanceStatus: 'hadir',
    attendedAt: '2026-08-24T08:45:30Z',
    notificationStatus: 'terkirim'
  },
  {
    id: 'KJN-AKH-2002',
    childName: 'Fatimah Az-Zahra',
    age: 8,
    gender: 'akhwat',
    parentName: 'Budi Santoso',
    whatsappNumber: '081987654321',
    domicile: 'Tangerang Selatan',
    notes: '',
    registeredAt: '2026-08-20T11:40:00Z',
    attendanceStatus: 'belum_hadir',
    notificationStatus: 'terkirim'
  },
  {
    id: 'KJN-IKH-1003',
    childName: 'Ali Zainal Abidin',
    age: 5,
    gender: 'ikhwan',
    parentName: 'Ahmad Fauzi',
    whatsappNumber: '081234567899',
    domicile: 'Bekasi',
    notes: 'Ditemani bunda',
    registeredAt: '2026-08-21T07:30:00Z',
    attendanceStatus: 'belum_hadir',
    notificationStatus: 'terkirim'
  },
  {
    id: 'KJN-AKH-2003',
    childName: 'Khadijah Maryam',
    age: 10,
    gender: 'akhwat',
    parentName: 'Dewi Sartika',
    whatsappNumber: '082199887766',
    domicile: 'Jakarta Pusat',
    notes: '',
    registeredAt: '2026-08-21T09:12:00Z',
    attendanceStatus: 'hadir',
    attendedAt: '2026-08-24T08:52:18Z',
    notificationStatus: 'terkirim'
  },
  {
    id: 'KJN-IKH-1004',
    childName: 'Umar Khalid Basalamah',
    age: 11,
    gender: 'ikhwan',
    parentName: 'Zulkifli Lubis',
    whatsappNumber: '087812340987',
    domicile: 'Jakarta Barat',
    notes: '',
    registeredAt: '2026-08-21T13:45:00Z',
    attendanceStatus: 'belum_hadir',
    notificationStatus: 'terkirim'
  },
  {
    id: 'KJN-AKH-2004',
    childName: 'Zafira Nur Aqila',
    age: 7,
    gender: 'akhwat',
    parentName: 'Mira Indriani',
    whatsappNumber: '081345678123',
    domicile: 'Bogor',
    notes: 'Pemalu di awal',
    registeredAt: '2026-08-22T08:20:00Z',
    attendanceStatus: 'hadir',
    attendedAt: '2026-08-24T09:01:44Z',
    notificationStatus: 'terkirim'
  },
  {
    id: 'KJN-IKH-1005',
    childName: 'Hamzah Ibnu Abdul Muthalib',
    age: 8,
    gender: 'ikhwan',
    parentName: 'Faisal Akbar',
    whatsappNumber: '085698765432',
    domicile: 'Jakarta Selatan',
    notes: '',
    registeredAt: '2026-08-22T10:50:00Z',
    attendanceStatus: 'belum_hadir',
    notificationStatus: 'terkirim'
  },
  {
    id: 'KJN-AKH-2005',
    childName: 'Ruqayyah Shaliha',
    age: 9,
    gender: 'akhwat',
    parentName: 'Rina Kusuma',
    whatsappNumber: '081299001122',
    domicile: 'Depok',
    notes: '',
    registeredAt: '2026-08-22T14:15:00Z',
    attendanceStatus: 'belum_hadir',
    notificationStatus: 'terkirim'
  },
  {
    id: 'KJN-IKH-1006',
    childName: 'Salman Al-Farisi',
    age: 10,
    gender: 'ikhwan',
    parentName: 'Agus Gunawan',
    whatsappNumber: '081399881122',
    domicile: 'Tangerang',
    notes: '',
    registeredAt: '2026-08-23T06:40:00Z',
    attendanceStatus: 'belum_hadir',
    notificationStatus: 'terkirim'
  },
  {
    id: 'KJN-AKH-2006',
    childName: 'Hafshah Binti Umar',
    age: 6,
    gender: 'akhwat',
    parentName: 'Tri Handayani',
    whatsappNumber: '087711223344',
    domicile: 'Jakarta Selatan',
    notes: '',
    registeredAt: '2026-08-23T11:00:00Z',
    attendanceStatus: 'hadir',
    attendedAt: '2026-08-24T09:10:12Z',
    notificationStatus: 'terkirim'
  }
];

export const popularDomiciles = [
  'Jakarta Selatan',
  'Jakarta Timur',
  'Jakarta Pusat',
  'Jakarta Barat',
  'Jakarta Utara',
  'Depok',
  'Tangerang Selatan',
  'Tangerang Kota',
  'Bekasi Kota',
  'Bekasi Kab.',
  'Bogor Kota',
  'Bogor Kab.',
  'Bandung',
  'Lainnya'
];
