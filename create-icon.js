const { nativeImage } = require('electron');
const fs = require('fs');

const size = 16;
const canvas = Buffer.alloc(size * size * 4);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const dx = x - size/2, dy = y - size/2;
    const idx = (y * size + x) * 4;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < size/2 - 1) {
      canvas[idx] = 255; canvas[idx+1] = 107; canvas[idx+2] = 107; canvas[idx+3] = 255;
    } else {
      canvas[idx+3] = 0;
    }
  }
}
const img = nativeImage.createFromBuffer(canvas, { width: size, height: size });
fs.writeFileSync('icon.png', img.toPNG());
console.log('Icon created');