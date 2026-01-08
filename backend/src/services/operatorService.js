const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const FSM = require('../utils/stateMachine');

/**
 * Operator Service - Handles all operator-related operations
 * Role: OPERATOR_DUKCAPIL
 */

/**
 * Get operator queue (submissions ready for processing)
 * 
 * @param {string|string[]} status - Status filter (default: SUBMITTED)
 * @param {number} page - Page number for pagination
 * @param {string} assigneeId - Optional: Filter by specific operator
 * @returns {Object} - Paginated list of submissions
 */
const getQueue = async (status = 'SUBMITTED', page = 1, assigneeId = null) => {
    const limit = 10;
    const skip = (page - 1) * limit;

    // Normalize status to array
    const statuses = Array.isArray(status) ? status : [status];

    // Filter only statuses that operators can work with OR view history
    const validStatuses = ['SUBMITTED', 'PROCESSING', 'APPROVED', 'REJECTED', 'PENDING_VERIFICATION', 'NEEDS_REVISION'];
    const filteredStatuses = statuses.filter(s => validStatuses.includes(s));

    if (filteredStatuses.length === 0) {
        throw new AppError('Status tidak valid untuk operator queue', 400);
    }

    const where = {
        status: {
            in: filteredStatuses
        }
    };

    if (assigneeId) {
        where.current_assignee_id = assigneeId;
    }

    const [submissions, total] = await Promise.all([
        prisma.permohonan.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                created_at: 'asc' // FIFO - First In First Out
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        full_name: true,
                        kecamatan: true
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        username: true,
                        full_name: true
                    }
                },
                data_pernikahan: true,
                dokumen: {
                    select: {
                        id: true,
                        doc_type: true,
                        file_name: true,
                        uploaded_at: true
                    }
                },
                logs: {
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 10,
                    select: {
                        id: true,
                        actor_id: true,
                        previous_status: true,
                        new_status: true,
                        notes: true,
                        created_at: true
                    }
                }
            }
        }),
        prisma.permohonan.count({ where })
    ]);

    return {
        data: submissions,
        pagination: {
            current_page: page,
            total_pages: Math.ceil(total / limit),
            total_items: total,
            items_per_page: limit
        }
    };
};

/**
 * Assign (lock) submission to operator
 * 
 * @param {string} submissionId - Submission ID
 * @param {string} operatorId - Operator user ID
 * @returns {Object} - Updated submission
 */
const assignSubmission = async (submissionId, operatorId) => {
    // Check if submission exists
    const submission = await prisma.permohonan.findUnique({
        where: { id: submissionId },
        include: { assignee: true }
    });

    if (!submission) {
        throw new AppError('Pengajuan tidak ditemukan', 404);
    }

    // Check if submission is in correct status
    if (submission.status !== 'SUBMITTED') {
        throw new AppError(
            `Pengajuan tidak dapat diklaim. Status saat ini: ${submission.status}. Hanya pengajuan dengan status SUBMITTED yang dapat diklaim.`,
            400
        );
    }

    // Check if already assigned to another operator
    if (submission.current_assignee_id && submission.current_assignee_id !== operatorId) {
        throw new AppError(
            `Pengajuan sudah diklaim oleh operator lain: ${submission.assignee.full_name}`,
            409
        );
    }

    // Assign to operator and change status to PROCESSING
    const updated = await prisma.permohonan.update({
        where: { id: submissionId },
        data: {
            current_assignee_id: operatorId,
            status: 'PROCESSING'
        },
        include: {
            creator: true,
            assignee: true,
            data_pernikahan: true
        }
    });

    // Create audit log
    await prisma.statusLog.create({
        data: {
            permohonan_id: submissionId,
            actor_id: operatorId,
            previous_status: 'SUBMITTED',
            new_status: 'PROCESSING',
            notes: 'Pengajuan diklaim oleh operator'
        }
    });

    logger.info(`Operator ${operatorId} assigned submission ${submissionId}`);

    return updated;
};

/**
 * Process submission (update processing data)
 * 
 * @param {string} submissionId - Submission ID
 * @param {string} operatorId - Operator user ID
 * @param {Object} data - Processing data (notes, documents, etc.)
 * @returns {Object} - Updated submission
 */
const processSubmission = async (submissionId, operatorId, data) => {
    // Check if submission exists and is assigned to this operator
    const submission = await prisma.permohonan.findUnique({
        where: { id: submissionId }
    });

    if (!submission) {
        throw new AppError('Pengajuan tidak ditemukan', 404);
    }

    if (submission.current_assignee_id !== operatorId) {
        throw new AppError('Anda tidak memiliki akses untuk memproses pengajuan ini', 403);
    }

    if (submission.status !== 'PROCESSING') {
        throw new AppError(
            `Pengajuan tidak dapat diproses. Status saat ini: ${submission.status}`,
            400
        );
    }

    // Update submission data (notes, etc.)
    // For now, we'll just update timestamps
    // You can extend this to update data_pernikahan if needed
    const updated = await prisma.permohonan.update({
        where: { id: submissionId },
        data: {
            updated_at: new Date()
        },
        include: {
            creator: true,
            assignee: true,
            data_pernikahan: true,
            dokumen: true
        }
    });

    logger.info(`Operator ${operatorId} processed submission ${submissionId}`);

    return updated;
};

