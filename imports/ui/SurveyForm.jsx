import React, { useState, useEffect} from 'react';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.css';

const SurveyForm = ({ surveyModel, onReturnHome }) => {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (surveyModel?.isCompleted) {
      surveyModel.isCompleted = false;
    }
  }, [surveyModel]);

  if (!surveyModel) {
    return <p>No form to display yet. Capture an ID first!</p>;
  }

  if (isCompleted) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h2>Thank you for submitting the form!</h2>
        <button
          className="btn btn-primary mt-4"
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
      <Survey model={surveyModel} onComplete={() => setIsCompleted(true)} />
    </div>
  );
};

export default SurveyForm;
