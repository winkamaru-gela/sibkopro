import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'; 
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, collection, setDoc, where, getDocs 
} from 'firebase/firestore';

// Import Config & Utils
import { auth, db, getCollectionRef } from './config/firebase';
import { COLLECTION_PATHS, INITIAL_ADMIN } from './utils/constants';

// Import Components & Pages
import ProtectedRoute from './components/ProtectedRoute'; 
import Login from './pages/Login';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import GuruDashboard from './pages/GuruDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import StudentManager from './pages/StudentManager';
import Journal from './pages/Journal';
import Reports from './pages/Reports';
import SchoolSettings from './pages/SchoolSettings';
import AccountSettings from './pages/AccountSettings';
import PointManager from './pages/PointManager';         
import MasterDataSettings from './pages/MasterDataSettings'; 
import StudentPointBook from './pages/StudentPointBook';
import SanctionBook from './pages/SanctionBook';
import CounselingHistory from './pages/CounselingHistory';
import LetterManager from './pages/LetterManager';

export default function App() {
    const [authUser, setAuthUser] = useState(null); 
    
    // 1. INISIALISASI USER DARI LOCAL STORAGE
    const [appUser, setAppUser] = useState(() => {
        const savedUser = localStorage.getItem('appUser_sibko');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [loading, setLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    
    // State Data
    const [allUsers, setAllUsers] = useState([]);
    const [students, setStudents] = useState([]);
    const [journals, setJournals] = useState([]);
    const [mySettings, setMySettings] = useState({});
    
    // State Poin, Master Data & Sanctions
    const [pointLogs, setPointLogs] = useState([]);       
    const [masterPoints, setMasterPoints] = useState([]); 
    const [sanctionRules, setSanctionRules] = useState([]); 

    const navigate = useNavigate();
    const location = useLocation();

    // --- 1. AUTHENTICATION & INITIAL LOAD ---
    useEffect(() => {
        signInAnonymously(auth).catch(console.error);
        
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setAuthUser(u);
            
            // [PERBAIKAN UTAMA] 
            // Jika firebase connect TAPI tidak ada user yang tersimpan di localStorage,
            // Matikan loading agar halaman Login bisa muncul.
            if (u && !appUser) {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []); // Dependency kosong agar hanya jalan sekali

    // --- 2. FETCH DATA UNTUK ADMIN ---
    useEffect(() => {
        // Hanya jalan jika Auth Firebase ready DAN user adalah Admin
        if (!authUser || appUser?.role !== 'admin') return;

        const q = query(getCollectionRef(COLLECTION_PATHS.users));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setAllUsers(data);
            
            // Auto-create admin jika kosong (First Run)
            if(data.length === 0) {
                addDoc(getCollectionRef(COLLECTION_PATHS.users), INITIAL_ADMIN);
            }
            setLoading(false);
        });
        return () => unsub();
    }, [authUser, appUser]);

    // --- 3. FETCH DATA UNTUK GURU & OPERASIONAL ---
    useEffect(() => {
        // Butuh Auth Firebase DAN App User (Baik Guru maupun Admin)
        if (!authUser || !appUser) return;

        // Fetch Settings & Master Data (Semua Role butuh ini)
        const qSettings = query(getCollectionRef(COLLECTION_PATHS.settings), where("teacherId", "==", appUser.id));
        const unsubSettings = onSnapshot(qSettings, snap => { 
            if(!snap.empty) setMySettings({id: snap.docs[0].id, ...snap.docs[0].data()}); 
            else setMySettings({}); 
        });

        const unsubMaster = onSnapshot(doc(db, 'settings', `master_points_${appUser.id}`), (docSnap) => setMasterPoints(docSnap.exists() ? docSnap.data().items : []));
        const unsubSanctions = onSnapshot(doc(db, 'settings', `sanction_rules_${appUser.id}`), (docSnap) => setSanctionRules(docSnap.exists() ? docSnap.data().items : []));

        // Fetch Data Spesifik Guru (Hanya jika bukan Admin)
        let unsubStudents = () => {};
        let unsubJournals = () => {};
        let unsubPoints = () => {};

        if (appUser.role !== 'admin') {
            const qStudents = query(getCollectionRef(COLLECTION_PATHS.students), where("teacherId", "==", appUser.id));
            unsubStudents = onSnapshot(qStudents, snap => setStudents(snap.docs.map(d => ({id: d.id, ...d.data()}))));

            const qJournals = query(getCollectionRef(COLLECTION_PATHS.journals), where("teacherId", "==", appUser.id));
            unsubJournals = onSnapshot(qJournals, snap => setJournals(snap.docs.map(d => ({id: d.id, ...d.data()}))));

            const qPoints = query(collection(db, 'point_logs'), where("teacherId", "==", appUser.id));
            unsubPoints = onSnapshot(qPoints, snap => setPointLogs(snap.docs.map(d => ({id: d.id, ...d.data()}))));
            
            // Set loading false setelah init listener guru
            setLoading(false);
        } else {
            // Jika admin, matikan loading di sini juga (backup jika useEffect admin telat)
            setLoading(false);
        }

        return () => { 
            unsubStudents(); unsubJournals(); unsubSettings(); 
            unsubPoints(); unsubMaster(); unsubSanctions(); 
        };
    }, [authUser, appUser]);

    // --- LOGIC LOGIN (DIPERBAIKI) ---
    const handleLogin = async (u, p) => {
        setLoginLoading(true); 
        setLoginError('');
        
        try {
            // [PERBAIKAN] Query langsung ke Firestore, jangan andalkan state allUsers yang mungkin kosong
            const q = query(
                getCollectionRef(COLLECTION_PATHS.users), 
                where("username", "==", u),
                where("password", "==", p)
            );
            
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = { id: userDoc.id, ...userDoc.data() };
                
                setAppUser(userData);
                localStorage.setItem('appUser_sibko', JSON.stringify(userData));
                
                // Redirect ke halaman asal atau home
                const origin = location.state?.from?.pathname || '/';
                navigate(origin);
            } else {
                // Fallback untuk inisialisasi awal jika database benar-benar kosong
                // Cek apakah ini login admin default pertama kali
                if (u === INITIAL_ADMIN.username && p === INITIAL_ADMIN.password) {
                     // Cek apakah users collection kosong
                     const allUsersSnap = await getDocs(getCollectionRef(COLLECTION_PATHS.users));
                     if (allUsersSnap.empty) {
                         const docRef = await addDoc(getCollectionRef(COLLECTION_PATHS.users), INITIAL_ADMIN);
                         const newAdmin = { id: docRef.id, ...INITIAL_ADMIN };
                         setAppUser(newAdmin);
                         localStorage.setItem('appUser_sibko', JSON.stringify(newAdmin));
                         navigate('/');
                         return;
                     }
                }
                setLoginError('Salah username atau password');
            }
        } catch (error) {
            console.error("Login Error:", error);
            setLoginError('Terjadi kesalahan koneksi.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = () => { 
        if(confirm("Keluar?")) {
            setAppUser(null);
            setAllUsers([]); // Bersihkan data sensitif
            setStudents([]);
            localStorage.removeItem('appUser_sibko');
            navigate('/login');
        } 
    };

    const handleUpdatePassword = async (data) => {
        await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.users), data.id), { password: data.password, fullName: data.fullName });
        const updatedUser = {...appUser, password: data.password, fullName: data.fullName};
        setAppUser(updatedUser);
        localStorage.setItem('appUser_sibko', JSON.stringify(updatedUser)); 
        alert("Profil berhasil diperbarui.");
    }

    if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 font-bold animate-pulse">Loading System...</div>;

    return (
        <Routes>
            <Route path="/login" element={!appUser ? <Login onLogin={handleLogin} loading={loginLoading} error={loginError} /> : <Navigate to="/" replace />} />

            <Route path="/*" element={
                <ProtectedRoute user={appUser}>
                    <Layout userRole={appUser?.role} userName={appUser?.fullName} onLogout={handleLogout}>
                        <Routes>
                            {appUser?.role === 'admin' ? (
                                <>
                                    <Route path="/" element={<AdminDashboard users={allUsers} />} />
                                    <Route path="/users" element={<AdminUserManagement users={allUsers} />} />
                                    <Route path="/letters" element={
                                        <LetterManager 
                                            students={students} 
                                            user={appUser} 
                                            settings={mySettings} 
                                            pointLogs={pointLogs}
                                            masterPoints={masterPoints}
                                            sanctionRules={sanctionRules}
                                        /> 
                                    } />
                                    <Route path="/settings" element={
                                        <SchoolSettings 
                                            settings={mySettings} 
                                            onSave={(d) => mySettings.id ? updateDoc(doc(getCollectionRef(COLLECTION_PATHS.settings), mySettings.id), d).then(()=>alert("Tersimpan")) : addDoc(getCollectionRef(COLLECTION_PATHS.settings), {...d, teacherId: appUser.id}).then(()=>alert("Tersimpan"))} 
                                        />
                                    } />
                                    <Route path="/account" element={<AccountSettings user={appUser} onUpdatePassword={handleUpdatePassword} />} />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </>
                            ) : (
                                <>
                                    <Route path="/" element={<GuruDashboard students={students} journals={journals} user={appUser} pointLogs={pointLogs} settings={mySettings} />} />
                                    <Route path="/students" element={
                                        <StudentManager 
                                            students={students} journals={journals} pointLogs={pointLogs} sanctionRules={sanctionRules} user={appUser}
                                            onAdd={(d) => addDoc(getCollectionRef(COLLECTION_PATHS.students), {...d, teacherId: appUser.id, createdAt: new Date().toISOString()})} 
                                            onEdit={(d) => updateDoc(doc(getCollectionRef(COLLECTION_PATHS.students), d.id), d)} 
                                            onDelete={(id) => deleteDoc(doc(getCollectionRef(COLLECTION_PATHS.students), id))}
                                            onImport={(list) => { 
                                                const batch = writeBatch(db);
                                                list.forEach(s => batch.set(doc(collection(db, COLLECTION_PATHS.students)), { ...s, teacherId: appUser.id, createdAt: new Date().toISOString() }));
                                                batch.commit().then(() => alert("Import Berhasil"));
                                            }} 
                                            onMoveClass={(ids, cls) => {
                                                const batch = writeBatch(db);
                                                ids.forEach(id => batch.update(doc(getCollectionRef(COLLECTION_PATHS.students), id), { class: cls }));
                                                batch.commit().then(() => alert("Pindah Kelas Berhasil"));
                                            }}
                                        />
                                    } />
                                    <Route path="/journal" element={
                                        <Journal 
                                            students={students} journals={journals} settings={mySettings}
                                            onAdd={(d) => addDoc(getCollectionRef(COLLECTION_PATHS.journals), {...d, teacherId: appUser.id})} 
                                            onUpdate={(d) => updateDoc(doc(db, COLLECTION_PATHS.journals, d.id), d)} 
                                            onDelete={(id) => deleteDoc(doc(db, COLLECTION_PATHS.journals, id))}
                                        />
                                    } />
                                    <Route path="/points" element={<PointManager students={students} pointLogs={pointLogs} masterPoints={masterPoints} sanctionRules={sanctionRules} settings={mySettings} onAddPoint={(d) => addDoc(collection(db, 'point_logs'), {...d, teacherId: appUser.id})} onUpdatePoint={(d) => updateDoc(doc(db, 'point_logs', d.id), d)} onDeletePoint={(id) => deleteDoc(doc(db, 'point_logs', id))} />} />
                                    <Route path="/point-book" element={<StudentPointBook students={students} pointLogs={pointLogs} journals={journals} settings={mySettings} sanctionRules={sanctionRules} />} />
                                    <Route path="/sanction-book" element={<SanctionBook students={students} pointLogs={pointLogs} sanctionRules={sanctionRules} settings={mySettings} />} />
                                    <Route path="/counseling-history" element={<CounselingHistory students={students} journals={journals} settings={mySettings} user={appUser} />} />
                                    <Route path="/reports" element={<Reports journals={journals} students={students} settings={mySettings} />} />
                                    <Route path="/letters" element={
                                        <LetterManager 
                                            students={students} 
                                            user={appUser} 
                                            settings={mySettings} 
                                            pointLogs={pointLogs}
                                            masterPoints={masterPoints}
                                            sanctionRules={sanctionRules}
                                        /> 
                                    } />
                                    <Route path="/master-points" element={
                                        <div className="space-y-8 animate-in fade-in pb-10 p-4 md:p-6">
                                            <MasterDataSettings 
                                                masterPoints={masterPoints} 
                                                onSavePoints={(items) => setDoc(doc(db, 'settings', `master_points_${appUser.id}`), { items }).then(() => alert("Tersimpan"))}
                                                sanctionRules={sanctionRules}
                                                onSaveSanctions={(items) => setDoc(doc(db, 'settings', `sanction_rules_${appUser.id}`), { items }).then(() => alert("Tersimpan"))}
                                            />
                                        </div>
                                    } />
                                    <Route path="/settings" element={<SchoolSettings settings={mySettings} onSave={(d) => mySettings.id ? updateDoc(doc(getCollectionRef(COLLECTION_PATHS.settings), mySettings.id), d).then(()=>alert("Tersimpan")) : addDoc(getCollectionRef(COLLECTION_PATHS.settings), {...d, teacherId: appUser.id}).then(()=>alert("Tersimpan"))} />} />
                                    <Route path="/account" element={<AccountSettings user={appUser} onUpdatePassword={handleUpdatePassword} />} />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </>
                            )}
                        </Routes>
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
}