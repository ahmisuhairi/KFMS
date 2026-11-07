/**
 * Collision Prevention & Driver Validity Engine for KFMS
 * Formulas specified in Section 3.1, 3.2, and 3.3 of KEMAS Specification
 */

import { Driver, Assignment, TripRequest, Vehicle, Staff, CollisionCheckResult } from '../types';

/**
 * Parses date string 'YYYY-MM-DD' and time string 'HH:mm' to UNIX timestamp (ms)
 */
export function getUnixTimestamp(dateStr: string, timeStr: string): number {
  if (!dateStr) return 0;
  const time = timeStr || '00:00';
  return new Date(`${dateStr}T${time}:00`).getTime();
}

/**
 * Format timestamp to Malay readable string
 */
export function formatMalayDateTime(dateStr: string, timeStr?: string): string {
  if (!dateStr) return '-';
  const months = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];
  try {
    const d = new Date(timeStr ? `${dateStr}T${timeStr}:00` : dateStr);
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    if (timeStr) {
      return `${day} ${month} ${year}, ${timeStr}`;
    }
    return `${day} ${month} ${year}`;
  } catch {
    return `${dateStr} ${timeStr || ''}`;
  }
}

/**
 * 3.1 Pengesahan Kuasa Memandu Sah (Driver Active Check)
 * Formula: Tarikh_Mula_Kuasa <= Hari_Ini AND (Tarikh_Tamat_Kuasa IS NULL/Empty OR Tarikh_Tamat_Kuasa >= Hari_Ini)
 */
export function isDriverAuthorized(driver: Driver, checkDateStr = '2026-11-01'): {
  isValid: boolean;
  reason: string;
  daysRemaining?: number;
} {
  const checkTime = new Date(`${checkDateStr}T00:00:00`).getTime();
  const startTime = new Date(`${driver.Tarikh_Mula_Kuasa}T00:00:00`).getTime();

  if (startTime > checkTime) {
    return {
      isValid: false,
      reason: `Kuasa memandu belum berkuatkuasa (Mula: ${driver.Tarikh_Mula_Kuasa})`,
    };
  }

  if (!driver.Tarikh_Tamat_Kuasa || driver.Tarikh_Tamat_Kuasa.trim() === '') {
    return {
      isValid: true,
      reason: 'Kuasa Memandu Tetap / Tiada Had Tempoh',
    };
  }

  const endTime = new Date(`${driver.Tarikh_Tamat_Kuasa}T23:59:59`).getTime();
  if (endTime < checkTime) {
    return {
      isValid: false,
      reason: `Kuasa memandu telah tamat pada ${driver.Tarikh_Tamat_Kuasa}`,
    };
  }

  // Calculate days remaining
  const diffDays = Math.ceil((endTime - checkTime) / (1000 * 60 * 60 * 24));

  return {
    isValid: true,
    reason: `Kuasa Memandu Sah (Baki ${diffDays} hari)`,
    daysRemaining: diffDays,
  };
}

/**
 * Check if a driver's authorization is expiring within 30 days
 */
export function isExpiringWithin30Days(driver: Driver, checkDateStr = '2026-11-01'): {
  isExpiring: boolean;
  daysLeft: number;
} {
  if (!driver.Tarikh_Tamat_Kuasa || driver.Tarikh_Tamat_Kuasa.trim() === '') {
    return { isExpiring: false, daysLeft: 9999 };
  }
  const checkTime = new Date(`${checkDateStr}T00:00:00`).getTime();
  const endTime = new Date(`${driver.Tarikh_Tamat_Kuasa}T23:59:59`).getTime();
  const diffMs = endTime - checkTime;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    isExpiring: daysLeft >= 0 && daysLeft <= 30,
    daysLeft,
  };
}

/**
 * 3.2 Algoritma Pencegahan Double-Booking (Collision Prevention)
 *
 * Check whether a prospective assignment overlaps with any existing ACTIVE assignment.
 * Formula: (Existing_Start <= New_End) AND (Existing_End >= New_Start)
 */
