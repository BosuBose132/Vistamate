export const CARD_RATIO = 1.58; // typical business card W/H
export const RATIO_TOL = 0.6; // detector tolerance (shape score, not UI gate)
export const MIN_AREA_FRAC = 0.0018; // min quad area vs frame
export const WARP_W = 1000;
export const WARP_H = Math.round(WARP_W / CARD_RATIO);

export function matToBase64(mat) {
  const cv = globalThis.cv;
  const png = new cv.Mat();
  cv.imencode('.png', mat, png);
  const bytes = new Uint8Array(png.data);
  let binary = '';
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  png.delete();
  return 'data:image/png;base64,' + btoa(binary);
}

export function cleanup(list) {
  for (const m of list) {
    if (m && typeof m.delete === 'function') {
      try {
        m.delete();
      } catch {}
    }
  }
}

// --- geometry helpers used by UI gating ---
export function bboxOfQuad(quad) {
  const xs = quad.map((p) => p[0]),
    ys = quad.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function iouRect(a, b) {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}
function orderQuadClockwise(quad) {
  const pts = quad.map((p) => ({ x: p[0], y: p[1] }));
  const cx = pts.reduce((a, p) => a + p.x, 0) / 4;
  const cy = pts.reduce((a, p) => a + p.y, 0) / 4;
  pts.sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)
  );
  // Ensure consistent start (top-left-ish)
  pts.sort((a, b) => a.x + a.y - (b.x + b.y));
  return [
    [pts[0].x, pts[0].y],
    [pts[1].x, pts[1].y],
    [pts[2].x, pts[2].y],
    [pts[3].x, pts[3].y],
  ];
}

function edgeLength(a, b) {
  const dx = a[0] - b[0],
    dy = a[1] - b[1];
  return Math.hypot(dx, dy);
}
function quadEdgeSanity(quad, cols, rows) {
  const minEdge = 0.04 * Math.min(cols, rows); // each edge ≥ 4% of min dimension
  const edges = [
    [quad[0], quad[1]],
    [quad[1], quad[2]],
    [quad[2], quad[3]],
    [quad[3], quad[0]],
  ];
  return edges.every(([p, q]) => edgeLength(p, q) >= minEdge);
}

// --- candidate selection (kept lightweight) ---
function approxQuad(cv, contour) {
  const peri = cv.arcLength(contour, true);
  const poly = new cv.Mat();
  cv.approxPolyDP(contour, poly, 0.02 * peri, true);
  if (poly.rows === 4 && cv.isContourConvex(poly)) {
    const quad = [];
    for (let i = 0; i < 4; i++)
      quad.push([poly.intPtr(i, 0)[0], poly.intPtr(i, 0)[1]]);
    poly.delete();
    return quad;
  }
  poly.delete();
  return null;
}

export function pickBestQuad(contours, cols, rows) {
  const cv = globalThis.cv;
  const frameArea = cols * rows;
  let bestQuad = null,
    bestScore = -1;

  const tmp = new cv.Mat();
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    const area = cv.contourArea(c, false);
    if (area < MIN_AREA_FRAC * frameArea) continue;

    const quad = approxQuad(cv, c);
    if (!quad) continue;

    // score by rectangularity and area
    const bb = bboxOfQuad(quad);
    const ratio = bb.w / Math.max(1, bb.h);
    const ratioScore = Math.exp(
      -Math.abs(ratio - CARD_RATIO) / (CARD_RATIO * RATIO_TOL)
    );
    const areaFrac = (bb.w * bb.h) / frameArea;
    const score = ratioScore * areaFrac;

    if (score > bestScore) {
      bestScore = score;
      bestQuad = quad;
    }
  }
  tmp.delete();
  return { bestQuad, bestScore };
}

