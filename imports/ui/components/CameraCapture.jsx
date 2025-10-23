import React from 'react';
import { useRef, useState, useEffect } from 'react';
import useOpenCV from '/imports/ui/hooks/useOpenCV';
import {
  detectAndWarpCard,
  probeContours,
  centroid,
} from '/imports/ui/lib/cvCardDetect';

const POLL_MS = 200;

const PHASE = {
  ALIGN: 'align',
  STEADY: 'steady',
  READY: 'ready', // green box showing
  CAPTURING: 'capturing',
  PROCESSING: 'processing', // after capture, waiting for OCR + next step
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
  const [greenTimer, setGreenTimer] = useState(0); // seconds amassed while green
  const [lastFrameData, setLastFrameData] = useState(null);
  const [isCheckingOCR, setIsCheckingOCR] = useState(false);
  const [hasCaptured, setHasCaptured] = useState(false);
  const [steadyCount, setSteadyCount] = useState(0); // consecutive steady polls
  const [dbg, setDbg] = useState({
    cvReady: false,
    videoReady: false,
    probe: 0,
  });

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
    const id = setInterval(() => {
      if (hasCaptured) return;
      checkFrameAndOCR();
    }, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastFrameData, greenTimer, isBoxGreen, isCheckingOCR, hasCaptured]);

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
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!cvReady) return; // OpenCV not ready
    if (!video || !canvas) return; // refs not bound yet
    if (!videoReady) return; // wait for metadata
    if (!video.videoWidth || !video.videoHeight) return; // redundant safety
    // draw frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Quick visibility probe (full frame)
    const probe = probeContours(canvas);
    const probeCount =
      probe && typeof probe.count === 'number' ? probe.count : 0;
    setDbg({ cvReady, videoReady, probe: probeCount });
    console.log(
      '[cv] probe count=',
      probeCount,
      'cvReady=',
      cvReady,
      'videoReady=',
      videoReady
    );
    if ((window.__probeOnce ?? 0) < 10) {
      console.log(
        '[cv] probe contours:',
        probeCount,
        'vw/vh:',
        video.videoWidth,
        video.videoHeight
      );
      window.__probeOnce = (window.__probeOnce || 0) + 1;
    }
    const dbg = document.getElementById('cv-debug');
    if (probe.debugB64 && dbg) dbg.src = probe.debugB64;

    // TEMP: force green if enough contours are found
    if (probeCount > 6) {
      setIsBoxGreen(true);
      setPhase(PHASE.READY);
    } else {
      setIsBoxGreen(false);
    }
    // box ROI
    const ratio = 1.58;
    const targetW = Math.floor(canvas.width * 0.8);
    const targetH = Math.floor(targetW / ratio);
    const x = Math.floor((canvas.width - targetW) / 2);
    const y = Math.floor((canvas.height - targetH) / 2);
    const box = { x, y, w: targetW, h: targetH };
    const img = ctx.getImageData(box.x, box.y, box.w, box.h);
    const current = img.data;

    // movement detection → steady vs align
    if (!lastFrameData) {
      // First frame: seed lastFrameData and wait for next poll
      setLastFrameData(current);
      return;
    }
    {
      let diff = 0;
      for (let i = 0; i < current.length; i += 4)
        diff += Math.abs(current[i] - lastFrameData[i]);
      const avg = diff / (current.length / 4);
      console.log('[cam] motion avg:', Math.round(avg));
      if (true) {
        // steady
        if (!isCheckingOCR) {
          setPhase(PHASE.STEADY);
          setIsCheckingOCR(true);
          try {
            const result = detectAndWarpCard(canvas, /*debug*/ true);
            if (result?.debugB64 && dbg) dbg.src = result.debugB64;
            console.log(
              '[cv] detect result:',
              !!result,
              'score:',
              result?.score
            );
            if (result?.roiB64) {
              const out = document.getElementById('cv-roi');
              if (out) out.src = result.roiB64;
            }

            let ok = Boolean(result && result.roiB64);
            // if (ok && result.quad) {
            //   const quadBox = bboxOfQuad(result.quad);
            //   // give a bit of leeway around overlay (±50 px)
            //   const M = 50;
            //   const gateBox = {
            //     x: x - M,
            //     y: y - M,
            //     w: targetW + 2 * M,
            //     h: targetH + 2 * M,
            //   };
            //   const overlap = iouRect(quadBox, gateBox);
            //   console.log(
            //     '[gate] quadBox:',
            //     quadBox,
            //     'gateBox:',
            //     gateBox,
            //     'IoU:',
            //     overlap.toFixed(2)
            //   );
            //   ok = overlap >= 0.15; // ~15% overlap is enough to count as “in the box”
            // }
            if (ok) {
              setIsBoxGreen(true);
              setPhase(PHASE.READY);
              setSteadyCount((c) => {
                const next = c + 1;
                console.log('[steady] count:', next);
                if (!hasCaptured && next >= 2) {
                  setTimeout(() => doCaptureWithROI(result.roiB64), 80);
                }
                return next;
              });
            } else {
              setIsBoxGreen(false);
              setPhase(PHASE.STEADY);
              setSteadyCount(0);
            }
          } finally {
            setIsCheckingOCR(false);
          }
        }
      }
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
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <img id="cv-roi" alt="cv roi" className="mt-2 max-w-xs" />

              {/* Debug thumbnails (kept small to avoid layout shift) */}
              <div className="absolute bottom-2 left-2 flex gap-2 items-end pointer-events-none">
                <div className="bg-base-100/70 rounded p-1 shadow pointer-events-auto">
                  <div className="text-[10px] opacity-70 px-1">ROI</div>
                  <img
                    id="cv-roi"
                    alt="cv roi"
                    className="max-w-[140px] rounded"
                  />
                </div>
                <div className="bg-base-100/70 rounded p-1 shadow pointer-events-auto">
                  <div className="text-[10px] opacity-70 px-1">Edges</div>
                  <img
                    id="cv-debug"
                    alt="cv debug"
                    className="max-w-[140px] rounded"
                  />
                </div>
              </div>

              <button
                className="btn btn-sm mt-2"
                onClick={() => {
                  setIsBoxGreen(true);
                  setPhase(PHASE.READY);
                  setTimeout(() => {
                    setIsBoxGreen(false);
                    setPhase(PHASE.ALIGN);
                  }, 1500);
                }}
              >
                Force Green (1.5s)
              </button>
            </div>
            {/* Debug image — OpenCV overlay */}
            <img id="cv-debug" alt="cv debug" className="mt-2 max-w-xs" />
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

          <div className="text-xs opacity-70 mt-2">
            <span className="mr-3">cvReady: {String(dbg.cvReady)}</span>
            <span className="mr-3">videoReady: {String(dbg.videoReady)}</span>
            <span className="mr-3">probe: {dbg.probe}</span>
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
