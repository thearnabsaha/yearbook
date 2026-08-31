import Dexie, { type Table } from 'dexie';
import {
  PhotoRecord,
  AlbumRecord,
  YearbookProject,
  YearbookEntry,
  DEFAULT_EDIT_STATE,
  DEFAULT_ALIGNMENT,
  StorageQuotaInfo,
} from './types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getLocalTodayString } from './date-utils';
import { compressImageLossless } from './compression';

export class PixelForgeDB extends Dexie {
  photos!: Table<PhotoRecord, string>;
  albums!: Table<AlbumRecord, string>;
  yearbookProjects!: Table<YearbookProject, string>;
  yearbook!: Table<YearbookEntry, string>;

  constructor() {
    super('PixelForgeDB');
    this.version(1).stores({
      photos: 'id, title, isFavorite, albumId, createdAt, updatedAt, *tags',
      albums: 'id, name, createdAt',
    });
    this.version(2).stores({
      photos: 'id, title, isFavorite, albumId, createdAt, updatedAt, *tags',
      albums: 'id, name, createdAt',
      yearbook: 'id, date, createdAt, updatedAt',
    });
    this.version(3).stores({
      photos: 'id, title, isFavorite, albumId, createdAt, updatedAt, *tags',
      albums: 'id, name, createdAt',
      yearbookProjects: 'id, title, createdAt, updatedAt',
      yearbook: 'id, yearbookId, date, createdAt, updatedAt',
    });
  }
}

export const db = new PixelForgeDB();

// Helper to create a thumbnail blob from an image blob
export async function createThumbnailBlob(
  imageBlob: Blob,
  maxDimension = 400
): Promise<{ thumbnailBlob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const originalWidth = img.width;
      const originalHeight = img.height;

      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (targetWidth > targetHeight) {
        if (targetWidth > maxDimension) {
          targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
          targetWidth = maxDimension;
        }
      } else {
        if (targetHeight > maxDimension) {
          targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
          targetHeight = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, targetWidth);
      canvas.height = Math.max(1, targetHeight);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ thumbnailBlob: imageBlob, width: originalWidth, height: originalHeight });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ thumbnailBlob: blob, width: originalWidth, height: originalHeight });
          } else {
            resolve({ thumbnailBlob: imageBlob, width: originalWidth, height: originalHeight });
          }
        },
        'image/webp',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for thumbnail generation'));
    };

    img.src = url;
  });
}

