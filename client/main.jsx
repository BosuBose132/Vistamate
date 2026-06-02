import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import '/imports/ui/styles/tailwind.css';
import 'survey-core/survey-core.css';

import MainRouter from '/imports/ui/MainRouter.jsx';

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  if (!container) {
    console.error('React target not found');
    return;
  }
  const root = createRoot(container);
  root.render(
    <ThemeProvider>
      <MainRouter />
    </ThemeProvider>,
  );
});
