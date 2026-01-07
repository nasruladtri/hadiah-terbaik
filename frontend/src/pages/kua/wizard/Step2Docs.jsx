import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Alert from '../../../components/ui/Alert';
import { UploadCloud, CheckCircle, FileText, AlertCircle, Download, Info } from 'lucide-react';
import api from '../../../services/api';

const FileInput = ({ label, name, file, onChange, error, required, existingFile }) => (
    <div className="group">
        <label className="block text-sm font-medium text-slate-700 mb-2">
            {label} {required && !existingFile && <span className="text-red-500">*</span>}
        </label>

        {existingFile && (
            <div className="mb-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-blue-900">File tersimpan di server</p>
                    <p className="text-xs text-blue-700 mt-1 flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        {existingFile.file_name}
                        <span className="opacity-70 ml-1">({(existingFile.file_size / 1024).toFixed(1)} KB)</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 italic">Upload file baru di bawah jika ingin mengganti.</p>
                </div>
            </div>
        )}

        <div className={`relative border-2 border-dashed rounded-lg p-6 transition-all text-center
            ${error
                ? 'border-red-300 bg-red-50/10 hover:bg-red-50/30'
                : file
                    ? 'border-green-300 bg-green-50/10'
                    : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50/50'
            }
        `}>
            <input
                type="file"
                name={name}
                id={name}
                onChange={onChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="pointer-events-none flex flex-col items-center justify-center space-y-2">
                {file ? (
                    <>
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-1">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-900 truncate max-w-xs">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                    </>
                ) : (
                    <>
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                            <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-slate-600">
                            <span className="font-semibold text-primary-600">Klik untuk upload</span> atau drag & drop
                        </p>
                        <p className="text-xs text-slate-400">PDF, JPG, PNG (Maks 5MB)</p>
                    </>
                )}
            </div>
        </div>
        {error && (
            <p className="mt-2 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {error}
            </p>
        )}
    </div>
);

const Step2Docs = ({ files, handleFileChange, onNext, onPrev, mouScenario }) => {
    const [errors, setErrors] = useState({});
    const [scenarioData, setScenarioData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Document type to label mapping
    const DOC_LABELS = {
        'KK_SUAMI': 'Kartu Keluarga Suami',
        'KK_ISTRI': 'Kartu Keluarga Istri',
        'BUKU_NIKAH_ORTU_SUAMI': 'Buku Nikah / Akte Cerai Orang Tua Suami',
        'BUKU_NIKAH_ORTU_ISTRI': 'Buku Nikah / Akte Cerai Orang Tua Istri',
        'KTP_SUAMI': 'KTP Suami',
        'KTP_ISTRI': 'KTP Istri',
        'BUKU_NIKAH': 'Buku Nikah',
        'FORM_F103': 'Form  F1.03 (Pendaftaran Pindah)',
        'FORM_F106': 'Form F1.06 (Perubahan Biodata)',
        'SKPWNI': 'SKPWNI (Surat Keterangan Pindah WNI)',
        'IJAZAH_SUAMI': 'Ijazah Suami',
        'IJAZAH_ISTRI': 'Ijazah Istri',
        'SK_KERJA_SUAMI': 'SK Kerja Suami',
        'SK_KERJA_ISTRI': 'SK Kerja Istri'
    };

    // Document type to field name mapping
    const DOC_TO_FIELD = {
        'KK_SUAMI': 'kk_suami',
        'KK_ISTRI': 'kk_istri',
        'BUKU_NIKAH_ORTU_SUAMI': 'buku_nikah_ortu_suami',
        'BUKU_NIKAH_ORTU_ISTRI': 'buku_nikah_ortu_istri',
        'KTP_SUAMI': 'ktp_suami',
        'KTP_ISTRI': 'ktp_istri',
        'BUKU_NIKAH': 'buku_nikah',
        'FORM_F103': 'form_f103',
        'FORM_F106': 'form_f106',
        'SKPWNI': 'skpwni',
        'IJAZAH_SUAMI': 'ijazah_suami',
        'IJAZAH_ISTRI': 'ijazah_istri',
        'SK_KERJA_SUAMI': 'sk_kerja_suami',
        'SK_KERJA_ISTRI': 'sk_kerja_istri'
    };

    // Fetch scenario data when mouScenario changes
    useEffect(() => {
        const fetchScenarioData = async () => {
            if (!mouScenario) {
                setScenarioData(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await api.get('/kua/scenarios');
                const scenarios = response.data.data;
                const selected = scenarios.find(s => s.value === mouScenario);

                if (selected) {
                    setScenarioData(selected);
                } else {
                    toast.error('Scenario tidak ditemukan');
                }
            } catch (error) {
                console.error('Error fetching scenario:', error);
                toast.error('Gagal memuat data scenario');
            } finally {
                setLoading(false);
            }
        };

        fetchScenarioData();
    }, [mouScenario]);

    const validateFile = (file) => {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

        if (file.size > maxSize) {
            return 'Ukuran file maks 5MB';
        }
        if (!allowedTypes.includes(file.type)) {
            return 'Hanya file PDF, JPG, atau PNG';
        }
        return null;
    };

    const handleFileChangeWithValidation = (e) => {
        const { name, files: fileList } = e.target;
        const file = fileList[0];

        if (file) {
            const error = validateFile(file);
            setErrors(prev => ({ ...prev, [name]: error }));

            if (!error) {
                handleFileChange(e);
            } else {
                e.target.value = ''; // Clear invalid file
            }
        }
    };

    const onSubmit = (e) => {
        e.preventDefault();

        // Check for file validation errors
        const hasErrors = Object.values(errors).some(err => err !== null && err !== undefined);
        if (hasErrors) {
            toast.error('Mohon perbaiki kesalahan file sebelum melanjutkan.');
            return;
        }

        // Validate required documents based on scenario
        if (scenarioData) {
            const requiredDocs = scenarioData.required_docs || [];
            for (const docType of requiredDocs) {
                const fieldName = DOC_TO_FIELD[docType];
                if (fieldName && !files[fieldName]) {
                    toast.error(`Dokumen wajib: ${DOC_LABELS[docType] || docType}`);
                    return;
                }
            }
        }

        onNext();
    };

    // Render documents dynamically based on scenario
    const renderDocuments = () => {
        if (!scenarioData) {
            return (
                <div className="text-center py-12">
                    <p className="text-slate-500">Silakan pilih opsi di Step 1 terlebih dahulu.</p>
                </div>
            );
        }

        const allDocs = [
            ...(scenarioData.required_docs || []),
            ...(scenarioData.optional_docs || [])
        ];

        if (allDocs.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-slate-500">Tidak ada dokumen yang diperlukan untuk opsi ini.</p>
                </div>
            );
        }

        const requiredDocs = scenarioData.required_docs || [];
        const optionalDocs = scenarioData.optional_docs || [];

        return (
            <>
                {/* Required Documents */}
                {requiredDocs.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
                            <Badge variant="default">Wajib</Badge>
                            <h3 className="font-bold text-lg text-slate-800">Dokumen Wajib</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {requiredDocs.map(docType => {
                                const fieldName = DOC_TO_FIELD[docType];
                                if (!fieldName) return null;

                                return (
                                    <FileInput
                                        key={docType}
                                        label={DOC_LABELS[docType] || docType}
                                        name={fieldName}
                                        file={files[fieldName]}
                                        onChange={handleFileChangeWithValidation}
                                        error={errors[fieldName]}
                                        required={true}
                                        existingFile={files[fieldName]?.existing && files[fieldName]}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Optional Documents */}
                {optionalDocs.length > 0 && (
                    <div className="mt-10">
                        <div className="flex items-center gap-2 mb-6 border-b border-blue-200 pb-2">
                            <Badge variant="secondary">Opsional</Badge>
                            <h3 className="font-bold text-lg text-slate-800">Dokumen Opsional</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {optionalDocs.map(docType => {
                                const fieldName = DOC_TO_FIELD[docType];
                                if (!fieldName) return null;

                                return (
                                    <FileInput
                                        key={docType}
                                        label={`${DOC_LABELS[docType] || docType} (Opsional)`}
                                        name={fieldName}
                                        file={files[fieldName]}
                                        onChange={handleFileChangeWithValidation}
                                        error={errors[fieldName]}
                                        required={false}
                                        existingFile={files[fieldName]?.existing && files[fieldName]}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <form onSubmit={onSubmit} className="space-y-8">
            <h2 className="text-xl font-bold font-display text-slate-800">Langkah 2: Unggah Dokumen</h2>

            {/* Scenario Info */}
            {scenarioData && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Opsi Terpilih:</h3>
                    <p className="text-sm text-blue-700">{scenarioData.label}</p>
                    <p className="text-xs text-blue-600 mt-2">Upload dokumen sesuai dengan persyaratan opsi ini.</p>
                </div>
            )}

            {/* Template Documents Download Section */}
            <Alert variant="info" className="border-blue-200 bg-blue-50">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-1">Template Formulir</h4>
                        <p className="text-sm text-blue-700 mb-3">
                            Unduh template formulir yang diperlukan untuk melengkapi dokumen:
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3100'}/templates/f103-perpindahan-penduduk.pdf`}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-blue-300 hover:bg-blue-100 hover:border-blue-400 transition-all shadow-sm hover:shadow"
                            >
                                <Download className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">F.1-03 Perpindahan Penduduk</span>
                            </a>
                            <a
                                href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3100'}/templates/f106-perubahan-data.pdf`}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-blue-300 hover:bg-blue-100 hover:border-blue-400 transition-all shadow-sm hover:shadow"
                            >
                                <Download className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">F.1-06 Perubahan Data</span>
                            </a>
                        </div>
                    </div>
                </div>
            </Alert>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="text-slate-500 mt-4">Memuat persyaratan dokumen...</p>
                </div>
            )}

            {/* Documents */}
            {!loading && (
                <div className="space-y-10">
                    {renderDocuments()}
                </div>
            )}

            <div className="flex justify-between pt-6 border-t border-slate-100 mt-8">
                <Button type="button" variant="outline" onClick={onPrev}>Kembali</Button>
                <Button type="submit" disabled={loading || !scenarioData}>Lanjut</Button>
            </div>
        </form>
    );
};

export default Step2Docs;
