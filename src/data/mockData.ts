/**
 * Initial Master Data & Transactions for KEMAS Negeri Perlis
 * Uses 'Users' Table with roles: 'Admin', 'Staff', 'Pemandu'
 */
import { User, Vehicle, Driver, TripRequest, Assignment, OverrideLog } from '../types';

export const INITIAL_USERS: User[] = [
  {
    User_ID: 'USR-0001',
    Email: 'pengarah.perlis@kemas.gov.my',
    Nama_Penuh: 'YBhg. Tuan Haji Rosli bin Hashim',
    Jawatan: 'Pengarah KEMAS Negeri Perlis',
    Bahagian: 'Pejabat Pengarah (Pengurusan Tertinggi)',
    No_Telefon: '60124455667',
    Role: 'Pengarah',
    Status_Aktif: 'Yes',
    Is_Pengarah: true,
  },
  {
    User_ID: 'USR-0002',
    Email: 'ahmisuhairi@gmail.com',
    Nama_Penuh: 'Ahmad Zuhairi bin Salleh',
    Jawatan: 'Pegawai Pengangkutan & Aset (N29)',
    Bahagian: 'Unit Pentadbiran & Kewangan',
    No_Telefon: '60194567890',
    Role: 'Pegawai_Kenderaan',
    Status_Aktif: 'Yes',
    Is_Pengarah: false,
  },
  {
    User_ID: 'USR-0003',
    Email: 'sitinoor.haliza@kemas.gov.my',
    Nama_Penuh: 'Siti Noor Haliza binti Adnan',
    Jawatan: 'Pegawai Pendidikan Awal Kanak-kanak',
    Bahagian: 'Bahagian Pendidikan Komuniti & TABIKA',
    No_Telefon: '60134889922',
    Role: 'Pemohon',
    Status_Aktif: 'Yes',
  },
  {
    User_ID: 'USR-0004',
    Email: 'farhana.ishak@kemas.gov.my',
    Nama_Penuh: 'Nurul Farhana binti Ishak',
    Jawatan: 'Penolong Pegawai Latihan Komuniti',
    Bahagian: 'Bahagian Pembangunan Desa & Kemahiran',
    No_Telefon: '60145678901',
    Role: 'Pemohon',
    Status_Aktif: 'Yes',
  },
  {
    User_ID: 'USR-0005',
    Email: 'azlan.driver@kemas.gov.my',
    Nama_Penuh: 'Mohamad Azlan bin Idris',
    Jawatan: 'Pemandu Kenderaan (H11)',
    Bahagian: 'Unit Pengangkutan & Logistik',
    No_Telefon: '60175512345',
    Role: 'Pemandu',
    Status_Aktif: 'Yes',
  },
  {
    User_ID: 'USR-0006',
    Email: 'khairul.anuar@kemas.gov.my',
    Nama_Penuh: 'Khairul Anuar bin Osman',
    Jawatan: 'Pemandu Kenderaan Kanan (H14)',
    Bahagian: 'Unit Pengangkutan & Logistik',
    No_Telefon: '60189901123',
    Role: 'Pemandu',
    Status_Aktif: 'Yes',
  },
  {
    User_ID: 'USR-0007',
    Email: 'zulkifli.daud@kemas.gov.my',
    Nama_Penuh: 'Zulkifli bin Daud',
    Jawatan: 'Pemandu Sambilan Harian (Ganti)',
    Bahagian: 'Unit Pengangkutan & Logistik',
    No_Telefon: '60112345678',
    Role: 'Pemandu',
    Status_Aktif: 'Yes',
  },
];

