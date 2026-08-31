'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  Calendar,
  Sparkles,
  Download,
  Trash2,
  Edit3,
  Maximize2,
  CheckSquare,
  Square,
  FolderArchive,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { PhotoRecord } from '@/lib/types';
import {
  deletePhotos,
  toggleFavoritePhoto,
  batchDownloadZip,
  formatBytes,
} from '@/lib/db';

interface GalleryGridProps {
  photos: PhotoRecord[];
  onOpenEditor: (photo: PhotoRecord) => void;
  onOpenLightbox: (photo: PhotoRecord) => void;
  onRefresh: () => void;
  onOpenCamera: () => void;
  onOpenUpload: () => void;
}

type SortOption = 'newest' | 'oldest' | 'title' | 'size';

// Component for rendering each photo card with thumbnail URL management
function PhotoCard({
  photo,
  isSelected,
  isSelectionMode,
  onToggleSelect,
  onOpenEditor,
  onOpenLightbox,
  onToggleFavorite,
}: {
  photo: PhotoRecord;
  isSelected: boolean;
  isSelectionMode: boolean;
  onToggleSelect: (id: string) => void;
  onOpenEditor: (photo: PhotoRecord) => void;
  onOpenLightbox: (photo: PhotoRecord) => void;
  onToggleFavorite: (photo: PhotoRecord) => void;
}) {
  const [thumbUrl, setThumbUrl] = useState<string>('');

  useEffect(() => {
    const blobToUse = photo.thumbnailBlob || photo.editedBlob || photo.originalBlob;
    const url = URL.createObjectURL(blobToUse);
    setThumbUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [photo.thumbnailBlob, photo.editedBlob, photo.originalBlob]);

  return (
    <div
      onClick={() => {
        if (isSelectionMode) {
          onToggleSelect(photo.id);
        } else {
          onOpenLightbox(photo);
        }
      }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
        isSelected
          ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500 shadow-lg shadow-indigo-600/20'
          : 'border-slate-800/80 bg-slate-900/40 hover:border-indigo-500/40 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-indigo-950/30'
      }`}
    >
      {/* Media Viewport */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-950">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={photo.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-700">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}

        {/* Top Badges (Favorite & Edited) */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1">
            {photo.editedBlob && (
              <span className="rounded-md bg-indigo-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
                Edited
              </span>
            )}
            {photo.caption && (
              <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-slate-300 backdrop-blur-xs">
                Caption
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(photo);
            }}
            className={`pointer-events-auto rounded-full p-1.5 backdrop-blur-md transition-all cursor-pointer ${
              photo.isFavorite
                ? 'bg-amber-500/90 text-black shadow-md'
                : 'bg-black/40 text-white/70 hover:bg-black/70 hover:text-white opacity-0 group-hover:opacity-100'
            }`}
            title="Favorite"
          >
            <Star
              className={`h-3.5 w-3.5 ${photo.isFavorite ? 'fill-black' : ''}`}
            />
          </button>
        </div>

        {/* Selection Checkbox (always visible when selection mode active, or on hover) */}
        {(isSelectionMode || isSelected) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(photo.id);
            }}
            className="absolute bottom-2 left-2 z-10 rounded-lg bg-black/70 p-1.5 text-white backdrop-blur-md hover:bg-indigo-600 transition-colors"
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-indigo-400" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
          </button>
        )}

        {/* Hover Quick Edit Action Overlay */}
        {!isSelectionMode && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditor(photo);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/40 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Studio</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLightbox(photo);
              }}
              className="rounded-xl border border-slate-700 bg-slate-900/80 p-1.5 text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Info Card Footer */}
      <div className="flex flex-col p-3 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-200 truncate pr-2">
            {photo.title || 'Untitled'}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            {formatBytes(photo.fileSize)}
          </span>
        </div>

        {/* Caption preview if available */}
        {photo.caption && (
          <p className="text-[11px] text-slate-400 truncate italic">
            &ldquo;{photo.caption}&rdquo;
          </p>
        )}

        {/* Tag chips */}
        {photo.tags && photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {photo.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-md bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-medium text-slate-400"
              >
                #{t}
              </span>
            ))}
            {photo.tags.length > 3 && (
              <span className="text-[9px] text-slate-500">+{photo.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GalleryGrid({
  photos,
  onOpenEditor,
  onOpenLightbox,
  onRefresh,
  onOpenCamera,
  onOpenUpload,
}: GalleryGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Batch selection
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => p.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [photos]);

  // Filter & Sort photos
  const filteredPhotos = useMemo(() => {
    return photos
      .filter((p) => {
        // Favorites filter
        if (onlyFavorites && !p.isFavorite) return false;

        // Tag filter
        if (selectedTag && !p.tags?.includes(selectedTag)) return false;

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title?.toLowerCase().includes(q);
          const matchCaption = p.caption?.toLowerCase().includes(q);
          const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchCaption && !matchTags) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'newest') return b.createdAt - a.createdAt;
        if (sortOption === 'oldest') return a.createdAt - b.createdAt;
        if (sortOption === 'title') return (a.title || '').localeCompare(b.title || '');
        if (sortOption === 'size') return b.fileSize - a.fileSize;
        return 0;
      });
  }, [photos, onlyFavorites, selectedTag, searchQuery, sortOption]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredPhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPhotos.map((p) => p.id));
    }
  };

  const handleToggleFavorite = async (photo: PhotoRecord) => {
    await toggleFavoritePhoto(photo.id, photo.isFavorite);
    onRefresh();
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      confirm(`Are you sure you want to delete ${selectedIds.length} selected photos?`)
    ) {
      setIsBatchProcessing(true);
      await deletePhotos(selectedIds);
      setSelectedIds([]);
      setIsSelectionMode(false);
      onRefresh();
      setIsBatchProcessing(false);
    }
  };

  const handleBatchDownload = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchProcessing(true);
    const targetPhotos = photos.filter((p) => selectedIds.includes(p.id));
    await batchDownloadZip(targetPhotos, {
      includeCaptionsTxt: true,
      zipName: `pixelforge-selection-${Date.now()}.zip`,
    });
    setIsBatchProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Search, Tag Filter & Sort Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by caption, tags, title..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-2 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none backdrop-blur-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Controls Right */}
        <div className="flex items-center gap-2">
          {/* Favorite filter toggle */}
          <button
            type="button"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
              onlyFavorites
                ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${onlyFavorites ? 'fill-amber-400' : ''}`} />
            <span>Favorites</span>
          </button>

          {/* Sort Dropdown */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-300 focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title A-Z</option>
            <option value="size">Largest Size</option>
          </select>

          {/* Batch Selection Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIds([]);
            }}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
              isSelectionMode
                ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Select</span>
          </button>
        </div>
      </div>

      {/* Tag Chips Carousel */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`rounded-xl px-3 py-1 text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedTag === null
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Photos ({photos.length})
          </button>

          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Batch Selection Action Bar */}
      {isSelectionMode && (
        <div className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-3 backdrop-blur-xl shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>
                {selectedIds.length === filteredPhotos.length
                  ? 'Deselect All'
                  : 'Select All'}
              </span>
            </button>

            <span className="text-xs text-slate-400">
              {selectedIds.length} of {filteredPhotos.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedIds.length === 0 || isBatchProcessing}
              onClick={handleBatchDownload}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition-all cursor-pointer"
            >
              <FolderArchive className="h-3.5 w-3.5" />
              <span>Download ZIP</span>
            </button>

            <button
              type="button"
              disabled={selectedIds.length === 0 || isBatchProcessing}
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Photos Masonry / Grid */}
      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredPhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isSelected={selectedIds.includes(photo.id)}
              isSelectionMode={isSelectionMode}
              onToggleSelect={toggleSelect}
              onOpenEditor={onOpenEditor}
              onOpenLightbox={onOpenLightbox}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/20 py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4">
            <ImageIcon className="h-8 w-8" />
          </div>
          <h3 className="font-display text-base sm:text-lg font-bold text-white">
            {photos.length === 0 ? 'No Photos in Vault Yet' : 'No Matching Photos Found'}
          </h3>
          <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-400">
            {photos.length === 0
              ? 'Import images or snap photos with your camera to begin editing and captioning.'
              : 'Try clearing your search query or tag filters.'}
          </p>

          {photos.length === 0 && (
            <div className="mt-5 flex gap-3">
              <button
                onClick={onOpenUpload}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                Upload Photos
              </button>
              <button
                onClick={onOpenCamera}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                Camera Snap
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
