import { EditState, FilterValues, PresetFilterName, DrawingStroke, TextLayer, FrameStyle } from './types';

// Preset filter definitions with adjustments
export const PRESET_FILTERS: Record<
  PresetFilterName,
  { label: string; description: string; filters: Partial<FilterValues> }
> = {
  none: {
    label: 'Original',
    description: 'No filters applied',
    filters: {},
  },
  vivid: {
    label: 'Vivid Boost',
    description: 'Vibrant colors and punchy contrast',
    filters: {
      brightness: 105,
      contrast: 120,
      saturation: 140,
      exposure: 5,
      sharpness: 15,
    },
  },
  golden: {
    label: 'Golden Hour',
    description: 'Warm glowing sunlight tones',
    filters: {
      brightness: 105,
      contrast: 105,
      saturation: 115,
      warmth: 45,
      sepia: 15,
      vignette: 15,
    },
  },
  noir: {
    label: 'Noir B&W',
    description: 'High contrast classic monochrome',
    filters: {
      grayscale: 100,
      contrast: 145,
      brightness: 95,
      vignette: 35,
      sharpness: 20,
    },
  },
  cyberpunk: {
    label: 'Cyberpunk',
    description: 'High contrast electric neon vibe',
    filters: {
      contrast: 135,
      saturation: 160,
      brightness: 95,
      warmth: -35,
      sharpness: 25,
      vignette: 25,
    },
  },
  vintage: {
    label: 'Vintage 90s',
    description: 'Nostalgic warm analog film feel',
    filters: {
      sepia: 35,
      contrast: 90,
      brightness: 105,
      saturation: 85,
      warmth: 20,
      vignette: 30,
    },
  },
  'teal-orange': {
    label: 'Teal & Orange',
    description: 'Modern cinematic Hollywood tone',
    filters: {
      contrast: 125,
      saturation: 130,
      brightness: 100,
      warmth: 15,
      sharpness: 20,
    },
  },
  pastel: {
    label: 'Pastel Glow',
    description: 'Soft dreamy low-contrast tones',
    filters: {
      brightness: 115,
      contrast: 85,
      saturation: 90,
      warmth: 10,
      blur: 0,
    },
  },
  dramatic: {
    label: 'Dramatic',
    description: 'Deep moody shadows and rich texture',
    filters: {
      contrast: 150,
      brightness: 90,
      saturation: 110,
      vignette: 45,
      sharpness: 30,
    },
  },
  cinematic: {
    label: 'Cinematic',
    description: 'Subtle wide-screen color grade',
    filters: {
      contrast: 115,
      saturation: 105,
      brightness: 98,
      warmth: -5,
      vignette: 20,
    },
  },
};

// Compute effective CSS filter string
export function getCssFilterString(filters: FilterValues): string {
  const parts: string[] = [];

  // Brightness: default 100%
  const effectiveBrightness = filters.brightness + filters.exposure;
  parts.push(`brightness(${Math.max(0, effectiveBrightness)}%)`);

  // Contrast: default 100%
  parts.push(`contrast(${filters.contrast}%)`);

  // Saturation: default 100%
  parts.push(`saturate(${filters.saturation}%)`);

  // Sepia: default 0%
  if (filters.sepia > 0) {
    parts.push(`sepia(${filters.sepia}%)`);
  }

  // Grayscale: default 0%
  if (filters.grayscale > 0) {
    parts.push(`grayscale(${filters.grayscale}%)`);
  }

  // Invert: default 0%
  if (filters.invert > 0) {
    parts.push(`invert(${filters.invert}%)`);
  }

  // Blur: default 0px
  if (filters.blur > 0) {
    parts.push(`blur(${filters.blur * 0.5}px)`);
  }

  // Warmth (hue-rotate & sepia tweak)
  if (filters.warmth !== 0) {
    if (filters.warmth > 0) {
      // Warm: rotate towards yellow/orange
      parts.push(`sepia(${filters.warmth * 0.3}%)`);
    } else {
      // Cool: hue rotate towards blue
      parts.push(`hue-rotate(${filters.warmth * 0.5}deg)`);
    }
  }

  return parts.join(' ');
}

// Draw an arrow on canvas
function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  headLength = 20
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

