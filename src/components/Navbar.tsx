'use client';

import React, { useEffect, useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import {
  fullBidirectionalSync,
  subscribeToSyncStatus,
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    const unsub = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    fullBidirectionalSync();
    return unsub;
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e7e1d3]/80 bg-[#fbf9f5]/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3">
        {/* Brand */}
        <button
          type="button"
          onClick={onToggleLanding}
          className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer text-left focus:outline-none"
          title="Return to Home"
        >
          <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-xs ring-1 ring-[#c27838]/20 transition-transform group-hover:scale-105">
            <img
              src="/icons/icon-192.png"
              alt="Yearbook"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#1c1917]">
            Year<span className="text-[#c27838]">book</span>
          </span>
        </button>

        {/* Clean Modern Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleLanding && (
            <button
              type="button"
              onClick={onToggleLanding}
              className="flex items-center gap-1 rounded-full border border-[#e7e1d3] bg-white px-3 py-1.5 text-xs font-semibold text-[#1c1917] shadow-xs hover:bg-[#f5f1e8] hover:border-[#c27838] transition-all cursor-pointer"
            >
              <span>Home</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenBackup}
            className="flex items-center gap-1.5 rounded-full border border-[#e7e1d3] bg-white px-3 py-1.5 text-xs font-semibold text-[#1c1917] shadow-xs hover:bg-[#f5f1e8] hover:border-[#c27838] transition-all cursor-pointer"
            title="Backup & Multi-Device Cloud Sync"
          >
            {syncStatus?.isSyncing ? (
              <RefreshCw className="h-3.5 w-3.5 text-[#c27838] animate-spin" />
            ) : (
              <Database className="h-3.5 w-3.5 text-[#c27838]" />
            )}
            <span>Backup</span>
          </button>
        </div>
      </div>
    </header>
  );
}
