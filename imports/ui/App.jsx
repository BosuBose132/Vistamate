import React, { useState } from 'react';
import CameraCapture from './components/CameraCapture';

export const App = () => {
  const [capturedImage, setCapturedImage] = useState(null);

  const handleCapture = (base64) => {
    console.log('Captured in App.jsx:', base64);
    setCapturedImage(base64);

  
    setLoading(true);
    setError(null);
    setOcrResult(null);

    Meteor.call('visitors.processOCR', base64, (err, result) => {
      setLoading(false);

      if (err) {
        console.error('Error calling OCR:', err);
        setError(err.message || 'Error processing OCR');
        return;
      }

      console.log('OCR Result:', result);
      setOcrResult(result);
    });
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
    {ocrResult && (
        <div>
          <h3>OCR Result JSON:</h3>
          <pre style={{ background: '#f4f4f4', padding: '10px' }}>
            {JSON.stringify(ocrResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
