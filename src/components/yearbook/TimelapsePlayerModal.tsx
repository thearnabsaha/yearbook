'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Download,
  Calendar,
  Film,
  Repeat,
  Loader2,
  Sparkles,
  Crosshair,
} from 'lucide-react';
import { YearbookEntry, YearbookProject } from '@/lib/types';
import { loadImageFromBlob } from '@/lib/canvas-utils';
import { saveAs } from 'file-saver';
import confetti from 'canvas-confetti';

interface TimelapsePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: YearbookEntry[];
  currentProject: YearbookProject;
}

export default function TimelapsePlayerModal({
  isOpen,
  onClose,
  entries,
  currentProject,
}: TimelapsePlayerModalProps) {
  const sortedEntries = React.useMemo(() => {
    return [...entries].sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fps, setFps] = useState(4);
  const [isLooping, setIsLooping] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Preloaded image elements
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Preload images on open
  useEffect(() => {
    if (!isOpen || sortedEntries.length === 0) return;

    let isMounted = true;
    setIsLoadingImages(true);

    const loadAll = async () => {
      const map = new Map<string, HTMLImageElement>();
      for (const entry of sortedEntries) {
        try {
          const img = await loadImageFromBlob(entry.photoBlob);
          map.set(entry.id, img);
        } catch (err) {
          console.error(`Failed to load yearbook image for ${entry.date}:`, err);
        }
      }
      if (isMounted) {
        setLoadedImages(map);
        setIsLoadingImages(false);
      }
    };

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [isOpen, sortedEntries]);

  // Render current frame with Auto-Alignment
  const drawFrame = useCallback(
    (index: number) => {
      if (!canvasRef.current || sortedEntries.length === 0) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const entry = sortedEntries[index];
      if (!entry) return;

      const img = loadedImages.get(entry.id);
      if (!img) return;

      canvas.width = 1080;
      canvas.height = 1920;

      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const drawX = (canvas.width - drawW) / 2;
      const drawY = (canvas.height - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    },
    [sortedEntries, loadedImages]
  );

  // Playback Loop
  useEffect(() => {
    if (!isPlaying || sortedEntries.length === 0 || isLoadingImages) return;

    const frameDuration = 1000 / fps;
    let active = true;

    const loop = (timestamp: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const delta = timestamp - lastFrameTimeRef.current;

      if (delta >= frameDuration) {
        lastFrameTimeRef.current = timestamp;
        setCurrentIndex((prev) => {
          if (prev >= sortedEntries.length - 1) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              return prev;
            }
          }
          return prev + 1;
        });
      }

      if (active && isPlaying) {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, fps, isLooping, sortedEntries.length, isLoadingImages]);

  useEffect(() => {
    drawFrame(currentIndex);
  }, [currentIndex, drawFrame]);

  // Export Video
  const handleExportVideo = async () => {
    if (sortedEntries.length === 0 || isLoadingImages) return;
    setIsExporting(true);
    setExportProgress(0);
    setIsPlaying(false);

    try {
      const recCanvas = document.createElement('canvas');
      recCanvas.width = 1080;
      recCanvas.height = 1920;
      const recCtx = recCanvas.getContext('2d');
      if (!recCtx) throw new Error('Cannot get canvas context');

      const stream = recCanvas.captureStream(fps);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 6000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        const cleanTitle = (currentProject?.title || 'yearbook_timelapse').replace(
          /[^a-z0-9_-]/gi,
          '_'
        );
        saveAs(videoBlob, `${cleanTitle}_timelapse_${Date.now()}.webm`);
        setIsExporting(false);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#c27838', '#e7e1d3', '#292524', '#78716c'],
        });
      };

      recorder.start();

      const frameDelayMs = 1000 / fps;

      for (let i = 0; i < sortedEntries.length; i++) {
        setExportProgress(Math.round(((i + 1) / sortedEntries.length) * 100));
        const entry = sortedEntries[i];
        const img = loadedImages.get(entry.id);

        if (img) {
          recCtx.fillStyle = '#1c1917';
          recCtx.fillRect(0, 0, recCanvas.width, recCanvas.height);

          const scale = Math.min(
            recCanvas.width / img.naturalWidth,
            recCanvas.height / img.naturalHeight
          );
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          const drawX = (recCanvas.width - drawW) / 2;
          const drawY = (recCanvas.height - drawH) / 2;

          recCtx.drawImage(img, drawX, drawY, drawW, drawH);
        }

        await new Promise((r) => setTimeout(r, frameDelayMs));
      }

      await new Promise((r) => setTimeout(r, 400));
      recorder.stop();
    } catch (err) {
      console.error('Video export error:', err);
      alert('Video export failed.');
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const currentEntry = sortedEntries[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-3xl border border-[#e7e1d3] bg-[#fbf9f5] shadow-2xl shadow-stone-900/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e7e1d3] px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5f1e8] text-[#c27838] border border-[#e7e1d3]">
              <Film className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-[#1c1917]">
                {currentProject?.title || 'Timelapse Video Studio'}
              </h3>
              <p className="text-[11px] text-[#78716c]">
                Auto-aligned eye-line animation • {sortedEntries.length} Total Days
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

        {/* Studio Body */}
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Left: Video Canvas */}
          <div className="relative flex flex-1 items-center justify-center bg-[#1c1917] p-4 overflow-hidden min-h-[300px] sm:min-h-[460px]">
            {isLoadingImages ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#c27838]" />
                <p className="text-xs text-stone-300">Loading daily photos for timelapse...</p>
              </div>
            ) : sortedEntries.length === 0 ? (
              <div className="text-center p-6">
                <p className="text-sm font-semibold text-white">No Yearbook Photos Yet</p>
                <p className="text-xs text-stone-400 mt-1">
                  Add photos in the yearbook to generate your timelapse video.
                </p>
              </div>
            ) : (
              <div className="relative flex items-center justify-center max-h-[72vh] max-w-full">
                <canvas
                  ref={canvasRef}
                  className="max-h-[60vh] sm:max-h-[72vh] max-w-full rounded-2xl shadow-2xl object-contain border border-stone-800"
                />

                {/* Floating Date Badge on Canvas */}
                {currentEntry && (
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-xl bg-black/80 px-3 py-1.5 backdrop-blur-md border border-white/20 text-xs text-white shadow-lg">
                    <Calendar className="h-3.5 w-3.5 text-[#c27838]" />
                    <span className="font-semibold">{currentEntry.date}</span>
                    <span className="text-stone-400 font-mono text-[11px]">
                      ({currentIndex + 1}/{sortedEntries.length})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Controls Suite */}
          <div className="flex flex-col w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-[#e7e1d3] bg-[#fbf9f5] p-5 space-y-6 overflow-y-auto">
            {/* 1. Transport Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentIndex(0)}
                  className="rounded-xl border border-[#e7e1d3] bg-white p-2.5 text-[#1c1917] hover:bg-[#f5f1e8] transition-colors cursor-pointer"
                  title="Restart to Beginning"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={isLoadingImages || sortedEntries.length === 0}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c27838] text-white shadow-lg hover:bg-[#a85d26] active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-white" />
                  ) : (
                    <Play className="h-6 w-6 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsLooping(!isLooping)}
                  className={`rounded-xl border p-2.5 transition-colors cursor-pointer ${
                    isLooping
                      ? 'border-[#c27838] bg-[#f5f1e8] text-[#c27838]'
                      : 'border-[#e7e1d3] bg-white text-[#78716c] hover:text-[#1c1917]'
                  }`}
                  title="Loop Playback"
                >
                  <Repeat className="h-4 w-4" />
                </button>
              </div>

              {/* Scrubber Timeline */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#78716c]">
                  <span>Timeline Scrubber</span>
                  <span className="font-mono">
                    Day {currentIndex + 1} of {sortedEntries.length}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, sortedEntries.length - 1)}
                  value={currentIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentIndex(parseInt(e.target.value, 10));
                  }}
                  className="w-full accent-[#c27838]"
                />
              </div>
            </div>

            {/* 2. Speed & FPS Controls */}
            <div className="space-y-2 pt-2 border-t border-[#e7e1d3]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-[#78716c]">
                  Animation Speed
                </span>
                <span className="font-mono text-[#c27838] font-bold">{fps} FPS</span>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {[
                  { val: 1, label: '1 fps' },
                  { val: 2, label: '2 fps' },
                  { val: 4, label: '4 fps' },
                  { val: 8, label: '8 fps' },
                  { val: 15, label: '15 fps' },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setFps(s.val)}
                    className={`rounded-lg border py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      fps === s.val
                        ? 'border-[#c27838] bg-[#f5f1e8] text-[#c27838] font-bold'
                        : 'border-[#e7e1d3] bg-white text-[#78716c] hover:text-[#1c1917]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Current Day Entry Card */}
            {currentEntry && (
              <div className="rounded-2xl border border-[#e7e1d3] bg-white p-3.5 space-y-1.5 text-xs shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1c1917] font-display">
                    {currentEntry.date}
                  </span>
                  <span className="text-[10px] text-[#78716c]">
                    {currentEntry.aspectRatio}
                  </span>
                </div>
                {currentEntry.caption ? (
                  <p className="text-[11px] text-[#44403c] italic">
                    &ldquo;{currentEntry.caption}&rdquo;
                  </p>
                ) : (
                  <p className="text-[11px] text-[#a8a29e] italic">No caption for this day</p>
                )}
              </div>
            )}

            {/* 4. Export Video Button */}
            <div className="pt-2 border-t border-[#e7e1d3]">
              <button
                type="button"
                disabled={isExporting || sortedEntries.length === 0 || isLoadingImages}
                onClick={handleExportVideo}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c27838] py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-[#a85d26] transition-all cursor-pointer disabled:opacity-40"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Rendering Video ({exportProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Export Timelapse Video (.WebM)</span>
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
