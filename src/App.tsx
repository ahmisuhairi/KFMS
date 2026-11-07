/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User,
  Vehicle,
  Driver,
  TripRequest,
  Assignment,
  OverrideLog,
} from './types';
import {
  INITIAL_USERS,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_REQUESTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_OVERRIDE_LOGS,
} from './data/mockData';
import { Navbar, ActiveRoleTab } from './components/Navbar';
import { PengarahView } from './components/PengarahView';
import { StaffView } from './components/StaffView';
import { PegawaiView } from './components/PegawaiView';
import { PemanduView } from './components/PemanduView';
import { DocumentModal } from './components/DocumentModal';
import { GasExportModal } from './components/GasExportModal';
import { isExpiringWithin30Days } from './utils/collisionEngine';
import { generateArahanMemanduPDF, generateNotisKeputusanPDF } from './utils/pdfGenerator';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Master State with 'Users' table
  const [usersList, setUsersList] = useState<User[]>(INITIAL_USERS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [requests, setRequests] = useState<TripRequest[]>(INITIAL_REQUESTS);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [overrideLogs, setOverrideLogs] = useState<OverrideLog[]>(INITIAL_OVERRIDE_LOGS);

  // Active User Context (Default: Tuan Haji Rosli - Pengarah KEMAS Negeri Perlis)
  const [currentUser, setCurrentUser] = useState<User>(
    INITIAL_USERS.find((u) => u.Role === 'Pengarah') || INITIAL_USERS[0]
  );

  // Active Role Tab across 4 Dedicated Roles: 'pengarah' | 'pemohon' | 'pegawai' | 'pemandu'
  const [activeRoleTab, setActiveRoleTab] = useState<ActiveRoleTab>('pengarah');

  // GAS Modal
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  // Document Preview Modal State
  const [docModal, setDocModal] = useState<{
    isOpen: boolean;
    type: 'arahan_memandu' | 'notis_keputusan';
    request: TripRequest | null;
    assignment?: Assignment;
  }>({
    isOpen: false,
    type: 'arahan_memandu',
    request: null,
  });

  // Global Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Submit New Trip Request (Pemohon / Staff)
  const handleSubmitNewRequest = (
    newReqData: Omit<TripRequest, 'Request_ID' | 'DateTime_Mohon' | 'Status_Permohonan'>
  ) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const randomCode = String(Math.floor(1000 + Math.random() * 9000));
    const requestId = `REQ-${yyyy}${mm}${dd}-${randomCode}`;

    const initialStatus =
      newReqData.Jenis_Perjalanan === 'Luar Negeri'
        ? 'Menunggu Kelulusan Pengarah'
        : 'Pending Penugasan';

    const newRequest: TripRequest = {
      ...newReqData,
      Request_ID: requestId,
      Status_Permohonan: initialStatus,
      DateTime_Mohon: `${yyyy}-${mm}-${dd} 09:00:00`,
    };

    setRequests((prev) => [newRequest, ...prev]);

    if (initialStatus === 'Menunggu Kelulusan Pengarah') {
      showToast(
        `Permohonan Luar Negeri #${requestId} berjaya dihantar dan kini Menunggu Kelulusan Pengarah KEMAS Perlis.`
      );
    } else {
      showToast(`Permohonan #${requestId} berjaya dihantar ke Pegawai Kenderaan.`);
    }
  };

  // 2. Pengarah KEMAS Perlis Approves Luar Negeri Request
  const handlePengarahApproveLuarNegeri = (requestId: string, notes: string) => {
    const timestamp = '2026-11-01 10:15:00';
    setRequests((prev) =>
      prev.map((r) =>
        r.Request_ID === requestId
          ? {
              ...r,
              Status_Permohonan: 'Pending Penugasan', // Buka kunci kepada Pegawai Kenderaan!
              Catatan_Pengarah: notes,
              DateTime_Lulus_Pengarah: timestamp,
            }
          : r
      )
    );
    showToast(
      `Permohonan #${requestId} telah DILULUSKAN oleh Pengarah KEMAS Perlis. Kini sedia untuk penugasan Pegawai Kenderaan.`
    );
  };

  // 3. Pengarah KEMAS Perlis Rejects Luar Negeri Request
  const handlePengarahRejectLuarNegeri = (requestId: string, reason: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.Request_ID === requestId
          ? {
              ...r,
              Status_Permohonan: 'Ditolak Pengarah',
              Catatan_Pengarah: reason,
            }
          : r
      )
    );
    showToast(`Permohonan Luar Negeri #${requestId} telah DITOLAK oleh Pengarah KEMAS Perlis.`);
  };

  // 4. Pegawai Kenderaan Assigns Trip (with Collision Check & Override)
  const handleAssignTrip = (payload: {
    requestId: string;
    vehicleId: string;
    driverId: string;
    notes: string;
    isOverride?: boolean;
    conflictingAssignmentId?: string;
    overrideReason?: string;
  }) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const randomCode = String(Math.floor(1000 + Math.random() * 9000));
    const assignmentId = `ASN-${yyyy}${mm}${dd}-${randomCode}`;
    const timestamp = `${yyyy}-${mm}-${dd} 10:30:00`;

    // Handle Override if applicable
    if (payload.isOverride && payload.conflictingAssignmentId) {
      const prevAsn = assignments.find((a) => a.Assignment_ID === payload.conflictingAssignmentId);
      if (prevAsn) {
        setAssignments((prev) =>
          prev.map((a) =>
            a.Assignment_ID === payload.conflictingAssignmentId
              ? {
                  ...a,
                  Status_Assignment: 'Dibatalkan',
                  Catatan_Pegawai: `DIBATALKAN (OVERRIDE): ${payload.overrideReason}`,
                  Overridden_By: currentUser.Nama_Penuh,
                  Override_Reason: payload.overrideReason,
                  Overridden_DateTime: timestamp,
                }
              : a
          )
        );

        setRequests((prev) =>
          prev.map((r) =>
            r.Request_ID === prevAsn.Request_ID
              ? {
                  ...r,
                  Status_Permohonan: 'Dibatalkan',
                  Catatan: `Dibatalkan bagi laluan keutamaan tinggi: ${payload.overrideReason}`,
                }
              : r
          )
        );

        const newLog: OverrideLog = {
          id: `OVR-${Date.now().toString().slice(-6)}`,
          assignment_id: prevAsn.Assignment_ID,
          request_id: prevAsn.Request_ID,
          urgent_request_id: payload.requestId,
          cancelled_vehicle: prevAsn.Vehicle_ID,
          cancelled_driver: prevAsn.Driver_ID,
          reason: payload.overrideReason || 'Arahan Keutamaan Khas',
          officer_name: currentUser.Nama_Penuh,
          timestamp,
        };
        setOverrideLogs((prev) => [newLog, ...prev]);
      }
    }

    const newAssignment: Assignment = {
      Assignment_ID: assignmentId,
      Request_ID: payload.requestId,
      Vehicle_ID: payload.vehicleId,
      Driver_ID: payload.driverId,
      Status_Assignment: 'Aktif',
      Catatan_Pegawai: payload.notes,
      DateTime_Assigned: timestamp,
    };

    setAssignments((prev) => [newAssignment, ...prev]);

    setRequests((prev) =>
      prev.map((r) =>
        r.Request_ID === payload.requestId
          ? { ...r, Status_Permohonan: 'Lulus', Catatan: payload.notes }
          : r
      )
    );

    const targetReq = requests.find((r) => r.Request_ID === payload.requestId);
    showToast(`Penugasan ${assignmentId} berjaya dicipta! Arahan Memandu rasmi sedia.`);

    if (targetReq) {
      setDocModal({
        isOpen: true,
        type: 'arahan_memandu',
        request: targetReq,
        assignment: newAssignment,
      });
    }
  };

  // 5. Pegawai Kenderaan Rejects Trip
  const handleRejectTrip = (requestId: string, reason: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.Request_ID === requestId
          ? { ...r, Status_Permohonan: 'Ditolak Pegawai', Catatan: reason }
          : r
      )
    );
    showToast(`Permohonan #${requestId} telah ditolak oleh Pegawai Kenderaan.`);
  };

  // 6. Cancel Request (by Pemohon)
  const handleCancelRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.Request_ID === requestId ? { ...r, Status_Permohonan: 'Dibatalkan' } : r))
    );
    setAssignments((prev) =>
      prev.map((a) => (a.Request_ID === requestId ? { ...a, Status_Assignment: 'Dibatalkan' } : a))
    );
    showToast(`Permohonan #${requestId} telah dibatalkan.`);
  };

  // Counts & Lookups
  const pengarahPendingCount = requests.filter(
    (r) => r.Jenis_Perjalanan === 'Luar Negeri' && r.Status_Permohonan === 'Menunggu Kelulusan Pengarah'
  ).length;

  const officerPendingCount = requests.filter(
    (r) => r.Status_Permohonan === 'Pending Penugasan'
  ).length;

  const expiringDriversCount = drivers.filter(
    (d) => isExpiringWithin30Days(d, '2026-11-01').isExpiring
  ).length;

  const officerStaff = usersList.find((u) => u.Role === 'Pegawai_Kenderaan' || u.Role === 'Admin');
  const driverRecord = drivers.find((d) => d.User_ID === currentUser.User_ID || d.Staff_ID === currentUser.User_ID);

  // Active doc modal data
  const modalApplicant = docModal.request
    ? usersList.find((u) => u.User_ID === docModal.request?.Pemohon_User_ID) || currentUser
    : currentUser;

  const modalVehicle = docModal.assignment
    ? vehicles.find((v) => v.Vehicle_ID === docModal.assignment?.Vehicle_ID)
    : undefined;

  const modalDriver = docModal.assignment
    ? drivers.find((d) => d.Driver_ID === docModal.assignment?.Driver_ID)
    : undefined;

  const modalDriverStaff = modalDriver
    ? usersList.find((u) => u.User_ID === (modalDriver.User_ID || modalDriver.Staff_ID))
    : undefined;

  const handleDownloadDocPdf = () => {
    if (!docModal.request) return;

    if (docModal.type === 'arahan_memandu') {
      const { download } = generateArahanMemanduPDF({
        request: docModal.request,
        assignment: docModal.assignment,
        applicant: modalApplicant,
        vehicle: modalVehicle,
        driver: modalDriver,
        driverStaff: modalDriverStaff,
        officer: officerStaff,
      });
      download();
    } else {
      const { download } = generateNotisKeputusanPDF({
        request: docModal.request,
        assignment: docModal.assignment,
        applicant: modalApplicant,
        vehicle: modalVehicle,
        driver: modalDriver,
        driverStaff: modalDriverStaff,
        officer: officerStaff,
      });
      download();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Navbar with 4 Dedicated Roles Preview & User Persona Switcher */}
      <Navbar
        currentUser={currentUser}
        usersList={usersList}
        onSelectUser={(u) => {
          setCurrentUser(u);
          if (u.Role === 'Pengarah' || u.Is_Pengarah) setActiveRoleTab('pengarah');
          else if (u.Role === 'Pegawai_Kenderaan') setActiveRoleTab('pegawai');
          else if (u.Role === 'Pemandu') setActiveRoleTab('pemandu');
          else setActiveRoleTab('pemohon');
          showToast(`Persona pengguna bertukar: ${u.Nama_Penuh} (${u.Role})`);
        }}
        activeRoleTab={activeRoleTab}
        onChangeRoleTab={setActiveRoleTab}
        onOpenGasModal={() => setIsGasModalOpen(true)}
        pengarahPendingCount={pengarahPendingCount}
        officerPendingCount={officerPendingCount}
        expiringDriversCount={expiringDriversCount}
      />

      {/* Main App Content - Routes to the 4 Dedicated Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-4 p-3 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 flex items-center justify-between animate-fadeIn text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2 text-xs"
            >
              &times;
            </button>
          </div>
        )}

        {/* 1. VIEW PENGARAH (Kelulusan Luar Negeri & Pengurusan Tertinggi) */}
        {activeRoleTab === 'pengarah' && (
          <PengarahView
            currentUser={currentUser}
            users={usersList}
            requests={requests}
            vehicles={vehicles}
            onApproveLuarNegeri={handlePengarahApproveLuarNegeri}
            onRejectLuarNegeri={handlePengarahRejectLuarNegeri}
          />
        )}

        {/* 2. VIEW PEMOHON (Borang Permohonan + Upload PDF + Permohonan Saya) */}
        {activeRoleTab === 'pemohon' && (
          <StaffView
            currentUser={currentUser}
            requests={requests}
            onSubmitRequest={handleSubmitNewRequest}
            onCancelRequest={handleCancelRequest}
            onViewNotice={(req) => {
              const asn = assignments.find(
                (a) => a.Request_ID === req.Request_ID && a.Status_Assignment === 'Aktif'
              );
              setDocModal({
                isOpen: true,
                type: 'notis_keputusan',
                request: req,
                assignment: asn,
              });
            }}
            officerStaff={officerStaff}
          />
        )}

        {/* 3. VIEW PEGAWAI KENDERAAN (Peti Penugasan Kenderaan, Enjin Collision & Override) */}
        {activeRoleTab === 'pegawai' && (
          <PegawaiView
            currentUser={currentUser}
            requests={requests}
            assignments={assignments}
            vehicles={vehicles}
            drivers={drivers}
            staff={usersList}
            onAssignTrip={handleAssignTrip}
            onRejectTrip={handleRejectTrip}
            onViewOrder={(req, asn) => {
              setDocModal({
                isOpen: true,
                type: 'arahan_memandu',
                request: req,
                assignment: asn,
              });
            }}
          />
        )}

        {/* 4. VIEW PEMANDU (Tugasan Pemanduan, Kuasa Memandu Sah & Arahan Memandu PDF) */}
        {activeRoleTab === 'pemandu' && (
          <PemanduView
            currentUser={currentUser}
            driverRecord={driverRecord}
            assignments={assignments}
            requests={requests}
            vehicles={vehicles}
            staff={usersList}
            onViewOrder={(req, asn) => {
              setDocModal({
                isOpen: true,
                type: 'arahan_memandu',
                request: req,
                assignment: asn,
              });
            }}
            onDownloadPdf={(req, asn) => {
              const { download } = generateArahanMemanduPDF({
                request: req,
                assignment: asn,
                applicant: usersList.find((u) => u.User_ID === req.Pemohon_User_ID) || currentUser,
                vehicle: vehicles.find((v) => v.Vehicle_ID === asn.Vehicle_ID),
                driver: drivers.find((d) => d.Driver_ID === asn.Driver_ID),
                driverStaff: currentUser,
                officer: officerStaff,
              });
              download();
            }}
          />
        )}
      </main>

      {/* Official Document Viewer Modal (Arahan Memandu / Notis Keputusan) */}
      {docModal.isOpen && docModal.request && (
        <DocumentModal
          isOpen={docModal.isOpen}
          onClose={() => setDocModal((prev) => ({ ...prev, isOpen: false }))}
          type={docModal.type}
          request={docModal.request}
          assignment={docModal.assignment}
          applicant={modalApplicant}
          vehicle={modalVehicle}
          driver={modalDriver}
          driverStaff={modalDriverStaff}
          officer={officerStaff}
          onDownloadPdf={handleDownloadDocPdf}
        />
      )}

      {/* Google Apps Script 4-Files Exporter Modal */}
      <GasExportModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">KFMS Negeri Perlis v2.0</span>
            <span>&bull;</span>
            <span>4 Peranan: Pengarah &bull; Pemohon &bull; Pegawai Kenderaan &bull; Pemandu</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Google Apps Script 4-Fail (Code.gs, Index.html, css.html, JavaScript.html)</span>
            <button
              onClick={() => setIsGasModalOpen(true)}
              className="text-blue-700 hover:underline font-bold"
            >
              Buka Fail-Fail GAS
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
