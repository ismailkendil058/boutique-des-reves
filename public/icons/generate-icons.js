/**
 * Icon Generator Script
 * Run: node public/icons/generate-icons.js
 * 
 * This script generates PWA icons in all required sizes.
 * It creates simple PNG placeholders with the brand color.
 * Replace these with your actual app icon for production.
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Minimal 1x1 PNG in each size with the brand purple color
// For production, replace with actual icon images
function createMinimalPNG(width, height, r, g, b) {
  // Create a minimal valid PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrType = Buffer.from('IHDR');
  const ihdrCrc = crc32(Buffer.concat([ihdrType, ihdrData]));
  const ihdrChunk = Buffer.alloc(4 + 4 + 13 + 4);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrType.copy(ihdrChunk, 4);
  ihdrData.copy(ihdrChunk, 8);
  ihdrCrc.copy(ihdrChunk, 21);
  
  // IDAT chunk - create raw image data
  const rawRow = [];
  for (let y = 0; y < height; y++) {
    rawRow.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      rawRow.push(r, g, b);
    }
  }
  const rawData = Buffer.from(rawRow);
  
  // Simple uncompressed deflate (stored blocks)
  const blocks = [];
  let offset = 0;
  while (offset < rawData.length) {
    const remaining = rawData.length - offset;
    const blockSize = Math.min(remaining, 65535);
    const isLast = (offset + blockSize >= rawData.length);
    const blockHeader = Buffer.alloc(5);
    blockHeader[0] = isLast ? 1 : 0;
    blockHeader.writeUInt16LE(blockSize, 1);
    blockHeader.writeUInt16LE(blockSize ^ 0xFFFF, 3);
    blocks.push(blockHeader);
    blocks.push(rawData.subarray(offset, offset + blockSize));
    offset += blockSize;
  }
  const compressed = Buffer.concat(blocks);
  
  // Adler32 checksum
  let a = 1, b2 = 0;
  for (let i = 0; i < rawData.length; i++) {
    a = (a + rawData[i]) % 65521;
    b2 = (b2 + a) % 65521;
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE((b2 << 16) | a, 0);
  
  const zlibData = Buffer.concat([Buffer.from([0x78, 0x01]), compressed, adler]);
  
  const idatType = Buffer.from('IDAT');
  const idatCrc = crc32(Buffer.concat([idatType, zlibData]));
  const idatChunk = Buffer.alloc(4 + 4 + zlibData.length + 4);
  idatChunk.writeUInt32BE(zlibData.length, 0);
  idatType.copy(idatChunk, 4);
  zlibData.copy(idatChunk, 8);
  idatCrc.copy(idatChunk, 8 + zlibData.length);
  
  // IEND chunk
  const iendType = Buffer.from('IEND');
  const iendCrc = crc32(iendType);
  const iendChunk = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68]);
  iendCrc.copy(iendChunk, 8);
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  crc = (crc ^ 0xFFFFFFFF) >>> 0;
  const result = Buffer.alloc(4);
  result.writeUInt32BE(crc, 0);
  return result;
}

// Brand color: #74367E -> RGB(116, 54, 126)
const R = 116, G = 54, B = 126;

const outputDir = __dirname;

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(outputDir, filename);
  const png = createMinimalPNG(size, size, R, G, B);
  fs.writeFileSync(filepath, png);
  console.log(`Created ${filename} (${size}x${size})`);
});

// Also create the maskable version (512x512 with safe zone)
const maskablePng = createMinimalPNG(512, 512, R, G, B);
fs.writeFileSync(path.join(outputDir, 'icon-maskable-512x512.png'), maskablePng);
console.log('Created icon-maskable-512x512.png (512x512)');

console.log('\nAll icons generated! Replace these with your actual app icon for production.');