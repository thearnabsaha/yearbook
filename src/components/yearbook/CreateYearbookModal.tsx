'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Calendar,
  Layers,
  Check,
  Loader2,
} from 'lucide-react';
import { YearbookProject, YearbookAspectRatio } from '@/lib/types';
import { createYearbookProject, updateYearbookProject } from '@/lib/db';
import { getLocalTodayString } from '@/lib/date-utils';
import { syncYearbookProjectToCloud } from '@/lib/cloud-sync';

interface CreateYearbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject?: YearbookProject | null;
  onProjectSaved: (project: YearbookProject) => void;
}

export default function CreateYearbookModal({
  isOpen,
  onClose,
  editingProject,
  onProjectSaved,
}: CreateYearbookModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState<YearbookAspectRatio>('9:16');
  const [startDate, setStartDate] = useState(getLocalTodayString());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingProject) {
      setTitle(editingProject.title);
      setDescription(editingProject.description || '');
      setAspectRatio(editingProject.aspectRatio || '9:16');
      setStartDate(editingProject.startDate || getLocalTodayString());
    } else {
      setTitle('');
      setDescription('');
      setAspectRatio('9:16');
      setStartDate(getLocalTodayString());
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      if (editingProject) {
        await updateYearbookProject(editingProject.id, {
          title: title.trim(),
          description: description.trim(),
          aspectRatio,
          startDate,
        });
        const updated: YearbookProject = {
          ...editingProject,
          title: title.trim(),
          description: description.trim(),
          aspectRatio,
          startDate,
          updatedAt: Date.now(),
        };
        onProjectSaved(updated);
        syncYearbookProjectToCloud(updated);
      } else {
        const created = await createYearbookProject({
          title: title.trim(),
          description: description.trim(),
          aspectRatio,
          startDate,
        });
        onProjectSaved(created);
        syncYearbookProjectToCloud(created);
      }
      onClose();
    } catch (err) {
      console.error('Error saving yearbook project:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-md overflow-hidden rounded-3xl border border-[#e7e1d3] bg-[#fbf9f5] shadow-2xl shadow-stone-900/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e7e1d3] px-6 py-4 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5f1e8] text-[#c27838] border border-[#e7e1d3]">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-[#1c1917]">
                {editingProject ? 'Edit Yearbook' : 'Create New Yearbook'}
              </h3>
              <p className="text-[11px] text-[#78716c]">
                Setup your daily photo timelapse series
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[#78716c] hover:bg-[#f5f1e8] hover:text-[#1c1917] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6 text-xs sm:text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716c] mb-1.5">
              Yearbook Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily Face Timelapse 2026"
              className="w-full rounded-xl border border-[#e7e1d3] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#1c1917] placeholder:text-[#a8a29e] focus:border-[#c27838] focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716c] mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 1 photo every single day"
              className="w-full rounded-xl border border-[#e7e1d3] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#1c1917] placeholder:text-[#a8a29e] focus:border-[#c27838] focus:outline-none"
            />
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716c] mb-1.5">
              Default Aspect Ratio Lock
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: '9:16', label: '9:16 Story' },
                { id: '1:1', label: '1:1 Square' },
                { id: '4:5', label: '4:5 Portrait' },
                { id: '16:9', label: '16:9 Wide' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setAspectRatio(r.id as any)}
                  className={`rounded-xl border py-2 text-xs font-medium transition-all cursor-pointer ${
                    aspectRatio === r.id
                      ? 'border-[#c27838] bg-[#f5f1e8] text-[#c27838] font-bold shadow-sm'
                      : 'border-[#e7e1d3] bg-white text-[#78716c] hover:bg-[#fbf9f5]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716c] mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-[#e7e1d3] bg-white px-3.5 py-2 text-xs text-[#1c1917] focus:border-[#c27838] focus:outline-none"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c27838] py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-[#a85d26] transition-all cursor-pointer disabled:opacity-40"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Yearbook...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{editingProject ? 'Update Yearbook' : 'Create Yearbook'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
