'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Download,
  Trash2,
  Star,
  Tag,
  Calendar,
  Layers,
  Info,
  Check,
} from 'lucide-react';
import { PhotoRecord } from '@/lib/types';
import { deletePhoto, toggleFavoritePhoto, formatBytes, updatePhoto } from '@/lib/db';
import { saveAs } from 'file-saver';

interface LightboxModalProps {
  photos: PhotoRecord[];
  activePhotoId: string | null;
  onClose: () => void;
  onOpenEditor: (photo: PhotoRecord) => void;
  onPhotoDeleted: (id: string) => void;
  onPhotoUpdated: (updated: PhotoRecord) => void;
}

export default function LightboxModal({
  photos,
  activePhotoId,
  onClose,
  onOpenEditor,
  onPhotoDeleted,
  onPhotoUpdated,
}: LightboxModalProps) {
  const currentIndex = photos.findIndex((p) => p.id === activePhotoId);
  const currentPhoto = currentIndex !== -1 ? photos[currentIndex] : null;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editCaptionText, setEditCaptionText] = useState('');
  const [editTitleText, setEditTitleText] = useState('');

  // Load blob URL
  useEffect(() => {
    if (!currentPhoto) return;

    const blobToDisplay = currentPhoto.editedBlob || currentPhoto.originalBlob;
    const url = URL.createObjectURL(blobToDisplay);
    setImageUrl(url);
    setEditCaptionText(currentPhoto.caption || '');
    setEditTitleText(currentPhoto.title || '');

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [currentPhoto]);

  // Keyboard navigation (Arrow keys, Escape)
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevPhoto = photos[currentIndex - 1];
      onPhotoUpdated(prevPhoto);
    }
  }, [currentIndex, photos, onPhotoUpdated]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      const nextPhoto = photos[currentIndex + 1];
      onPhotoUpdated(nextPhoto);
    }
  }, [currentIndex, photos, onPhotoUpdated]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activePhotoId) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoId, currentIndex, handleNext, handlePrev, onClose]);

  if (!currentPhoto || !activePhotoId) return null;

  const handleToggleFavorite = async () => {
    await toggleFavoritePhoto(currentPhoto.id, currentPhoto.isFavorite);
    const updated = { ...currentPhoto, isFavorite: !currentPhoto.isFavorite };
    onPhotoUpdated(updated);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this photo from your local vault?')) {
      await deletePhoto(currentPhoto.id);
      onPhotoDeleted(currentPhoto.id);
      if (photos.length <= 1) {
        onClose();
      } else {
        const nextTarget = currentIndex > 0 ? photos[currentIndex - 1] : photos[1];
        onPhotoUpdated(nextTarget);
      }
    }
  };

  const handleDownload = () => {
    const blobToSave = currentPhoto.editedBlob || currentPhoto.originalBlob;
    const ext = currentPhoto.editedBlob ? 'webp' : currentPhoto.mimeType.split('/')[1] || 'jpg';
    const cleanTitle = (currentPhoto.title || 'photo').replace(/[^a-z0-9_-]/gi, '_');
    saveAs(blobToSave, `${cleanTitle}.${ext}`);
  };

  const handleSaveCaption = async () => {
    await updatePhoto(currentPhoto.id, {
      caption: editCaptionText,
      title: editTitleText,
    });
    const updated = {
      ...currentPhoto,
      caption: editCaptionText,
      title: editTitleText,
    };
    onPhotoUpdated(updated);
    setIsEditingCaption(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-xs text-slate-400">
            {currentIndex + 1} / {photos.length}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`rounded-xl border p-2 text-xs transition-colors cursor-pointer ${
              currentPhoto.isFavorite
                ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
            title="Favorite Photo"
          >
            <Star className={`h-4 w-4 ${currentPhoto.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onOpenEditor(currentPhoto)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">Edit in Studio</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Download Original / Edited"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer"
            title="Delete Photo"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Center Image Display */}
      <div className="relative flex-1 h-full w-full flex items-center justify-center p-4 sm:p-12">
        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 z-20 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-white backdrop-blur-md hover:bg-slate-800 transition-all cursor-pointer"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {currentIndex < photos.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-20 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-white backdrop-blur-md hover:bg-slate-800 transition-all cursor-pointer"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* The Photo */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={currentPhoto.title}
            className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl drop-shadow-2xl transition-transform duration-200 select-none"
          />
        )}
      </div>

      {/* Bottom Info Bar & Caption Card */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex justify-center">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/80 p-4 backdrop-blur-xl text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            {isEditingCaption ? (
              <input
                type="text"
                value={editTitleText}
                onChange={(e) => setEditTitleText(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none"
              />
            ) : (
              <h4 className="text-sm font-bold text-white font-display">
                {currentPhoto.title || 'Untitled Photo'}
              </h4>
            )}

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>
                {currentPhoto.width} × {currentPhoto.height}
              </span>
              <span>•</span>
              <span>{formatBytes(currentPhoto.fileSize)}</span>
              <span>•</span>
              <span>{new Date(currentPhoto.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Caption text */}
          {isEditingCaption ? (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={editCaptionText}
                onChange={(e) => setEditCaptionText(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                placeholder="Write caption here..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditingCaption(false)}
                  className="rounded-lg px-2.5 py-1 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCaption}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 font-semibold text-white hover:bg-indigo-500"
                >
                  <Check className="h-3 w-3" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingCaption(true)}
              className="cursor-pointer group rounded-lg hover:bg-slate-900/50 p-1 -m-1 transition-colors"
            >
              {currentPhoto.caption ? (
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {currentPhoto.caption}
                </p>
              ) : (
                <p className="text-slate-500 text-xs italic group-hover:text-slate-400">
                  + Click to add a caption or memory note...
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          {currentPhoto.tags && currentPhoto.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {currentPhoto.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/30"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
