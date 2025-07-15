import React, { useRef, useState, useEffect } from 'react';
import './camera.css';



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

  const [borderColor, setBorderColor] = useState('red');
  const [steadyTimer, setSteadyTimer] = useState(0);
  const [lastFrameData, setLastFrameData] = useState(null);

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
  useEffect(() => {
    const interval = setInterval(() => {
      checkSteadyFrame();
    }, 500);
    return () => clearInterval(interval);
  }, [lastFrameData, steadyTimer]);

  const checkSteadyFrame = () => {

    const triggerAutoCapture = () => {
      handleCapture(videoRef, canvasRef, onCapture);
      setSteadyTimer(0);
      setBorderColor('red');
    };
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    if (lastFrameData) {
      let diff = 0;
      for (let i = 0; i < currentData.length; i += 4) {
        diff += Math.abs(currentData[i] - lastFrameData[i]);
      }
      const averageDiff = diff / (currentData.length / 4);

      if (averageDiff < 10) {
        setSteadyTimer(prev => prev + 0.5);
        if (steadyTimer >= 3) {
          setBorderColor('green');
          triggerAutoCapture();
        } else {
          setBorderColor('orange');
        }
      } else {
        setSteadyTimer(0);
        setBorderColor('red');
      }
    }

    setLastFrameData(currentData);
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
              left: '20%',
              width: '40%',
              height: '40%',
              border: `5px solid ${borderColor}`,
              borderRadius: '8px',
              pointerEvents: 'none',
              transition: 'border 0.3s'
            }}></div>
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
