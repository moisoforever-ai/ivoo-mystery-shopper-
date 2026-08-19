import { DriveFileItem } from '../types';
import { getAccessToken } from './firebaseAuth';

export const IVOO_DRIVE_FOLDER_ID = '1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr';

export async function fetchDriveFolderFiles(
  folderId: string = IVOO_DRIVE_FOLDER_ID
): Promise<{ files: DriveFileItem[]; folderName?: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Debes iniciar sesión con Google para acceder a los archivos de Drive.');
  }

  // 1. Fetch files in folder
  const query = `'${folderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)&pageSize=50`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Error al consultar Google Drive (${res.status})`
    );
  }

  const data = await res.json();

  // Try to get folder name
  let folderName = 'Carpeta de Evaluaciones IVOO';
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
    // Keep fallback
  }

  return {
    files: data.files || [],
    folderName,
  };
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
 * Downloads a binary file directly from Google Drive using the user's OAuth access token
 */
export async function downloadDriveFileBlob(fileId: string): Promise<Blob> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Debes iniciar sesión con Google para descargar el archivo de Drive.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData.error?.message || `Error al descargar archivo desde Google Drive (${res.status})`
    );
  }

  return await res.blob();
}

/**
 * Saves or exports a file (e.g. transcript text or JSON audit report) into Google Drive
 */
export async function saveAuditFileToDrive(
  name: string,
  content: string,
  mimeType: string = 'text/plain;charset=utf-8',
  folderId?: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Debes iniciar sesión con Google para guardar archivos en Drive.');
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
