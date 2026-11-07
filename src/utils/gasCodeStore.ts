/**
 * Complete, Production-Ready Google Apps Script (GAS) 4-File Architecture
 * Includes: Code.gs, Index.html, css.html, JavaScript.html, and SetupSheets.gs
 * Target: Jabatan Kemajuan Masyarakat (KEMAS) Negeri Perlis
 * 4 Peranan Berasingan: Pengarah, Pemohon, Pegawai Kenderaan, dan Pemandu
 */

export const GAS_FILES = {
  'Code.gs': `/**
 * @file Code.gs
 * @description KEMAS FLEET MANAGEMENT SYSTEM (KFMS) - NEGERI PERLIS
 * @version 2.5 Production (4 Peranan: Pengarah, Pemohon, Pegawai Kenderaan, Pemandu)
 */

var CONFIG = {
  SHEET_USERS: 'Users',
  SHEET_VEHICLES: 'Vehicles',
  SHEET_DRIVERS: 'Drivers',
  SHEET_REQUESTS: 'Trip_Requests',
  SHEET_ASSIGNMENTS: 'Assignments',
  SHEET_OVERRIDE_LOGS: 'Override_Logs',
  FOLDER_LAMPIRAN: 'KEMAS/Fleet/Lampiran/',
  FOLDER_ASSIGNMENTS: 'KEMAS/Fleet/Assignments/',
  FOLDER_TEMPLATES: 'KEMAS/Fleet/Templates/'
};

/**
 * 1. Entry point Web App
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('KFMS Perlis - KEMAS Fleet Management System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Utiliti include fail HTML (css.html & JavaScript.html)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * 2. Mengambil Konteks Pengguna Semasa Berasaskan Jadual 'Users'
 * Peranan: Pengarah, Pemohon, Pegawai_Kenderaan, Pemandu
 */
function getCurrentUserContext() {
  try {
    var email = Session.getActiveUser().getEmail();
    if (!email) {
      email = Session.getEffectiveUser().getEmail();
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetUsers = ss.getSheetByName(CONFIG.SHEET_USERS);
    if (!sheetUsers) {
      throw new Error("Helaian 'Users' tidak ditemui. Sila jalankan setupKemasPerlisDatabase() terlebih dahulu.");
    }

    var data = sheetUsers.getDataRange().getValues();
    var headers = data[0];
    var emailIdx = headers.indexOf('Email');
    var userIdIdx = headers.indexOf('User_ID');
    var namaIdx = headers.indexOf('Nama_Penuh');
    var jawatanIdx = headers.indexOf('Jawatan');
    var bahagianIdx = headers.indexOf('Bahagian');
    var telIdx = headers.indexOf('No_Telefon');
    var roleIdx = headers.indexOf('Role');
    var aktifIdx = headers.indexOf('Status_Aktif');

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[emailIdx] && row[emailIdx].toString().trim().toLowerCase() === email.toLowerCase()) {
        var rawRole = row[roleIdx];
        var isPengarah = (row[jawatanIdx] && row[jawatanIdx].toString().toLowerCase().indexOf('pengarah') !== -1) || rawRole === 'Pengarah';
        
        var normalizedRole = rawRole;
        if (isPengarah) normalizedRole = 'Pengarah';
        else if (rawRole === 'Staff') normalizedRole = 'Pemohon';
        else if (rawRole === 'Admin') normalizedRole = 'Pegawai_Kenderaan';

        return {
          success: true,
          user: {
            User_ID: row[userIdIdx],
            Email: row[emailIdx],
            Nama_Penuh: row[namaIdx],
            Jawatan: row[jawatanIdx],
            Bahagian: row[bahagianIdx],
            No_Telefon: row[telIdx],
            Role: normalizedRole,
            Status_Aktif: row[aktifIdx],
            Is_Pengarah: isPengarah
          }
        };
      }
    }

    // Default Fallback jika emel belum didaftarkan
    return {
      success: true,
      user: {
        User_ID: 'USR-GUEST',
        Email: email,
        Nama_Penuh: email.split('@')[0],
        Jawatan: 'Kakitangan KEMAS',
        Bahagian: 'KEMAS Negeri Perlis',
        No_Telefon: '',
        Role: 'Pemohon',
        Status_Aktif: 'Yes',
        Is_Pengarah: false
      }
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 3. Mengambil Data Keseluruhan Sistem
 */
function getInitialDashboardData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var usersData = getSheetRowsAsObjects(ss.getSheetByName(CONFIG.SHEET_USERS));
    var vehiclesData = getSheetRowsAsObjects(ss.getSheetByName(CONFIG.SHEET_VEHICLES));
    var driversData = getSheetRowsAsObjects(ss.getSheetByName(CONFIG.SHEET_DRIVERS));
    var requestsData = getSheetRowsAsObjects(ss.getSheetByName(CONFIG.SHEET_REQUESTS));
    var assignmentsData = getSheetRowsAsObjects(ss.getSheetByName(CONFIG.SHEET_ASSIGNMENTS));

    var userCtx = getCurrentUserContext();

    return {
      success: true,
      currentUser: userCtx.user,
      users: usersData,
      vehicles: vehiclesData,
      drivers: driversData,
      requests: requestsData,
      assignments: assignmentsData
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 4. Menyimpan Fail PDF Lampiran Sokongan ke Google Drive
 */
function savePdfToGoogleDrive(base64Data, fileName, requestId) {
  try {
    if (!base64Data || base64Data.trim() === '') return '';

    var cleanBase64 = base64Data.replace(/^data:application\\/pdf;base64,/, '');
    var decoded = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decoded, 'application/pdf', (requestId ? (requestId + '_') : '') + fileName);

    var now = new Date();
    var yyyy = now.getFullYear().toString();
    var mm = ('0' + (now.getMonth() + 1)).slice(-2);
    var targetFolder = getOrCreateTargetFolder(CONFIG.FOLDER_LAMPIRAN, yyyy, mm);

    var file = targetFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    Logger.log("Ralat Simpan PDF Lampiran ke Drive: " + e.toString());
    return '';
  }
}

/**
 * 5. Menghantar Permohonan Kenderaan Baharu (Pemohon / Staff)
 */
function submitNewTripRequest(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_REQUESTS);
    if (!sheet) throw new Error("Helaian 'Trip_Requests' tidak wujud.");

    var startUnix = new Date(payload.Tarikh_Mula + 'T' + payload.Masa_Mula + ':00').getTime();
    var endUnix = new Date(payload.Tarikh_Tamat + 'T' + payload.Masa_Tamat + ':00').getTime();

    if (endUnix <= startUnix) {
      throw new Error("Tarikh dan masa tamat mestilah selepas tarikh dan masa mula perjalanan.");
    }

    var now = new Date();
    var yyyy = now.getFullYear();
    var mm = ('0' + (now.getMonth() + 1)).slice(-2);
    var dd = ('0' + now.getDate()).slice(-2);
    var randomCode = ('000' + Math.floor(Math.random() * 9999)).slice(-4);
    var requestId = 'REQ-' + yyyy + mm + dd + '-' + randomCode;
    var timestamp = Utilities.formatDate(now, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd HH:mm:ss');

    var pdfDriveUrl = '';
    if (payload.pdfBase64 && payload.pdfFileName) {
      pdfDriveUrl = savePdfToGoogleDrive(payload.pdfBase64, payload.pdfFileName, requestId);
    }

    var initialStatus = (payload.Jenis_Perjalanan === 'Luar Negeri')
      ? 'Menunggu Kelulusan Pengarah'
      : 'Pending Penugasan';

    sheet.appendRow([
      requestId,
      payload.Pemohon_User_ID,
      payload.Priority_Level,
      payload.Jenis_Perjalanan,
      payload.Destinasi,
      payload.Tujuan,
      payload.Tarikh_Mula,
      payload.Masa_Mula,
      payload.Tarikh_Tamat,
      payload.Masa_Tamat,
      pdfDriveUrl,
      initialStatus,
      timestamp,
      payload.Catatan || ''
    ]);

    var msg = (initialStatus === 'Menunggu Kelulusan Pengarah')
      ? 'Permohonan Luar Negeri berjaya dihantar dan kini MENUNGGU KELULUSAN PENGARAH KEMAS PERLIS.'
      : 'Permohonan berjaya dihantar ke Peti Masuk Pegawai Kenderaan untuk penugasan.';

    return {
      success: true,
      message: msg,
      requestId: requestId,
      status: initialStatus,
      pdfUrl: pdfDriveUrl
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 6. Kelulusan Perjalanan Luar Negeri oleh Pengarah KEMAS Negeri Perlis
 */
function pengarahReviewTripRequest(requestId, decision, catatanPengarah) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_REQUESTS);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var reqIdIdx = headers.indexOf('Request_ID');
    var statusIdx = headers.indexOf('Status_Permohonan');
    var catatanIdx = headers.indexOf('Catatan');

    for (var i = 1; i < data.length; i++) {
      if (data[i][reqIdIdx] === requestId) {
        var rowIndex = i + 1;
        var newStatus = (decision === 'LULUS') ? 'Pending Penugasan' : 'Ditolak Pengarah';
        var note = 'Pengarah KEMAS Perlis: ' + (catatanPengarah || (decision === 'LULUS' ? 'Diluluskan perjalanan luar negeri.' : 'Ditolak.'));

        sheet.getRange(rowIndex, statusIdx + 1).setValue(newStatus);
        sheet.getRange(rowIndex, catatanIdx + 1).setValue(note);

        return {
          success: true,
          message: 'Permohonan #' + requestId + ' telah ' + (decision === 'LULUS' ? 'DILULUSKAN oleh Pengarah dan kini sedia untuk penugasan Pegawai Kenderaan.' : 'DITOLAK oleh Pengarah.'),
          status: newStatus
        };
      }
    }
    throw new Error("Permohonan #" + requestId + " tidak ditemui.");
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 7. Memproses Penugasan Kenderaan & Pemandu (Pegawai Kenderaan)
 */
function processAssignment(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetReq = ss.getSheetByName(CONFIG.SHEET_REQUESTS);
    var sheetAsn = ss.getSheetByName(CONFIG.SHEET_ASSIGNMENTS);
    var sheetDrv = ss.getSheetByName(CONFIG.SHEET_DRIVERS);

    var allReqs = getSheetRowsAsObjects(sheetReq);
    var targetReq = allReqs.find(function(r) { return r.Request_ID === payload.Request_ID; });
    if (!targetReq) throw new Error("Permohonan #" + payload.Request_ID + " tidak ditemui.");

    if (targetReq.Status_Permohonan === 'Menunggu Kelulusan Pengarah') {
      throw new Error("Permohonan luar negeri ini memerlukan kelulusan Pengarah KEMAS Negeri Perlis terlebih dahulu.");
    }

    var allDrivers = getSheetRowsAsObjects(sheetDrv);
    var targetDriver = allDrivers.find(function(d) { return d.Driver_ID === payload.Driver_ID; });
    if (!targetDriver) throw new Error("Pemandu #" + payload.Driver_ID + " tidak sah.");

    var todayStr = Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
    var isDriverValid = checkDriverValidity(targetDriver, todayStr);
    if (!isDriverValid.isValid) {
      throw new Error("Pemandu tidak sah: " + isDriverValid.reason);
    }

    var newStartUnix = new Date(targetReq.Tarikh_Mula + 'T' + targetReq.Masa_Mula + ':00').getTime();
    var newEndUnix = new Date(targetReq.Tarikh_Tamat + 'T' + targetReq.Masa_Tamat + ':00').getTime();

    var allAssignments = getSheetRowsAsObjects(sheetAsn);
    var activeAssignments = allAssignments.filter(function(a) { return a.Status_Assignment === 'Aktif'; });

    for (var i = 0; i < activeAssignments.length; i++) {
      var existAsn = activeAssignments[i];
      var existReq = allReqs.find(function(r) { return r.Request_ID === existAsn.Request_ID; });
      if (!existReq || existReq.Status_Permohonan === 'Dibatalkan' || existReq.Status_Permohonan.indexOf('Ditolak') !== -1) continue;

      var existStartUnix = new Date(existReq.Tarikh_Mula + 'T' + existReq.Masa_Mula + ':00').getTime();
      var existEndUnix = new Date(existReq.Tarikh_Tamat + 'T' + existReq.Masa_Tamat + ':00').getTime();

      var isOverlapping = (existStartUnix <= newEndUnix) && (existEndUnix >= newStartUnix);

      if (isOverlapping) {
        if (existAsn.Vehicle_ID === payload.Vehicle_ID) {
          throw new Error("PERMOHONAN DITOLAK (PERTINDIHAN KENDERAAN): Kenderaan " + payload.Vehicle_ID + " telah ditugaskan untuk Permohonan #" + existAsn.Request_ID);
        }
        if (existAsn.Driver_ID === payload.Driver_ID) {
          throw new Error("PERMOHONAN DITOLAK (PERTINDIHAN PEMANDU): Pemandu " + payload.Driver_ID + " telah ditugaskan untuk Permohonan #" + existAsn.Request_ID);
        }
      }
    }

    var now = new Date();
    var yyyy = now.getFullYear();
    var mm = ('0' + (now.getMonth() + 1)).slice(-2);
    var dd = ('0' + now.getDate()).slice(-2);
    var randCode = ('000' + Math.floor(Math.random() * 9999)).slice(-4);
    var assignmentId = 'ASN-' + yyyy + mm + dd + '-' + randCode;
    var timestamp = Utilities.formatDate(now, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd HH:mm:ss');

    sheetAsn.appendRow([
      assignmentId,
      payload.Request_ID,
      payload.Vehicle_ID,
      payload.Driver_ID,
      'Aktif',
      payload.Catatan_Pegawai || 'Diluluskan.',
      '#',
      timestamp
    ]);

    updateTripRequestStatus(payload.Request_ID, 'Lulus', payload.Catatan_Pegawai || 'Diluluskan.');

    return {
      success: true,
      message: 'Penugasan kenderaan berjaya diproses. No. Penugasan: ' + assignmentId,
      assignmentId: assignmentId
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 8. Semakan Kuasa Memandu Sah
 */
function checkDriverValidity(driver, checkDateStr) {
  var checkUnix = new Date(checkDateStr).getTime();
  var startUnix = new Date(driver.Tarikh_Mula_Kuasa).getTime();

  if (startUnix > checkUnix) {
    return { isValid: false, reason: "Kuasa belum berkuatkuasa" };
  }
  if (!driver.Tarikh_Tamat_Kuasa || driver.Tarikh_Tamat_Kuasa.toString().trim() === '') {
    return { isValid: true, reason: "Kuasa Tetap" };
  }
  var endUnix = new Date(driver.Tarikh_Tamat_Kuasa).getTime();
  if (endUnix < checkUnix) {
    return { isValid: false, reason: "Kuasa telah luput pada " + driver.Tarikh_Tamat_Kuasa };
  }
  return { isValid: true, reason: "Kuasa Sah" };
}

function getSheetRowsAsObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
      }
      obj[headers[j]] = val;
    }
    rows.push(obj);
  }
  return rows;
}

function getOrCreateTargetFolder(baseFolderPath, year, month) {
  var parts = baseFolderPath.split('/').filter(function(p) { return p.length > 0; });
  var current = DriveApp.getRootFolder();
  for (var i = 0; i < parts.length; i++) {
    var folders = current.getFoldersByName(parts[i]);
    current = folders.hasNext() ? folders.next() : current.createFolder(parts[i]);
  }
  var yearFolders = current.getFoldersByName(year.toString());
  var yearFolder = yearFolders.hasNext() ? yearFolders.next() : current.createFolder(year.toString());
  var monthFolders = yearFolder.getFoldersByName(month.toString());
  return monthFolders.hasNext() ? monthFolders.next() : yearFolder.createFolder(month.toString());
}

function updateTripRequestStatus(requestId, status, catatan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_REQUESTS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var reqIdIdx = headers.indexOf('Request_ID');
  var statusIdx = headers.indexOf('Status_Permohonan');
  var catatanIdx = headers.indexOf('Catatan');

  for (var i = 1; i < data.length; i++) {
    if (data[i][reqIdIdx] === requestId) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(status);
      if (catatan) {
        sheet.getRange(i + 1, catatanIdx + 1).setValue(catatan);
      }
      break;
    }
  }
}
`,

  'Index.html': `<!DOCTYPE html>
<html lang="ms">
<head>
  <base target="_top">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KFMS Perlis - KEMAS Fleet Management System</title>
  
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- FontAwesome 6 -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
  <!-- SweetAlert2 -->
  <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css" rel="stylesheet">

  <!-- Include css.html -->
  <?!= include('css'); ?>
</head>
<body>

  <!-- Header Rasmi KEMAS Perlis -->
  <header class="kemas-header">
    <div class="container-fluid d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-3">
        <i class="fa-solid fa-car-side fa-2x text-warning"></i>
        <div>
          <h4 class="m-0 fw-bold">KFMS NEGERI PERLIS</h4>
          <small class="text-white-50">Sistem Pengurusan & Penugasan Kenderaan Jabatan Kemajuan Masyarakat</small>
        </div>
      </div>
      <div class="text-end">
        <span class="badge bg-light text-dark p-2" id="userRoleBadge">Memuatkan...</span>
        <div class="small text-white-50 mt-1" id="userEmailLabel"></div>
      </div>
    </div>
  </header>

  <div class="container-fluid my-4">
    <!-- Nav Tabs Berasaskan 4 Peranan Khusus: Pengarah, Pemohon, Pegawai Kenderaan, Pemandu -->
    <ul class="nav nav-tabs mb-4 bg-white p-2 rounded shadow-sm" id="roleTabs" role="tablist">
      <li class="nav-item">
        <button class="nav-link" id="btn-pengarah-tab" data-bs-toggle="tab" data-bs-target="#view-pengarah">
          <i class="fa-solid fa-stamp text-danger me-1"></i>1. Pengarah
          <span class="badge bg-danger ms-1" id="badgePengarahNav">0</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link active" id="btn-pemohon-tab" data-bs-toggle="tab" data-bs-target="#view-pemohon">
          <i class="fa-solid fa-file-pen text-primary me-1"></i>2. Pemohon (Staff)
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" id="btn-pegawai-tab" data-bs-toggle="tab" data-bs-target="#view-pegawai">
          <i class="fa-solid fa-car text-warning me-1"></i>3. Pegawai Kenderaan
          <span class="badge bg-primary ms-1" id="badgePegawaiNav">0</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" id="btn-driver-tab" data-bs-toggle="tab" data-bs-target="#view-driver">
          <i class="fa-solid fa-truck-moving text-success me-1"></i>4. Pemandu
        </button>
      </li>
    </ul>

    <!-- Kandungan 4 Paparan Khusus -->
    <div class="tab-content">

      <!-- VIEW 1: PENGARAH (Kelulusan Perjalanan Luar Negeri) -->
      <div class="tab-pane fade" id="view-pengarah">
        <div class="card shadow-sm border-0 mb-4 border-start border-4 border-danger">
          <div class="card-header bg-white py-3 fw-bold d-flex justify-content-between align-items-center">
            <span class="text-danger">
              <i class="fa-solid fa-stamp me-2"></i>Peti Kelulusan Perjalanan Luar Negeri (YBhg. Pengarah KEMAS Perlis)
            </span>
            <span class="badge bg-danger" id="badgePengarahCount">0 Menunggu</span>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>No. Rujukan & Pemohon</th>
                    <th>Destinasi & Tujuan</th>
                    <th>Tarikh / Masa</th>
                    <th>Dokumen Sokongan (PDF)</th>
                    <th>Tindakan Pengarah</th>
                  </tr>
                </thead>
                <tbody id="pengarahRequestsTbody">
                  <tr><td colspan="5" class="text-center py-4 text-muted">Tiada permohonan luar negeri yang menunggu kelulusan.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW 2: PEMOHON (Borang Permohonan + Upload PDF + Permohonan Saya) -->
      <div class="tab-pane fade show active" id="view-pemohon">
        <div class="row">
          <div class="col-lg-5 mb-4">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-white py-3 fw-bold">
                <i class="fa-solid fa-plus-circle text-primary me-2"></i>Borang Permohonan Perjalanan Rasmi
              </div>
              <div class="card-body">
                <form id="tripForm">
                  <div class="mb-3">
                    <label class="form-label fw-bold">Tahap Keutamaan</label>
                    <select class="form-select" id="formPriority" required>
                      <option value="Normal">Normal (Urusan Rutin)</option>
                      <option value="Segera">Segera (Mendesak)</option>
                      <option value="Arahan Ketua Jabatan">Arahan Ketua Jabatan (VIP)</option>
                    </select>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-bold">Jenis Perjalanan</label>
                    <select class="form-select" id="formTripType" required>
                      <option value="Dalam Negeri">Dalam Negeri (Perlis)</option>
                      <option value="Luar Negeri">Luar Negeri (Memerlukan Kelulusan Pengarah)</option>
                    </select>
                    <small class="text-danger fw-semibold" id="luarNegeriNotice" style="display:none;">
                      * Perjalanan Luar Negeri wajib dimajukan untuk kelulusan Pengarah KEMAS Perlis terlebih dahulu.
                    </small>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-bold">Destinasi Rasmi</label>
                    <input type="text" class="form-control" id="formDestinasi" placeholder="cth: Ibu Pejabat KEMAS Putrajaya" required>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-bold">Tujuan Urusan</label>
                    <textarea class="form-control" id="formTujuan" rows="2" placeholder="Nyatakan tujuan rasmi..." required></textarea>
                  </div>

                  <!-- Upload Dokumen Sokongan (PDF) -->
                  <div class="mb-3 p-3 bg-light rounded border">
                    <label class="form-label fw-bold text-dark d-flex align-items-center justify-content-between">
                      <span><i class="fa-solid fa-file-pdf text-danger me-1"></i>Muat Naik Surat Sokongan / Bengkel (PDF)</span>
                      <small class="text-danger fw-semibold" id="labelWajibPdf" style="display:none;">* Wajib Luar Negeri</small>
                    </label>
                    <input type="file" class="form-control" id="formPdfFile" accept="application/pdf">
                    <small class="text-muted d-block mt-1">Disimpan ke Google Drive (KEMAS/Fleet/Lampiran/).</small>
                  </div>

                  <div class="row g-2 mb-3">
                    <div class="col-6">
                      <label class="form-label fw-bold">Tarikh Mula</label>
                      <input type="date" class="form-control" id="formStartDate" required>
                    </div>
                    <div class="col-6">
                      <label class="form-label fw-bold">Masa Mula</label>
                      <input type="time" class="form-control" id="formStartTime" value="08:30" required>
                    </div>
                  </div>

                  <div class="row g-2 mb-3">
                    <div class="col-6">
                      <label class="form-label fw-bold">Tarikh Tamat</label>
                      <input type="date" class="form-control" id="formEndDate" required>
                    </div>
                    <div class="col-6">
                      <label class="form-label fw-bold">Masa Tamat</label>
                      <input type="time" class="form-control" id="formEndTime" value="17:00" required>
                    </div>
                  </div>

                  <button type="submit" class="btn btn-primary w-100 py-2 fw-bold" id="btnSubmitTrip">
                    <i class="fa-solid fa-paper-plane me-2"></i>Hantar Permohonan
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div class="col-lg-7">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-white py-3 fw-bold d-flex justify-content-between align-items-center">
                <span><i class="fa-solid fa-list-check text-secondary me-2"></i>Status Permohonan Saya</span>
                <button class="btn btn-sm btn-outline-secondary" onclick="loadDashboard()"><i class="fa-solid fa-rotate"></i></button>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>ID & Dokumen</th>
                        <th>Destinasi & Jadual</th>
                        <th>Keutamaan</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody id="pemohonRequestsTbody">
                      <tr><td colspan="4" class="text-center py-4 text-muted">Memuatkan data...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW 3: PEGAWAI KENDERAAN (Peti Penugasan Kenderaan & Pemandu) -->
      <div class="tab-pane fade" id="view-pegawai">
        <div class="card shadow-sm border-0 mb-4">
          <div class="card-header bg-white py-3 fw-bold d-flex justify-content-between align-items-center">
            <span><i class="fa-solid fa-clipboard-check text-warning me-2"></i>Peti Penugasan Kenderaan & Pemandu (Sedia Ditugaskan)</span>
            <span class="badge bg-primary" id="badgeReadyAssignCount">0 Sedia</span>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Keutamaan</th>
                    <th>ID & Pemohon</th>
                    <th>Destinasi</th>
                    <th>Jadual</th>
                    <th>Surat Sokongan</th>
                    <th>Tindakan Penugasan</th>
                  </tr>
                </thead>
                <tbody id="officerAssignTbody">
                  <tr><td colspan="6" class="text-center py-4 text-muted">Tiada permohonan sedia untuk penugasan.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW 4: PEMANDU (Tugasan Pemanduan) -->
      <div class="tab-pane fade" id="view-driver">
        <div class="card shadow-sm border-0 mb-4">
          <div class="card-header bg-white py-3 fw-bold">
            <i class="fa-solid fa-id-badge text-success me-2"></i>Tugasan Pemanduan Aktif Saya
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>No. Penugasan</th>
                    <th>Kenderaan</th>
                    <th>Destinasi & Jadual</th>
                    <th>Pegawai Menumpang</th>
                    <th>Hubungi (WhatsApp)</th>
                  </tr>
                </thead>
                <tbody id="driverTasksTbody">
                  <tr><td colspan="5" class="text-center py-4 text-muted">Tiada tugasan aktif.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Modal Penugasan Kenderaan & Pemandu -->
  <div class="modal fade" id="modalAssignTrip" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title"><i class="fa-solid fa-car me-2"></i>Penugasan Kenderaan & Pemandu (Pegawai Kenderaan)</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div id="assignTargetInfo" class="p-3 bg-light rounded mb-3"></div>

          <div class="mb-3">
            <label class="form-label fw-bold">Pilih Kenderaan Jabatan (Aktif)</label>
            <select class="form-select" id="selectVehicle"></select>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">Pilih Pemandu Bertugas</label>
            <select class="form-select" id="selectDriver"></select>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">Catatan / Arahan Khas Pegawai Kenderaan</label>
            <textarea class="form-control" id="assignOfficerNotes" rows="2" placeholder="cth: Sila semak buku log kenderaan dan patuhi had laju..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
          <button type="button" class="btn btn-success" id="btnConfirmAssign">
            <i class="fa-solid fa-check me-1"></i>Sahkan Penugasan & Kunci Jadual
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Bootstrap 5 JS & Dependencies -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

  <!-- Include JavaScript.html -->
  <?!= include('JavaScript'); ?>
</body>
</html>
`,

  'css.html': `<style>
  :root {
    --kemas-navy: #0f2d5c;
    --kemas-navy-dark: #091c3d;
    --kemas-gold: #c59b27;
  }
  body {
    background-color: #f1f5f9;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  .kemas-header {
    background: linear-gradient(135deg, var(--kemas-navy) 0%, #1e3a8a 100%);
    color: white;
    padding: 1.25rem 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  .nav-tabs .nav-link {
    color: #475569;
    font-weight: 600;
    border-radius: 0.5rem;
    padding: 0.6rem 1rem;
  }
  .nav-tabs .nav-link.active {
    font-weight: 700;
    color: var(--kemas-navy);
    border-bottom: 3px solid var(--kemas-navy);
    background-color: #f8fafc;
  }
  .card {
    border-radius: 0.85rem;
  }
</style>
`,

  'JavaScript.html': `<script>
  var APP_DATA = null;
  var currentAssignRequestId = null;

  window.onload = function() {
    initEvents();
    loadDashboard();
  };

  function initEvents() {
    document.getElementById('formTripType').addEventListener('change', function(e) {
      var isLuar = (e.target.value === 'Luar Negeri');
      document.getElementById('luarNegeriNotice').style.display = isLuar ? 'block' : 'none';
      document.getElementById('labelWajibPdf').style.display = isLuar ? 'inline' : 'none';
    });

    document.getElementById('tripForm').addEventListener('submit', function(e) {
      e.preventDefault();
      handleFormSubmit();
    });

    document.getElementById('btnConfirmAssign').addEventListener('click', function() {
      executeAssignment();
    });
  }

  function loadDashboard() {
    Swal.fire({
      title: 'Memuatkan Data KFMS...',
      allowOutsideClick: false,
      didOpen: function() { Swal.showLoading(); }
    });

    google.script.run
      .withSuccessHandler(function(data) {
        Swal.close();
        if (!data.success) {
          Swal.fire('Ralat', data.error, 'error');
          return;
        }
        APP_DATA = data;
        renderDashboard();
      })
      .withFailureHandler(function(err) {
        Swal.fire('Ralat Sistem', err.toString(), 'error');
      })
      .getInitialDashboardData();
  }

  function renderDashboard() {
    if (!APP_DATA) return;
    var user = APP_DATA.currentUser;

    document.getElementById('userRoleBadge').innerText = user.Nama_Penuh + ' (' + user.Role + ')';
    document.getElementById('userEmailLabel').innerText = user.Email + ' | ' + user.Bahagian;

    // Auto-activate tab based on user role
    if (user.Role === 'Pengarah') {
      var el = document.querySelector('#btn-pengarah-tab');
      bootstrap.Tab.getInstance(el) || new bootstrap.Tab(el).show();
    } else if (user.Role === 'Pegawai_Kenderaan') {
      var el = document.querySelector('#btn-pegawai-tab');
      bootstrap.Tab.getInstance(el) || new bootstrap.Tab(el).show();
    } else if (user.Role === 'Pemandu') {
      var el = document.querySelector('#btn-driver-tab');
      bootstrap.Tab.getInstance(el) || new bootstrap.Tab(el).show();
    } else {
      var el = document.querySelector('#btn-pemohon-tab');
      bootstrap.Tab.getInstance(el) || new bootstrap.Tab(el).show();
    }

    renderPengarahRequests();
    renderPemohonRequests();
    renderOfficerQueue();
    renderDriverTasks();
  }

  // 1. Render Pengarah View
  function renderPengarahRequests() {
    var luarPending = APP_DATA.requests.filter(function(r) {
      return r.Jenis_Perjalanan === 'Luar Negeri' && r.Status_Permohonan === 'Menunggu Kelulusan Pengarah';
    });

    document.getElementById('badgePengarahCount').innerText = luarPending.length + ' Menunggu';
    document.getElementById('badgePengarahNav').innerText = luarPending.length;
    var tbody = document.getElementById('pengarahRequestsTbody');

    if (luarPending.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Tiada permohonan luar negeri yang memerlukan kelulusan Pengarah.</td></tr>';
      return;
    }

    tbody.innerHTML = luarPending.map(function(r) {
      var applicant = APP_DATA.users.find(function(u) { return u.User_ID === r.Pemohon_User_ID; });
      var pdfBtn = (r.Lampiran_PDF_URL && r.Lampiran_PDF_URL !== '')
        ? '<a href="' + r.Lampiran_PDF_URL + '" target="_blank" class="btn btn-sm btn-outline-danger"><i class="fa-solid fa-file-pdf me-1"></i>Buka PDF</a>'
        : '<span class="text-muted small">Tiada</span>';

      return '<tr>' +
        '<td><b>' + r.Request_ID + '</b><br><small>' + (applicant ? applicant.Nama_Penuh : r.Pemohon_User_ID) + '</small></td>' +
        '<td>' + r.Destinasi + '<br><small class="text-muted">' + r.Tujuan + '</small></td>' +
        '<td>' + r.Tarikh_Mula + ' (' + r.Masa_Mula + ')<br>' + r.Tarikh_Tamat + ' (' + r.Masa_Tamat + ')</td>' +
        '<td>' + pdfBtn + '</td>' +
        '<td>' +
          '<button class="btn btn-sm btn-success me-1" onclick="reviewPengarah(\\'' + r.Request_ID + '\\', \\'LULUS\\')"><i class="fa-solid fa-check me-1"></i>Lulus</button>' +
          '<button class="btn btn-sm btn-danger" onclick="reviewPengarah(\\'' + r.Request_ID + '\\', \\'TOLAK\\')"><i class="fa-solid fa-xmark me-1"></i>Tolak</button>' +
        '</td>' +
        '</tr>';
    }).join('');
  }

  // 2. Render Pemohon View
  function renderPemohonRequests() {
    var user = APP_DATA.currentUser;
    var myReqs = APP_DATA.requests.filter(function(r) { return r.Pemohon_User_ID === user.User_ID; });
    var tbody = document.getElementById('pemohonRequestsTbody');

    if (myReqs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Tiada permohonan direkodkan lagi.</td></tr>';
      return;
    }

    tbody.innerHTML = myReqs.map(function(r) {
      var badgeClass = 'bg-secondary';
      if (r.Status_Permohonan === 'Lulus') badgeClass = 'bg-success';
      else if (r.Status_Permohonan === 'Menunggu Kelulusan Pengarah') badgeClass = 'bg-danger';
      else if (r.Status_Permohonan === 'Pending Penugasan') badgeClass = 'bg-warning text-dark';
      else if (r.Status_Permohonan.indexOf('Ditolak') !== -1) badgeClass = 'bg-danger';

      var pdfLink = (r.Lampiran_PDF_URL && r.Lampiran_PDF_URL !== '')
        ? '<br><a href="' + r.Lampiran_PDF_URL + '" target="_blank" class="small text-danger fw-bold"><i class="fa-solid fa-file-pdf me-1"></i>Papar Dokumen PDF</a>'
        : '';

      return '<tr>' +
        '<td><b>' + r.Request_ID + '</b>' + pdfLink + '</td>' +
        '<td>' + r.Destinasi + '<br><small class="text-muted">' + r.Tarikh_Mula + ' (' + r.Masa_Mula + ') - ' + r.Tarikh_Tamat + '</small></td>' +
        '<td><span class="badge bg-secondary">' + r.Priority_Level + '</span></td>' +
        '<td><span class="badge ' + badgeClass + '">' + r.Status_Permohonan + '</span></td>' +
        '</tr>';
    }).join('');
  }

  // 3. Render Pegawai Kenderaan View
  function renderOfficerQueue() {
    var readyReqs = APP_DATA.requests.filter(function(r) {
      return r.Status_Permohonan === 'Pending Penugasan';
    });

    document.getElementById('badgeReadyAssignCount').innerText = readyReqs.length + ' Sedia';
    document.getElementById('badgePegawaiNav').innerText = readyReqs.length;
    var tbody = document.getElementById('officerAssignTbody');

    if (readyReqs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Tiada permohonan sedia untuk penugasan pada masa ini.</td></tr>';
      return;
    }

    tbody.innerHTML = readyReqs.map(function(r) {
      var applicant = APP_DATA.users.find(function(u) { return u.User_ID === r.Pemohon_User_ID; });
      var pdfBtn = (r.Lampiran_PDF_URL && r.Lampiran_PDF_URL !== '')
        ? '<a href="' + r.Lampiran_PDF_URL + '" target="_blank" class="text-danger"><i class="fa-solid fa-file-pdf"></i> Buka</a>'
        : '-';

      return '<tr>' +
        '<td><span class="badge bg-secondary">' + r.Priority_Level + '</span></td>' +
        '<td><b>' + r.Request_ID + '</b><br><small>' + (applicant ? applicant.Nama_Penuh : r.Pemohon_User_ID) + '</small></td>' +
        '<td>' + r.Destinasi + ' (' + r.Jenis_Perjalanan + ')</td>' +
        '<td>' + r.Tarikh_Mula + ' &rarr; ' + r.Tarikh_Tamat + '</td>' +
        '<td>' + pdfBtn + '</td>' +
        '<td>' +
          '<button class="btn btn-sm btn-primary" onclick="openAssignModal(\\'' + r.Request_ID + '\\')"><i class="fa-solid fa-truck-pickup me-1"></i>Tugaskan</button>' +
        '</td>' +
        '</tr>';
    }).join('');
  }

  // 4. Render Pemandu View
  function renderDriverTasks() {
    var user = APP_DATA.currentUser;
    var driverRecord = APP_DATA.drivers.find(function(d) { return d.User_ID === user.User_ID; });
    var tbody = document.getElementById('driverTasksTbody');

    if (!driverRecord) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Log masuk sebagai pemandu untuk melihat senarai tugasan.</td></tr>';
      return;
    }

    var myTasks = APP_DATA.assignments.filter(function(a) {
      return a.Driver_ID === driverRecord.Driver_ID && a.Status_Assignment === 'Aktif';
    });

    if (myTasks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Tiada tugasan aktif dijadualkan.</td></tr>';
      return;
    }

    tbody.innerHTML = myTasks.map(function(a) {
      var req = APP_DATA.requests.find(function(r) { return r.Request_ID === a.Request_ID; });
      var veh = APP_DATA.vehicles.find(function(v) { return v.Vehicle_ID === a.Vehicle_ID; });
      var applicant = req ? APP_DATA.users.find(function(u) { return u.User_ID === req.Pemohon_User_ID; }) : null;

      var waLink = (applicant && applicant.No_Telefon)
        ? '<a href="https://wa.me/' + applicant.No_Telefon + '?text=Assalammualaikum, saya pemandu KEMAS Perlis bagi penugasan #' + a.Assignment_ID + '" target="_blank" class="btn btn-sm btn-success"><i class="fa-brands fa-whatsapp me-1"></i>WhatsApp</a>'
        : '-';

      return '<tr>' +
        '<td><b>' + a.Assignment_ID + '</b></td>' +
        '<td>' + (veh ? (veh.No_Plat + ' (' + veh.Model_Kenderaan + ')') : a.Vehicle_ID) + '</td>' +
        '<td>' + (req ? req.Destinasi : '-') + '<br><small>' + (req ? (req.Tarikh_Mula + ' - ' + req.Tarikh_Tamat) : '') + '</small></td>' +
        '<td>' + (applicant ? (applicant.Nama_Penuh + '<br><small>' + applicant.No_Telefon + '</small>') : '-') + '</td>' +
        '<td>' + waLink + '</td>' +
        '</tr>';
    }).join('');
  }

  // Pemohon Form Submit
  function handleFormSubmit() {
    var startD = document.getElementById('formStartDate').value;
    var startT = document.getElementById('formStartTime').value;
    var endD = document.getElementById('formEndDate').value;
    var endT = document.getElementById('formEndTime').value;

    if (new Date(endD + 'T' + endT) <= new Date(startD + 'T' + startT)) {
      Swal.fire('Validasi Gagal', 'Tarikh/Masa tamat mestilah selepas tarikh mula.', 'warning');
      return;
    }

    var tripType = document.getElementById('formTripType').value;
    var fileInput = document.getElementById('formPdfFile');
    var file = fileInput.files[0];

    if (tripType === 'Luar Negeri' && !file) {
      Swal.fire('Dokumen Diperlukan', 'Permohonan Luar Negeri wajib memuat naik surat mesyuarat / bengkel (PDF sokongan) untuk kelulusan Pengarah.', 'warning');
      return;
    }

    var payload = {
      Pemohon_User_ID: APP_DATA.currentUser.User_ID,
      Priority_Level: document.getElementById('formPriority').value,
      Jenis_Perjalanan: tripType,
      Destinasi: document.getElementById('formDestinasi').value,
      Tujuan: document.getElementById('formTujuan').value,
      Tarikh_Mula: startD,
      Masa_Mula: startT,
      Tarikh_Tamat: endD,
      Masa_Tamat: endT,
      pdfBase64: '',
      pdfFileName: ''
    };

    Swal.fire({
      title: 'Menghantar Permohonan...',
      text: 'Menyimpan rekod ke Google Sheets dan memuat naik dokumen PDF...',
      allowOutsideClick: false,
      didOpen: function() { Swal.showLoading(); }
    });

    if (file) {
      var reader = new FileReader();
      reader.onload = function(e) {
        payload.pdfBase64 = e.target.result;
        payload.pdfFileName = file.name;
        sendRequestToServer(payload);
      };
      reader.readAsDataURL(file);
    } else {
      sendRequestToServer(payload);
    }
  }

  function sendRequestToServer(payload) {
    google.script.run
      .withSuccessHandler(function(res) {
        if (res.success) {
          Swal.fire('Berjaya!', res.message, 'success');
          document.getElementById('tripForm').reset();
          loadDashboard();
        } else {
          Swal.fire('Ralat', res.error, 'error');
        }
      })
      .withFailureHandler(function(err) {
        Swal.fire('Ralat Sistem', err.toString(), 'error');
      })
      .submitNewTripRequest(payload);
  }

  // Pengarah Review Action
  function reviewPengarah(requestId, decision) {
    Swal.fire({
      title: (decision === 'LULUS') ? 'Luluskan Perjalanan Luar Negeri?' : 'Tolak Permohonan?',
      input: 'textarea',
      inputPlaceholder: 'Masukkan catatan Pengarah KEMAS Perlis...',
      inputValue: (decision === 'LULUS') ? 'Diluluskan perjalanan luar negeri urusan rasmi KEMAS.' : 'Permohonan tidak dapat diluluskan.',
      showCancelButton: true,
      confirmButtonText: 'Sahkan Keputusan',
      cancelButtonText: 'Batal'
    }).then(function(result) {
      if (result.isConfirmed) {
        Swal.showLoading();
        google.script.run
          .withSuccessHandler(function(res) {
            if (res.success) {
              Swal.fire('Berjaya', res.message, 'success');
              loadDashboard();
            } else {
              Swal.fire('Ralat', res.error, 'error');
            }
          })
          .pengarahReviewTripRequest(requestId, decision, result.value);
      }
    });
  }

  // Open Modal Assign
  function openAssignModal(requestId) {
    currentAssignRequestId = requestId;
    var req = APP_DATA.requests.find(function(r) { return r.Request_ID === requestId; });
    if (!req) return;

    document.getElementById('assignTargetInfo').innerHTML = 
      '<strong>' + req.Request_ID + ' - ' + req.Destinasi + '</strong><br>' +
      '<small class="text-muted">' + req.Tarikh_Mula + ' (' + req.Masa_Mula + ') hingga ' + req.Tarikh_Tamat + ' (' + req.Masa_Tamat + ')</small>';

    var vehSelect = document.getElementById('selectVehicle');
    vehSelect.innerHTML = APP_DATA.vehicles.filter(function(v) { return v.Status_Kenderaan === 'Aktif'; }).map(function(v) {
      return '<option value="' + v.Vehicle_ID + '">' + v.No_Plat + ' - ' + v.Model_Kenderaan + ' (' + v.Kapasiti + ' Tempat Duduk)</option>';
    }).join('');

    var drvSelect = document.getElementById('selectDriver');
    drvSelect.innerHTML = APP_DATA.drivers.map(function(d) {
      var u = APP_DATA.users.find(function(usr) { return usr.User_ID === d.User_ID; });
      return '<option value="' + d.Driver_ID + '">' + (u ? u.Nama_Penuh : d.Driver_ID) + ' (' + d.Jenis_Pemandu + ')</option>';
    }).join('');

    var modal = new bootstrap.Modal(document.getElementById('modalAssignTrip'));
    modal.show();
  }

  function executeAssignment() {
    var payload = {
      Request_ID: currentAssignRequestId,
      Vehicle_ID: document.getElementById('selectVehicle').value,
      Driver_ID: document.getElementById('selectDriver').value,
      Catatan_Pegawai: document.getElementById('assignOfficerNotes').value
    };

    Swal.fire({
      title: 'Menugaskan Kenderaan...',
      text: 'Menjalankan semakan collision dan merekod penugasan...',
      allowOutsideClick: false,
      didOpen: function() { Swal.showLoading(); }
    });

    google.script.run
      .withSuccessHandler(function(res) {
        if (res.success) {
          bootstrap.Modal.getInstance(document.getElementById('modalAssignTrip')).hide();
          Swal.fire('Berjaya!', res.message, 'success');
          loadDashboard();
        } else {
          Swal.fire('Ralat Penugasan', res.error, 'error');
        }
      })
      .withFailureHandler(function(err) {
        Swal.fire('Ralat Sistem', err.toString(), 'error');
      })
      .processAssignment(payload);
  }
</script>
`,

  'SetupSheets.gs': `/**
 * @file SetupSheets.gs
 * @description Skrip Permulaan Pantas: Menjana Helaian 'Users', 'Vehicles', 'Drivers', 'Trip_Requests', 'Assignments'
 * Menepati 4 peranan: Pengarah, Pemohon, Pegawai_Kenderaan, Pemandu untuk KEMAS Negeri Perlis.
 * Jalankan fungsi: setupKemasPerlisDatabase() dari menu Google Apps Script.
 */

function setupKemasPerlisDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Table Users
  var sheetUsers = getOrCreateSheet(ss, 'Users');
  sheetUsers.clear();
  sheetUsers.appendRow(['User_ID', 'Email', 'Nama_Penuh', 'Jawatan', 'Bahagian', 'No_Telefon', 'Role', 'Status_Aktif']);
  sheetUsers.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#0f2d5c').setFontColor('#ffffff');

  var userRows = [
    ['USR-0001', 'pengarah.perlis@kemas.gov.my', 'YBhg. Tuan Haji Rosli bin Hashim', 'Pengarah KEMAS Negeri Perlis', 'Pejabat Pengarah (Pengurusan Tertinggi)', '60124455667', 'Pengarah', 'Yes'],
    ['USR-0002', 'ahmisuhairi@gmail.com', 'Ahmad Zuhairi bin Salleh', 'Pegawai Pengangkutan & Aset (N29)', 'Unit Pentadbiran & Kewangan', '60194567890', 'Pegawai_Kenderaan', 'Yes'],
    ['USR-0003', 'sitinoor.haliza@kemas.gov.my', 'Siti Noor Haliza binti Adnan', 'Pegawai Pendidikan Awal Kanak-kanak', 'Bahagian Pendidikan Komuniti & TABIKA', '60134889922', 'Pemohon', 'Yes'],
    ['USR-0004', 'farhana.ishak@kemas.gov.my', 'Nurul Farhana binti Ishak', 'Penolong Pegawai Latihan Komuniti', 'Bahagian Pembangunan Desa & Kemahiran', '60145678901', 'Pemohon', 'Yes'],
    ['USR-0005', 'azlan.driver@kemas.gov.my', 'Mohamad Azlan bin Idris', 'Pemandu Kenderaan (H11)', 'Unit Pengangkutan & Logistik', '60175512345', 'Pemandu', 'Yes'],
    ['USR-0006', 'khairul.anuar@kemas.gov.my', 'Khairul Anuar bin Osman', 'Pemandu Kenderaan Kanan (H14)', 'Unit Pengangkutan & Logistik', '60189901123', 'Pemandu', 'Yes'],
    ['USR-0007', 'zulkifli.daud@kemas.gov.my', 'Zulkifli bin Daud', 'Pemandu Sambilan Harian (Ganti)', 'Unit Pengangkutan & Logistik', '60112345678', 'Pemandu', 'Yes']
  ];
  sheetUsers.getRange(2, 1, userRows.length, 8).setValues(userRows);

  // 2. Table Vehicles
  var sheetVeh = getOrCreateSheet(ss, 'Vehicles');
  sheetVeh.clear();
  sheetVeh.appendRow(['Vehicle_ID', 'No_Plat', 'Model_Kenderaan', 'Kapasiti', 'Status_Kenderaan']);
  sheetVeh.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#0f2d5c').setFontColor('#ffffff');

  var vehRows = [
    ['VEH-0001', 'RFA 1234', 'Toyota Hilux 2.4 Double Cab', 5, 'Aktif'],
    ['VEH-0002', 'RFA 5678', 'Proton X70 1.8 TGDi Executive', 5, 'Aktif'],
    ['VEH-0003', 'RF 8899', 'Toyota Fortuner 2.7 SRZ', 7, 'Aktif'],
    ['VEH-0004', 'RFA 9012', 'Toyota Hiace Window Van (11 Penumpang)', 11, 'Aktif'],
    ['VEH-0005', 'RFB 3344', 'Proton Saga 1.3 Premium', 4, 'Penyelenggaraan']
  ];
  sheetVeh.getRange(2, 1, vehRows.length, 5).setValues(vehRows);

  // 3. Table Drivers
  var sheetDrv = getOrCreateSheet(ss, 'Drivers');
  sheetDrv.clear();
  sheetDrv.appendRow(['Driver_ID', 'User_ID', 'Jenis_Pemandu', 'Tarikh_Mula_Kuasa', 'Tarikh_Tamat_Kuasa', 'Tahun_Kuasa']);
  sheetDrv.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#0f2d5c').setFontColor('#ffffff');

  var drvRows = [
    ['DRV-0001', 'USR-0005', 'Tetap', '2026-01-01', '', 2026],
    ['DRV-0002', 'USR-0006', 'Tetap', '2026-01-01', '2026-12-31', 2026],
    ['DRV-0003', 'USR-0007', 'Ganti', '2026-06-01', '2026-11-20', 2026]
  ];
  sheetDrv.getRange(2, 1, drvRows.length, 6).setValues(drvRows);

  // 4. Table Trip_Requests
  var sheetReq = getOrCreateSheet(ss, 'Trip_Requests');
  sheetReq.clear();
  sheetReq.appendRow([
    'Request_ID', 'Pemohon_User_ID', 'Priority_Level', 'Jenis_Perjalanan',
    'Destinasi', 'Tujuan', 'Tarikh_Mula', 'Masa_Mula', 'Tarikh_Tamat',
    'Masa_Tamat', 'Lampiran_PDF_URL', 'Status_Permohonan', 'DateTime_Mohon', 'Catatan'
  ]);
  sheetReq.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#0f2d5c').setFontColor('#ffffff');

  var reqRows = [
    ['REQ-20261102-0001', 'USR-0003', 'Normal', 'Dalam Negeri', 'Pusat Kegiatan KEMAS Parlimen Padang Besar', 'Pemantauan persediaan audit Kurikulum Standard Prasekolah (KSPK)', '2026-11-03', '08:30', '2026-11-03', '16:30', '', 'Lulus', '2026-11-01 08:15:20', 'Telah ditugaskan Hilux RFA 1234.'],
    ['REQ-20261102-0002', 'USR-0004', 'Segera', 'Luar Negeri', 'Ibu Pejabat KEMAS Putrajaya', 'Menghantar laporan mendesak Program Kesejahteraan Komuniti Desa Negeri Perlis', '2026-11-04', '07:00', '2026-11-05', '20:00', '', 'Menunggu Kelulusan Pengarah', '2026-11-01 09:30:10', 'Surat panggilan mesyuarat dilampirkan.'],
    ['REQ-20261102-0003', 'USR-0003', 'Arahan Ketua Jabatan', 'Luar Negeri', 'Wisma Negeri Alor Setar & JKR Kedah', 'Mesyuarat Tindakan Pembangunan NCER', '2026-11-03', '09:00', '2026-11-03', '15:00', '', 'Pending Penugasan', '2026-11-01 10:00:45', 'Diluluskan oleh Pengarah KEMAS Perlis.']
  ];
  sheetReq.getRange(2, 1, reqRows.length, 14).setValues(reqRows);

  // 5. Table Assignments
  var sheetAsn = getOrCreateSheet(ss, 'Assignments');
  sheetAsn.clear();
  sheetAsn.appendRow([
    'Assignment_ID', 'Request_ID', 'Vehicle_ID', 'Driver_ID',
    'Status_Assignment', 'Catatan_Pegawai', 'PDF_Arahan_Memandu_URL', 'DateTime_Assigned'
  ]);
  sheetAsn.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#0f2d5c').setFontColor('#ffffff');

  var asnRows = [
    ['ASN-20261102-0001', 'REQ-20261102-0001', 'VEH-0001', 'DRV-0001', 'Aktif', 'Sila isi buku log kenderaan dan periksa kad Touch n Go.', '#', '2026-11-01 10:30:00']
  ];
  sheetAsn.getRange(2, 1, asnRows.length, 8).setValues(asnRows);

  SpreadsheetApp.getUi().alert('Pangkalan Data KEMAS Perlis Berjaya Dijana! Jadual Users (4 Peranan), Vehicles, Drivers, Trip_Requests & Assignments sedia.');
}

function getOrCreateSheet(ss, name) {
  var s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  return s;
}
`
};
