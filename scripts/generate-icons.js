/* eslint-disable */
// Gera assets placeholder Ford-blue (icon, splash-icon, favicon, adaptive-icon).
// Sem dependencias externas alem de pngjs (transitiva). Rodar uma vez:
//   node scripts/generate-icons.js
// Os arquivos PNG ficam em assets/images/.

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const FORD_BLUE = [0x00, 0x34, 0x78, 0xff];
const FORD_BLUE_LIGHT = [0x1f, 0x6f, 0xeb, 0xff];
const BG_BASE = [0x0a, 0x0e, 0x14, 0xff];
const WHITE = [0xf5, 0xf7, 0xfa, 0xff];
const TRANSPARENT = [0, 0, 0, 0];

function setPixel(png, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function fill(png, color) {
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      setPixel(png, x, y, color);
    }
  }
}

function fillRect(png, x0, y0, w, h, color) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPixel(png, x, y, color);
    }
  }
}

// Stencil "F" simples baseado em retangulos. Coordenadas relativas (0..1).
// Assinatura visual minima: barra vertical + dois bracos horizontais.
function drawF(png, color) {
  const W = png.width;
  const H = png.height;
  const cx = W / 2;
  const cy = H / 2;
  const fW = W * 0.5;
  const fH = H * 0.62;
  const x0 = Math.round(cx - fW / 2);
  const y0 = Math.round(cy - fH / 2);
  const stem = Math.max(2, Math.round(fW * 0.22));

  // Barra vertical
  fillRect(png, x0, y0, stem, Math.round(fH), color);
  // Braco superior (largo)
  fillRect(png, x0, y0, Math.round(fW), stem, color);
  // Braco do meio (mais curto)
  fillRect(
    png,
    x0,
    Math.round(y0 + fH * 0.42),
    Math.round(fW * 0.7),
    Math.round(stem * 0.85),
    color,
  );
}

function makePng(width, height, bg, drawFg) {
  const png = new PNG({ width, height });
  fill(png, bg);
  if (drawFg) drawFg(png);
  return png;
}

function writePng(png, file) {
  const out = path.resolve(__dirname, '..', 'assets', 'images', file);
  png.pack().pipe(fs.createWriteStream(out));
  console.log('wrote', file, `${png.width}x${png.height}`);
}

// 1) icon.png 1024x1024 — fundo Ford-blue + monograma "F" branco
{
  const png = makePng(1024, 1024, FORD_BLUE, (p) => drawF(p, WHITE));
  writePng(png, 'icon.png');
}

// 2) splash-icon.png 200x200 — fundo transparente + "F" Ford-blue-light
{
  const png = makePng(200, 200, TRANSPARENT, (p) => drawF(p, FORD_BLUE_LIGHT));
  writePng(png, 'splash-icon.png');
}

// 3) favicon.png 48x48 — fundo Ford-blue + "F" branco
{
  const png = makePng(48, 48, FORD_BLUE, (p) => drawF(p, WHITE));
  writePng(png, 'favicon.png');
}

// 4) android-icon-foreground.png 432x432 — "F" Ford-blue-light em fundo transparente
{
  const png = makePng(432, 432, TRANSPARENT, (p) => drawF(p, FORD_BLUE_LIGHT));
  writePng(png, 'android-icon-foreground.png');
}

// 5) android-icon-background.png 432x432 — fundo Ford-blue solido
{
  const png = makePng(432, 432, FORD_BLUE);
  writePng(png, 'android-icon-background.png');
}

// 6) android-icon-monochrome.png 432x432 — apenas a forma do "F" em branco solido
//    (Android Themed Icons usa luminance como mask)
{
  const png = makePng(432, 432, TRANSPARENT, (p) => drawF(p, WHITE));
  writePng(png, 'android-icon-monochrome.png');
}
