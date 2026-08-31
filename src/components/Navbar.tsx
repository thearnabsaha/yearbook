'use client';

import React, { useEffect, useState } from 'react';
import {
  HardDrive,
  Database,
  ShieldCheck,
  Sparkles,
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

interface NavbarProps {
  onOpenBackup: () => void;
  yearbookCount: number;
  onToggleLanding?: () => void;
}

export default function Navbar({
  onOpenBackup,
  yearbookCount,
  onToggleLanding,
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
  }, [yearbookCount]);

  const handleManualSync = async () => {
    await pushAllToCloud();
    await pullAllFromCloud();
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-[#e7e1d3] bg-[#fbf9f5]/95 backdrop-blur-md overflow-x-hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3">
        {/* Brand & Status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-xs ring-1 ring-[#c27838]/30">
            <img
              src="/icons/icon-192.png"
              alt="Yearbook Crest"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-serif-editorial text-base sm:text-lg font-bold tracking-tight text-[#1c1917] shrink-0">
              Year<span className="text-[#c27838] italic">book</span>
            </span>

            {/* PWA Badge (hidden on smallest screens) */}
            <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-[#f5f1e8] px-2 py-0.5 text-[10px] font-semibold text-[#c27838] border border-[#e7e1d3]">
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
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-all cursor-pointer truncate max-w-[130px] sm:max-w-none ${
                syncStatus.connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              {syncStatus.isSyncing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-emerald-600 shrink-0" />
                  <span className="hidden sm:inline">Syncing...</span>
                </>
              ) : syncStatus.connected ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="hidden sm:inline">MongoDB Synced</span>
                  <span className="sm:hidden">Synced</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-400 shrink-0" />
                  <span className="hidden sm:inline">Local Storage</span>
                  <span className="sm:hidden">Local</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Storage Meter (Desktop only) */}
          {storageInfo && storageInfo.usage > 0 && (
            <button
              onClick={onOpenBackup}
              title={`Using ${storageInfo.usageFormatted} of local storage`}
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-[#e7e1d3] bg-white px-2.5 py-1 text-xs text-[#1c1917] hover:border-[#c27838] transition-all cursor-pointer"
            >
              <HardDrive className="h-3.5 w-3.5 text-[#c27838]" />
              <span className="text-[11px] font-medium text-[#1c1917]">
                {storageInfo.usageFormatted}
              </span>
            </button>
          )}

          {/* Overview / Landing Button */}
          {onToggleLanding && (
            <button
              onClick={onToggleLanding}
              className="flex items-center rounded-xl border border-[#e7e1d3] bg-[#f5f1e8] px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium text-[#1c1917] hover:bg-[#e7e1d3] transition-all cursor-pointer shrink-0"
              title="View Landing Page Overview"
            >
              <span>Home</span>
            </button>
          )}

          {/* Backup & Data Hub */}
          <button
            onClick={onOpenBackup}
            className="flex items-center gap-1.5 rounded-xl border border-[#e7e1d3] bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium text-[#1c1917] hover:border-[#c27838] transition-all cursor-pointer shrink-0"
            title="Backup & Restore database"
          >
            <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#c27838]" />
            <span className="hidden sm:inline">Backup & Export</span>
            <span className="sm:hidden">Backup</span>
          </button>
        </div>
      </div>
    </header>
  );
}
