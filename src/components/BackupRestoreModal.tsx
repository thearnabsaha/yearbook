'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  HardDrive,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Cloud,
  CloudDownload,
  CloudUpload,
  Check,
} from 'lucide-react';
import {
  getStorageQuotaInfo,
  exportDatabaseBackup,
  importDatabaseBackup,
  db,
} from '@/lib/db';
import { StorageQuotaInfo } from '@/lib/types';
import {
  checkCloudConnectionStatus,
  pullAllFromCloud,
  pushAllToCloud,
  subscribeToSyncStatus,
  SyncStatus,
} from '@/lib/cloud-sync';
import confetti from 'canvas-confetti';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export default function BackupRestoreModal({
  isOpen,
  onClose,
  onDataChanged,
}: BackupRestoreModalProps) {
  const [storageInfo, setStorageInfo] = useState<StorageQuotaInfo | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStorage = async () => {
    const info = await getStorageQuotaInfo();
    setStorageInfo(info);
  };

  useEffect(() => {
    const unsub = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadStorage();
      checkCloudConnectionStatus();
      setImportStatus(null);
      setSyncMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePullFromCloud = async () => {
    setIsPulling(true);
    setSyncMessage('Fetching latest photos and projects from MongoDB Cloud...');
    try {
      const result = await pullAllFromCloud();
      setSyncMessage(
        `✓ Synced! Fetched ${result.syncedYearbook} photos and ${result.syncedProjects} projects from cloud.`
      );
      await loadStorage();
      onDataChanged();
      confetti({ particleCount: 40, spread: 60 });
    } catch (err: any) {
      setSyncMessage(`Error syncing from cloud: ${err.message}`);
    } finally {
      setIsPulling(false);
    }
  };

  const handlePushToCloud = async () => {
    setIsPushing(true);
    setSyncMessage('Uploading all local photos to MongoDB Atlas Cloud...');
    try {
      await pushAllToCloud();
      await checkCloudConnectionStatus();
      setSyncMessage('✓ Successfully backed up all photos to MongoDB Atlas!');
      confetti({ particleCount: 40, spread: 60 });
    } catch (err: any) {
      setSyncMessage(`Error uploading to cloud: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      await exportDatabaseBackup();
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Backup export failed:', err);
      alert('Failed to generate backup ZIP');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsImporting(true);
    setImportStatus('Restoring photos and metadata from ZIP archive...');

    try {
      const { restoredPhotos, restoredAlbums, restoredYearbook } =
        await importDatabaseBackup(file);
      setImportStatus(
        `Successfully restored ${restoredYearbook || restoredPhotos} photos and projects!`
      );
      confetti({ particleCount: 80, spread: 70 });
      await loadStorage();
      onDataChanged();
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Import failed:', error);
      setImportStatus(`Error importing backup: ${error.message}`);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleClearDatabase = async () => {
    const answer = prompt(
      'WARNING: This will delete local photos on this browser. Type "DELETE" to confirm:'
    );

    if (answer === 'DELETE') {
      setIsClearing(true);
      await db.yearbook.clear();
      await db.yearbookProjects.clear();
      await loadStorage();
      onDataChanged();
      setIsClearing(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-lg overflow-hidden rounded-3xl border border-[#e7e1d3] bg-[#fbf9f5] shadow-2xl shadow-stone-900/15 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e7e1d3] px-6 py-4 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5f1e8] text-[#c27838] border border-[#e7e1d3]">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#1c1917]">
                Multi-Device Cloud & Vault
              </h3>
              <p className="text-xs text-[#78716c]">
                Sync between Phone & Laptop or export offline archives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[#78716c] hover:bg-[#f5f1e8] hover:text-[#1c1917] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6 overflow-y-auto text-xs sm:text-sm">
          {/* MongoDB Atlas Multi-Device Cloud Sync Card */}
          <div className="rounded-2xl border border-[#c27838]/30 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1c1917]">
                <Cloud className="h-4 w-4 text-[#c27838]" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  MongoDB Multi-Device Sync
                </span>
              </div>
              {syncStatus?.connected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  Cloud Inactive
                </span>
              )}
            </div>

            <p className="text-xs text-[#78716c] leading-relaxed">
              Photos uploaded on your phone or laptop sync through MongoDB Atlas so you can view, edit, and export your timelapses anywhere.
            </p>

            {syncStatus && !syncStatus.connected && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
                <p className="font-semibold">⚠️ Cloud Sync Setup Needed on Vercel</p>
                <p className="text-[11px] text-amber-800">
                  Add <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">MONGODB_URI</code> to your Vercel Project Settings → Environment Variables to enable seamless synchronization between phone and laptop.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isPulling}
                onClick={handlePullFromCloud}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#c27838] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#a85d26] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPulling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CloudDownload className="h-3.5 w-3.5" />
                )}
                <span>Pull from Cloud</span>
              </button>

              <button
                type="button"
                disabled={isPushing}
                onClick={handlePushToCloud}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#e7e1d3] bg-[#fbf9f5] px-3 py-2.5 text-xs font-semibold text-[#1c1917] hover:bg-[#f5f1e8] hover:border-[#c27838] transition-all cursor-pointer disabled:opacity-50"
              >
                {isPushing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="h-3.5 w-3.5 text-[#c27838]" />
                )}
                <span>Push to Cloud</span>
              </button>
            </div>

            {syncMessage && (
              <div className="rounded-xl bg-[#f5f1e8] border border-[#e7e1d3] p-2.5 text-xs font-medium text-[#1c1917]">
                {syncMessage}
              </div>
            )}
          </div>

          {/* Storage Quota Card */}
          <div className="rounded-2xl border border-[#e7e1d3] bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1c1917]">
                <HardDrive className="h-4 w-4 text-[#c27838]" />
                <span className="font-semibold text-xs uppercase tracking-wider">
                  Device Local Storage
                </span>
              </div>
              <span className="font-mono text-xs text-[#c27838] font-bold">
                {storageInfo?.usageFormatted || '0 B'} used
              </span>
            </div>

            {/* Storage bar */}
            <div className="h-2 w-full rounded-full bg-[#f5f1e8] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#c27838] to-[#e69b5c] rounded-full transition-all duration-300"
                style={{ width: `${Math.max(1, storageInfo?.percentUsed || 1)}%` }}
              />
            </div>
          </div>

          {/* Offline ZIP Backup & Restore */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
              Offline ZIP Archives
            </h4>

            <div className="flex items-center justify-between rounded-2xl border border-[#e7e1d3] bg-white p-3.5">
              <div>
                <p className="text-xs font-semibold text-[#1c1917]">Export Full Archive (.ZIP)</p>
                <p className="text-[11px] text-[#78716c]">
                  All full-res photos, crop alignment, and metadata.
                </p>
              </div>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 rounded-xl border border-[#e7e1d3] bg-[#fbf9f5] px-3.5 py-2 text-xs font-semibold text-[#1c1917] hover:bg-[#f5f1e8] hover:border-[#c27838] transition-all cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 text-[#c27838]" />
                )}
                <span>{isExporting ? 'Exporting...' : 'Export ZIP'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#e7e1d3] bg-white p-3.5">
              <div>
                <p className="text-xs font-semibold text-[#1c1917]">Restore Backup (.ZIP)</p>
                <p className="text-[11px] text-[#78716c]">
                  Restore collections from an archive file.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileSelected}
                className="hidden"
              />

              <button
                type="button"
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-[#e7e1d3] bg-[#fbf9f5] px-3.5 py-2 text-xs font-semibold text-[#1c1917] hover:bg-[#f5f1e8] hover:border-[#c27838] transition-all cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-[#c27838]" />
                )}
                <span>{isImporting ? 'Restoring...' : 'Select ZIP'}</span>
              </button>
            </div>

            {importStatus && (
              <p className="text-xs text-[#c27838] font-semibold bg-[#f5f1e8] p-2.5 rounded-xl border border-[#e7e1d3] animate-in fade-in">
                {importStatus}
              </p>
            )}
          </div>

          {/* Wipe Vault Clean */}
          <div className="pt-2 border-t border-[#e7e1d3] flex items-center justify-between">
            <div className="text-[11px] text-[#78716c]">
              Need to clear this browser&apos;s cache?
            </div>
            <button
              type="button"
              disabled={isClearing}
              onClick={handleClearDatabase}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Local Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
