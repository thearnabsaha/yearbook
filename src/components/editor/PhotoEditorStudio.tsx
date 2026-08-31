'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Eye,
  Save,
  Download,
  Crop,
  Sliders,
  PenTool,
  Type,
  Tag,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { PhotoRecord, EditState, DrawingStroke, TextLayer, DEFAULT_EDIT_STATE } from '@/lib/types';
import {
  renderCanvasPipeline,
  loadImageFromBlob,
  exportCanvasToBlob,
} from '@/lib/canvas-utils';
import { savePhotoEdits, updatePhoto } from '@/lib/db';
import CropTransformPanel from './CropTransformPanel';
import FilterAdjustPanel from './FilterAdjustPanel';
import MarkupTextPanel from './MarkupTextPanel';
import CaptionMetadataPanel from './CaptionMetadataPanel';
import ExportModal from './ExportModal';

interface PhotoEditorStudioProps {
  photo: PhotoRecord;
  onBack: () => void;
  onSaved: (updatedPhoto: PhotoRecord) => void;
}

type EditorTab = 'crop' | 'filters' | 'markup' | 'text' | 'metadata';

export default function PhotoEditorStudio({
  photo,
  onBack,
  onSaved,
}: PhotoEditorStudioProps) {
  // Active Tab
  const [activeTab, setActiveTab] = useState<EditorTab>('filters');

  // Working state
  const [title, setTitle] = useState(photo.title);
  const [caption, setCaption] = useState(photo.caption || '');
  const [tags, setTags] = useState<string[]>(photo.tags || []);
  const [isFavorite, setIsFavorite] = useState(photo.isFavorite || false);

  // Edit State & History for Undo/Redo
  const [editState, setEditState] = useState<EditState>(
    photo.editState ? JSON.parse(JSON.stringify(photo.editState)) : JSON.parse(JSON.stringify(DEFAULT_EDIT_STATE))
  );
  const [history, setHistory] = useState<EditState[]>([
    photo.editState ? JSON.parse(JSON.stringify(photo.editState)) : JSON.parse(JSON.stringify(DEFAULT_EDIT_STATE)),
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Comparison & Export states
  const [isComparing, setIsComparing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Drawing state
  const [activeDrawTool, setActiveDrawTool] = useState<'brush' | 'highlighter' | 'arrow' | 'rect' | 'circle'>('brush');
  const [drawColor, setDrawColor] = useState('#FFFFFF');
  const [drawSize, setDrawSize] = useState(8);
  const [drawOpacity, setDrawOpacity] = useState(1.0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);

  // Text selection
  const [selectedTextId, setSelectedTextId] = useState<string | null>(
    photo.editState?.textLayers?.[0]?.id || null
  );

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load source image
  useEffect(() => {
    let isMounted = true;
    loadImageFromBlob(photo.originalBlob)
      .then((img) => {
        if (isMounted) {
          sourceImageRef.current = img;
          setImageLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load source image:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [photo.originalBlob]);

  // Push state to history
  const pushHistory = useCallback(
    (newState: EditState) => {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(JSON.parse(JSON.stringify(newState)));
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    },
    [history, historyIndex]
  );

  // Handle Edit State update
  const handleEditStateChange = (updates: Partial<EditState>) => {
    const nextState = { ...editState, ...updates };
    setEditState(nextState);
    pushHistory(nextState);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setEditState(JSON.parse(JSON.stringify(history[nextIndex])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setEditState(JSON.parse(JSON.stringify(history[nextIndex])));
    }
  };

  const resetToOriginal = () => {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_EDIT_STATE));
    setEditState(fresh);
    pushHistory(fresh);
  };

  // Render canvas pipeline whenever editState, compare mode, or photo changes
  const renderCurrent = useCallback(() => {
    if (!canvasRef.current || !sourceImageRef.current || !imageLoaded) return;

    const stateToRender = isComparing
      ? JSON.parse(JSON.stringify(DEFAULT_EDIT_STATE))
      : editState;

    renderCanvasPipeline({
      sourceImage: sourceImageRef.current,
      targetCanvas: canvasRef.current,
      editState: stateToRender,
      caption: isComparing ? '' : caption,
      maxDimension: 1600,
    });
  }, [imageLoaded, isComparing, editState, caption]);

  useEffect(() => {
    renderCurrent();
  }, [renderCurrent]);

  // Drawing event handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'markup' || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    const newStroke: DrawingStroke = {
      id: `stroke_${Date.now()}`,
      tool: activeDrawTool,
      color: drawColor,
      size: drawSize,
      opacity: drawOpacity,
      points: [{ x, y }],
    };

    setCurrentStroke(newStroke);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const updatedStroke: DrawingStroke = {
      ...currentStroke,
      points:
        currentStroke.tool === 'brush' || currentStroke.tool === 'highlighter'
          ? [...currentStroke.points, { x, y }]
          : [currentStroke.points[0], { x, y }],
    };

    setCurrentStroke(updatedStroke);

    // Temp render with current stroke
    if (canvasRef.current && sourceImageRef.current) {
      renderCanvasPipeline({
        sourceImage: sourceImageRef.current,
        targetCanvas: canvasRef.current,
        editState: {
          ...editState,
          drawings: [...editState.drawings, updatedStroke],
        },
        caption,
        maxDimension: 1600,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && currentStroke) {
      setIsDrawing(false);
      const nextDrawings = [...editState.drawings, currentStroke];
      setCurrentStroke(null);
      handleEditStateChange({ drawings: nextDrawings });
    }
  };

  // Save to IndexedDB
  const handleSaveToVault = async () => {
    if (!sourceImageRef.current) return;
    setIsSaving(true);

    try {
      // Full resolution export canvas
      const exportCanvas = document.createElement('canvas');
      renderCanvasPipeline({
        sourceImage: sourceImageRef.current,
        targetCanvas: exportCanvas,
        editState,
        caption,
      });

      const editedBlob = await exportCanvasToBlob(exportCanvas, 'image/webp', 0.92);

      await savePhotoEdits(photo.id, editedBlob, editState);
      await updatePhoto(photo.id, {
        title,
        caption,
        tags,
        isFavorite,
      });

      const updatedRecord: PhotoRecord = {
        ...photo,
        title,
        caption,
        tags,
        isFavorite,
        editState,
        editedBlob,
        updatedAt: Date.now(),
      };

      onSaved(updatedRecord);
    } catch (err) {
      console.error('Failed to save photo edits:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080a11] text-slate-100 select-none">
      {/* Studio Top Navigation Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800/80 bg-[#0d101a]/90 px-4 sm:px-6 backdrop-blur-xl">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Gallery</span>
          </button>

          <div className="flex flex-col">
            <span className="font-display text-xs sm:text-sm font-bold text-white max-w-[140px] sm:max-w-[240px] truncate">
              {title || 'Untitled Photo'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {photo.width} × {photo.height} px
            </span>
          </div>
        </div>

        {/* Middle: Undo, Redo, Compare */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          {/* Hold to Compare */}
          <button
            type="button"
            onMouseDown={() => setIsComparing(true)}
            onMouseUp={() => setIsComparing(false)}
            onTouchStart={() => setIsComparing(true)}
            onTouchEnd={() => setIsComparing(false)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              isComparing
                ? 'border-amber-500 bg-amber-500/20 text-amber-300 ring-2 ring-amber-500/50'
                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
            }`}
            title="Press and hold to see unedited original"
          >
            <Eye className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">
              {isComparing ? 'Showing Original' : 'Hold to Compare'}
            </span>
          </button>
        </div>

        {/* Right: Reset, Save, Export */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetToOriginal}
            className="hidden md:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Revert all changes"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveToVault}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Vault'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body: Split View (Canvas & Panels) */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Left / Center: Interactive Canvas Workspace */}
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#06070b] p-4 sm:p-6">
          {/* Ambient Studio Lighting */}
          <div className="pointer-events-none absolute inset-0 canvas-checkerboard opacity-40" />

          {/* Loading spinner */}
          {!imageLoaded && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-xs text-slate-400">Loading full image canvas...</p>
            </div>
          )}

          {/* Canvas Element */}
          <div
            className="relative flex items-center justify-center max-h-[85vh] max-w-full transition-transform duration-150"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className={`max-h-[68vh] sm:max-h-[75vh] max-w-full rounded-lg shadow-2xl object-contain transition-shadow ${
                activeTab === 'markup' ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />
          </div>

          {/* Floating Zoom & Fit Controls Bottom Left */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1 backdrop-blur-md text-xs shadow-lg">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.15))}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1 text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.15))}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white border-l border-slate-800 ml-1"
              title="Fit to Screen"
            >
              <Maximize className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right / Sidebar: Tooling Studio Suite */}
        <aside className="flex flex-col w-full lg:w-96 xl:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-[#0c0f1a] max-h-[45vh] lg:max-h-full">
          {/* Tool Category Selector Bar */}
          <div className="flex border-b border-slate-800/80 bg-slate-950/60 p-2 gap-1 overflow-x-auto">
            {[
              { id: 'filters', label: 'Filters', icon: Sliders },
              { id: 'crop', label: 'Crop & Rotate', icon: Crop },
              { id: 'markup', label: 'Draw & Text', icon: PenTool },
              { id: 'metadata', label: 'Caption & Info', icon: Tag },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as EditorTab)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tool Panel Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === 'filters' && (
              <FilterAdjustPanel
                editState={editState}
                onChange={handleEditStateChange}
              />
            )}

            {activeTab === 'crop' && (
              <CropTransformPanel
                editState={editState}
                onChange={handleEditStateChange}
                onReset={() =>
                  handleEditStateChange({
                    crop: { ...DEFAULT_EDIT_STATE.crop },
                    rotation: 0,
                    straighten: 0,
                    flipH: false,
                    flipV: false,
                  })
                }
              />
            )}

            {activeTab === 'markup' && (
              <MarkupTextPanel
                editState={editState}
                onChange={handleEditStateChange}
                activeDrawTool={activeDrawTool}
                setActiveDrawTool={setActiveDrawTool}
                drawColor={drawColor}
                setDrawColor={setDrawColor}
                drawSize={drawSize}
                setDrawSize={setDrawSize}
                drawOpacity={drawOpacity}
                setDrawOpacity={setDrawOpacity}
                selectedTextId={selectedTextId}
                setSelectedTextId={setSelectedTextId}
              />
            )}

            {activeTab === 'metadata' && (
              <CaptionMetadataPanel
                photo={photo}
                title={title}
                setTitle={setTitle}
                caption={caption}
                setCaption={setCaption}
                tags={tags}
                setTags={setTags}
                isFavorite={isFavorite}
                setIsFavorite={setIsFavorite}
                editState={editState}
                onChangeEditState={handleEditStateChange}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        photo={photo}
        editState={editState}
        caption={caption}
        title={title}
      />
    </div>
  );
}
