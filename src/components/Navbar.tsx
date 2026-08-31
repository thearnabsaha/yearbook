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
}

export default function Navbar({
  onOpenBackup,
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
  }, [yearbookCount]);

  const handleManualSync = async () => {
    await pushAllToCloud();
    await pullAllFromCloud();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#e7e1d3] bg-[#fbf9f5]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
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
                    <span>Local Storage</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Storage Meter */}
          {storageInfo && storageInfo.usage > 0 && (
            <button
              onClick={onOpenBackup}
              title={`Using ${storageInfo.usageFormatted} of local storage`}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-[#e7e1d3] bg-white px-3 py-1.5 text-xs text-[#1c1917] hover:border-[#c27838] transition-all cursor-pointer"
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

          {/* Backup & Data Hub */}
          <button
            onClick={onOpenBackup}
            className="flex items-center gap-1.5 rounded-xl border border-[#e7e1d3] bg-white px-3.5 py-2 text-xs font-medium text-[#1c1917] hover:border-[#c27838] transition-all cursor-pointer"
            title="Backup & Restore database"
          >
            <Database className="h-4 w-4 text-[#c27838]" />
            <span>Backup & Export</span>
          </button>
        </div>
      </div>
    </header>
  );
}
