import React, { useRef, useState, useEffect } from 'react';

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
