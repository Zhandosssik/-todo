const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 192, 512];
for (const size of sizes) {
  const out = path.join(iconsDir, `icon-${size}.png`);
  if (!fs.existsSync(out)) {
    fs.writeFileSync(out, createMinimalPng(size, size));
  }
}

const badge = path.join(iconsDir, 'badge-72.png');
if (!fs.existsSync(badge)) {
  fs.writeFileSync(badge, createMinimalPng(72, 72));
}

function createMinimalPng(w, h) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = createChunk('IHDR', Buffer.from([
    (w >> 24) & 255, (w >> 16) & 255, (w >> 8) & 255, w & 255,
    (h >> 24) & 255, (h >> 16) & 255, (h >> 8) & 255, h & 255,
    8, 2, 0, 0, 0,
  ]));

  const rowSize = 1 + w * 3;
  const raw = Buffer.alloc(rowSize * h);
  for (let y = 0; y < h; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    for (let x = 0; x < w; x++) {
      const px = rowStart + 1 + x * 3;
      const cx = w / 2;
      const cy = h / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < w * 0.35) {
        raw[px] = 255;
        raw[px + 1] = 77;
        raw[px + 2] = 0;
      } else {
        raw[px] = 8;
        raw[px + 1] = 8;
        raw[px + 2] = 8;
      }
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return ~c;
}

console.log('Icons generated');
