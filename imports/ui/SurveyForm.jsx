import React, { useState, useEffect } from 'react';
import SurveyForm from './SurveyForm';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.css';
import { generateVCard } from '../../utils/vcard';
import { QRCode } from 'qrcode.react';


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
    return <p>No form to display yet. Capture an ID first!</p>;
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
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h2>Thank you for submitting the form!</h2>
        <div className="my-4">
          <p>Scan to get contact details</p>
          <QRCode value={generateVCard(visitorData)} size={160} />
        </div>
        <button className="btn btn-success gap-3 mt-4" onClick={handleDownloadVCard}>
          Download Contact Card
        </button>
        <button
          className="btn btn-primary mt-4 ms-2"
          onClick={onReturnHome}
        >
          Return to Home
        </button>
      </div>
    );
  }
  return (
    <div>
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