export function pickMinAreaRectFallback(contours, cols, rows) {
  const cv = globalThis.cv;
  const frameArea = cols * rows;
  let bestQuad = null,
    bestScore = -1;

  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    const rect = cv.minAreaRect(c);
    const area = rect.size.width * rect.size.height;
    if (area < MIN_AREA_FRAC * frameArea) continue;

    // convert rotated rect to quad
    const pts = cv.RotatedRect.points(rect);
    const quad = pts.map((p) => [Math.round(p.x), Math.round(p.y)]);

    const bb = bboxOfQuad(quad);
    const ratio = bb.w / Math.max(1, bb.h);
    const ratioScore = Math.exp(
      -Math.abs(ratio - CARD_RATIO) / (CARD_RATIO * RATIO_TOL)
    );
    const areaFrac = (bb.w * bb.h) / frameArea;
    const score = ratioScore * areaFrac;

    if (score > bestScore) {
      bestScore = score;
      bestQuad = quad;
    }
  }
  return { bestQuad, bestScore };
}

// --- warp (kept) ---
export function warpToCard(src, quad) {
  const cv = globalThis.cv;
  // order points roughly TL, TR, BR, BL (simple bbox sort; good enough once gated)
  const bb = bboxOfQuad(quad);
  const dstPts = cv.matFromArray(
    4,
    1,
    cv.CV_32FC2,
    new Float32Array([0, 0, WARP_W, 0, WARP_W, WARP_H, 0, WARP_H])
  );

  // map input quad to float32
  const flat = new Float32Array(8);
  for (let i = 0; i < 4; i++) {
    flat[i * 2] = quad[i][0];
    flat[i * 2 + 1] = quad[i][1];
  }
  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, flat);

  const M = cv.getPerspectiveTransform(srcPts, dstPts);
  const out = new cv.Mat();
  const dsize = new cv.Size(WARP_W, WARP_H);
  cv.warpPerspective(
    src,
    out,
    M,
    dsize,
    cv.INTER_LINEAR,
    cv.BORDER_REPLICATE,
    new cv.Scalar()
  );
  srcPts.delete();
  dstPts.delete();
  M.delete();
  return out;
}

