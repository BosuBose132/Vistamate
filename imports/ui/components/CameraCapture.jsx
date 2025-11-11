import React from 'react';
import { useRef, useState, useEffect } from 'react';
import useOpenCV from '/imports/ui/hooks/useOpenCV';
import { detectAndWarpCard, probeContours } from '/imports/ui/lib/cvCardDetect';

const POLL_MS = 120;
const SKIP_MOD = 2; // analyze every other tick
const EDGE_MIN = 5000; // tune per device
const CONF_MIN = 0.002;

const PHASE = {
  ALIGN: 'align',
  STEADY: 'steady',
  READY: 'ready', // green box showing
  CAPTURING: 'capturing',
  PROCESSING: 'processing', // after capture, waiting for OCR + next step
};

// ---- Loose card-shape helpers ----
const CARD_RATIO = 1.58; // business/ID card width/height
const RATIO_TOL = 0.4; // ±40% tolerance (loose)
const MIN_AREA_FRAC_UI = 0.05; // ≥1% of frame (loose)
const MIN_IOU = 0.03; // ≥8% overlap with overlay (loose)

const dot = (ax, ay, bx, by) => ax * bx + ay * by;
const len = (ax, ay) => Math.hypot(ax, ay) || 1e-6;
const angleCos = (p, q, r) => {
  // cos(angle at q) between vectors q->p and q->r
  const ux = p[0] - q[0],
    uy = p[1] - q[1];
  const vx = r[0] - q[0],
    vy = r[1] - q[1];
  return dot(ux, uy, vx, vy) / (len(ux, uy) * len(vx, vy));
};
const rightAngleScore = (quad) => {
  // 1.0 is perfect rectangle (all corners ~90°), 0.0 is bad
  const coses = [
    Math.abs(angleCos(quad[3], quad[0], quad[1])),
    Math.abs(angleCos(quad[0], quad[1], quad[2])),
    Math.abs(angleCos(quad[1], quad[2], quad[3])),
    Math.abs(angleCos(quad[2], quad[3], quad[0])),
  ];
  const scores = coses.map((c) => 1 - Math.min(1, c)); // map |cos|→[0..1]
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
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
};

const iouRect = (a, b) => {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
};

const handleCaptureToBase64 = (videoRef, canvasRef) => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  if (!video || !canvas) return null;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
};

