import React, { useRef, useState, useEffect } from 'react';
import './camera.css';
import Tesseract from 'tesseract.js';
import { Meteor } from 'meteor/meteor';



const handleCapture = (videoRef, canvasRef, onCapture) => {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas) {
    console.error('Video or canvas not available');
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const base64Image = canvas.toDataURL('image/png');
  console.log('Captured base64:', base64Image);

  if (onCapture) {
    onCapture(base64Image);
  }
};


const CameraCapture = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [hasCaptured, setHasCaptured] = useState(false);

  // Box overlay color: black by default
  const [borderColor, setBorderColor] = useState('black');
  // Timer for steady alignment
  const [steadyTimer, setSteadyTimer] = useState(0);
  // Timer for green state
  const [greenTimer, setGreenTimer] = useState(0);
  // Last frame for movement detection
  const [lastFrameData, setLastFrameData] = useState(null);
  // Whether box is green (ID detected and aligned)
  const [isBoxGreen, setIsBoxGreen] = useState(false);
  // For OCR check debounce
  const [isCheckingOCR, setIsCheckingOCR] = useState(false);

  useEffect(() => {
    const enableCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (err) {
        setError('Unable to access camera: ' + err.message);
      }
    };
    enableCamera();
  }, []);

  // Main interval: check alignment and OCR
  useEffect(() => {
    const interval = setInterval(() => {
      checkFrameAndOCR();
    }, 300); // 0.3s for faster response
    return () => clearInterval(interval);
  }, [lastFrameData, steadyTimer, greenTimer, isBoxGreen, isCheckingOCR]);

  // Reset green timer if box not green
  useEffect(() => {
    if (!isBoxGreen) setGreenTimer(0);
  }, [isBoxGreen]);

  // If greenTimer reaches 3, auto-capture
  useEffect(() => {
    if (greenTimer >= 3) {
      handleCapture(videoRef, canvasRef, onCapture);
      setHasCaptured(true);
      setGreenTimer(0);
      setIsBoxGreen(false);
      setBorderColor('black');
    }
  }, [greenTimer]);

  // Check alignment and OCR
  const checkFrameAndOCR = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Draw current frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Get overlay box region (centered)
    const box = {
      x: Math.floor(canvas.width * 0.35),
      y: Math.floor(canvas.height * 0.20),
      w: Math.floor(canvas.width * 0.35),
      h: Math.floor(canvas.height * 0.50)
    };
    const boxImage = ctx.getImageData(box.x, box.y, box.w, box.h);

    // Movement detection (simple diff)
    const currentData = boxImage.data;
    if (lastFrameData) {
      let diff = 0;
      for (let i = 0; i < currentData.length; i += 4) {
        diff += Math.abs(currentData[i] - lastFrameData[i]);
      }
      const averageDiff = diff / (currentData.length / 4);
      // If movement is low, consider steady (less sensitive)
      if (averageDiff < 25) {
        setSteadyTimer(prev => prev + 0.3);
        // Only check OCR if not already checking
        if (!isCheckingOCR) {
          setIsCheckingOCR(true);
          // Convert box region to base64
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = box.w;
          tempCanvas.height = box.h;
          tempCanvas.getContext('2d').putImageData(boxImage, 0, 0);
          const boxBase64 = tempCanvas.toDataURL('image/png');
          // Use OCR API to check for ID card
          checkOCRForText(boxBase64).then(isIdCard => {
            if (isIdCard) {
              setBorderColor('green');
              setIsBoxGreen(true);
              setGreenTimer(prev => prev + 0.3);
            } else {
              setBorderColor('black');
              setIsBoxGreen(false);
              setGreenTimer(0);
            }
            setIsCheckingOCR(false);
          });
        } else if (isBoxGreen) {
          setGreenTimer(prev => prev + 0.3);
        }
      } else {
        setSteadyTimer(0);
        setBorderColor('black');
        setIsBoxGreen(false);
        setGreenTimer(0);
      }
    }
    setLastFrameData(currentData);
  };

  // Use full frame for manual capture
  const captureFrameAsBase64 = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  };

  // Use OpenAI OCR API via Meteor method to check if image is an ID card
  const checkOCRForText = async (imageBase64) => {
    try {
    const result = await Tesseract.recognize(
      imageBase64,
      'eng',
      { logger: m => console.log(m) }
    );

    const text = result.data.text.trim();
    console.log("Tesseract OCR result:", text);

    // Heuristic: check non-space chars + word count
    const nonSpaceChars = text.replace(/\s/g, '').length;
    const words = text.split(/\s+/).filter(Boolean);

    return (nonSpaceChars > 10 || words.length >= 5);
  } catch (err) {
    console.error('Tesseract error:', err);
    return false;
    };
  };

  return (
    <div className="container my-5">
      <div className="card shadow-lg rounded-4 overflow-hidden">
        <div className="bg-dark text-white text-center py-3">
          <h2 className="mb-1">Visitor Check-In</h2>
          <p className="mb-0">Capture your photo to check in</p>
        </div>
        <div className="card-body p-4">
          {error && (
            <div className="alert alert-danger text-center">
              {error}
            </div>
          )}

          <div className="video-container text-center mb-3" style={{ position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="border rounded"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="overlay-box" style={{
              position: 'absolute',
              top: '20%',
              left: '35%',
              width: '35%',
              height: '50%',
              border: `5px solid ${borderColor}`,
              borderRadius: '8px',
              pointerEvents: 'none',
              transition: 'border 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: borderColor === 'green' ? 'green' : 'black',
              fontWeight: 'bold',
              fontSize: '1.2em'
            }}>
              {borderColor === 'green' && (
                <span>Auto-capturing in {Math.max(0, Math.ceil(3 - greenTimer))}s...</span>
              )}
              {borderColor === 'black' && (
                <span>Align your ID card inside the box</span>
              )}
            </div>
          </div>

          <div className="d-grid gap-2">
            <button
              className="btn btn-success btn-lg"
              onClick={() => handleCapture(videoRef, canvasRef, onCapture)}
            >
              Capture & Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
