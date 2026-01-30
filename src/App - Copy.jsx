import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, FileText, LayoutDashboard, PieChart, UserPlus, Search, 
  AlertCircle, CheckCircle, Save, Trash2, Calendar, Menu, X, Edit, 
  Filter, Printer, FilePlus, Star, Briefcase, CheckSquare, UserCheck, 
  Group, Upload, Download, Settings, PlusCircle, MinusCircle, 
  ArrowRight, Check, BrainCircuit, ClipboardList, Image as ImageIcon, 
  LogOut, List, User, School, Activity, BarChart2, TrendingUp, Lock, Eye, EyeOff,
  Bell, Shield, UserCog, Key, Database
} from 'lucide-react';

// --- MOCK DATA & CONSTANTS ---
const SKKPD_LIST = [
  "Landasan Hidup Religius", "Landasan Perilaku Etis", "Kematangan Emosi",
  "Kematangan Intelektual", "Kesadaran Tanggung Jawab Sosial", "Kesadaran Gender",
  "Pengembangan Pribadi", "Perilaku Kewirausahaan (Kemandirian)",
  "Wawasan dan Kesiapan Karir", "Kematangan Hubungan Teman Sebaya"
];

const TEKNIK_KONSELING = [
  "Client Centered (Mendengarkan Aktif)", "Behavioral (Penguatan/Kontrak)",
  "REBT (Rational Emotive Behavior)", "SFBT (Fokus Solusi)", "Reality Therapy (WDEP)",
  "Trait & Factor (Karir)", "Diskusi Kelompok (Group Dynamics)", "Psikodrama / Sosiodrama", "Lainnya"
];

const INITIAL_SCHOOL_INFO = {
  government: "PEMERINTAH PROVINSI MOCK",
  department: "DINAS PENDIDIKAN",
  name: "SEKOLAH MOCK UJI COBA",
  address: "Jl. Simulasi No. 1, Dunia Maya",
  city: "Jakarta",
  logo: null,
  logo2: null,
  principal: "Drs. Kepala Sekolah",
  principalNip: "19800101 200001 1 001",
  counselor: "Koordinator BK",
  counselorNip: "19900101 201501 1 001",
  classes: ["X-1", "X-2", "XI-1", "XI-2", "XII-1", "XII-2"] 
};

// Data User Default untuk Login
const MOCK_USERS = [
    { 
        uid: 'admin-123', 
        username: 'admin', 
        password: 'admin123', 
        fullName: 'Super Administrator', 
        role: 'super_admin',
        email: 'admin@sibko.app'
    },
    { 
        uid: 'guru-001', 
        username: 'guru', 
        password: '123', 
        fullName: 'Ibu Guru BK', 
        role: 'guru',
        email: 'guru@sibko.app'
    }
];

// --- UTILITIES FOR LOCAL STORAGE ---
const getLocalData = (key, defaultVal) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
};

const setLocalData = (key, val) => {
    localStorage.setItem(key, JSON.stringify(val));
};

