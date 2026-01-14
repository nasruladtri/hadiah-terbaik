import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';

import { Card } from '../../../components/ui/Card';
import { toast } from 'react-toastify';

const MyWork = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myQueue, setMyQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyWork = async () => {
            setLoading(true);
            try {
                // Fetch PROCESSING and PENDING_VERIFICATION items
                const res = await api.get('/dukcapil/operator/queue?status=PROCESSING,PENDING_VERIFICATION&mine=true');
                // Backend returns { data: { data: [], pagination: {} } }
                const responseData = res.data.data;
                const items = responseData?.data || [];
                setMyQueue(Array.isArray(items) ? items : []);
            } catch (error) {
                console.error('Failed to fetch my work:', error);
                toast.error('Gagal memuat pekerjaan saya');
            } finally {
                setLoading(false);
            }
        };

        fetchMyWork();
    }, []);

    const getWorkType = (status) => {
        // Differentiate between processing work and verification work
        if (status === 'PROCESSING') {
            return {
                label: 'Pengajuan',
                description: 'Sedang Diproses',
                icon: '⚙️',
                badgeClass: 'bg-blue-50 text-blue-700'
            };
        } else if (status === 'PENDING_VERIFICATION') {
            return {
                label: 'Verifikasi',
                description: 'Menunggu Verifikasi',
                icon: '🔍',
                badgeClass: 'bg-yellow-50 text-yellow-700'
            };
        }
        return {
            label: 'Unknown',
            description: status,
            icon: '❓',
            badgeClass: 'bg-gray-50 text-gray-700'
        };
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Pekerjaan Saya</h1>
                <p className="text-slate-500 mt-1">Daftar pengajuan yang sedang Anda proses.</p>
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Tiket</TableHead>
                            <TableHead>Nama Pasangan</TableHead>
                            <TableHead>Jenis Antrian</TableHead>
                            <TableHead>Waktu Update</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Memuat data...</TableCell>
                            </TableRow>
                        ) : myQueue.length === 0 ? (
                            <TableEmpty colSpan={6} message="Anda tidak memiliki pekerjaan aktif." />
                        ) : (
                            myQueue.map((item) => {
                                const workType = getWorkType(item.status);
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <span className="font-mono font-medium text-emerald-600">#{item.ticket_number}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-900">
                                                {item.data_pernikahan?.husband_name} & {item.data_pernikahan?.wife_name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{workType.icon}</span>
                                                <div>
                                                    <div className="font-semibold text-sm text-slate-900">{workType.label}</div>
                                                    <div className="text-xs text-slate-500">{workType.description}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-slate-500 text-sm">
                                                {new Date(item.updated_at).toLocaleString('id-ID')}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${workType.badgeClass}`}>
                                                {workType.description}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant={item.status === 'PROCESSING' ? 'primary' : 'outline'}
                                                onClick={() => {
                                                    if (item.status === 'PENDING_VERIFICATION') {
                                                        if (user?.role === 'VERIFIKATOR_DUKCAPIL') {
                                                            navigate(`/dukcapil/verify/${item.id}`);
                                                        } else {
                                                            toast.error('Kamu tidak mempunyai akses untuk melakukan pekerjaan verifikator');
                                                        }
                                                    } else {
                                                        navigate(`/dukcapil/process/${item.id}`);
                                                    }
                                                }}
                                            >
                                                {item.status === 'PROCESSING' ? 'Lanjutkan' : 'Lihat'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                {!loading && myQueue.length === 0 && (
                    <div className="p-4 text-center border-t border-slate-100">
                        <Button variant="outline" onClick={() => navigate('/dukcapil/queue')}>
                            Ambil dari Antrian
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default MyWork;
