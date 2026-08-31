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
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  getStorageQuotaInfo,
  exportDatabaseBackup,
  importDatabaseBackup,
  db,
} from '@/lib/db';
import { StorageQuotaInfo } from '@/lib/types';
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
    if (isOpen) {
      loadStorage();
      setImportStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      await exportDatabaseBackup();
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
      });
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
      const { restoredPhotos, restoredAlbums } = await importDatabaseBackup(file);
      setImportStatus(
        `Successfully restored ${restoredPhotos} photos and ${restoredAlbums} albums!`
      );
      confetti({
        particleCount: 80,
        spread: 70,
      });
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
      'WARNING: This will permanently delete all locally stored photos, edits, and captions. Type "DELETE" to confirm:'
    );

    if (answer === 'DELETE') {
      setIsClearing(true);
      await db.photos.clear();
      await db.albums.clear();
      await loadStorage();
      onDataChanged();
      setIsClearing(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-[#0d101a] shadow-2xl shadow-indigo-950/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-white">
                Local Vault & Backup Hub
              </h3>
              <p className="text-[11px] text-slate-400">
                100% Client-Side Privacy & Database Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6 text-xs sm:text-sm">
          {/* Storage Quota Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <HardDrive className="h-4 w-4 text-indigo-400" />
                <span className="font-semibold text-xs uppercase tracking-wider">
                  IndexedDB Storage
                </span>
              </div>
              <span className="font-mono text-xs text-indigo-300 font-medium">
                {storageInfo?.usageFormatted || '0 B'} used
              </span>
            </div>

            {/* Storage bar */}
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(1, storageInfo?.percentUsed || 1)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Your photos and edit histories are encrypted and held locally on your device in browser storage.
            </p>
          </div>

          {/* Export Full Backup */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Export Archive
            </h4>
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/30 p-3.5">
              <div>
                <p className="text-xs font-semibold text-white">Full Vault Backup (.ZIP)</p>
                <p className="text-[11px] text-slate-400">
                  Includes all full-res photos, edits, tags, and JSON metadata.
                </p>
              </div>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>{isExporting ? 'Packaging...' : 'Export ZIP'}</span>
              </button>
            </div>
          </div>

          {/* Import Restore */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Restore Archive
            </h4>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileSelected}
              className="hidden"
            />
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/30 p-3.5">
              <div>
                <p className="text-xs font-semibold text-white">Import Backup (.ZIP)</p>
                <p className="text-[11px] text-slate-400">
                  Restore previous backups or sync collections from another device.
                </p>
              </div>

              <button
                type="button"
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span>{isImporting ? 'Importing...' : 'Select ZIP'}</span>
              </button>
            </div>

            {importStatus && (
              <p className="text-xs text-indigo-300 font-medium bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-500/30 animate-in fade-in">
                {importStatus}
              </p>
            )}
          </div>

          {/* Wipe Vault Clean */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              Need to free up browser disk space?
            </div>
            <button
              type="button"
              disabled={isClearing}
              onClick={handleClearDatabase}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Wipe Local Vault</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