// Render complete canvas pipeline to a target canvas
export function renderCanvasPipeline({
  sourceImage,
  targetCanvas,
  editState,
  caption,
  maxDimension,
}: {
  sourceImage: HTMLImageElement;
  targetCanvas: HTMLCanvasElement;
  editState: EditState;
  caption?: string;
  maxDimension?: number;
}): void {
  const origW = sourceImage.naturalWidth || sourceImage.width;
  const origH = sourceImage.naturalHeight || sourceImage.height;

  // 1. Calculate Crop source coordinates
  const crop = editState.crop;
  const cropX = (crop.x / 100) * origW;
  const cropY = (crop.y / 100) * origH;
  const cropW = Math.max(10, (crop.width / 100) * origW);
  const cropH = Math.max(10, (crop.height / 100) * origH);

  // 2. Check rotation swap
  const is90or270 = editState.rotation === 90 || editState.rotation === 270;
  let renderW = is90or270 ? cropH : cropW;
  let renderH = is90or270 ? cropW : cropH;

  // Downscale if maxDimension is provided (for responsive viewport/preview)
  let scale = 1;
  if (maxDimension) {
    const maxSide = Math.max(renderW, renderH);
    if (maxSide > maxDimension) {
      scale = maxDimension / maxSide;
      renderW = Math.round(renderW * scale);
      renderH = Math.round(renderH * scale);
    }
  }

  // 3. Handle Framing / Polaroid margins
  let frameMarginTop = 0;
  let frameMarginBottom = 0;
  let frameMarginSides = 0;
  const frameStyle: FrameStyle = editState.frame;

  if (frameStyle === 'polaroid') {
    frameMarginSides = Math.round(renderW * 0.06);
    frameMarginTop = Math.round(renderH * 0.06);
    frameMarginBottom = Math.round(renderH * 0.22); // Extra space for handwriting/caption
  } else if (frameStyle === 'minimal-white' || frameStyle === 'dark-film') {
    frameMarginSides = Math.round(renderW * 0.05);
    frameMarginTop = Math.round(renderH * 0.05);
    frameMarginBottom = Math.round(renderH * 0.05);
  }

  const finalCanvasW = renderW + frameMarginSides * 2;
  const finalCanvasH = renderH + frameMarginTop + frameMarginBottom;

  targetCanvas.width = Math.max(1, finalCanvasW);
  targetCanvas.height = Math.max(1, finalCanvasH);

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, finalCanvasW, finalCanvasH);

  // Draw Frame Background
  if (frameStyle === 'polaroid' || frameStyle === 'minimal-white') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, finalCanvasW, finalCanvasH);
  } else if (frameStyle === 'dark-film') {
    ctx.fillStyle = '#12131A';
    ctx.fillRect(0, 0, finalCanvasW, finalCanvasH);
  }

  // Intermediate canvas for cropped, rotated & filtered image
  const imgCanvas = document.createElement('canvas');
  imgCanvas.width = renderW;
  imgCanvas.height = renderH;
  const imgCtx = imgCanvas.getContext('2d');

  if (imgCtx) {
    imgCtx.save();
    imgCtx.imageSmoothingEnabled = true;
    imgCtx.imageSmoothingQuality = 'high';

    // Apply Filter string
    imgCtx.filter = getCssFilterString(editState.filters);

    // Apply Transforms (translation & rotation)
    imgCtx.translate(renderW / 2, renderH / 2);

    const totalAngle = ((editState.rotation + editState.straighten) * Math.PI) / 180;
    imgCtx.rotate(totalAngle);

    const scaleX = editState.flipH ? -1 : 1;
    const scaleY = editState.flipV ? -1 : 1;
    imgCtx.scale(scaleX, scaleY);

    const drawW = is90or270 ? renderH : renderW;
    const drawH = is90or270 ? renderW : renderH;

    imgCtx.drawImage(sourceImage, cropX, cropY, cropW, cropH, -drawW / 2, -drawH / 2, drawW, drawH);

    imgCtx.restore();

    // Apply Vignette if any
    if (editState.filters.vignette > 0) {
      imgCtx.save();
      const vignetteGrad = imgCtx.createRadialGradient(
        renderW / 2,
        renderH / 2,
        Math.min(renderW, renderH) * 0.3,
        renderW / 2,
        renderH / 2,
        Math.max(renderW, renderH) * 0.7
      );
      const intensity = editState.filters.vignette / 100;
      vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vignetteGrad.addColorStop(1, `rgba(0,0,0,${intensity * 0.85})`);

      imgCtx.fillStyle = vignetteGrad;
      imgCtx.fillRect(0, 0, renderW, renderH);
      imgCtx.restore();
    }

    // Draw image to final canvas within framed bounds
    ctx.drawImage(imgCanvas, frameMarginSides, frameMarginTop, renderW, renderH);
  }

  // 4. Render Drawings & Markup on top of the image area
  if (editState.drawings && editState.drawings.length > 0) {
    ctx.save();
    ctx.translate(frameMarginSides, frameMarginTop);

    for (const stroke of editState.drawings) {
      if (!stroke.points || stroke.points.length === 0) continue;

      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = Math.max(2, (stroke.size / 100) * (renderW / 20));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;

      if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.lineWidth = Math.max(12, (stroke.size / 100) * (renderW / 10));
      }

      if (stroke.tool === 'brush' || stroke.tool === 'highlighter') {
        ctx.beginPath();
        const startX = (stroke.points[0].x / 100) * renderW;
        const startY = (stroke.points[0].y / 100) * renderH;
        ctx.moveTo(startX, startY);

        for (let i = 1; i < stroke.points.length; i++) {
          const ptX = (stroke.points[i].x / 100) * renderW;
          const ptY = (stroke.points[i].y / 100) * renderH;
          ctx.lineTo(ptX, ptY);
        }
        ctx.stroke();
      } else if (stroke.tool === 'arrow' && stroke.points.length >= 2) {
        const from = stroke.points[0];
        const to = stroke.points[stroke.points.length - 1];
        drawArrow(
          ctx,
          (from.x / 100) * renderW,
          (from.y / 100) * renderH,
          (to.x / 100) * renderW,
          (to.y / 100) * renderH,
          renderW * 0.03
        );
      } else if (stroke.tool === 'rect' && stroke.points.length >= 2) {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        const rx = (Math.min(p1.x, p2.x) / 100) * renderW;
        const ry = (Math.min(p1.y, p2.y) / 100) * renderH;
        const rw = (Math.abs(p2.x - p1.x) / 100) * renderW;
        const rh = (Math.abs(p2.y - p1.y) / 100) * renderH;
        ctx.strokeRect(rx, ry, rw, rh);
      } else if (stroke.tool === 'circle' && stroke.points.length >= 2) {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        const cx = ((p1.x + p2.x) / 2 / 100) * renderW;
        const cy = ((p1.y + p2.y) / 2 / 100) * renderH;
        const rx = (Math.abs(p2.x - p1.x) / 2 / 100) * renderW;
        const ry = (Math.abs(p2.y - p1.y) / 2 / 100) * renderH;

        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  // 5. Render Text Layers
  if (editState.textLayers && editState.textLayers.length > 0) {
    ctx.save();
    ctx.translate(frameMarginSides, frameMarginTop);

    for (const layer of editState.textLayers) {
      if (!layer.text.trim()) continue;

      ctx.save();
      const posX = (layer.x / 100) * renderW;
      const posY = (layer.y / 100) * renderH;
      const fontSizePx = Math.max(12, Math.round((layer.fontSize / 400) * renderW));

      ctx.font = `${layer.fontWeight === 'bold' ? 'bold ' : ''}${fontSizePx}px ${
        layer.fontFamily || 'sans-serif'
      }`;
      ctx.textAlign = layer.textAlign || 'left';
      ctx.textBaseline = 'middle';

      const metrics = ctx.measureText(layer.text);
      const textWidth = metrics.width;
      const textHeight = fontSizePx * 1.3;

      // Draw background pill if configured
      if (layer.bgColor && layer.bgColor !== 'transparent') {
        ctx.fillStyle = layer.bgColor;
        const padX = fontSizePx * 0.4;
        const padY = fontSizePx * 0.2;

        let bgX = posX - padX;
        if (layer.textAlign === 'center') bgX = posX - textWidth / 2 - padX;
        if (layer.textAlign === 'right') bgX = posX - textWidth - padX;

        const bgY = posY - textHeight / 2 - padY;
        const bgW = textWidth + padX * 2;
        const bgH = textHeight + padY * 2;

        // Rounded pill
        ctx.beginPath();
        const r = 8;
        ctx.roundRect ? ctx.roundRect(bgX, bgY, bgW, bgH, r) : ctx.rect(bgX, bgY, bgW, bgH);
        ctx.fill();
      }

      // Draw shadow
      if (layer.hasShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text, posX, posY);

      ctx.restore();
    }

    ctx.restore();
  }

  // 6. Polaroid Caption or Burn-in Caption
  if (frameStyle === 'polaroid' && caption && caption.trim()) {
    ctx.save();
    const captionAreaY = renderH + frameMarginTop + frameMarginBottom * 0.45;
    const captionSize = Math.max(14, Math.round(renderW * 0.038));

    ctx.font = `italic ${captionSize}px "Caveat", "Segoe Print", "Comic Sans MS", cursive, sans-serif`;
    ctx.fillStyle = '#222222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Wrap caption text if needed
    const maxTextWidth = renderW * 0.85;
    const words = caption.split(' ');
    let line = '';
    const lines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxTextWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    // Render max 2 lines on polaroid
    const displayLines = lines.slice(0, 2);
    displayLines.forEach((l, idx) => {
      ctx.fillText(l, finalCanvasW / 2, captionAreaY + idx * (captionSize * 1.2));
    });

    ctx.restore();
  } else if ((editState.burnCaption || editState.frame === 'caption-badge') && caption && caption.trim()) {
    // Stylish lower third caption banner
    ctx.save();
    const bannerHeight = Math.max(36, Math.round(renderH * 0.12));
    const bannerY = frameMarginTop + renderH - bannerHeight;

    // Gradient background for lower third
    const grad = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerHeight);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

    ctx.fillStyle = grad;
    ctx.fillRect(frameMarginSides, bannerY, renderW, bannerHeight);

    const captionSize = Math.max(13, Math.round(renderW * 0.032));
    ctx.font = `500 ${captionSize}px sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;

    const truncated =
      caption.length > 80 ? caption.slice(0, 77) + '...' : caption;
    ctx.fillText(
      truncated,
      frameMarginSides + renderW * 0.04,
      bannerY + bannerHeight * 0.65
    );

    ctx.restore();
  }
}

// Convert canvas output to image Blob
export async function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/jpeg',
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create Blob from canvas'));
        }
      },
      format,
      quality
    );
  });
}

// Load Image Element from a Blob
export async function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image from Blob'));
    };

    img.src = url;
  });
}
