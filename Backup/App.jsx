import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, FileText, LogOut, Printer, Save, Calendar, Clock, 
  UserCheck, CheckCircle, Search, Trash2, Edit, 
  Settings, Upload, Download, ChevronDown, ChevronRight, Key, 
  RefreshCcw, FileDown, XCircle, Menu, X, LayoutDashboard, Activity, Briefcase, Lock, Shield, Clipboard, BookOpen, GraduationCap, Image as ImageIcon, Book, FilePenLine, FileQuestion, Plus, Database, HelpCircle, Timer, PlayCircle, StopCircle, ArrowLeft, ArrowRight, Check, BarChart2, UserCog, Award
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  deleteDoc,
  updateDoc, 
  onSnapshot, 
  writeBatch,
  query,
  where,
  getDocs
} from "firebase/firestore";

// --- KONFIGURASI DATABASE ---
const MANUAL_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDLsdke_yGc2uJTkZOTw-6be2wcotHztUI",
  authDomain: "aplikasi-sekolah-a3ed2.firebaseapp.com",
  projectId: "aplikasi-sekolah-a3ed2",
  storageBucket: "aplikasi-sekolah-a3ed2.firebasestorage.app",
  messagingSenderId: "237690044864",
  appId: "1:237690044864:web:07f1fe45c3e6d1a3288825"
};

