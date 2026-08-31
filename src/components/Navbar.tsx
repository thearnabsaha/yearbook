'use client';

import React, { useEffect, useState } from 'react';
import {
  Camera,
  Upload,
  HardDrive,
  Database,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Layers,
  Film,
  Cloud,
  CloudCheck,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { getStorageQuotaInfo } from '@/lib/db';
import { StorageQuotaInfo } from '@/lib/types';
import {
  checkCloudConnectionStatus,
  subscribeToSyncStatus,
  pullAllFromCloud,
  pushAllToCloud,
  SyncStatus,
} from '@/lib/cloud-sync';

export type AppSection = 'yearbook' | 'vault';

interface NavbarProps {
  currentSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  onOpenUpload: () => void;
  onOpenCamera: () => void;
  onOpenBackup: () => void;
  photoCount: number;
  yearbookCount: number;
}

export default function Navbar({
  currentSection,
  onSelectSection,
  onOpenUpload,
  onOpenCamera,
  onOpenBackup,
  photoCount,
  yearbookCount,
}: NavbarProps) {
  const [storageInfo, setStorageInfo] = useState<StorageQuotaInfo | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: false,
    isSyncing: false,
    lastSyncedAt: null,
  });

  const refreshStorage = async () => {
    const info = await getStorageQuotaInfo();
    setStorageInfo(info);
  };

  useEffect(() => {
    refreshStorage();
    checkCloudConnectionStatus();

    const unsubscribe = subscribeToSyncStatus((st) => setSyncStatus(st));

    // Auto-pull from cloud on first load
    pullAllFromCloud();

    const interval = setInterval(() => {
      refreshStorage();
      checkCloudConnectionStatus();
    }, 15000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [photoCount, yearbookCount]);

  const handleManualSync = async () => {
    await pushAllToCloud();
    await pullAllFromCloud();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#e7e1d3] bg-[#fbf9f5]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Section Navigation */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => onSelectSection('yearbook')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#c27838] text-white shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold tracking-tight text-[#1c1917]">
                  Year<span className="text-[#c27838]">book</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f1e8] px-2 py-0.5 text-[10px] font-semibold text-[#c27838] border border-[#e7e1d3]">
                  <ShieldCheck className="h-3 w-3" />
                  PWA
                </span>

                {/* MongoDB Cloud Status Pill */}
                <button
                  type="button"
                  onClick={handleManualSync}
                  title={
                    syncStatus.connected
                      ? `Connected to MongoDB Atlas. Click to sync now.`
                      : `Offline mode (local storage). Set MONGODB_URI in Vercel to sync.`
                  }
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-all cursor-pointer ${
                    syncStatus.connected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {syncStatus.isSyncing ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                      <span>Syncing...</span>
                    </>
                  ) : syncStatus.connected ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>MongoDB Synced</span>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                      <span>Local Vault</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section Switcher Tabs */}
          <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-[#f5f1e8] p-1 border border-[#e7e1d3]">
            <button
              onClick={() => onSelectSection('yearbook')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                currentSection === 'yearbook'
                  ? 'bg-white text-[#1c1917] border border-[#e7e1d3] shadow-xs'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              <Film className="h-3.5 w-3.5 text-[#c27838]" />
              <span>1. Photo Yearbook ({yearbookCount})</span>
            </button>

            <button
              onClick={() => onSelectSection('vault')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                currentSection === 'vault'
                  ? 'bg-white text-[#1c1917] border border-[#e7e1d3] shadow-xs'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-[#c27838]" />
              <span>General Vault ({photoCount})</span>
            </button>
          </nav>
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Storage Meter */}
          {storageInfo && storageInfo.usage > 0 && (
            <button
              onClick={onOpenBackup}
              title={`Using ${storageInfo.usageFormatted} of local storage`}
              className="hidden lg:flex items-center gap-2 rounded-xl border border-[#e7e1d3] bg-white px-3 py-1.5 text-xs text-[#1c1917] hover:border-[#c27838] transition-all cursor-pointer"
            >
              <HardDrive className="h-3.5 w-3.5 text-[#c27838]" />
              <div className="flex flex-col items-start text-[11px]">
                <span className="text-[#78716c]">Storage</span>
                <span className="font-medium text-[#1c1917]">
                  {storageInfo.usageFormatted}
                </span>
              </div>
            </button>
          )}

          {/* Backup & Vault */}
          <button
            onClick={onOpenBackup}
            className="flex items-center gap-1.5 rounded-xl border border-[#e7e1d3] bg-white px-3 py-2 text-xs font-medium text-[#1c1917] hover:border-[#c27838] transition-all cursor-pointer"
            title="Backup & Restore database"
          >
            <Database className="h-4 w-4 text-[#c27838]" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          {/* Camera Snap */}
          <button
            onClick={onOpenCamera}
            className="flex items-center gap-1.5 rounded-xl border border-[#e7e1d3] bg-white px-3 py-2 text-xs font-medium text-[#1c1917] hover:border-[#c27838] transition-all cursor-pointer"
            title="Snap a photo"
          >
            <Camera className="h-4 w-4 text-[#c27838]" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 rounded-xl bg-[#c27838] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#a85d26] transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Add Photos</span>
          </button>
        </div>
      </div>

      {/* Mobile Section Switcher */}
      <div className="flex md:hidden border-t border-[#e7e1d3] bg-[#f5f1e8] px-4 py-2 gap-2">
        <button
          onClick={() => onSelectSection('yearbook')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all ${
            currentSection === 'yearbook'
              ? 'bg-white text-[#1c1917] border border-[#e7e1d3] shadow-xs'
              : 'text-[#78716c]'
          }`}
        >
          <Film className="h-3.5 w-3.5 text-[#c27838]" />
          <span>1. Yearbook ({yearbookCount})</span>
        </button>

        <button
          onClick={() => onSelectSection('vault')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all ${
            currentSection === 'vault'
              ? 'bg-white text-[#1c1917] border border-[#e7e1d3] shadow-xs'
              : 'text-[#78716c]'
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-[#c27838]" />
          <span>General Vault ({photoCount})</span>
        </button>
      </div>
    </header>
  );
}
