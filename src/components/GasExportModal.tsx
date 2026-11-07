import React, { useState } from 'react';
import { X, Copy, Check, FileCode2, Terminal, BookOpen, Database, FolderCode, Download, CheckCircle2 } from 'lucide-react';
import { GAS_FILES } from '../utils/gasCodeStore';

interface GasExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasExportModal: React.FC<GasExportModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<keyof typeof GAS_FILES>('Code.gs');
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentContent = GAS_FILES[selectedFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(`Fail ${selectedFile} dimuat turun!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadAll = () => {
    (Object.keys(GAS_FILES) as Array<keyof typeof GAS_FILES>).forEach((fileName, index) => {
      setTimeout(() => {
        const content = GAS_FILES[fileName];
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      }, index * 200);
    });
    setDownloadSuccess('Semua 5 fail Google Apps Script dimuat turun!');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const fileDescriptions: Record<string, string> = {
    'Code.gs': 'Logik Backend: doGet, include, pengesahan emel jadual Users, simpan PDF ke Google Drive, enjin collision prevention, kelulusan Pengarah, dan notifikasi.',
    'Index.html': 'Antaramuka Pengguna (UI) Utama: Navigasi 4 peranan (Pengarah, Pemohon, Pegawai Kenderaan, Pemandu), borang permohonan dengan upload PDF, dan modal.',
    'css.html': 'Helaian Gaya (CSS): Warna korporat KEMAS Perlis (#0f2d5c & #c59b27), kad responsif, lencana keutamaan, dan susun atur borang.',
    'JavaScript.html': 'Skrip Frontend (Client-side JS): Pengendali penukaran PDF ke Base64, panggilan google.script.run, modal interaktif, dan integrasi WhatsApp.',
    'SetupSheets.gs': 'Skrip Permulaan Helaian: Jana helaian Users, Vehicles, Drivers, Trip_Requests, dan Assignments secara automatik dalam Google Sheets.',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-[#0b1329] text-white w-full max-w-5xl rounded-2xl shadow-2xl border border-blue-900/60 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0f1f42] px-6 py-4 border-b border-blue-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FolderCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                Pusat Kod Google Apps Script (4 Fail Modular + SetupSheets)
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                  Google Workspace Enterprise
                </span>
              </h3>
              <p className="text-xs text-blue-300/80">
                Sistem Pengurusan Kenderaan KEMAS Perlis &bull; 4 Peranan Berasingan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-blue-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Instruction Banner */}
        <div className="bg-gradient-to-r from-blue-950/70 to-slate-900/80 p-4 border-b border-blue-900/40 text-xs text-blue-100 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="space-y-1">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> 4 Langkah Pemasangan ke Google Sheets Script Editor:
            </span>
            <p className="text-blue-200/90 text-[11px] leading-relaxed">
              1. Buka fail Google Sheet KEMAS Perlis &gt; <strong>Extensions (Pelanjutan) &gt; Apps Script</strong>.<br />
              2. Cipta 4 fail mengikut nama: <code className="bg-blue-900/80 px-1 py-0.2 rounded text-amber-300">Code.gs</code>, <code className="bg-blue-900/80 px-1 py-0.2 rounded text-amber-300">Index.html</code>, <code className="bg-blue-900/80 px-1 py-0.2 rounded text-amber-300">css.html</code>, dan <code className="bg-blue-900/80 px-1 py-0.2 rounded text-amber-300">JavaScript.html</code>.<br />
              3. Cipta <code className="bg-blue-900/80 px-1 py-0.2 rounded text-amber-300">SetupSheets.gs</code> dan jalankan fungsi <code className="bg-blue-900/80 px-1 py-0.2 rounded text-amber-300">setupKemasPerlisDatabase()</code> untuk bina 5 helaian.<br />
              4. Klik <strong>Deploy &gt; New Deployment &gt; Web App</strong> (Execute as: <em>Me</em> / <em>User</em>, Access: <em>Anyone in domain/organization</em>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-md"
              title="Muat turun kesemua fail .gs dan .html"
            >
              <Download className="w-4 h-4" />
              <span>Muat Turun Semua Fail</span>
            </button>

            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700"
              title={`Muat turun fail ${selectedFile}`}
            >
              <Download className="w-4 h-4" />
              <span>Muat Turun {selectedFile}</span>
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Disalin ke Clipboard!' : `Salin ${selectedFile}`}</span>
            </button>
          </div>
        </div>

        {/* Download Success Banner */}
        {downloadSuccess && (
          <div className="bg-emerald-900/80 text-emerald-200 px-4 py-2 text-xs flex items-center gap-2 border-b border-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Main Content: File Tabs & Editor */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* File Selector Sidebar */}
          <div className="w-full md:w-60 bg-[#0a1124] border-r border-blue-900/40 p-3 space-y-1.5 overflow-y-auto">
            <div className="text-[11px] font-semibold text-blue-400/80 px-2 py-1 uppercase tracking-wider">
              4 Fail Teras Web App
            </div>

            {(['Code.gs', 'Index.html', 'css.html', 'JavaScript.html'] as const).map((fileName) => (
              <button
                key={fileName}
                onClick={() => {
                  setSelectedFile(fileName);
                  setCopied(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition ${
                  selectedFile === fileName
                    ? 'bg-blue-600/30 text-amber-300 font-bold border border-blue-500/40 shadow-sm'
                    : 'text-blue-200/70 hover:bg-blue-950 hover:text-blue-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{fileName}</span>
                </div>
              </button>
            ))}

            <div className="text-[11px] font-semibold text-blue-400/80 px-2 pt-3 pb-1 uppercase tracking-wider">
              Skrip Penjana Helaian
            </div>
            <button
              onClick={() => {
                setSelectedFile('SetupSheets.gs');
                setCopied(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition ${
                selectedFile === 'SetupSheets.gs'
                  ? 'bg-blue-600/30 text-amber-300 font-bold border border-blue-500/40 shadow-sm'
                  : 'text-blue-200/70 hover:bg-blue-950 hover:text-blue-100'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">SetupSheets.gs</span>
              </div>
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Setup
              </span>
            </button>

            {/* Description Box */}
            <div className="mt-4 p-3 bg-blue-950/40 border border-blue-900/40 rounded-xl text-[11px] text-blue-200/80 leading-relaxed">
              <strong className="block text-amber-300 mb-1">Peranan Fail:</strong>
              {fileDescriptions[selectedFile] || ''}
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#070d1e] overflow-hidden">
            <div className="bg-[#0b142d] px-4 py-2 border-b border-blue-900/30 flex items-center justify-between text-xs font-mono text-blue-300">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                {selectedFile}
              </span>
              <span className="text-[11px] text-blue-400/60">
                {currentContent.split('\n').length} baris kod
              </span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] sm:text-xs leading-relaxed text-blue-100/90 whitespace-pre selection:bg-blue-700 selection:text-white">
              {currentContent}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#0f1f42] px-6 py-3 border-t border-blue-900/50 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-300">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span>Mematuhi sepenuhnya spesifikasi: 4 Fail GAS + Jadual Users + Aliran Kelulusan Pengarah</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-white rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
