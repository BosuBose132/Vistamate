// /imports/api/adminSetup.js
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';

Meteor.methods({
    async createAdminIfNotExists() {
        const { email, password } = Meteor.settings.admin;
        try {
            // 1. Check if the user already exists
            let user = Accounts.findUserByEmail(email);
            let userId;

            if (!user) {
                console.log("⏳ Creating new admin user...");
                userId = Accounts.createUser({ email, password });

                if (!userId) {
                    throw new Meteor.Error('create-failed', 'User creation returned undefined');
                }

                console.log("✅ User created with ID:", userId);
            } else {
                userId = user._id;
                console.log("ℹ️ Admin user already exists with ID:", userId);
            }

            // 2. Assign the 'admin' role
            if (!userId) {
                throw new Meteor.Error('no-userid', 'No userId found for role assignment');
            }

            await Roles.createRoleAsync('admin', { unlessExists: true }); // ensure role exists
            await Roles.addUsersToRolesAsync(userId, ['admin']); // assign admin role
            console.log("✅ 'admin' role assigned to:", userId);

            return `Admin setup complete for: ${email}`;
        } catch (err) {
            console.error("🚨 Error in createAdminIfNotExists:", err.message);
            throw new Meteor.Error('internal-error', err.message);
        }
    }
});
