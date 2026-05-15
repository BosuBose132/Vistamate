import { useRef, useState, useEffect, useCallback } from 'react';
import useOpenCV from '/imports/ui/hooks/useOpenCV';
import { detectAndWarpCard, probeContours } from '/imports/ui/lib/cvCardDetect';

const POLL_MS = 120;
const EDGE_MIN = 4000;
const CONF_MIN = 0.0015;

const PHASE = {
  ALIGN: 'align',
  STEADY: 'steady',
  READY: 'ready',
  CAPTURING: 'capturing',
  PROCESSING: 'processing',
};

// ---- Loose card-shape helpers ----
const CARD_RATIO = 1.58;
const RATIO_TOL = 0.4;
const MIN_AREA_FRAC_UI = 0.05;
const MIN_IOU = 0.03;

const dot = (ax, ay, bx, by) => ax * bx + ay * by;
const len = (ax, ay) => Math.hypot(ax, ay) || 1e-6;
const angleCos = (p, q, r) => {
  const ux = p[0] - q[0],
    uy = p[1] - q[1];
  const vx = r[0] - q[0],
    vy = r[1] - q[1];
  return dot(ux, uy, vx, vy) / (len(ux, uy) * len(vx, vy));
};
const rightAngleScore = (quad) => {
  const coses = [
    Math.abs(angleCos(quad[3], quad[0], quad[1])),
    Math.abs(angleCos(quad[0], quad[1], quad[2])),
    Math.abs(angleCos(quad[1], quad[2], quad[3])),
    Math.abs(angleCos(quad[2], quad[3], quad[0])),
  ];
  const scores = coses.map((c) => 1 - Math.min(1, c));
  return (scores[0] + scores[1] + scores[2] + scores[3]) / 4;
};

const StatusBadge = ({ phase }) => {
  const map = {
    [PHASE.ALIGN]: { txt: 'Align your ID', cls: 'badge-ghost' },
    [PHASE.STEADY]: { txt: 'Hold steady…', cls: 'badge-warning' },
    [PHASE.READY]: { txt: 'Auto-capturing…', cls: 'badge-success' },
    [PHASE.CAPTURING]: { txt: 'Capturing…', cls: 'badge-info' },
    [PHASE.PROCESSING]: { txt: 'Processing OCR…', cls: 'badge-info' },
  };
  const { txt, cls } = map[phase] || { txt: 'Ready', cls: 'badge-ghost' };
  return (
    <span className={`badge ${cls} gap-2`}>
      <LoadingDot phase={phase} />
      {txt}
    </span>
  );
};

const LoadingDot = ({ phase }) => (
  <span
    className={`inline-block h-2 w-2 rounded-full ${
      phase === PHASE.PROCESSING ||
      phase === PHASE.CAPTURING ||
      phase === PHASE.READY
        ? 'animate-pulse bg-current'
        : 'bg-current/60'
    }`}
  />
);

const bboxOfQuad = (quad) => {
  const xs = quad.map((p) => p[0]),
    ys = quad.map((p) => p[1]);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
};

const iouRect = (a, b) => {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
};

const captureToBase64 = (videoRef, canvasRef) => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  if (!video || !canvas) return null;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
};

