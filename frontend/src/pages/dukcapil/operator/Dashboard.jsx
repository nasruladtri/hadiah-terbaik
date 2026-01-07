import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../../components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Loading from '../../../components/common/Loading';
import { Users, RefreshCcw, Send, Clock, Wrench } from 'lucide-react';

const OperatorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        submitted: 0,
        myProcessing: 0,
        sentToVerification: 0
    });
    const [myQueue, setMyQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resStats = await api.get('/dukcapil/operator/reports');
                if (resStats.data.success) {
                    setStats({
                        submitted: resStats.data.data.queue || 0,
                        myProcessing: resStats.data.data.processing || 0,
                        sentToVerification: resStats.data.data.completedToday || 0
                    });
                }

                // Fetch "My Work" - submissions that are PROCESSING or PENDING_VERIFICATION and assigned to ME
                const resQueue = await api.get('/dukcapil/operator/queue?status=PROCESSING,PENDING_VERIFICATION&mine=true&limit=5');
                // Backend returns { data: { data: [], pagination: {} } }
                const queueData = resQueue.data.success ? resQueue.data.data : null;
                const items = queueData?.data || [];
                setMyQueue(Array.isArray(items) ? items : []);
            } catch (error) {
                console.error('Failed to fetch operator data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <Loading />;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Operator</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Selamat datang, <span className="font-semibold text-primary-600">{user?.full_name}</span>.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Antrian Menunggu"
                    value={stats.submitted}
                    icon={Users}
                    color="blue"
                    onClick={() => navigate('/dukcapil/queue')}
                />
                <StatCard
                    title="Sedang Diproses"
                    value={stats.myProcessing}
                    icon={RefreshCcw}
                    color="amber"
                    onClick={() => navigate('/dukcapil/my-work')}
                />
                <StatCard
                    title="Dikirim Hari Ini"
                    value={stats.sentToVerification}
                    icon={Send}
                    color="emerald"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: My Work */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock className="w-5 h-5 text-primary-500" />
                                Pekerjaan Saya
                            </CardTitle>
                            <Badge variant="secondary">{myQueue.length} Item</Badge>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tiket</TableHead>
                                        <TableHead>Pasangan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {myQueue.length === 0 ? (
                                        <TableEmpty colSpan={4} message="Tidak ada pekerjaan aktif" />
                                    ) : (
                                        myQueue.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono text-xs font-semibold text-primary-600">
                                                    #{item.ticket_number}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {item.data_pernikahan?.husband_name} & {item.data_pernikahan?.wife_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.status === 'PROCESSING' ? (
                                                        <Badge variant="warning">Sedang Diproses</Badge>
                                                    ) : (
                                                        <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">Menunggu Verifikasi</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant={item.status === 'PROCESSING' ? 'primary' : 'outline'}
                                                        onClick={() => navigate(`/dukcapil/process/${item.id}`)}
                                                    >
                                                        {item.status === 'PROCESSING' ? 'Lanjut' : 'Lihat'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {myQueue.length === 0 && (
                                <div className="mt-4 text-center">
                                    <Button variant="outline" onClick={() => navigate('/dukcapil/queue')}>
                                        Ambil Antrian Baru
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Guide */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>

                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2 relative z-10">
                            <Wrench className="w-5 h-5" />
                            Panduan Operator
                        </h3>
                        <p className="text-primary-100 text-sm mb-6 leading-relaxed relative z-10">
                            Pastikan kelengkapan dokumen fisik dan digital sebelum mengirim ke verifikator.
                        </p>
                        <ul className="space-y-3 text-sm relative z-10">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary-200 rounded-full"></span>
                                <span className="text-primary-50">Periksa kelengkapan dokumen</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary-200 rounded-full"></span>
                                <span className="text-primary-50">Validasi kesesuaian data</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary-200 rounded-full"></span>
                                <span className="text-primary-50">Submit untuk verifikasi akhir</span>
                            </li>
                        </ul>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wide text-slate-500">Aksi Cepat</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="secondary"
                                className="w-full justify-start"
                                onClick={() => navigate('/dukcapil/queue')}
                            >
                                Lihat Antrian Masuk
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => navigate('/dukcapil/my-work')}
                            >
                                Pekerjaan Saya
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OperatorDashboard;
