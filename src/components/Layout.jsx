// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
// Tambahkan 'Database' atau gunakan 'List' untuk ikon Master Data
import { Home, Users, BookOpen, Printer, Settings, UserCog, LogOut, X, List, Trophy, Database } from 'lucide-react';

const Layout = ({ children, activeTab, setActiveTab, userRole, userName, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = userRole === 'admin' 
        ? [
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'users', label: 'Manajemen User', icon: Users },
            { id: 'account', label: 'Profil Admin', icon: UserCog } 
          ]
        : [
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'students', label: 'Data Siswa', icon: Users },
            { id: 'journal', label: 'Jurnal Harian', icon: BookOpen },
            
            // Menu Operasional Poin
            { id: 'points', label: 'Catat Poin', icon: Trophy }, 
            
            // --- MENU MASTER DATA (DIPISAH) ---
            { id: 'master_points', label: 'Master Data Poin', icon: Database }, 
            
            { id: 'reports', label: 'Laporan & Cetak', icon: Printer },
            
            // --- MENU PENGATURAN SEKOLAH (DIPISAH) ---
            { id: 'settings', label: 'Pengaturan Sekolah', icon: Settings }, 
            
            { id: 'account', label: 'Akun Saya', icon: UserCog }
          ];

    const handleMenuClick = (id) => {
        setActiveTab(id);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden print:bg-white print:h-auto">
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`
                bg-slate-900 text-white flex flex-col 
                fixed inset-y-0 left-0 z-50 h-full w-64
                transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-20'}
                print:hidden
            `}>
                <div className="p-4 border-b border-slate-700 flex items-center gap-3 h-16 justify-between md:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold flex-shrink-0">S</div>
                        {(sidebarOpen || window.innerWidth < 768) && (
                            <div>
                                <h1 className="font-bold tracking-wider">SIBKO</h1>
                                <p className="text-[10px] text-slate-400 uppercase">{userRole === 'admin' ? 'Super Admin' : 'Guru BK'}</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <X size={24}/>
                    </button>
                </div>

                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleMenuClick(item.id)}
                            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            title={!sidebarOpen ? item.label : ''}
                        >
                            <item.icon size={20} className="flex-shrink-0"/>
                            {(sidebarOpen || window.innerWidth < 768) && <span className="ml-3 font-medium text-sm whitespace-nowrap">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={onLogout} className={`w-full flex items-center ${(sidebarOpen || window.innerWidth < 768) ? 'justify-start' : 'justify-center'} text-red-400 hover:text-red-300 hover:bg-slate-800 p-2 rounded transition-all`}>
                        <LogOut size={20} />
                        {(sidebarOpen || window.innerWidth < 768) && <span className="ml-3 text-sm font-medium">Keluar</span>}
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0 print:hidden z-30">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded text-slate-500">
                        <List size={24}/>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-slate-700">{userName}</p>
                            <p className="text-xs text-slate-500 capitalize">{userRole}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                            {userName.charAt(0)}
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-0 md:p-0 print:overflow-visible w-full relative">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;