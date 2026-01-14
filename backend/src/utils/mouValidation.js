/**
 * MOU Validation Utilities
 * H-1 Rule and other specific validations
 */

/**
 * Validate H-1 Rule: Marriage date must be at least 1 day from creation
 * 
 * @param {Date|string} marriageDate - Marriage date to validate
 * @param {Date|string} createdAt - Submission creation date (defaults to now)
 * @throws {Error} If marriage date violates H-1 rule
 * @returns {boolean} true if validation passes
 */
function validateH1Rule(marriageDate, createdAt = new Date()) {
    const marriageDateObj = new Date(marriageDate);
    const createdAtObj = new Date(createdAt);

    //  Reset time to compare only dates (ignore hours/minutes/seconds)
    marriageDateObj.setHours(0, 0, 0, 0);
    createdAtObj.setHours(0, 0, 0, 0);

    // Calculate day difference
    const daysDifference = Math.floor(
        (marriageDateObj - createdAtObj) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference < 1) {
        throw new Error(
            'Gagal Mengirim: Pengajuan harus dikirim minimal 1 hari sebelum tanggal akad nikah (H-1). ' +
            'Pengajuan untuk pernikahan hari ini atau masa lalu tidak diperbolehkan melalui sistem ini.'
        );
    }

    return true;
}

module.exports = {
    validateH1Rule
};
