import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { check } from 'meteor/check';
import { Visitors } from '/imports/api/collections';

Meteor.publish('visitors.byStation', function (stationId, limit = 100) {
    check(limit, Number);
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin')) return this.ready();
    if (!stationId) return this.ready();
    return Visitors.find({ stationId }, { sort: { createdAt: -1 }, limit });
});
