import React, { useState } from 'react';
import CameraCapture from './components/CameraCapture';

export const App = () => {
  const [capturedImage, setCapturedImage] = useState(null);

  const handleCapture = (base64) => {
    console.log('Captured in App.jsx:', base64);
    setCapturedImage(base64);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>SurveyJS Visitor Registration</h1>
      <CameraCapture onCapture={handleCapture} />
      {capturedImage && (
        <div>
          <h3>Preview:</h3>
          <img src={capturedImage} alt="Captured" style={{ width: '300px', border: '1px solid #ccc' }} />
        </div>
      )}
    </div>
  );
};
