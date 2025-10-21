export const CARD_RATIO = 1.58; // typical business card W/H
export const RATIO_TOL = 0.6; // tolerate variation (IDs differ)
export const MIN_AREA_FRAC = 0.0018;
export const WARP_W = 1000;
export const WARP_H = Math.round(WARP_W / CARD_RATIO);

// --- Helpers (no OpenCV dependency) ---
export function dist(a, b) {
  const dx = a[0] - b[0],
    dy = a[1] - b[1];
  return Math.hypot(dx, dy);
}
export function centroid(quad) {
  const [a, b, c, d] = quad;
  return [(a[0] + b[0] + c[0] + d[0]) / 4, (a[1] + b[1] + c[1] + d[1]) / 4];
}
export function matToBase64(mat) {
  // Receives an OpenCV Mat, draws to a temp canvas, returns dataURL
  const cv = globalThis.cv;
  if (!cv) return null;
  const canvas = document.createElement('canvas');
  cv.imshow(canvas, mat);
  return canvas.toDataURL('image/png');
}

export function cleanup(mats) {
  for (const m of mats) {
    try {
      m.delete();
    } catch {}
  }
}
function pickBestQuad(contours, w, h) {
  const cv = globalThis.cv;
  const imgArea = w * h;
  let best = null,
    bestScore = -1;

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const peri = cv.arcLength(cnt, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.03 * peri, true);

    if (approx.rows === 4) {
      const area = cv.contourArea(approx);
      if (area < imgArea * MIN_AREA_FRAC) {
        approx.delete();
        continue;
      }

      const quad = toPointArray(approx);
      const [tl, tr, br, bl] = orderCorners(quad);

      const widthA = dist(tr, tl),
        widthB = dist(br, bl);
      const heightA = dist(bl, tl),
        heightB = dist(br, tr);
      const width = (widthA + widthB) / 2;
      const height = (heightA + heightB) / 2;
      const ratio = width / height;

      const areaScore = Math.min(1, area / (imgArea * 0.5));
      const ratioScore =
        1 -
        Math.min(1, Math.abs(ratio - CARD_RATIO) / (CARD_RATIO * RATIO_TOL));
      const score = areaScore * 0.6 + ratioScore * 0.4;

      if (score > bestScore) {
        bestScore = score;
        best = [tl, tr, br, bl];
      }
    }
    approx.delete();
  }
  return { bestQuad: best, bestScore };
}

function pickMinAreaRectFallback(contours, w, h) {
  const cv = globalThis.cv;
  const imgArea = w * h;
  let best = null,
    maxArea = 0;

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const mr = cv.minAreaRect(cnt); // rotated rectangle
    const area = mr.size.width * mr.size.height;
    if (area > imgArea * MIN_AREA_FRAC && area > maxArea) {
      maxArea = area;
      best = mr;
    }
  }
  if (!best) return { bestQuad: null, bestScore: -1 };

  const pts = cv.RotatedRect.points(best); // 4 corner points
  const quad = [
    [pts[0].x, pts[0].y],
    [pts[1].x, pts[1].y],
    [pts[2].x, pts[2].y],
    [pts[3].x, pts[3].y],
  ];
  const score = Math.min(1, maxArea / (imgArea * 0.5));
  return { bestQuad: quad, bestScore: score };
}
export function detectAndWarpCard(canvas, debug = false) {
  const cv = globalThis.cv;
  if (!cv || !canvas) return null;
  const src = cv.imread(canvas);
  try {
    const gray = new cv.Mat(),
      blur = new cv.Mat(),
      edges = new cv.Mat(),
      closed = new cv.Mat(),
      otsu = new cv.Mat();

    // grayscale + blur
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);

    // Otsu for adaptive Canny thresholds
    cv.threshold(blur, otsu, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
    const meanBrightness = cv.mean(otsu)[0];
    const low = Math.max(30, Math.min(120, meanBrightness * 0.6));
    const high = Math.max(60, Math.min(200, low * 2.0));
    // Fixed Canny thresholds (more stable for testing)
    cv.Canny(blur, edges, 35, 110);

    // Close small gaps and thicken edges slightly
    const kernel = cv.Mat.ones(5, 5, cv.CV_8U);
    cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, kernel);
    cv.dilate(closed, closed, kernel, new cv.Point(-1, -1), 1);

    // Find all contours (not just external ones)
    const contours = new cv.MatVector(),
      hierarchy = new cv.Mat();
    cv.findContours(
      closed,
      contours,
      hierarchy,
      cv.RETR_LIST,
      cv.CHAIN_APPROX_SIMPLE
    );
    console.debug(
      '[cv] contours:',
      contours.size(),
      'img:',
      src.cols,
      'x',
      src.rows
    );
    let { bestQuad, bestScore } = pickBestQuad(contours, src.cols, src.rows);
    if (!bestQuad) {
      // Fallback: rectangular bounding box of the largest contour
      const fb = pickMinAreaRectFallback(contours, src.cols, src.rows);
      bestQuad = fb.bestQuad;
      bestScore = fb.bestScore;
      console.debug(
        '[cv] using RECT fallback?',
        !!bestQuad,
        'score:',
        bestScore
      );
      if (!bestQuad) {
        cleanup([gray, blur, edges, closed, kernel, contours, hierarchy, otsu]);
        return null;
      }
    }
    // warp to canonical card size
    const warped = warpToCard(src, bestQuad);
    const roiB64 = matToBase64(warped);

    // optional debug overlay (draw the quad on source)
    let debugB64 = null;
    if (debug) {
      const overlay = src.clone();
      const cv = globalThis.cv;
      const cvp = cv.matFromArray(4, 1, cv.CV_32SC2, bestQuad.flat());
      cv.polylines(overlay, [cvp], true, new cv.Scalar(0, 255, 0, 255), 3);
      debugB64 = matToBase64(overlay);
      cvp.delete();
      overlay.delete();
    }

    cleanup([
      gray,
      blur,
      edges,
      closed,
      kernel,
      contours,
      hierarchy,
      otsu,
      warped,
    ]);
    return { roiB64, score: bestScore, debugB64, quad: bestQuad };
  } finally {
    src.delete();
  }
}

