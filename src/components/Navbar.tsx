import React from 'react';
import { User, Role } from '../types';
import {
  Car,
  UserCheck,
  Code2,
  ChevronDown,
  Stamp,
  Truck,
  FilePenLine,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export type ActiveRoleTab = 'pengarah' | 'pemohon' | 'pegawai' | 'pemandu';

interface NavbarProps {
  currentUser: User;
  usersList: User[];
  onSelectUser: (user: User) => void;
  activeRoleTab: ActiveRoleTab;
  onChangeRoleTab: (tab: ActiveRoleTab) => void;
  onOpenGasModal: () => void;
  pengarahPendingCount: number;
  officerPendingCount: number;
  expiringDriversCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  usersList,
  onSelectUser,
  activeRoleTab,
  onChangeRoleTab,
  onOpenGasModal,
  pengarahPendingCount,
  officerPendingCount,
  expiringDriversCount,
}) => {
  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case 'Pengarah':
        return 'bg-rose-900/60 text-rose-200 border-rose-400/40';
      case 'Pegawai_Kenderaan':
      case 'Admin':
        return 'bg-amber-900/60 text-amber-200 border-amber-400/40';
      case 'Pemandu':
        return 'bg-emerald-900/60 text-emerald-200 border-emerald-400/40';
      default:
        return 'bg-blue-900/60 text-blue-200 border-blue-400/40';
    }
  };

  const getRoleLabel = (user: User) => {
    if (user.Role === 'Pengarah' || user.Is_Pengarah) return 'Pengarah KEMAS Perlis';
    if (user.Role === 'Pegawai_Kenderaan') return 'Pegawai Kenderaan (N29)';
    if (user.Role === 'Pemandu') return 'Pemandu Kenderaan';
    return 'Pemohon / Staff';
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0c1f3f] text-white shadow-lg border-b border-[#1e3a6e]">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-blue-900/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-md shadow-amber-900/30">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black tracking-wider text-base sm:text-lg text-white">KFMS PERLIS</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Sistem Penugasan Kenderaan
              </span>
            </div>
            <p className="text-xs text-blue-200/80 font-medium hidden sm:block">
              Jabatan Kemajuan Masyarakat (KEMAS) Negeri Perlis &bull; 4 Peranan Berasingan
            </p>
          </div>
        </div>

        {/* User Context Switcher (RBAC Tester) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="relative group">
            <div className="flex items-center space-x-2 bg-[#122850] hover:bg-[#18346b] px-3 py-1.5 rounded-lg border border-blue-800/60 transition cursor-pointer">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <span className="truncate max-w-[130px] sm:max-w-[190px]">{currentUser.Nama_Penuh}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-300" />
                </div>
                <div className="text-[10px] text-blue-200/70 truncate max-w-[150px]">
                  {getRoleLabel(currentUser)}
                </div>
              </div>
            </div>

            {/* Dropdown Menu to Switch User & Role */}
            <div className="absolute right-0 mt-2 w-72 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 hidden group-hover:block z-50 overflow-hidden">
              <div className="p-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600">
                Tukar Persona Pengguna (4 Peranan Rasmi)
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                {usersList.map((u) => (
                  <button
                    key={u.User_ID}
                    onClick={() => onSelectUser(u)}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col transition ${
                      u.User_ID === currentUser.User_ID
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{u.Nama_Penuh}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        u.Role === 'Pengarah' || u.Is_Pengarah
                          ? 'bg-rose-100 text-rose-800'
                          : u.Role === 'Pegawai_Kenderaan' || u.Role === 'Admin'
                          ? 'bg-amber-100 text-amber-800'
                          : u.Role === 'Pemandu'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.Role === 'Pengarah' || u.Is_Pengarah ? 'Pengarah' : (u.Role === 'Pegawai_Kenderaan' ? 'Pegawai' : u.Role)}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500">{u.Jawatan}</span>
                    <span className="text-[10px] text-blue-600">{u.Email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Google Apps Script Modal Trigger */}
          <button
            onClick={onOpenGasModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow-md transition transform active:scale-95"
            title="Papar dan salin 4 fail Google Apps Script untuk Google Sheets"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">Fail-Fail GAS</span>
            <span className="sm:hidden">GAS</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar for 4 Dedicated Roles: Pengarah, Pemohon, Pegawai Kenderaan, Pemandu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between overflow-x-auto py-2 gap-2 no-scrollbar">
          <nav className="flex space-x-1 sm:space-x-2">
            {/* View 1: Pengarah */}
            <button
              onClick={() => onChangeRoleTab('pengarah')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition ${
                activeRoleTab === 'pengarah'
                  ? 'bg-rose-700 text-white shadow-md'
                  : 'text-rose-200 hover:bg-rose-950/40 hover:text-white'
              }`}
            >
              <Stamp className="w-4 h-4 text-amber-300" />
              <span>1. Pengarah</span>
              {pengarahPendingCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-white text-rose-900 animate-pulse">
                  {pengarahPendingCount} Luar Negeri
                </span>
              )}
            </button>

            {/* View 2: Pemohon */}
            <button
              onClick={() => onChangeRoleTab('pemohon')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition ${
                activeRoleTab === 'pemohon'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-200 hover:bg-blue-900/50 hover:text-white'
              }`}
            >
              <FilePenLine className="w-4 h-4" />
              <span>2. Pemohon</span>
            </button>

            {/* View 3: Pegawai Kenderaan */}
            <button
              onClick={() => onChangeRoleTab('pegawai')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition ${
                activeRoleTab === 'pegawai'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-amber-200 hover:bg-amber-950/40 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>3. Pegawai Kenderaan</span>
              {officerPendingCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-white text-amber-900">
                  {officerPendingCount} Sedia
                </span>
              )}
            </button>

            {/* View 4: Pemandu */}
            <button
              onClick={() => onChangeRoleTab('pemandu')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition ${
                activeRoleTab === 'pemandu'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-200 hover:bg-emerald-950/40 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>4. Pemandu</span>
            </button>
          </nav>

          {/* Role Status Tag */}
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-[11px] text-blue-300">Paparan Aktif:</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getRoleBadgeStyle(currentUser.Role)}`}>
              {activeRoleTab.toUpperCase()} &bull; {currentUser.Nama_Penuh}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
