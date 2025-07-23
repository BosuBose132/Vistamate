import React, { useState, useEffect } from 'react';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.css';
import { generateVCard } from '../../utils/vcard';
import { QRCodeSVG } from 'qrcode.react';




const SurveyForm = ({ surveyModel, onReturnHome }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [visitorData, setVisitorData] = useState(null);


  useEffect(() => {
    if (surveyModel?.isCompleted) {
      surveyModel.isCompleted = false;
    }
  }, [surveyModel]);

  if (!surveyModel) {
    return <p className="text-center text-slate-600 text-lg py-6">No form to display yet. Capture an ID first!</p>;
  }

  const handleDownloadVCard = () => {
    if (!submittedData) return;

    const vcardText = generateVCard(submittedData);
    const blob = new Blob([vcardText], { type: 'text/vcard' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${submittedData.name || 'visitor'}.vcf`;
    link.click();
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-white text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Thank you for submitting the form!</h2>
        {visitorData && (
          <div className="my-6">
            <p className="text-slate-600 mb-2">Scan to get contact details</p>
            <QRCodeSVG value={generateVCard(visitorData)} size={160} />
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition" onClick={handleDownloadVCard}>
            Download Contact Card
          </button>
          <button
            className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-lg font-medium transition"
            onClick={onReturnHome}
          >
            Return to Home
          </button>
          {console.log("visitorData in QR code:", visitorData)}
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2></h2>
      <Survey model={surveyModel}
        onComplete={(sender) => {
          const data = sender.data;
          setVisitorData(data);
          setSubmittedData(data);
          setIsCompleted(true);
        }} />
    </div>
  );
};

export default SurveyForm;
