import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(username, password);
            if (result.success) {
                if (result.must_change_password) {
                    navigate('/auth/change-password', {
                        state: {
                            user_id: result.user_id,
                            username: result.username
                        },
                        replace: true
                    });
                } else {
                    navigate('/');
                }
            } else {
                setError(result.message);
                setPassword('');
            }
        } catch {
            setError('Username atau password salah');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold text-slate-900">Selamat Datang</h2>
                <p className="text-slate-500 mt-2">Silakan masuk ke akun Anda untuk melanjutkan</p>
            </div>

            {error && (
                <Alert variant="destructive" title="Gagal Masuk" className="mb-6">
                    {error}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="Username / NIP"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username atau NIP"
                    disabled={isLoading}
                    required
                />

                <div className="space-y-1">
                    <div className="relative">
                        <Input
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    <div className="flex justify-end">
                        <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                            Lupa password?
                        </a>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={isLoading}
                    >
                        Masuk Aplikasi
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default Login;
