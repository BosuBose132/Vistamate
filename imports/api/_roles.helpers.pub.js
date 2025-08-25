// /imports/api/_roles.helpers.pub.js
import { Roles } from 'meteor/alanning:roles';

// Use this inside Meteor.publish (must be synchronous)
export function isAdminSync(userId) {
    if (!userId) return false;
    if (typeof Roles.userIsInRole === 'function') {
        return Roles.userIsInRole(userId, 'admin');
    }
    const roles = (typeof Roles.getRolesForUser === 'function')
        ? Roles.getRolesForUser(userId) : [];
    return Array.isArray(roles) && roles.includes('admin');
}
