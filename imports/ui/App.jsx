import React, { useState } from 'react';
import CameraCapture from './components/CameraCapture';
import { Model } from 'survey-core';
const [surveyModel, setSurveyModel] = useState(null);


export const App = () => {
  const [capturedImage, setCapturedImage] = useState(null);

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
        const surveyJson = generateSurveyJsonFromOCR(result);
        const model = new Model(surveyJson);

        model.onComplete.add((sender) => {
          const finalData = sender.data;
          console.log('Final submitted data:', finalData);
           Meteor.call('visitors.checkIn', finalData, (err, res) => {
            if (err) {
              console.error('Error saving visitor:', err);
              alert('Error saving visitor: ' + err.message);
            } else {
              console.log('Visitor saved:', res);
              alert('Visitor successfully checked in!');
            }
          });
        });

        setSurveyModel(model);
      }
    });
  };
      const generateSurveyJsonFromOCR = (ocrData) => {
        const elements = [];

        if ('name' in ocrData) {
          elements.push({
            type: "text",
            name: "name",
            title: "Full Name",
            isRequired: true,
            defaultValue: ocrData.name || ""
          });
        }

        if ('email' in ocrData) {
          elements.push({
            type: "text",
            name: "email",
            title: "Email",
            inputType: "email",
            defaultValue: ocrData.email || ""
          });
        }

        if ('phone' in ocrData) {
          elements.push({
            type: "text",
            name: "phone",
            title: "Phone Number",
            defaultValue: ocrData.phone || ""
          });
        }

        if ('dob' in ocrData) {
          elements.push({
            type: "text",
            name: "dob",
            title: "Date of Birth",
            defaultValue: ocrData.dob || ""
          });
        }

        if ('gender' in ocrData || 'sex' in ocrData) {
          elements.push({
            type: "dropdown",
            name: "gender",
            title: "Gender",
            choices: ["M", "F", "Other"],
            defaultValue: ocrData.gender || ocrData.sex || ""
          });
        }

        return {
          title: "Visitor Registration",
          elements
        };
      };


      return (
        <div style={{ padding: '20px' }}>
          <h1>SurveyJS Visitor Registration</h1>

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
        <SurveyForm surveyModel={surveyModel} />
      )}
    </div>
      );
    };
