export type Gender = 'ikhwan' | 'akhwat';

export interface Participant {
  id: string; // Unique ID, e.g. "KJN-IKH-1042"
  childName: string;
  age: number;
  gender: Gender;
  parentName: string;
  whatsappNumber: string; // e.g. "081234567890" or "6281234567890"
  domicile: string; // e.g. "Jakarta Selatan"
  notes?: string;
  registeredAt: string; // ISO string
  attendanceStatus: 'hadir' | 'belum_hadir';
  attendedAt?: string; // ISO string when checked in
  notificationStatus: 'terkirim' | 'pending';
}

export interface EventConfig {
  eventName: string;
  eventTheme: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  targetAge: string;
  ikhwanQuota: number;
  akhwatQuota: number;
  isIkhwanOpen: boolean;
  isAkhwatOpen: boolean;
  isGlobalRegistrationOpen: boolean;
  contactPerson: string;
  contactPersonPhone: string;
  whatsappMessageTemplate: string;
}

export interface AttendanceLog {
  id: string;
  participantId: string;
  childName: string;
  gender: Gender;
  scannedAt: string;
  status: 'success' | 'already_checked' | 'not_found';
}

export interface AdminUser {
  username: string;
  name: string;
  role: 'admin' | 'panitia';
  lastLogin: string;
}

export type ActiveTab = 'registration' | 'my-ticket' | 'admin' | 'scanner';
