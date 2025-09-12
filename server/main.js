import { Meteor } from 'meteor/meteor';
import '/imports/api/methods';
import { Roles } from 'meteor/alanning:roles';
import '/imports/api/adminSetup';

import '/imports/api/stations/stations.collection';
import '/imports/api/stations/stations.methods';
import '/imports/api/stations/stations.publications';

import '/imports/api/surveys/surveys.collection';
import '/imports/api/surveys/surveys.methods';
import '/imports/api/surveys/surveys.publications';

import '/imports/api/visitors/visitors.publications';

import '/server/startup.seedStations';
//import '/server/startup.ensureAdmin';
import '/server/startup.indexes';

var glob_bad;


global.Roles = Roles;
Meteor.startup(() => {
  console.log("Vistamate server started.");
});
