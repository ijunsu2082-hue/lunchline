// draws the logo as a png in any color
import { deflateSync } from "node:zlib";

// png checksum stuff
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
// one png chunk
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

// is the point inside a rounded box
const rrect = (x, y, x0, y0, w, h, r) => {
  if (x < x0 || x > x0 + w || y < y0 || y > y0 + h) return false;
  const cx = x < x0 + r ? x0 + r : x > x0 + w - r ? x0 + w - r : x, cy = y < y0 + r ? y0 + r : y > y0 + h - r ? y0 + h - r : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
// small distance helpers
const dist = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);
const segDist = (x, y, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - (ax + t * dx), y - (ay + t * dy)); };

// the logo shapes
const BG = (x, y) => rrect(x, y, 0, 0, 64, 64, 18);
const FORK = (x, y) =>
  rrect(x, y, 19, 11, 5, 20, 2.5) || rrect(x, y, 29.5, 11, 5, 20, 2.5) || rrect(x, y, 40, 11, 5, 20, 2.5) ||
  (y >= 27 && y <= 29 && x >= 19 && x <= 45) ||
  (y > 29 && y <= 40 && ((x < 30 && x >= 19 && dist(x, y, 30, 29) <= 11) || (x >= 30 && x <= 34) || (x > 34 && x <= 45 && dist(x, y, 34, 29) <= 11))) ||
  rrect(x, y, 29, 36, 6, 18, 3);
const DISC = (x, y) => dist(x, y, 47, 46) <= 9;
const CHECK = (x, y) => Math.min(segDist(x, y, 43, 46.5, 45.6, 49.1), segDist(x, y, 45.6, 49.1, 50.6, 43.9)) <= 1.3;

// color helpers
const hexToRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const luminance = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

// draw it
export function logoPng(hex = "#FF5A1F", size = 128) {
  const brand = hexToRgb(hex), ink = luminance(brand) > 0.62 ? [31, 26, 23] : [255, 255, 255];
  const layers = [[BG, brand], [FORK, ink], [DISC, [11, 11, 13]], [CHECK, [255, 255, 255]]];
  const SS = 4, scale = 64 / size, raw = Buffer.alloc(size * (size * 4 + 1));
  // go through every pixel
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0; // no filter
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      // blur the edges by sampling a few points
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const x = (px + (sx + .5) / SS) * scale, y = (py + (sy + .5) / SS) * scale;
        let color = null;
        for (const [inside, c] of layers) if (inside(x, y)) color = c;
        if (color) { r += color[0]; g += color[1]; b += color[2]; a++; }
      }
      const o = py * (size * 4 + 1) + 1 + px * 4;
      if (a) { raw[o] = Math.round(r / a); raw[o + 1] = Math.round(g / a); raw[o + 2] = Math.round(b / a); raw[o + 3] = Math.round((a / (SS * SS)) * 255); }
    }
  }
  const head = Buffer.alloc(13); head.writeUInt32BE(size, 0); head.writeUInt32BE(size, 4); head[8] = 8; head[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", head), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// black or white text for a color
export const inkOn = hex => (luminance(hexToRgb(hex)) > 0.62 ? "#1F1A17" : "#FFFFFF");