// Alias for backwards compatibility
export const INITIAL_STAFF = INITIAL_USERS;

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    Vehicle_ID: 'VEH-0001',
    No_Plat: 'RFA 1234',
    Model_Kenderaan: 'Toyota Hilux 2.4 Double Cab',
    Kapasiti: 5,
    Status_Kenderaan: 'Aktif',
    Catatan: 'Pacuan 4 roda, sesuai kawasan luar bandar & pedalaman',
  },
  {
    Vehicle_ID: 'VEH-0002',
    No_Plat: 'RFA 5678',
    Model_Kenderaan: 'Proton X70 1.8 TGDi Executive',
    Kapasiti: 5,
    Status_Kenderaan: 'Aktif',
    Catatan: 'Kenderaan rasmi Pengarah & tugasan VIP',
  },
  {
    Vehicle_ID: 'VEH-0003',
    No_Plat: 'RF 8899',
    Model_Kenderaan: 'Toyota Fortuner 2.7 SRZ',
    Kapasiti: 7,
    Status_Kenderaan: 'Aktif',
    Catatan: 'SUV rasmi mesyuarat luar negeri',
  },
  {
    Vehicle_ID: 'VEH-0004',
    No_Plat: 'RFA 9012',
    Model_Kenderaan: 'Toyota Hiace Window Van (11 Penumpang)',
    Kapasiti: 11,
    Status_Kenderaan: 'Aktif',
    Catatan: 'Van rombongan kursus & pemantauan aktiviti kemas',
  },
  {
    Vehicle_ID: 'VEH-0005',
    No_Plat: 'RFB 3344',
    Model_Kenderaan: 'Proton Saga 1.3 Premium',
    Kapasiti: 4,
    Status_Kenderaan: 'Penyelenggaraan',
    Catatan: 'Servis brek dan penukaran tayar di Pusat Servis Kangar',
  },
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    Driver_ID: 'DRV-0001',
    User_ID: 'USR-0005', // Mohamad Azlan bin Idris
    Staff_ID: 'USR-0005',
    Jenis_Pemandu: 'Tetap',
    Tarikh_Mula_Kuasa: '2026-01-01',
    Tarikh_Tamat_Kuasa: '', // Tetap: Tiada had luput
    Tahun_Kuasa: 2026,
  },
  {
    Driver_ID: 'DRV-0002',
    User_ID: 'USR-0006', // Khairul Anuar bin Osman
    Staff_ID: 'USR-0006',
    Jenis_Pemandu: 'Tetap',
    Tarikh_Mula_Kuasa: '2026-01-01',
    Tarikh_Tamat_Kuasa: '2026-12-31',
    Tahun_Kuasa: 2026,
  },
  {
    Driver_ID: 'DRV-0003',
    User_ID: 'USR-0007', // Zulkifli bin Daud
    Staff_ID: 'USR-0007',
    Jenis_Pemandu: 'Ganti',
    Tarikh_Mula_Kuasa: '2026-06-01',
    Tarikh_Tamat_Kuasa: '2026-11-20', // Tamat dalam tempoh 19 hari (mencetuskan alert < 30 hari!)
    Tahun_Kuasa: 2026,
  },
];