function autoCannyThresholds(gray, k = 0.33) {
  const cv = globalThis.cv;
  const hist = new cv.Mat();
  const mask = new cv.Mat();
  cv.calcHist(gray, [0], mask, hist, [256], [0, 256]);
  let total = 0,
    half = (gray.rows * gray.cols) / 2,
    median = 0;
  for (let i = 0; i < 256; i++) {
    total += hist.floatAt(i, 0);
    if (total >= half) {
      median = i;
      break;
    }
  }
  hist.delete();
  mask.delete();
  const lower = Math.max(0, (1 - k) * median);
  const upper = Math.min(255, (1 + k) * median);
  return { lower, upper };
}
function autoCannyThresholds(gray, k = 0.33) {
  const cv = globalThis.cv;
  const hist = new cv.Mat(),
    mask = new cv.Mat();
  cv.calcHist(gray, [0], mask, hist, [256], [0, 256]);
  let total = 0,
    half = (gray.rows * gray.cols) / 2,
    median = 0;
  for (let i = 0; i < 256; i++) {
    total += hist.floatAt(i, 0);
    if (total >= half) {
      median = i;
      break;
    }
  }
  hist.delete();
  mask.delete();
  return {
    lower: Math.max(0, (1 - k) * median),
    upper: Math.min(255, (1 + k) * median),
  };
}
// --- lightweight probe for UI edges preview ---
export function probeContours(canvas) {
  const cv = globalThis.cv;
  const src = cv.imread(canvas);
  try {
    const gray = new cv.Mat(),
      blur = new cv.Mat(),
      edges = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.bilateralFilter(gray, blur, 7, 50, 50);

    const binary = new cv.Mat();
    cv.threshold(blur, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

    const { lower, upper } = autoCannyThresholds(binary);
    cv.Canny(binary, edges, lower, upper);

    const count = cv.countNonZero(edges);
    const debugB64 = matToBase64(edges);

    cleanup([gray, blur, binary, edges]);
    return { count, debugB64 };
  } finally {
    src.delete();
  }
}

// --- main detector ---
export function detectAndWarpCard(canvas, debug = false) {
  const cv = globalThis.cv;
  if (!cv || !canvas) return null;

  const src = cv.imread(canvas);
  try {
    const gray = new cv.Mat(),
      blur = new cv.Mat(),
      edges = new cv.Mat(),
      closed = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.bilateralFilter(gray, blur, 7, 50, 50);
    const binary = new cv.Mat();
    cv.threshold(blur, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
    // Blur guard: skip super-blurry frames
    {
      const lap = new cv.Mat(),
        mean = new cv.Mat(),
        std = new cv.Mat();
      cv.Laplacian(blur, lap, cv.CV_64F);
      cv.meanStdDev(lap, mean, std);
      const variance = Math.pow(std.doubleAt(0, 0), 2);
      lap.delete();
      mean.delete();
      std.delete();
      if (variance < 40) {
        // loose threshold; tune 30–60 as needed
        const debugB64 = debug ? matToBase64(blur) : null;
        cleanup([gray, blur, edges, closed]);
        // return “no valid quad”; UI gating will drop it
        return { roiB64: null, score: 0, debugB64, quad: null };
      }
    }
    const { lower, upper } = autoCannyThresholds(binary, 0.33);
    cv.Canny(binary, edges, lower, upper);

    const kernelSize = Math.max(
      3,
      Math.round(Math.min(src.cols, src.rows) * 0.004)
    );
    if (kernelSize % 2 === 0) kernelSize += 1; // odd is more stable for morphology
    const kernel = cv.Mat.ones(kernelSize, kernelSize, cv.CV_8U);
    cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, kernel);
    cv.dilate(closed, closed, kernel, new cv.Point(-1, -1), 1);

    const contours = new cv.MatVector(),
      hierarchy = new cv.Mat();
    cv.findContours(
      closed,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    let { bestQuad, bestScore } = pickBestQuad(contours, src.cols, src.rows);
    if (!bestQuad) {
      const fb = pickMinAreaRectFallback(contours, src.cols, src.rows);
      bestQuad = fb.bestQuad;
      bestScore = fb.bestScore;
    }
    if (bestQuad) {
      bestQuad = orderQuadClockwise(bestQuad);
      if (!quadEdgeSanity(bestQuad, src.cols, src.rows)) bestQuad = null;
    }
    if (!bestQuad) {
      // last-ditch : center crop so UX never blocks; this does not imply “valid card”
      const cx = Math.floor(src.cols * 0.5),
        cy = Math.floor(src.rows * 0.5);
      const ww = Math.floor(src.cols * 0.6),
        hh = Math.floor(ww / CARD_RATIO);
      const x0 = Math.max(0, cx - Math.floor(ww / 2)),
        y0 = Math.max(0, cy - Math.floor(hh / 2));
      const rect = new cv.Rect(
        x0,
        y0,
        Math.min(ww, src.cols - x0),
        Math.min(hh, src.rows - y0)
      );
      const roi = src.roi(rect);
      const roiB64 = matToBase64(roi);
      roi.delete();
      const debugB64 = debug ? matToBase64(closed) : null;
      cleanup([gray, blur, binary, edges, closed, kernel, contours, hierarchy]);
      return { roiB64, score: 0, debugB64, quad: null };
    }

    // validate quad
    const flatQuad = bestQuad.flat().map(Number);
    if (flatQuad.length !== 8 || flatQuad.some((v) => !Number.isFinite(v))) {
      cleanup([gray, blur, edges, closed, kernel, contours, hierarchy]);
      return null;
    }

    // warp to canonical size from original color src
    const warped = warpToCard(src, bestQuad);
    const roiB64 = matToBase64(warped);

    // optional debug overlay (green outline)
    let debugB64 = null;
    if (debug) {
      debugB64 = matToBase64(closed); // show post-morphology edges instead
    }

    cleanup([gray, blur, edges, closed, kernel, contours, hierarchy, warped]);
    return { roiB64, score: bestScore, debugB64, quad: bestQuad };
  } finally {
    src.delete();
  }
}
