import React, { useState } from 'react';
import { TripRequest, User, PriorityLevel, TripType } from '../types';
import {
  Send,
  PlusCircle,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  MessageSquare,
  Search,
  Ban,
  Upload,
  FileCheck,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { formatMalayDateTime } from '../utils/collisionEngine';

interface StaffViewProps {
  currentUser: User;
  requests: TripRequest[];
  onSubmitRequest: (newReq: Omit<TripRequest, 'Request_ID' | 'DateTime_Mohon' | 'Status_Permohonan'>) => void;
  onCancelRequest: (requestId: string) => void;
  onViewNotice: (req: TripRequest) => void;
  officerStaff?: User;
}

const PRESET_DESTINATIONS = [
  'Pusat Kegiatan KEMAS Padang Besar',
  'Pusat Latihan KEMAS Kuala Perlis',
  'TABIKA KEMAS Simpang Empat & Sanglang',
  'Wisma Negeri Alor Setar & JKR Kedah',
  'Ibu Pejabat KEMAS Putrajaya (Parcel D)',
  'Kompleks Dewan Undangan Negeri Perlis',
];

export const StaffView: React.FC<StaffViewProps> = ({
  currentUser,
  requests,
  onSubmitRequest,
  onCancelRequest,
  onViewNotice,
  officerStaff,
}) => {
  // Form State
  const [priority, setPriority] = useState<PriorityLevel>('Normal');
  const [tripType, setTripType] = useState<TripType>('Dalam Negeri');
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [passengers, setPassengers] = useState(2);
  const [startDate, setStartDate] = useState('2026-11-06');
  const [startTime, setStartTime] = useState('08:30');
  const [endDate, setEndDate] = useState('2026-11-06');
  const [endTime, setEndTime] = useState('17:00');

  // File Upload State
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Menunggu Kelulusan Pengarah' | 'Pending Penugasan' | 'Lulus' | 'Ditolak'>('All');

  const myRequests = requests.filter((r) => r.Pemohon_User_ID === currentUser.User_ID);

  const filteredRequests = myRequests.filter((r) => {
    const matchesSearch =
      r.Request_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.Destinasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.Tujuan.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'Menunggu Kelulusan Pengarah') {
      matchesStatus = r.Status_Permohonan === 'Menunggu Kelulusan Pengarah';
    } else if (statusFilter === 'Pending Penugasan') {
      matchesStatus = r.Status_Permohonan === 'Pending Penugasan';
    } else if (statusFilter === 'Lulus') {
      matchesStatus = r.Status_Permohonan === 'Lulus';
    } else if (statusFilter === 'Ditolak') {
      matchesStatus = r.Status_Permohonan.includes('Ditolak') || r.Status_Permohonan === 'Dibatalkan';
    }

    return matchesSearch && matchesStatus;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setPdfFileName('');
      setPdfBase64('');
      return;
    }

    if (file.type !== 'application/pdf') {
      setFileError('Hanya fail berformat PDF sahaja dibenarkan (surat mesyuarat/bengkel).');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('Saiz fail PDF melebihi had 10MB.');
      e.target.value = '';
      return;
    }

    setPdfFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setPdfBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const startMs = new Date(`${startDate}T${startTime}:00`).getTime();
    const endMs = new Date(`${endDate}T${endTime}:00`).getTime();

    if (endMs <= startMs) {
      setFormError('Tarikh & Masa Tamat mestilah SELEPAS Tarikh & Masa Mula perjalanan!');
      return;
    }

    if (!destination.trim()) {
      setFormError('Sila nyatakan destinasi rasmi perjalanan.');
      return;
    }

    if (!purpose.trim()) {
      setFormError('Sila nyatakan tujuan urusan rasmi perjalanan.');
      return;
    }

    if (tripType === 'Luar Negeri' && !pdfFileName) {
      setFormError('Permohonan Luar Negeri wajib memuat naik surat mesyuarat / bengkel (PDF sokongan) untuk kelulusan Pengarah KEMAS Perlis.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitRequest({
        Pemohon_User_ID: currentUser.User_ID,
        Priority_Level: priority,
        Jenis_Perjalanan: tripType,
        Destinasi: destination.trim(),
        Tujuan: purpose.trim(),
        Bilangan_Penumpang: Number(passengers),
        Tarikh_Mula: startDate,
        Masa_Mula: startTime,
        Tarikh_Tamat: endDate,
        Masa_Tamat: endTime,
        Lampiran_PDF_URL: pdfBase64 ? 'https://drive.google.com/file/d/uploaded-doc-kemas/view' : undefined,
        Lampiran_PDF_Nama: pdfFileName || undefined,
        Lampiran_PDF_Data: pdfBase64 || undefined,
        Catatan: '',
      });
      setIsSubmitting(false);
      setPurpose('');
      setDestination('');
      setPdfFileName('');
      setPdfBase64('');
    }, 400);
  };

  const getPriorityBadgeClass = (p: PriorityLevel) => {
    switch (p) {
      case 'Arahan Ketua Jabatan':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      case 'Segera':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusBadge = (status: TripRequest['Status_Permohonan']) => {
    switch (status) {
      case 'Menunggu Kelulusan Pengarah':
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-600" /> Menunggu Kelulusan Pengarah
          </span>
        );
      case 'Pending Penugasan':
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
            Pending Penugasan Pegawai
          </span>
        );
      case 'Lulus':
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
            Lulus (Kenderaan Ditugaskan)
          </span>
        );
      case 'Ditolak Pengarah':
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold">
            Ditolak Pengarah
          </span>
        );
      case 'Ditolak Pegawai':
      case 'Dibatalkan':
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 font-semibold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
            Modul Pemohon (Staff KEMAS Negeri Perlis)
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-0.5">
            Selamat Datang, {currentUser.Nama_Penuh}
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            {currentUser.Jawatan} &bull; {currentUser.Bahagian}
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
          <div className="text-right">
            <span className="text-[11px] text-blue-200 block">Jumlah Permohonan Anda</span>
            <span className="text-lg font-black text-amber-300">{myRequests.length} Rekod</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Permohonan Kenderaan Baharu */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 sticky top-24">
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800">
                  Borang Permohonan Perjalanan Rasmi
                </h3>
                <p className="text-xs text-slate-500">
                  Lengkapkan maklumat dan muat naik surat sokongan PDF
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs sm:text-sm">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Priority & Trip Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tahap Keutamaan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Normal">Normal (Urusan Rutin)</option>
                    <option value="Segera">Segera (Mendesak / Cepat)</option>
                    <option value="Arahan Ketua Jabatan">Arahan Ketua Jabatan (VIP)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Perjalanan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value as TripType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Dalam Negeri">Dalam Negeri (Perlis)</option>
                    <option value="Luar Negeri">Luar Negeri (Antara Negeri)</option>
                  </select>
                </div>
              </div>

              {/* Notice for Luar Negeri */}
              {tripType === 'Luar Negeri' && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Peraturan Perjalanan Luar Negeri:</strong>
                    <p className="mt-0.5">
                      Permohonan kenderaan ke luar negeri Perlis memerlukan <strong>kelulusan Pengarah KEMAS Negeri Perlis</strong> terlebih dahulu sebelum Pegawai Kenderaan dapat menugaskan kenderaan & pemandu. Sila muat naik surat mesyuarat/bengkel di bawah.
                    </p>
                  </div>
                </div>
              )}

              {/* Destination */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Destinasi Rasmi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="cth: Ibu Pejabat KEMAS Putrajaya"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
                {/* Preset Chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 self-center">Pilihan Pantas:</span>
                  {PRESET_DESTINATIONS.slice(0, 3).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDestination(d)}
                      className="text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 px-2 py-0.5 rounded-full transition"
                    >
                      + {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tujuan Perjalanan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={2}
                  placeholder="Nyatakan tujuan rasmi tugas..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* PDF Document Upload */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <Upload className="w-3.5 h-3.5 text-rose-600" />
                    Muat Naik Dokumen Sokongan (Surat Mesyuarat / Bengkel)
                  </span>
                  {tripType === 'Luar Negeri' ? (
                    <span className="text-[10px] text-rose-600 font-extrabold">* Wajib</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Pilihan</span>
                  )}
                </label>

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />

                {fileError && (
                  <p className="text-[11px] text-rose-600 font-medium">{fileError}</p>
                )}

                {pdfFileName && (
                  <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{pdfFileName}</span>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 block">
                  Fail PDF akan disimpan ke folder Google Drive KEMAS/Fleet/Lampiran/
                </span>
              </div>

              {/* Passengers */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bilangan Pegawai Menumpang
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Start Date & Time */}
              <div className="grid grid-cols-2 gap-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-[11px] font-bold text-blue-900 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-700" /> Tarikh Mula
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-blue-200 rounded text-xs focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-blue-900 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-700" /> Masa Mula
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-blue-200 rounded text-xs focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="grid grid-cols-2 gap-2 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-700" /> Tarikh Tamat
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-700" /> Masa Tamat
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Menghantar Permohonan...' : 'Hantar Permohonan Rasmi'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Table: Permohonan Saya */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-800">
                  Senarai Permohonan Saya
                </h3>
                <p className="text-xs text-slate-500">
                  Status permohonan dua peringkat (Kelulusan Pengarah & Penugasan Pegawai)
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px]">
                {(['All', 'Menunggu Kelulusan Pengarah', 'Pending Penugasan', 'Lulus', 'Ditolak'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-1 rounded-md font-semibold transition ${
                      statusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'All' ? 'Semua' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Box */}
            <div className="mt-3 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari mengikut destinasi, no rujukan, atau tujuan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Requests List */}
            <div className="mt-4 space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tiada rekod permohonan yang sepadan dijumpai.
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div
                    key={req.Request_ID}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-white transition hover:shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {req.Request_ID}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(req.Priority_Level)}`}>
                          {req.Priority_Level}
                        </span>
                        <span className="text-[10px] text-slate-600 font-medium">
                          {req.Jenis_Perjalanan}
                        </span>
                      </div>
                      {getStatusBadge(req.Status_Permohonan)}
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                        {req.Destinasi}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 pl-5">
                        {req.Tujuan}
                      </p>
                    </div>

                    {/* PDF Lampiran Sokongan */}
                    {req.Lampiran_PDF_Nama && (
                      <div className="pl-5 flex items-center gap-2 text-xs text-rose-700">
                        <FileText className="w-3.5 h-3.5 text-rose-600" />
                        <span className="font-medium">Surat Sokongan: {req.Lampiran_PDF_Nama}</span>
                        {req.Lampiran_PDF_URL && (
                          <a
                            href={req.Lampiran_PDF_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 underline font-semibold"
                          >
                            Papar Google Drive
                          </a>
                        )}
                      </div>
                    )}

                    {/* Catatan Pengarah jika ada */}
                    {req.Catatan_Pengarah && (
                      <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900">
                        <strong>Kelulusan Pengarah:</strong> {req.Catatan_Pengarah}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <div>
                        <span className="font-medium text-slate-700">Tempoh:</span>{' '}
                        {formatMalayDateTime(req.Tarikh_Mula, req.Masa_Mula)} &rarr; {formatMalayDateTime(req.Tarikh_Tamat, req.Masa_Tamat)}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* WhatsApp Follow-up */}
                        {officerStaff && (
                          <a
                            href={`https://wa.me/${officerStaff.No_Telefon}?text=${encodeURIComponent(
                              `Assalammualaikum Tuan ${officerStaff.Nama_Penuh}, saya ${currentUser.Nama_Penuh} ingin menyemak status permohonan kenderaan #${req.Request_ID} ke ${req.Destinasi}. Terima kasih.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-1 font-semibold text-[11px] transition"
                            title="Tanya status terus ke WhatsApp Pegawai Kenderaan"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp Pegawai</span>
                          </a>
                        )}

                        {/* View Decision Notice */}
                        <button
                          onClick={() => onViewNotice(req)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1 font-semibold text-[11px] transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Papar Notis</span>
                        </button>

                        {/* Cancel Button if still Pending */}
                        {(req.Status_Permohonan === 'Menunggu Kelulusan Pengarah' || req.Status_Permohonan === 'Pending Penugasan') && (
                          <button
                            onClick={() => onCancelRequest(req.Request_ID)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg flex items-center gap-1 text-[11px] transition"
                            title="Batalkan permohonan"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Batal</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