// --- KOMPONEN CUSTOM TOAST ---
function Notification({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;
  const bgClass = type === 'error' ? 'bg-red-500' : 'bg-green-600';

  return (
    <div className={`fixed top-5 right-5 ${bgClass} text-white px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-bounce-in`}>
      {type === 'error' ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 p-1 rounded"><X size={16}/></button>
    </div>
  );
}

// --- KOMPONEN LOGIN ---
function LoginPage({ onLogin, error, isLoading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
             <UserCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Login SIBKO (Mock)</h1>
          <p className="text-slate-500 text-sm">Mode Uji Coba Tanpa Database</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2 border border-red-200">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                </div>
                <input 
                    type="text" 
                    required
                    className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Contoh: admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                </div>
                <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    className="w-full pl-10 pr-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Contoh: admin123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Memproses...' : 'Masuk (Lokal)'}
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-200">
            <p className="font-bold mb-1">Akun Demo Tersedia:</p>
            <div className="flex justify-between">
                <span>Admin: <strong>admin</strong> / <strong>admin123</strong></span>
                <span>Guru: <strong>guru</strong> / <strong>123</strong></span>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- KOMPONEN MANAJEMEN USER (ADMIN ONLY) ---
function UserManagement({ currentUserProfile, allUsers, onUpdateUserList }) {
    const [formData, setFormData] = useState({ username: '', fullName: '', password: '' });

    const handleCreateUser = (e) => {
        e.preventDefault();
        const cleanUsername = formData.username.toLowerCase().replace(/\s/g,'');
        if(allUsers.some(u => u.username === cleanUsername)) {
            alert("Username sudah ada!");
            return;
        }

        const newUser = {
            uid: `user-${Date.now()}`, // Fake UID
            fullName: formData.fullName,
            username: cleanUsername,
            password: formData.password,
            role: 'guru',
            createdBy: currentUserProfile.username,
            createdAt: new Date().toISOString()
        };

        const updatedUsers = [...allUsers, newUser];
        onUpdateUserList(updatedUsers); // Update parent state & local storage
        setFormData({ username: '', fullName: '', password: '' });
        alert(`User ${newUser.fullName} berhasil dibuat!`);
    };

    const handleDeleteUser = (uid) => {
        if(window.confirm("Hapus user ini? Data mereka tidak hilang, tapi tidak bisa login.")) {
            const updatedUsers = allUsers.filter(u => u.uid !== uid);
            onUpdateUserList(updatedUsers);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <UserPlus size={20} className="text-blue-600"/> Tambah Guru BK Baru (Lokal)
                </h3>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap</label>
                        <input required className="w-full p-2 border rounded" placeholder="Nama Guru" value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Username</label>
                        <input required className="w-full p-2 border rounded" placeholder="mis: guru2" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
                        <input required type="text" className="w-full p-2 border rounded" placeholder="min 3 digit" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} />
                    </div>
                    <button className="bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">Buat Akun</button>
                </form>
             </div>

             <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b bg-slate-50 font-bold text-slate-700">Daftar Pengguna</div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600">
                        <tr>
                            <th className="p-3">Nama Lengkap</th>
                            <th className="p-3">Username</th>
                            <th className="p-3">Password</th>
                            <th className="p-3">Role</th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {allUsers.map(u => (
                            <tr key={u.uid} className="hover:bg-slate-50">
                                <td className="p-3 font-medium">{u.fullName} {u.uid === currentUserProfile.uid && "(Anda)"}</td>
                                <td className="p-3 text-slate-500">@{u.username}</td>
                                <td className="p-3 font-mono text-xs text-slate-400">{u.password}</td>
                                <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role === 'super_admin' ? 'Admin' : 'Guru'}</span></td>
                                <td className="p-3 text-center">
                                    {u.role !== 'super_admin' && (
                                        <button onClick={() => handleDeleteUser(u.uid)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    )
}

// --- KOMPONEN UTAMA (APP) ---
export default function App() {
  const [userProfile, setUserProfile] = useState(null); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notify, setNotify] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // --- MOCK DATABASE STATES ---
  const [users, setUsers] = useState(getLocalData('bk_users', MOCK_USERS));
  const [students, setStudents] = useState(getLocalData('bk_students', []));
  const [sessions, setSessions] = useState(getLocalData('bk_sessions', []));
  const [rpls, setRpls] = useState(getLocalData('bk_rpls', []));
  const [schoolInfos, setSchoolInfos] = useState(getLocalData('bk_school_infos', {})); // Object key by user ID

  // Get current user's school info (or default)
  const currentSchoolInfo = userProfile ? (schoolInfos[userProfile.uid] || INITIAL_SCHOOL_INFO) : INITIAL_SCHOOL_INFO;

  // --- PERSIST DATA TO LOCAL STORAGE ---
  useEffect(() => { setLocalData('bk_users', users); }, [users]);
  useEffect(() => { setLocalData('bk_students', students); }, [students]);
  useEffect(() => { setLocalData('bk_sessions', sessions); }, [sessions]);
  useEffect(() => { setLocalData('bk_rpls', rpls); }, [rpls]);
  useEffect(() => { setLocalData('bk_school_infos', schoolInfos); }, [schoolInfos]);

  // --- RESPONSIVE SIDEBAR ---
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth < 768) setSidebarOpen(false); else setSidebarOpen(true); };
    handleResize(); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FILTERED DATA (MULTITENANCY LOGIC) ---
  // Super Admin: See ALL. Teacher: See OWN (by teacherId).
  const filteredStudents = useMemo(() => {
      if (!userProfile) return [];
      if (userProfile.role === 'super_admin') return students;
      return students.filter(s => s.teacherId === userProfile.uid);
  }, [students, userProfile]);

  const filteredSessions = useMemo(() => {
    if (!userProfile) return [];
    if (userProfile.role === 'super_admin') return sessions;
    return sessions.filter(s => s.teacherId === userProfile.uid);
  }, [sessions, userProfile]);

  const filteredRpls = useMemo(() => {
    if (!userProfile) return [];
    if (userProfile.role === 'super_admin') return rpls;
    return rpls.filter(s => s.teacherId === userProfile.uid);
  }, [rpls, userProfile]);


  // --- ACTIONS ---
  const showNotify = (msg, type = 'success') => setNotify({ message: msg, type });

  const handleLogin = (username, password) => {
    setIsLoading(true);
    setAuthError('');
    setTimeout(() => {
        // Simple mock authentication check
        const foundUser = users.find(u => u.username === username && u.password === password);
        if (foundUser) {
            setUserProfile(foundUser);
            showNotify(`Selamat datang, ${foundUser.fullName}!`);
        } else {
            setAuthError("Username atau password salah!");
        }
        setIsLoading(false);
    }, 800); // Fake delay
  };

  const handleLogout = () => {
      if(window.confirm("Keluar dari aplikasi?")) {
          setUserProfile(null);
          setActiveTab('dashboard');
      }
  };

  // --- DATA CRUD HANDLERS ---
  const withMetaData = (data) => ({
      ...data,
      id: Date.now(), // Mock ID
      teacherId: userProfile.uid,
      teacherName: userProfile.fullName,
      createdAt: new Date().toISOString()
  });

  const handleAddStudent = (data) => {
      setStudents([...students, withMetaData({...data, points: 0, status: 'Aman'})]);
      showNotify("Siswa berhasil ditambahkan");
  };
  const handleUpdateStudent = (data) => {
      setStudents(students.map(s => s.id === data.id ? data : s));
      showNotify("Data siswa diperbarui");
  };
  const handleDeleteStudent = (id) => {
      if(window.confirm("Hapus siswa ini?")) {
          setStudents(students.filter(s => s.id !== id));
          showNotify("Siswa dihapus");
      }
  };
  const handleImportStudents = (imported) => {
      // Add multiple
      const newItems = imported.map(i => withMetaData({...i, points: 0, status: 'Aman', id: Math.random()}));
      setStudents([...students, ...newItems]);
      showNotify(`${imported.length} siswa diimpor`);
  };
  const handleMoveClass = (ids, cls) => {
      setStudents(students.map(s => ids.includes(s.id) ? { ...s, class: cls } : s));
      showNotify("Siswa dipindahkan");
  };

  const handleAddSession = (data) => {
      setSessions([...sessions, withMetaData(data)]);
      showNotify("Laporan tersimpan");
  };
  const handleUpdateSession = (data) => {
      setSessions(sessions.map(s => s.id === data.id ? data : s));
      showNotify("Laporan diperbarui");
  };

  const handleAddRpl = (data) => {
      setRpls([...rpls, withMetaData(data)]);
      showNotify("RPL dibuat");
  };

  const handleUpdateSchoolInfo = (info) => {
      setSchoolInfos({ ...schoolInfos, [userProfile.uid]: info });
      showNotify("Pengaturan disimpan");
  };

  const handleUpdateUserList = (newList) => {
      setUsers(newList); // Save to state & local storage via useEffect
  };

  // --- RENDER ---
  if (!userProfile) return <LoginPage onLogin={handleLogin} error={authError} isLoading={isLoading} />;

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard students={filteredStudents} sessions={filteredSessions} userProfile={userProfile} />;
      case 'usermgmt': return <UserManagement currentUserProfile={userProfile} allUsers={users} onUpdateUserList={handleUpdateUserList} />;
      case 'assessment': return <AssessmentManager students={filteredStudents} onUpdate={handleUpdateStudent} schoolInfo={currentSchoolInfo} />;
      case 'students': return <StudentManager students={filteredStudents} onAdd={handleAddStudent} onEdit={handleUpdateStudent} onDelete={handleDeleteStudent} onImport={handleImportStudents} onMoveClass={handleMoveClass} schoolInfo={currentSchoolInfo} />;
      case 'counseling': return <CounselingManager students={filteredStudents} sessions={filteredSessions} onAdd={handleAddSession} onUpdate={handleUpdateSession} schoolInfo={currentSchoolInfo} userProfile={userProfile} />;
      case 'rpl': return <RPLGenerator rpls={filteredRpls} onAdd={handleAddRpl} schoolInfo={currentSchoolInfo} userProfile={userProfile} />;
      case 'reports': return <Reports students={filteredStudents} sessions={filteredSessions} schoolInfo={currentSchoolInfo} userProfile={userProfile} />;
      case 'settings': return <SettingsManager schoolInfo={currentSchoolInfo} onSave={handleUpdateSchoolInfo} userProfile={userProfile} />;
      default: return <Dashboard students={filteredStudents} sessions={filteredSessions} userProfile={userProfile} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden relative">
      <Notification message={notify.message} type={notify.type} onClose={() => setNotify({ message: '', type: '' })} />

      <aside className={`fixed md:static inset-y-0 left-0 z-30 bg-blue-900 text-white shadow-xl transition-all duration-300 ease-in-out flex flex-col print:hidden ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}`}>
        <div className="p-4 flex items-center justify-between border-b border-blue-800 h-16">
          {sidebarOpen ? (
              <div className="flex flex-col">
                  <h1 className="font-bold text-xl tracking-tight leading-none">SIBKO <span className="text-yellow-400">Mock</span></h1>
                  <span className="text-[10px] text-blue-300 uppercase tracking-widest mt-1">{userProfile.role === 'super_admin' ? 'Super Admin' : 'Guru BK'}</span>
              </div>
          ) : <span className="font-bold text-xl mx-auto">SB</span>}
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-blue-800 rounded"><X size={20} /></button>
        </div>
        
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isOpen={sidebarOpen} />
          
          {userProfile.role === 'super_admin' && (
              <div className="my-2 border-y border-blue-800 py-2">
                 <SidebarItem icon={<UserCog size={20}/>} label="Manajemen User" active={activeTab === 'usermgmt'} onClick={() => setActiveTab('usermgmt')} isOpen={sidebarOpen} />
              </div>
          )}

          <SidebarItem icon={<Users size={20}/>} label="Data Siswa" active={activeTab === 'students'} onClick={() => setActiveTab('students')} isOpen={sidebarOpen} />
          <SidebarItem icon={<BrainCircuit size={20}/>} label="Asesmen" active={activeTab === 'assessment'} onClick={() => setActiveTab('assessment')} isOpen={sidebarOpen} />
          <SidebarItem icon={<FileText size={20}/>} label="Layanan BK" active={activeTab === 'counseling'} onClick={() => setActiveTab('counseling')} isOpen={sidebarOpen} />
          <SidebarItem icon={<FilePlus size={20}/>} label="Perencanaan" active={activeTab === 'rpl'} onClick={() => setActiveTab('rpl')} isOpen={sidebarOpen} />
          <SidebarItem icon={<PieChart size={20}/>} label="Laporan" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} isOpen={sidebarOpen} />
          <div className="pt-4 mt-4 border-t border-blue-800 mx-2">
            <SidebarItem icon={<Settings size={20}/>} label="Pengaturan" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isOpen={sidebarOpen} />
          </div>
        </nav>
        
        <div className="p-4 border-t border-blue-800 bg-blue-950">
           <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
               {sidebarOpen && (
                   <div className="truncate pr-2">
                       <p className="text-sm font-bold truncate">{userProfile.fullName}</p>
                       <p className="text-xs text-blue-300 truncate">@{userProfile.username}</p>
                   </div>
               )}
               <button onClick={handleLogout} title="Keluar" className="text-red-300 hover:text-white p-1 hover:bg-red-600 rounded transition-colors"><LogOut size={18}/></button>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 w-full relative">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 z-10 print:hidden flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded hover:bg-slate-100 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100"><Menu size={24} /></button>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 capitalize truncate max-w-[200px] md:max-w-none">
               {activeTab === 'usermgmt' ? 'Manajemen Pengguna (Admin)' : 
                activeTab === 'assessment' ? 'Asesmen & Diagnosa' : 
                activeTab === 'settings' ? 'Pengaturan Saya' : 
                activeTab === 'reports' ? 'Laporan & Jurnal' :
                activeTab === 'counseling' ? 'Layanan BK' : activeTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
             {userProfile.role === 'super_admin' && (
                 <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-bold border border-purple-200 hidden sm:block">Admin Mode</span>
             )}
             <div className="h-9 w-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">
                {userProfile.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'U'}
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 print:p-0 scroll-smooth">{renderContent()}</div>
      </main>
      
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity" onClick={() => setSidebarOpen(false)}></div>}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, isOpen }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center px-4 py-3 transition-colors relative group ${active ? 'bg-blue-800 text-white border-r-4 border-yellow-400' : 'text-blue-100 hover:bg-blue-800'}`} title={!isOpen ? label : ''}>
      <div className="flex-shrink-0">{icon}</div>
      <span className={`ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{label}</span>
    </button>
  );
}

// 1. DASHBOARD
function Dashboard({ students, sessions, userProfile }) {
  const avgSatisfaction = sessions.length > 0 ? (sessions.reduce((acc, curr) => acc + (parseInt(curr.satisfaction) || 0), 0) / sessions.length).toFixed(1) : 0;
  const monitoring = sessions.filter(s => s.followUp === 'Pantau').length;
  const groupSessions = sessions.filter(s => s.type && s.type.includes('Kelompok')).length;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl shadow-lg mb-6">
        <h2 className="text-xl md:text-2xl font-bold mb-1">Dashboard {userProfile?.role === 'super_admin' ? 'Super Admin' : 'Guru BK'}</h2>
        <p className="opacity-90 text-sm md:text-base">
            {userProfile?.role === 'super_admin' 
                ? 'Mode Supervisi: Anda melihat ringkasan data dari seluruh guru.' 
                : 'Selamat datang! Kelola siswa dan layanan bimbingan konseling Anda di sini.'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Siswa" value={students.length} icon={<Users className="text-blue-500" />} color="bg-blue-50" />
        <StatCard title="Layanan Kelompok" value={groupSessions} icon={<Group className="text-purple-500" />} color="bg-purple-50" />
        <StatCard title="Dalam Pantauan" value={monitoring} icon={<AlertCircle className="text-orange-500" />} color="bg-orange-50" />
        <StatCard title="Indeks Kepuasan" value={`${avgSatisfaction} / 5.0`} icon={<Star className="text-yellow-500 fill-yellow-500" />} color="bg-yellow-50" />
      </div>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-700 mb-4 border-b pb-2 flex items-center gap-2"><ClipboardList size={18}/> Jurnal Kegiatan Terakhir</h3>
        <div className="space-y-0 divide-y divide-slate-100">
          {sessions.slice(0, 5).map(s => {
             let studentNames = "Siswa Dihapus";
             if (s.studentIds && s.studentIds.length > 0) {
                const names = s.studentIds.map(id => students.find(st => st.id === id)?.name).filter(Boolean);
                studentNames = names.join(", ");
                if (names.length > 2) studentNames = `${names[0]}, ${names[1]} +${names.length - 2} lainnya`;
             } else if (s.studentId) { 
                 const st = students.find(st => st.id === s.studentId);
                 studentNames = st ? st.name : "Siswa Dihapus"; 
             }
             return (
               <div key={s.id} className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-slate-50 px-2 rounded gap-2 sm:gap-0 transition-colors">
                 <div>
                   <div className="flex flex-wrap items-center gap-2">
                     <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${s.type.includes('Kelompok') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{s.type}</span>
                     <span className="font-bold text-slate-700 text-sm">{studentNames}</span> 
                   </div>
                   <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                       <BrainCircuit size={10}/> {s.technique} • {s.date} 
                       {userProfile?.role === 'super_admin' && <span className="ml-2 text-blue-500">• Oleh: {s.teacherName}</span>}
                   </p>
                 </div>
                 <span className={`text-xs px-2 py-1 rounded font-bold self-start sm:self-center ${s.followUp === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{s.followUp || 'Proses'}</span>
               </div>
             )
          })}
          {sessions.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">Belum ada data kegiatan.</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between ${color} hover:shadow-md transition-shadow`}>
      <div><p className="text-slate-600 text-xs font-bold uppercase tracking-wider">{title}</p><p className="text-2xl font-extrabold text-slate-800 mt-1">{value}</p></div>
      <div className="bg-white p-3 rounded-full shadow-sm">{icon}</div>
    </div>
  );
}

// 7. ASESMEN MANAGER
function AssessmentManager({ students, onUpdate, schoolInfo }) {
  const [filterClass, setFilterClass] = useState('');
  const classes = schoolInfo.classes || [];
  const filteredStudents = filterClass ? students.filter(s => s.class === filterClass) : students;
  const learningStyles = filteredStudents.reduce((acc, curr) => { const style = curr.learningStyle || 'Belum Diisi'; acc[style] = (acc[style] || 0) + 1; return acc; }, {});
  const handleUpdateAssessment = (id, field, value) => { const student = students.find(s => s.id === id); if(student) { onUpdate({ ...student, [field]: value }); } };

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 gap-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg"><BrainCircuit size={24} className="text-blue-600"/> Diagnosa & Peta Kelas</h3>
          <select className="p-2 border rounded-lg text-sm w-full md:w-auto" value={filterClass} onChange={e => setFilterClass(e.target.value)}><option value="">-- Pilih Kelas untuk Analisis --</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
           <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100"><h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Visual</h4><p className="text-3xl font-extrabold text-blue-600">{learningStyles['Visual'] || 0}</p><p className="text-[10px] text-blue-500 uppercase tracking-wide">Siswa</p></div>
           <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100"><h4 className="text-xs font-bold text-green-800 uppercase mb-2">Auditori</h4><p className="text-3xl font-extrabold text-green-600">{learningStyles['Auditori'] || 0}</p><p className="text-[10px] text-green-500 uppercase tracking-wide">Siswa</p></div>
           <div className="bg-orange-50 p-4 rounded-xl text-center border border-orange-100"><h4 className="text-xs font-bold text-orange-800 uppercase mb-2">Kinestetik</h4><p className="text-3xl font-extrabold text-orange-600">{learningStyles['Kinestetik'] || 0}</p><p className="text-[10px] text-orange-500 uppercase tracking-wide">Siswa</p></div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-100 text-slate-700"><tr><th className="p-3 font-semibold border-b">Nama Siswa</th><th className="p-3 font-semibold border-b w-24">Kelas</th><th className="p-3 font-semibold border-b w-40">Gaya Belajar</th><th className="p-3 font-semibold border-b">Kebutuhan / Masalah Dominan</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">{s.name}</td><td className="p-3 text-slate-500">{s.class}</td>
                  <td className="p-3"><select className="w-full p-1.5 border rounded text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none" value={s.learningStyle || ''} onChange={(e) => handleUpdateAssessment(s.id, 'learningStyle', e.target.value)}><option value="-">Belum Diisi</option><option value="Visual">Visual</option><option value="Auditori">Auditori</option><option value="Kinestetik">Kinestetik</option></select></td>
                  <td className="p-3"><input className="w-full p-1.5 border rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Mis: Kurang PD, Karir..." value={s.needs || ''} onChange={(e) => handleUpdateAssessment(s.id, 'needs', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 2. STUDENT MANAGER
function StudentManager({ students, onAdd, onEdit, onDelete, onImport, onMoveClass, schoolInfo }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nisn: '', name: '', class: '', parent: '', career: '' });
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetClass, setTargetClass] = useState('');
  const fileInputRef = useRef(null);
  const existingClasses = useMemo(() => [...new Set(students.map(s => s.class))].sort(), [students]);
  const filteredStudents = students.filter(s => { return (s.name.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search)) && (filterClass === '' || s.class === filterClass); });

  const handleSubmit = (e) => { e.preventDefault(); if (editingId) onEdit({ ...formData, id: editingId }); else onAdd(formData); setFormData({ nisn: '', name: '', class: '', parent: '', career: '' }); setEditingId(null); setShowForm(false); };
  const handleSelectAll = (e) => { if (e.target.checked) setSelectedIds(filteredStudents.map(s => s.id)); else setSelectedIds([]); };
  const handleSelectStudent = (id) => { if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id)); else setSelectedIds([...selectedIds, id]); };
  const executeMove = () => { if (!targetClass) return alert("Pilih kelas tujuan!"); if (selectedIds.length === 0) return alert("Pilih minimal 1 siswa!"); if (window.confirm(`Yakin ingin memindahkan ${selectedIds.length} siswa ke kelas ${targetClass}?`)) { onMoveClass(selectedIds, targetClass); setIsMoveMode(false); setSelectedIds([]); setTargetClass(''); } };
  const handleDownloadTemplate = () => { const csvContent = "NISN,Nama Lengkap,Kelas,Nama Wali,Rencana Karir\n123456,Budi Santoso,X-IPA-1,Bpk Santoso,Polisi\n789101,Siti Aminah,X-IPA-2,Ibu Siti,Dokter"; const blob = new Blob([csvContent], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'Template_Data_Siswa_BK.csv'; a.click(); };
  const handleFileUpload = (e) => { const file = e.target.files[0]; if (!file) return; if(!file.name.endsWith('.csv')) { alert('Mohon upload file dengan format .csv (Excel > Save As > CSV)'); return; } const reader = new FileReader(); reader.onload = (event) => { const text = event.target.result; const rows = text.split('\n'); const importedData = []; for(let i = 1; i < rows.length; i++) { const row = rows[i].trim(); if(!row) continue; const cols = row.split(/[,;]/); if(cols.length >= 2) { importedData.push({ nisn: cols[0]?.trim().replace(/['"]+/g, '') || '', name: cols[1]?.trim().replace(/['"]+/g, '') || '', class: cols[2]?.trim().replace(/['"]+/g, '') || '', parent: cols[3]?.trim().replace(/['"]+/g, '') || '', career: cols[4]?.trim().replace(/['"]+/g, '') || '' }); } } onImport(importedData); }; reader.readAsText(file); e.target.value = null; };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 pb-10">
      <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-slate-50 rounded-t-xl">
        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cari Nama / NISN..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
          <div className="relative"><Filter className="absolute left-3 top-2.5 text-slate-400" size={18} /><select className="pl-10 pr-8 py-2 border rounded-lg text-sm bg-white appearance-none w-full sm:w-auto focus:ring-2 focus:ring-blue-500 outline-none" value={filterClass} onChange={e=>setFilterClass(e.target.value)}><option value="">Semua Kelas</option>{existingClasses.map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-end items-center">
            {!isMoveMode && (
              <>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={handleDownloadTemplate} className="bg-white border border-slate-300 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium flex gap-2 items-center hover:bg-slate-50 flex-1 justify-center sm:flex-none" title="Download Template Excel"><Download size={18}/> <span className="hidden md:inline">Template</span></button>
                  <button onClick={() => fileInputRef.current.click()} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex gap-2 items-center shadow-sm flex-1 justify-center sm:flex-none"><Upload size={18}/> Import</button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <button onClick={() => {setIsMoveMode(true); setSelectedIds([]);}} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex gap-2 items-center shadow-sm flex-1 justify-center sm:flex-none"><ArrowRight size={18}/> Pindah Kelas</button>
                  <button onClick={() => {setShowForm(!showForm); setEditingId(null); setFormData({nisn:'',name:'',class:'',parent:'', career:''})}} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex gap-2 items-center shadow-sm flex-1 justify-center sm:flex-none"><UserPlus size={18}/> Tambah</button>
                </div>
              </>
            )}
            {isMoveMode && (
              <div className="flex flex-col sm:flex-row gap-2 items-center bg-orange-50 p-2 rounded-lg border border-orange-200 animate-fade-in w-full md:w-auto justify-between md:justify-end">
                 <div className="flex items-center gap-2 px-2 w-full sm:w-auto justify-between sm:justify-start"><span className="text-xs font-bold text-orange-700 whitespace-nowrap">{selectedIds.length} Siswa Dipilih</span></div>
                 <div className="flex gap-2 items-center w-full sm:w-auto">
                    <select className="p-1.5 border rounded text-sm w-full sm:w-40" value={targetClass} onChange={e=>setTargetClass(e.target.value)}><option value="">-- Kelas Baru --</option>{schoolInfo.classes?.map(cls => <option key={cls} value={cls}>{cls}</option>)}</select>
                    <button onClick={executeMove} className="bg-orange-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-orange-700">Simpan</button>
                    <button onClick={()=>{setIsMoveMode(false); setSelectedIds([])}} className="bg-slate-300 text-slate-700 px-3 py-1.5 rounded text-sm hover:bg-slate-400">Batal</button>
                 </div>
              </div>
            )}
        </div>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 bg-blue-50 border-b border-blue-100 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div><label className="text-xs font-bold text-slate-500 mb-1 block">NISN</label><input required className="w-full p-2 border rounded" value={formData.nisn} onChange={e=>setFormData({...formData, nisn: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="text-xs font-bold text-slate-500 mb-1 block">Nama Lengkap</label><input required className="w-full p-2 border rounded" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Kelas</label><select required className="w-full p-2 border rounded bg-white" value={formData.class} onChange={e=>setFormData({...formData, class: e.target.value})}><option value="">-- Pilih Kelas --</option>{schoolInfo.classes && schoolInfo.classes.map(cls => (<option key={cls} value={cls}>{cls}</option>))}</select></div>
            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Nama Wali</label><input required className="w-full p-2 border rounded" value={formData.parent} onChange={e=>setFormData({...formData, parent: e.target.value})} /></div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-4 items-end">
             <div className="flex-1 w-full"><label className="text-xs font-bold text-slate-500 mb-1 block flex items-center gap-1"><Briefcase size={12}/> Peminatan / Rencana Karir</label><input className="w-full p-2 border rounded" placeholder="Cita-cita / Rencana Lanjut Studi" value={formData.career} onChange={e=>setFormData({...formData, career: e.target.value})} /></div>
             <button type="submit" className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 flex items-center justify-center gap-2 h-10"><Save size={18}/> Simpan Data</button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto rounded-b-xl">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-slate-100 text-slate-600 border-b">
            <tr>
              {isMoveMode && (<th className="p-4 w-10"><input type="checkbox" className="w-4 h-4" onChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filteredStudents.length} /></th>)}
              <th className="p-4 font-semibold">NISN</th><th className="p-4 font-semibold">Nama Siswa</th><th className="p-4 font-semibold">Kelas</th><th className="p-4 font-semibold">Rencana Karir</th><th className="p-4 font-semibold">Status BK</th><th className="p-4 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map(s => (
              <tr key={s.id} className={`hover:bg-slate-50 ${selectedIds.includes(s.id) ? 'bg-orange-50' : ''}`}>
                {isMoveMode && (<td className="p-4 text-center"><input type="checkbox" className="w-4 h-4 accent-orange-500" checked={selectedIds.includes(s.id)} onChange={() => handleSelectStudent(s.id)} /></td>)}
                <td className="p-4 text-slate-500">{s.nisn}</td><td className="p-4 font-bold text-slate-700">{s.name}</td>
                <td className="p-4">{isMoveMode && selectedIds.includes(s.id) ? (<span className="flex items-center gap-1 text-orange-600 font-bold"><ArrowRight size={14}/> {targetClass || '?'}</span>) : s.class}</td>
                <td className="p-4 text-blue-600 italic">{s.career || '-'}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'Kritis' ? 'bg-red-100 text-red-700' : s.status === 'Perlu Perhatian' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{s.status}</span></td>
                <td className="p-4 text-center flex justify-center gap-2"><button onClick={()=>{setEditingId(s.id); setFormData(s); setShowForm(true)}} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit size={16}/></button><button onClick={()=>onDelete(s.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 3. COUNSELING MANAGER (Updated with Class/Group Logic and Edit Mode)
function CounselingManager({ students, sessions, onAdd, onUpdate, schoolInfo, userProfile }) {
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], type: 'Konseling Individu', consent: false, technique: '', symptoms: '', rootCause: '', treatment: '', result: '', followUp: 'Selesai', satisfaction: '5', groupTopicType: 'Tugas' });

  const isClassMode = formData.type === 'Bimbingan Klasikal';
  const isSingleMode = ['Konseling Individu', 'Alih Tangan Kasus (Referral)', 'Kunjungan Rumah (Home Visit)', 'Konsultasi'].includes(formData.type);

  const filteredStudentList = students.filter(s => !selectedStudents.includes(s.id) && (s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.class.toLowerCase().includes(studentSearch.toLowerCase())));

  const handleAddStudentToGroup = (id) => {
    if (isSingleMode && selectedStudents.length > 0) { if(!window.confirm("Layanan ini biasanya untuk 1 siswa. Ganti siswa yang sudah dipilih?")) return; setSelectedStudents([id]); } else { setSelectedStudents([...selectedStudents, id]); }
    setStudentSearch('');
  };

  const handleClassSelect = (e) => {
      const cls = e.target.value;
      if(!cls) return;
      const classStudents = students.filter(s => s.class === cls).map(s => s.id);
      if (classStudents.length === 0) { alert(`Tidak ada siswa di kelas ${cls}`); return; }
      setSelectedStudents(classStudents);
  };

  const handleRemoveStudentFromGroup = (id) => setSelectedStudents(selectedStudents.filter(sid => sid !== id));

  const handleEditClick = (session) => {
    setEditingId(session.id);
    setFormData({ date: session.date, type: session.type, consent: session.consent, technique: session.technique, symptoms: session.symptoms, rootCause: session.rootCause, treatment: session.treatment, result: session.result, followUp: session.followUp, satisfaction: session.satisfaction, groupTopicType: session.groupTopicType || 'Tugas' });
    if (session.studentIds && session.studentIds.length > 0) setSelectedStudents(session.studentIds);
    else if (session.studentId) setSelectedStudents([parseInt(session.studentId)]);
    else setSelectedStudents([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ date: new Date().toISOString().split('T')[0], type: 'Konseling Individu', consent: false, technique: '', symptoms: '', rootCause: '', treatment: '', result: '', followUp: 'Selesai', satisfaction: '5', groupTopicType: 'Tugas' });
    setSelectedStudents([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.consent) { alert("Wajib mencentang 'Informed Consent'!"); return; }
    if (selectedStudents.length === 0) { alert("Pilih minimal 1 siswa."); return; }
    const payload = { ...formData, studentIds: selectedStudents };
    if (editingId) { onUpdate({ ...payload, id: editingId }); setEditingId(null); alert('Laporan berhasil diperbarui!'); } else { onAdd(payload); alert('Laporan Konseling Tersimpan!'); }
    setFormData({ ...formData, symptoms: '', rootCause: '', treatment: '', result: '', consent: false, technique: '', satisfaction: '5' });
    setSelectedStudents([]);
  };

  const serviceTypes = ["Konseling Individu", "Konseling Kelompok", "Bimbingan Klasikal", "Bimbingan Kelompok", "Konsultasi", "Konferensi Kasus", "Mediasi", "Advokasi", "Alih Tangan Kasus (Referral)", "Kunjungan Rumah (Home Visit)"];
  const getIndonesianDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
      <div className="lg:col-span-5 order-2 lg:order-1">
        <div className={`bg-white rounded-xl shadow-md border overflow-hidden sticky top-4 transition-colors ${editingId ? 'border-orange-400 ring-2 ring-orange-200' : 'border-slate-200'}`}>
          <div className={`p-4 text-white flex justify-between items-center ${editingId ? 'bg-orange-500' : 'bg-blue-600'}`}><h3 className="font-bold flex items-center gap-2">{editingId ? <Edit size={20}/> : <FileText size={20}/>} {editingId ? 'Mode Edit Laporan' : 'Form Layanan BK'}</h3>{editingId && <button onClick={handleCancelEdit} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded">Batal Edit</button>}</div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input type="date" required className="flex-1 p-2 border rounded text-sm w-full" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    <select className="flex-1 p-2 border rounded text-sm font-bold text-blue-800 w-full" value={formData.type} onChange={e => { setFormData({...formData, type: e.target.value}); if(!editingId) setSelectedStudents([]); }}>{serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><label className="text-xs font-bold text-slate-500 uppercase">Sasaran / Konseli ({selectedStudents.length})</label>{selectedStudents.length > 0 && (<button type="button" onClick={() => setSelectedStudents([])} className="text-xs text-red-500 hover:underline flex items-center gap-1"><Trash2 size={10}/> Clear All</button>)}</div>
                  {selectedStudents.length > 0 && (<div className="flex flex-wrap gap-2 mb-2 bg-white p-2 rounded border max-h-32 overflow-y-auto">{selectedStudents.map(sid => { const s = students.find(st => st.id === parseInt(sid)); return (<div key={sid} className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm"><span className="font-bold">{s?.name}</span> <span className="text-[10px] text-blue-400">({s?.class})</span><button type="button" onClick={() => handleRemoveStudentFromGroup(sid)} className="hover:text-red-500"><X size={12}/></button></div>)})}</div>)}
                  {isClassMode ? (<div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><List size={16} /></div><select className="w-full pl-10 p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-500" onChange={handleClassSelect} defaultValue=""><option value="" disabled>-- Pilih Kelas (Otomatis Pilih Semua Siswa) --</option>{schoolInfo.classes?.map(cls => <option key={cls} value={cls}>{cls}</option>)}</select></div>) : (<div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Search size={16} /></div><input type="text" placeholder={isSingleMode && selectedStudents.length > 0 ? "Siswa terpilih (Klik 'Clear' untuk ganti)" : "Ketik nama siswa..."} className="w-full pl-10 p-2 border rounded text-sm disabled:bg-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} disabled={isSingleMode && selectedStudents.length > 0} />{studentSearch && (<div className="absolute z-10 w-full bg-white border shadow-lg max-h-40 overflow-y-auto mt-1 rounded">{filteredStudentList.map(s => (<div key={s.id} onClick={() => handleAddStudentToGroup(s.id)} className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0 flex justify-between"><span><span className="font-bold">{s.name}</span> <span className="text-slate-500 text-xs">({s.class})</span></span><PlusCircle size={14} className="text-blue-400"/></div>))}{filteredStudentList.length === 0 && <div className="p-2 text-xs text-slate-400 text-center">Siswa tidak ditemukan</div>}</div>)}</div>)}
                  {isSingleMode && <p className="text-[10px] text-blue-500 italic">* Layanan ini disarankan untuk 1 siswa.</p>}
                </div>
                <div className="flex items-center gap-2 pt-1"><input type="checkbox" id="consent" className="w-4 h-4 text-blue-600 rounded" checked={formData.consent} onChange={e => setFormData({...formData, consent: e.target.checked})} /><label htmlFor="consent" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Persetujuan Layanan (Informed Consent)</label></div>
            </div>
            <div className="space-y-3">
                {['Konseling Kelompok', 'Bimbingan Kelompok'].includes(formData.type) && (<div><label className="text-xs font-bold text-slate-500 uppercase">Jenis Topik</label><div className="flex gap-4 mt-1"><label className="flex items-center gap-1 text-sm cursor-pointer"><input type="radio" name="topicType" checked={formData.groupTopicType === 'Tugas'} onChange={() => setFormData({...formData, groupTopicType: 'Tugas'})} /> Topik Tugas (Guru)</label><label className="flex items-center gap-1 text-sm cursor-pointer"><input type="radio" name="topicType" checked={formData.groupTopicType === 'Bebas'} onChange={() => setFormData({...formData, groupTopicType: 'Bebas'})} /> Topik Bebas (Siswa)</label></div></div>)}
                <div><label className="text-xs font-bold text-slate-500 uppercase">Teknik / Pendekatan</label><select className="w-full p-2 border rounded text-sm mt-1 bg-white" value={formData.technique} onChange={e => setFormData({...formData, technique: e.target.value})}><option value="">-- Pilih Pendekatan --</option>{TEKNIK_KONSELING.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Deskripsi Masalah / Topik</label><textarea required rows="2" className="w-full p-2 border rounded text-sm mt-1 focus:ring-2 ring-blue-100" placeholder="Deskripsikan..." value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})}></textarea></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase text-red-500">Analisis Diagnosa / Akar Masalah</label><textarea required rows="2" className="w-full p-2 border rounded text-sm mt-1 focus:ring-2 ring-red-100" placeholder="Analisis..." value={formData.rootCause} onChange={e => setFormData({...formData, rootCause: e.target.value})}></textarea></div>
            </div>
            <div className="space-y-3 pt-2 border-t border-slate-100">
                <textarea required rows="2" className="w-full p-2 border rounded text-sm" placeholder="Proses Layanan (Treatment)..." value={formData.treatment} onChange={e => setFormData({...formData, treatment: e.target.value})}></textarea>
                <div className="grid grid-cols-2 gap-2"><input className="w-full p-2 border rounded text-sm" placeholder="Hasil Sementara..." value={formData.result} onChange={e => setFormData({...formData, result: e.target.value})} /><select className="w-full p-2 border rounded text-sm font-bold text-blue-700 bg-blue-50" value={formData.followUp} onChange={e => setFormData({...formData, followUp: e.target.value})}><option value="Selesai">Masalah Selesai</option><option value="Pantau">Perlu Pantauan</option><option value="Referral">Alih Tangan Kasus</option></select></div>
            </div>
            <button type="submit" className={`w-full text-white py-3 rounded font-bold shadow-lg transition-transform active:scale-95 ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{editingId ? 'Update Laporan' : 'Simpan Laporan'}</button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-4 bg-slate-50 border-b font-bold text-slate-700 flex justify-between items-center"><span>Arsip Laporan</span><span className="text-xs font-normal bg-white px-2 py-1 rounded border hidden sm:block">Urutkan: Terbaru</span></div>
          <div className="divide-y divide-slate-100 max-h-[800px] overflow-y-auto">
            {sessions.slice().reverse().map(session => {
              let studentDisplay = [];
              if (session.studentIds) { studentDisplay = session.studentIds.map(id => { const st = students.find(s => s.id === id); return st ? `${st.name} (${st.class})` : 'Siswa Dihapus'; }); } else if (session.studentId) { const st = students.find(s => s.id === parseInt(session.studentId)); if (st) studentDisplay.push(`${st.name} (${st.class})`); }
              return (
                <div key={session.id} className={`p-4 md:p-5 hover:bg-blue-50 transition-colors group ${editingId === session.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2 sm:gap-0">
                    <div>
                      <div className="flex flex-wrap gap-1 mb-1">{studentDisplay.slice(0, 5).map((name, idx) => (<span key={idx} className="bg-slate-100 text-slate-700 text-[10px] sm:text-xs px-2 py-1 rounded font-medium border">{name}</span>))}{studentDisplay.length > 5 && <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded border">+{studentDisplay.length - 5} lainnya</span>}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap"><span className={`px-2 py-0.5 text-[10px] sm:text-xs rounded font-bold ${session.type.includes('Kelompok') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{session.type}</span><span className="text-[10px] sm:text-xs text-slate-400">{session.date}</span></div>
                    </div>
                    <div className="self-end sm:self-start flex gap-1">
                       <button onClick={() => handleEditClick(session)} className="flex items-center gap-1 text-xs sm:text-sm bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded transition-all shadow-sm"><Edit size={14}/> Edit</button>
                       <button onClick={() => setSelectedSession({...session, studentNames: studentDisplay})} className="flex items-center gap-1 text-xs sm:text-sm bg-white border border-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-slate-600 px-3 py-1.5 rounded transition-all shadow-sm"><Printer size={14}/> Cetak</button>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs sm:text-sm mt-3 grid grid-cols-1 md:grid-cols-2 gap-4"><div><p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Gejala / Tema</p><p className="text-slate-800 font-medium">{session.symptoms}</p></div><div><p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Diagnosa / Akar Masalah</p><p className="text-red-700 font-medium">{session.rootCause}</p></div></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedSession && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-slate-100 print:hidden"><h3 className="font-bold text-slate-700">Laporan Layanan BK</h3><button onClick={() => setSelectedSession(null)} className="hover:bg-red-100 p-1 rounded-full text-red-500"><X size={24}/></button></div>
            <div className="p-6 md:p-10 font-serif text-slate-900 leading-relaxed bg-white" id="print-area">
              <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-8">
                <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center">{schoolInfo.logo && <img src={schoolInfo.logo} alt="Logo Kiri" className="w-full h-full object-contain" />}</div>
                <div className="flex-1 text-center px-2">{schoolInfo.government && <h3 className="text-sm md:text-lg font-medium uppercase tracking-wide leading-tight">{schoolInfo.government}</h3>}{schoolInfo.department && <h3 className="text-sm md:text-lg font-bold uppercase tracking-wide leading-tight">{schoolInfo.department}</h3>}<h2 className="text-xl md:text-3xl font-extrabold uppercase tracking-wider my-1">{schoolInfo.name}</h2><p className="text-xs md:text-sm font-normal italic">{schoolInfo.address}</p></div>
                <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center">{schoolInfo.logo2 && <img src={schoolInfo.logo2} alt="Logo Kanan" className="w-full h-full object-contain" />}</div>
              </div>
              <div className="text-center mb-6"><h3 className="text-lg md:text-xl font-bold underline decoration-2 underline-offset-4">LAPORAN LAYANAN BK</h3></div>
              <table className="w-full mb-6 text-sm md:text-base"><tbody><tr><td className="w-32 md:w-48 py-1 font-bold align-top">Sasaran Layanan</td><td className="align-top">: <ul className="list-disc pl-5">{selectedSession.studentNames.map((n, i) => <li key={i}>{n}</li>)}</ul></td></tr><tr><td className="py-1 font-bold">Jenis Layanan</td><td>: {selectedSession.type}</td></tr><tr><td className="py-1 font-bold">Hari, Tanggal</td><td>: {getIndonesianDate(selectedSession.date)}</td></tr></tbody></table>
              <div className="mb-6"><h4 className="font-bold border-b border-black mb-2 uppercase text-sm">A. Gambaran Masalah / Topik</h4><p className="text-justify text-sm md:text-base">{selectedSession.symptoms}</p></div>
              <div className="mb-6"><h4 className="font-bold border-b border-black mb-2 uppercase text-sm">B. Diagnosa / Analisis</h4><p className="text-justify text-sm md:text-base">{selectedSession.rootCause}</p></div>
              <div className="mb-6"><h4 className="font-bold border-b border-black mb-2 uppercase text-sm">C. Pelaksanaan Layanan</h4><p className="text-sm md:text-base"><span className="font-bold">Teknik:</span> {selectedSession.technique}</p><p className="mt-2 text-justify text-sm md:text-base">{selectedSession.treatment}</p></div>
              <div className="mb-6"><h4 className="font-bold border-b border-black mb-2 uppercase text-sm">D. Evaluasi</h4><p className="text-sm md:text-base"><span className="font-bold">Hasil:</span> {selectedSession.result}</p><p className="text-sm md:text-base"><span className="font-bold">Tindak Lanjut:</span> {selectedSession.followUp}</p></div>
              <div className="mt-16 text-right text-sm md:text-base"><p>{schoolInfo.city || '.........'}, {getIndonesianDate(selectedSession.date)}</p><p>Konselor / Guru BK</p><br/><br/><br/><br/><p className="font-bold underline">{schoolInfo.counselor}</p><p>NIP. {schoolInfo.counselorNip}</p></div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3 print:hidden"><button onClick={() => window.print()} className="bg-blue-800 text-white px-6 py-2 rounded shadow-lg flex items-center gap-2 hover:bg-blue-900"><Printer size={18}/> Cetak Dokumen Resmi</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// 4. RPL GENERATOR
function RPLGenerator({ rpls, onAdd, schoolInfo, userProfile }) {
  const [form, setForm] = useState({ topic:'', skkpd:'', target:'', method:'', media:'', time:'', iceBreaking:'', goal:'', evalProcess:'', evalResult:'' });
  const handleSubmit = (e) => { e.preventDefault(); onAdd(form); setForm({ topic:'', skkpd:'', target:'', method:'', media:'', time:'', iceBreaking:'', goal:'', evalProcess:'', evalResult:'' }); alert('RPL Berhasil Dibuat!'); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
      <div className="lg:col-span-1">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 h-fit sticky top-24">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2"><FilePlus size={20} className="text-blue-600"/> Buat RPL Klasikal</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required className="w-full p-2 border rounded" placeholder="Topik Layanan" value={form.topic} onChange={e=>setForm({...form, topic:e.target.value})} />
            <select required className="w-full p-2 border rounded text-sm bg-white" value={form.skkpd} onChange={e=>setForm({...form, skkpd:e.target.value})}><option value="">-- Pilih Aspek SKKPD --</option>{SKKPD_LIST.map(item => <option key={item} value={item}>{item}</option>)}</select>
            <div className="grid grid-cols-2 gap-2"><input required className="w-full p-2 border rounded text-sm" placeholder="Sasaran (Kls)" value={form.target} onChange={e=>setForm({...form, target:e.target.value})} /><input required className="w-full p-2 border rounded text-sm" placeholder="Waktu (1x45)" value={form.time} onChange={e=>setForm({...form, time:e.target.value})} /></div>
            <input required className="w-full p-2 border rounded text-sm" placeholder="Metode" value={form.method} onChange={e=>setForm({...form, method:e.target.value})} /><input className="w-full p-2 border rounded text-sm" placeholder="Media" value={form.media} onChange={e=>setForm({...form, media:e.target.value})} /><input className="w-full p-2 border rounded text-sm bg-blue-50" placeholder="Ice Breaking" value={form.iceBreaking} onChange={e=>setForm({...form, iceBreaking:e.target.value})} /><textarea required rows="2" className="w-full p-2 border rounded text-sm" placeholder="Tujuan Layanan..." value={form.goal} onChange={e=>setForm({...form, goal:e.target.value})} />
            <div className="space-y-2 pt-2 border-t"><label className="text-xs font-bold text-slate-400">Rencana Evaluasi</label><input className="w-full p-2 border rounded text-sm" placeholder="Evaluasi Proses" value={form.evalProcess} onChange={e=>setForm({...form, evalProcess:e.target.value})} /><input className="w-full p-2 border rounded text-sm" placeholder="Evaluasi Hasil" value={form.evalResult} onChange={e=>setForm({...form, evalResult:e.target.value})} /></div>
            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium">Generate RPL</button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2 space-y-6">
        {rpls.map(rpl => (
          <div key={rpl.id} className="bg-white p-8 rounded-lg shadow-md border border-slate-200 relative group font-serif">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => window.print()} className="bg-slate-800 text-white px-3 py-1 rounded text-sm flex items-center gap-2"><Printer size={14}/> Cetak</button></div>
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
               <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">{schoolInfo.logo && <img src={schoolInfo.logo} alt="Logo Kiri" className="w-full h-full object-contain" />}</div>
               <div className="flex-1 text-center"><h4 className="font-bold text-lg md:text-xl uppercase">Rencana Pelaksanaan Layanan (RPL)</h4><p className="text-sm font-bold">{schoolInfo.name}</p></div>
               <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">{schoolInfo.logo2 && <img src={schoolInfo.logo2} alt="Logo Kanan" className="w-full h-full object-contain" />}</div>
            </div>
            <table className="w-full text-sm mb-6"><tbody><tr className="border-b border-slate-100"><td className="py-2 w-40 font-bold">1. Topik Layanan</td><td>: {rpl.topic}</td></tr><tr className="border-b border-slate-100"><td className="py-2 font-bold">2. Aspek SKKPD</td><td>: {rpl.skkpd}</td></tr><tr className="border-b border-slate-100"><td className="py-2 font-bold">3. Sasaran / Waktu</td><td>: {rpl.target} / {rpl.time}</td></tr><tr className="border-b border-slate-100"><td className="py-2 font-bold">4. Metode & Media</td><td>: {rpl.method} / {rpl.media || '-'}</td></tr></tbody></table>
            <div className="mb-4"><h5 className="font-bold text-sm uppercase border-b border-slate-300 mb-2">A. Tujuan Layanan</h5><p className="text-justify text-sm">{rpl.goal}</p></div>
            <div className="mb-4"><h5 className="font-bold text-sm uppercase border-b border-slate-300 mb-2">B. Kegiatan Layanan</h5><ul className="list-decimal pl-5 text-sm space-y-1"><li><span className="font-bold">Pendahuluan:</span> Salam, Doa, dan Ice Breaking ({rpl.iceBreaking || 'Sederhana'})</li><li><span className="font-bold">Inti:</span> Penyampaian materi, diskusi kelompok, dan presentasi.</li><li><span className="font-bold">Penutup:</span> Kesimpulan dan refleksi.</li></ul></div>
            <div className="mb-6"><h5 className="font-bold text-sm uppercase border-b border-slate-300 mb-2">C. Evaluasi</h5><p className="text-sm"><span className="font-bold">Proses:</span> {rpl.evalProcess}</p><p className="text-sm"><span className="font-bold">Hasil:</span> {rpl.evalResult}</p></div>
            <div className="flex justify-between items-end mt-12 px-8 text-center text-sm">
                <div><p>Mengetahui,</p><p>Kepala Sekolah</p><br/><br/><br/><p className="font-bold border-t border-black pt-1 w-40 mx-auto">{schoolInfo.principal}</p><p>NIP. {schoolInfo.principalNip}</p></div>
                <div><p>{schoolInfo.city || '.......'}, {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p><p>Guru BK / Konselor</p><br/><br/><br/><p className="font-bold border-t border-black pt-1 w-40 mx-auto">{schoolInfo.counselor}</p><p>NIP. {schoolInfo.counselorNip}</p></div>
            </div>
            {userProfile?.role === 'super_admin' && <div className="mt-4 text-[10px] text-gray-400 text-center border-t pt-2">Dibuat oleh: {rpl.teacherName}</div>}
          </div>
        ))}
        {rpls.length === 0 && <div className="text-center py-20 text-slate-400 bg-slate-100 rounded border border-dashed border-slate-300">Belum ada data RPL. Silakan buat di menu sebelah kiri.</div>}
      </div>
    </div>
  );
}

// 5. REPORTS (NEW & IMPROVED)
function Reports({ students, sessions, schoolInfo, userProfile }) {
  const [reportType, setReportType] = useState('stats'); 
  
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {['stats', 'journal', 'individual', 'class'].map((tab) => (
          <button
            key={tab}
            onClick={() => setReportType(tab)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              reportType === tab 
                ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600 shadow-sm' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {tab === 'stats' ? 'Statistik' : tab === 'journal' ? 'Jurnal Bulanan' : tab === 'individual' ? 'Rekam Jejak Siswa' : 'Laporan Kelas'}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 min-h-[400px]">
        {reportType === 'stats' && <StatisticsDashboard sessions={sessions} students={students} />}
        {reportType === 'journal' && <JournalReportView sessions={sessions} students={students} schoolInfo={schoolInfo} />}
        {reportType === 'individual' && <IndividualReportView sessions={sessions} students={students} schoolInfo={schoolInfo} />}
        {reportType === 'class' && <ClassReportView sessions={sessions} students={students} schoolInfo={schoolInfo} />}
      </div>
    </div>
  );
}

// 5a. STATISTICS DASHBOARD (NEW INFOGRAPHICS)
function StatisticsDashboard({ sessions, students }) {
  const totalCases = sessions.length;
  const resolved = sessions.filter(s => s.followUp === 'Selesai').length;
  const monitoring = sessions.filter(s => s.followUp === 'Pantau').length;
  const referral = sessions.filter(s => s.followUp === 'Alih Tangan Kasus (Referral)').length;
  
  const resolvedPct = totalCases ? Math.round((resolved / totalCases) * 100) : 0;

  const serviceStats = sessions.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {});

  const classStats = useMemo(() => {
    const stats = {};
    sessions.forEach(s => {
      let involvedStudents = [];
      if(s.studentIds) involvedStudents = s.studentIds.map(id => students.find(st => st.id === id));
      else if(s.studentId) involvedStudents = [students.find(st => st.id === parseInt(s.studentId))];
      
      involvedStudents.forEach(st => {
        if(st && st.class) {
          stats[st.class] = (stats[st.class] || 0) + 1;
        }
      });
    });
    return Object.entries(stats).sort((a,b) => b[1] - a[1]);
  }, [sessions, students]);

  return (
    <div className="space-y-8 animate-fade-in">
      <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg"><Activity size={24} className="text-blue-600"/> Dashboard Kinerja BK</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Status Penyelesaian Masalah</h4>
            <div className="flex items-center justify-center gap-4">
               <div className="relative w-24 h-24 rounded-full border-8 border-slate-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">{resolvedPct}%</span>
                  <div className="absolute inset-0 rounded-full border-8 border-green-500 border-t-transparent border-l-transparent transform -rotate-45 opacity-70"></div>
               </div>
               <div className="text-xs space-y-2">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Selesai ({resolved})</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-400 rounded-full"></div> Pantau ({monitoring})</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Referral ({referral})</div>
               </div>
            </div>
         </div>
         <div className="col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><BarChart2 size={16}/> Distribusi Jenis Layanan</h4>
            <div className="space-y-3">
               {Object.keys(serviceStats).slice(0, 5).map(type => {
                 const pct = Math.round((serviceStats[type] / totalCases) * 100);
                 return (
                   <div key={type}>
                     <div className="flex justify-between text-xs mb-1">
                       <span className="font-medium text-slate-700">{type}</span>
                       <span className="text-slate-500">{serviceStats[type]} ({pct}%)</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-2">
                       <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                     </div>
                   </div>
                 )
               })}
            </div>
         </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><TrendingUp size={16}/> Peta Kerawanan / Aktivitas Kelas</h4>
         <div className="flex flex-wrap gap-4">
            {classStats.length > 0 ? classStats.map(([cls, count]) => (
               <div key={cls} className="flex-1 min-w-[100px] bg-slate-50 p-3 rounded border border-slate-200 text-center">
                  <h5 className="text-sm font-bold text-slate-700">{cls}</h5>
                  <p className={`text-2xl font-extrabold mt-1 ${count > 5 ? 'text-red-500' : count > 2 ? 'text-orange-500' : 'text-green-500'}`}>{count}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Layanan</p>
               </div>
            )) : <p className="text-slate-400 italic text-sm w-full text-center">Belum ada data aktivitas kelas.</p>}
         </div>
      </div>
    </div>
  )
}

function JournalReportView({ sessions, students, schoolInfo }) {
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showPreview, setShowPreview] = useState(false);
  
  const monthlySessions = sessions.filter(s => s.date.startsWith(reportMonth));
  const getIndonesianDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-4 border-b pb-4">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Bulan Laporan</label>
          <input type="month" className="border p-2 rounded w-full sm:w-64" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
        </div>
        <button onClick={() => setShowPreview(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 w-full sm:w-auto">
          <Printer size={18}/> Preview & Cetak
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse border border-slate-200">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="p-2 border border-slate-300 w-10">No</th>
              <th className="p-2 border border-slate-300 w-32">Tanggal</th>
              <th className="p-2 border border-slate-300">Kegiatan / Layanan</th>
              <th className="p-2 border border-slate-300">Sasaran</th>
              <th className="p-2 border border-slate-300">Hasil</th>
            </tr>
          </thead>
          <tbody>
            {monthlySessions.map((s, idx) => {
               let names = s.studentIds ? s.studentIds.map(id => students.find(st => st.id === id)?.name).join(", ") : 'Siswa Dihapus';
               return (
                 <tr key={idx} className="hover:bg-slate-50">
                   <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                   <td className="p-2 border border-slate-300">{getIndonesianDate(s.date)}</td>
                   <td className="p-2 border border-slate-300">
                      <span className="font-bold block text-xs uppercase text-blue-600">{s.type}</span>
                      {s.symptoms}
                   </td>
                   <td className="p-2 border border-slate-300 text-xs">{names}</td>
                   <td className="p-2 border border-slate-300">{s.result}</td>
                 </tr>
               )
            })}
            {monthlySessions.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-400">Tidak ada data di bulan ini.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* MODAL PREVIEW */}
      {showPreview && (
        <PrintModal onClose={() => setShowPreview(false)} title={`Jurnal Kegiatan Bulan ${reportMonth}`}>
           <div className="text-center mb-6">
              <h3 className="text-xl font-bold underline">JURNAL KEGIATAN BIMBINGAN DAN KONSELING</h3>
              <p className="mt-1">Bulan: <span className="font-bold">{new Date(reportMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span></p>
           </div>
           <table className="w-full border-collapse border border-black text-xs">
             <thead>
               <tr className="bg-gray-100 text-center">
                 <th className="border border-black p-2 w-8">No</th>
                 <th className="border border-black p-2 w-24">Hari/Tanggal</th>
                 <th className="border border-black p-2">Sasaran (Siswa/Kelas)</th>
                 <th className="border border-black p-2 w-32">Jenis Kegiatan</th>
                 <th className="border border-black p-2">Uraian Kegiatan / Masalah</th>
                 <th className="border border-black p-2">Hasil / Tindak Lanjut</th>
               </tr>
             </thead>
             <tbody>
               {monthlySessions.map((s, idx) => {
                 let names = s.studentIds ? s.studentIds.map(id => students.find(st => st.id === id)?.name).join(", ") : 'Siswa Dihapus';
                 return (
                   <tr key={idx}>
                     <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                     <td className="border border-black p-2 align-top">{getIndonesianDate(s.date)}</td>
                     <td className="border border-black p-2 align-top">{names}</td>
                     <td className="border border-black p-2 align-top">{s.type}</td>
                     <td className="border border-black p-2 align-top text-justify">{s.symptoms}</td>
                     <td className="border border-black p-2 align-top">{s.result} ({s.followUp})</td>
                   </tr>
                 )
               })}
             </tbody>
           </table>
           <SignatureSection schoolInfo={schoolInfo} dateLabel={`............... , ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`} />
        </PrintModal>
      )}
    </div>
  );
}

function IndividualReportView({ sessions, students, schoolInfo }) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const studentHistory = useMemo(() => {
    if (!selectedStudentId) return [];
    const id = parseInt(selectedStudentId);
    return sessions.filter(s => 
      (s.studentId && parseInt(s.studentId) === id) || 
      (s.studentIds && s.studentIds.includes(id))
    );
  }, [selectedStudentId, sessions]);

  const selectedStudent = students.find(s => s.id === parseInt(selectedStudentId));
  const getIndonesianDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-4 border-b pb-4">
        <div className="w-full sm:w-auto flex-1">
          <label className="block text-sm font-bold text-slate-700 mb-1">Cari Nama Siswa</label>
          <select className="border p-2 rounded w-full" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
             <option value="">-- Pilih Siswa --</option>
             {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
               <option key={s.id} value={s.id}>{s.name} - {s.class}</option>
             ))}
          </select>
        </div>
        <button disabled={!selectedStudentId} onClick={() => setShowPreview(true)} className="bg-blue-600 disabled:bg-slate-300 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 w-full sm:w-auto">
          <Printer size={18}/> Cetak Rekam Jejak
        </button>
      </div>

      {selectedStudent && (
        <div className="bg-slate-50 p-4 rounded border mb-4">
           <h4 className="font-bold text-lg">{selectedStudent.name} ({selectedStudent.class})</h4>
           <p className="text-sm text-slate-600">Total Layanan Diterima: <strong>{studentHistory.length} Kali</strong></p>
        </div>
      )}

      {/* MODAL PREVIEW */}
      {showPreview && selectedStudent && (
        <PrintModal onClose={() => setShowPreview(false)} title={`Laporan Individu: ${selectedStudent.name}`}>
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

           <table className="w-full border-collapse border border-black text-xs">
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
               {studentHistory.map((s, idx) => (
                   <tr key={idx}>
                     <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                     <td className="border border-black p-2 align-top">{getIndonesianDate(s.date)}</td>
                     <td className="border border-black p-2 align-top">{s.type}</td>
                     <td className="border border-black p-2 align-top text-justify">{s.symptoms}</td>
                     <td className="border border-black p-2 align-top">{s.followUp}</td>
                   </tr>
               ))}
               {studentHistory.length === 0 && <tr><td colSpan="5" className="text-center p-4">Belum ada riwayat layanan.</td></tr>}
             </tbody>
           </table>
           <SignatureSection schoolInfo={schoolInfo} dateLabel={`${schoolInfo.city}, ${getIndonesianDate(new Date())}`} />
        </PrintModal>
      )}
    </div>
  );
}

function ClassReportView({ sessions, students, schoolInfo }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Cari semua sesi yang melibatkan siswa dari kelas ini
  const classHistory = useMemo(() => {
    if (!selectedClass) return [];
    // 1. Get all student IDs in this class
    const studentIdsInClass = students.filter(s => s.class === selectedClass).map(s => s.id);
    
    // 2. Filter sessions that involve any of these IDs
    return sessions.filter(s => {
       // Check single ID
       if (s.studentId && studentIdsInClass.includes(parseInt(s.studentId))) return true;
       // Check array IDs
       if (s.studentIds) {
          return s.studentIds.some(id => studentIdsInClass.includes(id));
       }
       return false;
    });
  }, [selectedClass, sessions, students]);

  const getIndonesianDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-4 border-b pb-4">
        <div className="w-full sm:w-auto flex-1">
          <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Kelas</label>
          <select className="border p-2 rounded w-full" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
             <option value="">-- Pilih Kelas --</option>
             {schoolInfo.classes?.map(cls => (
               <option key={cls} value={cls}>{cls}</option>
             ))}
          </select>
        </div>
        <button disabled={!selectedClass} onClick={() => setShowPreview(true)} className="bg-blue-600 disabled:bg-slate-300 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 w-full sm:w-auto">
          <Printer size={18}/> Cetak Laporan Kelas
        </button>
      </div>

      {selectedClass && (
        <div className="bg-slate-50 p-4 rounded border mb-4">
           <h4 className="font-bold text-lg">Laporan Situasi Kelas: {selectedClass}</h4>
           <p className="text-sm text-slate-600">Total Aktivitas BK di Kelas ini: <strong>{classHistory.length} Kegiatan</strong></p>
        </div>
      )}

      {/* MODAL PREVIEW */}
      {showPreview && selectedClass && (
        <PrintModal onClose={() => setShowPreview(false)} title={`Laporan Kelas: ${selectedClass}`}>
           <div className="text-center mb-6">
              <h3 className="text-xl font-bold underline uppercase">Laporan Situasi Kelas</h3>
              <p className="text-sm font-bold mt-1">REKAPITULASI LAYANAN BK - KELAS {selectedClass}</p>
           </div>
           
           <table className="w-full border-collapse border border-black text-xs">
             <thead>
               <tr className="bg-gray-100 text-center">
                 <th className="border border-black p-2 w-8">No</th>
                 <th className="border border-black p-2 w-24">Tanggal</th>
                 <th className="border border-black p-2">Siswa Terlibat</th>
                 <th className="border border-black p-2">Jenis Layanan</th>
                 <th className="border border-black p-2">Topik / Masalah</th>
                 <th className="border border-black p-2">Keterangan</th>
               </tr>
             </thead>
             <tbody>
               {classHistory.map((s, idx) => {
                   // Filter nama siswa hanya yang ada di kelas ini
                   let involvedNames = [];
                   if(s.studentIds) {
                      involvedNames = s.studentIds
                        .map(id => students.find(st => st.id === id))
                        .filter(st => st && st.class === selectedClass)
                        .map(st => st.name);
                   } else if(s.studentId) {
                      const st = students.find(st => st.id === parseInt(s.studentId));
                      if(st && st.class === selectedClass) involvedNames.push(st.name);
                   }

                   return (
                     <tr key={idx}>
                       <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                       <td className="border border-black p-2 align-top">{getIndonesianDate(s.date)}</td>
                       <td className="border border-black p-2 align-top">{involvedNames.join(', ')}</td>
                       <td className="border border-black p-2 align-top">{s.type}</td>
                       <td className="border border-black p-2 align-top text-justify">{s.symptoms}</td>
                       <td className="border border-black p-2 align-top">{s.followUp}</td>
                     </tr>
                   )
               })}
               {classHistory.length === 0 && <tr><td colSpan="6" className="text-center p-4">Belum ada layanan untuk siswa di kelas ini.</td></tr>}
             </tbody>
           </table>
           <SignatureSection schoolInfo={schoolInfo} dateLabel={`${schoolInfo.city}, ${getIndonesianDate(new Date())}`} />
        </PrintModal>
      )}
    </div>
  );
}

// 6. HELPER COMPONENTS FOR PRINTING
// --- NEW: CSS FOR PRINTING ---
function PrintModal({ children, onClose, title }) {
  const localSchool = localStorage.getItem('bk_school_info_v3');
  const schoolInfo = localSchool ? JSON.parse(localSchool) : {};

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:block print:relative print:inset-auto print:bg-white print:z-auto">
      {/* INJECT PRINT STYLES */}
      <style>{`
        @media print {
          @page {
            size: auto; /* Uses user's printer settings (A4/F4) */
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          #print-modal-content, #print-modal-content * {
            visibility: visible;
          }
          #print-modal-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 0;
            background: white;
            overflow: visible !important;
          }
          /* Ensure text and tables break nicely */
          table, tr, td, th {
            page-break-inside: avoid;
          }
          .signature-section {
            page-break-inside: avoid;
          }
          /* Hide scrollbars */
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-lg shadow-2xl flex flex-col print:shadow-none print:max-h-none print:overflow-visible print:rounded-none">
        <div className="p-4 border-b flex justify-between items-center bg-slate-100 print:hidden">
          <h3 className="font-bold text-slate-700">{title}</h3>
          <button onClick={onClose} className="hover:bg-red-100 p-1 rounded-full text-red-500"><X size={24}/></button>
        </div>
        
        <div className="p-10 font-serif text-slate-900 leading-relaxed bg-white flex-1 min-h-[500px] print:p-0" id="print-modal-content">
           {/* KOP SURAT STANDARD */}
           <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-8">
              <div className="w-20 h-20 flex items-center justify-center">{schoolInfo.logo && <img src={schoolInfo.logo} alt="Logo Kiri" className="w-full h-full object-contain" />}</div>
              <div className="flex-1 text-center px-2">
                {schoolInfo.government && <h3 className="text-lg font-medium uppercase tracking-wide leading-tight">{schoolInfo.government}</h3>}
                {schoolInfo.department && <h3 className="text-lg font-bold uppercase tracking-wide leading-tight">{schoolInfo.department}</h3>}
                <h2 className="text-2xl font-extrabold uppercase my-1">{schoolInfo.name || 'NAMA SEKOLAH'}</h2>
                <p className="text-sm italic mb-2">{schoolInfo.address || 'Alamat Sekolah'}</p>
              </div>
              <div className="w-20 h-20 flex items-center justify-center">{schoolInfo.logo2 && <img src={schoolInfo.logo2} alt="Logo Kanan" className="w-full h-full object-contain" />}</div>
           </div>

           {/* CONTENT */}
           {children}
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3 print:hidden sticky bottom-0">
          <button onClick={() => window.print()} className="bg-blue-800 text-white px-6 py-2 rounded shadow-lg flex items-center gap-2 hover:bg-blue-900">
            <Printer size={18}/> Cetak Dokumen
          </button>
        </div>
      </div>
    </div>
  );
}

function SignatureSection({ schoolInfo, dateLabel }) {
  return (
    <div className="grid grid-cols-2 gap-10 mt-12 text-center break-inside-avoid signature-section">
      <div>
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <br/><br/><br/><br/>
          <p className="font-bold underline">{schoolInfo.principal || '......................'}</p>
          <p>NIP. {schoolInfo.principalNip || '......................'}</p>
      </div>
      <div>
          <p>{dateLabel}</p>
          <p>Guru BK / Konselor</p>
          <br/><br/><br/><br/>
          <p className="font-bold underline">{schoolInfo.counselor || '......................'}</p>
          <p>NIP. {schoolInfo.counselorNip || '......................'}</p>
      </div>
   </div>
  )
}

// 6. SETTINGS MANAGER
function SettingsManager({ schoolInfo, onSave, userProfile }) {
  const [form, setForm] = useState(schoolInfo);
  const [newClass, setNewClass] = useState("");
  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);

  useEffect(() => { setForm(schoolInfo); }, [schoolInfo]);

  const handleAddClass = () => {
    if (newClass.trim() === "") return;
    if (form.classes.includes(newClass.toUpperCase())) { alert("Kelas sudah ada!"); return; }
    const updatedClasses = [...(form.classes || []), newClass.toUpperCase()].sort();
    setForm({ ...form, classes: updatedClasses });
    setNewClass("");
  };

  const handleRemoveClass = (cls) => { if (window.confirm(`Hapus kelas ${cls}?`)) setForm({ ...form, classes: form.classes.filter(c => c !== cls) }); };

  const handleLogoUpload = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert("Ukuran file terlalu besar (Max 2MB)"); return; }
      const reader = new FileReader();
      reader.onloadend = () => { setForm({ ...form, [key]: reader.result }); };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = (key) => setForm({ ...form, [key]: null });

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 p-4 text-white flex items-center gap-2"><Settings size={20}/> <h3 className="font-bold">Setup Informasi Sekolah</h3></div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-blue-50 p-3 rounded border border-blue-100 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white border rounded flex items-center justify-center overflow-hidden mb-2">
                     {form.logo ? <img src={form.logo} alt="Kiri" className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-300"/>}
                  </div>
                  <h4 className="font-bold text-xs text-blue-800 mb-1">Logo Kiri</h4>
                  <div className="flex gap-1">
                    <input type="file" ref={fileInputRef1} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logo')} />
                    <button onClick={() => fileInputRef1.current.click()} className="text-[10px] bg-white border border-blue-300 px-2 py-1 rounded text-blue-600">Upload</button>
                    {form.logo && <button onClick={() => handleRemoveLogo('logo')} className="text-[10px] text-red-500">Hapus</button>}
                  </div>
               </div>
               <div className="bg-blue-50 p-3 rounded border border-blue-100 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white border rounded flex items-center justify-center overflow-hidden mb-2">
                     {form.logo2 ? <img src={form.logo2} alt="Kanan" className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-300"/>}
                  </div>
                  <h4 className="font-bold text-xs text-blue-800 mb-1">Logo Kanan</h4>
                  <div className="flex gap-1">
                    <input type="file" ref={fileInputRef2} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logo2')} />
                    <button onClick={() => fileInputRef2.current.click()} className="text-[10px] bg-white border border-blue-300 px-2 py-1 rounded text-blue-600">Upload</button>
                    {form.logo2 && <button onClick={() => handleRemoveLogo('logo2')} className="text-[10px] text-red-500">Hapus</button>}
                  </div>
               </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-blue-600 border-b pb-2">Identitas Sekolah (Kop Surat)</h4>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Pemerintahan</label><input required className="w-full p-2 border rounded" value={form.government} onChange={e => setForm({...form, government: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Dinas</label><input required className="w-full p-2 border rounded" value={form.department} onChange={e => setForm({...form, department: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Sekolah</label><input required className="w-full p-2 border rounded" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label><textarea required className="w-full p-2 border rounded" rows="2" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Kota / Tempat Tanda Tangan</label><input required className="w-full p-2 border rounded" value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} /></div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-blue-600 border-b pb-2">Data Pejabat (Tanda Tangan)</h4>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Kepala Sekolah</label><input required className="w-full p-2 border rounded" value={form.principal} onChange={e => setForm({...form, principal: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">NIP Kepala Sekolah</label><input className="w-full p-2 border rounded" value={form.principalNip} onChange={e => setForm({...form, principalNip: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Guru BK</label><input required className="w-full p-2 border rounded" value={form.counselor} onChange={e => setForm({...form, counselor: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">NIP Guru BK</label><input className="w-full p-2 border rounded" value={form.counselorNip} onChange={e => setForm({...form, counselorNip: e.target.value})} /></div>
            </div>
          </div>
          <div className="space-y-6 border-l pl-0 md:pl-8 border-slate-200">
            <h4 className="font-bold text-blue-600 border-b pb-2 flex items-center justify-between"><span>Manajemen Data Kelas</span><span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">Total: {form.classes?.length || 0}</span></h4>
            <div className="flex gap-2">
              <input className="flex-1 p-2 border rounded uppercase" placeholder="Nama Kelas" value={newClass} onChange={e => setNewClass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddClass()} />
              <button type="button" onClick={handleAddClass} className="bg-green-600 hover:bg-green-700 text-white px-3 rounded flex items-center"><PlusCircle size={20}/></button>
            </div>
            <div className="bg-slate-50 rounded border p-2 h-[400px] overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {form.classes?.map(cls => (
                  <div key={cls} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-slate-100 group hover:border-blue-300">
                    <span className="font-medium text-slate-700">{cls}</span>
                    <button type="button" onClick={() => handleRemoveClass(cls)} className="text-slate-400 hover:text-red-500 transition-colors"><MinusCircle size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button onClick={() => onSave(form)} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg"><Save size={18}/> Simpan Semua Pengaturan</button>
        </div>
      </div>
    </div>
  );
}