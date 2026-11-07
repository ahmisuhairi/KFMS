import React from 'react';
import { Staff, Driver, Assignment, TripRequest, Vehicle } from '../types';
import {
  Truck,
  IdCard,
  Calendar,
  Clock,
  MapPin,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { isDriverAuthorized, formatMalayDateTime } from '../utils/collisionEngine';

interface PemanduViewProps {
  currentUser: Staff;
  driverRecord?: Driver;
  assignments: Assignment[];
  requests: TripRequest[];
  vehicles: Vehicle[];
  staff: Staff[];
  onViewOrder: (req: TripRequest, asn: Assignment) => void;
  onDownloadPdf: (req: TripRequest, asn: Assignment) => void;
}

export const PemanduView: React.FC<PemanduViewProps> = ({
  currentUser,
  driverRecord,
  assignments,
  requests,
  vehicles,
  staff,
  onViewOrder,
  onDownloadPdf,
}) => {
  // Check if driver has an active Driver table entry
  const driverId = driverRecord?.Driver_ID;
  const myAssignments = assignments.filter(
    (a) => a.Driver_ID === driverId && a.Status_Assignment === 'Aktif'
  );

  const validity = driverRecord
    ? isDriverAuthorized(driverRecord, '2026-11-01')
    : { isValid: false, reason: 'Rekod pemandu tidak ditemui' };

  return (
    <div className="space-y-6">
      {/* Driver Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-300">
            Portal Pemandu Kenderaan KEMAS Negeri Perlis
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-0.5">
            Selamat Bertugas, {currentUser.Nama_Penuh}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            {currentUser.Jawatan} &bull; {currentUser.Bahagian}
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
          <div className="text-right">
            <span className="text-[11px] text-emerald-200 block">Tugasan Aktif</span>
            <span className="text-xl font-black text-amber-300">{myAssignments.length} Penugasan</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Driver Authorization Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                <IdCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                  Status Kuasa Memandu Tahunan
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  ID: {driverId || 'Tiada'}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Jenis Pemandu:</span>
                  <strong className="text-slate-800">{driverRecord?.Jenis_Pemandu || 'Tetap'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tahun Kuasa:</span>
                  <strong className="text-slate-800">{driverRecord?.Tahun_Kuasa || 2026}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarikh Mula Kuasa:</span>
                  <span className="font-mono text-slate-700">{driverRecord?.Tarikh_Mula_Kuasa || '2026-01-01'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarikh Tamat Kuasa:</span>
                  <span className="font-mono text-slate-700">
                    {driverRecord?.Tarikh_Tamat_Kuasa || 'Tetap (Tiada Had Tempoh)'}
                  </span>
                </div>
              </div>

              {/* Status Alert Badge */}
              <div
                className={`p-3 rounded-xl border flex items-center space-x-2.5 ${
                  validity.isValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {validity.isValid ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold block text-xs">
                    {validity.isValid ? 'Kuasa Memandu Sah' : 'Kuasa Memandu Tidak Sah'}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {validity.reason}
                  </span>
                </div>
              </div>

              {/* Driver Safety Reminders */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                <strong className="block font-bold mb-1">Peringatan Tugas:</strong>
                Sila pastikan buku log kenderaan (Kad Inden) diisi sebelum bertolak dan simpan semua resit tol / minyak bagi tujuan penyelarasan.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Upcoming Tasks List */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-800">
                  Senarai Tugasan Akan Datang
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                {myAssignments.length} Tugasan
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {myAssignments.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Tiada tugasan pemanduan aktif dijadualkan buat masa ini.
                </div>
              ) : (
                myAssignments.map((asn) => {
                  const req = requests.find((r) => r.Request_ID === asn.Request_ID);
                  const veh = vehicles.find((v) => v.Vehicle_ID === asn.Vehicle_ID);
                  const applicant = req ? staff.find((s) => s.User_ID === req.Pemohon_User_ID) : null;

                  if (!req) return null;

                  return (
                    <div
                      key={asn.Assignment_ID}
                      className="p-5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white transition hover:shadow-xs space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded">
                            {asn.Assignment_ID}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            (Rujukan: {req.Request_ID})
                          </span>
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {req.Priority_Level}
                        </span>
                      </div>

                      {/* Destination & Purpose */}
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                          {req.Destinasi}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 pl-6">
                          <strong>Tujuan:</strong> {req.Tujuan}
                        </p>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                        <div>
                          <span className="text-slate-500 block">Kenderaan Ditugaskan:</span>
                          <strong className="text-slate-900 font-mono text-sm">
                            {veh?.No_Plat} - {veh?.Model_Kenderaan}
                          </strong>
                          <span className="block text-[11px] text-slate-500">
                            Kapasiti: {veh?.Kapasiti} Penumpang
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block">Jadual Perjalanan:</span>
                          <strong>Pergi:</strong> {formatMalayDateTime(req.Tarikh_Mula, req.Masa_Mula)}
                          <br />
                          <strong>Balik:</strong> {formatMalayDateTime(req.Tarikh_Tamat, req.Masa_Tamat)}
                        </div>

                        <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                          <span className="text-slate-500 block">Pegawai Menumpang (Pemohon):</span>
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                            <div>
                              <strong className="text-slate-900">{applicant?.Nama_Penuh}</strong>
                              <span className="text-slate-500 ml-1">({applicant?.Bahagian})</span>
                            </div>

                            {/* WhatsApp Direct Action Button */}
                            {applicant?.No_Telefon && (
                              <a
                                href={`https://wa.me/${applicant.No_Telefon}?text=${encodeURIComponent(
                                  `Assalammualaikum ${applicant.Nama_Penuh}, saya pemandu kenderaan KEMAS (${currentUser.Nama_Penuh}) bagi tugasan rasmi #${asn.Assignment_ID} ke ${req.Destinasi}. Sila maklumkan masa dan lokasi pengambilan. Terima kasih.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Hubungi Pemohon (WhatsApp)</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Official PDF Action */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 italic">
                          Catatan: {asn.Catatan_Pegawai || 'Patuhi jadual tugas.'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onViewOrder(req, asn)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Papar Arahan Memandu</span>
                          </button>

                          <button
                            onClick={() => onDownloadPdf(req, asn)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <span>Muat Turun PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