export default function CameraCapture({ onCapture, ocrStatus = 'idle' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { ready: cvReady } = useOpenCV();

  // ── Visual state (drives re-renders / UI) ──────────────────────────────
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState(PHASE.ALIGN);
  const [isBoxGreen, setIsBoxGreen] = useState(false);
  const [hasCaptured, setHasCaptured] = useState(false);

  // ── Mutable refs (read inside interval callbacks — never stale) ─────────
  // FIX: lastFrameData and isCheckingOCR were useState; interval callbacks
  //      captured their initial value and never saw updates → detection
  //      always returned early or ran in parallel.
  const lastFrameDataRef = useRef(null); // replaces useState(null) for lastFrameData
  const isCheckingRef = useRef(false); // replaces useState(false) for isCheckingOCR
  const steadyCountRef = useRef(0); // replaces useState(0) for steadyCount
  const hasCapturedRef = useRef(false); // mirrors hasCaptured state for interval reads

  // Keep the ref in sync whenever state changes
  useEffect(() => {
    hasCapturedRef.current = hasCaptured;
  }, [hasCaptured]);

  // ── Camera startup ──────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let mounted = true;
    let stream;

    const onMeta = () => {
      if (!mounted) return;
      setVideoReady(true);
      console.log('[cam] loadedmetadata', v.videoWidth, 'x', v.videoHeight);
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        v.srcObject = stream;
        v.muted = true;
        v.playsInline = true;
        v.autoplay = true;
        v.addEventListener('loadedmetadata', onMeta, { once: true });
        await v.play().catch(() => {});
        if (v.readyState >= 1 && v.videoWidth && v.videoHeight) onMeta();
      } catch (err) {
        console.error('[cam] getUserMedia failed', err);
        setError('Unable to access camera: ' + (err?.message || err));
      }
    };

    start();
    return () => {
      mounted = false;
      v.removeEventListener('loadedmetadata', onMeta);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (v.srcObject) v.srcObject = null;
    };
  }, []);

  // ── Capture helpers ─────────────────────────────────────────────────────
  const doCapture = useCallback(() => {
    setPhase(PHASE.CAPTURING);
    const b64 = captureToBase64(videoRef, canvasRef);
    if (!b64) return;
    hasCapturedRef.current = true;
    setHasCaptured(true);
    setPhase(PHASE.PROCESSING);
    onCapture?.(b64);
  }, [onCapture]);

  const doCaptureWithROI = useCallback(
    (roiB64) => {
      setPhase(PHASE.CAPTURING);
      hasCapturedRef.current = true;
      setHasCaptured(true);
      setPhase(PHASE.PROCESSING);
      onCapture?.(roiB64 || captureToBase64(videoRef, canvasRef));
    },
    [onCapture],
  );

  // ── Main detection function (reads refs, not stale state) ───────────────
  const checkFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Guard: skip if already captured or cv/video not ready
    if (hasCapturedRef.current) return;
    if (!cvReady || !videoReady) return;
    if (!video || !canvas) return;
    if (!video.videoWidth || !video.videoHeight) return;

    // Guard: prevent overlapping calls (using ref — always current)
    if (isCheckingRef.current) return;

    // Draw current frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Overlay ROI geometry (mirrors the CSS overlay box at 80% width)
    const targetW = Math.floor(canvas.width * 0.8);
    const targetH = Math.floor(targetW / CARD_RATIO);
    const x = Math.floor((canvas.width - targetW) / 2);
    const y = Math.floor((canvas.height - targetH) / 2);

    // Motion seed: first frame just stores data and returns
    const img = ctx.getImageData(x, y, targetW, targetH);
    const current = img.data;
    if (!lastFrameDataRef.current) {
      lastFrameDataRef.current = current;
      return;
    }
    // Update stored frame for next tick
    lastFrameDataRef.current = current;

    // Edge probe (for debug thumbnail + richness gate)
    const probe = probeContours(canvas);
    const probeCount = probe?.count ?? 0;
    const dbgImg = document.getElementById('cv-debug');
    if (probe?.debugB64 && dbgImg) dbgImg.src = probe.debugB64;

    // Lock: mark as running
    isCheckingRef.current = true;
    setPhase(PHASE.STEADY);

    try {
      let result = null;
      try {
        result = detectAndWarpCard(canvas, /* debug */ true);
      } catch (err) {
        console.error('[cv] detectAndWarpCard error:', err);
        return; // finally will still fire and release the lock
      }

      if (result?.debugB64 && dbgImg) dbgImg.src = result.debugB64;

      console.log('[cv] detect', {
        hasQuad: !!result?.quad,
        hasROI: !!result?.roiB64,
        score: result?.score,
        probeCount,
      });

      // Base requirement: detector returned a quad + warped ROI
      let ok = Boolean(result?.roiB64 && result?.quad);

      if (ok) {
        const quad = result.quad;
        const bb = bboxOfQuad(quad);
        const areaFrac = (bb.w * bb.h) / (canvas.width * canvas.height);

        // Orientation-agnostic ratio
        const rawRatio = bb.w / Math.max(1, bb.h);
        const r = rawRatio >= 1 ? rawRatio : 1 / rawRatio;
        const ratioOk = Math.abs(r - CARD_RATIO) <= CARD_RATIO * RATIO_TOL;
        const areaOk = areaFrac >= MIN_AREA_FRAC_UI;

        const angScore = rightAngleScore(quad);
        const anglesOk = angScore >= 0.3; // lowered from 0.6 — perspective distortion naturally reduces this score

        // Position: must overlap with the guide box (+ margin)
        const M = 50;
        const gateBox = {
          x: x - M,
          y: y - M,
          w: targetW + 2 * M,
          h: targetH + 2 * M,
        };
        const overlap = iouRect(bb, gateBox);
        const posOk = overlap >= MIN_IOU;

        console.log('[gate]', {
          ratio: rawRatio.toFixed(2),
          normRatio: r.toFixed(2),
          ratioOk,
          areaFrac: areaFrac.toFixed(3),
          areaOk,
          angScore: angScore.toFixed(2),
          anglesOk,
          IoU: overlap.toFixed(2),
          posOk,
          score: (result?.score ?? 0).toFixed(4),
          probeCount,
        });

        ok = ratioOk && areaOk && anglesOk && posOk;

        // Extra guards: edge richness + detector confidence
        if (probeCount < EDGE_MIN) ok = false;
        if ((result?.score ?? 0) < CONF_MIN) ok = false;
      }

      if (ok) {
        setIsBoxGreen(true);
        setPhase(PHASE.READY);
        steadyCountRef.current += 1;
        if (!hasCapturedRef.current && steadyCountRef.current >= 2) {
          setTimeout(() => doCaptureWithROI(result?.roiB64 || null), 80);
        }
      } else {
        setIsBoxGreen(false);
        setPhase(PHASE.ALIGN);
        steadyCountRef.current = 0;
      }
    } finally {
      // Always release the lock, even if an error was thrown
      isCheckingRef.current = false;
    }
  }, [cvReady, videoReady, doCaptureWithROI]);

  // ── FIX: Single polling loop (was duplicated before) ───────────────────
  // Dependencies include cvReady and videoReady so the loop restarts with
  // a fresh closure when the camera or OpenCV becomes ready.
  useEffect(() => {
    const id = setInterval(checkFrame, POLL_MS);
    return () => clearInterval(id);
  }, [checkFrame]); // checkFrame is stable via useCallback

  // ── JSX ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <div className="card bg-base-100 text-base-content shadow-xl mx-auto max-w-3xl">
        <div className="card-body">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="card-title">Visitor Check-In</h2>
              <p className="opacity-70">
                Please align your business card within the box to check in
              </p>
            </div>
            <StatusBadge phase={phase} />
          </div>

          {/* Video area */}
          <div className="relative mt-4 rounded-2xl overflow-hidden bg-base-200 border border-base-300">
            <div className="aspect-video w-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Debug edges thumbnail */}
              <div className="absolute bottom-2 left-2 pointer-events-none bg-base-100/70 rounded p-1 shadow">
                <div className="text-[10px] opacity-70 px-1">Edges</div>
                <img
                  id="cv-debug"
                  alt="cv debug"
                  className="max-w-[140px] rounded"
                />
              </div>
            </div>

            {/* Overlay guide box */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-all">
              <div
                className={`rounded-2xl px-8 py-16 border-4 transition-all duration-300 ${
                  isBoxGreen
                    ? 'border-success/80 shadow-[0_0_24px_4px_rgba(34,197,94,0.35)] bg-success/5'
                    : 'border-base-300 bg-base-300/10'
                }`}
                style={{ width: '80%', aspectRatio: '1.58' }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  {isBoxGreen ? (
                    <span className="font-semibold text-success animate-pulse">
                      Auto-capturing… hold steady
                    </span>
                  ) : (
                    <span className="opacity-80">
                      Align your business card inside the box
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Post-capture overlay */}
            {hasCaptured && (
              <div className="absolute inset-0 bg-base-100/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-base-content">
                {ocrStatus === 'processed' ? (
                  <>
                    <div className="text-success">
                      <svg
                        className="w-10 h-10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <p className="font-semibold">
                      OCR processed — review the form
                    </p>
                  </>
                ) : (
                  <>
                    <span className="loading loading-spinner loading-lg" />
                    <p className="font-semibold">Captured — processing OCR…</p>
                    <p className="text-sm opacity-70">Please wait</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error mt-4">
              <span>{error}</span>
            </div>
          )}

          {/* Manual capture button */}
          <div className="mt-4 flex justify-center">
            <button
              className="btn btn-primary"
              onClick={doCapture}
              disabled={
                hasCaptured ||
                phase === PHASE.CAPTURING ||
                phase === PHASE.PROCESSING
              }
            >
              {hasCaptured ? 'Processing…' : 'Capture & Scan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