export const INITIAL_REQUESTS: TripRequest[] = [
  {
    Request_ID: 'REQ-20261102-0001',
    Pemohon_User_ID: 'USR-0003', // Siti Noor Haliza
    Priority_Level: 'Normal',
    Jenis_Perjalanan: 'Dalam Negeri',
    Destinasi: 'Pusat Kegiatan KEMAS Parlimen Padang Besar & TABIKA Kangar',
    Tujuan: 'Pemantauan persediaan audit Kurikulum Standard Prasekolah Kebangsaan (KSPK)',
    Bilangan_Penumpang: 3,
    Tarikh_Mula: '2026-11-03',
    Masa_Mula: '08:30',
    Tarikh_Tamat: '2026-11-03',
    Masa_Tamat: '16:30',
    Lampiran_PDF_URL: 'https://drive.google.com/file/d/sample-jadual-audit/view',
    Lampiran_PDF_Nama: 'Jadual_Audit_KSPK_2026.pdf',
    Status_Permohonan: 'Lulus',
    DateTime_Mohon: '2026-11-01 08:15:20',
    Catatan: 'Telah diluluskan dan ditugaskan kenderaan Hilux RFA 1234.',
  },
  {
    Request_ID: 'REQ-20261102-0002',
    Pemohon_User_ID: 'USR-0004', // Nurul Farhana
    Priority_Level: 'Segera',
    Jenis_Perjalanan: 'Luar Negeri',
    Destinasi: 'Ibu Pejabat KEMAS Putrajaya (Kompleks Kerajaan Parcel D)',
    Tujuan: 'Menghantar laporan mendesak Program Kesejahteraan Komuniti Desa Negeri Perlis dan menghadiri Taklimat Bajet',
    Bilangan_Penumpang: 3,
    Tarikh_Mula: '2026-11-04',
    Masa_Mula: '07:00',
    Tarikh_Tamat: '2026-11-05',
    Masa_Tamat: '20:00',
    Lampiran_PDF_URL: 'https://drive.google.com/file/d/surat-panggilan-putrajaya/view',
    Lampiran_PDF_Nama: 'Surat_Panggilan_Mesyuarat_Putrajaya_KEMAS.pdf',
    Status_Permohonan: 'Menunggu Kelulusan Pengarah', // Menunggu Pengarah KEMAS Perlis luluskan!
    DateTime_Mohon: '2026-11-01 09:30:10',
    Catatan: 'Surat panggilan mesyuarat dilampirkan.',
  },
  {
    Request_ID: 'REQ-20261102-0003',
    Pemohon_User_ID: 'USR-0003', // Siti Noor Haliza
    Priority_Level: 'Arahan Ketua Jabatan',
    Jenis_Perjalanan: 'Luar Negeri',
    Destinasi: 'Wisma Negeri Alor Setar & JKR Kedah',
    Tujuan: 'Mesyuarat Tindakan Pembangunan Bersama Wilayah Ekonomi Koridor Utara (NCER)',
    Bilangan_Penumpang: 2,
    Tarikh_Mula: '2026-11-03',
    Masa_Mula: '09:00',
    Tarikh_Tamat: '2026-11-03',
    Masa_Tamat: '15:00',
    Lampiran_PDF_URL: 'https://drive.google.com/file/d/memo-ncer-kedah/view',
    Lampiran_PDF_Nama: 'Memo_Rasmi_NCER_Kedah.pdf',
    Status_Permohonan: 'Pending Penugasan', // Pengarah telah luluskan perjalanan luar negeri, sedia untuk penugasan kenderaan!
    DateTime_Mohon: '2026-11-01 10:00:45',
    Catatan_Pengarah: 'Diluluskan oleh Pengarah KEMAS Negeri Perlis. Sila tugaskan kenderaan SUV dan pemandu.',
    DateTime_Lulus_Pengarah: '2026-11-01 10:15:00',
    Catatan: 'Perjalanan luar negeri diluluskan Pengarah.',
  },
  {
    Request_ID: 'REQ-20261102-0004',
    Pemohon_User_ID: 'USR-0004', // Nurul Farhana
    Priority_Level: 'Normal',
    Jenis_Perjalanan: 'Dalam Negeri',
    Destinasi: 'Pusat Latihan KEMAS Kuala Perlis',
    Tujuan: 'Bengkel Pemantapan Kemahiran Jahitan Komuniti',
    Bilangan_Penumpang: 4,
    Tarikh_Mula: '2026-11-07',
    Masa_Mula: '08:30',
    Tarikh_Tamat: '2026-11-07',
    Masa_Tamat: '16:00',
    Lampiran_PDF_URL: 'https://drive.google.com/file/d/bengkel-jahitan-kuala-perlis/view',
    Lampiran_PDF_Nama: 'Kertas_Kerja_Bengkel_Jahitan.pdf',
    Status_Permohonan: 'Pending Penugasan', // Terus ke Pegawai Kenderaan kerana Dalam Negeri
    DateTime_Mohon: '2026-11-01 11:00:00',
    Catatan: 'Memohon kenderaan van jika tersedia.',
  },
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    Assignment_ID: 'ASN-20261102-0001',
    Request_ID: 'REQ-20261102-0001',
    Vehicle_ID: 'VEH-0001', // RFA 1234
    Driver_ID: 'DRV-0001', // Mohamad Azlan bin Idris
    Status_Assignment: 'Aktif',
    Catatan_Pegawai: 'Sila pastikan log kenderaan diisi dan kad inden minyak diperiksa sebelum bertolak.',
    PDF_Arahan_Memandu_URL: '#',
    DateTime_Assigned: '2026-11-01 10:30:00',
  },
];

export const INITIAL_OVERRIDE_LOGS: OverrideLog[] = [];