export default function CameraCapture({ onCapture, ocrStatus = 'idle' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { ready: cvReady } = useOpenCV();
  const [videoReady, setVideoReady] = useState(false);

  const [error, setError] = useState(null);
  const [phase, setPhase] = useState(PHASE.ALIGN);
  const [isBoxGreen, setIsBoxGreen] = useState(false);
  const [lastFrameData, setLastFrameData] = useState(null);
  const [isCheckingOCR, setIsCheckingOCR] = useState(false);
  const [hasCaptured, setHasCaptured] = useState(false);
  const [steadyCount, setSteadyCount] = useState(0); // consecutive steady polls

  // camera on
  useEffect(() => {
    // Snapshot the element once so cleanup uses a stable reference
    const el = videoRef.current;
    let mounted = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (mounted && el) el.srcObject = stream;
        const onMeta = () => setVideoReady(true);
        el.addEventListener('loadedmetadata', onMeta, { once: true });
        // If metadata already loaded (rare), set immediately
        if (el.readyState >= 1 && el.videoWidth && el.videoHeight)
          setVideoReady(true);
        // store for cleanup
        el.__onMeta = onMeta;
      } catch (err) {
        setError('Unable to access camera: ' + err.message);
      }
    })();

    return () => {
      mounted = false;
      if (el && el.srcObject) {
        const tracks =
          typeof el.srcObject.getTracks === 'function'
            ? el.srcObject.getTracks()
            : [];
        tracks.forEach((t) => t.stop());
        // optional: clear the srcObject to release the element
        el.srcObject = null;
        if (el.__onMeta) el.removeEventListener('loadedmetadata', el.__onMeta);
      }
    };
  }, []);

  // main polling loop
  useEffect(() => {
    let tick = 0;
    const id = setInterval(() => {
      if (hasCaptured) return;
      tick = (tick + 1) % SKIP_MOD;
      if (tick !== 0) return;
      checkFrameAndOCR();
    }, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCaptured]);

  useEffect(() => {
    const id = setInterval(() => {
      if (hasCaptured) return;
      console.log('[cv] tick');
      checkFrameAndOCR();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [hasCaptured]);

  const doCapture = () => {
    setPhase(PHASE.CAPTURING);
    const b64 = handleCaptureToBase64(videoRef, canvasRef);
    if (!b64) return;
    setHasCaptured(true);
    setPhase(PHASE.PROCESSING); // show overlay immediately
    onCapture?.(b64); // parent continues OCR flow
  };

  const doCaptureWithROI = (roiB64) => {
    setPhase(PHASE.CAPTURING);
    setHasCaptured(true);
    setPhase(PHASE.PROCESSING);
    onCapture?.(roiB64 || handleCaptureToBase64(videoRef, canvasRef));
  };

  const checkFrameAndOCR = async () => {
    // Tunables (safe defaults)
    const EDGE_MIN = 4000; // require “interesting” edges to avoid random greens
    const CONF_MIN = 0.0015; // detector score floor (area*rectangularity)

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Heartbeat (verifies the poller is alive)
    console.log('[cv] tick');

    // Readiness guards (keep silent in prod, noisy while debugging)
    if (!cvReady) {
      /* console.log('[cv] skip: cvReady=false'); */ return;
    }
    if (!video || !canvas) {
      /* console.log('[cv] skip: refs missing'); */ return;
    }
    if (!videoReady) {
      /* console.log('[cv] skip: videoReady=false'); */ return;
    }
    if (!video.videoWidth || !video.videoHeight) {
      /* console.log('[cv] skip: no dims'); */ return;
    }

    // Draw the full frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    console.log('[cv] dims', canvas.width, 'x', canvas.height);

    // Quick edges probe for debug thumbnail + “edge richness”
    const probe = probeContours(canvas);
    const probeCount = probe?.count ?? 0;
    console.log('[cv] probeCount', probeCount);
    const dbgImg = document.getElementById('cv-debug');
    if (probe?.debugB64 && dbgImg) dbgImg.src = probe.debugB64;

    // Overlay ROI rectangle we want users to align with
    const ratio = 1.58;
    const targetW = Math.floor(canvas.width * 0.8);
    const targetH = Math.floor(targetW / ratio);
    const x = Math.floor((canvas.width - targetW) / 2);
    const y = Math.floor((canvas.height - targetH) / 2);

    // Simple motion check (seed once; update every loop)
    const img = ctx.getImageData(x, y, targetW, targetH);
    const current = img.data;
    if (!lastFrameData) {
      setLastFrameData(current);
      return;
    } else {
      let diff = 0;
      for (let i = 0; i < current.length; i += 4)
        diff += Math.abs(current[i] - lastFrameData[i]);
      const avg = diff / (current.length / 4);
      console.log('[cam] motion avg:', Math.round(avg));
      setLastFrameData(current); // keep this updated each tick
    }

    // Prevent overlapping detector calls
    if (isCheckingOCR) return;

    setPhase(PHASE.STEADY);
    setIsCheckingOCR(true);
    try {
      // Run detector
      const result = detectAndWarpCard(canvas, /*debug*/ true);
      if (result?.debugB64 && dbgImg) dbgImg.src = result.debugB64;

      console.log('[cv] detect', {
        hasResult: !!result,
        hasQuad: !!result?.quad,
        hasROI: !!result?.roiB64,
        score: result?.score,
      });

      // Base OK requires detector to return a quad + ROI
      let ok = Boolean(result?.roiB64 && result?.quad);

      if (ok) {
        // Geometry + UI gating
        const quad = result.quad;
        const bb = bboxOfQuad(quad);
        const areaFrac = (bb.w * bb.h) / (canvas.width * canvas.height);

        // Orientation-agnostic ratio: normalize to >= 1
        const rawRatio = bb.w / Math.max(1, bb.h);
        const r = rawRatio >= 1 ? rawRatio : 1 / rawRatio;
        const ratioOk = Math.abs(r - CARD_RATIO) <= CARD_RATIO * RATIO_TOL; // ±40%
        const areaOk = areaFrac >= MIN_AREA_FRAC_UI; // ≥1% (or your current value)

        // Right-angle score (loose)
        const angScore = rightAngleScore(quad); // 0..1
        const anglesOk = angScore >= 0.6;

        // Position gate: require some overlap with the big center box (+margin)
        const M = 50;
        const gateBox = {
          x: x - M,
          y: y - M,
          w: targetW + 2 * M,
          h: targetH + 2 * M,
        };
        const overlap = iouRect(bb, gateBox);
        const posOk = overlap >= MIN_IOU; // e.g., 0.08 (8%)

        // Log every gate so we see exactly what's failing
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
          hasQuad: !!result?.quad,
          probeCount,
        });

        // Final decision (you can temporarily drop `&& anglesOk` to prove plumbing)
        ok = ratioOk && areaOk && anglesOk && posOk;

        // Extra guards: edge richness + detector score
        if (probeCount < EDGE_MIN) ok = false;
        if ((result?.score ?? 0) < CONF_MIN) ok = false;
      }

      // Update UI based on ok
      if (ok) {
        setIsBoxGreen(true);
        setPhase(PHASE.READY);
        setSteadyCount((c) => {
          const next = c + 1;
          console.log('[steady] count:', next);
          if (!hasCaptured && next >= 2) {
            setTimeout(() => doCaptureWithROI(result?.roiB64 || null), 80);
          }
          return next;
        });
      } else {
        setIsBoxGreen(false);
        setPhase(PHASE.ALIGN);
        setSteadyCount(0);
      }
    } finally {
      setIsCheckingOCR(false);
    }
  };

  return (
    <div className="w-full">
      {/* Card */}
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
              {/* Edges preview only (kept for operator feedback) */}
              <div className="absolute bottom-2 left-2 pointer-events-none bg-base-100/70 rounded p-1 shadow">
                <div className="text-[10px] opacity-70 px-1">Edges</div>
                <img
                  id="cv-debug"
                  alt="cv debug"
                  className="max-w-[140px] rounded"
                />
              </div>
            </div>

            {/* Overlay box */}
            <div
              className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-all`}
            >
              <div
                className={`rounded-2xl px-8 py-16 border-4 transition-all duration-300
                ${
                  isBoxGreen
                    ? 'border-success/80 shadow-[0_0_24px_4px_rgba(34,197,94,0.35)] bg-success/5'
                    : 'border-base-300 bg-base-300/10'
                }`}
                style={{
                  width: '80%',
                  aspectRatio: '1.58',
                }}
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

            {/* Captured/processing overlay */}
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

          {/* Actions */}
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
