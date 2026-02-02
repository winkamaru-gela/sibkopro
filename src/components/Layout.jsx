import React, { useState, useEffect } from 'react';
import { 
    Home, Users, BookOpen, Printer, Settings, UserCog, LogOut, 
    X, List, Trophy, Database, ChevronDown, ChevronRight, School,
    BookUser // Ikon baru untuk Buku Poin
} from 'lucide-react';

const Layout = ({ children, activeTab, setActiveTab, userRole, userName, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState(null);

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

    // Definisi Menu
    const menuItems = userRole === 'admin' 
        ? [
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'users', label: 'Manajemen User', icon: Users },
            { id: 'account', label: 'Profil Admin', icon: UserCog } 
          ]
        : [
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            
            // 1. Jurnal Harian (Posisi Ditukar)
            { id: 'journal', label: 'Jurnal Harian', icon: BookOpen },
            
            // 2. Data Siswa (Posisi Ditukar)
            { id: 'students', label: 'Data Siswa', icon: Users },
            
            // 3. Menu Operasional Poin
            { id: 'points', label: 'Catat Poin Siswa', icon: Trophy }, 
            
            // 4. Buku Poin Siswa (Menu Baru)
            { id: 'point_book', label: 'Buku Poin Siswa', icon: BookUser },

            // 5. Menu Laporan
            { id: 'reports', label: 'Cetak Laporan', icon: Printer },

            // 6. Master Data (Group) - Di bawah Laporan
            { 
                id: 'master_group', 
                label: 'Master Data', 
                icon: Database,
                children: [
                    { id: 'master_points', label: 'Data Poin', icon: List },
                    { id: 'settings', label: 'Pengaturan Sekolah', icon: School }
                ]
            },
            
            { id: 'account', label: 'Akun Saya', icon: UserCog }
          ];

    const handleMenuClick = (item) => {
        if (item.children) {
            if (!sidebarOpen && window.innerWidth >= 768) {
                setSidebarOpen(true);
                setTimeout(() => setExpandedMenu(item.id), 50);
            } else {
                setExpandedMenu(expandedMenu === item.id ? null : item.id);
            }
        } else {
            setActiveTab(item.id);
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            }
        }
    };

    const handleSubMenuClick = (childId) => {
        setActiveTab(childId);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden print:bg-white print:h-auto">
            {/* Overlay Mobile */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
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
                            <div className="animate-in fade-in duration-300">
                                <h1 className="font-bold tracking-wider">SIBKO</h1>
                                <p className="text-[10px] text-slate-400 uppercase">{userRole === 'admin' ? 'Super Admin' : 'Guru BK'}</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <X size={24}/>
                    </button>
                </div>

                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                    {menuItems.map(item => (
                        <div key={item.id}>
                            {/* ITEM MENU UTAMA */}
                            <button
                                onClick={() => handleMenuClick(item)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                                    (activeTab === item.id || (item.children && item.children.find(c => c.id === activeTab))) 
                                    ? 'bg-slate-800 text-white' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                                title={!sidebarOpen ? item.label : ''}
                            >
                                <div className="flex items-center">
                                    <item.icon size={20} className={`flex-shrink-0 ${(activeTab === item.id || (item.children && item.children.find(c => c.id === activeTab))) ? 'text-blue-500' : ''}`}/>
                                    {(sidebarOpen || window.innerWidth < 768) && (
                                        <span className="ml-3 font-medium text-sm whitespace-nowrap">{item.label}</span>
                                    )}
                                </div>
                                {/* Icon Panah untuk Dropdown */}
                                {item.children && (sidebarOpen || window.innerWidth < 768) && (
                                    expandedMenu === item.id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>
                                )}
                            </button>

                            {/* SUBMENU (CHILDREN) */}
                            {item.children && expandedMenu === item.id && (sidebarOpen || window.innerWidth < 768) && (
                                <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2 animate-in slide-in-from-left-2 duration-200">
                                    {item.children.map(child => (
                                        <button
                                            key={child.id}
                                            onClick={() => handleSubMenuClick(child.id)}
                                            className={`w-full flex items-center p-2.5 rounded-lg text-sm transition-colors ${
                                                activeTab === child.id 
                                                ? 'bg-blue-600 text-white shadow-sm' 
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                            }`}
                                        >
                                            {child.icon && <child.icon size={16} className="mr-2 opacity-80"/>}
                                            <span>{child.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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