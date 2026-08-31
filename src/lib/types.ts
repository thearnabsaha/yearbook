export interface FilterValues {
  brightness: number; // 0 - 200, default 100
  contrast: number; // 0 - 200, default 100
  saturation: number; // 0 - 200, default 100
  warmth: number; // -100 - 100, default 0 (color temperature shift)
  exposure: number; // -100 - 100, default 0
  sepia: number; // 0 - 100, default 0
  grayscale: number; // 0 - 100, default 0
  blur: number; // 0 - 20, default 0
  invert: number; // 0 - 100, default 0
  vignette: number; // 0 - 100, default 0
  sharpness: number; // 0 - 100, default 0
}

export type PresetFilterName =
  | 'none'
  | 'vivid'
  | 'golden'
  | 'noir'
  | 'cyberpunk'
  | 'vintage'
  | 'teal-orange'
  | 'pastel'
  | 'dramatic'
  | 'cinematic';

export interface CropState {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
  aspectRatio: string; // 'free' | '1:1' | '4:5' | '16:9' | '9:16' | '4:3' | '3:2' | 'circle'
}

export interface DrawingPoint {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
}

export interface DrawingStroke {
  id: string;
  tool: 'brush' | 'arrow' | 'rect' | 'circle' | 'highlighter';
  color: string;
  size: number;
  opacity: number;
  points: DrawingPoint[];
}

export interface TextLayer {
  id: string;
  text: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  fontSize: number; // base px
  color: string;
  bgColor?: string;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  hasShadow?: boolean;
}

export type FrameStyle = 'none' | 'polaroid' | 'minimal-white' | 'dark-film' | 'caption-badge';

export interface EditState {
  crop: CropState;
  rotation: number; // 0, 90, 180, 270
  straighten: number; // -45 to 45
  flipH: boolean;
  flipV: boolean;
  filters: FilterValues;
  preset: PresetFilterName;
  drawings: DrawingStroke[];
  textLayers: TextLayer[];
  frame: FrameStyle;
  burnCaption: boolean;
}

export interface PhotoRecord {
  id: string;
  title: string;
  caption: string;
  tags: string[];
  originalBlob: Blob;
  editedBlob?: Blob;
  thumbnailBlob: Blob;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  isFavorite: boolean;
  albumId?: string;
  editState: EditState;
  createdAt: number;
  updatedAt: number;
}

export interface AlbumRecord {
  id: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  createdAt: number;
}

// ==========================================
// SECTION 1: PHOTO YEARBOOK & MULTI-PROJECT MODELS
// ==========================================

export type YearbookAspectRatio = '9:16' | '16:9' | '1:1' | '4:5' | 'free';

export interface YearbookProject {
  id: string; // e.g. "yb_default" or "yb_timestamp"
  title: string; // e.g. "My 2026 Daily Transformation"
  description?: string;
  aspectRatio: YearbookAspectRatio; // Default framing ratio
  startDate: string; // "YYYY-MM-DD"
  createdAt: number;
  updatedAt: number;
}

export interface YearbookAlignment {
  offsetX: number; // -50 to 50 (percentage shift horizontally)
  offsetY: number; // -50 to 50 (percentage shift vertically)
  scale: number; // 0.5 to 3.0 (zoom factor)
  rotation: number; // 0, 90, 180, 270
}

export const DEFAULT_ALIGNMENT: YearbookAlignment = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0,
};

export interface YearbookEntry {
  id: string; // e.g. "yearbook_ybId_YYYY-MM-DD"
  yearbookId: string; // parent YearbookProject id
  date: string; // "YYYY-MM-DD"
  photoBlob: Blob;
  thumbnailBlob: Blob;
  caption: string;
  captionY: number; // vertical position in percentage (0 to 100, default 70)
  captionStyle: 'snapchat' | 'minimal' | 'badge' | 'neon';
  aspectRatio: YearbookAspectRatio;
  showDateStamp: boolean;
  showDayCount: boolean;
  alignment: YearbookAlignment;
  crop?: CropState;
  filters?: FilterValues;
  preset?: PresetFilterName;
  rotation?: number;
  createdAt: number;
  updatedAt: number;
}

export interface StorageQuotaInfo {
  usage: number; // in bytes
  quota: number; // in bytes
  percentUsed: number;
  usageFormatted: string;
  quotaFormatted: string;
}

export const DEFAULT_FILTERS: FilterValues = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  exposure: 0,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  invert: 0,
  vignette: 0,
  sharpness: 0,
};

export const DEFAULT_CROP: CropState = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  aspectRatio: 'free',
};

export const DEFAULT_EDIT_STATE: EditState = {
  crop: DEFAULT_CROP,
  rotation: 0,
  straighten: 0,
  flipH: false,
  flipV: false,
  filters: DEFAULT_FILTERS,
  preset: 'none',
  drawings: [],
  textLayers: [],
  frame: 'none',
  burnCaption: false,
};
