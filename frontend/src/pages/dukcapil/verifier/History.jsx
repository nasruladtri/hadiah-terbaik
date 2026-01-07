import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Badge from '../../../components/ui/Badge';
import Pagination from '../../../components/ui/Pagination';
import { Card, CardContent } from '../../../components/ui/Card';
import { Search } from 'lucide-react';
import { toast } from 'react-toastify';

const VerifierHistory = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/dukcapil/verifier/queue?status=APPROVED,REJECTED');
            // Backend returns { data: { data: [], pagination: {} } }
            const responseData = res.data.data;
            const items = responseData?.data || [];
            const validData = Array.isArray(items) ? items : [];
            setHistory(validData);
            setFilteredHistory(validData);
        } catch (error) {
            console.error('Failed to fetch verifier history:', error);
            toast.error('Gagal memuat riwayat');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        let filtered = [...history];
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.ticket_number?.toLowerCase().includes(lower) ||
                item.data_pernikahan?.husband_name?.toLowerCase().includes(lower) ||
                item.data_pernikahan?.wife_name?.toLowerCase().includes(lower)
            );
        }
        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter);
        }
        setFilteredHistory(filtered);
        setCurrentPage(1);
    }, [history, searchQuery, statusFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

    const getStatusVariant = (status) => {
        switch (status) {
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            default: return 'default';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Riwayat Verifikasi</h1>
                <p className="text-slate-500 mt-1">Daftar pengajuan yang telah selesai diproses.</p>
            </div>

            {/* Filter */}
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full md:max-w-lg">
                        <Input
                            placeholder="Cari Tiket atau Nama Pasangan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            startIcon={<Search className="w-5 h-5" />}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Select
                            options={[
                                { value: '', label: 'Semua Status' },
                                { value: 'APPROVED', label: 'Disetujui' },
                                { value: 'REJECTED', label: 'Ditolak' }
                            ]}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Tiket</TableHead>
                            <TableHead>Nama Pasangan</TableHead>
                            <TableHead>Tanggal Verifikasi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Memuat data...</TableCell>
                            </TableRow>
                        ) : currentItems.length === 0 ? (
                            <TableEmpty colSpan={5} message="Belum ada riwayat verifikasi" />
                        ) : (
                            currentItems.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <span className="font-mono font-medium text-slate-600">#{item.ticket_number}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900">
                                            {item.data_pernikahan?.husband_name} & {item.data_pernikahan?.wife_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-slate-500 text-sm">
                                            {new Date(item.updated_at).toLocaleString('id-ID')}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(item.status)}>
                                            {item.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigate(`/dukcapil/verify/${item.id}`)}
                                        >
                                            Detail
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                {!loading && filteredHistory.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        hasNext={currentPage < totalPages}
                        hasPrev={currentPage > 1}
                    />
                )}
            </Card>
        </div>
    );
};

export default VerifierHistory;
