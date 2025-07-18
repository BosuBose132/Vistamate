import React, { useState, useEffect} from 'react';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.css';
import { generateVCard } from '../../utils/vcard';

const SurveyForm = ({ surveyModel, onReturnHome }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

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
        <button className="btn btn-success mt-3" onClick={handleDownloadVCard}>
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
          setSubmittedData(data);
          setIsCompleted(true);
        }} />
    </div>
  );
};

export default SurveyForm;
