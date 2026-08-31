'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  Calendar,
  Sparkles,
  Check,
  RotateCw,
  MoveVertical,
  Crosshair,
  Loader2,
  Eye,
  Sliders,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Layers,
  RefreshCcw,
  Wand2,
} from 'lucide-react';
import {
  YearbookEntry,
  YearbookProject,
  YearbookAspectRatio,
  YearbookAlignment,
  DEFAULT_ALIGNMENT,
  DEFAULT_FILTERS,
  DEFAULT_CROP,
} from '@/lib/types';
import {
  saveYearbookEntry,
  getYearbookEntryByDate,
  getPreviousDayEntry,
} from '@/lib/db';
import { loadImageFromBlob } from '@/lib/canvas-utils';
import { detectAndAutoAlignFace } from '@/lib/face-align';
import { getLocalTodayString, formatDisplayDate } from '@/lib/date-utils';
import { syncYearbookEntryToCloud, syncYearbookProjectToCloud } from '@/lib/cloud-sync';

interface YearbookPhotoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: YearbookProject;
  initialDate?: string;
  existingEntry?: YearbookEntry | null;
  onEntrySaved: (entry: YearbookEntry) => void;
}

export default function YearbookPhotoEditorModal({
  isOpen,
  onClose,
  currentProject,
  initialDate,
  existingEntry,
  onEntrySaved,
}: YearbookPhotoEditorModalProps) {
  const todayStr = getLocalTodayString();
  const [selectedDate, setSelectedDate] = useState(existingEntry?.date || initialDate || todayStr);

  const [sourceBlob, setSourceBlob] = useState<Blob | null>(existingEntry?.photoBlob || null);
  const [previewImg, setPreviewImg] = useState<HTMLImageElement | null>(null);

  // Ghost / Onion Skinning from Previous Day
  const [ghostImg, setGhostImg] = useState<HTMLImageElement | null>(null);
  const [ghostOpacity, setGhostOpacity] = useState<number>(0.35);
  const [showGhost, setShowGhost] = useState(false);

  // Alignment & Scaling Transformation
  const [alignment, setAlignment] = useState<YearbookAlignment>(
    existingEntry?.alignment || DEFAULT_ALIGNMENT
  );
  const [isAutoAligning, setIsAutoAligning] = useState(false);
  const [autoAlignSuccess, setAutoAlignSuccess] = useState(false);
  const [showFaceGuide, setShowFaceGuide] = useState(true);

  // Caption & Snapchat styling
  const [caption, setCaption] = useState(existingEntry?.caption || '');
  const [captionY, setCaptionY] = useState(existingEntry?.captionY ?? 70);
  const [captionStyle, setCaptionStyle] = useState<'snapchat' | 'minimal' | 'badge' | 'neon'>(
    existingEntry?.captionStyle || 'snapchat'
  );
  const [showDateStamp, setShowDateStamp] = useState(existingEntry?.showDateStamp ?? true);
  const [showDayCount, setShowDayCount] = useState(existingEntry?.showDayCount ?? false);

  const [aspectRatio, setAspectRatio] = useState<YearbookAspectRatio>(
    existingEntry?.aspectRatio || currentProject?.aspectRatio || '9:16'
  );

  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // On initial mount, load existing photo if present, and load ghost image
  useEffect(() => {
    let isCancelled = false;

    if (existingEntry?.photoBlob) {
      loadImageFromBlob(existingEntry.photoBlob).then((img) => {
        if (!isCancelled) setPreviewImg(img);
      });
    } else {
      const targetDate = initialDate || todayStr;
      if (currentProject?.id) {
        getYearbookEntryByDate(currentProject.id, targetDate).then((entry) => {
          if (!isCancelled && entry?.photoBlob) {
            setSourceBlob(entry.photoBlob);
            setCaption(entry.caption || '');
            setCaptionY(entry.captionY ?? 70);
            setCaptionStyle(entry.captionStyle || 'snapchat');
            setAspectRatio(entry.aspectRatio || currentProject.aspectRatio || '9:16');
            setShowDateStamp(entry.showDateStamp ?? true);
            setShowDayCount(entry.showDayCount ?? false);
            setAlignment(entry.alignment || DEFAULT_ALIGNMENT);
            loadImageFromBlob(entry.photoBlob).then((img) => {
              if (!isCancelled) setPreviewImg(img);
            });
          }
        });
      }
    }

    if (currentProject?.id) {
      getPreviousDayEntry(currentProject.id, initialDate || todayStr).then((prevEntry) => {
        if (!isCancelled && prevEntry?.photoBlob) {
          loadImageFromBlob(prevEntry.photoBlob).then((gImg) => {
            if (!isCancelled) setGhostImg(gImg);
          });
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSourceBlob(file);
      e.target.value = '';

      try {
        const img = await loadImageFromBlob(file);
        setPreviewImg(img);
        setIsAutoAligning(true);
        const autoAligned = await detectAndAutoAlignFace(img, aspectRatio);
        setAlignment(autoAligned);
        setAutoAlignSuccess(true);
        setTimeout(() => setAutoAlignSuccess(false), 2500);
      } catch (err) {
        console.error('Auto alignment error on upload:', err);
      } finally {
        setIsAutoAligning(false);
      }
    }
  };

  const handleManualAutoAlign = async () => {
    if (!previewImg) return;
    setIsAutoAligning(true);
    try {
      const autoAligned = await detectAndAutoAlignFace(previewImg, aspectRatio);
      setAlignment(autoAligned);
      setAutoAlignSuccess(true);
      setTimeout(() => setAutoAlignSuccess(false), 2500);
    } catch (err) {
      console.error('Auto align error:', err);
    } finally {
      setIsAutoAligning(false);
    }
  };

  // Nudge Helpers
  const nudge = (dx: number, dy: number) => {
    setAlignment((prev) => ({
      ...prev,
      offsetX: Math.max(-50, Math.min(50, prev.offsetX + dx)),
      offsetY: Math.max(-50, Math.min(50, prev.offsetY + dy)),
    }));
  };

  const adjustScale = (delta: number) => {
    setAlignment((prev) => ({
      ...prev,
      scale: Math.max(0.6, Math.min(3.0, parseFloat((prev.scale + delta).toFixed(2)))),
    }));
  };

  const rotatePhoto = () => {
    setAlignment((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  // Render Canvas with Auto-Alignment and Caption Overlays
  useEffect(() => {
    if (!previewCanvasRef.current || !previewImg) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let targetW = 1080;
    let targetH = 1920;

    if (aspectRatio === '16:9') {
      targetW = 1920;
      targetH = 1080;
    } else if (aspectRatio === '1:1') {
      targetW = 1080;
      targetH = 1080;
    } else if (aspectRatio === '4:5') {
      targetW = 1080;
      targetH = 1350;
    } else if (aspectRatio === 'free') {
      targetW = previewImg.naturalWidth || 1080;
      targetH = previewImg.naturalHeight || 1920;
    }

    canvas.width = targetW;
    canvas.height = targetH;
    ctx.clearRect(0, 0, targetW, targetH);

    // 1. Draw Onion Skin Ghost Overlay if active
    if (showGhost && ghostImg) {
      ctx.save();
      ctx.globalAlpha = ghostOpacity;
      const gScale = Math.min(targetW / ghostImg.naturalWidth, targetH / ghostImg.naturalHeight);
      const gW = ghostImg.naturalWidth * gScale;
      const gH = ghostImg.naturalHeight * gScale;
      ctx.drawImage(ghostImg, (targetW - gW) / 2, (targetH - gH) / 2, gW, gH);
      ctx.restore();
    }

    // 2. Draw Main Image with Auto-Alignment, Offsets & Scale
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const centerX = targetW / 2 + (alignment.offsetX / 100) * targetW;
    const centerY = targetH / 2 + (alignment.offsetY / 100) * targetH;

    ctx.translate(centerX, centerY);
    ctx.rotate((alignment.rotation * Math.PI) / 180);
    ctx.scale(alignment.scale, alignment.scale);

    const isRotated = alignment.rotation === 90 || alignment.rotation === 270;
    const imgW = isRotated ? previewImg.naturalHeight : previewImg.naturalWidth;
    const imgH = isRotated ? previewImg.naturalWidth : previewImg.naturalHeight;

    const baseScale = Math.max(targetW / imgW, targetH / imgH);
    const drawW = imgW * baseScale;
    const drawH = imgH * baseScale;

    ctx.drawImage(previewImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // 3. Render Top Date / Day Badge if enabled
    const dateFormatted = formatDisplayDate(selectedDate);

    if (showDateStamp || showDayCount) {
      ctx.save();
      const badgeY = targetH * 0.04;
      const badgePad = targetW * 0.025;

      ctx.fillStyle = 'rgba(28, 25, 23, 0.75)';
      ctx.beginPath();
      const badgeText = `${showDayCount ? `Day ${selectedDate.slice(5)} • ` : ''}${
        showDateStamp ? dateFormatted.toUpperCase() : ''
      }`;
      const fontSize = Math.round(targetW * 0.028);
      ctx.font = `600 ${fontSize}px sans-serif`;

      const textWidth = ctx.measureText(badgeText).width;
      const bW = textWidth + badgePad * 3;
      const bH = fontSize * 1.8;
      const bX = (targetW - bW) / 2;

      ctx.roundRect
        ? ctx.roundRect(bX, badgeY, bW, bH, bH / 2)
        : ctx.rect(bX, badgeY, bW, bH);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, targetW / 2, badgeY + bH / 2);
      ctx.restore();
    }

    // 4. Render Snapchat-Style Caption Banner
    if (caption.trim()) {
      ctx.save();
      const capPosY = (captionY / 100) * targetH;
      const capFontSize = Math.max(16, Math.round(targetW * 0.038));

      ctx.font = `600 ${capFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textBaseline = 'middle';

      if (captionStyle === 'snapchat') {
        const bannerHeight = capFontSize * 2.2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, capPosY - bannerHeight / 2, targetW, bannerHeight);

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;
        ctx.fillText(caption, targetW / 2, capPosY);
      } else if (captionStyle === 'minimal') {
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(caption, targetW / 2, capPosY);
      } else if (captionStyle === 'badge') {
        const textWidth = ctx.measureText(caption).width;
        const padX = capFontSize * 0.8;
        const padY = capFontSize * 0.4;
        const bW = textWidth + padX * 2;
        const bH = capFontSize + padY * 2;
        const bX = (targetW - bW) / 2;
        const bY = capPosY - bH / 2;

        ctx.fillStyle = 'rgba(194, 120, 56, 0.9)';
        ctx.beginPath();
        ctx.roundRect
          ? ctx.roundRect(bX, bY, bW, bH, 12)
          : ctx.rect(bX, bY, bW, bH);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(caption, targetW / 2, capPosY);
      } else if (captionStyle === 'neon') {
        ctx.fillStyle = '#C27838';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(194, 120, 56, 0.8)';
        ctx.shadowBlur = 16;
        ctx.fillText(caption, targetW / 2, capPosY);
      }

      ctx.restore();
    }
  }, [
    previewImg,
    aspectRatio,
    alignment,
    caption,
    captionY,
    captionStyle,
    selectedDate,
    showDateStamp,
    showDayCount,
    showGhost,
    ghostImg,
    ghostOpacity,
  ]);

  const handleSave = async () => {
    if (!previewCanvasRef.current || !sourceBlob) {
      alert('Please add or select a photo first.');
      return;
    }

    setIsSaving(true);
    try {
      const canvas = previewCanvasRef.current;

      const getBlobPromise = (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          try {
            canvas.toBlob(
              (b) => {
                if (b) {
                  resolve(b);
                } else {
                  // Fallback to jpeg
                  canvas.toBlob(
                    (b2) => {
                      if (b2) resolve(b2);
                      else reject(new Error('Failed to generate image blob from canvas'));
                    },
                    'image/jpeg',
                    0.95
                  );
                }
              },
              'image/webp',
              0.98
            );
          } catch (e) {
            reject(e);
          }
        });
      };

      const renderedBlob = await getBlobPromise();
      const pId = currentProject?.id || 'yb_main';
      const entryId = `yearbook_${pId}_${selectedDate}`;

      const record = await saveYearbookEntry({
        id: entryId,
        yearbookId: pId,
        date: selectedDate,
        photoBlob: renderedBlob,
        caption,
        captionY,
        captionStyle,
        aspectRatio,
        showDateStamp,
        showDayCount,
        alignment,
        crop: DEFAULT_CROP,
        filters: DEFAULT_FILTERS,
        preset: 'none',
      });

      // 1. Immediately update UI and close modal
      onEntrySaved(record);
      setIsSaving(false);
      onClose();

      // 2. Background sync to MongoDB Atlas
      if (currentProject) {
        syncYearbookProjectToCloud(currentProject);
      }
      syncYearbookEntryToCloud(record);
    } catch (err: any) {
      console.error('Error saving yearbook entry:', err);
      alert('Error saving photo: ' + (err.message || 'Unknown error'));
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative flex flex-col w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-3xl border border-[#e7e1d3] bg-[#fbf9f5] shadow-2xl shadow-stone-900/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e7e1d3] px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5f1e8] text-[#c27838] border border-[#e7e1d3]">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-[#1c1917]">
                {currentProject?.title || 'Daily Photo'}
              </h3>
              <p className="text-[11px] text-[#78716c]">
                Auto-aligned eyes & face • Snapchat overlay captions
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

        {/* Workspace: Split View */}
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Left: Viewport / Canvas */}
          <div className="relative flex flex-1 flex-col items-center justify-center bg-[#1c1917] p-3 sm:p-4 overflow-hidden min-h-[260px] sm:min-h-[420px]">
            {sourceBlob ? (
              <>
                {/* Top Viewport Toolbar */}
                <div className="z-20 mb-2 flex flex-wrap items-center justify-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md p-1 border border-white/10">
                  {(['9:16', '1:1', '4:5', 'free'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-[#c27838] text-white shadow-xs'
                          : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      {ratio === 'free' ? 'Original' : ratio}
                    </button>
                  ))}

                  <div className="h-3 w-px bg-white/20 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => setAlignment((prev) => ({ ...prev, scale: 0.8, offsetX: 0, offsetY: 0 }))}
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Fit Whole Photo
                  </button>
                </div>

                {/* Canvas Viewport */}
                <div className="relative flex items-center justify-center max-h-[40vh] sm:max-h-[65vh] max-w-full">
                  <canvas
                    ref={previewCanvasRef}
                    className="max-h-[38vh] sm:max-h-[65vh] max-w-full rounded-xl shadow-2xl object-contain border border-stone-800"
                  />

                  {/* Face & Eye Alignment Crosshair Guide */}
                  {showFaceGuide && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="absolute top-[38%] left-0 right-0 border-t-2 border-dashed border-[#c27838]" />
                      <span className="absolute top-[38%] left-3 -translate-y-5 text-[9px] font-mono text-white font-bold bg-[#c27838] px-1.5 py-0.5 rounded shadow">
                        EYE ALIGNMENT LEVEL
                      </span>

                      <div className="absolute top-0 bottom-0 left-1/2 border-l-2 border-dashed border-[#c27838]/80" />
                      <div className="h-24 w-24 rounded-full border-2 border-dashed border-[#c27838]/80" />
                    </div>
                  )}

                  {/* Auto-Align Success Toast */}
                  {autoAlignSuccess && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-[#c27838] px-3 py-1 text-[11px] font-medium text-white shadow-lg animate-in fade-in">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Eyes & Face Auto-Aligned</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Empty Intake */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center p-8 text-center cursor-pointer rounded-2xl border-2 border-dashed border-stone-700 hover:border-[#c27838] transition-all max-w-sm"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#292524] text-[#c27838] mb-3 border border-stone-700 group-hover:scale-105 transition-transform">
                  <Upload className="h-8 w-8" />
                </div>
                <h4 className="font-display text-sm font-bold text-white">
                  Upload Photo for {selectedDate}
                </h4>
                <p className="text-xs text-stone-400 mt-1 max-w-xs">
                  Select a photo from your phone, laptop, or iPad. Eyes will be automatically detected and aligned.
                </p>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 rounded-xl bg-[#c27838] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#a85d26] transition-all cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Choose Photo from Device</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Controls & Auto-Alignment Suite */}
          <div className="flex flex-col w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-[#e7e1d3] bg-[#fbf9f5] p-5 space-y-5 overflow-y-auto max-h-[50vh] lg:max-h-full">
            {/* 1. Date Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716c]">
                Log Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 rounded-xl border border-[#e7e1d3] bg-white px-3 py-2 text-xs text-[#1c1917] focus:border-[#c27838] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="rounded-xl border border-[#e7e1d3] bg-[#f5f1e8] px-3 py-2 text-xs font-medium text-[#1c1917] hover:bg-[#eae3d5]"
                >
                  Today
                </button>
              </div>
            </div>

            {/* 2. Automatic Eye Alignment Box */}
            {sourceBlob && (
              <div className="space-y-3 rounded-2xl border border-[#e7e1d3] bg-white p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
                    <Crosshair className="h-3.5 w-3.5 text-[#c27838]" />
                    Auto-Alignment (Eyes Locked)
                  </span>

                  <button
                    type="button"
                    disabled={isAutoAligning}
                    onClick={handleManualAutoAlign}
                    className="flex items-center gap-1 text-[11px] text-[#c27838] hover:text-[#a85d26] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isAutoAligning ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                    <span>Auto-Align Eyes</span>
                  </button>
                </div>

                {/* Nudge D-Pad & Zoom Controls */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="grid grid-cols-3 gap-1 w-28">
                    <div />
                    <button
                      type="button"
                      onClick={() => nudge(0, -3)}
                      className="flex items-center justify-center rounded-lg border border-[#e7e1d3] bg-[#fbf9f5] p-1.5 text-[#1c1917] hover:bg-[#f5f1e8] active:scale-95 cursor-pointer"
                      title="Nudge Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <div />

                    <button
                      type="button"
                      onClick={() => nudge(-3, 0)}
                      className="flex items-center justify-center rounded-lg border border-[#e7e1d3] bg-[#fbf9f5] p-1.5 text-[#1c1917] hover:bg-[#f5f1e8] active:scale-95 cursor-pointer"
                      title="Nudge Left"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={rotatePhoto}
                      className="flex items-center justify-center rounded-lg border border-[#e7e1d3] bg-[#fbf9f5] p-1.5 text-[#c27838] hover:bg-[#f5f1e8] active:scale-95 cursor-pointer"
                      title="Rotate 90°"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => nudge(3, 0)}
                      className="flex items-center justify-center rounded-lg border border-[#e7e1d3] bg-[#fbf9f5] p-1.5 text-[#1c1917] hover:bg-[#f5f1e8] active:scale-95 cursor-pointer"
                      title="Nudge Right"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <div />
                    <button
                      type="button"
                      onClick={() => nudge(0, 3)}
                      className="flex items-center justify-center rounded-lg border border-[#e7e1d3] bg-[#fbf9f5] p-1.5 text-[#1c1917] hover:bg-[#f5f1e8] active:scale-95 cursor-pointer"
                      title="Nudge Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <div />
                  </div>

                  {/* Zoom Scale Slider */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#78716c]">
                      <span>Zoom Scale</span>
                      <span className="font-mono">{alignment.scale}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="2.5"
                      step="0.05"
                      value={alignment.scale}
                      onChange={(e) =>
                        setAlignment({ ...alignment, scale: parseFloat(e.target.value) })
                      }
                      className="w-full accent-[#c27838]"
                    />
                    <div className="flex justify-between text-[10px] text-[#a8a29e]">
                      <span>Zoom Out</span>
                      <span>Zoom In</span>
                    </div>
                  </div>
                </div>

                {/* Onion Skin Ghost Reference Toggle */}
                {ghostImg && (
                  <div className="space-y-1.5 pt-2 border-t border-[#e7e1d3]">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1c1917] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showGhost}
                          onChange={(e) => setShowGhost(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-[#e7e1d3] text-[#c27838] accent-[#c27838]"
                        />
                        <span>Onion-Skin (Previous Day Ghost)</span>
                      </label>
                      <span className="text-[10px] font-mono text-[#78716c]">
                        {Math.round(ghostOpacity * 100)}%
                      </span>
                    </div>

                    {showGhost && (
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={ghostOpacity}
                        onChange={(e) => setGhostOpacity(parseFloat(e.target.value))}
                        className="w-full accent-[#c27838]"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Snapchat Caption Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716c]">
                Snapchat-Style Overlay Caption
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Day 1: Fresh haircut today! 💈"
                className="w-full rounded-xl border border-[#e7e1d3] bg-white px-3.5 py-2 text-xs text-[#1c1917] placeholder:text-[#a8a29e] focus:border-[#c27838] focus:outline-none"
              />

              {/* Caption Position & Style */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'snapchat', label: 'Snapchat' },
                    { id: 'minimal', label: 'Minimal' },
                    { id: 'badge', label: 'Bronze Pill' },
                    { id: 'neon', label: 'Amber Glow' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setCaptionStyle(st.id as any)}
                      className={`rounded-lg border py-1 text-[10px] font-medium transition-all cursor-pointer ${
                        captionStyle === st.id
                          ? 'border-[#c27838] bg-[#f5f1e8] text-[#c27838] font-bold'
                          : 'border-[#e7e1d3] bg-white text-[#78716c] hover:text-[#1c1917]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#78716c]">
                    <span className="flex items-center gap-1">
                      <MoveVertical className="h-3 w-3" />
                      Vertical Position
                    </span>
                    <span className="font-mono">{captionY}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    value={captionY}
                    onChange={(e) => setCaptionY(parseInt(e.target.value, 10))}
                    className="w-full accent-[#c27838]"
                  />
                </div>
              </div>
            </div>

            {/* 4. Badges & Alignment Crosshair Toggle */}
            <div className="space-y-2 pt-2 border-t border-[#e7e1d3]">
              <button
                type="button"
                onClick={() => setShowFaceGuide(!showFaceGuide)}
                className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-xs transition-all cursor-pointer ${
                  showFaceGuide
                    ? 'border-[#c27838] bg-[#f5f1e8] text-[#c27838]'
                    : 'border-[#e7e1d3] bg-white text-[#78716c] hover:bg-[#f5f1e8]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-[#c27838]" />
                  <span>Face & Eye Alignment Crosshair</span>
                </div>
                <span className="text-[10px] font-bold">{showFaceGuide ? 'ON' : 'OFF'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 rounded-xl border border-[#e7e1d3] bg-white p-2 text-xs text-[#1c1917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDateStamp}
                    onChange={(e) => setShowDateStamp(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[#e7e1d3] text-[#c27838] accent-[#c27838]"
                  />
                  <span>Date Stamp</span>
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-[#e7e1d3] bg-white p-2 text-xs text-[#1c1917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDayCount}
                    onChange={(e) => setShowDayCount(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[#e7e1d3] text-[#c27838] accent-[#c27838]"
                  />
                  <span>Day Count</span>
                </label>
              </div>
            </div>

            {/* 5. Replace Photo Action */}
            <div className="pt-2 border-t border-[#e7e1d3]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#e7e1d3] bg-white py-2.5 text-xs font-medium text-[#1c1917] hover:bg-[#f5f1e8] transition-colors cursor-pointer"
              >
                <Upload className="h-4 w-4 text-[#c27838]" />
                <span>Choose Different Photo from Device</span>
              </button>
            </div>

            {/* Save CTA */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSaving || !sourceBlob}
                onClick={handleSave}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c27838] py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-[#a85d26] transition-all cursor-pointer disabled:opacity-40"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Entry...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Save Daily Entry to Yearbook</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
