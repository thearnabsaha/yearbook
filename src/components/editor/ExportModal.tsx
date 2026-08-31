'use client';

import React, { useState } from 'react';
import {
  Download,
  X,
  Sparkles,
  CheckCircle2,
  FileImage,
  Layers,
  Loader2,
} from 'lucide-react';
import { PhotoRecord, EditState } from '@/lib/types';
import { renderCanvasPipeline, exportCanvasToBlob, loadImageFromBlob } from '@/lib/canvas-utils';
import { saveAs } from 'file-saver';
import confetti from 'canvas-confetti';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: PhotoRecord;
  editState: EditState;
  caption: string;
  title: string;
}

export default function ExportModal({
  isOpen,
  onClose,
  photo,
  editState,
  caption,
  title,
}: ExportModalProps) {
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState(92);
  const [scale, setScale] = useState<number>(1);
  const [burnCaption, setBurnCaption] = useState(editState.burnCaption);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Load source image
      const sourceImage = await loadImageFromBlob(photo.originalBlob);
      const canvas = document.createElement('canvas');

      const maxDim = scale < 1 ? Math.round(Math.max(photo.width, photo.height) * scale) : undefined;

      renderCanvasPipeline({
        sourceImage,
        targetCanvas: canvas,
        editState: {
          ...editState,
          burnCaption: burnCaption || editState.burnCaption,
        },
        caption: caption,
        maxDimension: maxDim,
      });

      const blob = await exportCanvasToBlob(canvas, format, quality / 100);

      const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
      const cleanTitle = (title || 'pixelforge_photo').replace(/[^a-z0-9_-]/gi, '_');
      saveAs(blob, `${cleanTitle}_edited.${ext}`);

      // Fire confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b'],
      });

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-[#0d101a] shadow-2xl shadow-indigo-950/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-white">
                Export & Download Photo
              </h3>
              <p className="text-[11px] text-slate-400">
                Render at full resolution with active edits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="space-y-5 p-6 text-xs sm:text-sm">
          {/* Format Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              File Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'image/jpeg', label: 'JPEG', desc: 'Universal & Compact' },
                { id: 'image/png', label: 'PNG', desc: 'Lossless High-Res' },
                { id: 'image/webp', label: 'WebP', desc: 'Modern & Efficient' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setFormat(fmt.id as any)}
                  className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                    format === fmt.id
                      ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <span className="font-bold text-white text-xs">{fmt.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{fmt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (for JPEG / WebP) */}
          {format !== 'image/png' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-slate-400">
                  Image Quality
                </span>
                <span className="font-mono text-indigo-400">{quality}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500"
              />
            </div>
          )}

          {/* Resolution Scale */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Resolution Scale
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1, label: '100% Full Res', desc: `${photo.width} × ${photo.height}` },
                {
                  val: 0.75,
                  label: '75% Medium',
                  desc: `${Math.round(photo.width * 0.75)} × ${Math.round(photo.height * 0.75)}`,
                },
                {
                  val: 0.5,
                  label: '50% Compact',
                  desc: `${Math.round(photo.width * 0.5)} × ${Math.round(photo.height * 0.5)}`,
                },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => setScale(s.val)}
                  className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                    scale === s.val
                      ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <span className="font-bold text-white text-xs">{s.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Burn Caption Checkbox if caption exists */}
          {caption.trim() && (
            <label className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3.5 cursor-pointer hover:bg-slate-900/70">
              <input
                type="checkbox"
                checked={burnCaption}
                onChange={(e) => setBurnCaption(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
              />
              <div className="flex-1">
                <span className="block text-xs font-semibold text-white">
                  Burn Caption onto Image
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  Renders caption directly onto the lower banner or frame of the saved file
                </span>
              </div>
            </label>
          )}

          {/* Download Action */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExport}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Rendering & Downloading...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Download Rendered Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
