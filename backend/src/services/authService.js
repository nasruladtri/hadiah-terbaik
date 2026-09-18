const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { validatePassword, isCommonPassword, logPasswordEvent } = require('../utils/passwordPolicy');
const logger = require('../utils/logger');

const login = async (username, password) => {
    // 1. Find user
    const user = await prisma.user.findUnique({
        where: { username },
        include: {
            kecamatan: true  // Include kecamatan data for KUA users
        }
    });

    if (!user) {
        throw new Error('Username atau password salah'); // Generic message for security
    }

    // Check if account is locked
    if (user.locked_until && new Date() < user.locked_until) {
        const remainingMinutes = Math.ceil((user.locked_until - new Date()) / 60000);
        logger.warn(`Login attempt for locked account: ${username}`);
        throw new Error(`Akun terkunci. Coba lagi dalam ${remainingMinutes} menit`);
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        // Increment failed login attempts
        const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
        const lockDuration = 15; // minutes
        const maxAttempts = 5;

        const updateData = {
            failed_login_attempts: newFailedAttempts
        };

        // Lock account if too many failed attempts
        if (newFailedAttempts >= maxAttempts) {
            updateData.locked_until = new Date(Date.now() + lockDuration * 60 * 1000);
            logger.warn(`Account locked due to failed attempts: ${username}`);
        }

        await prisma.user.update({
            where: { id: user.id },
            data: updateData
        });

        logPasswordEvent(user.id, 'FAILED_LOGIN', { username, attempts: newFailedAttempts });
        throw new Error('Username atau password salah');
    }

    // Login successful - reset failed attempts
    await prisma.user.update({
        where: { id: user.id },
        data: {
            failed_login_attempts: 0,
            locked_until: null
        }
    });

    // Check if password change is required
    if (user.must_change_password) {
        logPasswordEvent(user.id, 'LOGIN_PASSWORD_CHANGE_REQUIRED', { username });
        return {
            must_change_password: true,
            user_id: user.id,
            username: user.username,
            message: 'Anda harus mengubah password sebelum melanjutkan'
        };
    }

    // 3. Generate Token with configurable expiry
    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    // 4. Update user with new active session (invalidates old session automatically)
    await prisma.user.update({
        where: { id: user.id },
        data: {
            active_session_token: token,
            last_login_at: new Date()
        }
    });

    logPasswordEvent(user.id, 'LOGIN_SUCCESS', { username });

    // Return user info (excluding password and session token)
    const { password: _, active_session_token: __, ...userInfo } = user;

    return { token, user: userInfo };
};

const getMe = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            kecamatan: true
        }
    });
    if (!user) { throw new Error('User not found'); }
    const { password: _, ...userInfo } = user;
    return userInfo;
};

/**
 * Logout user
 * Clears active session token from database
 * 
 * @param {string} userId - User ID
 * @returns {Object} - Success message
 */
const logout = async (userId) => {
    // Clear active session token
    await prisma.user.update({
        where: { id: userId },
        data: {
            active_session_token: null
        }
    });

    return {
        success: true,
        message: 'Logout berhasil'
    };
};

/**
 * Change password
 * 
 * @param {string} userId - User ID
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} - Success message
 */
const changePassword = async (userId, oldPassword, newPassword) => {
    // Get user
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new Error('User tidak ditemukan');
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        logPasswordEvent(userId, 'PASSWORD_CHANGE_FAILED', { reason: 'Wrong old password' });
        throw new Error('Password lama tidak sesuai');
    }

    // Validate new password complexity
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
        const errorMessage = validation.errors.join(', ');
        logPasswordEvent(userId, 'PASSWORD_CHANGE_FAILED', { reason: 'Weak password', errors: validation.errors });
        throw new Error(errorMessage);
    }

    // Check if password is common
    if (isCommonPassword(newPassword)) {
        logPasswordEvent(userId, 'PASSWORD_CHANGE_FAILED', { reason: 'Common password' });
        throw new Error('Password terlalu umum. Gunakan password yang lebih unik dan sulit ditebak');
    }

    // Check if new password is same as old
    if (oldPassword === newPassword) {
        throw new Error('Password baru harus berbeda dengan password lama');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and reset must_change_password flag
    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            password_changed_at: new Date(),
            must_change_password: false
        }
    });

    logPasswordEvent(userId, 'PASSWORD_CHANGE_SUCCESS', { username: user.username });
    logger.info(`Password changed successfully for user: ${user.username}`);

    return {
        success: true,
        message: 'Password berhasil diubah. Silakan login kembali dengan password baru Anda'
    };
};

/**
 * Change password on first login (no token required)
 * Uses username + old_password for verification
 */
const firstLoginChangePassword = async (username, oldPassword, newPassword) => {
    // Get user by username
    const user = await prisma.user.findUnique({
        where: { username }
    });

    if (!user) {
        logPasswordEvent(null, 'FIRST_LOGIN_PASSWORD_CHANGE_FAILED', { reason: 'User not found', username });
        throw new Error('User tidak ditemukan');
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        logPasswordEvent(user.id, 'FIRST_LOGIN_PASSWORD_CHANGE_FAILED', { reason: 'Wrong old password', username });
        throw new Error('Password lama tidak sesuai');
    }

    // Check if user actually needs password change
    if (!user.must_change_password) {
        throw new Error('Password tidak perlu diubah');
    }

    // Validate new password complexity
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
        const errorMessage = validation.errors.join(', ');
        logPasswordEvent(user.id, 'FIRST_LOGIN_PASSWORD_CHANGE_FAILED', { reason: 'Weak password', errors: validation.errors, username });
        throw new Error(errorMessage);
    }

    // Check if password is common
    if (isCommonPassword(newPassword)) {
        logPasswordEvent(user.id, 'FIRST_LOGIN_PASSWORD_CHANGE_FAILED', { reason: 'Common password', username });
        throw new Error('Password terlalu umum. Gunakan password yang lebih unik dan sulit ditebak');
    }

    // Check if new password is same as old
    if (oldPassword === newPassword) {
        throw new Error('Password baru harus berbeda dengan password lama');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and reset must_change_password flag
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            password_changed_at: new Date(),
            must_change_password: false
        }
    });

    logPasswordEvent(user.id, 'FIRST_LOGIN_PASSWORD_CHANGE_SUCCESS', { username: user.username });
    logger.info(`First login password changed successfully for user: ${user.username}`);

    return {
        success: true,
        message: 'Password berhasil diubah. Silakan login kembali dengan password baru Anda'
    };
};

module.exports = {
    login,
    getMe,
    logout,
    changePassword,
    firstLoginChangePassword
};
