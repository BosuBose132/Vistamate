/* eslint-disable-next-line unused-imports/no-unused-imports */
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Model } from 'survey-core';
import { FlatDarkPanelless } from 'survey-core/themes';

import SurveyForm from '../components/SurveyForm';
import CameraCapture from '../components/CameraCapture';
import PublicLayout from '../components/PublicLayout';
import 'survey-core/survey-core.css';

function applyOCRDefaults(parsed) {
  return {
    name: parsed?.name ?? '',
    email: parsed?.email ?? '',
    phone: parsed?.phone ?? '',
    company: parsed?.company ?? '',
    dob: parsed?.dob ?? '',
    address: parsed?.address ?? '',
  };
}

//export const App = () => {
export const App = ({ stationId, kioskConfig = {}, assignedSurveyJson }) => {
  const navigate = useNavigate();
  const { requirePhoto = false } = kioskConfig;
  const [capturedImage, setCapturedImage] = useState(null);
  const [surveyModel, setSurveyModel] = useState(null);
  const [loading, setLoading] = useState(false); // <- value + setter
  const [error, setError] = useState(null);
  const [ocrStatus, setOcrStatus] = useState('idle'); // 'idle' | 'processing' | 'processed'
  const hasSurveyModel = Boolean(surveyModel);

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
          ? applyOCRDefaults(assignedSurveyJson, ocrJson) // use assigned survey if available
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
          Meteor.call(
            'visitors.checkIn',
            { ...finalData, stationId },
            (err, res) => {
              if (err) {
                // alert('Error saving visitor: ' + err.message);
                // ensure the survey can be submitted again if there was an error
                try {
                  sender.isCompleted = false;
                } catch {
                  //ignore
                }
              } else if (res.status === 'duplicate') {
                // alert('Visitor already exists');
              } else {
                // alert('Visitor successfully checked in!');
                // 1) Build a small summary for the Thank You page
                const insertedId =
                  typeof res === 'string'
                    ? res
                    : res?.insertedId || res?._id || '';
                const last = {
                  name:
                    `${finalData.firstName || ''} ${finalData.lastName || ''}`.trim() ||
                    finalData.name ||
                    '',
                  company: finalData.company || '',
                  email: finalData.email || '',
                  phone: finalData.phone || '',
                  visitorId: insertedId,
                  checkedAt: Date.now(),
                };

                // 2) Persist for reloads (same tab)
                try {
                  sessionStorage.setItem(
                    'vistamate:lastCheckin',
                    JSON.stringify(last),
                  );
                } catch {
                  // ignore storage errors (private mode, quota exceeded, etc.)
                }

                // 3) Navigate and also pass state (works even if storage is empty)
                navigate('/thankyou', { state: last });
                setSurveyModel(null);
                setCapturedImage(null);
                setOcrStatus('idle');
              }
            },
          );
        });

        setSurveyModel(model);
        setOcrStatus('processed');
      } catch {
        setError('Failed to parse OCR result');
      }
    });
  };

  const generateSurveyJsonFromOCR = (ocrData = {}) => ({
    title: 'Visitor Registration',
    showQuestionNumbers: 'off',
    elements: [
      {
        type: 'text',
        name: 'name',
        title: 'Full Name',
        isRequired: true,
        defaultValue: ocrData.name || '',
      },
      {
        type: 'text',
        name: 'email',
        title: 'Email',
        inputType: 'email',
        defaultValue: ocrData.email || '',
      },
      {
        type: 'text',
        name: 'phone',
        title: 'Phone Number',
        defaultValue: ocrData.phone || '',
      },
      {
        type: 'text',
        name: 'company',
        title: 'Company / Organization',
        defaultValue: ocrData.company || '',
      },
      {
        type: 'text',
        name: 'address',
        title: 'Address',
        defaultValue: ocrData.address || '',
      },
    ],
  });

  return (
    <PublicLayout>
      <section className="bg-base-200 px-4 py-6 text-base-content sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-7xl flex-col justify-center">
          <motion.div
            layout
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={
              hasSurveyModel
                ? 'grid w-full items-start gap-5 lg:grid-cols-[minmax(0,0.92fr)_1px_minmax(0,1.08fr)]'
                : 'flex w-full justify-center'
            }
          >
            {/* CAMERA */}
            <motion.div
              layout
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={hasSurveyModel ? 'w-full' : 'w-full max-w-4xl'}
            >
              <CameraCapture onCapture={handleCapture} ocrStatus={ocrStatus} />
              {(loading || error) && (
                <div className="mt-4">
                  {loading && (
                    <div className="alert rounded-md border-info/30 bg-info/10 text-base-content">
                      <span className="loading loading-spinner loading-sm" />
                      <span>Scanning</span>
                    </div>
                  )}
                  {error && (
                    <div className="alert alert-error mt-3">
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {hasSurveyModel && (
              <div
                className="hidden h-full min-h-[32rem] w-px bg-base-300 lg:block"
                aria-hidden="true"
              />
            )}

            <AnimatePresence mode="wait">
              {surveyModel && (
                <motion.aside
                  key="survey-review"
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="w-full rounded-2xl border border-base-300 bg-base-100/95 p-4 shadow-xl shadow-base-content/5 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between border-b border-base-300 pb-4">
                    <h2 className="text-2xl font-semibold">Review details</h2>
                    {ocrStatus === 'processed' && (
                      <span className="badge badge-success rounded-md">
                        Ready
                      </span>
                    )}
                  </div>
                  <SurveyForm surveyModel={surveyModel} />
                </motion.aside>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default App;
