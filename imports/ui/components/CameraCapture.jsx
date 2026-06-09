/* eslint-disable-next-line unused-imports/no-unused-imports */
import React from 'react';
import { Meteor } from 'meteor/meteor';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';

const ENABLE_AI_DETECTION = true;
const AI_POLL_MS = 1000;
const AI_CONFIDENCE_MIN = 0.45;
const AI_STABLE_FRAMES_REQUIRED = 2;
const AI_CAPTURE_DELAY_MS = 400;
const AI_MISSES_ALLOWED = 2;

const CAMERA_CONSTRAINTS = [
  {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      aspectRatio: { ideal: 16 / 9 },
      frameRate: { ideal: 30 },
      resizeMode: { ideal: 'none' },
    },
    audio: false,
  },
  {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      aspectRatio: { ideal: 16 / 9 },
      frameRate: { ideal: 30 },
      resizeMode: { ideal: 'none' },
    },
    audio: false,
  },
];

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

const StatusBadge = ({ phase, ocrStatus }) => {
  const map = {
    [PHASE.ALIGN]: { txt: 'Place card', cls: 'badge-outline' },
    [PHASE.STEADY]: { txt: 'Hold steady', cls: 'badge-warning' },
    [PHASE.READY]: { txt: 'Scanning', cls: 'badge-success' },
    [PHASE.CAPTURING]: { txt: 'Capturing', cls: 'badge-info' },
    [PHASE.PROCESSING]: {
      txt: ocrStatus === 'processed' ? 'Ready' : 'Scanning',
      cls: ocrStatus === 'processed' ? 'badge-success' : 'badge-info',
    },
  };
  const { txt, cls } = map[phase] || { txt: 'Ready', cls: 'badge-ghost' };
  return (
    <motion.span
      key={`${phase}-${ocrStatus}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`badge ${cls} gap-2 rounded-md px-3 py-2 text-xs font-medium`}
      aria-live="polite"
    >
      <LoadingDot phase={phase} />
      {txt}
    </motion.span>
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

const getCameraStream = async () => {
  let fallbackError;

  for (const constraints of CAMERA_CONSTRAINTS) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      fallbackError = err;
      if (
        err?.name === 'NotAllowedError' ||
        err?.name === 'NotFoundError' ||
        err?.name === 'SecurityError'
      ) {
        throw err;
      }
    }
  }

  throw fallbackError;
};

export default function CameraCapture({ onCapture, ocrStatus = 'idle' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
  const aiCheckingRef = useRef(false);
  const aiCaptureTimerRef = useRef(null);
  const aiMissCountRef = useRef(0);
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
        stream = await getCameraStream();
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
  const checkAIFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!ENABLE_AI_DETECTION) return;
    if (hasCapturedRef.current) return;
    if (!videoReady) return;
    if (!video || !canvas) return;
    if (!video.videoWidth || !video.videoHeight) return;
    if (aiCheckingRef.current) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frameB64 = canvas.toDataURL('image/jpeg', 0.75);

    aiCheckingRef.current = true;

    Meteor.call('visitors.detectIdCard', frameB64, (err, result) => {
      aiCheckingRef.current = false;

      if (err) {
        console.error('[ai] ID card detection failed:', err);
        setIsBoxGreen(false);
        setPhase(PHASE.ALIGN);
        steadyCountRef.current = 0;
        return;
      }

      console.log('[ai] ID card detection:', result);

      const confidence = result?.prediction?.confidence ?? 0;
      const ok = Boolean(result?.ok && confidence >= AI_CONFIDENCE_MIN);

      if (ok) {
        aiMissCountRef.current = 0;
        setIsBoxGreen(true);
        steadyCountRef.current += 1;

        // First valid frame: show hold steady
        if (steadyCountRef.current < AI_STABLE_FRAMES_REQUIRED) {
          setPhase(PHASE.STEADY);
          return;
        }

        // After stable detections: show ready and capture once
        setPhase(PHASE.READY);

        if (!hasCapturedRef.current && !aiCaptureTimerRef.current) {
          hasCapturedRef.current = true;

          aiCaptureTimerRef.current = setTimeout(() => {
            aiCaptureTimerRef.current = null;
            doCapture();
          }, AI_CAPTURE_DELAY_MS);
        }

        return;
      }

      aiMissCountRef.current += 1;

      if (
        aiMissCountRef.current <= AI_MISSES_ALLOWED &&
        steadyCountRef.current > 0
      ) {
        setIsBoxGreen(true);
        setPhase(PHASE.STEADY);
        return;
      }

      setIsBoxGreen(false);
      setPhase(PHASE.ALIGN);
      steadyCountRef.current = 0;
      aiMissCountRef.current = 0;
    });
  }, [videoReady, doCapture]);

  // ── FIX: Single polling loop (was duplicated before) ───────────────────
  // Dependencies include cvReady and videoReady so the loop restarts with
  // a fresh closure when the camera or OpenCV becomes ready.
  useEffect(() => {
    if (!ENABLE_AI_DETECTION) return undefined;

    const id = setInterval(checkAIFrame, AI_POLL_MS);
    return () => clearInterval(id);
  }, [checkAIFrame]);

  // ── JSX ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <motion.div
        layout
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-base-300 bg-base-100/95 text-base-content shadow-xl shadow-base-content/5"
      >
        <div className="border-b border-base-300 bg-base-100/90 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Check in</h2>
              <span className="text-sm text-base-content/60">
                Place your card inside the frame
              </span>
            </div>
            <StatusBadge phase={phase} ocrStatus={ocrStatus} />
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {/* Video area */}
          <div className="relative overflow-hidden rounded-2xl border border-base-300 bg-neutral shadow-inner">
            <div className="aspect-video w-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full bg-neutral object-contain transition-opacity duration-300 ${
                  videoReady ? 'opacity-100' : 'opacity-50'
                }`}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {!videoReady && !error && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral/40 text-neutral-content">
                <div className="flex items-center gap-3 rounded-md border border-white/15 bg-black/35 px-4 py-3 backdrop-blur">
                  <span className="loading loading-spinner loading-sm" />
                  <span className="text-sm font-medium">Starting camera</span>
                </div>
              </div>
            )}

            {/* Overlay guide box */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-8">
              <motion.div
                animate={{
                  borderColor: isBoxGreen
                    ? 'rgb(34 197 94)'
                    : 'rgba(255,255,255,0.58)',
                }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className={`relative rounded-2xl border bg-transparent text-center ${
                  isBoxGreen
                    ? 'shadow-[0_0_34px_rgba(34,197,94,0.32)]'
                    : 'shadow-[0_20px_70px_rgba(0,0,0,0.16)]'
                }`}
                style={{ width: '76%', aspectRatio: '1.58' }}
              >
                <span
                  className={`absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md px-2.5 py-1 text-xs font-medium shadow-sm ${
                    isBoxGreen
                      ? 'bg-success text-success-content'
                      : 'bg-base-100/75 text-base-content/70'
                  }`}
                >
                  {isBoxGreen ? 'Hold steady' : 'Place card'}
                </span>
              </motion.div>
            </div>

            {/* Post-capture overlay */}
            <AnimatePresence>
              {hasCaptured && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-base-100/88 px-6 text-center text-base-content backdrop-blur-md"
                >
                  {ocrStatus === 'processed' ? (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-success/12 text-success">
                        <svg
                          className="h-7 w-7"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold">Review details</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="loading loading-spinner loading-lg text-primary" />
                      <div>
                        <p className="font-semibold">Scanning</p>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error mt-4 rounded-md">
              <span>{error}</span>
            </div>
          )}

          {/* Manual capture button */}
          <div className="mt-4 flex justify-center">
            <button
              className="btn btn-primary min-w-44 rounded-md"
              onClick={doCapture}
              disabled={
                hasCaptured ||
                phase === PHASE.CAPTURING ||
                phase === PHASE.PROCESSING
              }
            >
              {hasCaptured ? 'Scanning' : 'Capture'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
