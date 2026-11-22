#!/usr/bin/env node
/**
 * Derives every brand image the site needs from brand/logo-source.png (the owner's original logo,
 * transparent background). Re-run after replacing the source:  npm run brand:build
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(root, "brand", "logo-source.png");
const OUT = join(root, "apps", "web", "public", "brand");

/** Crop of the full lock-up and of the round mark alone, in source pixels (measured from the artwork). */
const FULL = { left: 204, top: 300, width: 1044, height: 372 };
const MARK = { left: 204, top: 300, width: 408, height: 372 };
const OG = { width: 1200, height: 630 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

mkdirSync(OUT, { recursive: true });

/** Artwork scaled to fit inside a canvas of exactly width x height, centred, with `pad` as the margin share. */
async function onCanvas(crop, width, height, pad, background) {
  const art = await sharp(SOURCE)
    .extract(crop)
    .resize({ width: Math.round(width * (1 - pad * 2)), height: Math.round(height * (1 - pad * 2)), fit: "inside" })
    .png()
    .toBuffer();
  return sharp({ create: { width, height, channels: 4, background } }).composite([{ input: art, gravity: "centre" }]);
}

const jobs = {
  "logo.png": sharp(SOURCE).extract(FULL).resize({ width: 640 }),
  "mark.png": sharp(SOURCE).extract(MARK).resize({ height: 240 }),
  "favicon-32.png": await onCanvas(MARK, 32, 32, 0.02, CLEAR),
  "favicon-192.png": await onCanvas(MARK, 192, 192, 0.04, CLEAR),
  "apple-touch-icon.png": await onCanvas(MARK, 180, 180, 0.14, WHITE),
  "og.png": (await onCanvas(FULL, OG.width, OG.height, 0.2, WHITE)).flatten({ background: WHITE }),
};

for (const [name, image] of Object.entries(jobs)) {
  const { size, width, height } = await image.png({ palette: true, quality: 92, compressionLevel: 9 }).toFile(join(OUT, name));
  console.log(`${name.padEnd(22)} ${width}x${height}  ${(size / 1024).toFixed(1)} KB`);
}
