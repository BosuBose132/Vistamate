// /imports/api/adminSetup.js
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';

Meteor.methods({
    async createAdminIfNotExists() {
        const cfg = Meteor.settings?.admin || {};
        const email = (cfg.email || '').trim();
        const password = cfg.password;

        if (!email || !password) {
            throw new Meteor.Error('bad-settings', 'Missing admin.email or admin.password in settings.json');
        }

        // 1) find or create
        let user = Accounts.findUserByEmail(email);
        if (!user) {
            console.log('⏳ Creating admin user…', email);
            const id = Accounts.createUser({ email, password }); // returns id (server)
            // RE-FETCH to be 100% sure we have the doc
            user = id ? Meteor.users.findOne(id) : null;
        }

        const userId = user?._id;
        if (!userId) {
            throw new Meteor.Error('no-userid', 'User not found/created; cannot assign admin role.');
        }

        // 2) ensure role exists and assign (idempotent)
        await Roles.createRoleAsync('admin', { unlessExists: true });
        const alreadyAdmin = typeof Roles.userIsInRole === 'function'
            ? Roles.userIsInRole(userId, 'admin')
            : false;
        if (!alreadyAdmin) {
            await Roles.addUsersToRolesAsync(userId, ['admin']);
            console.log('✅ Admin role assigned to', userId);
        } else {
            console.log('ℹ️ Admin role already present for', userId);
        }

        return { userId, email };
    }
});
