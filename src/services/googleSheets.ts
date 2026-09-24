import { getGoogleAccessToken } from './googleAuth';

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  lastSyncTime: string | null;
  autoSync: boolean;
}

export const createAttendanceSpreadsheet = async (
  title: string = "PGT Mu'allimin - Presensi & Master Anggota"
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> => {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Silakan login dengan Google terlebih dahulu.');

  const body = {
    properties: {
      title: `${title} (${new Date().toLocaleDateString('id-ID')})`
    },
    sheets: [
      {
        properties: {
          title: 'Presensi_Resmi',
          gridProperties: { rowCount: 1000, columnCount: 12, frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Rekap_Kehadiran',
          gridProperties: { rowCount: 200, columnCount: 12, frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Master_Anggota',
          gridProperties: { rowCount: 200, columnCount: 6, frozenRowCount: 1 }
        }
      }
    ]
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const result = await response.json();
  const spreadsheetId = result.spreadsheetId;
  const spreadsheetUrl = result.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize Headers
  await initializeSheetHeaders(spreadsheetId, token);

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: result.properties?.title || title
  };
};

const initializeSheetHeaders = async (spreadsheetId: string, token: string) => {
  const headersData = [
    {
      range: "'Presensi_Resmi'!A1:K1",
      values: [
        [
          'ID Sesi',
          'Tanggal',
          'Nama Sesi / Kegiatan',
          'Waktu Submit',
          'Petugas Lapangan',
          'ID Siswa',
          'Nama Anggota',
          'Kelas',
          'Asrama',
          'Section',
          'Status Presensi',
          'Catatan Halangan'
        ]
      ]
    },
    {
      range: "'Rekap_Kehadiran'!A1:L1",
      values: [
        [
          'No',
          'ID Anggota',
          'Nama Anggota',
          'Kelas',
          'Asrama',
          'Section',
          'Total Hadir',
          'Total Izin',
          'Total Sakit',
          'Total Alfa',
          'Persentase Kehadiran',
          'Status Kedisiplinan'
        ]
      ]
    },
    {
      range: "'Master_Anggota'!A1:E1",
      values: [
        ['ID', 'Nama Anggota', 'Kelas', 'Asrama', 'Section']
      ]
    }
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headersData
    })
  });
};

export const syncAllDataToGoogleSheet = async (
  spreadsheetId: string,
  students: Array<{ id: number; name: string; kelas: string; asrama: string; section: string }>,
  submittedSessions: Array<{
    id: string;
    date: string;
    sessionName?: string;
    submittedAt?: string;
    submittedBy?: string;
    records: Array<{ studentId: number; status: string; note: string }>;
  }>,
  recapList: Array<{
    studentId: number;
    name: string;
    kelas: string;
    asrama: string;
    section: string;
    hadirCount: number;
    izinCount: number;
    sakitCount: number;
    alfaCount: number;
    percentage: number;
  }>
): Promise<{ success: boolean; rowsPresensi: number; rowsRekap: number }> => {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Akses token Google tidak aktif. Silakan login ulang.');

  // 1. Prepare Presensi Rows
  const presensiRows: any[][] = [];
  submittedSessions.forEach(session => {
    session.records.forEach(r => {
      const student = students.find(s => s.id === r.studentId);
      if (student) {
        presensiRows.push([
          session.id,
          session.date,
          session.sessionName || 'Latihan Rutin',
          session.submittedAt || new Date().toLocaleString('id-ID'),
          session.submittedBy || 'Petugas Lapangan',
          student.id,
          student.name,
          student.kelas,
          student.asrama,
          student.section,
          r.status || 'Belum Tercatat',
          r.note || ''
        ]);
      }
    });
  });

  // 2. Prepare Rekap Rows
  const rekapRows: any[][] = recapList.map((item, idx) => [
    idx + 1,
    item.studentId,
    item.name,
    item.kelas,
    item.asrama,
    item.section,
    item.hadirCount,
    item.izinCount,
    item.sakitCount,
    item.alfaCount,
    `${item.percentage}%`,
    item.percentage < 80 ? 'Perlu Evaluasi (<80%)' : 'Aman (Disiplin)'
  ]);

  // 3. Prepare Master Anggota Rows
  const anggotaRows: any[][] = students.map(s => [
    s.id,
    s.name,
    s.kelas,
    s.asrama,
    s.section
  ]);

  // First ensure sheets exist or clear and rewrite
  const clearRanges = [
    "'Presensi_Resmi'!A2:L1000",
    "'Rekap_Kehadiran'!A2:L200",
    "'Master_Anggota'!A2:E200"
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ranges: clearRanges })
  }).catch(() => null);

  // Update Headers & Values in batch
  const batchData = [
    {
      range: "'Presensi_Resmi'!A1:L1",
      values: [[
        'ID Sesi', 'Tanggal', 'Nama Sesi / Kegiatan', 'Waktu Submit', 'Petugas Lapangan',
        'ID Siswa', 'Nama Anggota', 'Kelas', 'Asrama', 'Section', 'Status Presensi', 'Catatan Halangan'
      ]]
    },
    {
      range: "'Rekap_Kehadiran'!A1:L1",
      values: [[
        'No', 'ID Anggota', 'Nama Anggota', 'Kelas', 'Asrama', 'Section',
        'Total Hadir', 'Total Izin', 'Total Sakit', 'Total Alfa', 'Persentase Kehadiran', 'Status Kedisiplinan'
      ]]
    },
    {
      range: "'Master_Anggota'!A1:E1",
      values: [['ID', 'Nama Anggota', 'Kelas', 'Asrama', 'Section']]
    }
  ];

  if (presensiRows.length > 0) {
    batchData.push({
      range: `'Presensi_Resmi'!A2:L${presensiRows.length + 1}`,
      values: presensiRows
    });
  }

  if (rekapRows.length > 0) {
    batchData.push({
      range: `'Rekap_Kehadiran'!A2:L${rekapRows.length + 1}`,
      values: rekapRows
    });
  }

  if (anggotaRows.length > 0) {
    batchData.push({
      range: `'Master_Anggota'!A2:E${anggotaRows.length + 1}`,
      values: anggotaRows
    });
  }

  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: batchData
    })
  });

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal sinkronisasi data ke Google Sheets.');
  }

  return {
    success: true,
    rowsPresensi: presensiRows.length,
    rowsRekap: rekapRows.length
  };
};

export const appendSingleSessionToSheet = async (
  spreadsheetId: string,
  session: {
    id: string;
    date: string;
    sessionName?: string;
    submittedAt?: string;
    submittedBy?: string;
    records: Array<{ studentId: number; status: string; note: string }>;
  },
  students: Array<{ id: number; name: string; kelas: string; asrama: string; section: string }>
) => {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Akses token Google tidak aktif. Silakan login Google.');

  const rows: any[][] = [];
  session.records.forEach(r => {
    const s = students.find(item => item.id === r.studentId);
    if (s) {
      rows.push([
        session.id,
        session.date,
        session.sessionName || 'Latihan Rutin',
        session.submittedAt || new Date().toLocaleString('id-ID'),
        session.submittedBy || 'Petugas Lapangan',
        s.id,
        s.name,
        s.kelas,
        s.asrama,
        s.section,
        r.status || 'Belum Tercatat',
        r.note || ''
      ]);
    }
  });

  if (rows.length === 0) return;

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Presensi_Resmi'!A:L:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: rows })
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal menambahkan sesi ke Google Sheets.');
  }
};
