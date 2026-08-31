'use client';

import React, { useState } from 'react';
import {
  PenTool,
  Highlighter,
  ArrowUpRight,
  Square,
  Circle,
  Type,
  Trash2,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
} from 'lucide-react';
import { EditState, DrawingStroke, TextLayer } from '@/lib/types';

interface MarkupTextPanelProps {
  editState: EditState;
  onChange: (updates: Partial<EditState>) => void;
  activeDrawTool: 'brush' | 'highlighter' | 'arrow' | 'rect' | 'circle';
  setActiveDrawTool: (tool: 'brush' | 'highlighter' | 'arrow' | 'rect' | 'circle') => void;
  drawColor: string;
  setDrawColor: (color: string) => void;
  drawSize: number;
  setDrawSize: (size: number) => void;
  drawOpacity: number;
  setDrawOpacity: (opacity: number) => void;
  selectedTextId: string | null;
  setSelectedTextId: (id: string | null) => void;
}

const COLOR_SWATCHES = [
  '#FFFFFF',
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#000000', // Black
];

const FONT_OPTIONS = [
  { id: 'sans-serif', label: 'Modern Sans' },
  { id: 'Outfit, sans-serif', label: 'Outfit Display' },
  { id: 'Caveat, cursive, sans-serif', label: 'Handwritten' },
  { id: 'monospace', label: 'Monospace' },
  { id: 'serif', label: 'Editorial Serif' },
];

