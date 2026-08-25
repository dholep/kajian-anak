import { EventConfig, Participant } from '../types';

export function normalizeWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function formatIndonesianPhone(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 8) return phone;
  if (clean.startsWith('62')) {
    return `+62 ${clean.slice(2, 5)}-${clean.slice(5, 9)}-${clean.slice(9)}`;
  }
  if (clean.startsWith('0')) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
  }
  return phone;
}

export function generateWhatsAppMessage(
  participant: Participant,
  config: EventConfig
): string {
  const genderLabel = participant.gender === 'ikhwan' ? 'Ikhwan (Laki-laki)' : 'Akhwat (Perempuan)';

  let template = config.whatsappMessageTemplate || '';

  const replacements: Record<string, string> = {
    '{{nama_ortu}}': participant.parentName,
    '{{nama_anak}}': participant.childName,
    '{{kode_registrasi}}': participant.id,
    '{{usia}}': participant.age.toString(),
    '{{gender}}': genderLabel,
    '{{domisili}}': participant.domicile,
    '{{tanggal_acara}}': config.date,
    '{{waktu_acara}}': config.time,
    '{{lokasi_acara}}': config.location,
    '{{pemateri}}': config.speaker,
    '{{kontak_admin}}': config.contactPerson,
    '{{wa_admin}}': config.contactPersonPhone,
  };

  for (const [key, value] of Object.entries(replacements)) {
    template = template.split(key).join(value);
  }

  return template;
}

export function getWhatsAppDirectUrl(
  participant: Participant,
  config: EventConfig
): string {
  const cleanPhone = normalizeWhatsAppNumber(participant.whatsappNumber);
  const message = generateWhatsAppMessage(participant, config);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
