import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/common/Loading';
import { Eye, Lock, CheckCircle, XCircle, FileText, Download, AlertTriangle, User, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'react-toastify';

const VerificationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    const fetchDetail = useCallback(async () => {
        try {
            // Use role-specific endpoint
            const endpoint = user.role === 'OPERATOR_DUKCAPIL'
                ? `/dukcapil/submissions/${id}`
                : `/dukcapil/verifier/submissions/${id}`;

            const res = await api.get(endpoint);
            setSubmission(res.data.data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data pengajuan');
            navigate('/dukcapil/dashboard');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, user.role]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    // Define role checks FIRST before using them
    const isOperator = user.role === 'OPERATOR_DUKCAPIL';
    const isVerifier = user.role === 'VERIFIKATOR_DUKCAPIL';

    // Verifiers can perform operator functions in unified interface
    const canPerformOperatorFunctions = isOperator || isVerifier;

    const handleLock = async () => {
        setProcessing(true);
        try {
            // Both operator and verifier use same endpoint now
            await api.post(`/dukcapil/operator/submissions/${id}/assign`);
            toast.success('Pengajuan dikunci untuk diproses');
            fetchDetail(); // Refresh to see updated status/assignee
        } catch (error) {
            const errorMsg = error.userMessage || 'Gagal mengunci: ' + error.response?.data?.message;
            toast.error(errorMsg);
        } finally {
            setProcessing(false);
        }
    };

    const handleDecision = async (decision) => {
        // For operators: only "send to verification" (APPROVED) is available
        // For verifiers: both APPROVED and REJECTED are available

        // Validate notes for rejection (verifier only)
        if (decision === 'REJECTED' && !notes.trim()) {
            toast.warn('Catatan wajib diisi untuk penolakan.');
            return;
        }

        // Show confirmation dialog
        setConfirmAction(decision);
        setShowConfirm(true);
    };

    const handleConfirmDecision = async () => {
        const decision = confirmAction;
        setProcessing(true);
        setShowConfirm(false); // Close modal immediately
        try {
            // CRITICAL FIX: Check verifier workflow FIRST before operator workflow
            // Because PENDING_VERIFICATION can be processed by both, but verifier has priority

            const isInVerifierWorkflow = status === 'PENDING_VERIFICATION' && isVerifier;
            const isInOperatorWorkflow = status === 'PROCESSING';

            // Verifier workflow (MUST be checked FIRST)
            if (isInVerifierWorkflow && decision === 'APPROVED') {
                // Verifier workflow: Final approval
                await api.post(`/dukcapil/verifier/submissions/${id}/approve`, {
                    notes
                });
                toast.success('Pengajuan berhasil DISETUJUI');
                navigate('/dukcapil/dashboard');
            } else if (isInVerifierWorkflow && decision === 'REJECTED') {
                // Verifier workflow: Final rejection
                await api.post(`/dukcapil/verifier/submissions/${id}/reject`, {
                    notes
                });
                toast.success('Pengajuan berhasil DITOLAK');
                navigate('/dukcapil/dashboard');
            }
            // Operator workflow (checked SECOND)
            else if (isInOperatorWorkflow && decision === 'APPROVED') {
                // Operator workflow: Send to verification
                await api.post(`/dukcapil/operator/submissions/${id}/send-verification`, {
                    notes
                });
                toast.success('Pengajuan berhasil dikirim ke verifikator');
                navigate('/dukcapil/dashboard');
            } else if (isInOperatorWorkflow && decision === 'REJECTED') {
                // Operator workflow: Return to KUA
                await api.post(`/dukcapil/operator/submissions/${id}/return`, {
                    reason: notes
                });
                toast.success('Pengajuan dikembalikan ke KUA');
                navigate('/dukcapil/dashboard');
            }
        } catch (error) {
            const errorMsg = error.userMessage || 'Gagal memproses: ' + error.response?.data?.message;
            toast.error(errorMsg);
            setProcessing(false);
        }
    };

    const handleDownload = (filename) => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            toast.error('Anda telah keluar (Logged out)');
            return;
        }
        try {
            const url = `http://localhost:3000/api/v1/submissions/document/${filename}?token=${token}`;
            window.open(url, '_blank');
        } catch {
            toast.error('Gagal mengunduh dokumen. Silakan coba lagi.');
        }
    };

    if (loading) return <Loading />;
    if (!submission) return <Alert variant="destructive" title="Error" message="Data tidak ditemukan" />;

    const { data_pernikahan, dokumen, status } = submission;

    // Helper to get badge variant
    const getStatusBadgeVariant = (s) => {
        switch (s) {
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            case 'PROCESSING': return 'info';
            case 'SUBMITTED': return 'warning';
            default: return 'default';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-l-4 border-l-primary-500">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900">Tiket #{submission.ticket_number}</h1>
                                <Badge variant={getStatusBadgeVariant(status)} className="capitalize">
                                    {status.replace('_', ' ')}
                                </Badge>
                            </div>
                            <div className="mt-2 text-sm text-slate-500 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Diajukan pada {new Date(submission.created_at).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            {status === 'SUBMITTED' && (
                                <Button onClick={handleLock} loading={processing} icon={Lock}>
                                    Kunci & Proses
                                </Button>
                            )}
                            {status === 'PROCESSING' && (
                                <Badge variant="info" icon={User} className="text-sm py-1.5 px-3">
                                    Sedang Anda Proses
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Data & Docs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Data Pernikahan */}
                    <Card>
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-slate-500" />
                                Data Pernikahan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <dl className="divide-y divide-slate-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 p-4 gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Nama Suami</dt>
                                        <dd className="mt-1 text-sm font-semibold text-slate-900">{data_pernikahan?.husband_name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">NIK Suami</dt>
                                        <dd className="mt-1 text-sm font-mono text-slate-700 bg-slate-100 inline-block px-2 py-0.5 rounded">{data_pernikahan?.husband_nik}</dd>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 p-4 gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Nama Istri</dt>
                                        <dd className="mt-1 text-sm font-semibold text-slate-900">{data_pernikahan?.wife_name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">NIK Istri</dt>
                                        <dd className="mt-1 text-sm font-mono text-slate-700 bg-slate-100 inline-block px-2 py-0.5 rounded">{data_pernikahan?.wife_nik}</dd>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 p-4 gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500 mb-1">Kontak Suami</dt>
                                        <dd className="flex flex-col gap-1">
                                            <div className="flex items-center text-sm text-slate-900">
                                                <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                                {data_pernikahan?.hp_suami || '-'}
                                            </div>
                                            {data_pernikahan?.email_suami && (
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                                    {data_pernikahan?.email_suami}
                                                </div>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500 mb-1">Kontak Istri</dt>
                                        <dd className="flex flex-col gap-1">
                                            <div className="flex items-center text-sm text-slate-900">
                                                <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                                {data_pernikahan?.hp_istri || '-'}
                                            </div>
                                            {data_pernikahan?.email_istri && (
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                                    {data_pernikahan?.email_istri}
                                                </div>
                                            )}
                                        </dd>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 p-4 gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Tanggal & Waktu</dt>
                                        <dd className="mt-1 text-sm text-slate-900 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                            {new Date(data_pernikahan?.marriage_date).toLocaleDateString()}
                                            {data_pernikahan?.marriage_time && <span className="ml-2 font-medium text-slate-500">({data_pernikahan.marriage_time})</span>}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Lokasi</dt>
                                        <dd className="mt-1 text-sm text-slate-900 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                            {data_pernikahan?.marriage_location || '-'}
                                        </dd>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 p-4 gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Nomor Buku Nikah</dt>
                                        <dd className="mt-1 text-sm font-mono text-slate-700 bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-200">
                                            {data_pernikahan?.marriage_book_no}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Kode KUA</dt>
                                        <dd className="mt-1 text-sm font-mono text-slate-700">
                                            {data_pernikahan?.kua_code}
                                        </dd>
                                    </div>
                                </div>
                                {data_pernikahan?.notes && (
                                    <div className="p-4 bg-yellow-50/50">
                                        <dt className="text-sm font-medium text-yellow-800 mb-1 flex items-center">
                                            <AlertTriangle className="w-4 h-4 mr-1.5" />
                                            Catatan KUA
                                        </dt>
                                        <dd className="text-sm text-yellow-900 italic">&quot;{data_pernikahan.notes}&quot;</dd>
                                    </div>
                                )}
                            </dl>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card>
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-slate-500" />
                                Dokumen Lampiran
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y divide-slate-100">
                                {dokumen?.map((doc) => (
                                    <li key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{doc.doc_type.replace(/_/g, ' ')}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{doc.file_name} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const token = sessionStorage.getItem('token');
                                                    const url = `http://localhost:3000/api/v1/submissions/document/${doc.file_path}?token=${token}&inline=true`;
                                                    window.open(url, '_blank');
                                                }}
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                                Lihat
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownload(doc.file_path, doc.file_name)}
                                            >
                                                <Download className="w-3.5 h-3.5 mr-1.5" />
                                                Unduh
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Actions */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Action buttons for processing submissions */}
                    {/* Operators can process PROCESSING status */}
                    {/* Verifiers can process both PROCESSING (operator function) and PENDING_VERIFICATION (verifier function) */}
                    {(status === 'PROCESSING' || (isVerifier && status === 'PENDING_VERIFICATION')) ? (
                        <Card className="sticky top-6 border-l-4 border-l-primary-500 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {status === 'PROCESSING' ? 'Keputusan Operator' : 'Keputusan Verifikasi'}
                                </CardTitle>
                                <CardDescription>
                                    {status === 'PROCESSING'
                                        ? 'Tinjau dan kirim ke verifikator atau kembalikan ke KUA.'
                                        : 'Tinjau dan berikan keputusan final.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">Catatan Audit</label>
                                    <textarea
                                        id="notes"
                                        rows={4}
                                        className="w-full text-sm border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                                        placeholder={status === 'PROCESSING'
                                            ? "Masukkan catatan untuk verifikator atau alasan pengembalian..."
                                            : "Masukkan komentar persetujuan atau alasan penolakan..."}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Button
                                        variant="danger"
                                        onClick={() => handleDecision('REJECTED')}
                                        disabled={processing}
                                        icon={XCircle}
                                        className="w-full justify-center"
                                    >
                                        {status === 'PROCESSING' ? 'Kembalikan' : 'Tolak'}
                                    </Button>
                                    <Button
                                        variant="success"
                                        onClick={() => handleDecision('APPROVED')}
                                        disabled={processing}
                                        icon={CheckCircle}
                                        className="w-full justify-center"
                                    >
                                        {status === 'PROCESSING' ? 'Kirim ke Verifikator' : 'Setujui'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (status !== 'SUBMITTED' && status !== 'PROCESSING' && status !== 'PENDING_VERIFICATION') && (
                        <Card className="bg-slate-50 border-slate-200">
                            <CardContent className="p-6 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-slate-900">Proses Selesai</h3>
                                <p className="text-sm text-slate-500 mt-1">Pengajuan ini telah selesai diproses.</p>
                            </CardContent>
                        </Card>
                    )}

                    <Alert variant="info" title="Petunjuk Verifikasi">
                        <ul className="list-disc list-inside text-xs space-y-1 mt-1 text-blue-700">
                            <li>Periksa kesesuaian Nama dengan KTP.</li>
                            <li>Pastikan Tanggal Nikah sesuai Buku Nikah (jika ada).</li>
                            <li>Tolak jika dokumen buram atau tidak terbaca.</li>
                            <li>Persetujuan akan memicu penerbitan KK/KTP baru jika data lengkap.</li>
                        </ul>
                    </Alert>
                </div>
            </div>

            <Modal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                title={
                    isOperator
                        ? (confirmAction === 'APPROVED' ? 'Kirim ke Verifikator' : 'Kembalikan ke KUA')
                        : (confirmAction === 'APPROVED' ? 'Setujui Pengajuan' : 'Tolak Pengajuan')
                }
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowConfirm(false)}>Batal</Button>
                        <Button
                            variant={confirmAction === 'APPROVED' ? 'success' : 'danger'}
                            onClick={handleConfirmDecision}
                            loading={processing}
                        >
                            Konfirmasi {isOperator
                                ? (confirmAction === 'APPROVED' ? 'Pengiriman' : 'Pengembalian')
                                : (confirmAction === 'APPROVED' ? 'Persetujuan' : 'Penolakan')
                            }
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p>
                        Apakah Anda yakin ingin <strong className={confirmAction === 'APPROVED' ? 'text-green-600' : 'text-red-600'}>
                            {isOperator
                                ? (confirmAction === 'APPROVED' ? 'MENGIRIM ke VERIFIKATOR' : 'MENGEMBALIKAN ke KUA')
                                : (confirmAction === 'APPROVED' ? 'MENYETUJUI' : 'MENOLAK')
                            }
                        </strong> pengajuan ini?
                    </p>
                    {notes && (
                        <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Catatan Anda:</p>
                            <p className="text-sm text-slate-700 italic">&quot;{notes}&quot;</p>
                        </div>
                    )}
                    {confirmAction === 'APPROVED' && (
                        <Alert variant="warning" className="py-2 text-xs">
                            {isOperator
                                ? 'Pengajuan akan dikirim ke verifikator untuk persetujuan akhir.'
                                : 'Persetujuan ini tidak dapat dibatalkan dan akan memproses data ke database kependudukan.'
                            }
                        </Alert>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default VerificationDetail;
