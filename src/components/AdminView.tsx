import React, { useState } from 'react';
import { User, Vehicle, Driver, TripRequest, Assignment, OverrideLog } from '../types';
import {
  ShieldAlert,
  AlertTriangle,
  History,
  Database,
  Car,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Download,
  RotateCcw,
  Stamp,
  FileText,
  Truck,
  Check,
  X,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { isExpiringWithin30Days, formatMalayDateTime } from '../utils/collisionEngine';

interface AdminViewProps {
  currentUser: User;
  users: User[];
  vehicles: Vehicle[];
  drivers: Driver[];
  requests: TripRequest[];
  assignments: Assignment[];
  overrideLogs: OverrideLog[];
  onPengarahApproveLuarNegeri: (requestId: string, notes: string) => void;
  onPengarahRejectLuarNegeri: (requestId: string, reason: string) => void;
  onOpenAssignModal: (req: TripRequest) => void;
  onRenewDriver: (driverId: string, newExpiryDate: string) => void;
  onResetData: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  users,
  vehicles,
  drivers,
  requests,
  assignments,
  overrideLogs,
  onPengarahApproveLuarNegeri,
  onPengarahRejectLuarNegeri,
  onOpenAssignModal,
  onRenewDriver,
  onResetData,
}) => {
  const [adminSubTab, setAdminSubTab] = useState<'pengarah_approval' | 'officer_dispatch' | 'fleet_audit' | 'users_table'>('pengarah_approval');
  const [selectedSheetTab, setSelectedSheetTab] = useState<'Users' | 'Vehicles' | 'Drivers' | 'Trip_Requests' | 'Assignments' | 'Override_Logs'>('Trip_Requests');
  const [renewalDriverId, setRenewalDriverId] = useState<string | null>(null);
  const [newExpiry, setNewExpiry] = useState<string>('2027-12-31');

  // Pengarah review modal
  const [pengarahNotes, setPengarahNotes] = useState<string>('Diluluskan perjalanan luar negeri urusan rasmi KEMAS.');

  // 1. Requests needing Pengarah approval (Luar Negeri ONLY & Status === 'Menunggu Kelulusan Pengarah')
  const luarNegeriPending = requests.filter(
    (r) => r.Jenis_Perjalanan === 'Luar Negeri' && r.Status_Permohonan === 'Menunggu Kelulusan Pengarah'
  );

  // 2. Requests ready for Pegawai Kenderaan to assign (Status === 'Pending Penugasan')
  // Notice: Luar Negeri requests ONLY appear here once approved by Pengarah!
  const readyToAssign = requests.filter((r) => r.Status_Permohonan === 'Pending Penugasan');

  // Expiring drivers (< 30 days)
  const expiringDrivers = drivers
    .map((d) => {
      const exp = isExpiringWithin30Days(d, '2026-11-01');
      const u = users.find((usr) => usr.User_ID === d.User_ID || usr.User_ID === d.Staff_ID);
      return {
        ...d,
        staffName: u?.Nama_Penuh || d.Driver_ID,
        phone: u?.No_Telefon,
        daysLeft: exp.daysLeft,
        isExpiring: exp.isExpiring,
      };
    })
    .filter((d) => d.isExpiring);

  const activeVehicles = vehicles.filter((v) => v.Status_Kenderaan === 'Aktif').length;
  const activeAssignments = assignments.filter((a) => a.Status_Assignment === 'Aktif').length;

  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
            Modul Pentadbir Sistem (Admin & Pengurusan Tertinggi KEMAS Perlis)
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-0.5">
            Portal Pengarah & Pentadbir Armada
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-1">
            Pengesahan permohonan luar negeri dua peringkat, penugasan kenderaan, semakan kuasa memandu & pangkalan data Users
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onResetData}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-white/20"
            title="Reset data ujian"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data Ujian</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-xl shadow-xs border border-slate-200 overflow-x-auto">
        <button
          onClick={() => setAdminSubTab('pengarah_approval')}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            adminSubTab === 'pengarah_approval'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Stamp className="w-4 h-4" />
          <span>Kelulusan Pengarah (Luar Negeri)</span>
          {luarNegeriPending.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-800 text-[10px] font-black animate-pulse">
              {luarNegeriPending.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminSubTab('officer_dispatch')}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            adminSubTab === 'officer_dispatch'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Penugasan Kenderaan (Pegawai)</span>
          {readyToAssign.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-800 text-[10px] font-black">
              {readyToAssign.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminSubTab('fleet_audit')}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            adminSubTab === 'fleet_audit'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Pengawasan Kuasa Memandu (30 Hari)</span>
          {expiringDrivers.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {expiringDrivers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminSubTab('users_table')}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            adminSubTab === 'users_table'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Pemeriksa Jadual Users & Sheets</span>
        </button>
      </div>

      {/* 1. TAB: KELULUSAN PENGARAH (LUAR NEGERI) */}
      {adminSubTab === 'pengarah_approval' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-800 to-rose-900 px-5 py-4 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <Stamp className="w-5 h-5 text-amber-300" />
                Peti Kelulusan Perjalanan Luar Negeri (YBhg. Pengarah KEMAS Negeri Perlis)
              </h3>
              <p className="text-xs text-rose-200">
                Peringkat 1: Pegawai Kenderaan hanya dapat melihat dan menugaskan kenderaan/pemandu SELEPAS permohonan ini diluluskan oleh Pengarah
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white text-rose-900">
              {luarNegeriPending.length} Permohonan Menunggu Kelulusan
            </span>
          </div>

          <div className="p-5">
            {luarNegeriPending.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-bold text-sm text-slate-700">Tiada Permohonan Luar Negeri Pending!</p>
                <p className="text-xs text-slate-400 mt-1">
                  Semua permohonan perjalanan antara negeri telah diputuskan oleh Pengarah.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {luarNegeriPending.map((req) => {
                  const applicant = users.find((u) => u.User_ID === req.Pemohon_User_ID);

                  return (
                    <div
                      key={req.Request_ID}
                      className="p-5 rounded-xl border-2 border-rose-200 bg-rose-50/20 hover:bg-rose-50/40 transition space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-0.5 rounded">
                            {req.Request_ID}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
                            {req.Priority_Level}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            {req.Jenis_Perjalanan}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                          Menunggu Kelulusan Pengarah
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                          {req.Destinasi}
                        </h4>
                        <p className="text-xs text-slate-700 mt-1 pl-5">
                          <strong>Tujuan Rasmi:</strong> {req.Tujuan}
                        </p>
                      </div>

                      {/* PDF Surat Mesyuarat / Bengkel yang di-upload */}
                      <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-rose-800">
                          <FileText className="w-5 h-5 text-rose-600 shrink-0" />
                          <div>
                            <span className="font-bold block">Dokumen Sokongan (Surat Mesyuarat/Bengkel):</span>
                            <span className="text-slate-600 text-[11px]">
                              {req.Lampiran_PDF_Nama || 'Dokumen_Sokongan_Luar_Negeri.pdf'}
                            </span>
                          </div>
                        </div>

                        {req.Lampiran_PDF_URL ? (
                          <a
                            href={req.Lampiran_PDF_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Buka Surat PDF</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Tiada pautan fail</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                        <div>
                          <strong>Pegawai Pemohon:</strong> {applicant?.Nama_Penuh} ({applicant?.Bahagian})
                        </div>
                        <div>
                          <strong>Jadual:</strong> {formatMalayDateTime(req.Tarikh_Mula, req.Masa_Mula)} &rarr;{' '}
                          {formatMalayDateTime(req.Tarikh_Tamat, req.Masa_Tamat)}
                        </div>
                      </div>

                      {/* Tindakan Pengarah */}
                      <div className="pt-3 border-t border-rose-200 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-500 italic">
                          Tindakan rasmi YBhg. Pengarah KEMAS Negeri Perlis
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onPengarahRejectLuarNegeri(req.Request_ID, 'Tidak diluluskan perjalanan luar negeri buat masa ini.')}
                            className="px-3 py-1.5 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak Permohonan</span>
                          </button>

                          <button
                            onClick={() => onPengarahApproveLuarNegeri(req.Request_ID, 'Diluluskan perjalanan luar negeri oleh Pengarah KEMAS Perlis. Sedia untuk penugasan kenderaan.')}
                            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Luluskan Perjalanan Luar Negeri</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TAB: PETI PENUGASAN PEGAWAI KENDERAAN (PENDING PENUGASAN) */}
      {adminSubTab === 'officer_dispatch' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-600" />
                Peti Penugasan Pegawai Kenderaan (Sedia Ditugaskan)
              </h3>
              <p className="text-xs text-slate-500">
                Mengandungi permohonan Dalam Negeri dan permohonan Luar Negeri yang TELAH DILULUSKAN oleh Pengarah KEMAS Perlis
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
              {readyToAssign.length} Sedia Ditugaskan
            </span>
          </div>

          <div className="p-5">
            {readyToAssign.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-700">Tiada Permohonan Menunggu Penugasan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {readyToAssign.map((req) => {
                  const applicant = users.find((u) => u.User_ID === req.Pemohon_User_ID);

                  return (
                    <div
                      key={req.Request_ID}
                      className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 bg-white transition hover:shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                            {req.Request_ID}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
                            {req.Priority_Level}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                            {req.Jenis_Perjalanan}
                          </span>
                          {req.Catatan_Pengarah && (
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                              ✓ Diluluskan Pengarah
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                            {req.Destinasi}
                          </h4>
                          <p className="text-xs text-slate-600 pl-5">{req.Tujuan}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 pl-5">
                          <div>
                            <strong>Pemohon:</strong> {applicant?.Nama_Penuh}
                          </div>
                          <div>
                            <strong>Jadual:</strong> {formatMalayDateTime(req.Tarikh_Mula, req.Masa_Mula)} &rarr;{' '}
                            {formatMalayDateTime(req.Tarikh_Tamat, req.Masa_Tamat)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onOpenAssignModal(req)}
                        className="self-end lg:self-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 transform active:scale-95"
                      >
                        <Car className="w-4 h-4" />
                        <span>Tugaskan Kenderaan</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. TAB: PENGAWASAN KUASA MEMANDU & OVERRIDE */}
      {adminSubTab === 'fleet_audit' && (
        <div className="space-y-6">
          {/* 30-Day Driver Expiry Alert Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-700 to-amber-700 px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-300" />
                <h3 className="font-black text-sm sm:text-base">
                  Peringatan Sistem: Kuasa Memandu Tamat Dalam Tempoh 30 Hari
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-rose-800">
                {expiringDrivers.length} Pemandu Terlibat
              </span>
            </div>

            <div className="p-5">
              {expiringDrivers.length === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Semua pemandu KEMAS Perlis mempunyai kuasa memandu yang sah melebihi 30 hari.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Pemandu di bawah mempunyai tarikh tamat kuasa memandu kurang dari 30 hari dari tarikh hari ini (2026-11-01). Sistem akan mencetuskan amaran dan menghalang penugasan jika tempoh luput:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {expiringDrivers.map((drv) => (
                      <div
                        key={drv.Driver_ID}
                        className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl flex flex-col justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-sm text-slate-900">{drv.staffName}</span>
                            <span className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold text-[10px]">
                              Baki {drv.daysLeft} Hari!
                            </span>
                          </div>
                          <div className="text-slate-600 mt-1 space-y-0.5">
                            <div>
                              <strong>ID Pemandu:</strong> {drv.Driver_ID} ({drv.Jenis_Pemandu})
                            </div>
                            <div>
                              <strong>Tarikh Tamat Kuasa:</strong>{' '}
                              <span className="font-mono text-rose-700 font-bold">{drv.Tarikh_Tamat_Kuasa}</span>
                            </div>
                          </div>
                        </div>

                        {renewalDriverId === drv.Driver_ID ? (
                          <div className="pt-2 border-t border-rose-200 flex items-center gap-2">
                            <input
                              type="date"
                              value={newExpiry}
                              onChange={(e) => setNewExpiry(e.target.value)}
                              className="px-2 py-1 bg-white border border-rose-300 rounded text-xs font-mono"
                            />
                            <button
                              onClick={() => {
                                onRenewDriver(drv.Driver_ID, newExpiry);
                                setRenewalDriverId(null);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setRenewalDriverId(null)}
                              className="px-2 py-1 text-slate-500 text-xs"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRenewalDriverId(drv.Driver_ID)}
                            className="self-end px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Perbaharui Kuasa Memandu</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Override Logs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
              <History className="w-5 h-5 text-indigo-700" />
              <h3 className="font-extrabold text-base text-slate-800">
                Log Pembatalan & Kuasa Override Jadual
              </h3>
            </div>

            <div className="mt-4">
              {overrideLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tiada rekod pembatalan kuasa override direkodkan setakat ini.
                </div>
              ) : (
                <div className="table-responsive overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5">Waktu Override</th>
                        <th className="p-2.5">Pegawai Bertanggungjawab</th>
                        <th className="p-2.5">Permohonan Mendesak</th>
                        <th className="p-2.5">Assignment Dibatalkan</th>
                        <th className="p-2.5">Justifikasi Pembatalan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {overrideLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-500">{log.timestamp}</td>
                          <td className="p-2.5 font-bold text-slate-800">{log.officer_name}</td>
                          <td className="p-2.5 font-bold text-purple-700">{log.urgent_request_id}</td>
                          <td className="p-2.5 font-bold text-rose-700">{log.assignment_id}</td>
                          <td className="p-2.5 text-slate-700 italic">{log.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: PEMERIKSA JADUAL USERS & GOOGLE SHEETS */}
      {adminSubTab === 'users_table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-base text-slate-800">
                  Pemeriksa Jadual Users & Helaian Google Sheets
                </h3>
                <p className="text-xs text-slate-500">
                  Jadual Users dengan 3 peranan utama: Admin, Staff, dan Pemandu
                </p>
              </div>
            </div>

            {/* Sheet Selector Tabs */}
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {(['Users', 'Trip_Requests', 'Assignments', 'Vehicles', 'Drivers', 'Override_Logs'] as const).map(
                (sheetName) => (
                  <button
                    key={sheetName}
                    onClick={() => setSelectedSheetTab(sheetName)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      selectedSheetTab === sheetName
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sheetName}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Table Content */}
          <div className="mt-4 overflow-x-auto text-xs">
            {selectedSheetTab === 'Users' && (
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2">User_ID</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Nama_Penuh</th>
                    <th className="p-2">Jawatan</th>
                    <th className="p-2">Bahagian</th>
                    <th className="p-2">No_Telefon</th>
                    <th className="p-2">Role</th>
                    <th className="p-2">Status_Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.User_ID} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-blue-900">{u.User_ID}</td>
                      <td className="p-2 text-slate-600">{u.Email}</td>
                      <td className="p-2 font-sans font-medium text-slate-900">
                        {u.Nama_Penuh} {u.Is_Pengarah && <span className="text-[10px] bg-rose-100 text-rose-800 px-1 rounded font-bold">Pengarah</span>}
                      </td>
                      <td className="p-2 font-sans text-slate-600">{u.Jawatan}</td>
                      <td className="p-2 font-sans text-slate-600">{u.Bahagian}</td>
                      <td className="p-2 text-slate-600">{u.No_Telefon}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.Role === 'Admin' ? 'bg-purple-100 text-purple-900' : (u.Role === 'Pemandu' ? 'bg-emerald-100 text-emerald-900' : 'bg-blue-100 text-blue-900')
                        }`}>
                          {u.Role}
                        </span>
                      </td>
                      <td className="p-2">{u.Status_Aktif}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedSheetTab === 'Trip_Requests' && (
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2">Request_ID</th>
                    <th className="p-2">Pemohon</th>
                    <th className="p-2">Jenis</th>
                    <th className="p-2">Destinasi</th>
                    <th className="p-2">Mula &rarr; Tamat</th>
                    <th className="p-2">Lampiran_PDF</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => (
                    <tr key={r.Request_ID} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-blue-900">{r.Request_ID}</td>
                      <td className="p-2 text-slate-600">{r.Pemohon_User_ID}</td>
                      <td className="p-2">{r.Jenis_Perjalanan}</td>
                      <td className="p-2 font-sans font-medium text-slate-900">{r.Destinasi}</td>
                      <td className="p-2 text-slate-600">{r.Tarikh_Mula} - {r.Tarikh_Tamat}</td>
                      <td className="p-2 text-rose-700">{r.Lampiran_PDF_Nama || '-'}</td>
                      <td className="p-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                          {r.Status_Permohonan}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedSheetTab === 'Assignments' && (
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2">Assignment_ID</th>
                    <th className="p-2">Request_ID</th>
                    <th className="p-2">Vehicle_ID</th>
                    <th className="p-2">Driver_ID</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Catatan_Pegawai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((a) => (
                    <tr key={a.Assignment_ID} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-blue-900">{a.Assignment_ID}</td>
                      <td className="p-2 text-slate-600">{a.Request_ID}</td>
                      <td className="p-2 text-rose-700 font-bold">{a.Vehicle_ID}</td>
                      <td className="p-2 text-emerald-700 font-bold">{a.Driver_ID}</td>
                      <td className="p-2">{a.Status_Assignment}</td>
                      <td className="p-2 font-sans text-slate-600">{a.Catatan_Pegawai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedSheetTab === 'Vehicles' && (
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2">Vehicle_ID</th>
                    <th className="p-2">No_Plat</th>
                    <th className="p-2">Model_Kenderaan</th>
                    <th className="p-2">Kapasiti</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((v) => (
                    <tr key={v.Vehicle_ID} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-blue-900">{v.Vehicle_ID}</td>
                      <td className="p-2 font-bold text-rose-700">{v.No_Plat}</td>
                      <td className="p-2 font-sans font-medium text-slate-900">{v.Model_Kenderaan}</td>
                      <td className="p-2">{v.Kapasiti} Tempat Duduk</td>
                      <td className="p-2">{v.Status_Kenderaan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedSheetTab === 'Drivers' && (
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2">Driver_ID</th>
                    <th className="p-2">User_ID</th>
                    <th className="p-2">Jenis</th>
                    <th className="p-2">Mula_Kuasa</th>
                    <th className="p-2">Tamat_Kuasa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drivers.map((d) => (
                    <tr key={d.Driver_ID} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-blue-900">{d.Driver_ID}</td>
                      <td className="p-2 text-slate-600">{d.User_ID || d.Staff_ID}</td>
                      <td className="p-2">{d.Jenis_Pemandu}</td>
                      <td className="p-2">{d.Tarikh_Mula_Kuasa}</td>
                      <td className="p-2 font-bold text-rose-700">{d.Tarikh_Tamat_Kuasa || 'Tetap'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
