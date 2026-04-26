import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'fs'

const SIZES = [192, 512]

function makeSVG(size) {
  const fontSize = Math.round(size * 0.32)
  const letterSpacing = Math.round(size * 0.02)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#0A0A0A"/>
  <!-- Subtle gradient overlay -->
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A1A1A"/>
      <stop offset="100%" stop-color="#0A0A0A"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#g)"/>
  <!-- CH text -->
  <text
    x="50%"
    y="54%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-weight="800"
    font-size="${fontSize}"
    letter-spacing="${letterSpacing}"
    fill="#E8A87C"
  >CH</text>
</svg>`
}

mkdirSync('public/icons', { recursive: true })

for (const size of SIZES) {
  const svg = Buffer.from(makeSVG(size))
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`)
  console.log(`✓ icon-${size}.png`)
}

console.log('Icons generated.')
