'use client';

import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  Clipboard,
  Camera,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { saveIncomingPhotos } from '@/lib/db';

interface PhotoDropzoneProps {
  onPhotosAdded: () => void;
  onOpenCamera: () => void;
  isCompact?: boolean;
}

export default function PhotoDropzone({
  onPhotosAdded,
  onOpenCamera,
  isCompact = false,
}: PhotoDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global Clipboard Paste listener
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        await processFiles(imageFiles, 'Pasted from Clipboard');
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFiles = async (files: File[], defaultCaption = '') => {
    const validImages = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validImages.length === 0) return;

    setIsProcessing(true);
    setTotalToProcess(validImages.length);
    setProcessedCount(0);

    try {
      await saveIncomingPhotos(validImages, {
        defaultCaption,
        tags: defaultCaption ? ['clipboard'] : [],
      });
      setProcessedCount(validImages.length);
      onPhotosAdded();
    } catch (err) {
      console.error('Failed to process incoming photos:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessedCount(0);
        setTotalToProcess(0);
      }, 500);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  if (isCompact) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerPicker}
          className={`group relative flex cursor-pointer items-center justify-between rounded-2xl border border-dashed p-4 transition-all duration-200 ${
            isDragging
              ? 'border-[#c27838] bg-[#f5f1e8] shadow-md shadow-stone-900/5'
              : 'border-[#e7e1d3] bg-white hover:border-[#c27838] hover:bg-[#fbf9f5]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f1e8] text-[#c27838]">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1c1917]">
                Drop photos here or click to browse
              </p>
              <p className="text-[11px] text-[#78716c]">
                Supports PNG, JPEG, WebP, GIF • Paste with Cmd+V
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCamera();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[#e7e1d3] bg-[#fbf9f5] px-3 py-1.5 text-xs font-medium text-[#1c1917] hover:bg-[#f5f1e8] transition-all cursor-pointer"
          >
            <Camera className="h-3.5 w-3.5 text-[#c27838]" />
            <span>Camera</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ${
          isDragging
            ? 'border-[#c27838] bg-[#f5f1e8] shadow-md'
            : 'border-[#e7e1d3] bg-white hover:border-[#c27838] hover:bg-[#fbf9f5]'
        }`}
      >
        <div className="relative px-6 py-10 sm:py-12 flex flex-col items-center text-center">
          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
              <Loader2 className="h-10 w-10 text-[#c27838] animate-spin mb-3" />
              <p className="text-sm font-semibold text-[#1c1917]">
                Processing {totalToProcess} Photos...
              </p>
              <p className="text-xs text-[#78716c] mt-1">Generating offline thumbnails</p>
            </div>
          )}

          {/* Intake Icon */}
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5f1e8] border border-[#e7e1d3] text-[#c27838]">
            <UploadCloud className="h-8 w-8 text-[#c27838]" />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#c27838] text-white shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
          </div>

          {/* Heading */}
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1c1917]">
            Receive & Import Your Photos
          </h2>
          <p className="mt-1 max-w-md text-xs sm:text-sm text-[#78716c]">
            Drag and drop images directly here, browse files, snap with your camera, or paste from clipboard.
          </p>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={triggerPicker}
              className="flex items-center gap-2 rounded-xl bg-[#c27838] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#a85d26] transition-all cursor-pointer"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Select Photos</span>
            </button>

            <button
              onClick={onOpenCamera}
              className="flex items-center gap-2 rounded-xl border border-[#e7e1d3] bg-[#fbf9f5] px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1c1917] hover:bg-[#f5f1e8] transition-all cursor-pointer"
            >
              <Camera className="h-4 w-4 text-[#c27838]" />
              <span>Camera Snap</span>
            </button>
          </div>

          {/* Hints footer */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#78716c]">
            <span className="flex items-center gap-1.5">
              <Clipboard className="h-3.5 w-3.5 text-[#78716c]" />
              Press <kbd className="rounded bg-[#f5f1e8] px-1.5 py-0.5 font-mono text-[10px] text-[#1c1917] border border-[#e7e1d3]">Cmd+V</kbd> to paste
            </span>
            <span className="hidden sm:inline text-[#e7e1d3]">•</span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              100% Private (Stored in browser)
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
