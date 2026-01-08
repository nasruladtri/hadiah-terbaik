import React, { useEffect, useState } from 'react';
import api, { ENDPOINTS, API_BASE_URL } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '../../components/ui/Table';
import { Card, CardContent } from '../../components/ui/Card';
import { Activity, Search, ExternalLink, User, Calendar, MapPin, FileText, Eye, Download } from 'lucide-react';
import { toast } from 'react-toastify';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedActor, setSelectedActor] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [selectedRole, selectedActor, searchTerm]);

    const fetchUsers = async () => {
        try {
            const res = await api.get(`${ENDPOINTS.ADMIN_USERS}?limit=100`);
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedRole) params.append('role', selectedRole);
            if (selectedActor) params.append('actor_id', selectedActor);
            if (searchTerm) params.append('search', searchTerm);

            const res = await api.get(`${ENDPOINTS.ADMIN_LOGS}?${params.toString()}`);
            if (res.data.success) {
                setLogs(res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (submissionId) => {
        if (!submissionId) return;
        setDetailLoading(true);
        setShowDetail(true);
        try {
            const res = await api.get(`/submissions/${submissionId}`);
            if (res.data.success) {
                setSelectedSubmission(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch submission:', error);
            toast.error('Gagal memuat detail pengajuan');
            setShowDetail(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleDownload = (path) => {
        const token = sessionStorage.getItem('token');
        const url = `${API_BASE_URL}/submissions/document/${path}?token=${token}`;
        window.open(url, '_blank');
    };

    // Filter users based on selected role
    const filteredUsers = selectedRole
        ? users.filter(user => user.role === selectedRole)
        : users;

    const getActionBadgeVariant = (action) => {
        switch (action) {
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            case 'VERIFIED': return 'success';
            case 'LOGIN': return 'info';
            default: return 'default';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="text-primary-600" /> Audit Logs
                </h1>
                <p className="text-slate-500 mt-1">Pantau aktivitas sistem dan riwayat pengajuan.</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full md:max-w-lg">
                        <Input
                            placeholder="Cari log (Deskripsi, Nama)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            startIcon={<Search className="w-5 h-5" />}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select
                            options={[
                                { value: '', label: 'Semua Filter Role' },
                                { value: 'KUA', label: 'Pegawai KUA' },
                                { value: 'OPERATOR_DUKCAPIL', label: 'Operator Dukcapil' },
                                { value: 'VERIFIKATOR_DUKCAPIL', label: 'Verifikator Dukcapil' },
                                { value: 'ADMIN', label: 'Administrator' }
                            ]}
                            value={selectedRole}
                            onChange={(e) => {
                                setSelectedRole(e.target.value);
                                setSelectedActor('');
                            }}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select
                            options={[
                                { value: '', label: selectedRole ? 'Semua User ' + selectedRole : 'Semua Aktor' },
                                ...filteredUsers.map(u => ({ value: u.id, label: u.full_name }))
                            ]}
                            value={selectedActor}
                            onChange={(e) => setSelectedActor(e.target.value)}
                            disabled={filteredUsers.length === 0}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Aktor</TableHead>
                            <TableHead>Aksi</TableHead>
                            <TableHead>Detail</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">Memuat log...</TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableEmpty colSpan={4} message="Tidak ada riwayat aktivitas ditemukan" />
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}
                                    className={log.permohonan ? "cursor-pointer hover:bg-slate-50" : ""}
                                    onClick={() => log.permohonan?.id && handleViewDetail(log.permohonan.id)}
                                >
                                    <TableCell className="text-slate-500 whitespace-nowrap text-xs">
                                        {new Date(log.created_at).toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900 text-sm">
                                                {log.actor?.full_name || log.actor?.username || 'System'}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {log.actor?.role || 'Unknown'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getActionBadgeVariant(log.action)}>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-slate-700">{log.notes || '-'}</div>
                                        {log.permohonan && (
                                            <div className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                                                Tiket: #{log.permohonan.ticket_number}
                                                <ExternalLink className="w-3 h-3" />
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Detail Modal */}
            <Modal
                isOpen={showDetail}
                onClose={() => setShowDetail(false)}
                title={selectedSubmission ? `Detail Pengajuan #${selectedSubmission.ticket_number}` : 'Detail Pengajuan'}
                size="lg"
                footer={<Button onClick={() => setShowDetail(false)}>Tutup</Button>}
            >
                {detailLoading ? (
                    <div className="p-8 text-center text-slate-500">Memuat detail...</div>
                ) : selectedSubmission ? (
                    <div className="space-y-6">
                        {/* Data Pernikahan */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-500" />
                                Data Pernikahan
                            </h3>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                <div>
                                    <dt className="text-slate-500 text-xs">Nama Suami</dt>
                                    <dd className="font-medium text-slate-900">{selectedSubmission.data_pernikahan?.husband_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500 text-xs">NIK Suami</dt>
                                    <dd className="font-mono text-slate-700">{selectedSubmission.data_pernikahan?.husband_nik}</dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500 text-xs">Nama Istri</dt>
                                    <dd className="font-medium text-slate-900">{selectedSubmission.data_pernikahan?.wife_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500 text-xs">NIK Istri</dt>
                                    <dd className="font-mono text-slate-700">{selectedSubmission.data_pernikahan?.wife_nik}</dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500 text-xs">Tanggal & Waktu</dt>
                                    <dd className="text-slate-900 flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        {new Date(selectedSubmission.data_pernikahan?.marriage_date).toLocaleDateString()} {selectedSubmission.data_pernikahan?.marriage_time}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500 text-xs">Lokasi</dt>
                                    <dd className="text-slate-900 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        {selectedSubmission.data_pernikahan?.marriage_location}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Dokumen */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                Dokumen Lampiran
                            </h3>
                            <ul className="space-y-2">
                                {selectedSubmission.dokumen?.map((doc) => (
                                    <li key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded border border-slate-200 gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{doc.doc_type}</p>
                                                <p className="text-xs text-slate-500">{doc.file_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const token = sessionStorage.getItem('token');
                                                    const url = `${API_BASE_URL}/submissions/document/${doc.file_path}?token=${token}&inline=true`;
                                                    window.open(url, '_blank');
                                                }}
                                            >
                                                <Eye className="w-3 h-3 mr-1" /> Lihat
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownload(doc.file_path)}
                                            >
                                                <Download className="w-3 h-3 mr-1" /> Unduh
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-center text-red-500">Gagal memuat data.</div>
                )}
            </Modal>
        </div>
    );
};

export default SystemLogs;