// Ingest one or more files into General Vault
export async function saveIncomingPhotos(
  files: (File | Blob)[],
  options?: { defaultCaption?: string; tags?: string[] }
): Promise<PhotoRecord[]> {
  const records: PhotoRecord[] = [];
  const now = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${i}`;
    let title = 'Untitled Photo';
    if (file instanceof File && file.name) {
      title = file.name.replace(/\.[^/.]+$/, '');
    }

    try {
      const comp = await compressImageLossless(file, { maxDimension: 2560, quality: 0.95 });
      const { thumbnailBlob, width, height } = await createThumbnailBlob(comp.compressedBlob);

      const record: PhotoRecord = {
        id,
        title,
        caption: options?.defaultCaption || '',
        tags: options?.tags || [],
        originalBlob: comp.compressedBlob,
        thumbnailBlob,
        width: comp.width || width,
        height: comp.height || height,
        fileSize: comp.compressedSize,
        mimeType: comp.mimeType,
        isFavorite: false,
        editState: JSON.parse(JSON.stringify(DEFAULT_EDIT_STATE)),
        createdAt: now + i,
        updatedAt: now + i,
      };

      await db.photos.add(record);
      records.push(record);
    } catch (err) {
      console.error(`Error saving photo ${title}:`, err);
    }
  }

  return records;
}

// Update photo record
export async function updatePhoto(
  id: string,
  updates: Partial<Omit<PhotoRecord, 'id' | 'createdAt'>>
): Promise<void> {
  await db.photos.update(id, {
    ...updates,
    updatedAt: Date.now(),
  });
}

// Save edited photo blob & state
export async function savePhotoEdits(
  id: string,
  editedBlob: Blob,
  editState: PhotoRecord['editState']
): Promise<void> {
  const comp = await compressImageLossless(editedBlob, { maxDimension: 2560, quality: 0.95 });
  const { thumbnailBlob } = await createThumbnailBlob(comp.compressedBlob);
  await db.photos.update(id, {
    editedBlob: comp.compressedBlob,
    thumbnailBlob,
    editState,
    updatedAt: Date.now(),
  });
}

// Delete single photo
export async function deletePhoto(id: string): Promise<void> {
  await db.photos.delete(id);
}

// Batch delete photos
export async function deletePhotos(ids: string[]): Promise<void> {
  await db.photos.bulkDelete(ids);
}

// Toggle favorite status
export async function toggleFavoritePhoto(id: string, currentStatus: boolean): Promise<void> {
  await db.photos.update(id, {
    isFavorite: !currentStatus,
    updatedAt: Date.now(),
  });
}

// ==========================================
// SECTION 1: MULTI-YEARBOOK PROJECT CRUD HELPERS
// ==========================================

export async function ensureDefaultYearbookProject(): Promise<YearbookProject> {
  const existing = await db.yearbookProjects.toArray();
  if (existing.length > 0) {
    return existing[0];
  }

  const defaultProject: YearbookProject = {
    id: 'yb_main',
    title: 'My Daily Photo Yearbook',
    description: 'Daily photo timelapse journey',
    aspectRatio: '9:16',
    startDate: getLocalTodayString(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.yearbookProjects.put(defaultProject);
  return defaultProject;
}

export async function createYearbookProject(
  data: Omit<YearbookProject, 'id' | 'createdAt' | 'updatedAt'>
): Promise<YearbookProject> {
  const id = `yb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();
  const project: YearbookProject = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };

  await db.yearbookProjects.add(project);
  return project;
}

export async function updateYearbookProject(
  id: string,
  updates: Partial<Omit<YearbookProject, 'id' | 'createdAt'>>
): Promise<void> {
  await db.yearbookProjects.update(id, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deleteYearbookProject(id: string): Promise<void> {
  // Delete project and all associated entries
  await db.yearbook.where('yearbookId').equals(id).delete();
  await db.yearbookProjects.delete(id);
}

export async function saveYearbookEntry(
  entry: Omit<YearbookEntry, 'thumbnailBlob' | 'createdAt' | 'updatedAt'> & {
    createdAt?: number;
    updatedAt?: number;
    thumbnailBlob?: Blob;
  }
): Promise<YearbookEntry> {
  let thumb = entry.thumbnailBlob;
  if (!thumb) {
    try {
      const res = await createThumbnailBlob(entry.photoBlob, 400);
      thumb = res.thumbnailBlob;
    } catch (e) {
      console.warn('Thumbnail generation fallback to photoBlob:', e);
      thumb = entry.photoBlob;
    }
  }

  const now = Date.now();
  const record: YearbookEntry = {
    ...entry,
    photoBlob: entry.photoBlob,
    alignment: entry.alignment || DEFAULT_ALIGNMENT,
    thumbnailBlob: thumb || entry.photoBlob,
    createdAt: entry.createdAt || now,
    updatedAt: now,
  };

  await db.yearbook.put(record);
  return record;
}

export async function getYearbookEntryByDate(
  yearbookId: string,
  dateString: string
): Promise<YearbookEntry | undefined> {
  return db.yearbook
    .where('yearbookId')
    .equals(yearbookId)
    .and((item) => item.date === dateString)
    .first();
}

export async function getPreviousDayEntry(
  yearbookId: string,
  currentDateString: string
): Promise<YearbookEntry | undefined> {
  const entries = await db.yearbook
    .where('yearbookId')
    .equals(yearbookId)
    .toArray();

  const priorEntries = entries
    .filter((e) => e.date < currentDateString)
    .sort((a, b) => b.date.localeCompare(a.date));

  return priorEntries[0];
}

export async function deleteYearbookEntry(id: string): Promise<void> {
  await db.yearbook.delete(id);
}

export async function getYearbookEntriesForProject(yearbookId: string): Promise<YearbookEntry[]> {
  const entries = await db.yearbook.where('yearbookId').equals(yearbookId).toArray();
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

// Format bytes helper
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Estimate storage quota
export async function getStorageQuotaInfo(): Promise<StorageQuotaInfo> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0;
      return {
        usage,
        quota,
        percentUsed,
        usageFormatted: formatBytes(usage),
        quotaFormatted: formatBytes(quota),
      };
    } catch {
      // Fallback
    }
  }

  return {
    usage: 0,
    quota: 0,
    percentUsed: 0,
    usageFormatted: 'Unknown',
    quotaFormatted: 'Unknown',
  };
}

