import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { FileText, AlertTriangle, User, Calendar, MapPin, FileCheck } from 'lucide-react';

const ReviewSection = ({ title, icon: Icon, children }) => (
    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
            {Icon && <Icon className="w-5 h-5 mr-2 text-primary-600" />}
            {title}
        </h3>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

const ReviewItem = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center py-1">
        <dt className="text-sm text-slate-500 font-medium">{label}</dt>
        <dd className="text-sm font-semibold text-slate-900 mt-1 sm:mt-0 max-w-xs md:max-w-sm truncate text-right">
            {value || <span className="text-slate-400 italic">Tidak ada</span>}
        </dd>
    </div>
);

const Step3Review = ({ formData, files, onPrev, onSaveDraft, onSubmit, loading }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [actionType, setActionType] = useState(null); // 'draft' or 'submit'

    const handleAction = (type) => {
        setActionType(type);
        setShowConfirm(true);
    };

    const handleConfirm = () => {
        setShowConfirm(false);
        if (actionType === 'draft') {
            onSaveDraft();
        } else {
            onSubmit();
        }
    };

    // Helper to count files
    const fileCount = Object.keys(files).filter(k => files[k]).length;

    // H-1 Validation Check (Proactive UI Warning)
    const isDateInvalid = () => {
        if (!formData.marriage_date) return false;
        const marriageDate = new Date(formData.marriage_date);
        const today = new Date();
        marriageDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // Difference in days
        const diffDays = Math.floor((marriageDate - today) / (1000 * 60 * 60 * 24));
        return diffDays < 1;
    };

    const dateWarning = isDateInvalid();

    return (
        <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="text-2xl font-display font-bold text-slate-900">Tinjau Pengajuan</h2>
                <p className="text-slate-500 mt-2">Pastikan semua data yang Anda masukkan sudah benar sebelum mengirimkan pengajuan.</p>
            </div>

            {dateWarning && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-red-900">Peringatan: Aturan H-1</h4>
                        <p className="text-sm text-red-700 leading-relaxed">
                            Pengajuan harus dikirim minimal 1 hari sebelum tanggal akad nikah (H-1).
                            Karena tanggal nikah yang dipilih ({formData.marriage_date}), pengajuan ini kemungkinan besar akan <strong>ditolak oleh sistem</strong> saat dikirim.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReviewSection title="Data Suami" icon={User}>
                    <ReviewItem label="Nama Lengkap" value={formData.husband_name} />
                    <ReviewItem label="NIK" value={formData.husband_nik} />
                    <ReviewItem label="Nomor HP" value={formData.hp_suami} />
                    <ReviewItem label="Email" value={formData.email_suami} />
                </ReviewSection>

                <ReviewSection title="Data Istri" icon={User}>
                    <ReviewItem label="Nama Lengkap" value={formData.wife_name} />
                    <ReviewItem label="NIK" value={formData.wife_nik} />
                    <ReviewItem label="Nomor HP" value={formData.hp_istri} />
                    <ReviewItem label="Email" value={formData.email_istri} />
                </ReviewSection>

                <ReviewSection title="Detail Pernikahan" icon={Calendar}>
                    <ReviewItem label="Tanggal Nikah" value={formData.marriage_date} />
                    <ReviewItem label="Waktu Nikah" value={formData.marriage_time} />
                    <ReviewItem label="No. Buku Nikah" value={formData.marriage_book_no} />
                </ReviewSection>

                <ReviewSection title="Lokasi & Catatan" icon={MapPin}>
                    <div className="flex flex-col space-y-4">
                        <div>
                            <dt className="text-sm text-slate-500 font-medium mb-1">Lokasi Nikah</dt>
                            <dd className="text-sm font-medium text-slate-900 bg-white p-3 rounded border border-slate-200">
                                {formData.marriage_location || '-'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-slate-500 font-medium mb-1">Catatan Tambahan</dt>
                            <dd className="text-sm text-slate-700 bg-yellow-50 p-3 rounded border border-yellow-100 italic">
                                &quot;{formData.notes || 'Tidak ada catatan'}&quot;
                            </dd>
                        </div>
                    </div>
                </ReviewSection>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 flex items-center">
                        <FileCheck className="w-5 h-5 mr-2 text-primary-600" />
                        Dokumen Terlampir
                    </h3>
                    <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {fileCount} File
                    </span>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.keys(files).map(key => {
                            const file = files[key];
                            if (!file) return null;
                            const label = key.replace(/_/g, ' ').toUpperCase();
                            return (
                                <div key={key} className="flex items-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-primary-300 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 text-green-600 mr-3">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-500 mb-0.5">{label}</p>
                                        <p className="text-sm font-medium text-slate-900 truncate" title={file.name || file.file_name}>
                                            {file.name || file.file_name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {(file.size || file.file_size) ? ((file.size || file.file_size) / 1024).toFixed(0) + ' KB' : 'Unknown size'}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100 mt-8">
                <Button type="button" variant="outline" onClick={onPrev} disabled={loading}>Kembali</Button>
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleAction('draft')}
                        disabled={loading}
                        icon={FileText}
                    >
                        Simpan Draft
                    </Button>
                    <Button
                        onClick={() => handleAction('submit')}
                        disabled={loading}
                        isLoading={loading && actionType === 'submit'}
                    >
                        Kirim Pengajuan
                    </Button>
                </div>
            </div>

            {/* Confirmation & Alert Modal */}
            <Modal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                title={
                    actionType === 'draft'
                        ? "Simpan Draft?"
                        : (dateWarning ? "Gagal: Aturan H-1" : "Konfirmasi Pengajuan")
                }
            >
                <div className="flex flex-col items-center text-center p-4">
                    <div className={`w-16 h-16 ${dateWarning && actionType === 'submit' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'} rounded-full flex items-center justify-center mb-4`}>
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className={`text-lg font-bold ${dateWarning && actionType === 'submit' ? 'text-red-900' : 'text-slate-900'} mb-2`}>
                        {actionType === 'draft'
                            ? "Simpan sebagai draft?"
                            : (dateWarning ? "Pengajuan Tidak Bisa Dikirim" : "Kirim data pengajuan nikah?")
                        }
                    </h3>
                    <div className="text-slate-500 mb-6">
                        {actionType === 'draft'
                            ? "Data Anda akan disimpan dan dapat dilanjutkan nanti. Dokumen yang sudah diupload akan tersimpan."
                            : dateWarning
                                ? (
                                    <div className="space-y-2">
                                        <p className="text-red-600 font-semibold">Gagal Mengirim!</p>
                                        <p>Sesuai aturan, pengajuan harus dikirim minimal 1 hari sebelum tanggal akad nikah (H-1).</p>
                                        <p className="bg-red-50 p-2 rounded text-xs border border-red-100">
                                            Tanggal nikah ({formData.marriage_date}) terlalu dekat. Silakan ubah tanggal nikah atau simpan sebagai draft saja.
                                        </p>
                                    </div>
                                )
                                : <span>Pastikan data untuk <strong>{formData.husband_name}</strong> & <strong>{formData.wife_name}</strong> sudah benar. Data yang dikirim akan diproses oleh Dukcapil.</span>
                        }
                    </div>

                    <div className="flex gap-3 w-full justify-center">
                        <Button variant="outline" onClick={() => setShowConfirm(false)} className="w-full sm:w-auto">
                            Batal
                        </Button>
                        {!(dateWarning && actionType === 'submit') && (
                            <Button onClick={handleConfirm} className="w-full sm:w-auto">
                                {actionType === 'draft' ? "Ya, Simpan Draft" : "Ya, Kirim Sekarang"}
                            </Button>
                        )}
                        {(dateWarning && actionType === 'submit') && (
                            <Button variant="secondary" onClick={() => handleAction('draft')} className="w-full sm:w-auto">
                                Simpan Draft Saja
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Step3Review;
