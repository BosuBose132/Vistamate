import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Model } from 'survey-core';
import CameraCapture from '../components/CameraCapture';
import SurveyForm from '../components/SurveyForm';
import 'survey-core/survey-core.css';
import { FlatDarkPanelless } from "survey-core/themes";
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

//export const App = () => {
export const App = ({ stationId, kioskConfig = {}, assignedSurveyJson }) => {
  const navigate = useNavigate();
  const { cameraEnabled = true, requirePhoto = false, mobileBehavior = 'toggle', welcomeMessage = '' } = kioskConfig;
  const [capturedImage, setCapturedImage] = useState(null);
  const [surveyModel, setSurveyModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ocrStatus, setOcrStatus] = useState('idle'); // 'idle' | 'processing' | 'processed'

  const handleCapture = (base64) => {
    console.log('Captured in App.jsx:', base64);
    setCapturedImage(base64);
    setLoading(true);
    setOcrStatus('processing');
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
        model.showCompletedPage = false;

        model.onComplete.add((sender) => {
          if (requirePhoto && !capturedImage) {
            alert('Please capture a photo before submitting.');
            return;
          }
          const finalData = sender.data;
          //Meteor.call('visitors.checkIn', finalData, (err, res) => {
          Meteor.call('visitors.checkIn', { ...finalData, stationId }, (err, res) => {
            if (err) {
              // alert('Error saving visitor: ' + err.message);
              // ensure the survey can be submitted again if there was an error
              try { sender.isCompleted = false; } catch { }
            } else if (res.status === 'duplicate') {
              // alert('Visitor already exists');
            } else {
              // alert('Visitor successfully checked in!');
              // 1) Build a small summary for the Thank You page
              const last = {
                name: `${finalData.firstName || ''} ${finalData.lastName || ''}`.trim() || finalData.name || '',
                company: finalData.company || '',
                email: finalData.email || '',
                phone: finalData.phone || '',
                visitorId: res?.insertedId || res?._id || '',
                checkedAt: Date.now(),
              };

              // 2) Persist for reloads (same tab)
              try { sessionStorage.setItem('vistamate:lastCheckin', JSON.stringify(last)); } catch { }

              // 3) Navigate and also pass state (works even if storage is empty)
              navigate('/thankyou', { state: last });
              setSurveyModel(null);
              setCapturedImage(null);
              setOcrStatus('idle');
            }
          });
        });

        setSurveyModel(model);
        setOcrStatus('processed');
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
    <div className="min-h-screen w-full flex flex-col md:flex-row items-center justify-center gap-6 px-4 py-10 bg-base-200 text-base-content">
      {/* CAMERA */}
      <div className="w-full md:w-1/2 flex justify-center items-center">
        <CameraCapture onCapture={handleCapture} ocrStatus={ocrStatus} />
      </div>
      {/* Divider: vertical on desktop, horizontal on mobile */}
      <div className="hidden md:block self-stretch w-px bg-base-300/80 rounded-full" aria-hidden="true" />
      <div className="md:hidden h-px w-full bg-base-300/80 rounded-full" aria-hidden="true" />

      {/* SURVEY FORM */}
      {surveyModel && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full md:w-1/2 flex justify-center items-center md:items-center"
        >
          <SurveyForm surveyModel={surveyModel} />
        </motion.div>
      )}
    </div>
  )
};

export default App;
