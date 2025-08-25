import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Model } from 'survey-core';
import CameraCapture from '../components/CameraCapture';
import SurveyForm from '../components/SurveyForm';
import 'survey-core/survey-core.css';
import { FlatDarkPanelless } from "survey-core/themes";
import { motion } from 'framer-motion';

//export const App = () => {
export const App = ({ stationId, kioskConfig = {}, assignedSurveyJson }) => {
  const { cameraEnabled = true, requirePhoto = false, mobileBehavior = 'toggle', welcomeMessage = '' } = kioskConfig;
  const [capturedImage, setCapturedImage] = useState(null);
  const [surveyModel, setSurveyModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCapture = (base64) => {
    console.log('Captured in App.jsx:', base64);
    setCapturedImage(base64);
    setLoading(true);
    setSurveyModel(null);
    setError(null);

    Meteor.call('visitors.processOCR', base64, (err, result) => {
      setLoading(false);

      if (err) {
        console.error('Error calling OCR:', err);
        setError(err.message || 'Error processing OCR');
        return;
      }

      try {
        const ocrJson = JSON.parse(result.text);
        // const surveyJson = generateSurveyJsonFromOCR(ocrJson);
        const surveyJson = assignedSurveyJson
          ? applyOCRDefaults(assignedSurveyJson, ocrJson)  // use assigned survey if available
          : generateSurveyJsonFromOCR(ocrJson);
        const model = new Model(surveyJson);
        model.applyTheme(FlatDarkPanelless);

        model.onComplete.add((sender) => {
          if (requirePhoto && !capturedImage) {
            alert('Please capture a photo before submitting.');
            return;
          }
          const finalData = sender.data;
          //Meteor.call('visitors.checkIn', finalData, (err, res) => {
          Meteor.call('visitors.checkIn', { ...finalData, stationId }, (err, res) => {
            if (err) {
              alert('Error saving visitor: ' + err.message);
            } else if (res.status === 'duplicate') {
              alert('Visitor already exists');
            } else {
              alert('Visitor successfully checked in!');
            }
          });
        });

        setSurveyModel(model);
      } catch (e) {
        setError('Failed to parse OCR result');
      }
    });
  };

  const generateSurveyJsonFromOCR = (ocrData = {}) => ({
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
  });

  return (
    <div className="min-h-screen w-full flex flex-row md:flex-row items-start justify-center gap-6 px-4 py-6 bg-gradient-to-b from-slate-900 to-slate-800">
      {/* CAMERA */}
      <div className="w-full md:w-1/2 flex justify-center items-start">
        <CameraCapture onCapture={handleCapture} />
      </div>

      {/* SURVEY FORM */}
      {surveyModel && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full md:w-1/2 flex justify-center items-start"
        >
          <SurveyForm surveyModel={surveyModel} />
        </motion.div>
      )}
    </div>
  )
};

export default App;
