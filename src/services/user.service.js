import bcrypt from 'bcryptjs';
import * as upgradeRequestModel from '../models/upgradeRequest.model.js';
import * as userModel from '../models/user.model.js';
import { sendMail } from './mailer.js';

export const userService = {
    async getAllUsers() {
        return await userModel.loadAllUsers();
    },

    async getUserById(id) {
        return await userModel.findById(id);
    },

    async addUser(data) {
        const { fullname, email, address, date_of_birth, role, email_verified, password } = data;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            fullname,
            email,
            address,
            date_of_birth: date_of_birth || null,
            role,
            email_verified: email_verified === 'true',
            password_hash: hashedPassword,
            created_at: new Date(),
            updated_at: new Date()
        };
        return await userModel.add(newUser);
    },

    async updateUser(id, data) {
        const { fullname, email, address, date_of_birth, role, email_verified } = data;
        const updateData = {
            fullname,
            email,
            address,
            date_of_birth: date_of_birth || null,
            role,
            email_verified: email_verified === 'true',
            updated_at: new Date()
        };
        return await userModel.update(id, updateData);
    },

    async resetPassword(id) {
        const defaultPassword = '123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Get user info to send email
        const user = await userModel.findById(id);
        
        await userModel.update(id, { 
            password_hash: hashedPassword,
            updated_at: new Date()
        });
        
        // Send email notification to user
        if (user && user.email) {
            try {
                await sendMail({
                    to: user.email,
                    subject: 'Your Password Has Been Reset - Online Auction',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">Password Reset Notification</h2>
                            <p>Dear <strong>${user.fullname}</strong>,</p>
                            <p>Your account password has been reset by an administrator.</p>
                            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0;"><strong>Your new temporary password:</strong></p>
                                <p style="font-size: 24px; color: #e74c3c; margin: 10px 0; font-weight: bold;">${defaultPassword}</p>
                            </div>
                            <p style="color: #e74c3c;"><strong>Important:</strong> Please log in and change your password immediately for security purposes.</p>
                            <p>If you did not request this password reset, please contact our support team immediately.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="color: #888; font-size: 12px;">This is an automated message from Online Auction. Please do not reply to this email.</p>
                        </div>
                    `
                });
                console.log(`Password reset email sent to ${user.email}`);
            } catch (emailError) {
                console.error('Failed to send password reset email:', emailError);
                // Continue even if email fails - password is still reset
            }
        }

        return user;
    },

    async deleteUser(id) {
        return await userModel.deleteUser(id);
    },

    async getAllUpgradeRequests() {
        return await upgradeRequestModel.loadAllUpgradeRequests();
    },

    async approveUpgradeRequest(id, bidderId) {
        await upgradeRequestModel.approveUpgradeRequest(id);
        await userModel.updateUserRoleToSeller(bidderId);
    },

    async rejectUpgradeRequest(id, admin_note) {
        await upgradeRequestModel.rejectUpgradeRequest(id, admin_note);
    }
};
