import React, { useMemo } from 'react';
import { 
    Users, Activity, AlertOctagon, AlertTriangle, 
    PieChart, Clock, CheckCircle, TrendingUp, Calendar,
    UserCheck, BookOpen
} from 'lucide-react';
import { formatIndoDate } from '../utils/helpers';

const GuruDashboard = ({ students, journals, user }) => {
    // 1. Data Processing
    const highRiskStudents = useMemo(() => students.filter(s => s.riskLevel === 'HIGH'), [students]);
    const mediumRiskStudents = useMemo(() => students.filter(s => s.riskLevel === 'MEDIUM'), [students]);
    
    const currentMonth = new Date().toISOString().slice(0, 7); 
    const monthlyJournals = useMemo(() => journals.filter(j => j.date.startsWith(currentMonth)), [journals, currentMonth]);
    
    // Top 5 Problems/Services
    const problemStats = useMemo(() => {
        const stats = {};
        journals.forEach(j => {
            const key = j.serviceType || 'Lainnya';
            stats[key] = (stats[key] || 0) + 1;
        });
        // Convert to array and sort
        const arr = Object.entries(stats).map(([label, count]) => ({
            label, count, percentage: Math.round((count / journals.length) * 100)
        }));
        return arr.sort((a,b) => b.count - a.count).slice(0, 5); 
    }, [journals]);

    const recentJournals = useMemo(() => {
        return [...journals].sort((a, b) => {
            const tA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt || a.date).getTime()/1000;
            const tB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt || b.date).getTime()/1000;
            return (tB || 0) - (tA || 0);
        }).slice(0, 6);
    }, [journals]);

    // Greeting Logic
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 19) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    // Ambil nama depan saja untuk sapaan agar lebih akrab (Opsional, atau gunakan fullName langsung)
    const displayName = user?.fullName || 'Guru BK';

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in pb-24">
            
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                        {getGreeting()}, <span className="text-blue-600">{displayName}</span>
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm md:text-base">
                        <Calendar size={16} className="text-blue-500"/> 
                        {new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}
                    </p>
                </div>
            </div>

            {/* STAT CARDS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <StatCard 
                    title="Total Siswa" 
                    value={students.length} 
                    icon={Users} 
                    color="blue"
                    desc="Siswa Binaan"
                />
                <StatCard 
                    title="Layanan Bulan Ini" 
                    value={monthlyJournals.length} 
                    icon={Activity} 
                    color="green"
                    desc="Jurnal Tercatat"
                />
                <StatCard 
                    title="Resiko Tinggi" 
                    value={highRiskStudents.length} 
                    icon={AlertOctagon} 
                    color="red"
                    desc="Perlu Tindakan"
                />
                <StatCard 
                    title="Resiko Sedang" 
                    value={mediumRiskStudents.length} 
                    icon={AlertTriangle} 
                    color="orange"
                    desc="Pantauan Berkala"
                />
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* LEFT: EARLY WARNING SYSTEM (EWS) */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-red-50 to-white">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                                <AlertTriangle size={18}/> 
                            </div>
                            Early Warning System
                        </h3>
                        <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full font-bold shadow-sm">
                            {highRiskStudents.length} Prioritas
                        </span>
                    </div>
                    
                    <div className="p-0 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200">
                        {highRiskStudents.length > 0 ? (
                            <>
                                {/* Desktop Table View */}
                                <table className="w-full text-sm text-left hidden md:table">
                                    <thead className="text-xs text-slate-500 bg-slate-50 sticky top-0 uppercase">
                                        <tr>
                                            <th className="p-4 font-bold">Nama Siswa</th>
                                            <th className="p-4 font-bold">Kelas</th>
                                            <th className="p-4 font-bold">Wali / Kontak</th>
                                            <th className="p-4 font-bold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {highRiskStudents.map(s => (
                                            <tr key={s.id} className="hover:bg-red-50/50 transition-colors group">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-700">{s.name}</div>
                                                    <div className="text-xs text-slate-400">{s.nisn || 'No NISN'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono text-xs">{s.class}</span>
                                                </td>
                                                <td className="p-4 text-slate-600 text-xs">
                                                    <div>{s.parent || '-'}</div>
                                                    <div className="text-slate-400">{s.parentPhone}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
                                                        URGENT
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Mobile Card View */}
                                <div className="md:hidden p-4 space-y-3">
                                    {highRiskStudents.map(s => (
                                        <div key={s.id} className="bg-white border border-red-100 rounded-xl p-4 shadow-sm flex items-start gap-3 relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800">{s.name}</h4>
                                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                                    <span className="bg-slate-100 px-1.5 rounded">{s.class}</span>
                                                    <span>{s.parentPhone || 'No Kontak'}</span>
                                                </div>
                                            </div>
                                            <AlertOctagon size={20} className="text-red-500"/>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <div className="bg-green-50 p-4 rounded-full mb-3">
                                    <CheckCircle size={40} className="text-green-500"/>
                                </div>
                                <p className="font-medium text-slate-600">Aman Terkendali</p>
                                <p className="text-sm">Tidak ada siswa dengan resiko tinggi.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: TREND LAYANAN */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                    <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                <PieChart size={18}/> 
                            </div>
                            Tren Layanan
                        </h3>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto">
                        {problemStats.length > 0 ? (
                            <div className="space-y-6">
                                {problemStats.map((stat, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-bold text-slate-700">{stat.label}</span>
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{stat.count} Kasus</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${
                                                    idx === 0 ? 'bg-blue-500 w-[80%]' : 
                                                    idx === 1 ? 'bg-indigo-400 w-[60%]' : 
                                                    idx === 2 ? 'bg-teal-400 w-[40%]' : 'bg-slate-300 w-[20%]'
                                                }`}
                                                style={{ width: `${stat.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-slate-400 text-sm italic">
                                Belum ada data layanan yang cukup.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BOTTOM: RECENT ACTIVITY */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="text-blue-500"/> Aktivitas Terakhir
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentJournals.map((j, i) => (
                        <div key={j.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                            {/* Decorative Dot */}
                            <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${i === 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                            
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-[10px] uppercase font-bold tracking-wide px-2 py-1 rounded-md ${
                                    j.serviceType?.includes('Klasikal') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {j.serviceType}
                                </span>
                            </div>
                            
                            <h4 className="font-bold text-slate-800 mb-1 line-clamp-1">{j.studentNames?.join(', ') || j.studentName}</h4>
                            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                                <Calendar size={12}/> {formatIndoDate(j.date)}
                            </p>
                            
                            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic line-clamp-2 border border-slate-100">
                                "{j.description}"
                            </div>
                        </div>
                    ))}
                    {recentJournals.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            Belum ada aktivitas layanan.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- SUB COMPONENT: STAT CARD ---
const StatCard = ({ title, value, icon: Icon, color, desc }) => {
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
    };

    return (
        <div className={`bg-white p-4 md:p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow relative overflow-hidden group`}>
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div>
                    <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wide">{title}</p>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl ${colorStyles[color]} transition-transform group-hover:scale-110`}>
                    <Icon size={20} className="md:w-6 md:h-6"/>
                </div>
            </div>
            <div className="text-xs text-slate-400 font-medium relative z-10">
                {desc}
            </div>
            
            {/* Background decoration */}
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5 ${colorStyles[color].replace('border-', 'bg-')}`}></div>
        </div>
    );
}

export default GuruDashboard;