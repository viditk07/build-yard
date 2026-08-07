export type WallRect = { x: number; y: number; w: number; h: number };

/**
 * Detect wall geometry from a floor-plan raster image.
 * Runs entirely in the browser on a downsampled canvas:
 * grayscale -> Otsu threshold -> dark-pixel mask -> greedy rectangle merge.
 * Returned rects are in normalized 0..1 image coordinates.
 */
export function detectWallRects(
  img: HTMLImageElement,
  opts: { resolution?: number; sensitivity?: number } = {},
): WallRect[] {
  const W = Math.max(60, Math.min(320, Math.round(opts.resolution ?? 220)));
  const ratio = img.naturalHeight / img.naturalWidth || 1;
  const H = Math.max(20, Math.round(W * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0, W, H);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, W, H).data;
  } catch {
    return [];
  }

  const gray = new Uint8Array(W * H);
  const hist = new Array(256).fill(0) as number[];
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 4]!;
    const g = data[i * 4 + 1]!;
    const b = data[i * 4 + 2]!;
    const a = data[i * 4 + 3]!;
    // treat transparent as white paper
    const lum = a < 24 ? 255 : Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    gray[i] = lum;
    hist[lum]!++;
  }

  const threshold = otsu(hist, W * H) * (opts.sensitivity ?? 1);

  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) mask[i] = gray[i]! <= threshold ? 1 : 0;

  denoise(mask, W, H);

  // greedy horizontal runs, merged vertically where the run repeats
  const rects: WallRect[] = [];
  const open = new Map<string, WallRect>();
  for (let y = 0; y < H; y++) {
    const rowKeys = new Set<string>();
    let x = 0;
    while (x < W) {
      if (!mask[y * W + x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < W && mask[y * W + x]) x++;
      const key = `${start}:${x}`;
      rowKeys.add(key);
      const existing = open.get(key);
      if (existing) existing.h += 1;
      else open.set(key, { x: start, y, w: x - start, h: 1 });
    }
    for (const [key, rect] of open) {
      if (!rowKeys.has(key)) {
        rects.push(rect);
        open.delete(key);
      }
    }
    if (rects.length > 6000) break;
  }
  for (const rect of open.values()) rects.push(rect);

  // drop specks (text, dimension lines, hatching)
  const minArea = Math.max(3, Math.round((W * H) / 4000));
  return rects
    .filter((r) => r.w * r.h >= minArea)
    .slice(0, 4000)
    .map((r) => ({ x: r.x / W, y: r.y / H, w: r.w / W, h: r.h / H }));
}

function otsu(hist: number[], total: number): number {
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t]!;
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let bestVar = -1;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]!;
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t]!;
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > bestVar) {
      bestVar = between;
      best = t;
    }
  }
  return best;
}

/** Remove isolated pixels so scanned noise and small text don't become walls. */
function denoise(mask: Uint8Array, W: number, H: number) {
  const copy = mask.slice();
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!copy[i]) continue;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          n += copy[(y + dy) * W + x + dx]!;
        }
      if (n <= 1) mask[i] = 0;
    }
  }
}
