export const CARD_RATIO = 1.58;          // typical business card W/H
export const RATIO_TOL = 0.35;          // tolerate variation (IDs differ)
export const MIN_AREA_FRAC = 0.05;       // candidate must be ≥5% of frame
export const WARP_W = 1000;
export const WARP_H = Math.round(WARP_W / CARD_RATIO);

// --- Helpers (no OpenCV dependency) ---
export function dist(a, b) {
    const dx = a[0] - b[0], dy = a[1] - b[1];
    return Math.hypot(dx, dy);
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
    for (const m of mats) { try { m.delete(); } catch { } }
}

export function detectAndWarpCard(canvas, debug = false) {
    const cv = globalThis.cv; if (!cv || !canvas) return null;
    const src = cv.imread(canvas);
    try {
        const gray = new cv.Mat(), blur = new cv.Mat(), edges = new cv.Mat(), closed = new cv.Mat(), otsu = new cv.Mat();

        // grayscale + blur
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);

        // Otsu for adaptive Canny thresholds
        cv.threshold(blur, otsu, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
        const meanBrightness = cv.mean(otsu)[0];
        const low = Math.max(30, Math.min(120, meanBrightness * 0.6));
        const high = Math.max(60, Math.min(200, low * 2.0));
        cv.Canny(blur, edges, low, high);

        // close small gaps
        const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
        cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, kernel);

        // find external contours
        const contours = new cv.MatVector(), hierarchy = new cv.Mat();
        cv.findContours(closed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // simple candidate (just existence) — robust pick/warp will be STEP 3
        const quad = pickFirstQuad(contours, src.cols, src.rows);

        let debugB64 = null;
        if (debug) debugB64 = matToBase64(edges); // quick look at edges

        cleanup([gray, blur, edges, closed, kernel, contours, hierarchy, otsu]);

        // Indicate presence without ROI yet (roiB64 remains null in STEP 2)
        return quad ? { roiB64: null, score: 0, debugB64 } : null;
    } finally {
        src.delete();
    }
}

function toPointArray(mat) {
    const pts = [];
    for (let i = 0; i < mat.rows; i++) {
        const x = mat.intPtr(i, 0)[0], y = mat.intPtr(i, 0)[1];
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
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

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