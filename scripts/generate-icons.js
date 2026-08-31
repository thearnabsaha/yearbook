const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create PNG buffer from raw RGBA pixel data
function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // color type 6 (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw scanlines with filter byte 0 (None)
  const rowBytes = width * 4;
  const scanlines = Buffer.alloc(height * (rowBytes + 1));

  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (rowBytes + 1);
    scanlines[scanlineOffset] = 0; // Filter: None
    rgbaBuffer.copy(scanlines, scanlineOffset + 1, y * rowBytes, (y + 1) * rowBytes);
  }

  const compressedData = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeUInt32BE(crc >>> 0, 8 + length);
  return buffer;
}

// CRC32 table & calculation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

// Generate icon with gradient, rounded square, camera lens aperture
function generateAppIcon(size) {
  const buffer = Buffer.alloc(size * size * 4);
  const radius = size * 0.22;
  const center = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Rounded rectangle check
      let inBounds = true;
      const dx = Math.abs(x - center) - (center - radius);
      const dy = Math.abs(y - center) - (center - radius);

      if (dx > 0 && dy > 0) {
        if (Math.hypot(dx, dy) > radius) {
          inBounds = false;
        }
      }

      if (!inBounds) {
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
        continue;
      }

      // Background Gradient (Indigo -> Purple -> Coral)
      const gradT = (x + y) / (size * 2);
      const r = Math.round(99 + (236 - 99) * gradT);
      const g = Math.round(102 + (72 - 102) * gradT);
      const b = Math.round(241 + (153 - 241) * gradT);

      // Distance from center for camera lens
      const distFromCenter = Math.hypot(x - center, y - center);
      const lensOuter = size * 0.32;
      const lensInner = size * 0.24;
      const lensCore = size * 0.12;

      // Draw camera body / lens elements
      if (distFromCenter >= lensInner && distFromCenter <= lensOuter) {
        // Outer lens ring (white)
        buffer[idx] = 255;
        buffer[idx + 1] = 255;
        buffer[idx + 2] = 255;
        buffer[idx + 3] = 240;
      } else if (distFromCenter < lensCore) {
        // Center aperture glow
        buffer[idx] = 255;
        buffer[idx + 1] = 210;
        buffer[idx + 2] = 120;
        buffer[idx + 3] = 255;
      } else if (distFromCenter < lensInner) {
        // Dark lens glass
        buffer[idx] = 15;
        buffer[idx + 1] = 18;
        buffer[idx + 2] = 30;
        buffer[idx + 3] = 220;
      } else {
        // Main gradient body
        buffer[idx] = r;
        buffer[idx + 1] = g;
        buffer[idx + 2] = b;
        buffer[idx + 3] = 255;
      }

      // Small flash indicator top-right
      const flashX = center + size * 0.22;
      const flashY = center - size * 0.24;
      if (Math.hypot(x - flashX, y - flashY) < size * 0.04) {
        buffer[idx] = 255;
        buffer[idx + 1] = 255;
        buffer[idx + 2] = 255;
        buffer[idx + 3] = 255;
      }
    }
  }

  return createPng(size, size, buffer);
}

const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), generateAppIcon(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), generateAppIcon(512));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), generateAppIcon(180));
fs.writeFileSync(path.join(iconsDir, 'favicon.png'), generateAppIcon(64));

console.log('App icons generated successfully!');
