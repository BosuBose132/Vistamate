import React, { useState } from 'react';
import WelcomePage from './WelcomePage';
import { Meteor } from 'meteor/meteor';
import { Model } from 'survey-core';
import CameraCapture from './CameraCapture';
import SurveyForm from './SurveyForm';



export const App = () => {
  const [started, setStarted] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [surveyModel, setSurveyModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!started) {
    return <WelcomePage onStart={() => setStarted(true)} />;
  }

  const handleCapture = (base64) => {
    console.log('Captured in App.jsx:', base64);
    setCapturedImage(base64);


    setLoading(true);
    setError(null);
    setOcrResult(null);
    setSurveyModel(null);

    Meteor.call('visitors.processOCR', base64, (err, result) => {
      setLoading(false);

      if (err) {
        console.error('Error calling OCR:', err);
        setError(err.message || 'Error processing OCR');
        return;
      }

      console.log('OCR Result:', result);
      setOcrResult(result);

      if (result) {
        let ocrJson = {};
        try {
          ocrJson = JSON.parse(result.text);
        } catch (e) {
          console.error("Failed to parse OCR JSON:", e);
        }

        const surveyJson = generateSurveyJsonFromOCR(ocrJson);

        const model = new Model(surveyJson);

        model.onComplete.add((sender) => {
          const finalData = sender.data;
          console.log('Final submitted data:', finalData);
          Meteor.call('visitors.checkIn', finalData, (err, res) => {
            if (err) {
              console.error('Error saving visitor:', err);
              alert('Error saving visitor: ' + err.message);
            } else {
              if (res.status === 'duplicate') {
                alert('Visitor already exists');
              } else {
                alert('Visitor successfully checked in!');
              }
            }
          });
        });

        setSurveyModel(model);
      }
    });
  };

  const handleReturnHome = () => {
    setCapturedImage(null);
    setSurveyModel(null);
    setOcrResult(null);
    setLoading(false);
    setError(null);
  };

  const generateSurveyJsonFromOCR = (ocrData = {}) => {
    return {
      title: "Visitor Registration",
      showQuestionNumbers: "off",
      elements: [
        {
          type: "text",
          name: "name",
          title: "Full Name",
          isRequired: true,
          defaultValue: ocrData.name || ""
        },
        {
          type: "text",
          name: "email",
          title: "Email",
          inputType: "email",
          defaultValue: ocrData.email || ""
        },
        {
          type: "text",
          name: "phone",
          title: "Phone Number",
          defaultValue: ocrData.phone || ""
        },
        {
          type: "text",
          name: "company",
          title: "Company / Organization",
          defaultValue: ocrData.company || ""
        },
        {
          type: "text",
          name: "address",
          title: "Address",
          defaultValue: ocrData.address || ""
        },

      ]
    };
  };


  return (
    <div style={{ padding: '20px' }}>
      <h1></h1>

      {loading && <p>Processing OCR... please wait.</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!surveyModel && (
        <>

          <CameraCapture onCapture={handleCapture} />
          {capturedImage && (
            <div>
              <h3>Preview:</h3>
              <img src={capturedImage} alt="Captured" style={{ width: '300px', border: '1px solid #ccc' }} />
            </div>
          )}
        </>
      )}
      {surveyModel && (
        <SurveyForm surveyModel={surveyModel} onReturnHome={handleReturnHome} />
      )}
    </div>
  );



};

export default App;
