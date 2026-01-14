const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

/**     
 * Operator Routes
 * Base path: /api/v1/dukcapil/operator
 * Role: OPERATOR_DUKCAPIL and VERIFIKATOR_DUKCAPIL
 * Note: Verifiers can access operator functions in the unified interface
 */

// All routes require authentication and OPERATOR or VERIFIER role
router.use(verifyToken, authorizeRole(['OPERATOR_DUKCAPIL', 'VERIFIKATOR_DUKCAPIL']));

/**
 * Queue Management
 */
router.get('/queue', operatorController.getQueue);
router.post('/submissions/:id/assign', operatorController.assignSubmission);

/**
 * Processing
 */
router.get('/submissions/:id', operatorController.getDetail);
router.put('/submissions/:id/process', operatorController.processSubmission);
router.post('/submissions/:id/return', operatorController.returnToKUA);
router.post('/submissions/:id/send-verification', operatorController.sendToVerification);

/**
 * Reports
 */
router.get('/reports', operatorController.getReports);

module.exports = router;
