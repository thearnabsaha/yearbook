'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Edit3,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { YearbookEntry, YearbookProject } from '@/lib/types';
import { formatDisplayDate, parseLocalDate } from '@/lib/date-utils';

interface YearbookPhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: YearbookEntry | null;
  entries: YearbookEntry[];
  currentProject: YearbookProject;
  onEdit: (entry: YearbookEntry) => void;
  onDelete: (id: string) => void;
}

export default function YearbookPhotoViewerModal({
  isOpen,
  onClose,
  entry,
  entries,
  currentProject,
  onEdit,
  onDelete,
}: YearbookPhotoViewerModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Sync current index when entry changes
  useEffect(() => {
    if (entry && entries.length > 0) {
      const idx = entries.findIndex((e) => e.id === entry.id);
      if (idx !== -1) {
        setCurrentIdx(idx);
      }
    }
  }, [entry, entries]);

  const activeEntry = entries[currentIdx] || entry;

  // Load high-resolution photo blob
  useEffect(() => {
    if (!activeEntry) return;
    const blob = activeEntry.photoBlob || activeEntry.thumbnailBlob;
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    setPhotoUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [activeEntry]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIdx, entries.length]);

  if (!isOpen || !activeEntry) return null;

  const goToPrev = () => {
    if (currentIdx < entries.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const goToNext = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const dateFormatted = formatDisplayDate(activeEntry.date);
  const dateObj = parseLocalDate(activeEntry.date);
  const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'long' });

  const handleDownload = () => {
    if (!photoUrl) return;
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = `yearbook_${activeEntry.date}.webp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the photo for ${dateFormatted}?`)) {
      onDelete(activeEntry.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 py-3 sm:px-6 border-b border-white/10 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-serif-editorial text-base sm:text-lg font-bold text-white">
                {dateFormatted}
              </span>
              <span className="rounded-full bg-[#c27838] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                {activeEntry.aspectRatio}
              </span>
            </div>
            <span className="text-[11px] text-stone-400">
              {dayName} • {currentProject.title} ({entries.length - currentIdx} of {entries.length})
            </span>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onEdit(activeEntry);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#c27838] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#a85d26] transition-all cursor-pointer shadow-sm"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Photo</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            title="Close Viewer (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Full-Size Image Container */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-6 select-none">
        {/* Previous Day Arrow */}
        {currentIdx < entries.length - 1 && (
          <button
            type="button"
            onClick={goToPrev}
            className="absolute left-2 sm:left-6 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-[#c27838] transition-all cursor-pointer border border-white/10"
            title="Previous Day (Arrow Left)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Next Day Arrow */}
        {currentIdx > 0 && (
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-2 sm:right-6 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-[#c27838] transition-all cursor-pointer border border-white/10"
            title="Next Day (Arrow Right)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Full Image Display */}
        {photoUrl ? (
          <div className="relative flex max-h-full max-w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={`Full view for ${activeEntry.date}`}
              className="max-h-[75vh] sm:max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-stone-400">
            <Sparkles className="h-8 w-8 animate-pulse text-[#c27838]" />
            <span className="mt-2 text-xs">Loading full-res image...</span>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <footer className="flex items-center justify-between px-4 py-3 sm:px-6 border-t border-white/10 bg-black/50 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="Download full resolution WebP"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save Image</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
            title="Delete this entry"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>

        {/* Direct Edit CTA */}
        <button
          type="button"
          onClick={() => {
            onEdit(activeEntry);
            onClose();
          }}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-[#1c1917] hover:bg-[#f5f1e8] hover:text-[#c27838] transition-all cursor-pointer shadow-md"
        >
          <Edit3 className="h-4 w-4" />
          <span>Edit Alignment & Caption</span>
        </button>
      </footer>
    </div>
  );
}
