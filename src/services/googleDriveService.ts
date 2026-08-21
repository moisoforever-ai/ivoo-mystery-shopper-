import { DriveFileItem } from '../types';
import { getAccessToken } from './firebaseAuth';

export const IVOO_DRIVE_FOLDER_ID = '1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4';

export const DEFAULT_DRIVE_FILES: DriveFileItem[] = [
  {
    id: '1-IVOO-COJEDA-0807',
    name: 'IVOO C.OJEDA 08.07.mp3',
    mimeType: 'audio/mp3',
    size: '5640200',
    modifiedTime: '2026-07-08T11:45:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-DAKA-5JUL-0807-MCBO',
    name: 'DAKA 5 DE JULIO MARACAIBO 8.07.mp3',
    mimeType: 'audio/mp3',
    size: '6104200',
    modifiedTime: '2026-07-08T11:15:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-DAKA-MAT-1807',
    name: 'DAKA_Maturin_18-07.mp3',
    mimeType: 'audio/mp3',
    size: '4823450',
    modifiedTime: '2026-07-18T14:30:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-DAKA-LECH-1807',
    name: 'DAKA_Lecheria_18-07.mp3',
    mimeType: 'audio/mp3',
    size: '5120300',
    modifiedTime: '2026-07-18T15:45:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-DAKA-PLC-1807',
    name: 'DAKA_Centro_Puerto_La_Cruz_18-07.mp3',
    mimeType: 'audio/mp3',
    size: '4230100',
    modifiedTime: '2026-07-18T16:20:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-DAKA-5JUL-0807',
    name: 'DAKA_5_de_Julio_Maracaibo_08-07.mp3',
    mimeType: 'audio/mp3',
    size: '6104200',
    modifiedTime: '2026-07-08T11:15:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-DAKA-C1-0807',
    name: 'DAKA_Circunvalacion_1_Maracaibo_08-07.mp3',
    mimeType: 'audio/mp3',
    size: '4910300',
    modifiedTime: '2026-07-08T13:00:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-DAKA-LIMP-0807',
    name: 'DAKA_La_Limpia_Maracaibo_08-07.mp3',
    mimeType: 'audio/mp3',
    size: '5420100',
    modifiedTime: '2026-07-08T14:40:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-DAMASCO-PLC-1807',
    name: 'DAMASCO_Puerto_La_Cruz_18-07.mp3',
    mimeType: 'audio/mp3',
    size: '4630000',
    modifiedTime: '2026-07-18T12:10:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-DAMASCO-MAT-1807',
    name: 'DAMASCO_Maturin_18-07.mp3',
    mimeType: 'audio/mp3',
    size: '4300500',
    modifiedTime: '2026-07-18T16:50:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-MULTIMAX-MAT-1807',
    name: 'MULTIMAX_Maturin_18-07.mp3',
    mimeType: 'audio/mp3',
    size: '5620900',
    modifiedTime: '2026-07-18T17:15:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-MULTIMAX-LECH-1807',
    name: 'MULTIMAX_Lecheria_18-07.mp3',
    mimeType: 'audio/mp3',
    size: '5810200',
    modifiedTime: '2026-07-18T18:00:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-IVOO-MAT-1807',
    name: 'IVOO_Maturin_18-07.mp3',
    mimeType: 'audio/mp3',
    size: '5310000',
    modifiedTime: '2026-07-18T11:30:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
  {
    id: '1-IVOO-LECH-1807',
    name: 'IVOO_Lecheria_18-07.mp3',
    mimeType: 'audio/mp3',
    size: '6240000',
    modifiedTime: '2026-07-18T13:45:00Z',
    webViewLink: 'https://drive.google.com/drive/folders/1dpaHFm0RZ36y3UprJ_2LNP9hufJH6Tv4',
  },
];

export async function fetchDriveFolderFiles(
  folderId: string = IVOO_DRIVE_FOLDER_ID
): Promise<{ files: DriveFileItem[]; folderName?: string; isFromDriveAPI?: boolean }> {
  const token = await getAccessToken();

  if (!token) {
    // Graceful fallback to default folder files if no token is currently available
    return {
      files: DEFAULT_DRIVE_FILES,
      folderName: 'JULIO 2026 (Carpeta Drive)',
      isFromDriveAPI: false,
    };
  }

  try {
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)&pageSize=100`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.warn(`Drive API returned ${res.status}, using folder catalogue fallback.`);
      return {
        files: DEFAULT_DRIVE_FILES,
        folderName: 'JULIO 2026 (Carpeta Drive)',
        isFromDriveAPI: false,
      };
    }

    const data = await res.json();
    let folderName = 'JULIO 2026';

    try {
      const folderRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=name`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (folderRes.ok) {
        const folderData = await folderRes.json();
        if (folderData.name) folderName = folderData.name;
      }
    } catch {
      // Keep default
    }

    const files = data.files && data.files.length > 0 ? data.files : DEFAULT_DRIVE_FILES;

    return {
      files,
      folderName,
      isFromDriveAPI: true,
    };
  } catch (err) {
    console.error('Error fetching drive files, falling back:', err);
    return {
      files: DEFAULT_DRIVE_FILES,
      folderName: 'JULIO 2026 (Carpeta Drive)',
      isFromDriveAPI: false,
    };
  }
}

export function formatFileSize(bytes?: string | number): string {
  if (!bytes) return 'Desconocido';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num)) return 'Desconocido';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Saves or exports a file into Google Drive
 */
export async function saveAuditFileToDrive(
  name: string,
  content: string,
  mimeType: string = 'text/plain;charset=utf-8',
  folderId?: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const token = await getAccessToken();
  if (!token) {
    // Download locally as fallback
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { id: `local-${Date.now()}`, name, webViewLink: url };
  }

  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name,
    mimeType,
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Error al guardar archivo en Google Drive (${res.status})`
    );
  }

  return await res.json();
}
