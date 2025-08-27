// /imports/api/_roles.helpers.js
import { Roles } from 'meteor/alanning:roles';

export async function assertAdminAsync(userId) {
    if (!userId) throw new Meteor.Error('not-authorized', 'Login required');

    // Prefer async when available
    if (typeof Roles.userIsInRoleAsync === 'function') {
        const ok = await Roles.userIsInRoleAsync(userId, 'admin');
        if (!ok) throw new Meteor.Error('not-authorized', 'Admin role required');
        return;
    }

    // Fallback to sync read
    if (typeof Roles.userIsInRole === 'function') {
        if (!Roles.userIsInRole(userId, 'admin')) {
            throw new Meteor.Error('not-authorized', 'Admin role required');
        }
        return;
    }

    // Last resort
    const roles = (typeof Roles.getRolesForUser === 'function')
        ? Roles.getRolesForUser(userId) : [];
    if (!Array.isArray(roles) || !roles.includes('admin')) {
        throw new Meteor.Error('not-authorized', 'Admin role required');
    }
}
