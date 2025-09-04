import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { check } from 'meteor/check';
import { Visitors } from '/imports/api/collections';
import { isAdminSync } from '/imports/api/_roles.helpers.pub.js';

Meteor.publish('visitors.adminToday', function (limit = 1000) {
    // TEMP: allow any logged-in user to receive today's visitors
    //if (!isAdminSync(this.userId)) return this.ready();
    check(limit, Number);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return Visitors.find(
        { createdAt: { $gte: start, $lte: end } },
        { sort: { createdAt: -1 }, limit }
    );
});
