import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, 
  orderBy, Timestamp, deleteDoc, doc, updateDoc, setDoc, getDocs, where, writeBatch 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  BookOpen, Users, FileText, Activity, LogOut, 
  UserPlus, Search, AlertTriangle, CheckCircle, 
  ClipboardList, Shield, Home, Filter, Download, 
  Upload, ArrowRight, Save, Briefcase, Edit, Trash2,
  BrainCircuit, PlusCircle, List, Printer, X, Settings, 
  Image as ImageIcon, BarChart2, TrendingUp, Lock, UserCheck, Key,
  Phone, MapPin, Calendar, User, Eye, Check, Clock, Bookmark, FileSpreadsheet, RefreshCcw, File,
  AlertOctagon, PieChart, UserCog, CalendarDays, TrendingDown, FileCheck, Layers
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Constants ---
const COLLECTION_PATHS = {
    users: 'users',
    students: 'students',
    journals: 'journals',
    settings: 'settings'
};

const INITIAL_ADMIN = {
    username: 'admin',
    password: 'admin123',
    fullName: 'Administrator SIBKO',
    role: 'admin',
    createdAt: new Date().toISOString(),
    accessExpiry: null 
};

const ACCESS_OPTIONS = [
    { label: '7 Hari', value: 7 },
    { label: '30 Hari', value: 30 },
    { label: '6 Bulan', value: 180 },
    { label: '12 Bulan', value: 365 },
    { label: 'Selamanya (Full Time)', value: -1 }
];

const LAYANAN_TYPES = [
  'Konseling Individu', 'Konseling Kelompok', 'Bimbingan Klasikal',
  'Bimbingan Kelompok', 'Konferensi Kasus', 'Home Visit',
  'Alih Tangan Kasus (Referal)', 'Konsultasi', 'Kolaborasi', 'Mediasi'
];

const SKKPD_LIST = [
  "Landasan Hidup Religius", "Landasan Perilaku Etis", "Kematangan Emosi",
  "Kematangan Intelektual", "Kesadaran Tanggung Jawab Sosial", "Kesadaran Gender",
  "Pengembangan Pribadi", "Perilaku Kewirausahaan (Kemandirian)",
  "Wawasan dan Kesiapan Karir", "Kematangan Hubungan Teman Sebaya"
];

const MASALAH_KATEGORI = ['Pribadi', 'Sosial', 'Belajar', 'Karir', 'Kedisiplinan', 'Keluarga'];

const RISK_LEVELS = {
  LOW: { label: 'Rendah', color: 'bg-green-100 text-green-800', icon: CheckCircle, badge: 'bg-green-500' },
  MEDIUM: { label: 'Sedang', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, badge: 'bg-yellow-500' },
  HIGH: { label: 'Tinggi', color: 'bg-red-100 text-red-800', icon: AlertTriangle, badge: 'bg-red-500' },
};

const TEKNIK_KONSELING = [
  "Client Centered (Mendengarkan Aktif)", "Behavioral (Penguatan/Kontrak)",
  "REBT (Rational Emotive Behavior)", "SFBT (Fokus Solusi)", "Reality Therapy (WDEP)",
  "Trait & Factor (Karir)", "Diskusi Kelompok", "Psikodrama", "Sosiodrama", "Lainnya"
];

// --- Helper Functions ---
const getCollectionRef = (collName) => collection(db, collName);

