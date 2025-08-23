import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { check } from 'meteor/check';
import { Surveys } from './surveys.collection';

Meteor.publish('surveys.admin', function () {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin')) return this.ready();
    return Surveys.find({}, { fields: { name: 1, createdAt: 1, accountId: 1 } });
});

Meteor.publish('surveys.one', function (_id) {
    check(_id, String);
    if (!this.userId) return this.ready();
    return Surveys.find({ _id }, { fields: { name: 1, json: 1 } });
});
