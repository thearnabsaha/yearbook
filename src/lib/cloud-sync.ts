import { db } from './db';
import { YearbookProject, YearbookEntry } from './types';

// Convert Blob to Base64 data URL
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert Base64 data URL to Blob
export function base64ToBlob(base64: string): Promise<Blob> {
  return fetch(base64).then((res) => res.blob());
}

export interface SyncStatus {
  connected: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  error?: string;
  stats?: {
    projects: number;
    yearbookEntries: number;
  };
}

let syncStatusListeners: ((status: SyncStatus) => void)[] = [];
let currentSyncStatus: SyncStatus = {
  connected: false,
  isSyncing: false,
  lastSyncedAt: null,
};

function notifyStatusChange() {
  syncStatusListeners.forEach((fn) => fn({ ...currentSyncStatus }));
}

export function subscribeToSyncStatus(fn: (status: SyncStatus) => void) {
  syncStatusListeners.push(fn);
  fn({ ...currentSyncStatus });
  return () => {
    syncStatusListeners = syncStatusListeners.filter((l) => l !== fn);
  };
}

// Check MongoDB connection health
export async function checkCloudConnectionStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/status', { cache: 'no-store' });
    const data = await res.json();
    currentSyncStatus.connected = Boolean(data.connected);
    if (data.stats) {
      currentSyncStatus.stats = data.stats;
    }
    notifyStatusChange();
    return currentSyncStatus.connected;
  } catch (err: any) {
    currentSyncStatus.connected = false;
    currentSyncStatus.error = err.message;
    notifyStatusChange();
    return false;
  }
}

// Sync single Yearbook Project to Cloud
export async function syncYearbookProjectToCloud(project: YearbookProject): Promise<void> {
  try {
    await fetch('/api/yearbooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
  } catch (err) {
    console.warn('Background cloud sync warning (yearbook project):', err);
  }
}

// Delete Yearbook Project from Cloud
export async function deleteYearbookProjectFromCloud(id: string): Promise<void> {
  try {
    await fetch(`/api/yearbooks?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Background cloud delete warning (yearbook project):', err);
  }
}

// Sync single Yearbook Entry to Cloud
export async function syncYearbookEntryToCloud(entry: YearbookEntry): Promise<boolean> {
  try {
    const [photoBase64, thumbnailBase64] = await Promise.all([
      blobToBase64(entry.photoBlob),
      blobToBase64(entry.thumbnailBlob),
    ]);

    const res = await fetch('/api/yearbook-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...entry,
        photoBase64,
        thumbnailBase64,
      }),
    });

    const data = await res.json();
    if (data.success) {
      currentSyncStatus.lastSyncedAt = Date.now();
      currentSyncStatus.connected = true;
      notifyStatusChange();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Background cloud sync warning (yearbook entry):', err);
    return false;
  }
}

// Delete Yearbook Entry from Cloud
export async function deleteYearbookEntryFromCloud(id: string): Promise<void> {
  try {
    await fetch(`/api/yearbook-entries?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Background cloud delete warning (yearbook entry):', err);
  }
}

// Auto-sync on window focus or visibility change
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    pullAllFromCloud();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pullAllFromCloud();
    }
  });
}

// Pull all data from MongoDB Atlas to local IndexedDB
export async function pullAllFromCloud(): Promise<{
  syncedProjects: number;
  syncedYearbook: number;
}> {
  currentSyncStatus.isSyncing = true;
  notifyStatusChange();

  let syncedProjects = 0;
  let syncedYearbook = 0;

  try {
    // 1. Pull Projects
    const pRes = await fetch('/api/yearbooks');
    const pData = await pRes.json();
    if (pData.success && Array.isArray(pData.projects)) {
      for (const p of pData.projects) {
        const { _id, ...project } = p;
        await db.yearbookProjects.put(project);
        syncedProjects++;
      }
    }

    // 2. Pull Yearbook Entries
    const yRes = await fetch('/api/yearbook-entries');
    const yData = await yRes.json();
    if (yData.success && Array.isArray(yData.entries)) {
      for (const y of yData.entries) {
        const { _id, photoBase64, thumbnailBase64, ...entryMeta } = y;
        if (photoBase64 && thumbnailBase64) {
          const [photoBlob, thumbnailBlob] = await Promise.all([
            base64ToBlob(photoBase64),
            base64ToBlob(thumbnailBase64),
          ]);

          await db.yearbook.put({
            ...entryMeta,
            photoBlob,
            thumbnailBlob,
          });
          syncedYearbook++;
        }
      }
    }

    currentSyncStatus.lastSyncedAt = Date.now();
    currentSyncStatus.connected = true;
  } catch (err: any) {
    console.error('Pull all from cloud error:', err);
    currentSyncStatus.error = err.message;
  } finally {
    currentSyncStatus.isSyncing = false;
    notifyStatusChange();
  }

  return { syncedProjects, syncedYearbook };
}

// Push all local IndexedDB data to MongoDB Atlas
export async function pushAllToCloud(): Promise<void> {
  currentSyncStatus.isSyncing = true;
  notifyStatusChange();

  try {
    const [projects, entries] = await Promise.all([
      db.yearbookProjects.toArray(),
      db.yearbook.toArray(),
    ]);

    for (const p of projects) {
      await syncYearbookProjectToCloud(p);
    }

    for (const e of entries) {
      await syncYearbookEntryToCloud(e);
    }

    currentSyncStatus.lastSyncedAt = Date.now();
    currentSyncStatus.connected = true;
  } catch (err: any) {
    console.error('Push all to cloud error:', err);
  } finally {
    currentSyncStatus.isSyncing = false;
    notifyStatusChange();
  }
}