function toPointArray(mat) {
  const pts = [];
  for (let i = 0; i < mat.rows; i++) {
    const x = mat.intPtr(i, 0)[0],
      y = mat.intPtr(i, 0)[1];
    pts.push([x, y]);
  }
  return pts;
}

function pickFirstQuad(contours, w, h) {
  const cv = globalThis.cv;
  const imgArea = w * h;

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const peri = cv.arcLength(cnt, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.03 * peri, true);

    if (approx.rows === 4) {
      const area = cv.contourArea(approx);
      if (area >= imgArea * MIN_AREA_FRAC) {
        const quad = toPointArray(approx);
        approx.delete();
        return quad; // unordered 4 points; good enough to confirm presence
      }
    }
    approx.delete();
  }
  return null;
}
function orderCorners(pts) {
  // return [tl, tr, br, bl]
  const s = pts.map((p) => p[0] + p[1]);
  const d = pts.map((p) => p[0] - p[1]);
  const tl = pts[s.indexOf(Math.min(...s))];
  const br = pts[s.indexOf(Math.max(...s))];
  const tr = pts[d.indexOf(Math.max(...d))];
  const bl = pts[d.indexOf(Math.min(...d))];
  return [tl, tr, br, bl];
}

function warpToCard(src, quad) {
  const cv = globalThis.cv;
  const dst = new cv.Mat();
  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, quad.flat());
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    WARP_W,
    0,
    WARP_W,
    WARP_H,
    0,
    WARP_H,
  ]);
  const M = cv.getPerspectiveTransform(srcTri, dstTri);
  cv.warpPerspective(
    src,
    dst,
    M,
    new cv.Size(WARP_W, WARP_H),
    cv.INTER_LINEAR,
    cv.BORDER_REPLICATE
  );
  srcTri.delete();
  dstTri.delete();
  M.delete();
  return dst;
}

// Debug probe: count contours on a canvas, return edges image
export function probeContours(canvas) {
  const cv = globalThis.cv;
  if (!cv || !canvas) return { count: -1, debugB64: null };
  const src = cv.imread(canvas);
  try {
    const gray = new cv.Mat(),
      blur = new cv.Mat(),
      edges = new cv.Mat(),
      closed = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
    cv.Canny(blur, edges, 50, 150); // fixed, forgiving
    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, kernel);
    cv.dilate(closed, closed, kernel);

    const contours = new cv.MatVector(),
      hier = new cv.Mat();
    cv.findContours(
      closed,
      contours,
      hier,
      cv.RETR_LIST,
      cv.CHAIN_APPROX_SIMPLE
    );
    const debugB64 = matToBase64(edges);
    const count = contours.size();
    cleanup([gray, blur, edges, closed, kernel, contours, hier]);
    return { count, debugB64 };
  } finally {
    src.delete();
  }
}

function pickRectFallback(contours, w, h) {
  const cv = globalThis.cv;
  const imgArea = w * h;
  let maxArea = 0,
    bestRect = null;

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const rect = cv.boundingRect(cnt); // {x,y,width,height}
    const area = rect.width * rect.height;
    if (area > imgArea * MIN_AREA_FRAC && area > maxArea) {
      maxArea = area;
      bestRect = rect;
    }
  }
  if (!bestRect) return { bestQuad: null, bestScore: -1 };

  // Axis-aligned quad from bounding rect
  const { x, y, width, height } = bestRect;
  const quad = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ];
  const score = Math.min(1, maxArea / (imgArea * 0.5)); // area-only score
  return { bestQuad: quad, bestScore: score };
}
