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
import { toast } from 'react-toastify';

const OperatorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        submitted: 0,
        myProcessing: 0,
        sentToVerification: 0
    });
    const [myQueue, setMyQueue] = useState([]);
    const [incomingQueue, setIncomingQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleTaskAction = (item) => {
        if (item.status === 'PENDING_VERIFICATION') {
            if (user?.role === 'VERIFIKATOR_DUKCAPIL') {
                navigate(`/dukcapil/verify/${item.id}`);
            } else {
                toast.error('Kamu tidak mempunyai akses untuk melakukan pekerjaan verifikator');
            }
        } else {
            navigate(`/dukcapil/process/${item.id}`);
        }
    };

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
                const mineStatus = user.role === 'OPERATOR_DUKCAPIL' ? 'PROCESSING' : 'PROCESSING,PENDING_VERIFICATION';
                const resMyQueue = await api.get(`/dukcapil/operator/queue?status=${mineStatus}&mine=true&limit=5`);
                const myQueueItems = resMyQueue.data.success ? resMyQueue.data.data?.data || [] : [];
                setMyQueue(myQueueItems);

                // Fetch "Incoming Queue" - items waiting to be picked up
                const incomingStatus = user.role === 'OPERATOR_DUKCAPIL' ? 'SUBMITTED' : 'SUBMITTED,PENDING_VERIFICATION';
                const resIncoming = await api.get(`/dukcapil/operator/queue?status=${incomingStatus}&mine=false&limit=5`);
                const incomingItems = resIncoming.data.success ? resIncoming.data.data?.data || [] : [];
                setIncomingQueue(incomingItems);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
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
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard {user?.role === 'OPERATOR_DUKCAPIL' ? 'Operator' : 'Verifikator'}</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Selamat datang, <span className="font-semibold text-primary-600">{user?.full_name}</span>.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Antrian Masuk"
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
                    title={user.role === 'OPERATOR_DUKCAPIL' ? "Dikirim Hari Ini" : "Disetujui Hari Ini"}
                    value={stats.sentToVerification}
                    icon={Send}
                    color="emerald"
                />
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2 ml-2">Aksi Cepat:</span>
                <Button variant="outline" size="sm" onClick={() => navigate(user.role === 'OPERATOR_DUKCAPIL' ? '/dukcapil/queue' : '/dukcapil/verification-queue')} className="gap-2">
                    <Users className="w-4 h-4" /> Antrian Masuk
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/dukcapil/my-work')} className="gap-2">
                    <Clock className="w-4 h-4" /> Pekerjaan Saya
                </Button>
                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dukcapil/history')} className="gap-2">
                    Riwayat
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dukcapil/laporan')} className="gap-2">
                    Laporan
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left: My Work */}
                <Card className="flex flex-col border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-50">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Pekerjaan Saya
                        </CardTitle>
                        <Badge variant="warning">{myQueue.length} Aktif</Badge>
                    </CardHeader>
                    <CardContent className="pt-4 px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Tiket</TableHead>
                                    <TableHead>Pasangan</TableHead>
                                    <TableHead>Jenis Antrian</TableHead>
                                    <TableHead className="text-right pr-6">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myQueue.length === 0 ? (
                                    <TableEmpty colSpan={4} message="Belum ada pekerjaan yang dikunci" />
                                ) : (
                                    myQueue.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="pl-6 font-mono text-xs font-semibold text-primary-600">
                                                #{item.ticket_number}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium text-slate-900 truncate max-w-[150px]">
                                                    {item.data_pernikahan?.husband_name}
                                                </div>
                                                <div className="text-[10px] text-slate-400">& {item.data_pernikahan?.wife_name}</div>
                                            </TableCell>
                                            <TableCell>
                                                {item.status === 'PENDING_VERIFICATION' ? (
                                                    <Badge variant="default" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-100">Verifikasi</Badge>
                                                ) : (
                                                    <Badge variant="default" className="text-[10px] bg-amber-50 text-amber-700 border-amber-100">Pengajuan</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleTaskAction(item)}
                                                >
                                                    Lanjut
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Right: Incoming Queue */}
                <Card className="flex flex-col border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-50">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <Users className="w-5 h-5 text-blue-500" />
                            Antrian Masuk
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/dukcapil/queue')} className="text-xs text-primary-600">Lihat Semua</Button>
                    </CardHeader>
                    <CardContent className="pt-4 px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Tiket</TableHead>
                                    <TableHead>Pasangan</TableHead>
                                    <TableHead>Jenis Antrian</TableHead>
                                    <TableHead className="text-right pr-6">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {incomingQueue.length === 0 ? (
                                    <TableEmpty colSpan={4} message="Belum ada antrian masuk" />
                                ) : (
                                    incomingQueue.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="pl-6 font-mono text-xs font-semibold text-slate-500">
                                                #{item.ticket_number}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium text-slate-900 truncate max-w-[150px]">
                                                    {item.data_pernikahan?.husband_name}
                                                </div>
                                                <div className="text-[10px] text-slate-400">& {item.data_pernikahan?.wife_name}</div>
                                            </TableCell>
                                            <TableCell>
                                                {item.status === 'PENDING_VERIFICATION' ? (
                                                    <Badge variant="default" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-100">Verifikasi</Badge>
                                                ) : (
                                                    <Badge variant="default" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">Pengajuan</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleTaskAction(item)}
                                                >
                                                    Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom: Guide Banner */}
            <div className={`bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl border-t-4 ${user.role === 'OPERATOR_DUKCAPIL' ? 'border-t-primary-500' : 'border-t-indigo-500'}`}>
                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4">
                    <Wrench className={`w-64 h-64 ${user.role === 'OPERATOR_DUKCAPIL' ? 'text-primary-500' : 'text-indigo-500'}`} />
                </div>

                <div className="relative z-10 max-w-2xl">
                    <div className={`${user.role === 'OPERATOR_DUKCAPIL' ? 'bg-primary-500/20 text-primary-400' : 'bg-indigo-500/20 text-indigo-400'} px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-2 mb-4 uppercase tracking-wider`}>
                        <Wrench className="w-3 h-3" /> Panduan {user.role === 'OPERATOR_DUKCAPIL' ? 'Operator' : 'Verifikator'}
                    </div>
                    <h2 className="text-2xl font-bold mb-4">{user.role === 'OPERATOR_DUKCAPIL' ? 'Prosedur Pengolahan Data' : 'Prosedur Verifikasi Akhir'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className={`${user.role === 'OPERATOR_DUKCAPIL' ? 'text-primary-400' : 'text-indigo-400'} font-bold mb-1`}>01. {user.role === 'OPERATOR_DUKCAPIL' ? 'Validasi' : 'Cek NIK'}</div>
                            <p className="text-slate-400 text-xs">{user.role === 'OPERATOR_DUKCAPIL' ? 'Pastikan kelengkapan dokumen scan KUA.' : 'Validasi data NIK dengan SIAK Terpusat.'}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className={`${user.role === 'OPERATOR_DUKCAPIL' ? 'text-primary-400' : 'text-indigo-400'} font-bold mb-1`}>02. {user.role === 'OPERATOR_DUKCAPIL' ? 'Input' : 'Dokumen'}</div>
                            <p className="text-slate-400 text-xs">{user.role === 'OPERATOR_DUKCAPIL' ? 'Sesuaikan data kependudukan pendukung.' : 'Periksa keaslian dokumen lampiran.'}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className={`${user.role === 'OPERATOR_DUKCAPIL' ? 'text-primary-400' : 'text-indigo-400'} font-bold mb-1`}>03. {user.role === 'OPERATOR_DUKCAPIL' ? 'Kirim' : 'Putusan'}</div>
                            <p className="text-slate-400 text-xs">{user.role === 'OPERATOR_DUKCAPIL' ? 'Teruskan ke verifikator untuk disetujui.' : 'Berikan persetujuan atau tolak pengajuan.'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperatorDashboard;
