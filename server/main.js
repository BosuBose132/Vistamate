import { Meteor } from 'meteor/meteor';
import '/imports/api/methods';
import { Roles } from 'meteor/alanning:roles';
import '/imports/api/adminSetup';

global.Roles = Roles;
Meteor.startup(() => {
  console.log("Vistamate server started.");
});
