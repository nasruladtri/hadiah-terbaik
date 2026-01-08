import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { ChevronLeft, FileText, Calendar, MapPin, User, Download, Eye } from 'lucide-react';
import Loading from '../../components/common/Loading';

const SubmissionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await api.get(`/submissions/${id}`);
                setSubmission(res.data.data);
            } catch (error) {
                console.error(error);
                alert('Gagal memuat data pengajuan');
                navigate('/kua/submissions/active');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id, navigate]);

    const handleDownload = (filename) => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            alert('Anda telah keluar (Logged out)');
            return;
        }
        const url = `${API_BASE_URL}/submissions/document/${filename}?token=${token}`;
        window.open(url, '_blank');
    };

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            case 'NEEDS_REVISION': return 'warning';
            case 'PROCESSING': return 'info';
            case 'SUBMITTED': return 'default';
            default: return 'secondary';
        }
    };

    if (loading) return <Loading />;
    if (!submission) return <div className="p-8 text-center text-slate-500">Data tidak ditemukan</div>;

    const { data_pernikahan, dokumen, status } = submission;

    // Get rejection notes if any
    const rejectionLog = (status === 'REJECTED' || status === 'NEEDS_REVISION')
        ? submission.logs?.filter(l => l.new_status === 'REJECTED' || l.new_status === 'NEEDS_REVISION')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Button variant="ghost" className="mb-2 -ml-2 pl-2" onClick={() => navigate(-1)}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Kembali
                    </Button>
                    <h1 className="text-2xl font-display font-bold text-slate-900">
                        Detail Pengajuan
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span>Tiket #{submission.ticket_number}</span>
                        <span>•</span>
                        <span>Diajukan {new Date(submission.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={getStatusBadgeVariant(status)} className="text-sm px-3 py-1">
                        {status}
                    </Badge>
                    {/* Action buttons could go here if needed, e.g. Print */}
                </div>
            </div>

            {/* Rejection/Revision Alert */}
            {(status === 'REJECTED' || status === 'NEEDS_REVISION') && rejectionLog && (
                <Alert
                    variant={status === 'REJECTED' ? 'destructive' : 'warning'}
                    title={status === 'REJECTED' ? 'Pengajuan Ditolak - Perlu Perbaikan' : 'Pengajuan Perlu Revisi'}
                    icon={status === 'REJECTED' ? undefined : undefined} // Alert component handles default icons based on variant
                >
                    <div className="mt-2 text-sm">
                        <p className="font-semibold mb-1">Catatan dari Dukcapil:</p>
                        <p className="italic mb-4">&quot;{rejectionLog.notes || 'Tidak ada catatan'}&quot;</p>
                        <Button
                            size="sm"
                            variant="outline"
                            className="bg-white hover:bg-slate-50 text-slate-900 border-slate-300"
                            onClick={() => navigate(`/kua/submission/edit/${id}`)}
                        >
                            Perbaiki Pengajuan
                        </Button>
                    </div>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Data */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Data Pernikahan Card */}
                    <Card>
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary-600" />
                                Data Pernikahan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                                <div className="sm:col-span-2 flex items-center gap-2 p-3 bg-primary-50 text-primary-800 rounded-lg border border-primary-100">
                                    <MapPin className="w-5 h-5 flex-shrink-0" />
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wider text-primary-600">Lokasi Nikah</dt>
                                        <dd className="font-medium text-sm">{data_pernikahan?.marriage_location || '-'}</dd>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-xs font-medium text-slate-500 uppercase">Tanggal Nikah</dt>
                                    <dd className="text-sm font-medium text-slate-900 bg-slate-50 p-2 rounded border border-slate-100">
                                        {new Date(data_pernikahan?.marriage_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-xs font-medium text-slate-500 uppercase">Waktu Nikah</dt>
                                    <dd className="text-sm font-medium text-slate-900 bg-slate-50 p-2 rounded border border-slate-100">
                                        {data_pernikahan?.marriage_time || '-'}
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-xs font-medium text-slate-500 uppercase">Nomor Buku Nikah</dt>
                                    <dd className="text-sm font-medium text-slate-900">{data_pernikahan?.marriage_book_no}</dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-xs font-medium text-slate-500 uppercase">Kode KUA</dt>
                                    <dd className="text-sm font-medium text-slate-900 font-mono">{data_pernikahan?.kua_code}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    {/* Husband and Wife Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-3">
                                <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Data Suami
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <dt className="text-xs text-slate-500 mb-1">Nama Lengkap</dt>
                                    <dd className="text-sm font-semibold text-slate-900">{data_pernikahan?.husband_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-500 mb-1">NIK</dt>
                                    <dd className="text-sm font-mono bg-slate-100 inline-block px-2 py-1 rounded text-slate-700">{data_pernikahan?.husband_nik}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-500 mb-1">Kontak</dt>
                                    <dd className="text-sm text-slate-900">{data_pernikahan?.hp_suami || '-'}</dd>
                                    <dd className="text-xs text-slate-500">{data_pernikahan?.email_suami}</dd>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="bg-pink-50/50 border-b border-pink-100 pb-3">
                                <CardTitle className="text-base text-pink-800 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Data Istri
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <dt className="text-xs text-slate-500 mb-1">Nama Lengkap</dt>
                                    <dd className="text-sm font-semibold text-slate-900">{data_pernikahan?.wife_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-500 mb-1">NIK</dt>
                                    <dd className="text-sm font-mono bg-slate-100 inline-block px-2 py-1 rounded text-slate-700">{data_pernikahan?.wife_nik}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-500 mb-1">Kontak</dt>
                                    <dd className="text-sm text-slate-900">{data_pernikahan?.hp_istri || '-'}</dd>
                                    <dd className="text-xs text-slate-500">{data_pernikahan?.email_istri}</dd>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column - Documents */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-slate-500" />
                                Dokumen Lampiran
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y divide-slate-100">
                                {dokumen?.map((doc) => {
                                    const token = sessionStorage.getItem('token');
                                    const previewUrl = `${API_BASE_URL}/submissions/document/${doc.file_path}?token=${token}&inline=true`;
                                    const isImage = doc.file_name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
                                    const isPDF = doc.file_name?.toLowerCase().endsWith('.pdf');

                                    return (
                                        <li key={doc.id} className="p-4 hover:bg-slate-50 transition">
                                            <div className="flex flex-col gap-3">
                                                {/* Document Header */}
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 text-green-600">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-900 truncate" title={doc.doc_type}>
                                                            {doc.doc_type.replace(/_/g, ' ')}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">{doc.file_name}</p>
                                                        <div className="flex gap-2 mt-2">
                                                            <button
                                                                onClick={() => window.open(previewUrl, '_blank')}
                                                                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center bg-white border border-blue-200 px-2 py-1 rounded shadow-sm transition-colors"
                                                            >
                                                                <Eye className="w-3 h-3 mr-1" />
                                                                Buka
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownload(doc.file_path)}
                                                                className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center bg-white border border-primary-200 px-2 py-1 rounded shadow-sm transition-colors"
                                                            >
                                                                <Download className="w-3 h-3 mr-1" />
                                                                Unduh
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Inline Preview */}
                                                <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                                                    {isImage ? (
                                                        <img
                                                            src={previewUrl}
                                                            alt={doc.file_name}
                                                            className="w-full h-auto max-h-64 object-contain bg-white"
                                                            loading="lazy"
                                                        />
                                                    ) : isPDF ? (
                                                        <iframe
                                                            src={previewUrl}
                                                            className="w-full h-64 border-0"
                                                            title={doc.file_name}
                                                        />
                                                    ) : (
                                                        <div className="p-6 text-center text-slate-500">
                                                            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                                                            <p className="text-xs">Preview tidak tersedia</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                                {(!dokumen || dokumen.length === 0) && (
                                    <li className="p-6 text-center text-slate-500 text-sm italic">
                                        Tidak ada dokumen terlampir
                                    </li>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SubmissionDetail;