export default function MarkupTextPanel({
  editState,
  onChange,
  activeDrawTool,
  setActiveDrawTool,
  drawColor,
  setDrawColor,
  drawSize,
  setDrawSize,
  drawOpacity,
  setDrawOpacity,
  selectedTextId,
  setSelectedTextId,
}: MarkupTextPanelProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'text'>('draw');

  const selectedTextLayer = editState.textLayers.find((t) => t.id === selectedTextId);

  const clearAllDrawings = () => {
    onChange({ drawings: [] });
  };

  const undoLastStroke = () => {
    if (editState.drawings.length > 0) {
      onChange({ drawings: editState.drawings.slice(0, -1) });
    }
  };

  const addTextLayer = () => {
    const newId = `text_${Date.now()}`;
    const newLayer: TextLayer = {
      id: newId,
      text: 'Add your text here',
      x: 50,
      y: 50,
      fontSize: 24,
      color: '#FFFFFF',
      bgColor: 'rgba(0, 0, 0, 0.65)',
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 'bold',
      textAlign: 'center',
      hasShadow: true,
    };

    onChange({ textLayers: [...editState.textLayers, newLayer] });
    setSelectedTextId(newId);
    setActiveTab('text');
  };

  const updateSelectedText = (updates: Partial<TextLayer>) => {
    if (!selectedTextId) return;
    const nextLayers = editState.textLayers.map((l) =>
      l.id === selectedTextId ? { ...l, ...updates } : l
    );
    onChange({ textLayers: nextLayers });
  };

  const deleteSelectedText = () => {
    if (!selectedTextId) return;
    const nextLayers = editState.textLayers.filter((l) => l.id !== selectedTextId);
    onChange({ textLayers: nextLayers });
    setSelectedTextId(nextLayers[0]?.id || null);
  };

  return (
    <div className="space-y-5">
      {/* Subtab Toggle (Draw vs Text) */}
      <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('draw')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'draw'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PenTool className="h-3.5 w-3.5" />
          <span>Draw & Markup</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'text'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Type className="h-3.5 w-3.5" />
          <span>Text Overlays ({editState.textLayers.length})</span>
        </button>
      </div>

      {/* DRAW TAB */}
      {activeTab === 'draw' && (
        <div className="space-y-5">
          {/* Tool selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Markup Tool
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'brush', label: 'Brush', icon: PenTool },
                { id: 'highlighter', label: 'Marker', icon: Highlighter },
                { id: 'arrow', label: 'Arrow', icon: ArrowUpRight },
                { id: 'rect', label: 'Box', icon: Square },
                { id: 'circle', label: 'Circle', icon: Circle },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = activeDrawTool === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveDrawTool(t.id as any)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-[11px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-md shadow-indigo-600/20'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Color Palette
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setDrawColor(color)}
                  style={{ backgroundColor: color }}
                  className={`h-7 w-7 rounded-full border-2 transition-all cursor-pointer ${
                    drawColor.toUpperCase() === color.toUpperCase()
                      ? 'border-white scale-110 shadow-lg shadow-indigo-500/30'
                      : 'border-slate-700 hover:scale-105'
                  }`}
                  title={color}
                />
              ))}

              <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs text-slate-400 hover:text-white">
                <span>+</span>
                <input
                  type="color"
                  value={drawColor}
                  onChange={(e) => setDrawColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Stroke Size */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-slate-400">
                Brush Thickness
              </span>
              <span className="font-mono text-slate-400">{drawSize}px</span>
            </div>
            <input
              type="range"
              min="2"
              max="40"
              value={drawSize}
              onChange={(e) => setDrawSize(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Stroke Opacity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-slate-400">
                Opacity
              </span>
              <span className="font-mono text-slate-400">{Math.round(drawOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={drawOpacity}
              onChange={(e) => setDrawOpacity(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={undoLastStroke}
              disabled={editState.drawings.length === 0}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Undo Stroke
            </button>

            <button
              type="button"
              onClick={clearAllDrawings}
              disabled={editState.drawings.length === 0}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Drawings
            </button>
          </div>
        </div>
      )}

      {/* TEXT TAB */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={addTextLayer}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Text Layer</span>
          </button>

          {/* Active Layer Editor */}
          {selectedTextLayer ? (
            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Text Content
                </label>
                <input
                  type="text"
                  value={selectedTextLayer.text}
                  onChange={(e) => updateSelectedText({ text: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Font Family Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Typography Font
                </label>
                <select
                  value={selectedTextLayer.fontFamily}
                  onChange={(e) => updateSelectedText({ fontFamily: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Size</span>
                  <span className="font-mono">{selectedTextLayer.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="64"
                  value={selectedTextLayer.fontSize}
                  onChange={(e) =>
                    updateSelectedText({ fontSize: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Text Color & Pill Background */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedTextLayer.color}
                      onChange={(e) => updateSelectedText({ color: e.target.value })}
                      className="h-8 w-12 rounded-lg bg-transparent cursor-pointer border border-slate-700"
                    />
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedTextLayer.color}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Background Pill</label>
                  <select
                    value={selectedTextLayer.bgColor || 'transparent'}
                    onChange={(e) => updateSelectedText({ bgColor: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="transparent">None (Transparent)</option>
                    <option value="rgba(0, 0, 0, 0.75)">Black Frosted</option>
                    <option value="rgba(255, 255, 255, 0.9)">Clean White</option>
                    <option value="rgba(99, 102, 241, 0.9)">Indigo Accent</option>
                    <option value="rgba(239, 68, 68, 0.9)">Red Alert</option>
                  </select>
                </div>
              </div>

              {/* Formatting & Alignment */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedText({
                        fontWeight:
                          selectedTextLayer.fontWeight === 'bold' ? 'normal' : 'bold',
                      })
                    }
                    className={`rounded-lg p-1.5 text-xs transition-colors ${
                      selectedTextLayer.fontWeight === 'bold'
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Bold"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSelectedText({ textAlign: 'left' })}
                    className={`rounded-lg p-1.5 text-xs transition-colors ${
                      selectedTextLayer.textAlign === 'left'
                        ? 'bg-indigo-600/30 text-indigo-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSelectedText({ textAlign: 'center' })}
                    className={`rounded-lg p-1.5 text-xs transition-colors ${
                      selectedTextLayer.textAlign === 'center'
                        ? 'bg-indigo-600/30 text-indigo-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlignCenter className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSelectedText({ textAlign: 'right' })}
                    className={`rounded-lg p-1.5 text-xs transition-colors ${
                      selectedTextLayer.textAlign === 'right'
                        ? 'bg-indigo-600/30 text-indigo-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={deleteSelectedText}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Layer</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-500 py-4">
              Click &quot;Add New Text Layer&quot; to overlay captions or notes onto your photo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
