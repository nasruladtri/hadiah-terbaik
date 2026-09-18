import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Eye, EyeOff } from 'lucide-react';

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const username = location.state?.username;

    useEffect(() => {
        if (!username) {
            navigate('/auth/login', { replace: true });
        }
    }, [username, navigate]);

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 12) {
            errors.push('Minimal 12 karakter');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Harus mengandung huruf besar (A-Z)');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Harus mengandung huruf kecil (a-z)');
        }
        if (!/\d/.test(password)) {
            errors.push('Harus mengandung angka (0-9)');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Harus mengandung karakter spesial (!@#$%^&*...)');
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const newPasswordErrors = validatePassword(newPassword);
        if (newPasswordErrors.length > 0) {
            setError('Password baru tidak memenuhi persyaratan:\n' + newPasswordErrors.join('\n'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Konfirmasi password tidak cocok');
            return;
        }

        if (oldPassword === newPassword) {
            setError('Password baru harus berbeda dengan password lama');
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.put('/auth/first-login-change-password', {
                username,
                oldPassword,
                newPassword
            });

            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(() => {
                    navigate('/auth/login', { replace: true });
                }, 2000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginAgain = async () => {
        navigate('/auth/login', { replace: true });
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold text-slate-900">Ubah Password</h2>
                <p className="text-slate-500 mt-2">
                    {username ? `Halo, ${username}` : 'Anda perlu mengubah password sebelum melanjutkan'}
                </p>
            </div>

            {error && (
                <Alert variant="destructive" title="Gagal" className="mb-6 whitespace-pre-line">
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success" title="Berhasil" className="mb-6">
                    {success}
                    <p className="mt-2 text-sm">Mengarahkan ke halaman login...</p>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                    <Input
                        label="Password Lama"
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isLoading}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                    >
                        {showOldPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                </div>

                <div className="relative">
                    <Input
                        label="Password Baru"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isLoading}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                    >
                        {showNewPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                </div>

                <div className="text-sm text-slate-500 space-y-1 pl-1">
                    <p>Persyaratan password baru:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                        <li>Minimal 12 karakter</li>
                        <li>Mengandung huruf besar (A-Z)</li>
                        <li>Mengandung huruf kecil (a-z)</li>
                        <li>Mengandung angka (0-9)</li>
                        <li>Mengandung karakter spesial (!@#$%^&*...)</li>
                    </ul>
                </div>

                <div className="relative">
                    <Input
                        label="Konfirmasi Password Baru"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isLoading}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={isLoading}
                    >
                        Ubah Password
                    </Button>
                </div>
            </form>

            <div className="mt-6 text-center">
                <button
                    type="button"
                    onClick={handleLoginAgain}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    disabled={isLoading}
                >
                    Kembali ke Login
                </button>
            </div>
        </div>
    );
};

export default ChangePassword;