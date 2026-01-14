import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FileText,
    History,
    BarChart3,
    User,
    LogOut,
    Files,
    CheckSquare,
    Users,
    Database,
    Activity
} from 'lucide-react';

import logoMadiun from './img/kabupaten-madiun.png';

const Sidebar = ({ onCloseMobile }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const getMenuItems = () => {
        const role = user?.role;

        switch (role) {
            case 'KUA':
                return [
                    { name: 'Dashboard', icon: LayoutDashboard, path: '/kua/dashboard' },
                    { name: 'Pengajuan Aktif', icon: FileText, path: '/kua/submissions/active' },
                    { name: 'Riwayat', icon: History, path: '/kua/submissions/history' },
                    { name: 'Laporan', icon: BarChart3, path: '/kua/laporan' },
                    { name: 'Akun', icon: User, path: '/kua/akun' },
                ];
            case 'OPERATOR_DUKCAPIL':
            case 'VERIFIKATOR_DUKCAPIL':
                return [
                    { name: 'Dashboard', icon: LayoutDashboard, path: '/dukcapil/dashboard' },
                    { name: 'Antrian Pengajuan', icon: Files, path: '/dukcapil/queue' },
                    { name: 'Pekerjaan Saya', icon: CheckSquare, path: '/dukcapil/my-work' },
                    { name: 'Antrian Verifikasi', icon: CheckSquare, path: '/dukcapil/verification-queue', badge: true },
                    { name: 'Riwayat', icon: History, path: '/dukcapil/history' },
                    { name: 'Laporan', icon: BarChart3, path: '/dukcapil/laporan' },
                    { name: 'Akun', icon: User, path: '/dukcapil/akun' },
                ];
            case 'ADMIN':
                return [
                    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
                    { name: 'Manajemen User', icon: Users, path: '/admin/users' },
                    { name: 'Master Data', icon: Database, path: '/admin/master' },
                    { name: 'Log Sistem', icon: Activity, path: '/admin/logs' },
                ];
            case 'KEMENAG':
                return [
                    { name: 'Dashboard', icon: LayoutDashboard, path: '/kemenag/dashboard' },
                    { name: 'Laporan', icon: BarChart3, path: '/kemenag/laporan' },
                ];
            default:
                return [];
        }
    };

    const menuItems = getMenuItems();

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            {/* Logo / Header */}
            <div className="flex flex-col items-center justify-center py-6 px-4 border-b border-slate-800 text-center">
                <img src={logoMadiun} alt="Logo Kabupaten Madiun" className="w-16 h-auto mb-3 drop-shadow-lg" />
                <h1 className="font-display font-bold text-xl tracking-tight text-white mb-2 leading-none">
                    Hadiah Terbaik
                </h1>
                <p className="text-[10px] leading-tight text-slate-400 font-medium uppercase tracking-wide opacity-80 max-w-[200px]">
                    HARI INI DIA NIKAH, TERCETAK BERSAMAAN IDENTITAS DI KK DAN KTP-el
                </p>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">
                    Menu Utama
                </div>
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={onCloseMobile}
                        className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 mr-3 ${isActive(item.path) ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                        {item.name}
                    </Link>
                ))}
            </div>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-slate-800 transition-colors"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Keluar Aplikasi
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
