import React, { useState } from 'react';
import { TripRequest, Assignment, Vehicle, Driver, Staff, PriorityLevel, OverrideLog } from '../types';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Car,
  UserCheck,
  Calendar,
  Clock,
  ShieldAlert,
  MapPin,
  FileCheck2,
  Send,
  MessageSquare,
  Zap,
  Info,
} from 'lucide-react';
import {
  checkScheduleCollision,
  isDriverAuthorized,
  canOverrideConflict,
  formatMalayDateTime,
} from '../utils/collisionEngine';

interface PegawaiViewProps {
  currentUser: Staff;
  requests: TripRequest[];
  assignments: Assignment[];
  vehicles: Vehicle[];
  drivers: Driver[];
  staff: Staff[];
  onAssignTrip: (payload: {
    requestId: string;
    vehicleId: string;
    driverId: string;
    notes: string;
    isOverride?: boolean;
    conflictingAssignmentId?: string;
    overrideReason?: string;
  }) => void;
  onRejectTrip: (requestId: string, reason: string) => void;
  onViewOrder: (req: TripRequest, asn: Assignment) => void;
}

export const PegawaiView: React.FC<PegawaiViewProps> = ({
  currentUser,
  requests,
  assignments,
  vehicles,
  drivers,
  staff,
  onAssignTrip,
  onRejectTrip,
  onViewOrder,
}) => {
  // Modal States
  const [selectedRequest, setSelectedRequest] = useState<TripRequest | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [officerNotes, setOfficerNotes] = useState<string>('Sila semak buku log kenderaan dan patuhi had laju kebangsaan.');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isOverrideMode, setIsOverrideMode] = useState<boolean>(false);

  // Reject Modal
  const [rejectingRequest, setRejectingRequest] = useState<TripRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const pendingRequests = requests.filter((r) => r.Status_Permohonan === 'Pending Penugasan');

  // Sort by Priority: Arahan Ketua Jabatan (1), Segera (2), Normal (3)
  const priorityWeight: Record<PriorityLevel, number> = {
    'Arahan Ketua Jabatan': 1,
    'Segera': 2,
    'Normal': 3,
  };

  const sortedPendingRequests = [...pendingRequests].sort(
    (a, b) => priorityWeight[a.Priority_Level] - priorityWeight[b.Priority_Level]
  );

  const activeVehicles = vehicles.filter((v) => v.Status_Kenderaan === 'Aktif');

  // Open Assignment Modal
  const handleOpenAssign = (req: TripRequest) => {
    setSelectedRequest(req);
    setIsOverrideMode(false);
    setOverrideReason('');

    // Pre-select first active vehicle and first valid driver
    const defaultVeh = activeVehicles[0]?.Vehicle_ID || '';
    const defaultDrv = drivers[0]?.Driver_ID || '';
    setSelectedVehicleId(defaultVeh);
    setSelectedDriverId(defaultDrv);
  };

  // Perform Live Collision Check for modal selection
  const collisionResult = selectedRequest && selectedVehicleId && selectedDriverId
    ? checkScheduleCollision({
        vehicleId: selectedVehicleId,
        driverId: selectedDriverId,
        newStartDate: selectedRequest.Tarikh_Mula,
        newStartTime: selectedRequest.Masa_Mula,
        newEndDate: selectedRequest.Tarikh_Tamat,
        newEndTime: selectedRequest.Masa_Tamat,
        assignments,
        requests,
        vehicles,
        drivers,
        staff,
        excludeRequestId: selectedRequest.Request_ID,
      })
    : null;

  // Selected driver validity check
  const selectedDriverObj = drivers.find((d) => d.Driver_ID === selectedDriverId);
  const driverValidity = selectedDriverObj
    ? isDriverAuthorized(selectedDriverObj, '2026-11-01')
    : { isValid: false, reason: 'Pemandu tidak dipilih' };

  const handleConfirmAssignment = () => {
    if (!selectedRequest || !selectedVehicleId || !selectedDriverId) return;

    if (!driverValidity.isValid) {
      alert(`Pemandu tidak boleh ditugaskan: ${driverValidity.reason}`);
      return;
    }

    if (collisionResult?.hasCollision) {
      if (!canOverrideConflict(selectedRequest.Priority_Level)) {
        alert('Terdapat konflik pertindihan jadual. Permohonan Normal tidak boleh melakukan Override.');
        return;
      }

      if (!overrideReason.trim()) {
        alert('Sila masukkan justifikasi pembatalan (Override Reason) bagi kes kecemasan/arahan khas ini.');
        return;
      }

      const conflictingAsn = collisionResult.conflictingAssignments[0];

      onAssignTrip({
        requestId: selectedRequest.Request_ID,
        vehicleId: selectedVehicleId,
        driverId: selectedDriverId,
        notes: officerNotes,
        isOverride: true,
        conflictingAssignmentId: conflictingAsn?.Assignment_ID,
        overrideReason: overrideReason.trim(),
      });
    } else {
      onAssignTrip({
        requestId: selectedRequest.Request_ID,
        vehicleId: selectedVehicleId,
        driverId: selectedDriverId,
        notes: officerNotes,
        isOverride: false,
      });
    }

    setSelectedRequest(null);
  };

  const handleConfirmReject = () => {
    if (!rejectingRequest || !rejectReason.trim()) return;
    onRejectTrip(rejectingRequest.Request_ID, rejectReason.trim());
    setRejectingRequest(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Officer Header Card */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-amber-300">
            Modul Pegawai Kenderaan (Pengangkutan & Aset KEMAS Perlis)
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-0.5">
            Peti Masuk Penugasan & Kelulusan Kenderaan
          </h2>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-1">
            Algoritma Pengesanan & Pencegahan Pertindihan Jadual (Double-Booking Prevention Engine)
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
          <div className="text-right">
            <span className="text-[11px] text-amber-200 block">Menunggu Kelulusan</span>
            <span className="text-xl font-black text-white">{pendingRequests.length} Permohonan</span>
          </div>
        </div>
      </div>

      {/* Priority Queues */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Senarai Permohonan Pending Mengikut Keutamaan
            </h3>
            <p className="text-xs text-slate-500">
              Permohonan &lsquo;Arahan Ketua Jabatan&rsquo; dan &lsquo;Segera&rsquo; diletakkan di bahagian atas dengan kuasa khas Override
            </p>
          </div>
        </div>

        {sortedPendingRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-sm text-slate-700">Tiada Permohonan Pending!</p>
            <p className="text-xs text-slate-400 mt-1">Semua permohonan telah disemak dan ditugaskan.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedPendingRequests.map((req) => {
              const applicant = staff.find((s) => s.User_ID === req.Pemohon_User_ID || s.Staff_ID === req.Pemohon_Staff_ID);
              const isUrgent = req.Priority_Level === 'Arahan Ketua Jabatan' || req.Priority_Level === 'Segera';

              return (
                <div
                  key={req.Request_ID}
                  className={`p-4 sm:p-5 transition hover:bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    req.Priority_Level === 'Arahan Ketua Jabatan'
                      ? 'border-l-4 border-l-purple-600 bg-purple-50/20'
                      : req.Priority_Level === 'Segera'
                      ? 'border-l-4 border-l-amber-500 bg-amber-50/20'
                      : 'border-l-4 border-l-blue-400'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-1 rounded text-slate-800">
                        {req.Request_ID}
                      </span>

                      {req.Priority_Level === 'Arahan Ketua Jabatan' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-600 text-white flex items-center gap-1 shadow-xs">
                          <Zap className="w-3.5 h-3.5" /> Arahan Ketua Jabatan
                        </span>
                      ) : req.Priority_Level === 'Segera' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-600 text-white flex items-center gap-1 shadow-xs">
                          <AlertTriangle className="w-3.5 h-3.5" /> Segera (Mendesak)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          Normal
                        </span>
                      )}

                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {req.Jenis_Perjalanan}
                      </span>

                      <span className="text-[11px] text-slate-400">
                        Dimohon pada: {req.DateTime_Mohon}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                        {req.Destinasi}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        <strong className="text-slate-800">Tujuan:</strong> {req.Tujuan}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                      <div>
                        <span className="text-slate-700 font-semibold">Pemohon:</span>{' '}
                        {applicant?.Nama_Penuh || req.Pemohon_User_ID} ({applicant?.Bahagian || '-'})
                      </div>
                      <div>
                        <span className="text-slate-700 font-semibold">Masa Perjalanan:</span>{' '}
                        {formatMalayDateTime(req.Tarikh_Mula, req.Masa_Mula)} &rarr;{' '}
                        {formatMalayDateTime(req.Tarikh_Tamat, req.Masa_Tamat)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      onClick={() => setRejectingRequest(req)}
                      className="px-3 py-2 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Tolak</span>
                    </button>

                    <button
                      onClick={() => handleOpenAssign(req)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 transform active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Tugaskan Kenderaan</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ASSIGNMENT MODAL WITH LIVE COLLISION ENGINE */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-[#0f2d5c] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                  <Car className="w-5 h-5 text-amber-400" />
                  Penugasan Kenderaan & Pemandu Rasmi
                </h3>
                <span className="text-xs text-blue-200">
                  Semakan Kelulusan Permohonan #{selectedRequest.Request_ID}
                </span>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* Trip Target Summary Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{selectedRequest.Destinasi}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">
                    {selectedRequest.Priority_Level}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  {selectedRequest.Tujuan}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Masa: {selectedRequest.Tarikh_Mula} {selectedRequest.Masa_Mula} &rarr; {selectedRequest.Tarikh_Tamat} {selectedRequest.Masa_Tamat}
                </div>
              </div>

              {/* 1. Pilih Kenderaan */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Pilih Kenderaan Jabatan (Aktif):</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {activeVehicles.length} kenderaan aktif
                  </span>
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {activeVehicles.map((v) => (
                    <option key={v.Vehicle_ID} value={v.Vehicle_ID}>
                      {v.No_Plat} - {v.Model_Kenderaan} ({v.Kapasiti} Tempat Duduk)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Pilih Pemandu */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Pilih Pemandu Bertugas:</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {drivers.length} rekod pemandu
                  </span>
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {drivers.map((d) => {
                    const st = staff.find((s) => s.User_ID === (d.User_ID || d.Staff_ID) || s.Staff_ID === (d.User_ID || d.Staff_ID));
                    const auth = isDriverAuthorized(d, '2026-11-01');
                    return (
                      <option key={d.Driver_ID} value={d.Driver_ID}>
                        {st?.Nama_Penuh || d.Driver_ID} ({d.Jenis_Pemandu}) - {auth.isValid ? 'Kuasa Sah' : 'Kuasa Luput!'}
                      </option>
                    );
                  })}
                </select>

                {/* Driver Validity Indicator */}
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                  {driverValidity.isValid ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> {driverValidity.reason}
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" /> {driverValidity.reason}
                    </span>
                  )}
                </div>
              </div>

              {/* 3. COLLISION STATUS & OVERRIDE PANEL */}
              {collisionResult?.hasCollision && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-rose-900">
                        AMARAN: PERTINDIHAN JADUAL DIKESAN (COLLISION PREVENTED)!
                      </h4>
                      <p className="text-xs text-rose-700 mt-1">
                        Algoritma Collision mendapati kenderaan atau pemandu ini telah mempunyai penugasan aktif lain pada masa yang sama:
                      </p>
                      <ul className="list-disc list-inside mt-2 text-[11px] text-rose-800 space-y-1">
                        {collisionResult.details.map((detail, idx) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Override Privilege Logic */}
                  {canOverrideConflict(selectedRequest.Priority_Level) ? (
                    <div className="pt-3 border-t border-rose-200">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-purple-700 text-white rounded text-[10px] font-bold">
                          KUASA OVERRIDE DIBENARKAN
                        </span>
                        <span className="text-xs text-purple-900 font-semibold">
                          Permohonan {selectedRequest.Priority_Level} layak membatalkan assignment sedia ada.
                        </span>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Justifikasi Pembatalan (Mandatori) <span className="text-rose-600">*</span>:
                        </label>
                        <textarea
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          rows={2}
                          placeholder="Nyatakan alasan pembatalan penugasan sebelumnya (cth: Arahan mendesak Pengarah KEMAS Perlis bagi mesyuarat bersama NCER)..."
                          className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-100/60 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>
                        Permohonan ini bertaraf <strong>Normal</strong>. Fungsi Override tidak dibenarkan. Sila pilih kenderaan atau pemandu lain yang tidak bertindih.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Catatan Pegawai Kenderaan */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Catatan / Arahan Khas Pegawai Kenderaan:
                </label>
                <textarea
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmAssignment}
                disabled={
                  !driverValidity.isValid ||
                  (collisionResult?.hasCollision && !canOverrideConflict(selectedRequest.Priority_Level)) ||
                  (collisionResult?.hasCollision && canOverrideConflict(selectedRequest.Priority_Level) && !overrideReason.trim())
                }
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 ${
                  collisionResult?.hasCollision
                    ? 'bg-purple-700 hover:bg-purple-800 text-white disabled:opacity-50'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50'
                }`}
              >
                {collisionResult?.hasCollision ? (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Luluskan Dengan Override</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Luluskan & Terbitkan Arahan Memandu</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-rose-700 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Tolak Permohonan Kenderaan
              </h3>
              <button onClick={() => setRejectingRequest(null)} className="text-white">
                &times;
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs sm:text-sm">
              <p className="text-slate-600">
                Sila nyatakan justifikasi rasmi penolakan bagi permohonan <strong>#{rejectingRequest.Request_ID}</strong> ({rejectingRequest.Destinasi}):
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="cth: Tiada kenderaan yang sesuai tersedia dalam tempoh masa yang dipohon..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                required
              />
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setRejectingRequest(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                Sahkan Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
