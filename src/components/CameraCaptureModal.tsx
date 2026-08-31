'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RotateCw,
  Clock,
  Sparkles,
  Check,
  Edit3,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { saveIncomingPhotos } from '@/lib/db';
import { PhotoRecord } from '@/lib/types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (photo: PhotoRecord, openInEditor?: boolean) => void;
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onPhotoCaptured,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Captured state
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['camera']);
  const [isSaving, setIsSaving] = useState(false);

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    setErrorMsg(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const error = err as Error;
      setErrorMsg(
        error.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : 'Could not connect to camera device.'
      );
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen && !capturedBlob) {
      startCamera(facingMode);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode, startCamera, capturedBlob, stream]);

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCapturedBlob(null);
    setPreviewUrl(null);
    setCaption('');
    setTags(['camera']);
    setCountdown(null);
    onClose();
  };

  const flipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image for natural selfie feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Flash animation effect
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          // Stop live stream while viewing captured snap
          if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            setStream(null);
          }
        }
      },
      'image/jpeg',
      0.95
    );
  };

  const handleSnapClick = () => {
    if (timerSeconds > 0) {
      setCountdown(timerSeconds);
      let current = timerSeconds;
      const interval = setInterval(() => {
        current -= 1;
        if (current <= 0) {
          clearInterval(interval);
          setCountdown(null);
          takeSnapshot();
        } else {
          setCountdown(current);
        }
      }, 1000);
    } else {
      takeSnapshot();
    }
  };

  const retakePhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedBlob(null);
    setPreviewUrl(null);
    startCamera(facingMode);
  };

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

  const removeTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const savePhoto = async (openInEditor = false) => {
    if (!capturedBlob) return;
    setIsSaving(true);
    try {
      const fileName = `Camera_Snap_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.jpg`;
      const file = new File([capturedBlob], fileName, { type: 'image/jpeg' });
      const records = await saveIncomingPhotos([file], {
        defaultCaption: caption,
        tags,
      });

      if (records.length > 0) {
        onPhotoCaptured(records[0], openInEditor);
        handleClose();
      }
    } catch (err) {
      console.error('Failed to save snapshot:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-800 bg-[#0d101a] shadow-2xl shadow-indigo-950/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-white">
                {capturedBlob ? 'Review & Tag Snapshot' : 'Camera Viewfinder'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {capturedBlob
                  ? 'Add captions & tags or jump right into editing'
                  : 'Snap high-res photo directly into your vault'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewfinder / Review Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px] sm:min-h-[380px]">
          {/* Flash animation */}
          {flashActive && (
            <div className="absolute inset-0 z-30 bg-white opacity-90 transition-opacity duration-200" />
          )}

          {/* Countdown Display */}
          {countdown !== null && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-xs">
              <span className="text-7xl sm:text-8xl font-black text-amber-400 animate-ping">
                {countdown}
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg ? (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm">
              <AlertCircle className="h-12 w-12 text-rose-400 mb-3" />
              <p className="text-sm font-semibold text-white">Camera Unavailable</p>
              <p className="text-xs text-slate-400 mt-1">{errorMsg}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Retry Camera
              </button>
            </div>
          ) : capturedBlob && previewUrl ? (
            /* Snapshot Review View */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Snapshot preview"
              className="h-full max-h-[420px] w-full object-contain"
            />
          ) : (
            /* Live Camera View */
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full max-h-[420px] w-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />
          )}

          {/* Grid overlay lines on live camera */}
          {!capturedBlob && !errorMsg && (
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-white/60" />
              <div className="border-r border-white/60" />
              <div />
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="border-t border-slate-800 bg-[#0a0d17] p-4 sm:p-5">
          {capturedBlob ? (
            /* Form for Caption & Tags */
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Add a caption for this photo (optional)..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Tags Input */}
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-300 border border-indigo-500/30"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-indigo-400 hover:text-indigo-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Add tag + Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="rounded-lg bg-transparent px-2 py-0.5 text-xs text-white placeholder:text-slate-500 focus:outline-none w-28"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Retake Photo
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => savePhoto(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Save & Edit</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => savePhoto(false)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Save to Vault</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Live Camera Trigger Controls */
            <div className="flex items-center justify-between">
              {/* Timer selector */}
              <button
                type="button"
                onClick={() => {
                  const nextTimer = timerSeconds === 0 ? 3 : timerSeconds === 3 ? 5 : 0;
                  setTimerSeconds(nextTimer);
                }}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                  timerSeconds > 0
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{timerSeconds > 0 ? `${timerSeconds}s Timer` : 'Timer Off'}</span>
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                disabled={Boolean(errorMsg)}
                onClick={handleSnapClick}
                className="group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-amber-400 p-1 shadow-xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white group-hover:bg-slate-100 transition-colors">
                  <Camera className="h-6 w-6 text-slate-900" />
                </div>
              </button>

              {/* Flip camera */}
              <button
                type="button"
                onClick={flipCamera}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title="Switch Camera (Front / Back)"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Flip</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
