import React, { useRef, useState, useEffect, useMemo } from 'react';
import Tesseract from 'tesseract.js';
import { Meteor } from 'meteor/meteor';

const POLL_MS = 200;

const PHASE = {
  ALIGN: 'align',
  STEADY: 'steady',
  READY: 'ready',        // green box showing
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
  return <span className={`badge ${cls} gap-2`}><LoadingDot phase={phase} />{txt}</span>;
};

const LoadingDot = ({ phase }) => (
  <span className={`inline-block h-2 w-2 rounded-full ${phase === PHASE.PROCESSING || phase === PHASE.CAPTURING || phase === PHASE.READY
    ? 'animate-pulse bg-current'
    : 'bg-current/60'
    }`} />
);

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

  const [error, setError] = useState(null);
  const [phase, setPhase] = useState(PHASE.ALIGN);
  const [isBoxGreen, setIsBoxGreen] = useState(false);
  const [greenTimer, setGreenTimer] = useState(0); // seconds amassed while green
  const [lastFrameData, setLastFrameData] = useState(null);
  const [isCheckingOCR, setIsCheckingOCR] = useState(false);
  const [hasCaptured, setHasCaptured] = useState(false);

  // camera on
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setError('Unable to access camera: ' + err.message);
      }
    })();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks?.() || [];
        tracks.forEach(t => t.stop());
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

  const checkFrameAndOCR = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // draw frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // box ROI
    const box = {
      x: Math.floor(canvas.width * 0.2),
      y: Math.floor(canvas.height * 0.18),
      w: Math.floor(canvas.width * 0.6),
      h: Math.floor(canvas.height * 0.48)
    };
    const img = ctx.getImageData(box.x, box.y, box.w, box.h);
    const current = img.data;

    // movement detection → steady vs align
    if (lastFrameData) {
      let diff = 0;
      for (let i = 0; i < current.length; i += 4) diff += Math.abs(current[i] - lastFrameData[i]);
      const avg = diff / (current.length / 4);
      if (avg < 30) {
        // steady
        if (!isCheckingOCR) {
          setPhase(PHASE.STEADY);
          setIsCheckingOCR(true);
          const temp = document.createElement('canvas');
          temp.width = box.w; temp.height = box.h;
          temp.getContext('2d').putImageData(img, 0, 0);
          const b64 = temp.toDataURL('image/png');

          const ok = await quickOCRHeuristic(b64);
          if (ok) {
            setIsBoxGreen(true);
            setPhase(PHASE.READY);
            if (!hasCaptured) {
              // A tiny debounce (100ms) smooths accidental flicker without feeling slower.
              setTimeout(() => doCapture(), 100);
            }
          } else {
            setIsBoxGreen(false);
            setPhase(PHASE.STEADY);

          }
          setIsCheckingOCR(false);
        }
      } else {
        // moving
        setPhase(PHASE.ALIGN);
        setIsBoxGreen(false);
        setGreenTimer(0);
      }
    }
    setLastFrameData(current);
  };

  const quickOCRHeuristic = async (b64) => {
    try {
      const result = await Tesseract.recognize(b64, 'eng', { logger: () => { } });
      const text = result.data.text || '';
      const conf = result.data.confidence || 0;
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const nonSpaceChars = text.replace(/\s/g, '').length;
      // light heuristic
      return ((nonSpaceChars >= 30 && words >= 5 && conf >= 25) || (conf >= 50 && words >= 8));
    } catch {
      return false;
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
              <p className="opacity-70">Please align your business card within the box to check in</p>
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
            </div>

            {/* Overlay box */}
            <div
              className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all`}
            >
              <div
                className={`rounded-2xl px-8 py-16 border-4 transition-all duration-300
                ${isBoxGreen ? 'border-success/80 shadow-[0_0_24px_4px_rgba(34,197,94,0.35)] bg-success/5' : 'border-base-300 bg-base-300/10'}`}
                style={{
                  width: '70%',
                  height: '60%',
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  {isBoxGreen
                    ? <span className="font-semibold text-success animate-pulse">Auto-capturing… hold steady</span>
                    : <span className="opacity-80">Align your business card inside the box</span>}
                </div>
              </div>
            </div>

            {/* Captured/processing overlay */}
            {hasCaptured && (
              <div className="absolute inset-0 bg-base-100/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-base-content">
                {ocrStatus === 'processed' ? (
                  <>
                    <div className="text-success">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <p className="font-semibold">OCR processed — review the form</p>
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
              disabled={hasCaptured || phase === PHASE.CAPTURING || phase === PHASE.PROCESSING}
            >
              {hasCaptured ? 'Processing…' : 'Capture & Scan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
