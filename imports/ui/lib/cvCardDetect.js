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

    return null;
}