/**
 * Return submission to KUA for revision
 * 
 * @param {string} submissionId - Submission ID
 * @param {string} operatorId - Operator user ID
 * @param {string} reason - Reason for return (required)
 * @returns {Object} - Updated submission
 */
const returnToKUA = async (submissionId, operatorId, reason) => {
    if (!reason || reason.trim() === '') {
        throw new AppError('Alasan pengembalian wajib diisi', 400);
    }

    // Check if submission exists and is assigned to this operator
    const submission = await prisma.permohonan.findUnique({
        where: { id: submissionId }
    });

    if (!submission) {
        throw new AppError('Pengajuan tidak ditemukan', 404);
    }

    if (submission.current_assignee_id !== operatorId) {
        throw new AppError('Anda tidak memiliki akses untuk pengajuan ini', 403);
    }

    // Validate FSM transition
    FSM.validateTransition(submission.status, 'NEEDS_REVISION', 'OPERATOR_DUKCAPIL');

    // Update status to NEEDS_REVISION and remove assignee
    const updated = await prisma.permohonan.update({
        where: { id: submissionId },
        data: {
            status: 'NEEDS_REVISION',
            current_assignee_id: null // Release lock
        },
        include: {
            creator: true,
            data_pernikahan: true
        }
    });

    // Create audit log
    await prisma.statusLog.create({
        data: {
            permohonan_id: submissionId,
            actor_id: operatorId,
            previous_status: submission.status,
            new_status: 'NEEDS_REVISION',
            notes: `Dikembalikan ke KUA untuk perbaikan. Alasan: ${reason}`
        }
    });

    logger.info(`Operator ${operatorId} returned submission ${submissionId} to KUA`);

    return updated;
};

/**
 * Send submission to verifier
 * 
 * @param {string} submissionId - Submission ID
 * @param {string} operatorId - Operator user ID
 * @param {string} notes - Optional notes for verifier
 * @returns {Object} - Updated submission
 */
const sendToVerification = async (submissionId, operatorId, notes = '') => {
    // Check if submission exists and is assigned to this operator
    const submission = await prisma.permohonan.findUnique({
        where: { id: submissionId }
    });

    if (!submission) {
        throw new AppError('Pengajuan tidak ditemukan', 404);
    }

    if (submission.current_assignee_id !== operatorId) {
        throw new AppError('Anda tidak memiliki akses untuk pengajuan ini', 403);
    }

    // Validate FSM transition
    FSM.validateTransition(submission.status, 'PENDING_VERIFICATION', 'OPERATOR_DUKCAPIL');

    // Update status to PENDING_VERIFICATION and keep assignee for tracking
    const updated = await prisma.permohonan.update({
        where: { id: submissionId },
        data: {
            status: 'PENDING_VERIFICATION',
            // Keep current_assignee_id for audit trail
        },
        include: {
            creator: true,
            assignee: true,
            data_pernikahan: true,
            dokumen: true
        }
    });

    // Create audit log
    await prisma.statusLog.create({
        data: {
            permohonan_id: submissionId,
            actor_id: operatorId,
            previous_status: submission.status,
            new_status: 'PENDING_VERIFICATION',
            notes: notes || 'Dikirim ke verifikator untuk approval'
        }
    });

    logger.info(`Operator ${operatorId} sent submission ${submissionId} to verification`);

    return updated;
};

/**
 * Get operator performance reports
 * 
 * @param {string} operatorId - Operator user ID
 * @param {string} period - Time period (week, month, year, all)
 * @returns {Object} - Performance statistics
 */
const getOperatorReports = async (operatorId, period = 'month') => {
    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            startDate = new Date(0); // All time
    }

    // Get submissions processed by this operator
    const processedSubmissions = await prisma.statusLog.findMany({
        where: {
            actor_id: operatorId,
            new_status: {
                in: ['PENDING_VERIFICATION', 'NEEDS_REVISION']
            },
            created_at: {
                gte: startDate
            }
        },
        include: {
            permohonan: true
        }
    });

    // Get current queue counts (Real-time)
    // 1. SUBMITTED: Waiting for any operator (Global Queue)
    const queueCount = await prisma.permohonan.count({
        where: {
            status: 'SUBMITTED'
        }
    });

    // 2. PROCESSING: Assigned to THIS operator
    const processingCount = await prisma.permohonan.count({
        where: {
            status: 'PROCESSING',
            current_assignee_id: operatorId
        }
    });

    // 3. Completed Today (Sent to verification OR returned)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const completedTodayCount = await prisma.statusLog.count({
        where: {
            actor_id: operatorId,
            new_status: {
                in: ['PENDING_VERIFICATION', 'NEEDS_REVISION']
            },
            created_at: {
                gte: startOfToday
            }
        }
    });

    // Calculate statistics
    const stats = {
        // Historical / Period stats
        total_processed: processedSubmissions.length,
        sent_to_verification: processedSubmissions.filter(log => log.new_status === 'PENDING_VERIFICATION').length,
        returned_to_kua: processedSubmissions.filter(log => log.new_status === 'NEEDS_REVISION').length,
        period,
        operator_id: operatorId,

        // Real-time Dashboard Cards
        queue: queueCount,           // Antrian Menunggu (Global)
        processing: processingCount, // Sedang Diproses (My Work)
        completedToday: completedTodayCount // Dikirim Hari Ini
    };

    return stats;
};

module.exports = {
    getQueue,
    assignSubmission,
    processSubmission,
    returnToKUA,
    sendToVerification,
    getOperatorReports
};
