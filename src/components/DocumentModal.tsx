import React from 'react';
import { X, Download, Printer, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { TripRequest, Assignment, Vehicle, Staff, Driver } from '../types';
import { formatMalayDateTime } from '../utils/collisionEngine';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'arahan_memandu' | 'notis_keputusan';
  request: TripRequest;
  assignment?: Assignment;
  applicant: Staff;
  vehicle?: Vehicle;
  driverStaff?: Staff;
  driver?: Driver;
  officer?: Staff;
  onDownloadPdf: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  type,
  request,
  assignment,
  applicant,
  vehicle,
  driverStaff,
  officer,
  onDownloadPdf,
}) => {
  if (!isOpen) return null;

  const isApproved = request.Status_Permohonan === 'Lulus';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-6">
        {/* Modal Top Control Bar */}
        <div className="bg-[#0f2d5c] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm sm:text-base">
              {type === 'arahan_memandu'
                ? 'Dokumen Rasmi: Arahan Memandu Kenderaan Jabatan'
                : 'Notis Keputusan Permohonan Kenderaan'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white transition text-xs flex items-center gap-1 px-2.5 bg-white/10"
              title="Cetak Dokumen"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
            <button
              onClick={onDownloadPdf}
              className="p-1.5 hover:bg-emerald-600 rounded-lg text-white transition text-xs flex items-center gap-1 px-3 bg-emerald-700 font-semibold"
              title="Muat Turun Fail PDF"
            >
              <Download className="w-4 h-4" />
              <span>Muat Turun PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document Preview Canvas */}
        <div className="p-6 sm:p-10 max-h-[75vh] overflow-y-auto bg-slate-50 text-slate-800">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 text-xs sm:text-sm">
            {/* Letterhead */}
            <div className="text-center pb-4 border-b-2 border-slate-900">
              <h4 className="font-extrabold text-sm sm:text-base tracking-widest text-slate-900">
                KERAJAAN MALAYSIA
              </h4>
              <h2 className="font-black text-base sm:text-lg text-[#0f2d5c] uppercase">
                JABATAN KEMAJUAN MASYARAKAT (KEMAS)
              </h2>
              <h3 className="font-bold text-xs sm:text-sm text-slate-700">
                NEGERI PERLIS
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Tingkat 1 & 2, Bangunan Persekutuan, 01000 Kangar, Perlis | No. Tel: 04-976 1234
              </p>
            </div>

            {/* Document Title Badge */}
            {type === 'arahan_memandu' ? (
              <div className="my-5 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <span className="block text-sm sm:text-base font-extrabold text-[#0f2d5c]">
                  ARAHAN MEMANDU KENDERAAN JABATAN
                </span>
                <span className="text-[11px] text-slate-600 font-mono">
                  No. Penugasan: <strong className="text-slate-900">{assignment?.Assignment_ID || 'ASN-AUTO'}</strong> | No. Permohonan: <strong className="text-slate-900">{request.Request_ID}</strong>
                </span>
              </div>
            ) : (
              <div className={`my-5 p-3.5 rounded-lg text-center border ${
                isApproved
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {isApproved ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 text-rose-600" />}
                  <span className="text-sm sm:text-base font-extrabold">
                    {isApproved ? 'NOTIS KELULUSAN PERMOHONAN KENDERAAN' : 'NOTIS KEPUTUSAN: PERMOHONAN TIDAK DILULUSKAN / DIBATALKAN'}
                  </span>
                </div>
                <span className="text-[11px] font-mono mt-1 block">
                  Rujukan: {request.Request_ID} | Tarikh Mohon: {request.DateTime_Mohon}
                </span>
              </div>
            )}

            {/* Document Content */}
            {type === 'arahan_memandu' ? (
              <div className="space-y-4">
                {/* 1. Butiran Penugasan */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 bg-blue-100/70 px-2.5 py-1 rounded">
                    1. Butiran Penugasan Pemandu & Kenderaan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 px-1">
                    <div>
                      <span className="text-slate-500">Nama Pemandu:</span>{' '}
                      <strong className="text-slate-900">{driverStaff?.Nama_Penuh || 'Belum Ditetapkan'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">No. Telefon Pemandu:</span>{' '}
                      <strong className="text-slate-900">{driverStaff?.No_Telefon ? `+${driverStaff.No_Telefon}` : '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Model Kenderaan:</span>{' '}
                      <strong className="text-slate-900">{vehicle?.Model_Kenderaan || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">No. Pendaftaran (Plat):</span>{' '}
                      <strong className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-mono font-bold">
                        {vehicle?.No_Plat || '-'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Kapasiti Tempat Duduk:</span>{' '}
                      <strong className="text-slate-900">{vehicle?.Kapasiti || 0} Tempat Duduk</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Status Kuasa Memandu:</span>{' '}
                      <span className="text-emerald-700 font-semibold">Sah & Berkuatkuasa 2026</span>
                    </div>
                  </div>
                </div>

                {/* 2. Jadual Perjalanan */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 bg-blue-100/70 px-2.5 py-1 rounded">
                    2. Jadual Perjalanan & Pegawai Menumpang
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 px-1">
                    <div>
                      <span className="text-slate-500">Nama Pemohon / Pegawai:</span>{' '}
                      <strong className="text-slate-900">{applicant.Nama_Penuh}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Bahagian / Unit:</span>{' '}
                      <strong className="text-slate-900">{applicant.Bahagian}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Waktu Bertolak:</span>{' '}
                      <strong className="text-slate-900">{formatMalayDateTime(request.Tarikh_Mula, request.Masa_Mula)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Waktu Balik (Jangkaan):</span>{' '}
                      <strong className="text-slate-900">{formatMalayDateTime(request.Tarikh_Tamat, request.Masa_Tamat)}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Destinasi Rasmi:</span>{' '}
                      <strong className="text-slate-900">{request.Destinasi}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Tujuan Perjalanan:</span>{' '}
                      <span className="text-slate-800">{request.Tujuan}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Tahap Keutamaan:</span>{' '}
                      <span className="font-bold text-blue-800">[{request.Priority_Level}]</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Jenis Perjalanan:</span>{' '}
                      <span className="font-semibold text-slate-800">{request.Jenis_Perjalanan}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Arahan Khas & Keselamatan */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 bg-blue-100/70 px-2.5 py-1 rounded">
                    3. Arahan Khas & Peringatan Keselamatan
                  </h4>
                  <ul className="list-decimal list-inside space-y-1 text-slate-600 mt-2 text-[11px] sm:text-xs">
                    <li>Pemandu wajib memeriksa aras cecair enjin, brek, dan tekanan tayar sebelum memulakan tugasan.</li>
                    <li>Buku Log Kenderaan Kerajaan (Kad Inden) hendaklah dicatat dengan rapi: bacaan odometer awal, akhir, kuantiti minyak serta resit tol berkaitan.</li>
                    <li>Kenderaan Kerajaan ini hanya boleh dipandu bagi tujuan tugas rasmi yang dinyatakan di atas sahaja.</li>
                    <li>
                      Catatan Pegawai Kenderaan:{' '}
                      <strong className="text-slate-900">{assignment?.Catatan_Pegawai || 'Sila jalankan tugas dengan berhemah.'}</strong>
                    </li>
                  </ul>
                </div>

                {/* 4. Tandatangan */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] sm:text-xs">
                  <div>
                    <p className="text-slate-500">Dikeluarkan dan Disahkan Oleh:</p>
                    <div className="h-12"></div>
                    <p className="font-bold text-slate-900">{officer?.Nama_Penuh || 'Ahmad Zuhairi bin Salleh'}</p>
                    <p className="text-slate-500">Pegawai Pengangkutan & Aset (N29)</p>
                    <p className="text-slate-400 text-[10px]">KEMAS Negeri Perlis</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Pengesahan Penerimaan Pemandu:</p>
                    <div className="h-12 border-b border-dashed border-slate-300"></div>
                    <p className="font-bold text-slate-900 mt-1">{driverStaff?.Nama_Penuh || 'Pemandu Bertugas'}</p>
                    <p className="text-slate-500">Pemandu Kenderaan KEMAS</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Notis Keputusan Content */
              <div className="space-y-4">
                <div className="text-slate-700 leading-relaxed">
                  <p>
                    Kepada: <strong>{applicant.Nama_Penuh}</strong> ({applicant.Jawatan})
                  </p>
                  <p className="text-slate-500 text-xs">Bahagian: {applicant.Bahagian}</p>
                  <p className="mt-3">
                    {isApproved
                      ? 'Sukacita dimaklumkan bahawa permohonan penggunaan kenderaan jabatan bagi perjalanan rasmi anda telah diluluskan dengan perincian berikut:'
                      : 'Dukacita dimaklumkan permohonan penggunaan kenderaan jabatan bagi perjalanan rasmi anda tidak dapat diluluskan atau telah dibatalkan atas faktor-faktor pengoperasian kenderaan:'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500">Destinasi:</span>{' '}
                      <strong className="text-slate-900">{request.Destinasi}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Tujuan:</span>{' '}
                      <span className="text-slate-800">{request.Tujuan}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Tarikh & Masa Pergi:</span>{' '}
                      <strong className="text-slate-900">{formatMalayDateTime(request.Tarikh_Mula, request.Masa_Mula)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Tarikh & Masa Balik:</span>{' '}
                      <strong className="text-slate-900">{formatMalayDateTime(request.Tarikh_Tamat, request.Masa_Tamat)}</strong>
                    </div>
                    {isApproved && (
                      <>
                        <div>
                          <span className="text-slate-500">Kenderaan Ditetapkan:</span>{' '}
                          <strong className="text-blue-900">{vehicle?.No_Plat} - {vehicle?.Model_Kenderaan}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Pemandu Bertugas:</span>{' '}
                          <strong className="text-blue-900">{driverStaff?.Nama_Penuh} (+{driverStaff?.No_Telefon})</strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  <strong>Justifikasi / Catatan Pegawai:</strong>
                  <p className="mt-1">
                    {request.Catatan || assignment?.Catatan_Pegawai || (isApproved ? 'Sila berhubung dengan pemandu bertugas 15 minit sebelum masa perjalanan.' : 'Kekangan pertindihan jadual kenderaan.')}
                  </p>
                </div>

                <div className="pt-4 text-xs text-slate-500">
                  <p>Disahkan oleh:</p>
                  <p className="font-bold text-slate-800 mt-6">{officer?.Nama_Penuh || 'Ahmad Zuhairi bin Salleh'}</p>
                  <p>b/p Pengarah KEMAS Negeri Perlis</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-gray-100 px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg transition"
          >
            Tutup Paparan
          </button>
        </div>
      </div>
    </div>
  );
};
