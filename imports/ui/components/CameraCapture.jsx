import React, { useRef, useState, useEffect } from 'react';
import '../styles/camera.css';
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
  const [borderColor, setBorderColor] = useState('border-black-500');
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
      if (hasCaptured) return;
      checkFrameAndOCR();
    }, 300); // 0.3s for faster response
    return () => clearInterval(interval);
  }, [lastFrameData, steadyTimer, greenTimer, isBoxGreen, isCheckingOCR, hasCaptured]);

  // Reset green timer if box not green
  useEffect(() => {
    if (isBoxGreen) {
      setGreenTimer(prev => prev + 0.3);
    }
  }, [isBoxGreen]);

  // If greenTimer reaches 3, auto-capture
  useEffect(() => {
    if (greenTimer >= 0.5 && !hasCaptured) {
      handleCapture(videoRef, canvasRef, onCapture);
      setHasCaptured(true);
      setGreenTimer(0);
      setIsBoxGreen(false);
      setBorderColor('border-gray-500');
      //setSteadyTimer(0);
    }
  }, [greenTimer, hasCaptured]);

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

    const currentData = boxImage.data;
    if (lastFrameData) {
      let diff = 0;
      for (let i = 0; i < currentData.length; i += 4) {
        diff += Math.abs(currentData[i] - lastFrameData[i]);
      }
      const averageDiff = diff / (currentData.length / 4);
      if (averageDiff < 30) {
        setSteadyTimer(prev => prev + 0.3);
        if (!isCheckingOCR) {
          setIsCheckingOCR(true);
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = box.w;
          tempCanvas.height = box.h;
          tempCanvas.getContext('2d').putImageData(boxImage, 0, 0);
          const boxBase64 = tempCanvas.toDataURL('image/png');

          checkOCRForText(boxBase64).then(isIdCard => {
            if (isIdCard) {
              if (!isBoxGreen) {
                setIsBoxGreen(true);
                setGreenTimer(0); // Fresh timer start
              } else {
                setGreenTimer(prev => prev + 0.3); // Accumulate if already green
              }
              setBorderColor('border-green-500');
            } else {
              if (greenTimer < 0.5) {
                setIsBoxGreen(false);
                setGreenTimer(0);
                setBorderColor('border-gray-500');
              }
            }
            setIsCheckingOCR(false);
          });
        } else if (isBoxGreen) {
          setGreenTimer(prev => prev + 0.3);
        }
      } else {
        setSteadyTimer(0);
        setBorderColor('border-gray-500');
        setIsBoxGreen(false);
        setGreenTimer(0);
      }
    }
    setLastFrameData(currentData);
  };


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


  const checkOCRForText = async (imageBase64) => {
    try {
      const result = await Tesseract.recognize(
        imageBase64,
        'eng',
        { logger: m => console.log(m) }
      );

      const text = result.data.text.trim();
      console.log("Tesseract OCR result:", text);


      const nonSpaceChars = text.replace(/\s/g, '').length;
      const words = text.split(/\s+/).filter(Boolean);
      const keywordMatch = /name|dob|birth|dl|license|state|id|driver|usa|sex|height|address|restrictions/i.test(text);
      const confidence = result.data.confidence || 0;

      // console.log("------ OCR DEBUG ------");
      // console.log("Text:", text);
      // console.log("Confidence:", confidence);
      // console.log("Word count:", words.length);
      // console.log("Non-space chars:", nonSpaceChars);
      // console.log("Keyword Match:", keywordMatch);

      // Final detection logic
      return (
        (nonSpaceChars >= 30 && words.length >= 5 && confidence >= 25) || // common case
        (confidence >= 50 && words.length >= 8)                          // strong case fallback
      );
    } catch (err) {
      console.error('Tesseract error:', err);
      return false;
    };
  };


  return (

    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 px-2 py-8 sm:px-6 md:px-8">
      <div className="w-full max-w-2xl bg-gray-800/80 rounded-2xl shadow-2xl p-6 md:p-10 flex flex-col items-center">
        <div className="w-full flex flex-col items-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 text-center drop-shadow-lg">Visitor Check-In</h2>
          <p className="text-lg md:text-xl text-gray-300 text-center font-medium">Please align your ID card within the box to check in</p>
        </div>

        {error && (
          <div className="w-full text-red-400 bg-red-900/40 border border-red-700 rounded-lg py-2 px-4 text-center font-semibold mb-4 animate-pulse">
            {error}
          </div>
        )}

        <div className="relative w-full aspect-[16/9] max-h-[420px] rounded-xl overflow-hidden shadow-lg bg-gray-900 border border-gray-700 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-xl"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay Box */}
          <div
            className={`absolute border-4 ${borderColor} rounded-xl transition-all duration-300 flex items-center justify-center pointer-events-none`}
            style={{
              top: '20%',
              left: '15%',
              width: '70%',
              height: '60%',
              boxShadow: borderColor === 'border-green-500' ? '0 0 24px 4px #22c55e88' : '0 0 16px 2px #0008',
              background: isBoxGreen ? 'rgba(34,197,94,0.07)' : 'rgba(0,0,0,0.10)',
              borderColor: borderColor === 'border-green-500' ? '#22c55e' : '#64748b',
              color: borderColor === 'border-green-500' ? '#22c55e' : '#e5e7eb',
              fontWeight: 600,
              fontSize: '1.1rem',
              zIndex: 10,
            }}
          >
            <div className="w-full text-center flex items-center justify-center">
              {isBoxGreen ? (
                <span className="text-green-400 font-bold animate-pulse">Auto-capturing, Please wait...</span>
              ) : (
                <span className="text-gray-200 font-semibold">Align your ID card inside the box</span>
              )}
            </div>
          </div>
        </div>

        {/* Capture Button */}
        <div className="flex justify-center w-full mt-8">
          <button
            className="bg-green-600 hover:bg-green-500 active:bg-green-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => handleCapture(videoRef, canvasRef, onCapture)}
            disabled={hasCaptured || isBoxGreen}
          >
            {isBoxGreen ? 'Capturing...' : 'Capture & Scan'}
          </button>
        </div>
      </div>
    </div>
  );

};

export default CameraCapture;
