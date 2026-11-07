import React, { useState } from 'react';
import { User, TripRequest, Vehicle } from '../types';
import {
  Stamp,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Calendar,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Car,
  Users as UsersIcon,
  Search,
} from 'lucide-react';
import { formatMalayDateTime } from '../utils/collisionEngine';

interface PengarahViewProps {
  currentUser: User;
  users: User[];
  requests: TripRequest[];
  vehicles: Vehicle[];
  onApproveLuarNegeri: (requestId: string, notes: string) => void;
  onRejectLuarNegeri: (requestId: string, reason: string) => void;
}

export const PengarahView: React.FC<PengarahViewProps> = ({
  currentUser,
  users,
  requests,
  vehicles,
  onApproveLuarNegeri,
  onRejectLuarNegeri,
}) => {
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [historySearch, setHistorySearch] = useState<string>('');

  // 1. Permohonan Luar Negeri yang Menunggu Kelulusan Pengarah
  const pendingLuarNegeri = requests.filter(
    (r) => r.Jenis_Perjalanan === 'Luar Negeri' && r.Status_Permohonan === 'Menunggu Kelulusan Pengarah'
  );

  // 2. Sejarah Permohonan Luar Negeri yang telah diputuskan
  const decidedLuarNegeri = requests.filter(
    (r) =>
      r.Jenis_Perjalanan === 'Luar Negeri' &&
      (r.Status_Permohonan === 'Pending Penugasan' ||
        r.Status_Permohonan === 'Lulus' ||
        r.Status_Permohonan === 'Ditolak Pengarah')
  );

  const filteredHistory = decidedLuarNegeri.filter(
    (r) =>
      r.Request_ID.toLowerCase().includes(historySearch.toLowerCase()) ||
      r.Destinasi.toLowerCase().includes(historySearch.toLowerCase()) ||
      r.Tujuan.toLowerCase().includes(historySearch.toLowerCase())
  );

  const handleApprove = (reqId: string) => {
    const note = approvalNotes[reqId] || 'Diluluskan perjalanan luar negeri urusan rasmi KEMAS.';
    onApproveLuarNegeri(reqId, note);
  };

  const handleRejectConfirm = () => {
    if (!rejectingRequestId || !rejectReason.trim()) return;
    onRejectLuarNegeri(rejectingRequestId, rejectReason.trim());
    setRejectingRequestId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header Pengarah KEMAS Perlis */}
      <div className="bg-gradient-to-r from-rose-900 via-purple-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-rose-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Stamp className="w-4 h-4" />
            <span>Pejabat Pengarah Jabatan Kemajuan Masyarakat (KEMAS) Negeri Perlis</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            Portal Kelulusan Pengarah
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-1">
            Pusat Kuasa Meluluskan Perjalanan Rasmi Kenderaan Jabatan ke Luar Negeri Perlis
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl border border-white/15 backdrop-blur-xs">
          <div className="text-right">
            <span className="text-[11px] text-purple-200 block">Menunggu Kelulusan Anda</span>
            <span className="text-2xl font-black text-amber-300">
              {pendingLuarNegeri.length} Permohonan
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Pengarah */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Permohonan Luar Negeri Pending</span>
            <span className="text-2xl font-black text-rose-700">{pendingLuarNegeri.length}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Memerlukan tindakan segera</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Luar Negeri Diluluskan</span>
            <span className="text-2xl font-black text-emerald-700">
              {decidedLuarNegeri.filter((r) => r.Status_Permohonan === 'Lulus' || r.Status_Permohonan === 'Pending Penugasan').length}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">Telah diberi kebenaran</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Kesiapsiagaan Kenderaan</span>
            <span className="text-2xl font-black text-slate-900">
              {vehicles.filter((v) => v.Status_Kenderaan === 'Aktif').length} / {vehicles.length}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Kenderaan bersedia beroperasi</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Car className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 1. PETI KELULUSAN LUAR NEGERI MENUNGGU KEPUTUSAN */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-800 to-rose-900 px-6 py-4 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <Stamp className="w-5 h-5 text-amber-300" />
              Peti Permohonan Luar Negeri (Menunggu Kelulusan Pengarah)
            </h3>
            <p className="text-xs text-rose-200">
              Mengikut arahan pekeliling, Pegawai Kenderaan tidak dapat melihat mahupun menugaskan kenderaan/pemandu sehingga Pengarah meluluskan perjalanan di sini.
            </p>
          </div>
          <span className="px-3 py-1 bg-white text-rose-900 rounded-full font-black text-xs">
            {pendingLuarNegeri.length} Pending
          </span>
        </div>

        <div className="p-6">
          {pendingLuarNegeri.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-base text-slate-800">Semua Permohonan Luar Negeri Telah Diputuskan!</p>
              <p className="text-xs text-slate-400 mt-1">
                Tiada permohonan perjalanan antara negeri yang memerlukan tindakan anda pada masa ini.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {pendingLuarNegeri.map((req) => {
                const applicant = users.find((u) => u.User_ID === req.Pemohon_User_ID);

                return (
                  <div
                    key={req.Request_ID}
                    className="p-5 rounded-2xl border-2 border-rose-300 bg-rose-50/20 hover:bg-rose-50/40 transition space-y-4 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white px-3 py-1 rounded-lg">
                          {req.Request_ID}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300">
                          {req.Priority_Level}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          {req.Jenis_Perjalanan}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-rose-700 bg-rose-100 px-3 py-1 rounded-full animate-pulse">
                        Wajib Kelulusan Pengarah
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-rose-600 shrink-0" />
                        {req.Destinasi}
                      </h4>
                      <p className="text-xs text-slate-700 mt-1 pl-7 leading-relaxed">
                        <strong>Tujuan Urusan Rasmi:</strong> {req.Tujuan}
                      </p>
                    </div>

                    {/* Dokumen Sokongan PDF yang diupload */}
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 text-rose-800">
                        <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <strong className="block text-slate-900">
                            Dokumen Sokongan (Surat Mesyuarat / Bengkel Rasmi):
                          </strong>
                          <span className="text-slate-600 font-mono text-[11px]">
                            {req.Lampiran_PDF_Nama || 'Surat_Panggilan_Rasmi.pdf'}
                          </span>
                        </div>
                      </div>

                      {req.Lampiran_PDF_URL ? (
                        <a
                          href={req.Lampiran_PDF_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Papar Fail PDF (Google Drive)</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Tiada dokumen dilampirkan</span>
                      )}
                    </div>

                    {/* Detail Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-rose-100">
                      <div>
                        <strong>Pegawai Pemohon:</strong> {applicant?.Nama_Penuh}
                        <br />
                        <strong>Bahagian / Unit:</strong> {applicant?.Bahagian}
                        <br />
                        <strong>No. Telefon:</strong> +{applicant?.No_Telefon || '-'}
                      </div>
                      <div>
                        <strong>Jadual Perjalanan:</strong>
                        <br />
                        Bertolak: {formatMalayDateTime(req.Tarikh_Mula, req.Masa_Mula)}
                        <br />
                        Kembali: {formatMalayDateTime(req.Tarikh_Tamat, req.Masa_Tamat)}
                        <br />
                        <strong>Bilangan Penumpang:</strong> {req.Bilangan_Penumpang || 1} orang
                      </div>
                    </div>

                    {/* Catatan Arahan Pengarah */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800">
                        Catatan / Arahan Pengarah KEMAS Perlis:
                      </label>
                      <input
                        type="text"
                        placeholder="cth: Diluluskan perjalanan luar negeri. Sila sediakan kenderaan SUV dan pemandu bertugas."
                        value={approvalNotes[req.Request_ID] ?? 'Diluluskan perjalanan luar negeri urusan rasmi KEMAS.'}
                        onChange={(e) =>
                          setApprovalNotes({
                            ...approvalNotes,
                            [req.Request_ID]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-rose-200">
                      <span className="text-[11px] text-slate-500 italic">
                        Keputusan rasmi ini akan membuka kunci kepada Pegawai Kenderaan untuk membuat penugasan.
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setRejectingRequestId(req.Request_ID);
                            setRejectReason('');
                          }}
                          className="px-3.5 py-2 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Tolak Permohonan</span>
                        </button>

                        <button
                          onClick={() => handleApprove(req.Request_ID)}
                          className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 transform active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
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

      {/* 2. SEJARAH KEPUTUSAN PENGARAH */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Rekod Sejarah Keputusan Pengarah (Luar Negeri)
            </h3>
            <p className="text-xs text-slate-500">
              Audit keputusan kelulusan perjalanan antara negeri
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari rujukan, destinasi..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto text-xs">
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Tiada rekod keputusan luar negeri ditemui.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-2.5">No. Rujukan</th>
                  <th className="p-2.5">Pemohon</th>
                  <th className="p-2.5">Destinasi</th>
                  <th className="p-2.5">Jadual</th>
                  <th className="p-2.5">Keputusan</th>
                  <th className="p-2.5">Catatan Pengarah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((r) => {
                  const applicant = users.find((u) => u.User_ID === r.Pemohon_User_ID);
                  const isApproved = r.Status_Permohonan === 'Lulus' || r.Status_Permohonan === 'Pending Penugasan';

                  return (
                    <tr key={r.Request_ID} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{r.Request_ID}</td>
                      <td className="p-2.5 font-medium">{applicant?.Nama_Penuh}</td>
                      <td className="p-2.5">{r.Destinasi}</td>
                      <td className="p-2.5 text-slate-600">
                        {r.Tarikh_Mula} &rarr; {r.Tarikh_Tamat}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isApproved ? 'DILULUSKAN' : 'DITOLAK'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-700 italic max-w-xs truncate">
                        {r.Catatan_Pengarah || r.Catatan || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* REJECT MODAL PENGARAH */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-rose-700 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Tolak Permohonan Perjalanan Luar Negeri
              </h3>
              <button
                onClick={() => setRejectingRequestId(null)}
                className="text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs sm:text-sm">
              <p className="text-slate-600">
                Sila nyatakan alasan rasmi penolakan bagi permohonan luar negeri <strong>#{rejectingRequestId}</strong>:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="cth: Keutamaan program dalam negeri atau kekangan peruntukan semasa..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                required
              />
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setRejectingRequestId(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleRejectConfirm}
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
