'use client';

import React, { useEffect } from 'react';
import { Database } from 'lucide-react';
import {
  checkCloudConnectionStatus,
  pullAllFromCloud,
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
  useEffect(() => {
    // Silent background sync
    checkCloudConnectionStatus();
    pullAllFromCloud();
  }, [yearbookCount]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e7e1d3] bg-[#fbf9f5]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <button
          type="button"
          onClick={onToggleLanding}
          className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
          title="Return to Home"
        >
          <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-xs ring-1 ring-[#c27838]/20 transition-transform group-hover:scale-105">
            <img
              src="/icons/icon-192.png"
              alt="Yearbook"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1c1917]">
            Year<span className="text-[#c27838]">book</span>
          </span>
        </button>

        {/* Clean, Minimal Action Buttons */}
        <div className="flex items-center gap-2">
          {onToggleLanding && (
            <button
              onClick={onToggleLanding}
              className="flex items-center rounded-xl border border-[#e7e1d3] bg-white px-3 py-1.5 text-xs font-medium text-[#1c1917] hover:bg-[#f5f1e8] hover:border-[#c27838] transition-all cursor-pointer"
            >
              <span>Home</span>
            </button>
          )}

          <button
            onClick={onOpenBackup}
            className="flex items-center gap-1.5 rounded-xl border border-[#e7e1d3] bg-white px-3 py-1.5 text-xs font-medium text-[#1c1917] hover:bg-[#f5f1e8] hover:border-[#c27838] transition-all cursor-pointer"
            title="Backup & Export Data"
          >
            <Database className="h-3.5 w-3.5 text-[#c27838]" />
            <span className="hidden sm:inline">Backup</span>
          </button>
        </div>
      </div>
    </header>
  );
}
