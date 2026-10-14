// Draws the Zeste icon (a lemon slice on green) and writes every size the app needs.
// Run with: node scripts/make-icons.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const GREEN = '#2f7d4f';

/** The lemon slice, centred at 256,256, scaled to `size` (radius of the rind). */
function slice(radius) {
  const flesh = radius * 0.79;
  const segments = Array.from({ length: 8 }, (_, i) => {
    const a = ((22.5 + i * 45) * Math.PI) / 180;
    const x = (Math.cos(a) * flesh).toFixed(1);
    const y = (Math.sin(a) * flesh).toFixed(1);
    return `<line x1="0" y1="0" x2="${x}" y2="${y}" />`;
  }).join('');
  return `
    <g transform="translate(256 256)">
      <circle r="${radius}" fill="#f6d743" />
      <circle r="${radius * 0.86}" fill="#fff4b8" />
      <circle r="${flesh}" fill="#f9e27a" />
      <g stroke="#fff4b8" stroke-width="${radius * 0.07}" stroke-linecap="round">${segments}</g>
      <circle r="${radius * 0.09}" fill="#fff4b8" />
    </g>`;
}

/** Rounded square, for browsers and the favicon. */
const standard = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${GREEN}" />${slice(160)}
</svg>`;

/** Full-bleed square with the slice inside the safe zone, for Android's masked icons. */
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${GREEN}" />${slice(130)}
</svg>`;

function png(svg, size, file) {
  const out = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(file, out);
  console.log('wrote', file);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/favicon.svg', standard);
png(standard, 192, 'public/icons/icon-192.png');
png(standard, 512, 'public/icons/icon-512.png');
png(maskable, 512, 'public/icons/maskable-512.png');
png(maskable, 180, 'public/icons/apple-touch-icon.png');
png(standard, 48, 'public/icons/favicon-48.png');
