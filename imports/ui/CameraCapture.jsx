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

  return (
    <div className="container my-5">
      <div className="card shadow p-4">
        <h2 className="text-center mb-4 text-primary">Visitor Check-In - Camera Capture</h2>

        {error && (
          <div className="alert alert-danger text-center">
            {error}
          </div>
        )}

        <div className="video-container text-center mb-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="border rounded"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="d-grid gap-2">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => handleCapture(videoRef, canvasRef, onCapture)}
          >
            📸 Capture & Scan
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