let firebaseConfig;
try {
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    firebaseConfig = MANUAL_FIREBASE_CONFIG;
  }
} catch (error) {
  console.warn("Menggunakan konfigurasi manual fallback");
  firebaseConfig = MANUAL_FIREBASE_CONFIG;
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Default Data & Logo (Permanen)
const APP_LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgP4VgYAak7uwK7YwmpF38Q5H-0K3qbRhondc84omwKxZt32e4sBpDmEF0TlMaEn925GZWRfaTJ_RgG8R6atO1LFuG4sHYRZK3-1jH8dslSsW26moVDwkaqG9b69Oj1TPpaL0048bhH0HspqE5aGkVlr0hFZvexSl4IfeeRlGXyA4dttDj4S8-4K8EOihU9/s320/digital-school-logo.png";
const DEFAULT_KOP_LOGO = "https://cdn-icons-png.flaticon.com/512/2991/2991148.png"; 

// Helper Path Firestore
const getCollectionPath = (collName) => {
    return collection(db, 'artifacts', appId, 'public', 'data', collName);
};

// --- INITIAL SEEDING ---
const INITIAL_ADMIN = {
  username: 'guru',
  password: '123',
  role: 'admin',
  nama: 'Bapak/Ibu Guru',
  jabatan: 'Wali Kelas / Guru Mapel',
  no: 'NIP.123456'
};

const INITIAL_SETTINGS = {
  opdName: 'SMAN 1 Contoh', 
  opdShort: 'Aplikasi Sekolah Digital',
  parentAgency: 'Dinas Pendidikan & Kebudayaan', 
  kabupaten: 'Pemerintah Provinsi ...', 
  address: 'Jl. Pendidikan No. 1, Kota Pelajar',
  logoUrl: DEFAULT_KOP_LOGO, 
  logoUrl2: '', 
  signingCity: 'Bobong', 
  dateFormat: 'long', 
  headmasterName: 'Nama Kepala Sekolah',
  headmasterNip: '....................',
  headmasterRank: 'Pembina Tk. I',
  teacherName: 'Nama Guru Pengampu',
  teacherNip: '....................',
  teacherRank: 'Guru Muda',
  teacherType: 'mapel', 
  subjects: ['Matematika', 'Bahasa Indonesia', 'IPA', 'IPS', 'PKN', 'Tematik'],
  currentClass: 'X IPA 1' 
};

// --- UTILS ---
const formatDateIndo = (dateStr) => {
  if (!dateStr) return '';
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('id-ID', options);
};

const getSignatureDate = (settings) => {
  const today = new Date();
  let dateStr = '';
  
  if (settings.dateFormat === 'short') {
     dateStr = today.toLocaleDateString('id-ID');
  } else if (settings.dateFormat === 'numeric') {
     dateStr = today.toISOString().split('T')[0];
  } else {
     dateStr = today.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
  }

  const city = settings.signingCity ? `${settings.signingCity}, ` : '';
  return `${city}${dateStr}`;
};

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SESI_LIST = [
  'Jam Ke-1 (07.15-08.00)', 'Jam Ke-2 (08.00-08.45)', 'Jam Ke-3 (08.45-09.30)',
  'Jam Ke-4 (09.45-10.30)', 'Jam Ke-5 (10.30-11.15)', 'Jam Ke-6 (11.15-12.00)',
  'Jam Ke-7 (12.30-13.15)', 'Jam Ke-8 (13.15-14.00)', 'Ekstrakurikuler', 'Tambahan'
];

const DEFAULT_CLASSES = ['X IPA 1', 'X IPA 2', 'X IPS 1', 'X IPS 2'];

// --- MAIN COMPONENT ---
export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null); 
  
  // Data States
  const [students, setStudents] = useState([]); 
  const [attendance, setAttendance] = useState([]);
  const [journals, setJournals] = useState([]); 
  const [questions, setQuestions] = useState([]); 
  const [examSessions, setExamSessions] = useState([]); 
  const [examResults, setExamResults] = useState([]); 
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  
  // Print Settings State
  const [printSettings, setPrintSettings] = useState({ orientation: 'portrait', size: 'auto' });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dynamicClasses = React.useMemo(() => {
    const classes = new Set(students.filter(s => s.role !== 'admin' && s.kelas).map(s => s.kelas));
    const sorted = Array.from(classes).sort();
    return sorted.length > 0 ? sorted : DEFAULT_CLASSES;
  }, [students]);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => { 
        if (user) setFirebaseUser(user); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const unsubStud = onSnapshot(getCollectionPath('users'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (!data.find(d => d.role === 'admin')) {
         setDoc(doc(getCollectionPath('users'), 'admin_master'), INITIAL_ADMIN);
      }
      setStudents(data);
    });

    const unsubAtt = onSnapshot(getCollectionPath('attendance'), (snap) => {
      setAttendance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubJurnal = onSnapshot(getCollectionPath('journals'), (snap) => {
      setJournals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubQuestions = onSnapshot(getCollectionPath('questions'), (snap) => {
      setQuestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSessions = onSnapshot(getCollectionPath('exam_sessions'), (snap) => {
      setExamSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubResults = onSnapshot(getCollectionPath('exam_results'), (snap) => {
      setExamResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSet = onSnapshot(getCollectionPath('settings'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length > 0) setSettings({ ...INITIAL_SETTINGS, ...data[0] });
      else addDoc(getCollectionPath('settings'), INITIAL_SETTINGS);
    });

    setLoading(false);
    return () => { unsubStud(); unsubAtt(); unsubJurnal(); unsubQuestions(); unsubSessions(); unsubResults(); unsubSet(); };
  }, [firebaseUser]);

  useEffect(() => {
    if (activeTab === 'cetak_manual' || activeTab === 'laporan_jurnal' || activeTab === 'rekapan_nilai') {
      setPrintSettings({ orientation: 'landscape', size: 'auto' });
    } else {
      setPrintSettings({ orientation: 'portrait', size: 'auto' });
    }
  }, [activeTab]);

  const handleLogin = (username, password, type) => {
    if (type === 'guru') {
      const user = students.find(u => u.username === username && u.password === password && u.role === 'admin');
      if (user) {
        setAppUser(user);
        setActiveTab('dashboard'); 
      } else {
        alert('Login Guru Gagal. Cek Username/Password.');
      }
    } else {
      const user = students.find(u => 
        (u.nisn === username || u.username === username) && 
        u.password === password && 
        u.role === 'student'
      );
      if (user) {
        setAppUser(user);
        setActiveTab('cbt_intro'); 
      } else {
        alert('Login Siswa Gagal. Cek NISN/Password (Default: 123).');
      }
    }
  };

  const handleLogout = () => {
    setAppUser(null);
    setIsMobileMenuOpen(false);
  };

  const getPageSizeCSS = () => {
    const { size, orientation } = printSettings;
    if (size === 'auto') return orientation;
    if (size === 'F4') {
       return orientation === 'landscape' ? '330mm 215mm' : '215mm 330mm';
    }
    return `${size} ${orientation}`;
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-gray-500">Memuat Aplikasi Sekolah Digital...</div>;

  if (!appUser) return <LoginPage onLogin={handleLogin} settings={settings} />;

  // --- RENDER FOR STUDENT MODE ---
  if (appUser.role === 'student') {
    return <StudentCBT user={appUser} sessions={examSessions} questions={questions} examResults={examResults} settings={settings} onLogout={handleLogout}/>;
  }

  // --- RENDER FOR TEACHER MODE ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row print:bg-white print:block print:h-auto text-slate-800">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-blue-900 text-white p-4 flex justify-between items-center print:hidden shadow-md z-50 relative">
         <div className="flex items-center gap-2">
            <img src={APP_LOGO_URL} className="w-8 h-8 object-contain bg-white rounded-full p-0.5"/>
            <span className="font-bold text-sm">Aplikasi Sekolah Digital</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="focus:outline-none">
            {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
         </button>
      </div>

      {/* SIDEBAR */}
      <div className={`
          ${isMobileMenuOpen ? 'block' : 'hidden'} 
          md:block 
          md:w-64 
          bg-slate-900 
          text-white 
          flex-shrink-0 
          print:hidden 
          shadow-xl 
          z-40
          absolute md:relative w-full
      `}>
         <SidebarContent 
            user={appUser} 
            activeTab={activeTab} 
            setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} 
            onLogout={handleLogout} 
            settings={settings} 
         />
      </div>
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0 print:overflow-visible print:h-auto print:block h-screen">
        <style>{`
          @media print {
            @page {
               size: ${getPageSizeCSS()};
               margin: 10mm;
            }
            body { 
               -webkit-print-color-adjust: exact; 
               print-color-adjust: exact;
               height: auto !important;
               overflow: visible !important;
            }
            .break-after-page {
               page-break-after: always;
            }
          }
        `}</style>

        {activeTab === 'dashboard' && <TeacherDashboard students={students} journals={journals} settings={settings} />}
        {activeTab === 'input_kelas' && <ClassroomActivity students={students} attendance={attendance} journals={journals} settings={settings} classList={dynamicClasses} />}
        {activeTab === 'revisi_jurnal' && <JournalRevision journals={journals} settings={settings} />}
        
        {/* CBT Modules */}
        {activeTab === 'bank_soal' && <BankSoal questions={questions} settings={settings} classList={dynamicClasses} />}
        {activeTab === 'sesi_ujian' && <ExamSessionManager sessions={examSessions} settings={settings} classList={dynamicClasses} />}
        {activeTab === 'hasil_ujian' && <ExamMonitoring sessions={examSessions} results={examResults} students={students} />}

        {/* Reports */}
        {activeTab === 'laporan_jurnal' && (
            <JournalReport 
               journals={journals} 
               settings={settings} 
               printConfig={printSettings} 
               onConfigChange={setPrintSettings}
            />
        )}
        
        {activeTab === 'rekapan_siswa' && <StudentRecap students={students} attendance={attendance} settings={settings} classList={dynamicClasses} />}
        {activeTab === 'rekapan_nilai' && <ScoreRecap results={examResults} sessions={examSessions} students={students} settings={settings} classList={dynamicClasses} />}

        {/* Management */}
        {activeTab === 'data_siswa' && <StudentData students={students} classList={dynamicClasses} />}
        {activeTab === 'settings' && <AdminSettings settings={settings} user={appUser} students={students} />}
        {activeTab === 'manajemen_user' && <UserManagement students={students} />}
        
      </main>
    </div>
  );
}

// --- LOGIN PAGE ---
function LoginPage({ onLogin, settings }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [mode, setMode] = useState('guru'); 
  const displayLogo = APP_LOGO_URL; 

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-200 p-4" style={{
      backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')`
    }}>
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-blue-600">
        <div className="text-center mb-6">
           <div className="h-24 w-full flex items-center justify-center mb-4">
              <img src={displayLogo} alt="Logo" className="max-h-full object-contain drop-shadow-md"/>
           </div>
           <h1 className="text-xl font-bold uppercase text-blue-900 tracking-wider">Aplikasi Sekolah Digital</h1>
           <p className="text-sm font-semibold text-slate-600 uppercase">{settings.opdName}</p>
        </div>

        {/* LOGIN MODE TOGGLE */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
           <button 
              onClick={() => setMode('guru')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'guru' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
           >
              GURU / ADMIN
           </button>
           <button 
              onClick={() => setMode('siswa')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'siswa' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
           >
              SISWA
           </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onLogin(u,p, mode); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
               {mode === 'guru' ? 'Username Guru' : 'NISN Siswa'}
            </label>
            <input className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              value={u} onChange={e=>setU(e.target.value)} placeholder={mode === 'guru' ? "Masukkan Username" : "Masukkan NISN"} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <input type="password" className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              value={p} onChange={e=>setP(e.target.value)} placeholder="Password" />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded shadow-lg transition-transform transform hover:scale-105">
            {mode === 'guru' ? 'MASUK SEBAGAI GURU' : 'MULAI UJIAN'}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-gray-400">
           &copy; {new Date().getFullYear()} {settings.opdShort}
        </div>
      </div>
    </div>
  );
}

// --- STUDENT CBT INTERFACE ---
function StudentCBT({ user, sessions, questions, examResults, settings, onLogout }) {
   const [screen, setScreen] = useState('token'); // 'token', 'exam', 'result'
   const [tokenInput, setTokenInput] = useState('');
   const [activeSession, setActiveSession] = useState(null);
   const [examQuestions, setExamQuestions] = useState([]);
   const [answers, setAnswers] = useState({});
   const [currentQIndex, setCurrentQIndex] = useState(0);
   const [timeLeft, setTimeLeft] = useState(0); 
   const [timerId, setTimerId] = useState(null);
   const [finalScore, setFinalScore] = useState(0); 

   // Fallback logo if settings not loaded yet
   const logoUrl = settings?.logoUrl || APP_LOGO_URL;

   const handleTokenSubmit = (e) => {
      e.preventDefault();
      const session = sessions.find(s => s.token === tokenInput.toUpperCase() && s.isActive);
      
      if (!session) {
         alert('Token tidak valid atau sesi ujian belum diaktifkan oleh guru.');
         return;
      }
      
      const userClass = user.kelas || "";
      const sessionClass = session.classLevel || "";

      if (sessionClass !== userClass) {
         alert(`Ujian ini khusus untuk kelas ${sessionClass}. Anda terdaftar di kelas ${userClass}.`);
         return;
      }
      
      // CHECK IF STUDENT HAS ALREADY SUBMITTED
      const hasTaken = examResults.some(r => r.sessionId === session.id && r.studentId === user.id);
      if (hasTaken) {
         alert('Anda sudah mengerjakan ujian ini. Tidak dapat mengerjakan ulang.');
         return;
      }

      // Load Questions
      const qList = questions.filter(q => 
         q.subject === session.subject && 
         q.classLevel === session.classLevel
      );

      if (qList.length === 0) {
         alert('Soal belum tersedia untuk ujian ini. Hubungi guru.');
         return;
      }

      setActiveSession(session);
      setExamQuestions(qList); 
      setTimeLeft(session.duration * 60);
      setScreen('exam');
   };

   // Timer Effect
   useEffect(() => {
      if (screen === 'exam' && timeLeft > 0) {
         const tid = setInterval(() => {
            setTimeLeft(prev => {
               if (prev <= 1) {
                  clearInterval(tid);
                  finishExam(true); // Force finish if time is up
                  return 0;
               }
               return prev - 1;
            });
         }, 1000);
         setTimerId(tid);
         return () => clearInterval(tid);
      }
   }, [screen, timeLeft]);

   const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
   };

   const handleAnswer = (qId, option) => {
      setAnswers(prev => ({ ...prev, [qId]: option }));
   };
   
   // Function to handle manual finish click
   const handleFinishClick = () => {
      const isConfirmed = window.confirm(
         "PERHATIAN: Anda akan mengakhiri ujian ini.\n\n" +
         "- Ujian hanya dapat dikerjakan SATU KALI.\n" +
         "- Setelah ini Anda TIDAK BISA kembali mengerjakan soal.\n" +
         "- Pastikan Anda sudah memeriksa semua jawaban.\n\n" +
         "Apakah Anda yakin ingin menyelesaikan ujian sekarang?"
      );
      
      if (isConfirmed) {
          finishExam(false);
      }
   };

   const finishExam = async (isForced) => {
      if (timerId) clearInterval(timerId);

      // Calculate Score
      let correctCount = 0;
      examQuestions.forEach(q => {
         if (answers[q.id] === q.correctAnswer) correctCount++;
      });
      const score = examQuestions.length > 0 ? Math.round((correctCount / examQuestions.length) * 100) : 0;
      setFinalScore(score);

      // Save Result to Firestore
      try {
         await addDoc(getCollectionPath('exam_results'), {
            studentId: user.id,
            studentName: user.nama || 'Siswa',
            studentNisn: user.nisn || '-',
            sessionId: activeSession.id,
            sessionTitle: activeSession.title,
            subject: activeSession.subject,
            classLevel: activeSession.classLevel,
            answers: answers,
            score: score,
            submittedAt: new Date().toISOString()
         });
         
         if (isForced) {
             alert("Waktu Habis! Ujian otomatis diselesaikan.");
         }
         
         setScreen('result');
      } catch (error) {
         console.error("Error saving exam result:", error);
         alert("Terjadi kesalahan saat menyimpan jawaban. Silakan coba lagi atau hubungi guru.");
      }
   };

   if (screen === 'token') {
      return (
         <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
               <img src={logoUrl} className="w-20 h-20 mx-auto mb-4 object-contain"/>
               <h2 className="text-xl font-bold text-slate-800">Selamat Datang, {user.nama}</h2>
               <p className="text-sm text-slate-500 mb-6">{user.kelas} • NISN: {user.nisn}</p>
               
               <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                  <h3 className="font-bold text-blue-900 mb-2">Masukkan Token Ujian</h3>
                  <p className="text-xs text-blue-700 mb-4">Silakan minta token kepada guru pengawas untuk memulai ujian.</p>
                  <form onSubmit={handleTokenSubmit}>
                     <input 
                        className="w-full text-center text-2xl font-mono tracking-widest p-3 border-2 border-blue-300 rounded uppercase focus:ring-4 focus:ring-blue-200 outline-none mb-4" 
                        placeholder="TOKEN"
                        maxLength={6}
                        value={tokenInput}
                        onChange={e=>setTokenInput(e.target.value)}
                     />
                     <button className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 shadow-md">
                        MULAI KERJAKAN
                     </button>
                  </form>
               </div>
               
               <button onClick={onLogout} className="text-red-500 text-sm font-bold hover:underline flex items-center justify-center mx-auto">
                  <LogOut size={16} className="mr-2"/> Keluar Aplikasi
               </button>
            </div>
         </div>
      );
   }

   if (screen === 'exam') {
      const currentQ = examQuestions[currentQIndex];
      // Safety check if currentQ is missing
      if (!currentQ) return <div className="p-10 text-center">Memuat soal...</div>;

      return (
         <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
               <div>
                  <h1 className="font-bold text-slate-800">{activeSession?.title}</h1>
                  <p className="text-xs text-slate-500">{activeSession?.subject}</p>
               </div>
               <div className="bg-slate-800 text-white px-4 py-2 rounded font-mono font-bold text-lg flex items-center">
                  <Clock size={20} className="mr-2"/> {formatTime(timeLeft)}
               </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
               <div className="flex-1 p-6 overflow-y-auto">
                  <div className="bg-white p-6 rounded shadow min-h-[50vh]">
                     <div className="flex justify-between mb-4 border-b pb-2">
                        <span className="font-bold text-blue-600">Soal No. {currentQIndex + 1}</span>
                     </div>
                     
                     {currentQ.image && (
                        <img src={currentQ.image} className="max-h-60 object-contain mb-4 mx-auto border rounded"/>
                     )}
                     
                     <p className="text-lg text-slate-800 mb-6 whitespace-pre-wrap leading-relaxed">{currentQ.text}</p>
                     
                     <div className="space-y-3">
                        {['A','B','C','D','E'].slice(0, currentQ.optionCount || 5).map(opt => (
                           <button 
                              key={opt}
                              onClick={() => handleAnswer(currentQ.id, opt)}
                              className={`w-full text-left p-4 rounded border flex items-center transition-all ${
                                 answers[currentQ.id] === opt 
                                 ? 'bg-blue-100 border-blue-500 ring-1 ring-blue-500' 
                                 : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                           >
                              <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold mr-4 ${
                                 answers[currentQ.id] === opt ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
                              }`}>
                                 {opt}
                              </span>
                              <span className="flex-1">{currentQ[`option${opt}`]}</span>
                           </button>
                        ))}
                     </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                     <button 
                        disabled={currentQIndex === 0}
                        onClick={() => setCurrentQIndex(i => i - 1)}
                        className="bg-white border border-slate-300 px-6 py-2 rounded font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center"
                     >
                        <ArrowLeft size={16} className="mr-2"/> Sebelumnya
                     </button>
                     
                     {currentQIndex < examQuestions.length - 1 ? (
                        <button 
                           onClick={() => setCurrentQIndex(i => i + 1)}
                           className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 flex items-center"
                        >
                           Selanjutnya <ArrowRight size={16} className="ml-2"/>
                        </button>
                     ) : (
                        <button 
                           onClick={handleFinishClick}
                           className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 flex items-center"
                        >
                           Selesai Ujian <CheckCircle size={16} className="ml-2"/>
                        </button>
                     )}
                  </div>
               </div>

               <div className="w-full md:w-80 bg-white border-l p-4 overflow-y-auto">
                  <h3 className="font-bold text-sm mb-4 uppercase text-slate-500">Navigasi Soal</h3>
                  <div className="grid grid-cols-5 gap-2">
                     {examQuestions.map((q, idx) => (
                        <button 
                           key={idx}
                           onClick={() => setCurrentQIndex(idx)}
                           className={`h-10 w-10 rounded font-bold text-sm flex items-center justify-center border transition-colors ${
                              currentQIndex === idx ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                           } ${
                              answers[q.id] 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                           }`}
                        >
                           {idx + 1}
                        </button>
                     ))}
                  </div>
                  
                  <div className="mt-8 pt-4 border-t">
                     <div className="flex items-center gap-2 text-xs mb-2">
                        <span className="w-4 h-4 bg-blue-600 rounded"></span> Sudah Dijawab
                     </div>
                     <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 h-4 bg-white border border-slate-300 rounded"></span> Belum Dijawab
                     </div>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   if (screen === 'result') {
      return (
         <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-lg text-center">
               <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-green-600"/>
               </div>
               <h2 className="text-2xl font-bold text-slate-800 mb-2">Ujian Selesai!</h2>
               <p className="text-slate-600 mb-6">Terima kasih telah mengerjakan <b>{activeSession?.title}</b>.</p>
               
               <div className="bg-slate-50 p-4 rounded border mb-6 text-sm text-left">
                  <div className="flex justify-between mb-2">
                     <span className="text-slate-500">Nama Siswa:</span>
                     <span className="font-bold">{user.nama}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                     <span className="text-slate-500">Mata Pelajaran:</span>
                     <span className="font-bold">{activeSession?.subject}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-slate-500">Jumlah Soal Dijawab:</span>
                     <span className="font-bold text-blue-600">{Object.keys(answers).length} / {examQuestions.length}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                     <span className="text-slate-500 font-bold">NILAI ANDA:</span>
                     <span className="font-bold text-2xl text-green-600">{finalScore}</span>
                  </div>
               </div>

               <button onClick={onLogout} className="bg-slate-800 text-white px-6 py-3 rounded font-bold hover:bg-black w-full">
                  Keluar
               </button>
            </div>
         </div>
      );
   }
   
   return <div className="p-10 text-center">Memuat aplikasi ujian...</div>;
}

// --- SIDEBAR CONTENT ---
function SidebarContent({ user, activeTab, setActiveTab, onLogout, settings }) {
  const btnClass = (id) => `w-full text-left p-3 mb-1 rounded flex items-center justify-between transition-colors font-medium text-sm
    ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`;

  // Menggunakan logo default (Permanen) untuk Sidebar
  const LogoImg = APP_LOGO_URL;

  return (
    <div className="flex flex-col h-full min-h-screen md:min-h-0 bg-slate-900">
      <div className="p-5 bg-slate-800 border-b border-slate-700 flex items-center gap-3">
        <img src={LogoImg} className="w-10 h-10 object-contain bg-white rounded-full p-0.5"/>
        <div>
           <h1 className="font-bold text-lg leading-tight">{settings.opdShort}</h1>
           <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-blue-400 uppercase tracking-wide">
             {settings.teacherType === 'kelas' ? 'Guru Kelas' : 'Guru Mapel'}
           </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        <button onClick={()=>setActiveTab('dashboard')} className={btnClass('dashboard')}>
            <div className="flex items-center"><LayoutDashboard size={16} className="mr-3"/> Dashboard</div>
        </button>
        
        <div className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2 px-2 flex items-center"><ChevronDown size={12} className="mr-1"/>Aktivitas Mengajar</div>
        <button onClick={()=>setActiveTab('input_kelas')} className={btnClass('input_kelas')}>
            <div className="flex items-center"><BookOpen size={16} className="mr-3"/> Mulai Kelas (Absensi)</div>
        </button>
        <button onClick={()=>setActiveTab('revisi_jurnal')} className={btnClass('revisi_jurnal')}>
            <div className="flex items-center"><FilePenLine size={16} className="mr-3"/> Edit Jurnal</div>
        </button>
        
        {/* NEW CBT MENU */}
        <div className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2 px-2 flex items-center"><ChevronDown size={12} className="mr-1"/>Manajemen CBT</div>
        <button onClick={()=>setActiveTab('bank_soal')} className={btnClass('bank_soal')}>
            <div className="flex items-center"><FileQuestion size={16} className="mr-3"/> Bank Soal</div>
        </button>
        <button onClick={()=>setActiveTab('sesi_ujian')} className={btnClass('sesi_ujian')}>
            <div className="flex items-center"><Timer size={16} className="mr-3"/> Sesi Ujian</div>
        </button>
        <button onClick={()=>setActiveTab('hasil_ujian')} className={btnClass('hasil_ujian')}>
            <div className="flex items-center"><BarChart2 size={16} className="mr-3"/> Monitoring & Hasil</div>
        </button>

        <div className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2 px-2 flex items-center"><ChevronDown size={12} className="mr-1"/>Laporan & Rekapan</div>
        <button onClick={()=>setActiveTab('laporan_jurnal')} className={btnClass('laporan_jurnal')}>
            <div className="flex items-center"><FileText size={16} className="mr-3"/> Cetak Jurnal</div>
        </button>
        <button onClick={()=>setActiveTab('rekapan_siswa')} className={btnClass('rekapan_siswa')}>
            <div className="flex items-center"><Calendar size={16} className="mr-3"/> Rekapan Absensi Siswa</div>
        </button>
        <button onClick={()=>setActiveTab('rekapan_nilai')} className={btnClass('rekapan_nilai')}>
            <div className="flex items-center"><Award size={16} className="mr-3"/> Rekapan Nilai</div>
        </button>
        
        <div className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2 px-2 flex items-center"><ChevronDown size={12} className="mr-1"/>Manajemen Kelas</div>
        <button onClick={()=>setActiveTab('data_siswa')} className={btnClass('data_siswa')}>
            <div className="flex items-center"><GraduationCap size={16} className="mr-3"/> Data Siswa</div>
        </button>
        <button onClick={()=>setActiveTab('manajemen_user')} className={btnClass('manajemen_user')}>
            <div className="flex items-center"><UserCog size={16} className="mr-3"/> Manajemen User</div>
        </button>
        <button onClick={()=>setActiveTab('settings')} className={btnClass('settings')}>
            <div className="flex items-center"><Settings size={16} className="mr-3"/> Pengaturan</div>
        </button>
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-800">
         <div className="mb-4">
            <p className="text-sm font-semibold truncate">{settings.teacherName || user.nama}</p>
            <p className="text-xs text-slate-400 truncate">
               {settings.teacherNip ? `NIP. ${settings.teacherNip}` : user.jabatan}
            </p>
         </div>
         <button onClick={onLogout} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded flex items-center justify-center text-sm transition-colors">
            <LogOut size={16} className="mr-2"/> Keluar
         </button>
      </div>
    </div>
  );
}

// ================= PAGES =================

function TeacherDashboard({ students, journals, settings }) {
  const today = getTodayString();
  const allStudents = students.filter(s => s.role !== 'admin');
  const todaysJournals = journals.filter(j => j.date === today);

  const totalSiswa = allStudents.length;
  const jamMengajar = todaysJournals.length;
  
  let siswaHadirHariIni = 0;
  let siswaSakitHariIni = 0;
  let siswaIzinHariIni = 0;
  let siswaAlpaHariIni = 0;

  todaysJournals.forEach(j => {
     siswaHadirHariIni += (j.summary?.hadir || 0);
     siswaSakitHariIni += (j.summary?.sakit || 0);
     siswaIzinHariIni += (j.summary?.izin || 0);
     siswaAlpaHariIni += (j.summary?.alpa || 0);
  });

  return (
    <div className="p-2 md:p-6">
       <div className="bg-slate-800 text-white p-6 rounded-xl flex items-center gap-6 mb-8 shadow-xl">
          <img src={APP_LOGO_URL} className="w-20 h-20 bg-white rounded-full p-1 object-contain"/>
          <div>
             <h2 className="text-xl font-bold uppercase">{settings.opdName}</h2>
             <p className="text-slate-400 text-sm uppercase tracking-wide">Aplikasi Sekolah Digital</p>
             <p className="text-xs text-slate-500 mt-1">Selamat Datang, {settings.teacherName || 'Bapak/Ibu Guru'}</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-600">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-500 text-xs uppercase">Total Data Siswa</h3>
                <GraduationCap className="text-blue-600" size={20}/>
             </div>
             <p className="text-3xl font-bold">{totalSiswa}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-600">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-500 text-xs uppercase">Sesi Mengajar Hari Ini</h3>
                <BookOpen className="text-green-600" size={20}/>
             </div>
             <p className="text-3xl font-bold">{jamMengajar}</p>
             <p className="text-xs text-slate-400 mt-1">Kelas yang sudah diisi jurnal</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-orange-500 col-span-2">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-500 text-xs uppercase">Ringkasan Kehadiran Siswa Hari Ini</h3>
                <Users className="text-orange-500" size={20}/>
             </div>
             <div className="flex gap-4 text-center mt-2">
                <div className="flex-1 bg-green-50 rounded p-2">
                   <span className="block font-bold text-xl text-green-700">{siswaHadirHariIni}</span>
                   <span className="text-xs text-green-600">Hadir</span>
                </div>
                <div className="flex-1 bg-yellow-50 rounded p-2">
                   <span className="block font-bold text-xl text-yellow-700">{siswaSakitHariIni}</span>
                   <span className="text-xs text-yellow-600">Sakit</span>
                </div>
                <div className="flex-1 bg-blue-50 rounded p-2">
                   <span className="block font-bold text-xl text-blue-700">{siswaIzinHariIni}</span>
                   <span className="text-xs text-blue-600">Izin</span>
                </div>
                <div className="flex-1 bg-red-50 rounded p-2">
                   <span className="block font-bold text-xl text-red-700">{siswaAlpaHariIni}</span>
                   <span className="text-xs text-red-600">Alpa</span>
                </div>
             </div>
          </div>
       </div>

       <div className="bg-white p-6 rounded shadow">
          <h3 className="font-bold text-lg mb-4 flex items-center"><Clock size={18} className="mr-2"/> Jurnal Hari Ini ({formatDateIndo(today)})</h3>
          {todaysJournals.length === 0 ? (
             <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded border border-dashed">
                Belum ada aktivitas mengajar yang dicatat hari ini.
                <br/>Silakan masuk ke menu "Mulai Kelas".
             </div>
          ) : (
             <div className="space-y-4">
                {todaysJournals.map(j => (
                   <div key={j.id} className="border p-4 rounded bg-slate-50 flex flex-col md:flex-row gap-4 items-start">
                      <div className="bg-blue-600 text-white p-3 rounded text-center min-w-[100px]">
                         <span className="block text-xs font-bold opacity-75">{j.session.split(' ')[0]} {j.session.split(' ')[1]}</span>
                         <span className="block font-bold text-lg">{j.className}</span>
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between items-start">
                            <h4 className="font-bold text-blue-900">{j.subject ? j.subject : 'Tanpa Mata Pelajaran'}</h4>
                         </div>
                         <p className="text-sm italic text-slate-700 mt-1 mb-2">{j.topic}</p>
                         <div className="flex gap-3 mt-2 text-sm text-slate-600 border-t pt-2">
                            <span><CheckCircle size={14} className="inline mr-1 text-green-600"/> Hadir: {j.summary?.hadir || 0}</span>
                            <span><Activity size={14} className="inline mr-1 text-yellow-600"/> Sakit: {j.summary?.sakit || 0}</span>
                            <span><FileText size={14} className="inline mr-1 text-blue-600"/> Izin: {j.summary?.izin || 0}</span>
                            <span><XCircle size={14} className="inline mr-1 text-red-600"/> Alpa: {j.summary?.alpa || 0}</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
}

function ClassroomActivity({ students, attendance, journals, settings, classList }) {
  const [date, setDate] = useState(getTodayString());
  const [session, setSession] = useState(SESI_LIST[0]);
  const [className, setClassName] = useState(classList[0] || '');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [inputs, setInputs] = useState({});

  useEffect(() => {
     if(classList.length > 0 && !classList.includes(className)) {
         setClassName(classList[0]);
     }
  }, [classList]);

  useEffect(() => {
     if(settings.subjects && settings.subjects.length > 0 && !subject) {
        setSubject(settings.subjects[0]);
     }
  }, [settings.subjects]);

  const classStudents = students.filter(s => s.role !== 'admin' && s.kelas === className)
    .sort((a,b) => (a.nama || '').localeCompare(b.nama || ''));

  useEffect(() => {
     const existingJournal = journals.find(j => j.date === date && j.session === session && j.className === className);
     if(existingJournal) {
        setTopic(existingJournal.topic);
        if(existingJournal.subject) setSubject(existingJournal.subject);
     } else {
        setTopic('');
     }

     const map = {};
     if(!existingJournal) {
        classStudents.forEach(s => map[s.id] = 'Hadir');
     }
     
     attendance.forEach(l => {
        if(l.date === date && l.session === session && l.className === className) {
           map[l.studentId] = l.status;
        }
     });
     setInputs(prev => (!existingJournal ? map : { ...map }));
  }, [date, session, className, attendance, journals, classStudents.length]);

  const handleSave = async () => {
    if (!topic) {
       alert('Mohon isi Materi / Kegiatan Pembelajaran.');
       return;
    }
    if (!subject) {
       alert('Mohon pilih Mata Pelajaran.');
       return;
    }

    const batch = writeBatch(db);
    const summary = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
    
    for (const stud of classStudents) {
       const status = inputs[stud.id] || 'Hadir'; 
       if(status === 'Hadir') summary.hadir++;
       else if(status === 'Sakit') summary.sakit++;
       else if(status === 'Izin') summary.izin++;
       else summary.alpa++;

       const attId = `${date}_${session.replace(/\s/g,'')}_${stud.id}`;
       const attRef = doc(getCollectionPath('attendance'), attId);
       batch.set(attRef, {
          date, session, className, 
          subject, 
          studentId: stud.id, 
          studentName: stud.nama, 
          status,
          timestamp: new Date().toISOString()
       });
    }

    const journalId = `${date}_${session.replace(/\s/g,'')}_${className.replace(/\s/g,'')}`;
    const journalRef = doc(getCollectionPath('journals'), journalId);
    batch.set(journalRef, {
       date, session, className, topic, subject, summary,
       timestamp: new Date().toISOString()
    });

    await batch.commit();
    alert('Jurnal dan Absensi Siswa Berhasil Disimpan!');
  };

  const setAll = (status) => {
     const newInputs = {...inputs};
     classStudents.forEach(s => newInputs[s.id] = status);
     setInputs(newInputs);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="bg-white p-6 rounded shadow-lg border-t-4 border-blue-600">
          <h2 className="text-xl font-bold mb-6 flex items-center text-blue-900"><BookOpen className="mr-2"/> Input Jurnal & Absensi Kelas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <div>
                <label className="block text-xs font-bold uppercase mb-1">Tanggal</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border p-2 rounded"/>
             </div>
             <div>
                <label className="block text-xs font-bold uppercase mb-1">Jam / Sesi</label>
                <select value={session} onChange={e=>setSession(e.target.value)} className="w-full border p-2 rounded">
                   {SESI_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold uppercase mb-1">Kelas</label>
                <select value={className} onChange={e=>setClassName(e.target.value)} className="w-full border p-2 rounded font-bold bg-slate-50">
                   {classList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold uppercase mb-1">Mata Pelajaran</label>
                <select value={subject} onChange={e=>setSubject(e.target.value)} className="w-full border p-2 rounded font-bold bg-yellow-50">
                   <option value="" disabled>-- Pilih Mapel --</option>
                   {(settings.subjects || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
          </div>

          <div className="mb-6">
             <label className="block text-xs font-bold uppercase mb-1">Materi / Topik / Kegiatan Pembelajaran</label>
             <textarea 
                className="w-full border p-3 rounded bg-slate-50 focus:ring-2 focus:ring-blue-400 outline-none" 
                rows="3"
                placeholder="Contoh: Pembahasan Soal Bab 3 Statistika..."
                value={topic}
                onChange={e=>setTopic(e.target.value)}
             />
          </div>
       </div>

       <div className="bg-white p-6 rounded shadow-lg">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold flex items-center"><Users size={18} className="mr-2"/> Daftar Siswa ({classStudents.length})</h3>
             <div className="text-xs flex gap-2">
                <button onClick={()=>setAll('Hadir')} className="text-green-600 font-bold hover:underline">Semua Hadir</button>
             </div>
          </div>

          {classStudents.length === 0 ? (
             <div className="text-center p-8 text-slate-400 bg-slate-50 border border-dashed rounded">
                Tidak ada data siswa di kelas <b>{className}</b>. 
                <br/>Silakan tambah siswa di menu "Data Siswa".
             </div>
          ) : (
             <div className="overflow-x-auto border rounded">
                <table className="w-full text-sm">
                   <thead className="bg-slate-100">
                      <tr>
                         <th className="p-3 text-left w-10 border-b">No</th>
                         <th className="p-3 text-left border-b">Nama Siswa</th>
                         <th className="p-3 text-center border-b">Kehadiran</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y">
                      {classStudents.map((s, idx) => (
                         <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-3 text-center">{idx+1}</td>
                            <td className="p-3 font-medium">{s.nama}</td>
                            <td className="p-3">
                               <div className="flex justify-center gap-2">
                                  {['Hadir','Sakit','Izin','Alpa'].map(opt => (
                                     <label key={opt} className={`cursor-pointer px-3 py-1 rounded text-xs font-bold border transition-colors
                                        ${inputs[s.id] === opt 
                                           ? (opt==='Hadir'?'bg-green-600 text-white border-green-600':
                                              opt==='Sakit'?'bg-yellow-500 text-white border-yellow-500':
                                              opt==='Izin'?'bg-blue-500 text-white border-blue-500':
                                              'bg-red-600 text-white border-red-600') 
                                           : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                        }
                                     `}>
                                        <input 
                                           type="radio" 
                                           name={`att-${s.id}`} 
                                           className="hidden" 
                                           checked={inputs[s.id] === opt} 
                                           onChange={()=>setInputs({...inputs, [s.id]: opt})}
                                        />
                                        {opt[0]}
                                     </label>
                                  ))}
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}

          <div className="mt-6 flex justify-end">
             <button onClick={handleSave} className="bg-blue-600 text-white px-8 py-3 rounded shadow-lg hover:bg-blue-700 flex items-center font-bold text-base transition-transform transform hover:scale-105">
                 <Save size={20} className="mr-2"/> SIMPAN JURNAL & ABSENSI
             </button>
          </div>
       </div>
    </div>
  );
}

function JournalRevision({ journals, settings }) {
   const [selectedJournal, setSelectedJournal] = useState(null);
   const [form, setForm] = useState({});
   const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

   const filteredJournals = journals.filter(j => j.date.startsWith(month))
      .sort((a,b) => b.date.localeCompare(a.date) || b.session.localeCompare(a.session));

   const handleEdit = (journal) => {
      setSelectedJournal(journal);
      setForm({
         topic: journal.topic || '',
         process: journal.process || '',
         problems: journal.problems || '',
         solution: journal.solution || '',
         feedback: journal.feedback || '',
         evaluation: journal.evaluation || ''
      });
   };

   const handleSave = async () => {
      if(!selectedJournal) return;
      
      const journalRef = doc(getCollectionPath('journals'), selectedJournal.id);
      await updateDoc(journalRef, {
         ...form,
         lastUpdated: new Date().toISOString()
      });
      alert('Jurnal berhasil direvisi dan disimpan.');
      setSelectedJournal(null);
   };

   return (
      <div className="bg-white p-6 rounded shadow">
         <h2 className="text-xl font-bold mb-6 flex items-center text-slate-800"><FilePenLine className="mr-2"/> Revisi & Evaluasi Jurnal Mengajar</h2>
         
         {!selectedJournal ? (
            <div>
               <div className="mb-4">
                  <label className="text-xs font-bold block mb-1">Pilih Bulan</label>
                  <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="border p-2 rounded"/>
               </div>
               
               <div className="overflow-x-auto border rounded">
                  <table className="w-full text-sm">
                     <thead className="bg-slate-100">
                        <tr>
                           <th className="p-3 text-left">Tanggal</th>
                           <th className="p-3 text-left">Jam/Sesi</th>
                           <th className="p-3 text-left">Kelas</th>
                           <th className="p-3 text-left">Materi Awal</th>
                           <th className="p-3 text-center">Aksi</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y">
                        {filteredJournals.length === 0 ? (
                           <tr><td colSpan="5" className="p-4 text-center italic text-slate-500">Tidak ada jurnal pada bulan ini.</td></tr>
                        ) : (
                           filteredJournals.map(j => (
                              <tr key={j.id} className="hover:bg-slate-50">
                                 <td className="p-3">{formatDateIndo(j.date)}</td>
                                 <td className="p-3">{j.session}</td>
                                 <td className="p-3 font-bold">{j.className}</td>
                                 <td className="p-3 truncate max-w-xs">{j.topic}</td>
                                 <td className="p-3 text-center">
                                    <button onClick={()=>handleEdit(j)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200">
                                       Edit / Lengkapi
                                    </button>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         ) : (
            <div className="max-w-3xl">
               <button onClick={()=>setSelectedJournal(null)} className="mb-4 text-sm text-slate-500 hover:text-slate-800 flex items-center">
                  <ChevronDown className="rotate-90 mr-1"/> Kembali ke Daftar
               </button>
               
               <div className="bg-blue-50 p-4 rounded mb-6 border border-blue-100">
                  <h3 className="font-bold text-lg text-blue-900">{selectedJournal.className} - {selectedJournal.subject}</h3>
                  <p className="text-sm text-slate-600">{formatDateIndo(selectedJournal.date)} • {selectedJournal.session}</p>
               </div>

               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold uppercase mb-1 text-slate-600">Materi / Topik Pembelajaran (Utama)</label>
                     <textarea className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" rows="2" 
                        value={form.topic} onChange={e=>setForm({...form, topic: e.target.value})}/>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-slate-600">Proses Pembelajaran</label>
                        <textarea className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" rows="3" 
                           placeholder="Bagaimana pembelajaran berlangsung? (Lancar/Tertib/Aktif)"
                           value={form.process} onChange={e=>setForm({...form, process: e.target.value})}/>
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-slate-600">Permasalahan Siswa</label>
                        <textarea className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" rows="3" 
                           placeholder="Kesulitan yang dihadapi siswa..."
                           value={form.problems} onChange={e=>setForm({...form, problems: e.target.value})}/>
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-slate-600">Solusi / Tindak Lanjut</label>
                        <textarea className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" rows="3" 
                           placeholder="Tindakan perbaikan yang dilakukan..."
                           value={form.solution} onChange={e=>setForm({...form, solution: e.target.value})}/>
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-slate-600">Catatan / Umpan Balik Siswa</label>
                        <textarea className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" rows="3" 
                           placeholder="Hal menarik atau pertanyaan kritis siswa..."
                           value={form.feedback} onChange={e=>setForm({...form, feedback: e.target.value})}/>
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold uppercase mb-1 text-slate-600">Evaluasi Diri Guru</label>
                     <textarea className="w-full border p-3 rounded bg-yellow-50 focus:ring-2 focus:ring-yellow-400 outline-none text-sm" rows="2" 
                        placeholder="Refleksi strategi mengajar untuk perbaikan ke depan..."
                        value={form.evaluation} onChange={e=>setForm({...form, evaluation: e.target.value})}/>
                  </div>

                  <div className="pt-4 flex justify-end">
                     <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded font-bold shadow hover:bg-green-700 flex items-center">
                        <Save size={18} className="mr-2"/> Simpan Revisi Jurnal
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

function BankSoal({ questions, settings, classList }) {
  const [form, setForm] = useState({
    text: '',
    image: '', 
    optionA: '', optionB: '', optionC: '', optionD: '', optionE: '',
    correctAnswer: 'A',
    subject: '',
    classLevel: '',
    semester: 'Ganjil' 
  });
  const [optionCount, setOptionCount] = useState(5); 
  const [editingId, setEditingId] = useState(null);
  
  const [filterSubject, setFilterSubject] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSemester, setFilterSemester] = useState(''); 

  useEffect(() => {
    if (!form.subject && settings.subjects?.length > 0) setForm(f => ({ ...f, subject: settings.subjects[0] }));
    if (!form.classLevel && classList.length > 0) setForm(f => ({ ...f, classLevel: classList[0] }));
  }, [settings.subjects, classList]);

  const filteredQuestions = questions.filter(q => {
    const matchSub = filterSubject ? q.subject === filterSubject : true;
    const matchClass = filterClass ? q.classLevel === filterClass : true;
    const matchSem = filterSemester ? q.semester === filterSemester : true; 
    return matchSub && matchClass && matchSem;
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        setForm(prev => ({ ...prev, image: evt.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleImportQuestions = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
         const text = evt.target.result;
         const lines = text.split('\n');
         const batch = writeBatch(db);
         let count = 0;
         
         for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            if (line.toLowerCase().includes('pertanyaan') && line.toLowerCase().includes('kunci')) continue;

            const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
            
            if (parts.length >= 3) {
               const subject = parts[0]?.replace(/^"|"$/g, '').trim() || settings.subjects?.[0] || '';
               const classLevel = parts[1]?.replace(/^"|"$/g, '').trim() || classList?.[0] || '';
               const text = parts[2]?.replace(/^"|"$/g, '').trim() || '';
               
               if (text) {
                   const optionA = parts[3]?.replace(/^"|"$/g, '').trim() || '';
                   const optionB = parts[4]?.replace(/^"|"$/g, '').trim() || '';
                   const optionC = parts[5]?.replace(/^"|"$/g, '').trim() || '';
                   const optionD = parts[6]?.replace(/^"|"$/g, '').trim() || '';
                   const optionE = parts[7]?.replace(/^"|"$/g, '').trim() || '';
                   const correctAnswer = parts[8]?.replace(/^"|"$/g, '').trim().toUpperCase().replace(/[^A-E]/g, '') || 'A'; 
                   const semester = parts[9]?.replace(/^"|"$/g, '').trim() || 'Ganjil';

                   const newDocRef = doc(getCollectionPath('questions'));
                   batch.set(newDocRef, {
                      subject, classLevel, text, 
                      optionA, optionB, optionC, optionD, optionE,
                      correctAnswer,
                      semester,
                      optionCount: 5, 
                      lastUpdated: new Date().toISOString()
                   });
                   count++;
               }
            }
         }
         
         if(count > 0) {
             try {
                await batch.commit();
                alert(`Berhasil mengimpor ${count} soal.`);
             } catch(err) {
                 console.error("Batch commit failed", err);
                 alert("Gagal menyimpan data import. Coba file yang lebih kecil.");
             }
         } else {
             alert("Tidak ada data soal yang terbaca. Pastikan format CSV benar.");
         }
      };
      reader.readAsText(file);
   };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { 
        ...form, 
        optionCount, 
        lastUpdated: new Date().toISOString() 
    };
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    
    try {
        if (editingId) {
          await updateDoc(doc(getCollectionPath('questions'), editingId), payload);
          alert('Soal berhasil diperbarui');
          setEditingId(null);
        } else {
          await addDoc(getCollectionPath('questions'), payload);
          alert('Soal berhasil ditambahkan');
        }
        setForm(prev => ({ 
          ...prev, 
          text: '', image: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', correctAnswer: 'A' 
        }));
    } catch (error) {
        console.error("Error saving question:", error);
        alert("Terjadi kesalahan saat menyimpan soal.");
    }
  };

  const handleEdit = (q) => {
    setForm({
        text: q.text || '',
        image: q.image || '',
        optionA: q.optionA || '',
        optionB: q.optionB || '',
        optionC: q.optionC || '',
        optionD: q.optionD || '',
        optionE: q.optionE || '',
        correctAnswer: q.correctAnswer || 'A',
        subject: q.subject || settings.subjects?.[0] || '',
        classLevel: q.classLevel || classList?.[0] || '',
        semester: q.semester || 'Ganjil'
    });
    setOptionCount(q.optionCount || 5);
    setEditingId(q.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if(confirm('Hapus soal ini? Data yang dihapus tidak dapat dikembalikan.')) {
        try {
            await deleteDoc(doc(getCollectionPath('questions'), id));
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Gagal menghapus soal. Periksa koneksi internet.");
        }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(prev => ({ 
      ...prev, 
      text: '', image: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', correctAnswer: 'A' 
    }));
  };

  const optionLabels = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 bg-white p-6 rounded shadow h-fit border-t-4 border-blue-600">
          <h3 className="font-bold text-lg mb-4 flex items-center text-blue-800">
            {editingId ? <Edit className="mr-2" size={20}/> : <Plus className="mr-2" size={20}/>}
            {editingId ? 'Edit Soal' : 'Buat Soal Baru'}
          </h3>
          
          <div className="mb-4 p-3 bg-blue-50 rounded text-xs text-blue-800 border border-blue-100">
             <strong>Fitur Baru:</strong> 
             <ul className="list-disc ml-4 mt-1">
               <li>Filter Semester (Ganjil/Genap)</li>
               <li>Pilihan Ganda Dinamis (2-5 Opsi)</li>
               <li>Upload Gambar Soal</li>
               <li>Import Soal dari CSV (Excel)</li>
             </ul>
          </div>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold mb-1">Mata Pelajaran</label>
                <select className="w-full border p-2 rounded text-sm" required value={form.subject} onChange={e=>setForm({...form, subject: e.target.value})}>
                  {settings.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Kelas</label>
                <select className="w-full border p-2 rounded text-sm" required value={form.classLevel} onChange={e=>setForm({...form, classLevel: e.target.value})}>
                  {classList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="block text-xs font-bold mb-1">Semester</label>
                  <select className="w-full border p-2 rounded text-sm" value={form.semester} onChange={e=>setForm({...form, semester: e.target.value})}>
                     <option value="Ganjil">Ganjil</option>
                     <option value="Genap">Genap</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold mb-1">Jml Pilihan</label>
                  <select className="w-full border p-2 rounded text-sm bg-slate-50" value={optionCount} onChange={e=>setOptionCount(parseInt(e.target.value))}>
                      <option value={2}>2 (A-B)</option>
                      <option value={3}>3 (A-C)</option>
                      <option value={4}>4 (A-D)</option>
                      <option value={5}>5 (A-E)</option>
                  </select>
               </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Pertanyaan</label>
              <textarea 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                rows="4" 
                placeholder="Tulis soal di sini..."
                required
                value={form.text}
                onChange={e=>setForm({...form, text: e.target.value})}
              />
            </div>
            
            <div>
               <label className="block text-xs font-bold mb-1">Gambar Soal (Opsional)</label>
               <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs w-full"/>
                  {form.image && (
                     <button type="button" onClick={()=>setForm({...form, image: ''})} className="text-red-500 text-xs hover:underline">Hapus</button>
                  )}
               </div>
               {form.image && (
                  <img src={form.image} alt="Preview" className="mt-2 h-20 object-contain border rounded"/>
               )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold mb-1">Pilihan Jawaban</label>
              {optionLabels.slice(0, optionCount).map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <span className="font-bold text-xs w-4">{opt}.</span>
                  <input 
                    className="flex-1 border p-1.5 rounded text-sm" 
                    placeholder={`Opsi ${opt}`}
                    required
                    value={form[`option${opt}`]}
                    onChange={e=>setForm({...form, [`option${opt}`]: e.target.value})}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-green-700">Kunci Jawaban</label>
              <select className="w-full border p-2 rounded font-bold bg-green-50 text-green-800" value={form.correctAnswer} onChange={e=>setForm({...form, correctAnswer: e.target.value})}>
                {optionLabels.slice(0, optionCount).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              {editingId && (
                <button type="button" onClick={handleCancel} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded font-bold text-sm">
                  Batal
                </button>
              )}
              <button className="flex-1 bg-blue-600 text-white py-2 rounded font-bold text-sm hover:bg-blue-700 shadow">
                {editingId ? 'Update Soal' : 'Simpan Soal'}
              </button>
            </div>
            
            {!editingId && (
               <div className="mt-4 pt-4 border-t">
                  <label className="flex items-center justify-center w-full p-2 bg-green-100 text-green-700 rounded cursor-pointer hover:bg-green-200 text-xs font-bold border border-green-300">
                     <Upload size={14} className="mr-2"/> Import Soal (CSV)
                     <input type="file" accept=".csv" hidden onChange={handleImportQuestions}/>
                  </label>
                  <p className="text-[10px] text-slate-500 mt-1 text-center">Format CSV: Mapel, Kelas, Pertanyaan, A, B, C, D, E, Kunci, Semester</p>
               </div>
            )}
          </form>
        </div>

        <div className="md:w-2/3 space-y-4">
          <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-center justify-between">
             <div className="flex items-center gap-2">
                <Database className="text-blue-600"/>
                <h3 className="font-bold text-lg">Bank Soal</h3>
             </div>
             <div className="flex gap-2">
                <select className="border p-2 rounded text-sm" value={filterSubject} onChange={e=>setFilterSubject(e.target.value)}>
                   <option value="">Semua Mapel</option>
                   {settings.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="border p-2 rounded text-sm" value={filterClass} onChange={e=>setFilterClass(e.target.value)}>
                   <option value="">Semua Kelas</option>
                   {classList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="border p-2 rounded text-sm" value={filterSemester} onChange={e=>setFilterSemester(e.target.value)}>
                   <option value="">Semua Sem.</option>
                   <option value="Ganjil">Ganjil</option>
                   <option value="Genap">Genap</option>
                </select>
             </div>
          </div>

          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
             {filteredQuestions.length === 0 ? (
               <div className="text-center p-10 bg-slate-50 text-slate-400 rounded border border-dashed">
                  Belum ada soal untuk filter ini.
               </div>
             ) : (
               filteredQuestions.map((q, idx) => (
                 <div key={q.id} className={`bg-white p-4 rounded shadow border-l-4 ${editingId === q.id ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-blue-500'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-600">
                          {q.subject} • {q.classLevel} • {q.semester}
                       </span>
                       <div className="flex gap-2">
                          <button onClick={()=>handleEdit(q)} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                          <button onClick={()=>handleDelete(q.id)} className="text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                       </div>
                    </div>
                    
                    {q.image && (
                       <img src={q.image} alt="Soal" className="max-h-40 object-contain my-2 border rounded"/>
                    )}
                    
                    <p className="font-medium text-slate-800 mb-3 whitespace-pre-wrap">{idx + 1}. {q.text}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                       {optionLabels.slice(0, q.optionCount || 5).map(opt => (
                          <div key={opt} className={`flex items-center gap-2 p-1 px-2 rounded ${q.correctAnswer === opt ? 'bg-green-100 text-green-800 font-bold border border-green-200' : ''}`}>
                             <span className="w-4">{opt}.</span>
                             <span>{q[`option${opt}`]}</span>
                             {q.correctAnswer === opt && <CheckCircle size={14} className="ml-auto"/>}
                          </div>
                       ))}
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamSessionManager({ sessions, settings, classList }) {
  const [form, setForm] = useState({
    title: '',
    subject: '',
    classLevel: '',
    date: getTodayString(),
    duration: 60, 
    token: '',
    semester: 'Ganjil', 
    isActive: false
  });
  const [editingId, setEditingId] = useState(null);

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for(let i=0; i<6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({...prev, token }));
  };

  useEffect(() => {
    if (!form.token) generateToken();
    if (!form.subject && settings.subjects?.length > 0) setForm(f => ({ ...f, subject: settings.subjects[0] }));
    if (!form.classLevel && classList.length > 0) setForm(f => ({ ...f, classLevel: classList[0] }));
  }, [settings.subjects, classList]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId) {
       await updateDoc(doc(getCollectionPath('exam_sessions'), editingId), { ...form });
       alert('Sesi ujian berhasil diperbarui.');
       setEditingId(null);
    } else {
       await addDoc(getCollectionPath('exam_sessions'), { 
          ...form, 
          createdAt: new Date().toISOString() 
       });
       alert('Sesi ujian berhasil dibuat.');
    }
    setForm({
       title: '', subject: form.subject, classLevel: form.classLevel, 
       date: getTodayString(), duration: 60, token: '', semester: 'Ganjil', isActive: false
    });
    generateToken();
  };

  const handleEdit = (session) => {
     setForm(session);
     setEditingId(session.id);
  };

  const handleDelete = async (id) => {
     if(confirm('Hapus sesi ujian ini?')) await deleteDoc(doc(getCollectionPath('exam_sessions'), id));
  };

  const toggleStatus = async (session) => {
     await updateDoc(doc(getCollectionPath('exam_sessions'), session.id), { isActive: !session.isActive });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({
       title: '', subject: settings.subjects?.[0] || '', classLevel: classList?.[0] || '', 
       date: getTodayString(), duration: 60, token: '', semester: 'Ganjil', isActive: false
    });
    generateToken();
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 bg-white p-6 rounded shadow h-fit border-t-4 border-purple-600">
             <h3 className="font-bold text-lg mb-4 flex items-center text-purple-800">
                <Clock className="mr-2" size={20}/>
                {editingId ? 'Edit Sesi Ujian' : 'Buat Sesi Ujian Baru'}
             </h3>
             <form onSubmit={handleSave} className="space-y-4">
                <div>
                   <label className="block text-xs font-bold mb-1">Judul Ujian</label>
                   <input 
                      className="w-full border p-2 rounded text-sm" 
                      placeholder="Contoh: Ulangan Harian 1" 
                      required 
                      value={form.title}
                      onChange={e=>setForm({...form, title: e.target.value})}
                   />
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                      <label className="block text-xs font-bold mb-1">Mata Pelajaran</label>
                      <select className="w-full border p-2 rounded text-sm" value={form.subject} onChange={e=>setForm({...form, subject: e.target.value})}>
                         {settings.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold mb-1">Kelas</label>
                      <select className="w-full border p-2 rounded text-sm" value={form.classLevel} onChange={e=>setForm({...form, classLevel: e.target.value})}>
                         {classList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                      <label className="block text-xs font-bold mb-1">Tanggal</label>
                      <input type="date" className="w-full border p-2 rounded text-sm" value={form.date} onChange={e=>setForm({...form, date: e.target.value})}/>
                   </div>
                   <div>
                      <label className="block text-xs font-bold mb-1">Durasi (Menit)</label>
                      <input type="number" className="w-full border p-2 rounded text-sm" value={form.duration} onChange={e=>setForm({...form, duration: parseInt(e.target.value)})}/>
                   </div>
                </div>
                {/* NEW SEMESTER INPUT */}
                <div>
                   <label className="block text-xs font-bold mb-1">Semester</label>
                   <select className="w-full border p-2 rounded text-sm" value={form.semester} onChange={e=>setForm({...form, semester: e.target.value})}>
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                   </select>
                </div>

                <div>
                   <label className="block text-xs font-bold mb-1">Token Ujian</label>
                   <div className="flex gap-2">
                      <input className="w-full border p-2 rounded text-sm font-mono tracking-wider bg-slate-100" value={form.token} onChange={e=>setForm({...form, token: e.target.value.toUpperCase()})}/>
                      <button type="button" onClick={generateToken} className="bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300">Acak</button>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <input type="checkbox" id="status" className="w-4 h-4 text-purple-600" checked={form.isActive} onChange={e=>setForm({...form, isActive: e.target.checked})}/>
                   <label htmlFor="status" className="text-sm font-bold text-slate-700">Aktifkan Sesi Ini Sekarang</label>
                </div>
                
                <div className="flex gap-2 pt-2">
                   {editingId && <button type="button" onClick={handleCancel} className="flex-1 bg-slate-200 py-2 rounded font-bold text-sm">Batal</button>}
                   <button className="flex-1 bg-purple-600 text-white py-2 rounded font-bold text-sm hover:bg-purple-700">
                      {editingId ? 'Update Sesi' : 'Simpan Sesi'}
                   </button>
                </div>
             </form>
          </div>

          <div className="md:w-2/3 space-y-4">
             <div className="bg-white p-4 rounded shadow border-l-4 border-slate-500">
                <h3 className="font-bold text-lg text-slate-800">Daftar Sesi Ujian</h3>
                <p className="text-xs text-slate-500">Kelola jadwal dan aktivasi ujian untuk siswa.</p>
             </div>
             
             <div className="grid gap-3">
                {sessions.length === 0 ? (
                   <div className="text-center p-8 bg-slate-50 text-slate-400 rounded border border-dashed">Belum ada sesi ujian.</div>
                ) : (
                   sessions.map(ses => (
                      <div key={ses.id} className={`bg-white p-4 rounded shadow border-l-4 flex flex-col md:flex-row justify-between items-center gap-4 ${ses.isActive ? 'border-green-500 bg-green-50' : 'border-slate-300'}`}>
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                               <h4 className="font-bold text-lg">{ses.title}</h4>
                               {ses.isActive ? (
                                  <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><PlayCircle size={10}/> AKTIF</span>
                               ) : (
                                  <span className="bg-slate-400 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><StopCircle size={10}/> NON-AKTIF</span>
                               )}
                            </div>
                            <div className="text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                               <span><Book size={14} className="inline mr-1"/> {ses.subject}</span>
                               <span><Users size={14} className="inline mr-1"/> {ses.classLevel}</span>
                               <span><Calendar size={14} className="inline mr-1"/> {formatDateIndo(ses.date)}</span>
                               <span><Clock size={14} className="inline mr-1"/> {ses.duration} Menit</span>
                               {/* SHOW SEMESTER */}
                               <span className="bg-yellow-100 text-yellow-800 px-1 rounded text-[10px] font-bold">{ses.semester || 'Ganjil'}</span>
                            </div>
                            <div className="mt-2 text-xs font-mono bg-white inline-block px-2 py-1 rounded border">
                               TOKEN: <span className="font-bold tracking-widest text-lg">{ses.token}</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={()=>toggleStatus(ses)} className={`px-3 py-2 rounded text-xs font-bold text-white shadow ${ses.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                               {ses.isActive ? 'Matikan' : 'Aktifkan'}
                            </button>
                            <div className="flex flex-col gap-1 border-l pl-2">
                               <button onClick={()=>handleEdit(ses)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={18}/></button>
                               <button onClick={()=>handleDelete(ses.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={18}/></button>
                            </div>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
       </div>
    </div>
  );
}

function ExamMonitoring({ sessions, results, students }) {
  const [selectedSessionId, setSelectedSessionId] = useState('');
  
  const sessionList = sessions.sort((a,b) => b.date.localeCompare(a.date));

  const currentSession = sessions.find(s => s.id === selectedSessionId);
  
  const getStudentStatus = (studentId) => {
     const result = results.find(r => r.sessionId === selectedSessionId && r.studentId === studentId);
     if (result) return { status: 'Selesai', score: result.score, time: new Date(result.submittedAt).toLocaleTimeString() };
     return { status: 'Belum', score: '-', time: '-' };
  };
  
  const examStudents = currentSession 
     ? students.filter(s => s.kelas === currentSession.classLevel && s.role !== 'admin')
     : [];

  const handleReset = async (resultId) => {
    if(confirm('Hapus hasil ujian siswa ini? Siswa harus mengerjakan ulang.')) {
       await deleteDoc(doc(getCollectionPath('exam_results'), resultId));
    }
  };

  return (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded shadow border-t-4 border-indigo-600">
          <h2 className="text-xl font-bold mb-4 flex items-center text-indigo-900"><Activity className="mr-2"/> Monitoring & Hasil Ujian</h2>
          
          <div className="mb-6">
             <label className="block text-xs font-bold uppercase mb-1">Pilih Sesi Ujian</label>
             <select 
                className="w-full border p-2 rounded" 
                value={selectedSessionId} 
                onChange={e=>setSelectedSessionId(e.target.value)}
             >
                <option value="">-- Pilih Sesi --</option>
                {sessionList.map(s => (
                   <option key={s.id} value={s.id}>{s.title} - {s.subject} ({s.classLevel})</option>
                ))}
             </select>
          </div>

          {selectedSessionId && currentSession && (
             <div>
                <div className="flex justify-between items-center mb-4">
                   <div className="text-sm">
                      <span className="font-bold">Token: {currentSession.token}</span> | 
                      <span className="ml-2 text-slate-500">{formatDateIndo(currentSession.date)}</span>
                   </div>
                   <button onClick={()=>window.print()} className="bg-slate-800 text-white px-3 py-1 rounded text-xs flex items-center hover:bg-black"><Printer size={14} className="mr-1"/> Cetak Hasil</button>
                </div>

                <div className="overflow-x-auto border rounded">
                   <table className="w-full text-sm">
                      <thead className="bg-indigo-50 text-indigo-900">
                         <tr>
                            <th className="p-3 text-left w-10">No</th>
                            <th className="p-3 text-left">Nama Siswa</th>
                            <th className="p-3 text-center">NISN</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Waktu Submit</th>
                            <th className="p-3 text-center">Nilai</th>
                            <th className="p-3 text-center">Aksi</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y">
                         {examStudents.length === 0 ? (
                            <tr><td colSpan="7" className="p-4 text-center italic text-slate-500">Tidak ada siswa di kelas ini.</td></tr>
                         ) : (
                            examStudents.map((s, i) => {
                               const stat = getStudentStatus(s.id);
                               const resultDoc = results.find(r => r.sessionId === selectedSessionId && r.studentId === s.id);
                               
                               return (
                                  <tr key={s.id} className="hover:bg-slate-50">
                                     <td className="p-3 text-center">{i+1}</td>
                                     <td className="p-3 font-medium">{s.nama}</td>
                                     <td className="p-3 text-center font-mono">{s.nisn}</td>
                                     <td className="p-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stat.status === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                           {stat.status.toUpperCase()}
                                        </span>
                                     </td>
                                     <td className="p-3 text-center">{stat.time}</td>
                                     <td className="p-3 text-center font-bold text-lg">{stat.score}</td>
                                     <td className="p-3 text-center">
                                        {stat.status === 'Selesai' && (
                                           <button 
                                              onClick={()=>handleReset(resultDoc.id)}
                                              className="text-red-500 hover:text-red-700 text-xs underline"
                                           >
                                              Reset
                                           </button>
                                        )}
                                     </td>
                                  </tr>
                               );
                            })
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
       </div>
    </div>
  );
}

function JournalReport({ journals, settings, printConfig, onConfigChange }) {
   const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
   const [filterSubject, setFilterSubject] = useState('');
   
   const filteredJournals = journals.filter(j => {
      const matchMonth = j.date.startsWith(month);
      const matchSubject = filterSubject ? j.subject === filterSubject : true;
      return matchMonth && matchSubject;
   }).sort((a,b) => a.date.localeCompare(b.date) || a.session.localeCompare(b.session));

   return (
      <div className="space-y-6">
         <div className="bg-white p-4 rounded shadow print:hidden flex flex-wrap gap-4 items-end justify-between">
            <div className="flex gap-4">
               <div>
                  <label className="text-xs font-bold block mb-1">Pilih Bulan</label>
                  <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="border p-2 rounded"/>
               </div>
               <div>
                  <label className="text-xs font-bold block mb-1">Filter Mata Pelajaran</label>
                  <select value={filterSubject} onChange={e=>setFilterSubject(e.target.value)} className="border p-2 rounded min-w-[150px]">
                     <option value="">Semua Mapel</option>
                     {(settings.subjects || []).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </div>
            </div>
            
            <div className="flex gap-4 border-l pl-4">
                <div>
                   <label className="text-xs font-bold block mb-1 text-blue-600">Orientasi Cetak</label>
                   <select 
                      value={printConfig.orientation} 
                      onChange={e=>onConfigChange({...printConfig, orientation: e.target.value})} 
                      className="border p-2 rounded text-xs bg-blue-50"
                   >
                      <option value="portrait">Tegak (Portrait)</option>
                      <option value="landscape">Mendatar (Landscape)</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold block mb-1 text-blue-600">Ukuran Kertas</label>
                   <select 
                      value={printConfig.size} 
                      onChange={e=>onConfigChange({...printConfig, size: e.target.value})} 
                      className="border p-2 rounded text-xs bg-blue-50"
                   >
                      <option value="auto">Auto (Default)</option>
                      <option value="A4">A4</option>
                      <option value="F4">F4 (Folio)</option>
                   </select>
                </div>
                <button onClick={()=>window.print()} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center hover:bg-black self-end">
                   <Printer size={18} className="mr-2"/> Cetak
                </button>
            </div>
         </div>

         <div className="bg-white p-10 rounded shadow print:shadow-none print:w-full">
            <div className="flex border-b-4 border-double border-black pb-4 mb-6 items-center justify-between relative px-4">
               <img src={settings.logoUrl || DEFAULT_KOP_LOGO} className="h-24 w-24 object-contain" alt="Logo Kiri"/>
               
               <div className="text-center flex-1 mx-4">
                  <h3 className="text-lg font-bold uppercase tracking-wide">{settings.kabupaten}</h3>
                  <h3 className="text-xl font-bold uppercase tracking-wide">{settings.parentAgency}</h3>
                  <h1 className="text-3xl font-black uppercase tracking-widest my-1">{settings.opdName}</h1>
                  <p className="text-sm italic font-serif">{settings.address}</p>
               </div>

               {settings.logoUrl2 ? (
                 <img src={settings.logoUrl2} className="h-24 w-24 object-contain" alt="Logo Kanan"/>
               ) : (
                 <div className="h-24 w-24"></div> 
               )}
            </div>

            <div className="text-center mb-6">
               <h2 className="text-xl font-bold underline uppercase">LAPORAN JURNAL MENGAJAR GURU</h2>
               <p className="font-medium uppercase mt-1">PERIODE: {new Date(month+'-01').toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</p>
               {filterSubject && <p className="font-bold text-sm mt-1">MAPEL: {filterSubject.toUpperCase()}</p>}
            </div>
            
            <div className="mb-6">
               <table className="w-full max-w-lg font-medium text-sm">
                 <tbody>
                   <tr><td className="w-32 py-1">Nama Guru</td><td>: {settings.teacherName}</td></tr>
                   <tr><td className="py-1">NIP</td><td>: {settings.teacherNip}</td></tr>
                   <tr><td className="py-1">Pangkat/Gol</td><td>: {settings.teacherRank || '-'}</td></tr>
                 </tbody>
               </table>
            </div>

            <table className="w-full border-collapse border border-black text-sm">
               <thead>
                  <tr className="bg-gray-100">
                     <th className="border border-black p-2 w-10">No</th>
                     <th className="border border-black p-2 w-24">Waktu</th>
                     <th className="border border-black p-2 w-20">Kelas</th>
                     <th className="border border-black p-2">Materi / Kegiatan & Refleksi</th>
                     <th className="border border-black p-2 w-28">Ket. Siswa</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredJournals.length > 0 ? (
                     filteredJournals.map((j, i) => (
                        <tr key={j.id}>
                           <td className="border border-black p-2 text-center align-top">{i+1}</td>
                           <td className="border border-black p-2 align-top text-center">
                              <span className="block font-bold">{formatDateIndo(j.date)}</span>
                              <span className="text-xs">{j.session.split(' ')[0]} {j.session.split(' ')[1]}</span>
                           </td>
                           <td className="border border-black p-2 align-top text-center font-bold">{j.className}</td>
                           <td className="border border-black p-2 align-top text-justify">
                              <span className="block font-bold text-xs mb-1 underline uppercase">{j.subject}</span>
                              <div className="font-bold mb-2">{j.topic}</div>
                              
                              {(j.process || j.problems || j.solution || j.feedback || j.evaluation) && (
                                 <div className="mt-2 pt-2 border-t border-dotted border-slate-400 text-xs space-y-1">
                                    {j.process && <div><span className="font-bold">Proses:</span> {j.process}</div>}
                                    {j.problems && <div><span className="font-bold">Kendala:</span> {j.problems}</div>}
                                    {j.solution && <div><span className="font-bold">Solusi:</span> {j.solution}</div>}
                                    {j.feedback && <div><span className="font-bold">Catatan Siswa:</span> {j.feedback}</div>}
                                    {j.evaluation && <div><span className="font-bold italic">Evaluasi Diri:</span> <span className="italic">{j.evaluation}</span></div>}
                                 </div>
                              )}
                           </td>
                           <td className="border border-black p-2 align-top text-xs">
                              Hadir: {j.summary?.hadir}<br/>
                              Sakit: {j.summary?.sakit}<br/>
                              Izin: {j.summary?.izin}<br/>
                              Alpa: {j.summary?.alpa}
                           </td>
                        </tr>
                     ))
                  ) : (
                     <tr><td colSpan="5" className="border border-black p-4 text-center italic">Tidak ada data jurnal sesuai filter.</td></tr>
                  )}
               </tbody>
            </table>

            <div className="mt-16 flex justify-between text-center px-10 break-inside-avoid">
               <div className="w-64">
                  <p>Mengetahui,</p>
                  <p>Kepala Sekolah</p>
                  <br/><br/><br/><br/>
                  <p className="font-bold underline whitespace-nowrap">{settings.headmasterName}</p>
                  <p>{settings.headmasterRank}</p>
                  <p>NIP. {settings.headmasterNip}</p>
               </div>
               <div className="w-64">
                   <p>{getSignatureDate(settings)}</p>
                   <p>{settings.teacherType === 'kelas' ? 'Guru Kelas' : 'Guru Mata Pelajaran'}</p>
                   <br/><br/><br/><br/>
                   <p className="font-bold underline whitespace-nowrap">{settings.teacherName}</p>
                   <p>{settings.teacherRank}</p>
                   <p>NIP. {settings.teacherNip}</p>
               </div>
            </div>
         </div>
      </div>
   );
}

function ScoreRecap({ results, sessions, students, settings, classList }) {
  const [filterClass, setFilterClass] = useState(classList[0] || '');
  const [filterSubject, setFilterSubject] = useState(settings.subjects?.[0] || '');
  const [filterSemester, setFilterSemester] = useState('Ganjil');

  // 1. Filter Sessions based on criteria
  const relevantSessions = sessions.filter(s => 
     s.classLevel === filterClass && 
     s.subject === filterSubject && 
     (s.semester === filterSemester || !s.semester) // Backward compat
  ).sort((a,b) => a.date.localeCompare(b.date));

  // 2. Filter Students
  const classStudents = students.filter(s => s.kelas === filterClass && s.role !== 'admin')
     .sort((a,b) => {
        const noA = parseInt(a.no) || 999;
        const noB = parseInt(b.no) || 999;
        return noA - noB;
     });

  // 3. Helper to get score
  const getScore = (studentId, sessionId) => {
     const res = results.find(r => r.studentId === studentId && r.sessionId === sessionId);
     return res ? res.score : '-';
  };

  return (
    <div className="space-y-6">
       <div className="bg-white p-4 rounded shadow print:hidden flex flex-wrap gap-4 items-end">
          <div>
             <label className="text-xs font-bold block mb-1">Pilih Kelas</label>
             <select className="border p-2 rounded" value={filterClass} onChange={e=>setFilterClass(e.target.value)}>
                {classList.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
          <div>
             <label className="text-xs font-bold block mb-1">Mata Pelajaran</label>
             <select className="border p-2 rounded" value={filterSubject} onChange={e=>setFilterSubject(e.target.value)}>
                {settings.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
          <div>
             <label className="text-xs font-bold block mb-1">Semester</label>
             <select className="border p-2 rounded" value={filterSemester} onChange={e=>setFilterSemester(e.target.value)}>
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
             </select>
          </div>
          <button onClick={()=>window.print()} className="bg-slate-800 text-white px-4 py-2 rounded ml-auto flex items-center hover:bg-black">
             <Printer size={18} className="mr-2"/> Cetak Rekap
          </button>
       </div>

       <div className="bg-white p-10 rounded shadow print:shadow-none print:w-full">
          {/* KOP SURAT */}
          <div className="flex border-b-4 border-double border-black pb-4 mb-6 items-center justify-between relative px-4">
             <img src={settings.logoUrl || DEFAULT_KOP_LOGO} className="h-20 w-20 object-contain" alt="Logo Kiri"/>
             <div className="text-center flex-1 mx-4">
                <h3 className="text-sm font-bold uppercase">{settings.kabupaten}</h3>
                <h3 className="text-base font-bold uppercase">{settings.parentAgency}</h3>
                <h1 className="text-2xl font-black uppercase my-1">{settings.opdName}</h1>
                <p className="text-xs italic font-serif">{settings.address}</p>
             </div>
             {settings.logoUrl2 ? (
               <img src={settings.logoUrl2} className="h-20 w-20 object-contain" alt="Logo Kanan"/>
             ) : ( <div className="h-20 w-20"></div> )}
          </div>

          <div className="text-center mb-6">
             <h2 className="text-lg font-bold underline uppercase">DAFTAR NILAI UJIAN (CBT)</h2>
             <p className="font-medium uppercase text-sm mt-1">
                KELAS: {filterClass} | MAPEL: {filterSubject} | SEMESTER: {filterSemester}
             </p>
          </div>

          {relevantSessions.length === 0 ? (
             <div className="text-center p-8 border border-dashed rounded text-slate-500 italic">
                Tidak ada data ujian untuk kategori ini.
             </div>
          ) : (
             <table className="w-full border-collapse border border-black text-sm">
                <thead>
                   <tr className="bg-gray-100">
                      <th className="border border-black p-2 w-10">No</th>
                      <th className="border border-black p-2 w-24">NISN</th>
                      <th className="border border-black p-2 text-left">Nama Siswa</th>
                      {relevantSessions.map(s => (
                         <th key={s.id} className="border border-black p-2 w-20 text-[10px]">
                            {s.title}<br/>
                            <span className="font-normal">{formatDateIndo(s.date)}</span>
                         </th>
                      ))}
                      <th className="border border-black p-2 w-16">Rata2</th>
                   </tr>
                </thead>
                <tbody>
                   {classStudents.map((s, i) => {
                      let totalScore = 0;
                      let count = 0;
                      return (
                         <tr key={s.id}>
                            <td className="border border-black p-2 text-center">{s.no || i+1}</td>
                            <td className="border border-black p-2 text-center font-mono">{s.nisn || '-'}</td>
                            <td className="border border-black p-2">{s.nama}</td>
                            {relevantSessions.map(ses => {
                               const score = getScore(s.id, ses.id);
                               if (typeof score === 'number') {
                                  totalScore += score;
                                  count++;
                               }
                               return (
                                  <td key={ses.id} className="border border-black p-2 text-center font-bold">
                                     {score}
                                  </td>
                               );
                            })}
                            <td className="border border-black p-2 text-center font-bold bg-slate-50">
                               {count > 0 ? Math.round(totalScore / count) : '-'}
                            </td>
                         </tr>
                      );
                   })}
                </tbody>
             </table>
          )}

          <div className="mt-16 flex justify-end text-center px-10 break-inside-avoid">
             <div className="w-64">
                 <p>{getSignatureDate(settings)}</p>
                 <p>Guru Mata Pelajaran</p>
                 <br/><br/><br/><br/>
                 <p className="font-bold underline uppercase">{settings.teacherName}</p>
                 <p>NIP. {settings.teacherNip}</p>
             </div>
          </div>
       </div>
    </div>
  );
}

function StudentRecap({ students, attendance, settings, classList }) {
   const [className, setClassName] = useState(classList[0] || '');
   const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
   const [filterSubject, setFilterSubject] = useState('');

   useEffect(() => {
     if(classList.length > 0 && !classList.includes(className)) {
         setClassName(classList[0]);
     }
   }, [classList]);

   // SORTING: Sort by 'No' field numerically first
   const classStudents = students.filter(s => s.role !== 'admin' && s.kelas === className)
      .sort((a,b) => {
         const noA = parseInt(a.no) || 999999;
         const noB = parseInt(b.no) || 999999;
         return noA - noB || (a.nama || '').localeCompare(b.nama || '');
      });

   // Determine subjects to show (All or Single)
   const subjectsToShow = filterSubject ? [filterSubject] : (settings.subjects || []);

   // Helper to get stats for a specific subject
   const getSubjectStats = (subj, studId) => {
      const studLogs = attendance.filter(l => 
         l.studentId === studId && 
         l.className === className &&
         l.date.startsWith(month) &&
         l.subject === subj
      );
      return {
         h: studLogs.filter(l => l.status === 'Hadir').length,
         s: studLogs.filter(l => l.status === 'Sakit').length,
         i: studLogs.filter(l => l.status === 'Izin').length,
         a: studLogs.filter(l => l.status === 'Alpa').length,
      };
   };

   return (
      <div className="space-y-6">
         <div className="bg-white p-4 rounded shadow print:hidden flex flex-wrap gap-4 items-end">
            <div>
               <label className="text-xs font-bold block mb-1">Pilih Kelas</label>
               <select value={className} onChange={e=>setClassName(e.target.value)} className="border p-2 rounded">
                  {classList.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
            <div>
               <label className="text-xs font-bold block mb-1">Pilih Bulan</label>
               <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="border p-2 rounded"/>
            </div>
            <div>
               <label className="text-xs font-bold block mb-1">Filter Mapel</label>
               <select value={filterSubject} onChange={e=>setFilterSubject(e.target.value)} className="border p-2 rounded min-w-[150px]">
                  <option value="">Semua Mapel</option>
                  {(settings.subjects || []).map(s => <option key={s} value={s}>{s}</option>)}
               </select>
            </div>
            <button onClick={()=>window.print()} className="bg-slate-800 text-white px-4 py-2 rounded ml-auto flex items-center hover:bg-black">
               <Printer size={18} className="mr-2"/> Cetak Rekapan
            </button>
         </div>

         <div className="print:w-full">
            {subjectsToShow.length === 0 ? (
               <div className="p-10 text-center bg-white rounded shadow text-slate-500 italic">
                  Belum ada Mata Pelajaran yang diatur. Silakan tambahkan di menu Pengaturan.
               </div>
            ) : (
               subjectsToShow.map((subj, index) => (
                  <div key={index} className="bg-white p-10 rounded shadow print:shadow-none print:w-full mb-10 last:mb-0 break-after-page">
                     {/* KOP SURAT */}
                     <div className="flex border-b-4 border-double border-black pb-4 mb-6 items-center justify-between relative px-4">
                        <img src={settings.logoUrl || DEFAULT_KOP_LOGO} className="h-20 w-20 object-contain" alt="Logo Kiri"/>
                        <div className="text-center flex-1 mx-4">
                           <h3 className="text-sm font-bold uppercase">{settings.kabupaten}</h3>
                           <h3 className="text-base font-bold uppercase">{settings.parentAgency}</h3>
                           <h1 className="text-2xl font-black uppercase my-1">{settings.opdName}</h1>
                           <p className="text-xs italic font-serif">{settings.address}</p>
                        </div>
                        {settings.logoUrl2 ? (
                          <img src={settings.logoUrl2} className="h-20 w-20 object-contain" alt="Logo Kanan"/>
                        ) : ( <div className="h-20 w-20"></div> )}
                     </div>

                     <div className="text-center mb-6">
                        <h2 className="text-lg font-bold underline uppercase">REKAPAN KEHADIRAN SISWA</h2>
                        <p className="font-medium">KELAS: {className} | BULAN: {new Date(month+'-01').toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</p>
                        <p className="font-bold text-xs mt-1 uppercase">Mata Pelajaran: {subj}</p>
                     </div>

                     <table className="w-full border-collapse border border-black text-sm">
                        <thead>
                           <tr className="bg-gray-100">
                              <th className="border border-black p-2 w-10" rowSpan="2">No</th>
                              <th className="border border-black p-2 w-24" rowSpan="2">NISN</th>
                              <th className="border border-black p-2 text-left" rowSpan="2">Nama Siswa</th>
                              <th className="border border-black p-2" colSpan="4">Rekapitulasi (Sesi)</th>
                              <th className="border border-black p-2 w-16" rowSpan="2">% Hadir</th>
                           </tr>
                           <tr className="bg-gray-100 text-xs">
                              <th className="border border-black p-1 w-10">H</th>
                              <th className="border border-black p-1 w-10">S</th>
                              <th className="border border-black p-1 w-10">I</th>
                              <th className="border border-black p-1 w-10">A</th>
                           </tr>
                        </thead>
                        <tbody>
                           {classStudents.map((s) => {
                              const stats = getSubjectStats(subj, s.id); // Get stats specific to this loop's subject
                              const total = stats.h + stats.s + stats.i + stats.a;
                              const percent = total > 0 ? Math.round((stats.h / total) * 100) : 0;
                              return (
                                 <tr key={s.id}>
                                    <td className="border border-black p-2 text-center">{s.no}</td>
                                    <td className="border border-black p-2 text-center font-mono">{s.nisn || '-'}</td>
                                    <td className="border border-black p-2">{s.nama}</td>
                                    <td className="border border-black p-2 text-center">{stats.h}</td>
                                    <td className="border border-black p-2 text-center">{stats.s}</td>
                                    <td className="border border-black p-2 text-center">{stats.i}</td>
                                    <td className="border border-black p-2 text-center font-bold text-red-600 print:text-black">{stats.a}</td>
                                    <td className="border border-black p-2 text-center font-bold">{percent}%</td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>

                     <div className="mt-16 flex justify-end text-center px-10 break-inside-avoid">
                        <div className="w-64">
                            <p>{getSignatureDate(settings)}</p>
                            <p>{settings.teacherType === 'kelas' ? 'Guru Kelas' : 'Guru Mata Pelajaran'}</p>
                            <br/><br/><br/><br/>
                            <p className="font-bold underline whitespace-nowrap">{settings.teacherName}</p>
                            <p>NIP. {settings.teacherNip}</p>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
   );
}

function StudentData({ students, classList }) {
   const [form, setForm] = useState({ 
     no: '', 
     nisn: '', 
     nama: '', 
     kelas: '', // Manual Text Input
     role: 'student', 
     username: '', 
     password: '123' 
   });
   const [editingId, setEditingId] = useState(null); // STATE EDIT
   const formRef = useRef(null);
   
   // Filter hanya siswa
   const allStudents = students.filter(s => s.role !== 'admin');
   const [filterKelas, setFilterKelas] = useState('');
   
   // Initialize filter with first available class
   useEffect(() => {
      if(!filterKelas && classList.length > 0) setFilterKelas(classList[0]);
   }, [classList]);

   const filteredList = allStudents.filter(s => s.kelas === filterKelas).sort((a,b) => {
      // Sort by No if available, else by Name
      const noA = parseInt(a.no) || 9999;
      const noB = parseInt(b.no) || 9999;
      return noA - noB || a.nama.localeCompare(b.nama);
   });

   const handleSave = async (e) => {
      e.preventDefault();
      
      if (editingId) {
          // UPDATE
          await updateDoc(doc(getCollectionPath('users'), editingId), {
              ...form
          });
          alert('Data siswa berhasil diperbarui');
          setEditingId(null);
      } else {
          // CREATE
          const username = form.nisn || `user_${Date.now()}`;
          const finalForm = { ...form, role: 'student', username };
          await addDoc(getCollectionPath('users'), finalForm);
          alert('Siswa berhasil ditambahkan');
      }
      setForm({ no: '', nisn: '', nama: '', kelas: form.kelas, role: 'student', username: '', password: '123' }); 
   };

   const handleEdit = (student) => {
       setForm({
           no: student.no || '',
           nisn: student.nisn || '',
           nama: student.nama || '',
           kelas: student.kelas || '',
           role: 'student',
           username: student.username || '',
           password: student.password || '123'
       });
       setEditingId(student.id);
       if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
   };

   const cancelEdit = () => {
       setEditingId(null);
       setForm({ no: '', nisn: '', nama: '', kelas: '', role: 'student', username: '', password: '123' });
   };

   const handleDelete = async (id) => {
      if(confirm('Hapus siswa ini?')) {
          await deleteDoc(doc(getCollectionPath('users'), id));
          
          // Re-numbering Logic (Optional, but requested)
          // Note: This is client-side re-numbering for consistency. 
          // For large datasets, batch update is limited to 500 ops.
          const remainingStudents = allStudents.filter(s => s.id !== id && s.kelas === filterKelas).sort((a,b) => {
              const noA = parseInt(a.no) || 9999;
              const noB = parseInt(b.no) || 9999;
              return noA - noB;
          });

          const batch = writeBatch(db);
          remainingStudents.forEach((s, index) => {
              const newNo = (index + 1).toString();
              if (s.no !== newNo) {
                  const ref = doc(getCollectionPath('users'), s.id);
                  batch.update(ref, { no: newNo });
              }
          });
          await batch.commit();
      }
   };

   // CSV IMPORT HANDLER
   const handleImport = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
         const text = evt.target.result;
         const lines = text.split('\n');
         const batch = writeBatch(db);
         let count = 0;
         
         // Format: No, NISN, Nama Siswa, Kelas
         for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            // Detect header row roughly
            if (line.toLowerCase().includes('nama siswa') && line.toLowerCase().includes('kelas')) continue;

            const parts = line.split(','); // Assuming Comma Separated
            if (parts.length >= 3) {
               // Adjust index based on whether 'No' is present or implied
               // Flexible parsing: Try to grab last item as Kelas, 2nd last as Nama...
               // Let's stick to strict: No, NISN, Nama, Kelas
               let no = parts[0]?.trim();
               let nisn = parts[1]?.trim();
               let nama = parts[2]?.trim();
               let kelas = parts[3]?.trim();
               
               // Basic cleanup
               if(!nama) continue;
               
               const newDocRef = doc(getCollectionPath('users'));
               batch.set(newDocRef, {
                  no, nisn, nama, kelas,
                  role: 'student',
                  username: nisn || `user_${Date.now()}_${i}`,
                  password: '123'
               });
               count++;
            }
         }
         await batch.commit();
         alert(`Berhasil mengimpor ${count} siswa.`);
      };
      reader.readAsText(file);
   };

   return (
      <div className="bg-white p-6 rounded shadow">
         <h2 className="text-xl font-bold mb-6 flex items-center"><GraduationCap className="mr-2"/> Data Siswa</h2>
         
         <div className="flex flex-col md:flex-row gap-6">
            {/* Input Form */}
            <div className="md:w-1/3 bg-slate-50 p-4 rounded border h-fit" ref={formRef}>
               <h3 className="font-bold text-sm mb-3 border-b pb-2">
                   {editingId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
               </h3>
               <form onSubmit={handleSave} className="space-y-3">
                  <div className="flex gap-2">
                    <div className="w-1/3">
                        <label className="text-xs font-bold block mb-1">No. Urut</label>
                        <input className="w-full border p-2 rounded" value={form.no} onChange={e=>setForm({...form, no: e.target.value})} placeholder="1"/>
                    </div>
                    <div className="w-2/3">
                        <label className="text-xs font-bold block mb-1">NISN</label>
                        <input className="w-full border p-2 rounded" value={form.nisn} onChange={e=>setForm({...form, nisn: e.target.value})} placeholder="001xxxx"/>
                    </div>
                  </div>
                  <div>
                     <label className="text-xs font-bold block mb-1">Nama Lengkap</label>
                     <input className="w-full border p-2 rounded" required value={form.nama} onChange={e=>setForm({...form, nama: e.target.value})} placeholder="Nama Siswa"/>
                  </div>
                  <div>
                     <label className="text-xs font-bold block mb-1">Kelas (Manual Input)</label>
                     <input 
                        className="w-full border p-2 rounded bg-white" 
                        required 
                        list="classSuggestions"
                        value={form.kelas} 
                        onChange={e=>setForm({...form, kelas: e.target.value})} 
                        placeholder="Contoh: X IPA 1"
                     />
                     <datalist id="classSuggestions">
                        {classList.map(c => <option key={c} value={c}/>)}
                     </datalist>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                      {editingId && (
                          <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-500 text-white py-2 rounded font-bold hover:bg-gray-600 text-sm">
                              Batal
                          </button>
                      )}
                      <button className={`flex-1 text-white py-2 rounded font-bold text-sm ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                          {editingId ? 'Update Data' : 'Simpan Siswa'}
                      </button>
                  </div>
               </form>

               {!editingId && (
                   <div className="mt-6 pt-4 border-t">
                      <h3 className="font-bold text-xs mb-2">Import Data (CSV)</h3>
                      <p className="text-[10px] text-slate-500 mb-2">Format: No, NISN, Nama Siswa, Kelas</p>
                      <label className="flex items-center justify-center w-full p-2 bg-green-100 text-green-700 rounded cursor-pointer hover:bg-green-200 text-xs font-bold border border-green-300">
                         <Upload size={14} className="mr-2"/> Upload File CSV
                         <input type="file" accept=".csv" hidden onChange={handleImport}/>
                      </label>
                   </div>
               )}
            </div>

            {/* List */}
            <div className="md:w-2/3">
               <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-bold">Filter Kelas:</span>
                     <select value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} className="border p-1 rounded text-sm min-w-[120px]">
                        {classList.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
                  <span className="text-sm text-slate-500">Total: {filteredList.length} Siswa</span>
               </div>
               
               <div className="border rounded overflow-hidden">
                  <table className="w-full text-sm">
                     <thead className="bg-slate-100">
                        <tr>
                           <th className="p-2 text-center w-10">No</th>
                           <th className="p-2 text-center w-24">NISN</th>
                           <th className="p-2 text-left">Nama Siswa</th>
                           <th className="p-2 text-left w-24">Kelas</th>
                           <th className="p-2 text-center w-24">Aksi</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y">
                        {filteredList.map((s, i) => (
                           <tr key={s.id} className={`hover:bg-slate-50 ${editingId === s.id ? 'bg-yellow-50' : ''}`}>
                              <td className="p-2 text-center">{s.no || i+1}</td>
                              <td className="p-2 text-center text-slate-500 font-mono text-xs">{s.nisn || '-'}</td>
                              <td className="p-2 font-medium">{s.nama}</td>
                              <td className="p-2 text-xs text-slate-600">{s.kelas}</td>
                              <td className="p-2 text-center">
                                 <button onClick={()=>handleEdit(s)} className="text-blue-600 p-1 hover:bg-blue-50 rounded mr-1" title="Edit">
                                     <Edit size={16}/>
                                 </button>
                                 <button onClick={()=>handleDelete(s.id)} className="text-red-600 p-1 hover:bg-red-50 rounded" title="Hapus">
                                     <Trash2 size={16}/>
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
   );
}

function UserManagement({ students }) {
  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState({});

  const handleEdit = (user) => {
    setEditingId(user.id);
    setTempData({ username: user.username || user.nisn, password: user.password });
  };

  const handleSave = async (user) => {
    const updateData = { password: tempData.password };
    
    // For admin, update username. For student, update nisn/username sync
    if (user.role === 'admin') {
       updateData.username = tempData.username;
    } else {
       updateData.nisn = tempData.username;
       updateData.username = tempData.username; // Keep username synced with NISN for login logic
    }

    await updateDoc(doc(getCollectionPath('users'), user.id), updateData);
    setEditingId(null);
    alert('Kredensial berhasil diperbarui');
  };

  // Filter students and admin. Create a copy to avoid mutation error
  const allUsers = [...students].sort((a, b) => (a.role === 'admin' ? -1 : 1));

  return (
     <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-6 flex items-center text-slate-800"><UserCog className="mr-2"/> Manajemen User</h2>
        <div className="overflow-x-auto border rounded">
           <table className="w-full text-sm">
              <thead className="bg-slate-100">
                 <tr>
                    <th className="p-3 text-left">Nama</th>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-left">Username / NISN</th>
                    <th className="p-3 text-left">Password</th>
                    <th className="p-3 text-center">Aksi</th>
                 </tr>
              </thead>
              <tbody className="divide-y">
                 {allUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                       <td className="p-3 font-medium">
                          {u.nama}
                          {u.role === 'admin' && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1 rounded border border-blue-200">Guru</span>}
                       </td>
                       <td className="p-3 capitalize">{u.role === 'student' ? 'Siswa' : 'Admin'}</td>
                       <td className="p-3">
                          {editingId === u.id ? (
                             <input className="border p-1 rounded w-full" value={tempData.username} onChange={e=>setTempData({...tempData, username: e.target.value})}/>
                          ) : (
                             <span className="font-mono">{u.role === 'admin' ? u.username : u.nisn}</span>
                          )}
                       </td>
                       <td className="p-3">
                          {editingId === u.id ? (
                             <input className="border p-1 rounded w-full" value={tempData.password} onChange={e=>setTempData({...tempData, password: e.target.value})}/>
                          ) : (
                             <span className="font-mono">{u.password}</span>
                          )}
                       </td>
                       <td className="p-3 text-center">
                          {editingId === u.id ? (
                             <div className="flex justify-center gap-2">
                                <button onClick={()=>handleSave(u)} className="text-green-600 bg-green-50 p-1 rounded"><Save size={16}/></button>
                                <button onClick={()=>setEditingId(null)} className="text-red-600 bg-red-50 p-1 rounded"><XCircle size={16}/></button>
                             </div>
                          ) : (
                             <button onClick={()=>handleEdit(u)} className="text-blue-600 bg-blue-50 p-1 rounded"><Edit size={16}/></button>
                          )}
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
     </div>
  );
}

function AdminSettings({ settings, user }) {
  const [form, setForm] = useState(settings);
  const [activeTab, setActiveTab] = useState('umum'); // 'umum' | 'mapel'
  const [newSubject, setNewSubject] = useState('');

  // Update form jika settings berubah di parent
  useEffect(() => {
     setForm(settings);
  }, [settings]);

  const save = async () => {
    await updateDoc(doc(getCollectionPath('settings'), settings.id), form);
    alert('Pengaturan disimpan');
  };

  const handleLogoUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({...prev, [field]: reader.result}));
    reader.readAsDataURL(file);
  };

  const clearLogo = (field) => {
     setForm(prev => ({...prev, [field]: ''}));
  };

  const addSubject = () => {
     if(newSubject && !form.subjects?.includes(newSubject)) {
        setForm(prev => ({
           ...prev,
           subjects: [...(prev.subjects || []), newSubject]
        }));
        setNewSubject('');
     }
  };

  const removeSubject = (sub) => {
     setForm(prev => ({
        ...prev,
        subjects: prev.subjects.filter(s => s !== sub)
     }));
  };

  return (
    <div className="max-w-4xl bg-white p-6 rounded shadow">
       <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold flex items-center text-slate-800"><Settings className="mr-2"/> Pengaturan Sekolah & Aplikasi</h2>
          <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded font-bold shadow hover:bg-blue-700 flex items-center">
             <Save size={18} className="mr-2"/> Simpan Perubahan
          </button>
       </div>

       {/* Tabs Navigation */}
       <div className="flex gap-4 border-b mb-6">
          <button 
             onClick={()=>setActiveTab('umum')}
             className={`pb-2 px-4 font-bold text-sm ${activeTab === 'umum' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          >
             Umum & Data Guru
          </button>
          <button 
             onClick={()=>setActiveTab('mapel')}
             className={`pb-2 px-4 font-bold text-sm ${activeTab === 'mapel' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          >
             Mata Pelajaran
          </button>
       </div>

       {activeTab === 'umum' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* KOLOM KIRI: IDENTITAS SEKOLAH & LOGO */}
             <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                   <h3 className="font-bold text-sm uppercase text-slate-500 mb-4 border-b pb-2">Identitas Sekolah (Kop Surat)</h3>
                   <div className="space-y-3">
                      <div>
                         <label className="font-bold text-xs uppercase block mb-1">Instansi Induk (Kab/Prov)</label>
                         <input className="w-full border p-2 rounded text-sm" placeholder="PEMERINTAH PROVINSI ..." value={form.kabupaten || ''} onChange={e=>setForm({...form, kabupaten: e.target.value})}/>
                      </div>
                      <div>
                         <label className="font-bold text-xs uppercase block mb-1">Nama Dinas / Yayasan</label>
                         <input className="w-full border p-2 rounded text-sm" placeholder="DINAS PENDIDIKAN DAN KEBUDAYAAN" value={form.parentAgency} onChange={e=>setForm({...form, parentAgency: e.target.value})}/>
                      </div>
                      <div>
                         <label className="font-bold text-xs uppercase block mb-1">Nama Sekolah</label>
                         <input className="w-full border p-2 rounded text-sm font-bold" placeholder="SMA NEGERI ..." value={form.opdName} onChange={e=>setForm({...form, opdName: e.target.value})}/>
                      </div>
                      <div>
                         <label className="font-bold text-xs uppercase block mb-1">Alamat Lengkap</label>
                         <textarea className="w-full border p-2 rounded text-sm" rows="2" placeholder="Jl. Raya No. 1..." value={form.address} onChange={e=>setForm({...form, address: e.target.value})}/>
                      </div>
                      
                      {/* PENGATURAN CETAK */}
                      <div className="pt-2 border-t mt-2">
                         <div className="grid grid-cols-2 gap-2">
                            <div>
                               <label className="font-bold text-xs uppercase block mb-1">Tempat Tanda Tangan</label>
                               <input className="w-full border p-2 rounded text-sm" placeholder="Contoh: Bobong" value={form.signingCity || ''} onChange={e=>setForm({...form, signingCity: e.target.value})}/>
                            </div>
                            <div>
                               <label className="font-bold text-xs uppercase block mb-1">Format Tanggal</label>
                               <select className="w-full border p-2 rounded text-sm" value={form.dateFormat || 'long'} onChange={e=>setForm({...form, dateFormat: e.target.value})}>
                                  <option value="long">23 Januari 2026</option>
                                  <option value="short">23/01/2026</option>
                                  <option value="numeric">2026-01-23</option>
                               </select>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                   <h3 className="font-bold text-sm uppercase text-slate-500 mb-4 border-b pb-2">Pengaturan Logo (Kop Surat)</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                         <label className="block text-xs font-bold mb-2">Logo Kiri (Wajib)</label>
                         <div className="border-2 border-dashed bg-white p-2 rounded h-32 flex items-center justify-center mb-2 relative group">
                            {form.logoUrl ? <img src={form.logoUrl} className="max-h-full max-w-full object-contain"/> : <ImageIcon className="text-slate-300"/>}
                            <label className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs cursor-pointer rounded">
                               Ganti Logo
                               <input type="file" hidden accept="image/*" onChange={(e)=>handleLogoUpload(e, 'logoUrl')}/>
                            </label>
                         </div>
                         <span className="text-[10px] text-slate-500">Klik gambar untuk mengganti</span>
                      </div>
                      
                      <div className="text-center">
                         <label className="block text-xs font-bold mb-2">Logo Kanan (Opsional)</label>
                         <div className="border-2 border-dashed bg-white p-2 rounded h-32 flex items-center justify-center mb-2 relative group">
                            {form.logoUrl2 ? <img src={form.logoUrl2} className="max-h-full max-w-full object-contain"/> : <span className="text-xs text-slate-300">Kosong</span>}
                            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex flex-col items-center justify-center text-white text-xs cursor-pointer rounded gap-2">
                               <label className="cursor-pointer hover:underline">
                                  Upload
                                  <input type="file" hidden accept="image/*" onChange={(e)=>handleLogoUpload(e, 'logoUrl2')}/>
                               </label>
                               {form.logoUrl2 && <button onClick={()=>clearLogo('logoUrl2')} className="text-red-300 hover:text-red-100">Hapus</button>}
                            </div>
                         </div>
                         <span className="text-[10px] text-slate-500">Logo Pemda / Sekolah</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* KOLOM KANAN: PEJABAT */}
             <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                   <h3 className="font-bold text-sm uppercase text-blue-800 mb-4 border-b border-blue-200 pb-2">Data Kepala Sekolah</h3>
                   <div className="space-y-3">
                      <div>
                         <label className="font-bold text-xs uppercase block mb-1">Nama Lengkap & Gelar</label>
                         <input className="w-full border p-2 rounded text-sm" placeholder="Nama Kepala Sekolah..." value={form.headmasterName || ''} onChange={e=>setForm({...form, headmasterName: e.target.value})}/>
                      </div>
                      <div>
                         <label className="font-bold text-xs uppercase block mb-1">NIP</label>
                         <input className="w-full border p-2 rounded text-sm" placeholder="198xxxx..." value={form.headmasterNip || ''} onChange={e=>setForm({...form, headmasterNip: e.target.value})}/>
                      </div>
                      <div>
                         <label className="font-bold text-xs uppercase block mb-1">Pangkat / Golongan (Opsional)</label>
                         <input className="w-full border p-2 rounded text-sm" placeholder="Pembina Tk. I (IV/b)" value={form.headmasterRank || ''} onChange={e=>setForm({...form, headmasterRank: e.target.value})}/>
                      </div>
                   </div>
                </div>

                <div className="bg-green-50 p-4 rounded border border-green-200">
                   <h3 className="font-bold text-sm uppercase text-green-800 mb-4 border-b border-green-200 pb-2">Data Guru Pengampu (Anda)</h3>
                   <div className="space-y-3">
                      <div>
                         <label className="font-bold text-xs uppercase block mb-1">Status Guru</label>
                         <div className="flex gap-4 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                               <input type="radio" name="teacherType" value="mapel" checked={form.teacherType !== 'kelas'} onChange={()=>setForm({...form, teacherType: 'mapel'})} />
                               Guru Mata Pelajaran
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                               <input type="radio" name="teacherType" value="kelas" checked={form.teacherType === 'kelas'} onChange={()=>setForm({...form, teacherType: 'kelas'})} />
                               Guru Kelas (SD/TK)
                            </label>
                         </div>
                      </div>
                      <div>
                         <label className="font-bold text-xs uppercase block mb-1">Nama Lengkap & Gelar</label>
                         <input className="w-full border p-2 rounded text-sm" placeholder="Nama Guru..." value={form.teacherName} onChange={e=>setForm({...form, teacherName: e.target.value})}/>
                      </div>
                      <div>
                         <label className="font-bold text-xs uppercase block mb-1">NIP</label>
                         <input className="w-full border p-2 rounded text-sm" placeholder="199xxxx..." value={form.teacherNip || ''} onChange={e=>setForm({...form, teacherNip: e.target.value})}/>
                      </div>
                      <div>
                         <label className="font-bold text-xs uppercase block mb-1">Pangkat / Golongan (Opsional)</label>
                         <input className="w-full border p-2 rounded text-sm" placeholder="Penata Muda (III/a)" value={form.teacherRank || ''} onChange={e=>setForm({...form, teacherRank: e.target.value})}/>
                      </div>
                   </div>
                </div>

                <div className="p-4 rounded border border-slate-200 text-xs text-slate-500 italic">
                   * Data ini akan digunakan secara otomatis pada Kop Surat laporan dan kolom tanda tangan.
                </div>
             </div>
          </div>
       )}

       {activeTab === 'mapel' && (
          <div className="bg-slate-50 p-6 rounded border">
             <h3 className="font-bold text-lg mb-4 text-slate-800">Daftar Mata Pelajaran</h3>
             <p className="text-sm text-slate-500 mb-4">Tambahkan daftar mata pelajaran yang Anda ajarkan. Ini akan muncul di menu Input Jurnal dan Filter Laporan.</p>
             
             <div className="flex gap-2 mb-6">
                <input 
                   className="flex-1 border p-2 rounded" 
                   placeholder="Contoh: Matematika, Bahasa Indonesia, Tematik..." 
                   value={newSubject}
                   onChange={e=>setNewSubject(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && addSubject()}
                />
                <button onClick={addSubject} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700">
                   Tambah
                </button>
             </div>

             <div className="flex flex-wrap gap-2">
                {(form.subjects || []).length === 0 && <span className="text-slate-400 italic">Belum ada mata pelajaran.</span>}
                {(form.subjects || []).map((sub, idx) => (
                   <div key={idx} className="bg-white border px-3 py-1 rounded-full flex items-center gap-2 shadow-sm text-sm">
                      <span className="font-bold text-slate-700">{sub}</span>
                      <button onClick={()=>removeSubject(sub)} className="text-red-400 hover:text-red-600 bg-slate-100 rounded-full p-0.5">
                         <X size={14}/>
                      </button>
                   </div>
                ))}
             </div>
          </div>
       )}
    </div>
  );
}