import { Participant, EventConfig } from '../types';

export function exportParticipantsToCSV(participants: Participant[], config: EventConfig): void {
  const headers = [
    'No. Registrasi',
    'Waktu Daftar',
    'Nama Lengkap Anak',
    'Usia',
    'Jenis Kelamin',
    'Nama Orang Tua / Wali',
    'No. WhatsApp',
    'Domisili',
    'Status Kehadiran',
    'Waktu Check-In',
    'Catatan Khusus',
    'Status Notifikasi WA'
  ];

  const rows = participants.map((p) => [
    p.id,
    new Date(p.registeredAt).toLocaleString('id-ID'),
    `"${p.childName.replace(/"/g, '""')}"`,
    p.age,
    p.gender === 'ikhwan' ? 'Ikhwan (Laki-laki)' : 'Akhwat (Perempuan)',
    `"${p.parentName.replace(/"/g, '""')}"`,
    `'${p.whatsappNumber}`,
    `"${p.domicile.replace(/"/g, '""')}"`,
    p.attendanceStatus === 'hadir' ? 'Hadir' : 'Belum Hadir',
    p.attendedAt ? new Date(p.attendedAt).toLocaleTimeString('id-ID') : '-',
    `"${(p.notes || '-').replace(/"/g, '""')}"`,
    p.notificationStatus === 'terkirim' ? 'Terkirim' : 'Pending'
  ]);

  const csvContent = [
    `Rekap Pendaftaran ${config.eventName}`,
    `Tanggal Acara: ${config.date} | Lokasi: ${config.location}`,
    `Total Peserta: ${participants.length} | Ikhwan: ${participants.filter(p => p.gender === 'ikhwan').length} | Akhwat: ${participants.filter(p => p.gender === 'akhwat').length}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.join(','))
  ].join('\r\n');

  // Add UTF-8 BOM for proper Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedTitle = config.eventName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `rekap_${sanitizedTitle}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printAttendanceSheet(participants: Participant[], config: EventConfig): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const ikhwanList = participants.filter((p) => p.gender === 'ikhwan');
  const akhwatList = participants.filter((p) => p.gender === 'akhwat');

  const renderTableRows = (list: Participant[]) =>
    list
      .map(
        (p, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
          <td style="padding: 8px; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px; font-weight: 600; font-family: monospace;">${p.id}</td>
          <td style="padding: 8px;"><strong>${p.childName}</strong> (${p.age} thn)</td>
          <td style="padding: 8px;">${p.parentName}</td>
          <td style="padding: 8px;">${p.whatsappNumber}</td>
          <td style="padding: 8px;">${p.domicile}</td>
          <td style="padding: 8px; text-align: center;">
            <div style="width: 18px; height: 18px; border: 1.5px solid #475569; display: inline-block; border-radius: 3px;">
              ${p.attendanceStatus === 'hadir' ? '&#10003;' : ''}
            </div>
          </td>
          <td style="padding: 8px; color: #64748b; font-size: 11px;">${p.notes || '-'}</td>
        </tr>
      `
      )
      .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Lembar Absensi Peserta - ${config.eventName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; }
          h1 { font-size: 20px; margin: 0 0 4px 0; color: #0f172a; }
          .subtitle { font-size: 13px; color: #475569; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f1f5f9; padding: 8px; font-size: 12px; text-align: left; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em; }
          .section-title { font-size: 15px; font-weight: bold; margin: 20px 0 8px 0; padding-bottom: 4px; border-bottom: 2px solid #0284c7; color: #0369a1; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <h1>DAFTAR PRESENSI & ABSENSI KAJIAN ANAK</h1>
            <div class="subtitle">
              <strong>${config.eventName}</strong> (${config.date})<br/>
              Lokasi: ${config.location} | Pemateri: ${config.speaker}
            </div>
          </div>
          <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">
            Cetak Dokumen
          </button>
        </div>

        <div class="section-title">PESERTA IKHWAN (LAKI-LAKI) - Total: ${ikhwanList.length} Anak</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">No</th>
              <th style="width: 120px;">ID Registrasi</th>
              <th>Nama Anak & Usia</th>
              <th>Orang Tua</th>
              <th>No. WhatsApp</th>
              <th>Domisili</th>
              <th style="width: 60px; text-align: center;">Hadir</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${renderTableRows(ikhwanList)}
          </tbody>
        </table>

        <div class="section-title" style="border-bottom-color: #ec4899; color: #be185d;">PESERTA AKHWAT (PEREMPUAN) - Total: ${akhwatList.length} Anak</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">No</th>
              <th style="width: 120px;">ID Registrasi</th>
              <th>Nama Anak & Usia</th>
              <th>Orang Tua</th>
              <th>No. WhatsApp</th>
              <th>Domisili</th>
              <th style="width: 60px; text-align: center;">Hadir</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${renderTableRows(akhwatList)}
          </tbody>
        </table>

        <div style="margin-top: 32px; display: flex; justify-content: flex-end;">
          <div style="text-align: center; width: 220px;">
            <p style="font-size: 13px; margin-bottom: 60px;">Panitia Meja Registrasi,</p>
            <p style="border-top: 1px dashed #64748b; padding-top: 4px; font-size: 13px; font-weight: bold;">( .................................... )</p>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
