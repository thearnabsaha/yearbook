'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveIncomingPhotos } from '@/lib/db';
import { PhotoRecord } from '@/lib/types';
import Navbar, { AppSection } from '@/components/Navbar';
import PhotoDropzone from '@/components/PhotoDropzone';
import GalleryGrid from '@/components/GalleryGrid';
import BackupRestoreModal from '@/components/BackupRestoreModal';
import LightboxModal from '@/components/LightboxModal';
import PhotoEditorStudio from '@/components/editor/PhotoEditorStudio';
import YearbookHub from '@/components/yearbook/YearbookHub';

export default function Home() {
  const [currentSection, setCurrentSection] = useState<AppSection>('yearbook');

  // Live Dexie queries
  const photos = useLiveQuery(() => db.photos.orderBy('createdAt').reverse().toArray(), []) || [];
  const yearbookEntries = useLiveQuery(() => db.yearbook.toArray(), []) || [];

  // Active UI Views
  const [editingPhoto, setEditingPhoto] = useState<PhotoRecord | null>(null);
  const [lightboxPhotoId, setLightboxPhotoId] = useState<string | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isDropzoneExpanded, setIsDropzoneExpanded] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check URL parameters for PWA shortcuts on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      if (action === 'upload') {
        fileInputRef.current?.click();
      }
    }
  }, []);

  const handleOpenEditor = (photo: PhotoRecord) => {
    setLightboxPhotoId(null);
    setEditingPhoto(photo);
  };

  const handleSavedFromStudio = (updatedPhoto: PhotoRecord) => {
    setEditingPhoto(updatedPhoto);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await saveIncomingPhotos(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  if (editingPhoto) {
    return (
      <PhotoEditorStudio
        photo={editingPhoto}
        onBack={() => setEditingPhoto(null)}
        onSaved={handleSavedFromStudio}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fbf9f5] text-[#1c1917] selection:bg-amber-500/20 selection:text-amber-900">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Top Navbar */}
      <Navbar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        photoCount={photos.length}
        yearbookCount={yearbookEntries.length}
        onOpenUpload={() => fileInputRef.current?.click()}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 space-y-8">
        {/* SECTION 1: PHOTO YEARBOOK */}
        {currentSection === 'yearbook' && (
          <YearbookHub onOpenVault={() => setCurrentSection('vault')} />
        )}

        {/* GENERAL VAULT & GALLERY */}
        {currentSection === 'vault' && (
          <>
            {/* Intake Dropzone Hero Section */}
            <section>
              <PhotoDropzone
                onPhotosAdded={() => {}}
                isCompact={photos.length > 0 && !isDropzoneExpanded}
              />
              {photos.length > 0 && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => setIsDropzoneExpanded(!isDropzoneExpanded)}
                    className="text-[11px] text-[#78716c] hover:text-[#1c1917] font-medium cursor-pointer"
                  >
                    {isDropzoneExpanded ? 'Minimize Intake Dropzone' : 'Expand Dropzone Area'}
                  </button>
                </div>
              )}
            </section>

            {/* Gallery Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1c1917]">
                    General Photo Vault
                  </h2>
                  <span className="rounded-full bg-[#f5f1e8] border border-[#e7e1d3] px-2.5 py-0.5 text-xs font-semibold text-[#78716c]">
                    {photos.length}
                  </span>
                </div>
              </div>

              <GalleryGrid
                photos={photos}
                onOpenEditor={handleOpenEditor}
                onOpenLightbox={(p) => setLightboxPhotoId(p.id)}
                onRefresh={() => {}}
                onOpenUpload={() => fileInputRef.current?.click()}
              />
            </section>
          </>
        )}
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

      {/* Modals */}
      <BackupRestoreModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataChanged={() => {}}
      />

      <LightboxModal
        photos={photos}
        activePhotoId={lightboxPhotoId}
        onClose={() => setLightboxPhotoId(null)}
        onOpenEditor={handleOpenEditor}
        onPhotoDeleted={(id) => {
          if (lightboxPhotoId === id) setLightboxPhotoId(null);
        }}
        onPhotoUpdated={(updated) => {
          setLightboxPhotoId(updated.id);
        }}
      />
    </div>
  );
}
