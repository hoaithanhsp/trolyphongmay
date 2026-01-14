
import React, { useState } from 'react';

interface LoginModalProps {
    onLogin: (username: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate login delay
        setTimeout(() => {
            if (username === 'Trần Thị Kim Thoa' && password === '12345') {
                localStorage.setItem('labmanager_logged_in', 'true');
                localStorage.setItem('labmanager_username', username);
                onLogin(username);
            } else {
                setError('Tên đăng nhập hoặc mật khẩu không đúng!');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-blue-600 px-8 py-6 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <span className="material-symbols-outlined text-white text-4xl">computer</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">LabManager</h1>
                    <p className="text-white/80 text-sm mt-1">Quản lý phòng máy tính</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-textPrimary mb-2">
                            <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg text-gray-400">person</span>
                                Tên đăng nhập
                            </span>
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all"
                            placeholder="Nhập tên đăng nhập..."
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-textPrimary mb-2">
                            <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg text-gray-400">lock</span>
                                Mật khẩu
                            </span>
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all"
                            placeholder="Nhập mật khẩu..."
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                                Đang đăng nhập...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">login</span>
                                Đăng nhập
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        © 2026 LabManager - Trần Thị Kim Thoa
                    </p>
                </form>
            </div>
        </div>
    );
};
