import { userService } from "../services/user.service.js";

export const userController = {
    async getList(req, res) {
        try {
            const users = await userService.getAllUsers();
            const success_message = req.session.success_message;
            const error_message = req.session.error_message;
            
            delete req.session.success_message;
            delete req.session.error_message;
            
            res.render('vwAdmin/users/list', { 
                users,
                empty: users.length === 0,
                success_message,
                error_message
            });
        } catch (error) {
            console.error('List user error:', error);
            res.redirect('/admin');
        }
    },

    async getById(req, res) {
        try {
            const id = req.params.id;
            const user = await userService.getUserById(id);
            res.render('vwAdmin/users/detail', { user });
        } catch (error) {
            console.error('Detail user error:', error);
            res.redirect('/admin/users/list');
        }
    },

    async add(req, res) {
        res.render('vwAdmin/users/add');
    },

    async addUser(req, res) {
        try {
            await userService.addUser(req.body);
            req.session.success_message = 'User added successfully!';
            res.redirect('/admin/users/list');
        } catch (error) {
            console.error('Add user error:', error);
            req.session.error_message = 'Failed to add user. Please try again.';
            res.redirect('/admin/users/add');
        }
    },

    async editByID(req, res) {
        try {
            const id = req.params.id;
            const user = await userService.getUserById(id);
            const error_message = req.session.error_message;
            
            delete req.session.error_message;
            
            res.render('vwAdmin/users/edit', { user, error_message });
        } catch (error) {
            console.error('Edit user error:', error);
            res.redirect('/admin/users/list');
        }
    },

    async update(req, res) {
        try {
            const { id } = req.body;
            await userService.updateUser(id, req.body);
            req.session.success_message = 'User updated successfully!';
            res.redirect('/admin/users/list');
        } catch (error) {
            console.error('Update user error:', error);
            req.session.error_message = 'Failed to update user. Please try again.';
            res.redirect(`/admin/users/edit/${req.body.id}`);
        }
    },

    async resetPassword(req, res) {
        try {
            const { id } = req.body;
            const user = await userService.resetPassword(id);
            
            if (user) {
                req.session.success_message = `Password of ${user.fullname} reset successfully to default: 123`;
            } else {
                req.session.success_message = `Password reset successfully to default: 123`;
            }
            res.redirect(`/admin/users/list`);
        } catch (error) {
            console.error('Reset password error:', error);
            req.session.error_message = 'Failed to reset password. Please try again.';
            res.redirect(`/admin/users/list`);
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.body;
            await userService.deleteUser(id);
            req.session.success_message = 'User deleted successfully!';
            res.redirect('/admin/users/list');
        } catch (error) {
            console.error('Delete user error:', error);
            req.session.error_message = 'Failed to delete user. Please try again.';
            res.redirect('/admin/users/list');
        }
    },

    async getUpgradeRequests(req, res) {
        try {
            const requests = await userService.getAllUpgradeRequests();
            res.render('vwAdmin/users/upgradeRequests', { requests });
        } catch (error) {
            console.error('Get upgrade requests error:', error);
            res.redirect('/admin/users/list');
        }
    },

    async approveUpgrade(req, res) {
        try {
            const id = req.body.id;
            const bidderId = req.body.bidder_id;
            await userService.approveUpgradeRequest(id, bidderId);
            res.redirect('/admin/users/upgrade-requests');
        } catch (error) {
            console.error('Approve upgrade error:', error);
            res.redirect('/admin/users/upgrade-requests');
        }
    },

    async rejectUpgrade(req, res) {
        try {
            const id = req.body.id;
            const admin_note = req.body.admin_note;
            await userService.rejectUpgradeRequest(id, admin_note);
            res.redirect('/admin/users/upgrade-requests');
        } catch (error) {
            console.error('Reject upgrade error:', error);
            res.redirect('/admin/users/upgrade-requests');
        }
    }
};
