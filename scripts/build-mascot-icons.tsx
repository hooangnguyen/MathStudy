/**
 * Tạo icon PWA (public/pwa-*.svg) từ linh vật: nền tím bo góc + đầu khủng long.
 * Chạy lại sau khi sửa linh vật:  npx tsx scripts/build-mascot-icons.tsx
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Mascot } from '../src/components/mascot/Mascot';

const inner = renderToStaticMarkup(<Mascot mood="happy" still />)
  // chỉ lấy phần đầu + thân trên, phóng to cho rõ ở cỡ icon nhỏ
  .replace(/viewBox="[^"]*"/, 'viewBox="26 6 148 148"')
  .replace(/ class="[^"]*"/, '')
  .replace(/ style="[^"]*"/, '')
  .replace(/ role="img"/, '')
  .replace(/ aria-label="[^"]*"/, '');

for (const size of [192, 512]) {
  const pad = Math.round(size * 0.08);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#4f46e5"/>
  ${inner.replace('<svg', `<svg x="${pad}" y="${pad + Math.round(size * 0.03)}" width="${size - 2 * pad}" height="${size - 2 * pad}"`)}
</svg>
`;
  writeFileSync(`public/pwa-${size}x${size}.svg`, svg);
}
console.log('Đã tạo public/pwa-192x192.svg và public/pwa-512x512.svg');
