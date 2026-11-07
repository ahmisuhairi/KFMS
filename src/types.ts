/**
 * KFMS - KEMAS Fleet Management System (Negeri Perlis)
 * Type Definitions & Interfaces (Versi 2.0: Two-Tier Approval & Users Table)
 */

export type Role = 'Pengarah' | 'Pemohon' | 'Pegawai_Kenderaan' | 'Pemandu' | 'Admin' | 'Staff';

export type StatusAktif = 'Yes' | 'No';

export type VehicleStatus = 'Aktif' | 'Penyelenggaraan' | 'Tidak Aktif';

export type DriverType = 'Tetap' | 'Ganti' | 'Sementara';

export type PriorityLevel = 'Normal' | 'Segera' | 'Arahan Ketua Jabatan';

export type TripType = 'Dalam Negeri' | 'Luar Negeri';

export type RequestStatus =
  | 'Menunggu Kelulusan Pengarah' // Luar Negeri peringkat 1
  | 'Pending Penugasan'          // Sedia untuk Pegawai Kenderaan (Dalam Negeri atau Luar Negeri lulus Pengarah)
  | 'Lulus'                      // Selesai penugasan kenderaan & pemandu
  | 'Ditolak Pengarah'           // Ditolak oleh Pengarah KEMAS
  | 'Ditolak Pegawai'            // Ditolak oleh Pegawai Kenderaan
  | 'Dibatalkan';                // Dibatalkan oleh pemohon / override

export type AssignmentStatus = 'Aktif' | 'Dibatalkan';

export interface User {
  User_ID: string;
  Staff_ID?: string; // alias
  Email: string;
  Nama_Penuh: string;
  Jawatan: string;
  Bahagian: string;
  No_Telefon: string;
  Role: Role;
  Status_Aktif: StatusAktif;
  Is_Pengarah?: boolean; // Khusus Pengarah KEMAS Negeri Perlis (Admin)
}

// Alias for backwards compatibility
export type Staff = User;

export interface Vehicle {
  Vehicle_ID: string;
  No_Plat: string;
  Model_Kenderaan: string;
  Kapasiti: number;
  Status_Kenderaan: VehicleStatus;
  Catatan?: string;
}

export interface Driver {
  Driver_ID: string;
  User_ID: string; // Merujuk Users[User_ID]
  Staff_ID?: string; // alias
  Jenis_Pemandu: DriverType;
  Tarikh_Mula_Kuasa: string; // YYYY-MM-DD
  Tarikh_Tamat_Kuasa: string; // YYYY-MM-DD or empty for permanent
  Tahun_Kuasa: number;
}

export interface TripRequest {
  Request_ID: string;
  Pemohon_User_ID: string;
  Pemohon_Staff_ID?: string; // alias
  Priority_Level: PriorityLevel;
  Jenis_Perjalanan: TripType;
  Destinasi: string;
  Tujuan: string;
  Bilangan_Penumpang?: number;
  Tarikh_Mula: string; // YYYY-MM-DD
  Masa_Mula: string; // HH:mm
  Tarikh_Tamat: string; // YYYY-MM-DD
  Masa_Tamat: string; // HH:mm
  Lampiran_PDF_URL?: string; // Pautan Google Drive
  Lampiran_PDF_Nama?: string; // Nama fail surat sokongan
  Lampiran_PDF_Data?: string; // Base64 data jika ada
  Status_Permohonan: RequestStatus;
  DateTime_Mohon: string; // YYYY-MM-DD HH:mm:ss
  Catatan_Pengarah?: string; // Catatan kelulusan perjalanan luar negeri
  DateTime_Lulus_Pengarah?: string;
  Catatan?: string; // Justifikasi / catatan umum
}

export interface Assignment {
  Assignment_ID: string;
  Request_ID: string;
  Vehicle_ID: string;
  Driver_ID: string;
  Status_Assignment: AssignmentStatus;
  Catatan_Pegawai: string;
  PDF_Arahan_Memandu_URL?: string;
  DateTime_Assigned: string;
  Overridden_By?: string;
  Override_Reason?: string;
  Overridden_DateTime?: string;
}

export interface OverrideLog {
  id: string;
  assignment_id: string;
  request_id: string;
  urgent_request_id: string;
  cancelled_vehicle: string;
  cancelled_driver: string;
  reason: string;
  officer_name: string;
  timestamp: string;
}

export interface CollisionCheckResult {
  hasCollision: boolean;
  vehicleConflict: boolean;
  driverConflict: boolean;
  conflictingAssignments: Assignment[];
  details: string[];
}