export function checkScheduleCollision(params: {
  vehicleId: string;
  driverId: string;
  newStartDate: string;
  newStartTime: string;
  newEndDate: string;
  newEndTime: string;
  assignments: Assignment[];
  requests: TripRequest[];
  vehicles: Vehicle[];
  drivers: Driver[];
  staff: Staff[];
  excludeRequestId?: string; // Ignore if evaluating for same request
}): CollisionCheckResult {
  const {
    vehicleId,
    driverId,
    newStartDate,
    newStartTime,
    newEndDate,
    newEndTime,
    assignments,
    requests,
    vehicles,
    drivers,
    staff,
    excludeRequestId,
  } = params;

  const newStartMs = getUnixTimestamp(newStartDate, newStartTime);
  const newEndMs = getUnixTimestamp(newEndDate, newEndTime);

  const activeAssignments = assignments.filter(
    (a) => a.Status_Assignment === 'Aktif' && a.Request_ID !== excludeRequestId
  );

  let vehicleConflict = false;
  let driverConflict = false;
  const conflictingAssignments: Assignment[] = [];
  const details: string[] = [];

  const vehicleObj = vehicles.find((v) => v.Vehicle_ID === vehicleId);
  const driverObj = drivers.find((d) => d.Driver_ID === driverId);
  const driverStaff = driverObj ? staff.find((s) => s.User_ID === driverObj.User_ID) : undefined;

  for (const assign of activeAssignments) {
    const existingReq = requests.find((r) => r.Request_ID === assign.Request_ID);
    if (!existingReq) continue;
    if (existingReq.Status_Permohonan === 'Dibatalkan' || existingReq.Status_Permohonan.includes('Ditolak')) {
      continue;
    }

    const existingStartMs = getUnixTimestamp(existingReq.Tarikh_Mula, existingReq.Masa_Mula);
    const existingEndMs = getUnixTimestamp(existingReq.Tarikh_Tamat, existingReq.Masa_Tamat);

    // Collision formula: (Existing_Start <= New_End) AND (Existing_End >= New_Start)
    const isOverlapping = existingStartMs <= newEndMs && existingEndMs >= newStartMs;

    if (isOverlapping) {
      let isThisAssignConflicting = false;

      // 1. Check vehicle collision
      if (assign.Vehicle_ID === vehicleId) {
        vehicleConflict = true;
        isThisAssignConflicting = true;
        details.push(
          `Kenderaan ${vehicleObj?.No_Plat || vehicleId} (${vehicleObj?.Model_Kenderaan}) telah ditugaskan untuk Permohonan #${assign.Request_ID} (${existingReq.Destinasi}) dari ${existingReq.Tarikh_Mula} ${existingReq.Masa_Mula} hingga ${existingReq.Tarikh_Tamat} ${existingReq.Masa_Tamat}.`
        );
      }

      // 2. Check driver collision
      if (assign.Driver_ID === driverId) {
        driverConflict = true;
        isThisAssignConflicting = true;
        details.push(
          `Pemandu ${driverStaff?.Nama_Penuh || driverId} telah ditugaskan untuk Permohonan #${assign.Request_ID} (${existingReq.Destinasi}) dalam tempoh masa yang sama.`
        );
      }

      if (isThisAssignConflicting && !conflictingAssignments.some((c) => c.Assignment_ID === assign.Assignment_ID)) {
        conflictingAssignments.push(assign);
      }
    }
  }

  return {
    hasCollision: vehicleConflict || driverConflict,
    vehicleConflict,
    driverConflict,
    conflictingAssignments,
    details,
  };
}

/**
 * Check if priority allows overriding
 */
export function canOverrideConflict(priority: TripRequest['Priority_Level']): boolean {
  return priority === 'Segera' || priority === 'Arahan Ketua Jabatan';
}
