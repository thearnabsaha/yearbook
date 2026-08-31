'use client';

import React from 'react';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Square,
  Smartphone,
  Monitor,
  Circle,
  RefreshCcw,
} from 'lucide-react';
import { EditState, CropState } from '@/lib/types';

interface CropTransformPanelProps {
  editState: EditState;
  onChange: (updates: Partial<EditState>) => void;
  onReset: () => void;
}

const ASPECT_RATIOS = [
  { id: 'free', label: 'Freeform', icon: Maximize2 },
  { id: '1:1', label: '1:1 Square', icon: Square },
  { id: '4:5', label: '4:5 Portrait', icon: Smartphone },
  { id: '16:9', label: '16:9 Wide', icon: Monitor },
  { id: '9:16', label: '9:16 Story', icon: Smartphone },
  { id: '4:3', label: '4:3 Standard', icon: Monitor },
  { id: '3:2', label: '3:2 Photo', icon: Monitor },
  { id: 'circle', label: 'Circle', icon: Circle },
];

export default function CropTransformPanel({
  editState,
  onChange,
  onReset,
}: CropTransformPanelProps) {
  const currentRatio = editState.crop.aspectRatio || 'free';

  const setAspectRatio = (ratio: string) => {
    let newWidth = editState.crop.width;
    let newHeight = editState.crop.height;
    let newX = editState.crop.x;
    let newY = editState.crop.y;

    if (ratio === '1:1' || ratio === 'circle') {
      const minDim = Math.min(editState.crop.width, editState.crop.height);
      newWidth = minDim;
      newHeight = minDim;
    } else if (ratio === '16:9') {
      newHeight = Math.min(100, Math.round((newWidth * 9) / 16));
    } else if (ratio === '9:16') {
      newWidth = Math.min(100, Math.round((newHeight * 9) / 16));
    } else if (ratio === '4:5') {
      newWidth = Math.min(100, Math.round((newHeight * 4) / 5));
    } else if (ratio === '4:3') {
      newHeight = Math.min(100, Math.round((newWidth * 3) / 4));
    } else if (ratio === '3:2') {
      newHeight = Math.min(100, Math.round((newWidth * 2) / 3));
    }

    // Keep in bounds
    if (newX + newWidth > 100) newX = 100 - newWidth;
    if (newY + newHeight > 100) newY = 100 - newHeight;

    const newCrop: CropState = {
      ...editState.crop,
      aspectRatio: ratio,
      width: newWidth,
      height: newHeight,
      x: Math.max(0, newX),
      y: Math.max(0, newY),
    };

    onChange({ crop: newCrop });
  };

  const rotate90 = (direction: 'cw' | 'ccw') => {
    const delta = direction === 'cw' ? 90 : -90;
    const nextRot = (editState.rotation + delta + 360) % 360;
    onChange({ rotation: nextRot });
  };

  return (
    <div className="space-y-6">
      {/* Aspect Ratio Presets */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Aspect Ratio
          </label>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
          >
            <RefreshCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ASPECT_RATIOS.map((item) => {
            const Icon = item.icon;
            const isActive = currentRatio === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setAspectRatio(item.id)}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-md shadow-indigo-600/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rotation & Flipping */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          Rotate & Flip
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => rotate90('ccw')}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            title="Rotate 90° Left"
          >
            <RotateCcw className="h-4 w-4 text-indigo-400" />
            <span className="text-[11px] font-medium">-90°</span>
          </button>

          <button
            type="button"
            onClick={() => rotate90('cw')}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            title="Rotate 90° Right"
          >
            <RotateCw className="h-4 w-4 text-indigo-400" />
            <span className="text-[11px] font-medium">+90°</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ flipH: !editState.flipH })}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 transition-all cursor-pointer ${
              editState.flipH
                ? 'border-indigo-500 bg-indigo-600/20 text-white'
                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
            }`}
            title="Flip Horizontal"
          >
            <FlipHorizontal className="h-4 w-4 text-violet-400" />
            <span className="text-[11px] font-medium">Flip H</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ flipV: !editState.flipV })}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 transition-all cursor-pointer ${
              editState.flipV
                ? 'border-indigo-500 bg-indigo-600/20 text-white'
                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
            }`}
            title="Flip Vertical"
          >
            <FlipVertical className="h-4 w-4 text-violet-400" />
            <span className="text-[11px] font-medium">Flip V</span>
          </button>
        </div>
      </div>

      {/* Fine Angle Straightening */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold uppercase tracking-wider text-slate-400">
            Straighten Angle
          </span>
          <button
            type="button"
            onClick={() => onChange({ straighten: 0 })}
            className="font-mono text-indigo-400 hover:text-indigo-300 text-xs"
            title="Reset angle to 0°"
          >
            {editState.straighten > 0 ? `+${editState.straighten}°` : `${editState.straighten}°`}
          </button>
        </div>
        <input
          type="range"
          min="-45"
          max="45"
          step="1"
          value={editState.straighten}
          onChange={(e) => onChange({ straighten: parseInt(e.target.value, 10) })}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
          <span>-45°</span>
          <span>0°</span>
          <span>+45°</span>
        </div>
      </div>
    </div>
  );
}
