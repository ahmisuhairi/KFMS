/**
 * PDF Document Generator for KFMS Perlis
 * Generates official Malaysian Government format documents:
 * 1. Arahan Memandu Kenderaan Jabatan (Borang Penugasan Rasmi)
 * 2. Notis Keputusan Permohonan Kenderaan Jabatan
 */
import jsPDF from 'jspdf';
import { TripRequest, Assignment, Vehicle, Driver, Staff } from '../types';
import { formatMalayDateTime } from './collisionEngine';

export interface DocumentData {
  request: TripRequest;
  assignment?: Assignment;
  applicant: Staff;
  vehicle?: Vehicle;
  driver?: Driver;
  driverStaff?: Staff;
  officer?: Staff;
}

/**
 * Generate official Arahan Memandu Kenderaan Kerajaan PDF
 */
export function generateArahanMemanduPDF(data: DocumentData): { blobUrl: string; download: () => void } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { request, assignment, applicant, vehicle, driverStaff, officer } = data;
  const assignmentId = assignment?.Assignment_ID || `ASN-${Date.now().toString().slice(-8)}`;

  // Header styling
  doc.setFillColor(15, 45, 92); // Deep Navy KEMAS
  doc.rect(0, 0, 210, 8, 'F');

  // Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('KERAJAAN MALAYSIA', 105, 16, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(15, 45, 92);
  doc.text('JABATAN KEMAJUAN MASYARAKAT (KEMAS)', 105, 22, { align: 'center' });
  doc.setFontSize(11);
  doc.text('NEGERI PERLIS', 105, 27, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text('Tingkat 1 & 2, Bangunan Persekutuan, 01000 Kangar, Perlis | Tel: 04-976 1234', 105, 32, { align: 'center' });

  // Divider Line
  doc.setDrawColor(15, 45, 92);
  doc.setLineWidth(0.8);
  doc.line(15, 35, 195, 35);
  doc.setLineWidth(0.2);
  doc.line(15, 36.2, 195, 36.2);

  // Document Badge
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(15, 40, 180, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 45, 92);
  doc.text('ARAHAN MEMANDU KENDERAAN JABATAN', 105, 46, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`NO. PENUGASAN: ${assignmentId}  |  NO. PERMOHONAN: ${request.Request_ID}`, 105, 51, { align: 'center' });

  let y = 60;

  // Helper box drawer
  const drawSectionHeader = (title: string, top: number) => {
    doc.setFillColor(224, 231, 255);
    doc.rect(15, top, 180, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 58, 138);
    doc.text(title, 18, top + 4.5);
  };

  // 1. MAKLUMAT TUGASAN & PEMANDU
  drawSectionHeader('1. BUTIRAN PENUGASAN PEMANDU & KENDERAAN', y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  // Row 1
  doc.text('Nama Pemandu:', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.text(driverStaff?.Nama_Penuh || 'Belum Ditetapkan', 55, y);

  doc.setFont('helvetica', 'bold');
  doc.text('No. Telefon:', 125, y);
  doc.setFont('helvetica', 'normal');
  doc.text(driverStaff?.No_Telefon ? `+${driverStaff.No_Telefon}` : '-', 150, y);
  y += 6;

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Model Kenderaan:', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.text(vehicle ? `${vehicle.Model_Kenderaan}` : '-', 55, y);

  doc.setFont('helvetica', 'bold');
  doc.text('No. Pendaftaran:', 125, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 30, 30);
  doc.text(vehicle?.No_Plat || '-', 155, y);
  doc.setTextColor(30, 41, 59);
  y += 6;

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text('Kapasiti Penumpang:', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${vehicle?.Kapasiti || 0} Tempat Duduk`, 55, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Status Kuasa:', 125, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Kuasa Memandu Sah 2026', 150, y);
  y += 9;

  // 2. MAKLUMAT PERJALANAN & PEMOHON
  drawSectionHeader('2. JADUAL PERJALANAN & MAKLUMAT PEMOHON', y);
  y += 10;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Pemohon:', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.text(applicant?.Nama_Penuh || '-', 55, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Bahagian / Unit:', 125, y);
  doc.setFont('helvetica', 'normal');
  doc.text(applicant?.Bahagian || '-', 150, y);
  y += 6;

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Tarikh & Masa Pergi:', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatMalayDateTime(request.Tarikh_Mula)} (${request.Masa_Mula})`, 55, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Tarikh & Masa Balik:', 125, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatMalayDateTime(request.Tarikh_Tamat)} (${request.Masa_Tamat})`, 158, y);
  y += 6;

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text('Destinasi Rasmi:', 18, y);
  doc.setFont('helvetica', 'normal');
  const splitDest = doc.splitTextToSize(request.Destinasi, 135);
  doc.text(splitDest, 55, y);
  y += splitDest.length * 5 + 1;

  // Row 4
  doc.setFont('helvetica', 'bold');
  doc.text('Tujuan Perjalanan:', 18, y);
  doc.setFont('helvetica', 'normal');
  const splitTujuan = doc.splitTextToSize(request.Tujuan, 135);
  doc.text(splitTujuan, 55, y);
  y += splitTujuan.length * 5 + 1;

  // Row 5
  doc.setFont('helvetica', 'bold');
  doc.text('Keutamaan & Jenis:', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`[${request.Priority_Level}] - ${request.Jenis_Perjalanan} (${request.Bilangan_Penumpang || 1} Penumpang)`, 55, y);
  y += 8;

  // 3. PERINGATAN KESELAMATAN & PERATURAN TUGASAN
  drawSectionHeader('3. ARAHAN KHAS & SYARAT PEMANDUAN KERAJAAN', y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  const instructions = [
    '1. Pemandu wajib memeriksa aras minyak enjin, cecair penyejuk (coolant), brek, dan tekanan tayar sebelum memulakan perjalanan.',
    '2. Buku Log Kenderaan (Kad Inden) wajib diisi dengan tepat: bacaan odometer sebelum bertolak, odometer semasa tiba, kuantiti minyak serta resit Touch n Go.',
    '3. Kenderaan Kerajaan hanya boleh digunakan untuk urusan rasmi yang telah diluluskan sahaja. Sebarang lencongan peribadi adalah ditegah sama sekali mengikut Arahan Perbendaharaan AP.',
    '4. Patuhi had laju jalan raya kebangsaan dan gunakan pautan WhatsApp sistem untuk sebarang laporan kecemasan atau kerosakan.',
    `5. Catatan Pegawai: ${assignment?.Catatan_Pegawai || 'Tiada arahan khas. Jalankan tugas dengan berhemah.'}`
  ];

  instructions.forEach((ins) => {
    const lines = doc.splitTextToSize(ins, 175);
    doc.text(lines, 18, y);
    y += lines.length * 4 + 1;
  });

  y += 4;

  // 4. PENGESAHAN & TANDATANGAN
  drawSectionHeader('4. PENGESAHAN PEGAWAI KENDERAAN / PEGAWAI PENGANGKUTAN', y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);

  // Column Left: Pegawai Kenderaan
  doc.text('Dikeluarkan dan disahkan oleh:', 18, y);
  doc.text('Nama Pegawai:', 18, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(officer?.Nama_Penuh || 'Ahmad Zuhairi bin Salleh', 42, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text('Jawatan: Pegawai Pengangkutan & Aset (N29)', 18, y + 21);
  doc.text(`Tarikh Kelulusan: ${assignment?.DateTime_Assigned || '2026-11-01'}`, 18, y + 26);

  // Column Right: Pemandu Bertugas
  doc.text('Penerimaan Arahan (Pemandu Bertugas):', 120, y);
  doc.text('Tandatangan:', 120, y + 16);
  doc.line(142, y + 16, 190, y + 16);
  doc.text(`Nama: ${driverStaff?.Nama_Penuh || 'Pemandu Bertugas'}`, 120, y + 21);
  doc.text('Tarikh Terima: .......................................', 120, y + 26);

  // Footer bar
  doc.setFillColor(243, 244, 246);
  doc.rect(0, 282, 210, 15, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Dokumen ini dijana secara automatik oleh KFMS (KEMAS Fleet Management System Negeri Perlis).', 105, 287, { align: 'center' });
  doc.text('Salinan Sah Digital Kerajaan Malaysia | Piawaian ISO 9001 Pentadbiran Kenderaan Sektor Awam', 105, 291, { align: 'center' });

  const blobUrl = doc.output('bloburl');
  return {
    blobUrl: typeof blobUrl === 'string' ? blobUrl : '',
    download: () => doc.save(`Arahan_Memandu_${assignmentId}.pdf`),
  };
}

/**
 * Generate official Notis Keputusan Permohonan Kenderaan PDF
 */
export function generateNotisKeputusanPDF(data: DocumentData): { blobUrl: string; download: () => void } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { request, assignment, applicant, vehicle, driverStaff, officer } = data;
  const isApproved = request.Status_Permohonan === 'Lulus';

  // Top Accent
  doc.setFillColor(isApproved ? 16 : 185, isApproved ? 122 : 28, isApproved ? 87 : 28);
  doc.rect(0, 0, 210, 8, 'F');

  // Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('KERAJAAN MALAYSIA', 105, 17, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(15, 45, 92);
  doc.text('JABATAN KEMAJUAN MASYARAKAT (KEMAS) NEGERI PERLIS', 105, 23, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text('Unit Pentadbiran & Kewangan (Bahagian Pengurusan Kenderaan Jabatan)', 105, 28, { align: 'center' });

  doc.setDrawColor(15, 45, 92);
  doc.setLineWidth(0.8);
  doc.line(15, 32, 195, 32);

  // Status Banner
  const bannerY = 38;
  doc.setFillColor(isApproved ? 240 : 254, isApproved ? 253 : 242, isApproved ? 244 : 242);
  doc.roundedRect(15, bannerY, 180, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(isApproved ? 22 : 185, isApproved ? 101 : 28, isApproved ? 52 : 28);
  doc.text(
    isApproved ? 'NOTIS KELULUSAN PERMOHONAN KENDERAAN JABATAN' : 'NOTIS KEPUTUSAN: PERMOHONAN TIDAK DILULUSKAN / DIBATALKAN',
    105,
    bannerY + 7,
    { align: 'center' }
  );

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Rujukan Permohonan: ${request.Request_ID}  |  Tarikh Mohon: ${request.DateTime_Mohon}`, 105, bannerY + 12.5, { align: 'center' });

  let y = 62;

  // Kepada Pemohon
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('KEPADA:', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${applicant?.Nama_Penuh} (${applicant?.Jawatan})`, 40, y);
  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.text('BAHAGIAN:', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${applicant?.Bahagian}`, 40, y);
  y += 8;

  // Statement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);

  const introText = isApproved
    ? `Sukacita dimaklumkan bahawa permohonan kenderaan jabatan bagi urusan rasmi berikut telah DILULUSKAN oleh Pegawai Kenderaan KEMAS Negeri Perlis:`
    : `Dukacita dimaklumkan bahawa permohonan kenderaan jabatan bagi urusan rasmi berikut TIDAK DAPAT DILULUSKAN atau telah DIBATALKAN atas sebab-sebab operasi seperti di bawah:`;

  const splitIntro = doc.splitTextToSize(introText, 175);
  doc.text(splitIntro, 18, y);
  y += splitIntro.length * 5 + 3;

  // Table summary
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, 180, isApproved ? 46 : 30, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, y, 180, isApproved ? 46 : 30);

  let rowY = y + 7;
  const renderRow = (label: string, val: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(label, 20, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(val, 65, rowY);
    rowY += 6;
  };

  renderRow('Destinasi Rasmi:', request.Destinasi);
  renderRow('Tujuan Perjalanan:', request.Tujuan);
  renderRow('Tarikh & Masa Pergi:', `${formatMalayDateTime(request.Tarikh_Mula)} (${request.Masa_Mula})`);
  renderRow('Tarikh & Masa Balik:', `${formatMalayDateTime(request.Tarikh_Tamat)} (${request.Masa_Tamat})`);

  if (isApproved && vehicle && driverStaff) {
    renderRow('Kenderaan Diberikan:', `${vehicle.No_Plat} - ${vehicle.Model_Kenderaan}`);
    renderRow('Pemandu Ditugaskan:', `${driverStaff.Nama_Penuh} (Tel: +${driverStaff.No_Telefon})`);
    renderRow('No. Arahan Memandu:', assignment?.Assignment_ID || '-');
  }

  y += isApproved ? 52 : 36;

  // Catatan Pegawai
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(15, y, 180, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text('JUSTIFIKASI / CATATAN PEGAWAI KENDERAAN:', 20, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(
    doc.splitTextToSize(
      request.Catatan || assignment?.Catatan_Pegawai || (isApproved ? 'Sila berhubung dengan pemandu bertugas 15 minit sebelum waktu bertolak.' : 'Tiada kenderaan/pemandu tersedia untuk slot masa yang dipohon.'),
      170
    ),
    20,
    y + 11
  );

  y += 24;

  // Pegawai Signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('DISAHKAN OLEH:', 18, y);
  y += 14;
  doc.text(officer?.Nama_Penuh || 'Ahmad Zuhairi bin Salleh', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.text('b/p Pengarah KEMAS Negeri Perlis', 18, y + 5);
  doc.text('Unit Pentadbiran & Pengurusan Kenderaan Jabatan', 18, y + 9);
  doc.text(`Tarikh: ${new Date().toISOString().split('T')[0]}`, 18, y + 13);

  // Footer bar
  doc.setFillColor(243, 244, 246);
  doc.rect(0, 282, 210, 15, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('KFMS Perlis - Sistem Pengurusan & Penugasan Kenderaan KEMAS Negeri Perlis', 105, 287, { align: 'center' });
  doc.text('Cetakan ini adalah sah tanpa tandatangan fizikal jika disertakan kod kelulusan sistem.', 105, 291, { align: 'center' });

  const blobUrl = doc.output('bloburl');
  return {
    blobUrl: typeof blobUrl === 'string' ? blobUrl : '',
    download: () => doc.save(`Notis_Keputusan_${request.Request_ID}.pdf`),
  };
}