const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    try {
        if (dateString && typeof dateString === 'object' && dateString.seconds) {
            return new Date(dateString.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
};

const parseImportDate = (dateStr) => {
    if (!dateStr) return '';
    const cleanStr = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;

    const monthsIndo = {
        'januari': '01', 'februari': '02', 'maret': '03', 'april': '04', 'mei': '05', 'juni': '06',
        'juli': '07', 'agustus': '08', 'september': '09', 'oktober': '10', 'november': '11', 'desember': '12',
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'jun': '06',
        'jul': '07', 'agu': '08', 'sep': '09', 'okt': '10', 'nov': '11', 'des': '12',
        'agust': '08'
    };

    const parts = cleanStr.split(/[\s\-\/]+/);
    if (parts.length === 3) {
        let day, month, year;
        if (parts[0].length === 4) { year = parts[0]; month = parts[1]; day = parts[2]; } 
        else { day = parts[0]; month = parts[1]; year = parts[2]; }

        if (isNaN(month)) {
            const monthLower = month.toLowerCase();
            if (monthsIndo[monthLower]) month = monthsIndo[monthLower];
            else return '';
        }
        day = day.padStart(2, '0');
        month = month.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return '';
};

const generateCredentials = (name) => {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toLowerCase().substring(0, 6);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const username = `${cleanName}${randNum}`;
    const password = Math.random().toString(36).slice(-8); 
    return { username, password };
};

const calculateExpiry = (days) => {
    if (parseInt(days) === -1) return null; 
    const date = new Date();
    date.setDate(date.getDate() + parseInt(days));
    return date.toISOString();
};

// --- Components ---

const LoginPage = ({ onLogin, loading, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-200 p-4" style={{
            backgroundImage: `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`
        }}>
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-blue-600 animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <div className="h-20 w-20 bg-blue-600 rounded-full mx-auto flex items-center justify-center shadow-lg mb-4">
                        <BookOpen size={40} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold uppercase text-blue-900 tracking-wider">SIBKO LOGIN</h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase">Sistem Informasi Bimbingan Konseling</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm flex items-center gap-2">
                        <AlertTriangle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Users size={18} />
                            </div>
                            <input 
                                className="w-full pl-10 p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                placeholder="Masukkan Username" 
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Key size={18} />
                            </div>
                            <input 
                                type="password" 
                                className="w-full pl-10 p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder="Masukkan Password" 
                                required
                            />
                        </div>
                    </div>
                    <button 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded shadow-lg transition-transform transform hover:scale-105 active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? 'Memuat...' : <><UserCheck size={20} /> MASUK APLIKASI</>}
                    </button>
                </form>
                <div className="mt-8 text-center text-xs text-gray-400 border-t pt-4">
                    &copy; {new Date().getFullYear()} Layanan Bimbingan Konseling Digital
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = ({ users, studentsCount, journalsCount }) => {
    return (
        <div className="p-6 space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Administrator</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-full"><Users size={32}/></div>
                    <div>
                        <p className="text-sm text-slate-500 font-bold uppercase">Total Guru BK</p>
                        <p className="text-3xl font-extrabold text-slate-800">{users.filter(u => u.role === 'guru').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-green-100 text-green-600 rounded-full"><Users size={32}/></div>
                    <div>
                        <p className="text-sm text-slate-500 font-bold uppercase">Total Siswa Terdata</p>
                        <p className="text-3xl font-extrabold text-slate-800">{studentsCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-purple-100 text-purple-600 rounded-full"><FileText size={32}/></div>
                    <div>
                        <p className="text-sm text-slate-500 font-bold uppercase">Total Jurnal Aktivitas</p>
                        <p className="text-3xl font-extrabold text-slate-800">{journalsCount}</p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded shadow-sm">
                <h3 className="font-bold text-blue-800 mb-2">Informasi Sistem</h3>
                <p className="text-sm text-blue-700">Sebagai Admin, Anda memiliki akses untuk mengelola akun pengguna (Guru BK) dan mengubah password Admin sendiri. Anda dapat mengatur masa aktif akun guru (trial/full time).</p>
            </div>
        </div>
    );
};

const GuruDashboard = ({ students, journals }) => {
    const highRiskStudents = useMemo(() => students.filter(s => s.riskLevel === 'HIGH'), [students]);
    const mediumRiskStudents = useMemo(() => students.filter(s => s.riskLevel === 'MEDIUM'), [students]);
    
    const currentMonth = new Date().toISOString().slice(0, 7); 
    const monthlyJournals = useMemo(() => journals.filter(j => j.date.startsWith(currentMonth)), [journals, currentMonth]);
    
    const problemStats = useMemo(() => {
        const stats = {};
        journals.forEach(j => {
            const key = j.serviceType || 'Lainnya';
            stats[key] = (stats[key] || 0) + 1;
        });
        return Object.entries(stats).sort((a,b) => b[1] - a[1]).slice(0, 5); 
    }, [journals]);

    const sortJournals = (list) => {
        return [...list].sort((a, b) => {
            const tA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt || a.date).getTime()/1000;
            const tB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt || b.date).getTime()/1000;
            return (tB || 0) - (tA || 0);
        });
    };

    const recentJournals = sortJournals(journals).slice(0, 3);

    return (
        <div className="p-6 space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Dashboard & Analisis</h2>
                <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase">{new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32 hover:border-blue-400 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Siswa Binaan</p>
                            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{students.length}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20}/></div>
                    </div>
                    <div className="text-xs text-slate-500">Total data siswa</div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32 hover:border-green-400 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Layanan Bulan Ini</p>
                            <h3 className="text-3xl font-extrabold text-green-700 mt-1">{monthlyJournals.length}</h3>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Activity size={20}/></div>
                    </div>
                    <div className="text-xs text-slate-500">Jurnal tercatat bulan ini</div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32 hover:border-red-400 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Resiko Tinggi</p>
                            <h3 className="text-3xl font-extrabold text-red-600 mt-1">{highRiskStudents.length}</h3>
                        </div>
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertOctagon size={20}/></div>
                    </div>
                    <div className="text-xs text-slate-500">Siswa butuh perhatian khusus</div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32 hover:border-orange-400 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Resiko Sedang</p>
                            <h3 className="text-3xl font-extrabold text-orange-600 mt-1">{mediumRiskStudents.length}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle size={20}/></div>
                    </div>
                    <div className="text-xs text-slate-500">Perlu pantauan berkala</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-500"/> Early Warning System (Prioritas)
                        </h3>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">{highRiskStudents.length} Siswa</span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[300px] p-2">
                        {highRiskStudents.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 bg-white sticky top-0">
                                    <tr>
                                        <th className="p-2">Nama Siswa</th>
                                        <th className="p-2">Kelas</th>
                                        <th className="p-2">Wali</th>
                                        <th className="p-2 text-right">Info</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {highRiskStudents.map(s => (
                                        <tr key={s.id} className="hover:bg-red-50 transition-colors">
                                            <td className="p-2 font-bold text-slate-700">{s.name}</td>
                                            <td className="p-2 text-slate-600">{s.class}</td>
                                            <td className="p-2 text-slate-500 text-xs">{s.parent || '-'}</td>
                                            <td className="p-2 text-right">
                                                <span className="text-xs text-red-500 font-bold">URGENT</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                <CheckCircle size={40} className="text-green-200 mb-2"/>
                                <p>Alhamdulillah, tidak ada siswa resiko tinggi.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <div className="p-4 border-b bg-slate-50 rounded-t-xl">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <PieChart size={18} className="text-blue-500"/> Tren Layanan
                        </h3>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                        <p className="text-xs text-slate-400 mb-4 uppercase font-bold">Layanan Terbanyak Diberikan</p>
                        <div className="space-y-4">
                            {problemStats.map(([label, count], idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-700">{label}</span>
                                        <span className="font-bold text-slate-900">{count}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-indigo-400' : 'bg-slate-300'}`} 
                                            style={{ width: `${(count / journals.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {problemStats.length === 0 && <p className="text-sm text-slate-400 italic">Belum ada data layanan.</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-slate-400"/> Aktivitas Terakhir</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentJournals.map(j => (
                        <div key={j.id} className="border border-slate-100 p-4 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between mb-2">
                                <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{j.serviceType}</span>
                                <span className="text-xs text-slate-400">{formatIndoDate(j.date)}</span>
                            </div>
                            <p className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{j.studentNames?.join(', ') || j.studentName}</p>
                            <p className="text-xs text-slate-500 line-clamp-2">"{j.description}"</p>
                        </div>
                    ))}
                    {recentJournals.length === 0 && <p className="text-sm text-slate-400 italic">Belum ada aktivitas.</p>}
                </div>
            </div>
        </div>
    );
};

const AdminUserManagement = ({ users }) => {
    const [form, setForm] = useState({ username: '', password: '', fullName: '', duration: 30 });
    const [editingId, setEditingId] = useState(null);
    
    const handleNameChange = (val) => {
        const newData = { ...form, fullName: val };
        if (!editingId && val.length > 3) {
            const creds = generateCredentials(val);
            newData.username = creds.username;
            newData.password = creds.password;
        }
        setForm(newData);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        if(!form.username || !form.password || !form.fullName) return alert("Lengkapi data!");
        
        const expiryDate = calculateExpiry(form.duration);
        const userData = {
            fullName: form.fullName,
            username: form.username,
            password: form.password,
            accessExpiry: expiryDate,
            role: 'guru',
            updatedAt: new Date().toISOString()
        };

        try {
            if (editingId) {
                await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.users), editingId), userData);
                alert("Data guru berhasil diperbarui.");
            } else {
                if(users.some(u => u.username === form.username)) return alert("Username sudah digunakan!");
                
                await addDoc(getCollectionRef(COLLECTION_PATHS.users), {
                    ...userData,
                    createdAt: new Date().toISOString()
                });
                alert("Guru BK berhasil ditambahkan.");
            }
            resetForm();
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan data.");
        }
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setForm({
            fullName: user.fullName,
            username: user.username,
            password: user.password,
            duration: user.accessExpiry ? 30 : -1 
        });
    };

    const handleDelete = async (id) => {
        if(confirm("Yakin hapus akun ini? Guru tidak akan bisa login lagi.")) {
            await deleteDoc(doc(getCollectionRef(COLLECTION_PATHS.users), id));
        }
    };

    const resetForm = () => {
        setForm({ username: '', password: '', fullName: '', duration: 30 });
        setEditingId(null);
    };

    const getStatus = (expiry) => {
        if (!expiry) return { label: 'Full Time', color: 'bg-green-100 text-green-700' };
        const now = new Date();
        const exp = new Date(expiry);
        const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
        if (diffDays < 7) return { label: `${diffDays} Hari Lagi`, color: 'bg-orange-100 text-orange-700' };
        return { label: `Aktif (${diffDays} hari)`, color: 'bg-blue-100 text-blue-700' };
    };

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Shield size={24}/> Manajemen Pengguna (Guru BK)</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                        <h3 className="font-bold text-blue-600">{editingId ? 'Edit Data Guru' : 'Tambah Guru Baru'}</h3>
                        {editingId && <button onClick={resetForm} className="text-xs text-red-500 hover:underline">Batal</button>}
                    </div>
                    
                    <form onSubmit={handleSaveUser} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap Guru</label>
                            <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={form.fullName} onChange={(e) => handleNameChange(e.target.value)} placeholder="Misal: Budi Santoso, S.Pd" required />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Username (Auto)</label>
                                <input className="w-full p-2 border rounded bg-slate-100 font-mono text-sm" value={form.username} onChange={e=>setForm({...form, username: e.target.value})} placeholder="Username" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Password (Auto)</label>
                                <input className="w-full p-2 border rounded bg-slate-100 font-mono text-sm" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} placeholder="Password" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Masa Aktif Akun</label>
                            <select className="w-full p-2 border rounded bg-white" value={form.duration} onChange={e=>setForm({...form, duration: e.target.value})}>
                                {ACCESS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1">*Pilih "Selamanya" untuk akses tanpa batas.</p>
                        </div>

                        <button className={`w-full text-white py-2 rounded font-bold flex justify-center items-center gap-2 ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
                            {editingId ? <><Edit size={18}/> Update Akun</> : <><PlusCircle size={18}/> Buat Akun</>}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b font-bold text-slate-700">Daftar Guru BK Aktif</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500">
                                <tr>
                                    <th className="p-3">Nama Lengkap</th>
                                    <th className="p-3">Akun Login</th>
                                    <th className="p-3">Status Akses</th>
                                    <th className="p-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.filter(u => u.role === 'guru').map(u => {
                                    const status = getStatus(u.accessExpiry);
                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50">
                                            <td className="p-3 font-bold text-slate-700">{u.fullName}</td>
                                            <td className="p-3 text-slate-500 font-mono text-xs">
                                                User: {u.username}<br/>
                                                Pass: {u.password}
                                            </td>
                                            <td className="p-3">
                                                <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${status.color}`}>
                                                    {status.label}
                                                </span>
                                                {u.accessExpiry && <div className="text-[10px] text-slate-400 mt-1">Exp: {formatIndoDate(u.accessExpiry)}</div>}
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button onClick={() => handleEdit(u)} className="text-blue-500 hover:bg-blue-50 p-2 rounded" title="Edit / Perpanjang">
                                                        <Edit size={16}/>
                                                    </button>
                                                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded" title="Hapus Akses">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {users.filter(u => u.role === 'guru').length === 0 && (
                                    <tr><td colSpan="4" className="p-6 text-center text-slate-400 italic">Belum ada data guru BK.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 4. SHARED/GURU COMPONENTS
const AccountSettings = ({ user, onUpdatePassword }) => {
    const [password, setPassword] = useState(user.password || '');
    const [fullName, setFullName] = useState(user.fullName || '');

    const handleSave = (e) => {
        e.preventDefault();
        if(confirm("Simpan perubahan akun?")) {
            onUpdatePassword({ id: user.id, password, fullName });
        }
    }

    return (
        <div className="p-6 max-w-2xl mx-auto animate-in fade-in">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 mb-6 border-b pb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                        {user.fullName?.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Profil & Akun Saya</h2>
                        <p className="text-sm text-slate-500">Kelola informasi login Anda ({user.role === 'admin' ? 'Administrator' : 'Guru BK'})</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1">Nama Lengkap</label>
                        <input className="w-full p-3 border rounded-lg" value={fullName} onChange={e=>setFullName(e.target.value)} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">Username (Tidak dapat diubah)</label>
                            <input className="w-full p-3 border rounded-lg bg-slate-100 text-slate-500" value={user.username} disabled />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">Password Login</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <input className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" value={password} onChange={e=>setPassword(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {user.role === 'guru' && (
                        <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 flex gap-2">
                            <CalendarDays size={20}/>
                            <div>
                                <span className="font-bold">Status Akun:</span> {user.accessExpiry ? `Berlaku hingga ${formatIndoDate(user.accessExpiry)}` : 'Full Time (Permanen)'}
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                            <Save size={18}/> Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const StudentManager = ({ students, journals, onAdd, onEdit, onDelete, onImport }) => {
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [viewDetail, setViewDetail] = useState(null); 
    const [formData, setFormData] = useState({ 
        nisn: '', name: '', class: '', gender: 'L', 
        pob: '', dob: '', address: '', phone: '',
        parent: '', parentPhone: '', jobParent: '',
        career: '', riskLevel: 'LOW' 
    });
    const [editingId, setEditingId] = useState(null);
    const fileInputRef = useRef(null);

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.class.toLowerCase().includes(search.toLowerCase()));

    const getStudentHistory = (studentId) => {
        return journals.filter(j => 
            j.studentId === studentId || 
            (j.studentIds && j.studentIds.includes(studentId))
        ).sort((a,b) => b.date.localeCompare(a.date));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if(editingId) onEdit({...formData, id: editingId});
        else onAdd(formData);
        resetForm();
    };

    const resetForm = () => {
        setFormData({ 
            nisn: '', name: '', class: '', gender: 'L', 
            pob: '', dob: '', address: '', phone: '',
            parent: '', parentPhone: '', jobParent: '',
            career: '', riskLevel: 'LOW' 
        });
        setEditingId(null);
        setShowForm(false);
    }

    const handleEditClick = (student) => {
        setEditingId(student.id);
        setFormData({ ...formData, ...student });
        setShowForm(true);
    };

    const handleDownloadTemplate = () => {
        const headers = "NISN,Nama Lengkap,Kelas,L/P,Tempat Lahir,Tanggal Lahir (DD-MM-YYYY),Alamat,No HP Siswa,Nama Wali,No HP Wali,Pekerjaan Wali,Resiko (LOW/MEDIUM/HIGH)";
        const example = "12345678,Budi Santoso,X-1,L,Jakarta,06-08-2008,Jl. Merdeka No 1,08123456789,Bpk. Santoso,08198765432,Wiraswasta,LOW";
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_siswa_sibko.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const rows = text.split('\n').slice(1); 
            const newStudents = [];
            
            rows.forEach(row => {
                const cols = row.split(',');
                if (cols.length >= 2 && cols[1].trim() !== '') { 
                    const rawDob = cols[5]?.trim() || '';
                    const parsedDob = parseImportDate(rawDob);

                    newStudents.push({
                        nisn: cols[0]?.trim() || '',
                        name: cols[1]?.trim() || '',
                        class: cols[2]?.trim() || '',
                        gender: cols[3]?.trim().toUpperCase() === 'P' ? 'P' : 'L',
                        pob: cols[4]?.trim() || '',
                        dob: parsedDob, 
                        address: cols[6]?.trim() || '',
                        phone: cols[7]?.trim() || '',
                        parent: cols[8]?.trim() || '',
                        parentPhone: cols[9]?.trim() || '',
                        jobParent: cols[10]?.trim() || '',
                        riskLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(cols[11]?.trim()) ? cols[11]?.trim() : 'LOW',
                    });
                }
            });

            if (newStudents.length > 0) {
                if(confirm(`Ditemukan ${newStudents.length} data siswa. Yakin ingin import?`)) {
                    onImport(newStudents);
                }
            } else {
                alert("Tidak ada data valid yang ditemukan dalam file CSV.");
            }
        };
        reader.readAsText(file);
        e.target.value = null; 
    };

    return (
        <div className="p-6 space-y-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="text-blue-600"/> Data Siswa Binaan
                </h2>
                <div className="flex flex-wrap gap-2 justify-center md:justify-end w-full md:w-auto">
                    <button onClick={handleDownloadTemplate} className="bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded text-sm font-medium hover:bg-slate-200 flex items-center gap-2 transition-colors">
                        <FileSpreadsheet size={16}/> Template CSV
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportFile} />
                    <button onClick={() => fileInputRef.current.click()} className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 flex items-center gap-2 shadow-sm transition-colors">
                        <Upload size={16}/> Import CSV
                    </button>
                    <button onClick={() => {resetForm(); setShowForm(!showForm)}} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors">
                        <PlusCircle size={18}/> {showForm ? 'Batal' : 'Tambah Siswa'}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-blue-800 mb-4 border-b border-blue-200 pb-2">
                        {editingId ? 'Edit Data Siswa' : 'Input Siswa Baru'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="text-xs font-bold text-slate-500">Nama Lengkap</label><input className="w-full p-2 border rounded" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required/></div>
                            <div><label className="text-xs font-bold text-slate-500">NIS / NISN</label><input className="w-full p-2 border rounded" value={formData.nisn} onChange={e=>setFormData({...formData, nisn: e.target.value})}/></div>
                            <div><label className="text-xs font-bold text-slate-500">Kelas</label><input className="w-full p-2 border rounded" value={formData.class} onChange={e=>setFormData({...formData, class: e.target.value})} required/></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500">L/P</label>
                                <select className="w-full p-2 border rounded bg-white" value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})}>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </div>
                            <div><label className="text-xs font-bold text-slate-500">Tempat Lahir</label><input className="w-full p-2 border rounded" value={formData.pob} onChange={e=>setFormData({...formData, pob: e.target.value})}/></div>
                            <div><label className="text-xs font-bold text-slate-500">Tanggal Lahir</label><input type="date" className="w-full p-2 border rounded" value={formData.dob} onChange={e=>setFormData({...formData, dob: e.target.value})}/></div>
                            <div><label className="text-xs font-bold text-slate-500">No HP Siswa</label><input className="w-full p-2 border rounded" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})}/></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-3"><label className="text-xs font-bold text-slate-500">Alamat Lengkap</label><input className="w-full p-2 border rounded" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})}/></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3 rounded border border-slate-200">
                            <div><label className="text-xs font-bold text-slate-500">Nama Orang Tua/Wali</label><input className="w-full p-2 border rounded" value={formData.parent} onChange={e=>setFormData({...formData, parent: e.target.value})}/></div>
                            <div><label className="text-xs font-bold text-slate-500">Pekerjaan Ortu</label><input className="w-full p-2 border rounded" value={formData.jobParent} onChange={e=>setFormData({...formData, jobParent: e.target.value})}/></div>
                            <div><label className="text-xs font-bold text-slate-500">No HP Ortu</label><input className="w-full p-2 border rounded" value={formData.parentPhone} onChange={e=>setFormData({...formData, parentPhone: e.target.value})}/></div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="w-1/3">
                                <label className="text-xs font-bold text-slate-500">Tingkat Kerawanan</label>
                                <select className={`w-full p-2 border rounded font-bold ${formData.riskLevel === 'HIGH' ? 'text-red-600 bg-red-50' : formData.riskLevel === 'MEDIUM' ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'}`} value={formData.riskLevel} onChange={e=>setFormData({...formData, riskLevel: e.target.value})}>
                                    <option value="LOW">Resiko Rendah (Normal)</option>
                                    <option value="MEDIUM">Resiko Sedang (Perlu Pantauan)</option>
                                    <option value="HIGH">Resiko Tinggi (Perlu Tindakan)</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded">Batal</button>
                                <button type="submit" className="bg-blue-600 text-white font-bold rounded px-6 py-2 shadow hover:bg-blue-700 flex items-center gap-2"><Save size={18}/> Simpan Data</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* TABEL SISWA */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
                    <div className="relative w-full md:w-96">
                        <Search className="text-slate-400 absolute left-3 top-2.5" size={18}/>
                        <input className="outline-none w-full pl-10 p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500" placeholder="Cari nama, kelas, atau NISN..." value={search} onChange={e=>setSearch(e.target.value)}/>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                        Total: {filteredStudents.length} Siswa
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Identitas Siswa</th>
                                <th className="p-4">L/P</th>
                                <th className="p-4">Kontak</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Aksi / Menu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700 text-base">{s.name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5 flex gap-2">
                                            <span className="bg-slate-200 px-1.5 rounded">{s.class}</span>
                                            <span>{s.nisn || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-600">{s.gender}</td>
                                    <td className="p-4">
                                        {s.phone && <div className="flex items-center gap-1 text-xs text-slate-600"><Phone size={12}/> {s.phone}</div>}
                                        {s.parentPhone && <div className="flex items-center gap-1 text-xs text-slate-600 mt-1"><User size={12}/> {s.parentPhone} (Ortu)</div>}
                                        {!s.phone && !s.parentPhone && <span className="text-slate-300 italic">-</span>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white ${RISK_LEVELS[s.riskLevel].badge}`}>
                                            {RISK_LEVELS[s.riskLevel].label}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-1">
                                            <button onClick={() => setViewDetail(s)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors flex items-center gap-1 text-xs font-bold border border-blue-200" title="Lihat Profil">
                                                <Eye size={14}/> Detail/Sisip
                                            </button>
                                            <button onClick={() => handleEditClick(s)} className="text-orange-600 bg-orange-50 hover:bg-orange-100 p-2 rounded transition-colors border border-orange-200" title="Edit Data">
                                                <Edit size={14}/>
                                            </button>
                                            <button onClick={() => onDelete(s.id)} className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors border border-red-200" title="Hapus Data">
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-slate-400 italic">Data siswa tidak ditemukan. Silakan tambah atau import data baru.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAIL MODAL */}
            {viewDetail && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 bg-slate-800 text-white flex justify-between items-center sticky top-0">
                            <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen size={20}/> Buku Pribadi Siswa</h3>
                            <button onClick={() => setViewDetail(null)} className="hover:bg-slate-700 p-1 rounded-full"><X size={20}/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex flex-col md:flex-row gap-6 mb-8">
                                <div className="w-full md:w-1/3 flex flex-col items-center">
                                    <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg overflow-hidden">
                                        <User size={64} className="text-slate-400"/>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 text-center">{viewDetail.name}</h2>
                                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold mt-2">{viewDetail.class}</div>
                                    <div className="mt-4 w-full space-y-2">
                                        <div className={`p-3 rounded text-center text-white text-xs font-bold uppercase ${RISK_LEVELS[viewDetail.riskLevel].badge}`}>
                                            Status: {RISK_LEVELS[viewDetail.riskLevel].label}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-400 uppercase font-bold">NIS / NISN</p>
                                        <p className="font-medium text-slate-700">{viewDetail.nisn || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-400 uppercase font-bold">Jenis Kelamin</p>
                                        <p className="font-medium text-slate-700">{viewDetail.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-400 uppercase font-bold">Tempat, Tanggal Lahir</p>
                                        <p className="font-medium text-slate-700">
                                            {viewDetail.pob || '-'}, {formatIndoDate(viewDetail.dob)}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-400 uppercase font-bold">Alamat</p>
                                        <p className="font-medium text-slate-700">{viewDetail.address || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-400 uppercase font-bold">Kontak Siswa</p>
                                        <p className="font-medium text-slate-700">{viewDetail.phone || '-'}</p>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Users size={14}/> Data Orang Tua / Wali</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-400">Nama</p>
                                                <p className="font-medium">{viewDetail.parent || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Pekerjaan</p>
                                                <p className="font-medium">{viewDetail.jobParent || '-'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-xs text-slate-400">Kontak Ortu</p>
                                                <p className="font-medium text-blue-600">{viewDetail.parentPhone || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={18} className="text-blue-500"/> Riwayat Layanan BK</h3>
                                <div className="space-y-3">
                                    {getStudentHistory(viewDetail.id).map(h => (
                                        <div key={h.id} className="bg-slate-50 border-l-4 border-blue-500 p-3 rounded hover:bg-slate-100 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded">{h.serviceType}</span>
                                                <span className="text-xs text-slate-400">{formatIndoDate(h.date)}</span>
                                            </div>
                                            <p className="text-sm text-slate-700 mt-2 line-clamp-2">{h.description}</p>
                                            <div className="mt-2 text-xs text-slate-500">
                                                <span className="font-bold">Hasil:</span> {h.result || '-'}
                                            </div>
                                        </div>
                                    ))}
                                    {getStudentHistory(viewDetail.id).length === 0 && (
                                        <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded border border-dashed">
                                            Belum ada riwayat layanan tercatat.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t bg-slate-50 flex justify-end">
                            <button onClick={() => setViewDetail(null)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- UPGRADED JOURNAL COMPONENT WITH SEMESTER TAGGING ---
const Journal = ({ students, journals, onAdd, onUpdate, settings }) => {
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [searchStudent, setSearchStudent] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ 
        date: new Date().toISOString().slice(0,10), 
        time: '',
        place: '',
        serviceType: LAYANAN_TYPES[0], 
        skkpd: '',
        technique: '',
        description: '', 
        processEval: '',
        resultEval: '',
        category: MASALAH_KATEGORI[0],
        followUp: 'Selesai' 
    });

    const isClassical = form.serviceType === 'Bimbingan Klasikal';
    const classes = useMemo(() => [...new Set(students.map(s => s.class))].sort(), [students]);

    const handleSelectStudent = (student) => {
        if (!selectedStudents.find(s => s.id === student.id)) {
            setSelectedStudents([...selectedStudents, student]);
        }
        setSearchStudent('');
    };

    const handleRemoveStudent = (id) => {
        setSelectedStudents(selectedStudents.filter(s => s.id !== id));
    };

    const handleClassSelect = (className) => {
        const classStudents = students.filter(s => s.class === className);
        setSelectedStudents(classStudents);
    };

    const handleEditClick = (journal) => {
        setEditingId(journal.id);
        setForm({
            date: journal.date,
            time: journal.time || '',
            place: journal.place || '',
            serviceType: journal.serviceType,
            category: journal.category || MASALAH_KATEGORI[0],
            skkpd: journal.skkpd || '',
            technique: journal.technique || '',
            description: journal.description || '',
            processEval: journal.processEval || '',
            resultEval: journal.resultEval || journal.result || '',
            followUp: journal.followUp || 'Selesai'
        });
        
        // Reconstruct selected students
        if (journal.studentIds && journal.studentIds.length > 0) {
            const foundStudents = students.filter(s => journal.studentIds.includes(s.id));
            setSelectedStudents(foundStudents);
        } else if (journal.studentId) { // Backward comp
            const found = students.find(s => s.id === journal.studentId);
            if(found) setSelectedStudents([found]);
        } else {
            setSelectedStudents([]);
        }
    };

    const resetForm = () => {
        setForm({ 
            date: new Date().toISOString().slice(0,10), description: '', 
            processEval: '', resultEval: '', time: '', place: '', technique: '', 
            category: MASALAH_KATEGORI[0],
            serviceType: LAYANAN_TYPES[0], skkpd: '', followUp: 'Selesai'
        });
        setSelectedStudents([]);
        setEditingId(null);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if(selectedStudents.length === 0) return alert("Pilih minimal satu siswa atau kelas!");

        const payload = { 
            ...form, 
            studentIds: selectedStudents.map(s => s.id),
            studentNames: selectedStudents.map(s => s.name),
            studentName: selectedStudents.length === 1 ? selectedStudents[0].name : `${selectedStudents.length} Siswa`,
            result: form.resultEval,
            // AUTO TAGGING SEMESTER
            academicYear: settings?.academicYear || '2024/2025',
            semester: settings?.semester || 'Ganjil'
        };
        
        if (editingId) {
            onUpdate({ id: editingId, ...payload });
        } else {
            onAdd(payload);
        }
        
        resetForm();
    };

    const studentSuggestions = students.filter(s => 
        s.name.toLowerCase().includes(searchStudent.toLowerCase()) && 
        !selectedStudents.find(sel => sel.id === s.id)
    );

    return (
        <div className="p-6 space-y-6 h-full overflow-y-auto">
            {/* TOP: FORM INPUT - Full Width */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className={`p-4 text-white flex justify-between items-center rounded-t-xl ${editingId ? 'bg-orange-500' : 'bg-blue-600'}`}>
                    <h3 className="font-bold flex items-center gap-2"><BookOpen size={20}/> {editingId ? 'Edit Jurnal Layanan' : 'Input Jurnal Layanan'}</h3>
                    <div className="text-xs bg-white/20 px-3 py-1 rounded">
                        {settings?.semester ? `${settings.semester} ${settings.academicYear}` : 'Semester Default'}
                    </div>
                    {editingId && (
                        <button onClick={resetForm} className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded ml-2">Batal Edit</button>
                    )}
                </div>
                
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tanggal</label>
                                        <input type="date" className="w-full p-2 border rounded text-sm" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} required/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Waktu (Jam Ke-)</label>
                                        <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Contoh: 3-4" value={form.time} onChange={e=>setForm({...form, time:e.target.value})} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Jenis Layanan</label>
                                        <select className="w-full p-2 border rounded text-sm font-bold text-blue-700 bg-blue-50" value={form.serviceType} onChange={e=> { setForm({...form, serviceType:e.target.value}); setSelectedStudents([]); }}>
                                            {LAYANAN_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tempat Layanan</label>
                                        <input className="w-full p-2 border rounded text-sm" placeholder="Contoh: Ruang BK" value={form.place} onChange={e=>setForm({...form, place:e.target.value})} />
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Sasaran Siswa / Konseli</label>
                                    
                                    {isClassical ? (
                                        <select className="w-full p-2 border rounded text-sm bg-white mb-2" onChange={(e) => handleClassSelect(e.target.value)}>
                                            <option value="">-- Pilih Kelas --</option>
                                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    ) : (
                                        <div className="relative mb-2">
                                            <Search className="absolute left-2 top-2.5 text-slate-400" size={16}/>
                                            <input 
                                                className="w-full pl-8 p-2 border rounded text-sm" 
                                                placeholder="Ketik nama siswa..." 
                                                value={searchStudent}
                                                onChange={e=>setSearchStudent(e.target.value)}
                                            />
                                            {searchStudent && (
                                                <div className="absolute z-10 w-full bg-white border shadow-lg max-h-40 overflow-y-auto mt-1 rounded">
                                                    {studentSuggestions.map(s => (
                                                        <div key={s.id} onClick={() => handleSelectStudent(s)} className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b">
                                                            {s.name} <span className="text-xs text-slate-400">({s.class})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                        {selectedStudents.map(s => (
                                            <span key={s.id} className="bg-white border px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-sm">
                                                {s.name} <button type="button" onClick={() => handleRemoveStudent(s.id)}><X size={12} className="text-red-500"/></button>
                                            </span>
                                        ))}
                                        {selectedStudents.length === 0 && <span className="text-xs text-slate-400 italic">Belum ada siswa dipilih.</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Topik / Masalah</label>
                                    <textarea className="w-full p-2 border rounded text-sm focus:ring-2 ring-blue-200" rows="3" placeholder="Deskripsi masalah atau topik bahasan..." value={form.description} onChange={e=>setForm({...form, description:e.target.value})} required></textarea>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Kategori Masalah</label>
                                        <select className="w-full p-2 border rounded text-sm bg-white" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
                                            {MASALAH_KATEGORI.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bidang Pengembangan</label>
                                        <select className="w-full p-2 border rounded text-sm" value={form.skkpd} onChange={e=>setForm({...form, skkpd:e.target.value})}>
                                            <option value="">-- Pilih Standar --</option>
                                            {SKKPD_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Teknik Konseling</label>
                                    <select className="w-full p-2 border rounded text-sm" value={form.technique} onChange={e=>setForm({...form, technique:e.target.value})}>
                                        <option value="">-- Pilih Teknik --</option>
                                        {TEKNIK_KONSELING.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                {/* EVALUASI SECTION - UPDATED TO TEXTAREA & STACKED */}
                                <div className="space-y-4 bg-slate-50 p-4 rounded border border-slate-200">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Evaluasi Proses</label>
                                        <textarea 
                                            className="w-full p-2 border rounded text-sm focus:ring-2 ring-blue-200" 
                                            rows="3" 
                                            placeholder="Analisis proses layanan (keaktifan, antusiasme, hambatan)..." 
                                            value={form.processEval} 
                                            onChange={e=>setForm({...form, processEval:e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Evaluasi Hasil</label>
                                        <textarea 
                                            className="w-full p-2 border rounded text-sm focus:ring-2 ring-blue-200" 
                                            rows="3" 
                                            placeholder="Analisis hasil layanan (pemahaman, perasaan, rencana tindakan)..." 
                                            value={form.resultEval} 
                                            onChange={e=>setForm({...form, resultEval:e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Rencana Tindak Lanjut</label>
                                        <select className="w-full p-2 border rounded text-sm font-bold text-green-700" value={form.followUp} onChange={e=>setForm({...form, followUp:e.target.value})}>
                                            <option value="Selesai">Masalah Selesai</option>
                                            <option value="Pantau">Perlu Pantauan Berkala</option>
                                            <option value="Konseling Lanjutan">Jadwalkan Konseling Lanjutan</option>
                                            <option value="Konferensi Kasus">Konferensi Kasus</option>
                                            <option value="Alih Tangan Kasus">Alih Tangan Kasus (Referal)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button className={`w-full md:w-auto px-8 py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-lg text-white transition-transform active:scale-95 ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {editingId ? <><RefreshCcw size={18}/> UPDATE JURNAL</> : <><Save size={18}/> SIMPAN JURNAL</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* BOTTOM: HISTORY LIST - Full Width Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center rounded-t-xl">
                    <h3 className="font-bold text-slate-700">Riwayat Aktivitas Terbaru</h3>
                    <div className="text-xs text-slate-500 italic">Urut berdasarkan tanggal terbaru</div>
                </div>
                <div className="p-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {journals.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(j => (
                            <div key={j.id} className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow relative group ${editingId === j.id ? 'border-orange-500 ring-1 ring-orange-200 bg-orange-50' : 'border-slate-200'}`}>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditClick(j)} className="text-slate-400 hover:text-blue-600 bg-white p-1 rounded-full shadow-sm border border-slate-200" title="Edit Jurnal Ini"><Edit size={16}/></button>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${j.serviceType?.includes('Kelompok') || j.serviceType?.includes('Klasikal') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {j.serviceType}
                                    </span>
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar size={12}/> {formatIndoDate(j.date)}
                                    </span>
                                    {/* Show Semester Tag */}
                                    {j.semester && (
                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">
                                            {j.semester} {j.academicYear}
                                        </span>
                                    )}
                                </div>

                                <h4 className="font-bold text-slate-800 mb-1 line-clamp-1">{j.studentNames?.join(', ') || j.studentName}</h4>
                                <p className="text-sm text-slate-600 mb-3 bg-slate-50 p-2 rounded border border-slate-100 italic line-clamp-2">
                                    "{j.description}"
                                </p>

                                <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 border-t pt-2 mt-auto">
                                    <div>
                                        <span className="font-bold block text-slate-400">Teknik:</span>
                                        {j.technique || '-'}
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold block text-slate-400">Tindak Lanjut:</span>
                                        <span className={`font-bold ${j.followUp === 'Selesai' ? 'text-green-600' : 'text-orange-600'}`}>{j.followUp}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {journals.length === 0 && (
                        <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl m-4">
                            <ClipboardList size={48} className="mx-auto mb-2 opacity-20"/>
                            <p>Belum ada data jurnal layanan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 5. REPORTS MODULE (WITH SEMESTER FILTER)
const Reports = ({ journals, students, settings }) => {
  const [reportType, setReportType] = useState('journal'); 
  const [activeTab, setActiveTab] = useState('journal');

  return (
    <div className="space-y-6 pb-10">
      <style>{`
        @media print {
          @page { size: auto; margin: 10mm; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          .print-hidden { display: none !important; }
          .signature-section { page-break-inside: avoid; }
          table, tr, td, th { page-break-inside: avoid; border-color: black !important; }
        }
      `}</style>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1 print:hidden px-6 pt-6">
        {[
            { id: 'journal', label: 'Jurnal Bulanan' },
            { id: 'individual', label: 'Rekam Jejak Siswa' },
            { id: 'riskMap', label: 'Peta Kerawanan' },
            { id: 'serviceProof', label: 'Bukti Layanan (LPL)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600 shadow-sm' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 min-h-[400px]">
        {activeTab === 'journal' && <JournalReportView journals={journals} students={students} settings={settings} />}
        {activeTab === 'individual' && <IndividualReportView journals={journals} students={students} settings={settings} />}
        {activeTab === 'riskMap' && <RiskMapReportView students={students} settings={settings} />}
        {activeTab === 'serviceProof' && <ServiceProofView journals={journals} students={students} settings={settings} />}
      </div>
    </div>
  );
};

function JournalReportView({ journals, students, settings }) {
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [orientation, setOrientation] = useState('landscape');
  // Semester Filter
  const [semesterFilter, setSemesterFilter] = useState(settings?.semester || 'Ganjil');
  const [yearFilter, setYearFilter] = useState(settings?.academicYear || '2024/2025');
  
  // Filter logic: Match Month AND (Semester OR Fallback to Date Logic if Tag Missing)
  const monthlyJournals = journals.filter(j => {
      const matchMonth = j.date.startsWith(reportMonth);
      if (!matchMonth) return false;
      
      // If journal has semester tag, check it. If not, ignore (assume old data is valid for selected month)
      if (j.semester && j.semester !== semesterFilter) return false;
      if (j.academicYear && j.academicYear !== yearFilter) return false;

      return true;
  }).sort((a,b) => a.date.localeCompare(b.date));

  return (
    <div className="animate-in fade-in">
      <style>{`
        @media print {
          @page { size: ${orientation} auto; margin: 10mm; }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-4 print:hidden bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Pilih Bulan</label>
                <input type="month" className="border p-2 rounded w-full sm:w-48 bg-white text-sm" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
            </div>
            {/* Semester Filters */}
            <div className="w-full sm:w-auto">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tahun Ajaran</label>
                <input className="border p-2 rounded w-full sm:w-32 bg-white text-sm" value={yearFilter} onChange={e => setYearFilter(e.target.value)} placeholder="2024/2025"/>
            </div>
            <div className="w-full sm:w-auto">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Semester</label>
                <select className="border p-2 rounded w-full sm:w-32 bg-white text-sm" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)}>
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                </select>
            </div>
            
            <div className="w-full sm:w-auto">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Orientasi</label>
                <select className="border p-2 rounded w-full sm:w-32 bg-white text-sm" value={orientation} onChange={e => setOrientation(e.target.value)}>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                </select>
            </div>
        </div>
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 w-full sm:w-auto shadow-md font-bold transition-transform active:scale-95">
          <Printer size={18}/> CETAK LAPORAN
        </button>
      </div>

      <div className={`print-area bg-white p-10 md:p-12 shadow-lg border border-slate-200 mx-auto transition-all duration-300 ${
          orientation === 'landscape' ? 'max-w-[297mm] min-h-[210mm]' : 'max-w-[210mm] min-h-[297mm]'
      } print:w-full print:max-w-none print:min-h-0`}>
           
           <KopSurat settings={settings} />

           <div className="text-center mb-6">
              <h3 className="text-xl font-bold underline uppercase">JURNAL KEGIATAN BIMBINGAN DAN KONSELING</h3>
              <p className="mt-1">Bulan: <span className="font-bold">{new Date(reportMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span> | Semester: {semesterFilter} {yearFilter}</p>
           </div>

           <table className="w-full border-collapse border border-black text-xs md:text-sm">
             <thead>
               <tr className="bg-gray-100 text-center">
                 <th className="border border-black p-2 w-8">No</th>
                 <th className="border border-black p-2 w-24">Hari/Tanggal</th>
                 <th className="border border-black p-2">Sasaran (Siswa/Kelas)</th>
                 <th className="border border-black p-2 w-32">Jenis Layanan</th>
                 <th className="border border-black p-2">Uraian Kegiatan / Masalah</th>
                 <th className="border border-black p-2">Hasil / Tindak Lanjut</th>
               </tr>
             </thead>
             <tbody>
               {monthlyJournals.map((j, idx) => {
                 const studentNames = j.studentNames ? j.studentNames.join(', ') : (j.studentName || 'Siswa Dihapus');
                 return (
                   <tr key={idx}>
                     <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                     <td className="border border-black p-2 align-top">{formatIndoDate(j.date)}</td>
                     <td className="border border-black p-2 align-top">{studentNames}</td>
                     <td className="border border-black p-2 align-top">{j.serviceType}</td>
                     <td className="border border-black p-2 align-top text-justify">
                        {j.description}
                        {j.technique && <div className="mt-1 italic text-slate-600">Teknik: {j.technique}</div>}
                     </td>
                     <td className="border border-black p-2 align-top">
                        <div>{j.resultEval || j.result || '-'}</div>
                        <div className="font-bold mt-1">({j.followUp})</div>
                     </td>
                   </tr>
                 )
               })}
               {monthlyJournals.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic border border-black">Belum ada data jurnal pada bulan dan semester ini.</td></tr>}
             </tbody>
           </table>
           <SignatureSection settings={settings} dateLabel={`${settings.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
      </div>
    </div>
  );
}

function IndividualReportView({ journals, students, settings }) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [orientation, setOrientation] = useState('portrait'); 

  const studentHistory = useMemo(() => {
    if (!selectedStudentId) return [];
    return journals.filter(j => 
      (j.studentIds && j.studentIds.includes(selectedStudentId)) || 
      (j.studentId && j.studentId === selectedStudentId)
    ).sort((a,b) => a.date.localeCompare(b.date));
  }, [selectedStudentId, journals]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="animate-in fade-in">
      <style>{`
        @media print {
          @page { size: ${orientation} auto; margin: 10mm; }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-4 print:hidden bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="w-full sm:w-auto flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Cari Nama Siswa</label>
                <select className="border p-2 rounded w-full bg-white text-sm" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                    <option value="">-- Pilih Siswa --</option>
                    {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                    ))}
                </select>
            </div>
            <div className="w-full sm:w-auto">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Orientasi Kertas</label>
                <select className="border p-2 rounded w-full sm:w-40 bg-white text-sm" value={orientation} onChange={e => setOrientation(e.target.value)}>
                    <option value="portrait">Portrait (Tegak)</option>
                    <option value="landscape">Landscape (Mendatar)</option>
                </select>
            </div>
        </div>
        <button disabled={!selectedStudentId} onClick={() => window.print()} className="bg-blue-600 disabled:bg-slate-300 text-white px-6 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 w-full sm:w-auto shadow-md font-bold transition-transform active:scale-95">
          <Printer size={18}/> CETAK REKAM JEJAK
        </button>
      </div>

      {selectedStudent ? (
        <div className={`print-area bg-white p-10 md:p-12 shadow-lg border border-slate-200 mx-auto transition-all duration-300 ${
            orientation === 'landscape' ? 'max-w-[297mm] min-h-[210mm]' : 'max-w-[210mm] min-h-[297mm]'
        } print:w-full print:max-w-none print:min-h-0`}>
           
           <KopSurat settings={settings} />

           <div className="text-center mb-6">
              <h3 className="text-xl font-bold underline uppercase">Laporan Perkembangan Peserta Didik</h3>
              <p className="text-sm font-bold mt-1">REKAM JEJAK LAYANAN BK</p>
           </div>
           
           <table className="w-full mb-4 text-sm font-bold">
             <tbody>
               <tr><td className="w-32">Nama Siswa</td><td>: {selectedStudent.name}</td></tr>
               <tr><td>Kelas</td><td>: {selectedStudent.class}</td></tr>
               <tr><td>NISN</td><td>: {selectedStudent.nisn}</td></tr>
             </tbody>
           </table>

           <table className="w-full border-collapse border border-black text-xs md:text-sm">
             <thead>
               <tr className="bg-gray-100 text-center">
                 <th className="border border-black p-2 w-8">No</th>
                 <th className="border border-black p-2 w-24">Tanggal</th>
                 <th className="border border-black p-2">Jenis Layanan</th>
                 <th className="border border-black p-2">Topik / Masalah</th>
                 <th className="border border-black p-2">Tindak Lanjut / Hasil</th>
               </tr>
             </thead>
             <tbody>
               {studentHistory.map((j, idx) => (
                   <tr key={idx}>
                     <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                     <td className="border border-black p-2 align-top">{formatIndoDate(j.date)}</td>
                     <td className="border border-black p-2 align-top">{j.serviceType}</td>
                     <td className="border border-black p-2 align-top text-justify">{j.description}</td>
                     <td className="border border-black p-2 align-top">
                        {j.resultEval || j.result || '-'}
                        <div className="font-bold text-[10px] mt-1">({j.followUp})</div>
                     </td>
                   </tr>
               ))}
               {studentHistory.length === 0 && <tr><td colSpan="5" className="text-center p-4 border border-black italic">Belum ada riwayat layanan untuk siswa ini.</td></tr>}
             </tbody>
           </table>
           <SignatureSection settings={settings} dateLabel={`${settings.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
        </div>
      ) : (
        <div className="text-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-400 print:hidden">
           <Users size={48} className="mx-auto mb-2 opacity-50"/>
           <p>Silakan pilih siswa terlebih dahulu untuk melihat rekam jejak.</p>
        </div>
      )}
    </div>
  );
}

// 5c. RISK MAP REPORT VIEW (NEW)
function RiskMapReportView({ students, settings }) {
  const [orientation, setOrientation] = useState('portrait');
  
  // Sort by Risk Level: HIGH > MEDIUM > LOW
  const riskOrder = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
  const sortedStudents = [...students].sort((a,b) => {
      const riskA = riskOrder[a.riskLevel] || 4;
      const riskB = riskOrder[b.riskLevel] || 4;
      if (riskA !== riskB) return riskA - riskB;
      return a.name.localeCompare(b.name);
  });

  return (
    <div className="animate-in fade-in">
      <style>{`
        @media print {
          @page { size: ${orientation} auto; margin: 10mm; }
        }
      `}</style>
      <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-4 print:hidden bg-slate-50 p-4 rounded-lg border border-slate-200">
         <div className="w-full sm:w-auto">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Orientasi Kertas</label>
            <select className="border p-2 rounded w-full sm:w-40 bg-white text-sm" value={orientation} onChange={e => setOrientation(e.target.value)}>
                <option value="portrait">Portrait (Tegak)</option>
                <option value="landscape">Landscape (Mendatar)</option>
            </select>
        </div>
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 w-full sm:w-auto shadow-md font-bold transition-transform active:scale-95">
          <Printer size={18}/> CETAK PETA KERAWANAN
        </button>
      </div>

      <div className={`print-area bg-white p-10 md:p-12 shadow-lg border border-slate-200 mx-auto transition-all duration-300 ${
          orientation === 'landscape' ? 'max-w-[297mm] min-h-[210mm]' : 'max-w-[210mm] min-h-[297mm]'
      } print:w-full print:max-w-none print:min-h-0`}>
           
           <KopSurat settings={settings} />

           <div className="text-center mb-6">
              <h3 className="text-xl font-bold underline uppercase">PETA KERAWANAN SISWA</h3>
              <p className="mt-1">Tahun Pelajaran: {settings?.academicYear || new Date().getFullYear() + '/' + (new Date().getFullYear()+1)}</p>
           </div>
           
           <table className="w-full border-collapse border border-black text-xs md:text-sm">
             <thead>
               <tr className="bg-gray-100 text-center">
                 <th className="border border-black p-2 w-8">No</th>
                 <th className="border border-black p-2">Nama Siswa</th>
                 <th className="border border-black p-2 w-20">Kelas</th>
                 <th className="border border-black p-2 w-32">Tingkat Kerawanan</th>
                 <th className="border border-black p-2">Keterangan / Wali</th>
               </tr>
             </thead>
             <tbody>
               {sortedStudents.map((s, idx) => (
                   <tr key={s.id}>
                     <td className="border border-black p-2 text-center">{idx + 1}</td>
                     <td className="border border-black p-2 font-bold">{s.name}</td>
                     <td className="border border-black p-2 text-center">{s.class}</td>
                     <td className="border border-black p-2 text-center font-bold">
                        {s.riskLevel === 'HIGH' ? 'TINGGI' : s.riskLevel === 'MEDIUM' ? 'SEDANG' : 'RENDAH'}
                     </td>
                     <td className="border border-black p-2">
                        {s.parent} {s.parentPhone ? `(${s.parentPhone})` : ''}
                     </td>
                   </tr>
               ))}
               {sortedStudents.length === 0 && <tr><td colSpan="5" className="text-center p-4 border border-black italic">Belum ada data siswa.</td></tr>}
             </tbody>
           </table>
           <SignatureSection settings={settings} dateLabel={`${settings.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
      </div>
    </div>
  );
}

// 5d. SERVICE PROOF VIEW (NEW - LPL)
function ServiceProofView({ journals, students, settings }) {
  const [selectedJournalId, setSelectedJournalId] = useState('');
  const [orientation, setOrientation] = useState('portrait'); 

  // Filter journals for dropdown (Sort by newest)
  const sortedJournals = [...journals].sort((a,b) => b.date.localeCompare(a.date));
  const selectedJournal = journals.find(j => j.id === selectedJournalId);

  return (
    <div className="animate-in fade-in">
      <style>{`
        @media print {
          @page { size: ${orientation} auto; margin: 10mm; }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-4 print:hidden bg-slate-50 p-4 rounded-lg border border-slate-200">
         <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Pilih Kegiatan Layanan</label>
            <select className="border p-2 rounded w-full bg-white text-sm" value={selectedJournalId} onChange={e => setSelectedJournalId(e.target.value)}>
                <option value="">-- Pilih Kegiatan --</option>
                {sortedJournals.map(j => (
                  <option key={j.id} value={j.id}>
                      {j.date} - {j.serviceType} - {j.studentName || 'Banyak Siswa'}
                  </option>
                ))}
            </select>
        </div>
        <button disabled={!selectedJournal} onClick={() => window.print()} className="bg-blue-600 disabled:bg-slate-300 text-white px-6 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 w-full sm:w-auto shadow-md font-bold transition-transform active:scale-95">
          <Printer size={18}/> CETAK BUKTI FISIK
        </button>
      </div>

      {selectedJournal ? (
        <div className={`print-area bg-white p-10 md:p-12 shadow-lg border border-slate-200 mx-auto transition-all duration-300 ${
            orientation === 'landscape' ? 'max-w-[297mm] min-h-[210mm]' : 'max-w-[210mm] min-h-[297mm]'
        } print:w-full print:max-w-none print:min-h-0`}>
           
           <KopSurat settings={settings} />

           <div className="text-center mb-8">
              <h3 className="text-xl font-bold underline uppercase">LAPORAN PELAKSANAAN LAYANAN (LPL)</h3>
              <p className="font-bold">BIMBINGAN DAN KONSELING</p>
              <p className="mt-1 font-bold">Semester: {selectedJournal.semester || '-'} Tahun Ajaran: {selectedJournal.academicYear || '-'}</p>
           </div>
           
           <div className="space-y-4 text-sm leading-relaxed">
             <div className="grid grid-cols-[200px_10px_1fr] gap-1">
                <div className="font-bold">1. Jenis Layanan</div><div>:</div><div>{selectedJournal.serviceType}</div>
                <div className="font-bold">2. Bidang Bimbingan</div><div>:</div><div>{selectedJournal.skkpd || '-'}</div>
                <div className="font-bold">3. Topik / Masalah</div><div>:</div><div>{selectedJournal.description}</div>
                <div className="font-bold">4. Sasaran / Konseli</div><div>:</div><div>{selectedJournal.studentNames?.join(', ') || selectedJournal.studentName}</div>
                <div className="font-bold">5. Hari / Tanggal</div><div>:</div><div>{formatIndoDate(selectedJournal.date)}</div>
                <div className="font-bold">6. Waktu / Tempat</div><div>:</div><div>{selectedJournal.time || '-'} / {selectedJournal.place || '-'}</div>
                <div className="font-bold">7. Teknik Konseling</div><div>:</div><div>{selectedJournal.technique || '-'}</div>
             </div>

             <div className="mt-6">
                <div className="font-bold mb-2">8. Hasil / Evaluasi:</div>
                <div className="border border-black p-4 min-h-[100px] text-justify">
                    <p className="mb-2"><span className="font-bold">Proses:</span> {selectedJournal.processEval || '-'}</p>
                    <p><span className="font-bold">Hasil:</span> {selectedJournal.resultEval || selectedJournal.result || '-'}</p>
                </div>
             </div>

             <div className="mt-4">
                <div className="font-bold mb-2">9. Tindak Lanjut:</div>
                <div className="border border-black p-4">
                    {selectedJournal.followUp}
                </div>
             </div>
           </div>

           <SignatureSection settings={settings} dateLabel={`${settings.city || '...'}, ${formatIndoDate(selectedJournal.date)}`} />
        </div>
      ) : (
        <div className="text-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-400 print:hidden">
           <FileCheck size={48} className="mx-auto mb-2 opacity-50"/>
           <p>Pilih salah satu kegiatan layanan untuk mencetak bukti fisik.</p>
        </div>
      )}
    </div>
  );
}

// Helper: Kop Surat
const KopSurat = ({ settings }) => (
    <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-6">
        <div className="w-24 h-24 flex items-center justify-center">
            {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : null}
        </div>
        <div className="flex-1 text-center px-4">
            {settings.government && <h3 className="text-lg font-medium uppercase tracking-wide leading-tight">{settings.government}</h3>}
            {settings.department && <h3 className="text-lg font-bold uppercase tracking-wide leading-tight">{settings.department}</h3>}
            <h2 className="text-2xl font-extrabold uppercase my-1">{settings.name}</h2>
            <p className="text-sm italic">{settings.address}</p>
        </div>
        <div className="w-24 h-24 flex items-center justify-center">
            {settings.logo2 ? <img src={settings.logo2} className="w-full h-full object-contain" /> : null}
        </div> 
    </div>
);

// Helper: Signature
const SignatureSection = ({ settings, dateLabel }) => (
    <div className="grid grid-cols-2 gap-10 mt-12 text-center break-inside-avoid signature-section text-sm font-serif">
      <div>
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <br/><br/><br/><br/>
          <p className="font-bold underline">{settings?.headmaster || '......................'}</p>
          <p>NIP. {settings?.nipHeadmaster || '......................'}</p>
      </div>
      <div>
          <p>{dateLabel}</p>
          <p>Guru BK / Konselor</p>
          <br/><br/><br/><br/>
          <p className="font-bold underline">{settings?.counselor || '......................'}</p>
          <p>NIP. {settings?.nipCounselor || '......................'}</p>
      </div>
   </div>
);

// 5. SCHOOL SETTINGS (PER USER - WITH ACADEMIC YEAR)
const SchoolSettings = ({ settings, onSave }) => {
    const [form, setForm] = useState({ ...settings });
    
    useEffect(() => {
        if(settings) setForm(settings);
    }, [settings]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleFile = (e, key) => {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = () => setForm({...form, [key]: reader.result});
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="text-blue-600"/> Pengaturan Kop & Identitas</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* NEW: ACADEMIC YEAR & SEMESTER */}
                    <div className="col-span-1 md:col-span-2 bg-yellow-50 p-4 rounded border border-yellow-200 flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-yellow-800 uppercase mb-1">Tahun Ajaran Aktif</label>
                            <input className="w-full p-2 border border-yellow-300 rounded" name="academicYear" value={form.academicYear || ''} onChange={handleChange} placeholder="Contoh: 2024/2025" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-yellow-800 uppercase mb-1">Semester Aktif</label>
                            <select className="w-full p-2 border border-yellow-300 rounded bg-white" name="semester" value={form.semester || 'Ganjil'} onChange={handleChange}>
                                <option value="Ganjil">Semester Ganjil</option>
                                <option value="Genap">Semester Genap</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase text-slate-400 border-b pb-2">Identitas Instansi</h3>
                        <input className="w-full p-2 border rounded" name="government" value={form.government || ''} onChange={handleChange} placeholder="Pemerintah Provinsi..." />
                        <input className="w-full p-2 border rounded" name="department" value={form.department || ''} onChange={handleChange} placeholder="Dinas Pendidikan..." />
                        <input className="w-full p-2 border rounded font-bold" name="name" value={form.name || ''} onChange={handleChange} placeholder="Nama Sekolah..." />
                        <textarea className="w-full p-2 border rounded" name="address" value={form.address || ''} onChange={handleChange} placeholder="Alamat..." />
                        <input className="w-full p-2 border rounded" name="city" value={form.city || ''} onChange={handleChange} placeholder="Kota/Kab..." />
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase text-slate-400 border-b pb-2">Logo Kop Surat</h3>
                        <div className="flex gap-4">
                            <div className="flex-1 text-center border p-4 rounded bg-slate-50">
                                <label className="block text-xs font-bold mb-2">Logo Kiri</label>
                                <div className="h-20 w-full flex items-center justify-center mb-2">
                                    {form.logo ? <img src={form.logo} className="h-full object-contain"/> : <ImageIcon className="text-slate-300"/>}
                                </div>
                                <input type="file" className="text-xs w-full" onChange={(e) => handleFile(e, 'logo')} />
                            </div>
                            <div className="flex-1 text-center border p-4 rounded bg-slate-50">
                                <label className="block text-xs font-bold mb-2">Logo Kanan</label>
                                <div className="h-20 w-full flex items-center justify-center mb-2">
                                    {form.logo2 ? <img src={form.logo2} className="h-full object-contain"/> : <span className="text-xs text-slate-400">Opsional</span>}
                                </div>
                                <input type="file" className="text-xs w-full" onChange={(e) => handleFile(e, 'logo2')} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-3">
                        <h3 className="font-bold text-sm uppercase text-slate-400 border-b pb-2">Kepala Sekolah</h3>
                        <input className="w-full p-2 border rounded" name="headmaster" value={form.headmaster || ''} onChange={handleChange} placeholder="Nama Kepala Sekolah" />
                        <input className="w-full p-2 border rounded" name="nipHeadmaster" value={form.nipHeadmaster || ''} onChange={handleChange} placeholder="NIP Kepala Sekolah" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-bold text-sm uppercase text-slate-400 border-b pb-2">Guru BK / Konselor</h3>
                        <input className="w-full p-2 border rounded" name="counselor" value={form.counselor || ''} onChange={handleChange} placeholder="Nama Guru BK" />
                        <input className="w-full p-2 border rounded" name="nipCounselor" value={form.nipCounselor || ''} onChange={handleChange} placeholder="NIP Guru BK" />
                    </div>
                </div>

                <button onClick={() => onSave(form)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                    <Save size={18}/> Simpan Pengaturan
                </button>
            </div>
        </div>
    );
};

// 6. MAIN LAYOUT & ROUTING
const AppLayout = ({ children, activeTab, setActiveTab, userRole, userName, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = userRole === 'admin' 
        ? [
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'users', label: 'Manajemen User', icon: Users },
            { id: 'account', label: 'Profil Admin', icon: UserCog } // Added Admin Profile
          ]
        : [
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'students', label: 'Data Siswa', icon: Users },
            { id: 'journal', label: 'Jurnal Harian', icon: BookOpen },
            { id: 'reports', label: 'Laporan & Cetak', icon: Printer },
            { id: 'settings', label: 'Pengaturan Sekolah', icon: Settings },
            { id: 'account', label: 'Edit Akun', icon: UserCog }
          ];

    return (
        <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden print:bg-white print:h-auto">
            {/* Sidebar */}
            <aside className={`bg-slate-900 text-white flex flex-col transition-all duration-300 print:hidden ${sidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="p-4 border-b border-slate-700 flex items-center gap-3 h-16">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold flex-shrink-0">S</div>
                    {sidebarOpen && <div>
                        <h1 className="font-bold tracking-wider">SIBKO</h1>
                        <p className="text-[10px] text-slate-400 uppercase">{userRole === 'admin' ? 'Super Admin' : 'Guru BK'}</p>
                    </div>}
                </div>

                <nav className="flex-1 py-4 px-2 space-y-1">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            title={!sidebarOpen ? item.label : ''}
                        >
                            <item.icon size={20} className="flex-shrink-0"/>
                            {sidebarOpen && <span className="ml-3 font-medium text-sm">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={onLogout} className={`w-full flex items-center ${sidebarOpen ? 'justify-start' : 'justify-center'} text-red-400 hover:text-red-300 hover:bg-slate-800 p-2 rounded transition-all`}>
                        <LogOut size={20} />
                        {sidebarOpen && <span className="ml-3 text-sm font-medium">Keluar</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 flex-shrink-0 print:hidden">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded text-slate-500">
                        <List size={24}/>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-slate-700">{userName}</p>
                            <p className="text-xs text-slate-500 capitalize">{userRole}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                            {userName.charAt(0)}
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-0 md:p-0 print:overflow-visible">
                    {children}
                </div>
            </main>
        </div>
    );
};

// --- MAIN APPLICATION ---
export default function App() {
    const [authUser, setAuthUser] = useState(null); // Firebase Auth
    const [appUser, setAppUser] = useState(null);   // Logical User (Admin/Guru)
    const [loading, setLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');

    // Data States
    const [allUsers, setAllUsers] = useState([]);
    const [students, setStudents] = useState([]);
    const [journals, setJournals] = useState([]);
    const [mySettings, setMySettings] = useState({});

    // 1. Init Firebase Auth
    useEffect(() => {
        const initAuth = async () => {
            try {
               await signInAnonymously(auth);
            } catch (error) {
               console.error("Auth Error:", error);
            }
        };
        initAuth();

        const unsub = onAuthStateChanged(auth, u => setAuthUser(u));
        return () => unsub();
    }, []);

    // 2. Fetch Users (Wait for auth)
    useEffect(() => {
        if (!authUser) return;
        const q = query(getCollectionRef(COLLECTION_PATHS.users));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setAllUsers(data);
            
            // Seed Admin if Empty
            if(data.length === 0) {
                addDoc(getCollectionRef(COLLECTION_PATHS.users), INITIAL_ADMIN);
            }
            setLoading(false);
        }, (error) => {
            console.error("User Listener Error:", error);
        });
        return () => unsub();
    }, [authUser]);

    // 3. Fetch Data (Only if logged in)
    useEffect(() => {
        if (!appUser || !authUser) return;

        // Fetch Students
        const unsubStudents = onSnapshot(getCollectionRef(COLLECTION_PATHS.students), snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            // Filter: Admin sees all (count only), Guru sees OWN
            if(appUser.role === 'guru') {
                data = data.filter(d => d.teacherId === appUser.id);
            }
            setStudents(data);
        }, (err) => console.error("Students Listener Error", err));

        // Fetch Journals
        const unsubJournals = onSnapshot(getCollectionRef(COLLECTION_PATHS.journals), snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            if(appUser.role === 'guru') {
                data = data.filter(d => d.teacherId === appUser.id);
            }
            setJournals(data);
        }, (err) => console.error("Journals Listener Error", err));

        // Fetch Settings (Specific to this user)
        const unsubSettings = onSnapshot(getCollectionRef(COLLECTION_PATHS.settings), snap => {
            const allSettings = snap.docs.map(d => ({id: d.id, ...d.data()}));
            // Find settings for this user
            const mySet = allSettings.find(s => s.userId === appUser.id);
            if(mySet) setMySettings(mySet);
            else setMySettings({}); // No settings yet
        }, (err) => console.error("Settings Listener Error", err));

        return () => { unsubStudents(); unsubJournals(); unsubSettings(); };
    }, [appUser, authUser]);

    // Logic
    const handleLogin = (u, p) => {
        setLoginLoading(true);
        setLoginError('');
        
        // Simulate network delay for effect
        setTimeout(() => {
            const user = allUsers.find(x => x.username === u && x.password === p);
            
            if (user) {
                // Check Expiry
                if (user.accessExpiry && new Date(user.accessExpiry) < new Date()) {
                    setLoginError('Masa aktif akun telah habis. Hubungi Admin.');
                } else {
                    setAppUser(user);
                    setActiveTab('dashboard');
                }
            } else {
                setLoginError('Username atau Password salah!');
            }
            setLoginLoading(false);
        }, 800);
    };

    const handleLogout = () => {
        if(confirm("Keluar dari aplikasi?")) {
            setAppUser(null);
            setStudents([]);
            setJournals([]);
        }
    };

    const handleUpdatePassword = async (data) => {
        try {
            await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.users), data.id), {
                password: data.password,
                fullName: data.fullName
            });
            // Update local state immediately for UI feedback
            setAppUser(prev => ({...prev, password: data.password, fullName: data.fullName}));
            alert("Profil berhasil diperbarui.");
        } catch (e) {
            console.error(e);
            alert("Gagal update profil.");
        }
    }

    // Actions
    const addStudent = async (data) => {
        await addDoc(getCollectionRef(COLLECTION_PATHS.students), { ...data, teacherId: appUser.id, createdAt: new Date().toISOString() });
    };
    
    // NEW: Batch Import Handler
    const importStudents = async (studentList) => {
        try {
            const batch = writeBatch(db);
            studentList.forEach(student => {
                const docRef = doc(getCollectionRef(COLLECTION_PATHS.students)); // Auto ID
                batch.set(docRef, {
                    ...student,
                    teacherId: appUser.id,
                    createdAt: new Date().toISOString()
                });
            });
            await batch.commit();
            alert(`Berhasil mengimpor ${studentList.length} data siswa!`);
        } catch (e) {
            console.error("Import Error:", e);
            alert("Gagal mengimpor data. Coba lagi.");
        }
    };

    const updateStudent = async (data) => {
        const { id, ...rest } = data;
        await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.students), id), rest);
    };
    const deleteStudent = async (id) => {
        if(confirm("Hapus siswa?")) await deleteDoc(doc(getCollectionRef(COLLECTION_PATHS.students), id));
    };

    const addJournal = async (data) => {
        // Ensure studentNames is always an array
        const payload = {
            ...data,
            teacherId: appUser.id,
            createdAt: new Date(), // Use JS Date for sorting logic
            studentNames: Array.isArray(data.studentNames) ? data.studentNames : [data.studentName]
        };
        await addDoc(getCollectionRef(COLLECTION_PATHS.journals), payload);
    };

    const updateJournal = async (data) => {
        try {
            const { id, ...rest } = data;
            const payload = {
                ...rest,
                studentNames: Array.isArray(data.studentNames) ? data.studentNames : [data.studentName],
                updatedAt: new Date().toISOString()
            };
            await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.journals), id), payload);
            alert("Jurnal berhasil diperbarui.");
        } catch (e) {
            console.error("Update Error:", e);
            alert("Gagal memperbarui jurnal.");
        }
    };

    const saveSettings = async (data) => {
        // If settings exist, update. Else add.
        if (mySettings.id) {
            await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.settings), mySettings.id), data);
        } else {
            await addDoc(getCollectionRef(COLLECTION_PATHS.settings), { ...data, userId: appUser.id });
        }
        alert("Pengaturan sekolah tersimpan.");
    };

    // Render Logic
    if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 bg-slate-50">Menghubungkan ke Server SIBKO...</div>;
    
    if (!appUser) return <LoginPage onLogin={handleLogin} loading={loginLoading} error={loginError} />;

    return (
        <AppLayout 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            userRole={appUser.role} 
            userName={appUser.fullName} 
            onLogout={handleLogout}
        >
            {appUser.role === 'admin' ? (
                <>
                    {activeTab === 'dashboard' && <AdminDashboard users={allUsers} studentsCount={students.length} journalsCount={journals.length} />}
                    {activeTab === 'users' && <AdminUserManagement users={allUsers} />}
                    {activeTab === 'account' && (
                        <AccountSettings user={appUser} onUpdatePassword={handleUpdatePassword} />
                    )}
                </>
            ) : (
                <>
                    {/* GURU BK PANELS */}
                    {activeTab === 'dashboard' && (
                        <GuruDashboard students={students} journals={journals} />
                    )}
                    {activeTab === 'students' && (
                        <StudentManager 
                            students={students} 
                            journals={journals}
                            onAdd={addStudent} 
                            onImport={importStudents} // Pass the import handler
                            onEdit={updateStudent} 
                            onDelete={deleteStudent} 
                        />
                    )}
                    {activeTab === 'journal' && (
                        <Journal 
                            students={students} 
                            journals={journals} 
                            onAdd={addJournal}
                            onUpdate={updateJournal}
                            settings={mySettings} 
                        />
                    )}
                    {activeTab === 'reports' && (
                        <Reports 
                            journals={journals} 
                            students={students} 
                            settings={mySettings} // Pass settings
                        />
                    )}
                    {activeTab === 'settings' && (
                        <SchoolSettings settings={mySettings} onSave={saveSettings} />
                    )}
                    {activeTab === 'account' && (
                        <AccountSettings user={appUser} onUpdatePassword={handleUpdatePassword} />
                    )}
                </>
            )}
        </AppLayout>
    );
}