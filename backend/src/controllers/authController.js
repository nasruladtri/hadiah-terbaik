const authService = require('../services/authService');
const logger = require('../utils/logger');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validasi sederhana (sebaiknya pakai Zod di middleware)
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }

        const result = await authService.login(username, password);

        res.json({
            success: true,
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        logger.error('Login Error:', error);
        // Determine status code based on error message
        const status = error.message === 'User not found' || error.message === 'Invalid credentials' ? 401 : 500;

        res.status(status).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

const me = async (req, res) => {
    try {
        const user = await authService.getMe(req.user.id);
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const result = await authService.logout(req.user.id, token);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Change password
 * PUT /api/v1/auth/change-password
 */
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password lama dan password baru wajib diisi'
            });
        }

        const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
        res.json(result);
    } catch (error) {
        res.status(error.message.includes('tidak sesuai') ? 400 : 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    login,
    me,
    logout,
    changePassword
};
