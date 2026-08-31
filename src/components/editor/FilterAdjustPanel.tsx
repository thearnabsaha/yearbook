'use client';

import React from 'react';
import {
  Sun,
  Contrast,
  Palette,
  Flame,
  Gauge,
  Sparkles,
  RefreshCcw,
  Sliders,
  EyeOff,
  Droplet,
  CircleDot,
} from 'lucide-react';
import { EditState, FilterValues, PresetFilterName, DEFAULT_FILTERS } from '@/lib/types';
import { PRESET_FILTERS } from '@/lib/canvas-utils';

interface FilterAdjustPanelProps {
  editState: EditState;
  onChange: (updates: Partial<EditState>) => void;
}

export default function FilterAdjustPanel({ editState, onChange }: FilterAdjustPanelProps) {
  const filters = editState.filters;

  const handleFilterChange = (key: keyof FilterValues, val: number) => {
    onChange({
      filters: {
        ...filters,
        [key]: val,
      },
      preset: 'none', // Custom edit overrides preset active indicator
    });
  };

  const applyPreset = (presetName: PresetFilterName) => {
    const preset = PRESET_FILTERS[presetName];
    if (!preset) return;

    onChange({
      preset: presetName,
      filters: {
        ...DEFAULT_FILTERS,
        ...preset.filters,
      },
    });
  };

  const resetAllFilters = () => {
    onChange({
      preset: 'none',
      filters: JSON.parse(JSON.stringify(DEFAULT_FILTERS)),
    });
  };

  const SLIDER_ITEMS: {
    key: keyof FilterValues;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    unit: string;
  }[] = [
    {
      key: 'brightness',
      label: 'Brightness',
      icon: Sun,
      min: 0,
      max: 200,
      step: 1,
      defaultValue: 100,
      unit: '%',
    },
    {
      key: 'contrast',
      label: 'Contrast',
      icon: Contrast,
      min: 0,
      max: 200,
      step: 1,
      defaultValue: 100,
      unit: '%',
    },
    {
      key: 'saturation',
      label: 'Saturation',
      icon: Palette,
      min: 0,
      max: 200,
      step: 1,
      defaultValue: 100,
      unit: '%',
    },
    {
      key: 'warmth',
      label: 'Warmth / Temp',
      icon: Flame,
      min: -100,
      max: 100,
      step: 1,
      defaultValue: 0,
      unit: '',
    },
    {
      key: 'exposure',
      label: 'Exposure',
      icon: Gauge,
      min: -100,
      max: 100,
      step: 1,
      defaultValue: 0,
      unit: '',
    },
    {
      key: 'vignette',
      label: 'Vignette',
      icon: CircleDot,
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 0,
      unit: '%',
    },
    {
      key: 'sepia',
      label: 'Sepia Film',
      icon: Sparkles,
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 0,
      unit: '%',
    },
    {
      key: 'grayscale',
      label: 'Monochrome (B&W)',
      icon: EyeOff,
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 0,
      unit: '%',
    },
    {
      key: 'blur',
      label: 'Soft Blur',
      icon: Droplet,
      min: 0,
      max: 20,
      step: 0.5,
      defaultValue: 0,
      unit: 'px',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1-Click Aesthetic Presets Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Aesthetic Presets
          </label>
          <button
            type="button"
            onClick={resetAllFilters}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
          >
            <RefreshCcw className="h-3 w-3" />
            Reset All
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(PRESET_FILTERS) as PresetFilterName[]).map((pName) => {
            const info = PRESET_FILTERS[pName];
            const isActive = editState.preset === pName;

            return (
              <button
                key={pName}
                type="button"
                onClick={() => applyPreset(pName)}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-600/20 shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <span className="text-xs font-semibold text-white">{info.label}</span>
                <span className="text-[10px] text-slate-400 truncate w-full mt-0.5">
                  {info.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders Section */}
      <div className="space-y-4 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Manual Color & Lighting
          </span>
        </div>

        <div className="space-y-4">
          {SLIDER_ITEMS.map((item) => {
            const Icon = item.icon;
            const value = filters[item.key];
            const isChanged = value !== item.defaultValue;

            return (
              <div key={item.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400">
                      {value}
                      {item.unit}
                    </span>
                    {isChanged && (
                      <button
                        type="button"
                        onClick={() => handleFilterChange(item.key, item.defaultValue)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300"
                        title="Reset to default"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  step={item.step}
                  value={value}
                  onChange={(e) =>
                    handleFilterChange(item.key, parseFloat(e.target.value))
                  }
                  className="w-full accent-indigo-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
