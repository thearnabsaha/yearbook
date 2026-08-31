'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import Navbar from '@/components/Navbar';
import BackupRestoreModal from '@/components/BackupRestoreModal';
import YearbookHub from '@/components/yearbook/YearbookHub';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const yearbookEntries = useLiveQuery(() => db.yearbook.toArray(), []) || [];
  const [currentView, setCurrentView] = useState<'landing' | 'studio'>('landing');
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Check URL parameter on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'studio') {
        setCurrentView('studio');
      }
    }
  }, []);

  if (currentView === 'landing') {
    return (
      <LandingPage
        onEnterApp={() => setCurrentView('studio')}
        yearbookCount={yearbookEntries.length}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fbf9f5] text-[#1c1917] selection:bg-[#c27838]/20 selection:text-[#a85d26]">
      {/* Top Navbar in Studio */}
      <Navbar
        yearbookCount={yearbookEntries.length}
        onOpenBackup={() => setIsBackupOpen(true)}
        onToggleLanding={() => setCurrentView('landing')}
      />

      {/* Main Yearbook Studio */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <YearbookHub />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e7e1d3] bg-white py-6 text-center text-xs text-[#78716c]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-center gap-2">
            <span className="font-bold text-[#1c1917]">Yearbook</span>
            <span>•</span>
            <span className="text-[#78716c]">Daily Photo Growth Studio</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentView('landing')}
              className="text-[#c27838] hover:underline font-medium cursor-pointer"
            >
              Landing Page
            </button>
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