// Backup entire database to a single ZIP archive
export async function exportDatabaseBackup(): Promise<void> {
  const photos = await db.photos.toArray();
  const albums = await db.albums.toArray();
  const projects = await db.yearbookProjects.toArray();
  const yearbookEntries = await db.yearbook.toArray();

  const zip = new JSZip();

  const metadata = {
    exportedAt: new Date().toISOString(),
    version: '3.0',
    albums,
    projects,
    photos: photos.map((p) => ({
      id: p.id,
      title: p.title,
      caption: p.caption,
      tags: p.tags,
      width: p.width,
      height: p.height,
      fileSize: p.fileSize,
      mimeType: p.mimeType,
      isFavorite: p.isFavorite,
      albumId: p.albumId,
      editState: p.editState,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      originalExt: p.mimeType.split('/')[1] || 'jpeg',
      hasEditedBlob: Boolean(p.editedBlob),
    })),
    yearbook: yearbookEntries.map((y) => ({
      id: y.id,
      yearbookId: y.yearbookId || 'yb_main',
      date: y.date,
      caption: y.caption,
      captionY: y.captionY,
      captionStyle: y.captionStyle,
      aspectRatio: y.aspectRatio,
      showDateStamp: y.showDateStamp,
      showDayCount: y.showDayCount,
      alignment: y.alignment || DEFAULT_ALIGNMENT,
      createdAt: y.createdAt,
      updatedAt: y.updatedAt,
    })),
  };

  zip.file('pixelforge-metadata.json', JSON.stringify(metadata, null, 2));

  const mediaFolder = zip.folder('media');
  if (mediaFolder) {
    for (const photo of photos) {
      const ext = photo.mimeType.split('/')[1] || 'jpeg';
      mediaFolder.file(`orig_${photo.id}.${ext}`, photo.originalBlob);
      if (photo.editedBlob) {
        mediaFolder.file(`edited_${photo.id}.webp`, photo.editedBlob);
      }
    }

    const yearbookFolder = zip.folder('yearbook');
    if (yearbookFolder) {
      for (const entry of yearbookEntries) {
        yearbookFolder.file(`${entry.yearbookId || 'yb_main'}_${entry.date}.webp`, entry.photoBlob);
      }
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveAs(zipBlob, `pixelforge-emerald-backup-${timestamp}.zip`);
}

// Restore database from a ZIP archive
export async function importDatabaseBackup(
  zipFile: File | Blob
): Promise<{ restoredPhotos: number; restoredAlbums: number; restoredYearbook: number }> {
  const zip = await JSZip.loadAsync(zipFile);
  const metadataFile = zip.file('pixelforge-metadata.json');

  if (!metadataFile) {
    throw new Error('Invalid backup file: pixelforge-metadata.json not found in archive.');
  }

  const metadataJson = await metadataFile.async('string');
  const metadata = JSON.parse(metadataJson);

  let restoredPhotos = 0;
  let restoredAlbums = 0;
  let restoredYearbook = 0;

  if (Array.isArray(metadata.projects)) {
    for (const proj of metadata.projects) {
      await db.yearbookProjects.put(proj);
    }
  }

  if (Array.isArray(metadata.albums)) {
    for (const album of metadata.albums) {
      await db.albums.put(album);
      restoredAlbums++;
    }
  }

  if (Array.isArray(metadata.photos)) {
    for (const meta of metadata.photos) {
      const origFileName = `media/orig_${meta.id}.${meta.originalExt || 'jpeg'}`;
      const origFileInZip = zip.file(origFileName);

      if (!origFileInZip) continue;

      const origBlob = await origFileInZip.async('blob');
      const { thumbnailBlob } = await createThumbnailBlob(origBlob);

      let editedBlob: Blob | undefined = undefined;
      if (meta.hasEditedBlob) {
        const editedFileInZip = zip.file(`media/edited_${meta.id}.webp`);
        if (editedFileInZip) {
          editedBlob = await editedFileInZip.async('blob');
        }
      }

      const record: PhotoRecord = {
        id: meta.id,
        title: meta.title || 'Untitled',
        caption: meta.caption || '',
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        originalBlob: origBlob,
        editedBlob,
        thumbnailBlob,
        width: meta.width || 800,
        height: meta.height || 600,
        fileSize: meta.fileSize || origBlob.size,
        mimeType: meta.mimeType || 'image/jpeg',
        isFavorite: Boolean(meta.isFavorite),
        albumId: meta.albumId,
        editState: meta.editState || DEFAULT_EDIT_STATE,
        createdAt: meta.createdAt || Date.now(),
        updatedAt: meta.updatedAt || Date.now(),
      };

      await db.photos.put(record);
      restoredPhotos++;
    }
  }

  if (Array.isArray(metadata.yearbook)) {
    for (const yMeta of metadata.yearbook) {
      const yFileInZip =
        zip.file(`yearbook/${yMeta.yearbookId || 'yb_main'}_${yMeta.date}.webp`) ||
        zip.file(`yearbook/${yMeta.date}.webp`);

      if (!yFileInZip) continue;

      const photoBlob = await yFileInZip.async('blob');
      const { thumbnailBlob } = await createThumbnailBlob(photoBlob);

      const yRecord: YearbookEntry = {
        id: yMeta.id || `yearbook_${yMeta.yearbookId || 'yb_main'}_${yMeta.date}`,
        yearbookId: yMeta.yearbookId || 'yb_main',
        date: yMeta.date,
        photoBlob,
        thumbnailBlob,
        caption: yMeta.caption || '',
        captionY: yMeta.captionY ?? 75,
        captionStyle: yMeta.captionStyle || 'snapchat',
        aspectRatio: yMeta.aspectRatio || '9:16',
        showDateStamp: Boolean(yMeta.showDateStamp),
        showDayCount: Boolean(yMeta.showDayCount),
        alignment: yMeta.alignment || DEFAULT_ALIGNMENT,
        createdAt: yMeta.createdAt || Date.now(),
        updatedAt: yMeta.updatedAt || Date.now(),
      };

      await db.yearbook.put(yRecord);
      restoredYearbook++;
    }
  }

  return { restoredPhotos, restoredAlbums, restoredYearbook };
}

// Batch download photos as ZIP
export async function batchDownloadZip(
  photos: PhotoRecord[],
  options?: { includeCaptionsTxt?: boolean; zipName?: string }
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const blobToSave = photo.editedBlob || photo.originalBlob;
    const safeTitle = (photo.title || `photo_${i + 1}`).replace(/[^a-z0-9_-]/gi, '_');
    const ext = photo.editedBlob ? 'webp' : photo.mimeType.split('/')[1] || 'jpg';
    const filename = `${String(i + 1).padStart(2, '0')}_${safeTitle}.${ext}`;

    zip.file(filename, blobToSave);

    if (options?.includeCaptionsTxt && photo.caption) {
      zip.file(
        `${String(i + 1).padStart(2, '0')}_${safeTitle}_caption.txt`,
        `Title: ${photo.title}\nDate: ${new Date(photo.createdAt).toLocaleString()}\nTags: ${photo.tags.join(', ')}\n\nCaption:\n${photo.caption}`
      );
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, options?.zipName || `pixelforge-export-${Date.now()}.zip`);
}
