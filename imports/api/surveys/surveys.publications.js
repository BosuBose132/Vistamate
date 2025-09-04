import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Surveys } from './surveys.collection';
import { isAdminSync } from '/imports/api/_roles.helpers.pub.js';


Meteor.publish('surveys.admin', function () {
    if (!isAdminSync(this.userId)) return this.ready();
    return Surveys.find({}, { fields: { name: 1, createdAt: 1, accountId: 1 } });
});

Meteor.publish('surveys.one', function (_id) {
    check(_id, String);
    if (!isAdminSync(this.userId)) return this.ready();
    return Surveys.find({ _id }, { fields: { name: 1, json: 1 } });
});
