'use client';

import React, { useState } from 'react';
import {
  Tag,
  Star,
  Calendar,
  FileImage,
  Layers,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { EditState, PhotoRecord, FrameStyle } from '@/lib/types';
import { formatBytes } from '@/lib/db';

interface CaptionMetadataPanelProps {
  photo: PhotoRecord;
  title: string;
  setTitle: (t: string) => void;
  caption: string;
  setCaption: (c: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  isFavorite: boolean;
  setIsFavorite: (fav: boolean) => void;
  editState: EditState;
  onChangeEditState: (updates: Partial<EditState>) => void;
}

const FRAME_OPTIONS: { id: FrameStyle; label: string; desc: string }[] = [
  { id: 'none', label: 'No Frame', desc: 'Full image borderless' },
  {
    id: 'polaroid',
    label: 'Polaroid Style',
    desc: 'Classic vintage white border with bottom caption space',
  },
  {
    id: 'minimal-white',
    label: 'Minimal White',
    desc: 'Crisp modern art gallery border',
  },
  {
    id: 'dark-film',
    label: 'Dark Cinema',
    desc: 'Cinematic dark border for dramatic contrast',
  },
  {
    id: 'caption-badge',
    label: 'Caption Bar',
    desc: 'Gradient lower-third overlay with caption text',
  },
];

const SUGGESTED_TAGS = ['nature', 'portrait', 'travel', 'memes', 'work', 'sunset', 'art', 'food'];

export default function CaptionMetadataPanel({
  photo,
  title,
  setTitle,
  caption,
  setCaption,
  tags,
  setTags,
  isFavorite,
  setIsFavorite,
  editState,
  onChangeEditState,
}: CaptionMetadataPanelProps) {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '').toLowerCase();
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const addSuggestedTag = (t: string) => {
    if (!tags.includes(t)) {
      setTags([...tags, t]);
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const insertTimestamp = () => {
    const stamp = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    setCaption(caption ? `${caption} • ${stamp}` : stamp);
  };

  return (
    <div className="space-y-6">
      {/* Title & Favorite */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Photo Title
          </label>
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
              isFavorite
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isFavorite ? 'Starred' : 'Favorite'}</span>
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Summer Vacation Snapshot"
          className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Caption Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Caption & Notes
          </label>
          <button
            type="button"
            onClick={insertTimestamp}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
          >
            <Calendar className="h-3 w-3" />
            + Date Stamp
          </button>
        </div>

        <textarea
          rows={4}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption, memory, thoughts, or metadata description..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
        />
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Supports multi-line text & search indexing</span>
          <span>{caption.length} characters</span>
        </div>
      </div>

      {/* Tags Manager */}
      <div className="space-y-2.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Tags & Categories
        </label>

        {/* Existing tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30"
            >
              #{t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="text-indigo-400 hover:text-white ml-0.5"
              >
                ×
              </button>
            </span>
          ))}

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1">
            <Tag className="h-3 w-3 text-slate-500" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag + Enter"
              className="w-28 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="flex flex-wrap items-center gap-1 pt-1">
          <span className="text-[11px] text-slate-500 mr-1">Suggestions:</span>
          {SUGGESTED_TAGS.filter((st) => !tags.includes(st)).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => addSuggestedTag(st)}
              className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
            >
              +{st}
            </button>
          ))}
        </div>
      </div>

      {/* Frame & Presentation Style */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Frame & Presentation
        </label>
        <div className="space-y-2">
          {FRAME_OPTIONS.map((f) => {
            const isSelected = editState.frame === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChangeEditState({ frame: f.id })}
                className={`flex w-full items-start justify-between rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <p className="text-xs font-semibold text-white">{f.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{f.desc}</p>
                </div>
                {isSelected && <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Technical Details Inspector */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
          <Info className="h-3.5 w-3.5 text-indigo-400" />
          <span>Technical Info</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
          <div>
            <span className="text-slate-500">Dimensions:</span> {photo.width} × {photo.height}
          </div>
          <div>
            <span className="text-slate-500">Size:</span> {formatBytes(photo.fileSize)}
          </div>
          <div>
            <span className="text-slate-500">Format:</span> {photo.mimeType.split('/')[1]?.toUpperCase() || 'JPEG'}
          </div>
          <div>
            <span className="text-slate-500">Added:</span>{' '}
            {new Date(photo.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
