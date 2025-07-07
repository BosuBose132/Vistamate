import React, { useRef, useState, useEffect } from 'react';

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
    <div>
      <h2>Camera Capture</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '400px', border: '1px solid #ccc' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button onClick={() => handleCapture(videoRef, canvasRef, onCapture)}>Capture & Scan</button>
    </div>
  );
};

export default CameraCapture;
