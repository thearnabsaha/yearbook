'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import Navbar from '@/components/Navbar';
import BackupRestoreModal from '@/components/BackupRestoreModal';
import YearbookHub from '@/components/yearbook/YearbookHub';

export default function Home() {
  const yearbookEntries = useLiveQuery(() => db.yearbook.toArray(), []) || [];
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#fbf9f5] text-[#1c1917] selection:bg-amber-500/20 selection:text-amber-900">
      {/* Top Navbar */}
      <Navbar
        yearbookCount={yearbookEntries.length}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Main Yearbook Hub */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <YearbookHub />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e7e1d3] bg-white py-6 text-center text-xs text-[#78716c]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-[#1c1917]">Yearbook PWA</span>
            <span>•</span>
            <span className="text-[#c27838] font-medium">Offline-First & MongoDB Cloud Synced</span>
          </div>
          <div>
            <span>Private, local-first storage with automatic MongoDB Atlas sync</span>
          </div>
        </div>
      </footer>

      {/* Backup & Data Management Modal */}
      <BackupRestoreModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataChanged={() => {}}
      />
    </div>
  );
}
