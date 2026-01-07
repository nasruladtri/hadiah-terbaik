const verifierService = require('../services/verifierService');

/**
 * Verifier Controller
 * Handles all verifier-related endpoints
 */

/**
 * Get verifier queue
 * GET /api/v1/dukcapil/verifier/queue
 */
const getQueue = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        let status = req.query.status || 'PENDING_VERIFICATION';

        // Support multiple statuses
        if (status.includes(',')) {
            status = status.split(',');
        }

        const result = await verifierService.getVerifierQueue(status, page);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get submission detail
 * GET /api/v1/dukcapil/verifier/submissions/:id
 */
const getDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await verifierService.getSubmissionDetail(id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(error.statusCode || 404).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Approve submission
 * POST /api/v1/dukcapil/verifier/submissions/:id/approve
 */
const approve = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const result = await verifierService.approveSubmission(id, req.user.id, notes);
        res.json({
            success: true,
            message: 'Pengajuan berhasil disetujui',
            data: result
        });
    } catch (error) {
        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Reject submission
 * POST /api/v1/dukcapil/verifier/submissions/:id/reject
 */
const reject = async (req, res) => {
    try {
        const { id } = req.params;
        // Accept both 'notes' and 'reason' for backwards compatibility
        const { notes, reason } = req.body;
        const rejectionReason = notes || reason;

        if (!rejectionReason || rejectionReason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Alasan penolakan wajib diisi'
            });
        }

        const result = await verifierService.rejectSubmission(id, req.user.id, rejectionReason);
        res.json({
            success: true,
            message: 'Pengajuan ditolak',
            data: result
        });
    } catch (error) {
        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get verifier reports
 * GET /api/v1/dukcapil/verifier/reports
 */
const getReports = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const result = await verifierService.getVerifierReports(req.user.id, period);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getQueue,
    getDetail,
    approve,
    reject,
    getReports
};
