import React from 'react';
import { Meteor } from 'meteor/meteor';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Spinner,
} from '@mieweb/ui';
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
    [PHASE.ALIGN]: { txt: 'Place card', variant: 'outline' },
    [PHASE.STEADY]: { txt: 'Hold steady', variant: 'warning' },
    [PHASE.READY]: { txt: 'Scanning', variant: 'success' },
    [PHASE.CAPTURING]: { txt: 'Capturing', variant: 'info' },
    [PHASE.PROCESSING]: {
      txt: ocrStatus === 'processed' ? 'Ready' : 'Scanning',
      variant: ocrStatus === 'processed' ? 'success' : 'info',
    },
  };
  const { txt, variant } = map[phase] || { txt: 'Ready', variant: 'secondary' };
  return (
    <motion.div
      key={`${phase}-${ocrStatus}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      aria-live="polite"
    >
      <Badge
        variant={variant}
        className="gap-2 rounded-md px-3 py-2 text-xs font-medium"
      >
        <LoadingDot phase={phase} />
        {txt}
      </Badge>
    </motion.div>
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
        className="mx-auto w-full max-w-4xl"
      >
        <Card
          padding="none"
          variant="elevated"
          className="overflow-hidden border border-border bg-card/95 text-foreground"
        >
          <CardHeader className="border-b border-border bg-card/90 px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle as="h2" className="text-xl">
                  Card detection
                </CardTitle>
                <CardDescription>
                  Place your card inside the frame
                </CardDescription>
              </div>

              <StatusBadge phase={phase} ocrStatus={ocrStatus} />
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-neutral shadow-inner">
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
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral/40 text-foreground">
                  <Card
                    padding="sm"
                    className="flex items-center gap-3 rounded-md border border-white/15 bg-black/35 text-white backdrop-blur"
                  >
                    <Spinner size="sm" />
                    <span className="text-sm font-medium">Starting camera</span>
                  </Card>
                </div>
              )}

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
                  <Badge
                    variant={isBoxGreen ? 'success' : 'outline'}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md px-2.5 py-1 text-xs font-medium shadow-sm"
                  >
                    {isBoxGreen ? 'Hold steady' : 'Place card'}
                  </Badge>
                </motion.div>
              </div>

              <AnimatePresence>
                {hasCaptured && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute inset-0 z-30 flex items-center justify-center bg-card/88 px-6 text-center text-foreground backdrop-blur-md"
                  >
                    <Card
                      padding="lg"
                      className="flex flex-col items-center justify-center gap-3 border border-border bg-card/95 text-center shadow-xl"
                    >
                      {ocrStatus === 'processed' ? (
                        <>
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-success/12 text-success">
                            <Check className="h-7 w-7" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="font-semibold">Review details</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Spinner size="lg" className="text-primary" />
                          <div>
                            <p className="font-semibold">Scanning</p>
                          </div>
                        </>
                      )}
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                {error}
              </Alert>
            )}
          </CardContent>

          <CardFooter className="border-t border-border px-4 py-4">
            <CardActions align="center" className="w-full pt-0">
              <Button
                variant="primary"
                className="min-w-44 rounded-md"
                onClick={doCapture}
                disabled={
                  hasCaptured ||
                  phase === PHASE.CAPTURING ||
                  phase === PHASE.PROCESSING
                }
              >
                {hasCaptured ? 'Scanning' : 'Capture'}
              </Button>
            </CardActions>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
