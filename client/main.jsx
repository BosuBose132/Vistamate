import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import MainRouter from '/imports/ui/MainRouter';
import '/imports/ui/styles/tailwind.css';
import 'survey-core/survey-core.css';


Meteor.startup(() => {
  const container = document.getElementById('react-target');
  const root = createRoot(container);
  root.render(<MainRouter />);
});
