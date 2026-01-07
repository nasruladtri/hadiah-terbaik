import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/ui/Pagination';
import { Card, CardContent } from '../../../components/ui/Card';
import { Search, Calendar, User } from 'lucide-react';
import { toast } from 'react-toastify';

const VerifierQueue = () => {
    const navigate = useNavigate();
    const [queue, setQueue] = useState([]);
    const [filteredQueue, setFilteredQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchQueue = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/dukcapil/verifier/queue');
            // Backend returns { data: { data: [], pagination: {} } }
            const responseData = res.data.data;
            const items = responseData?.data || [];
            const validData = Array.isArray(items) ? items : [];
            setQueue(validData);
            setFilteredQueue(validData);
        } catch (error) {
            console.error('Failed to fetch verifier queue:', error);
            toast.error('Gagal memuat antrian');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    useEffect(() => {
        let filtered = [...queue];
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.ticket_number?.toLowerCase().includes(lower) ||
                item.data_pernikahan?.husband_name?.toLowerCase().includes(lower) ||
                item.data_pernikahan?.wife_name?.toLowerCase().includes(lower)
            );
        }
        setFilteredQueue(filtered);
        setCurrentPage(1);
    }, [queue, searchQuery]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredQueue.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredQueue.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Antrian Verifikasi</h1>
                <p className="text-slate-500 mt-1">Daftar pengajuan menunggu verifikasi final.</p>
            </div>

            {/* Filter */}
            <Card>
                <CardContent className="p-4">
                    <div className="w-full md:max-w-lg">
                        <Input
                            placeholder="Cari Tiket atau Nama Pasangan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            startIcon={<Search className="w-5 h-5" />}
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
                            <TableHead>Operator</TableHead>
                            <TableHead>Waktu Kirim</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Memuat antrian...</TableCell>
                            </TableRow>
                        ) : currentItems.length === 0 ? (
                            <TableEmpty colSpan={5} message="Tidak ada antrian verifikasi" />
                        ) : (
                            currentItems.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <span className="font-mono font-medium text-emerald-600">#{item.ticket_number}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">
                                                {item.data_pernikahan?.husband_name} & {item.data_pernikahan?.wife_name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                                            <User className="w-3 h-3" />
                                            {item.current_assignee?.full_name || 'N/A'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(item.updated_at).toLocaleString('id-ID')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button onClick={() => navigate(`/dukcapil/verify/${item.id}`)}>
                                            Verifikasi
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                {!loading && filteredQueue.length > 0 && (
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

export default VerifierQueue;
