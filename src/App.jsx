import React, { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, collection, setDoc 
} from 'firebase/firestore';

// Import Config & Utils
import { auth, db, getCollectionRef } from './config/firebase';
import { COLLECTION_PATHS, INITIAL_ADMIN } from './utils/constants';

// Import Components & Pages
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

export default function App() {
    const [authUser, setAuthUser] = useState(null); 
    const [appUser, setAppUser] = useState(null);   
    const [loading, setLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');

    // Data States
    const [allUsers, setAllUsers] = useState([]);
    const [students, setStudents] = useState([]);
    const [journals, setJournals] = useState([]);
    const [mySettings, setMySettings] = useState({});
    
    // State Poin, Master Data & Sanctions
    const [pointLogs, setPointLogs] = useState([]);       
    const [masterPoints, setMasterPoints] = useState([]); 
    const [sanctionRules, setSanctionRules] = useState([]); // <--- STATE BARU

    // 1. Init Firebase Auth
    useEffect(() => {
        signInAnonymously(auth).catch(console.error);
        return onAuthStateChanged(auth, u => setAuthUser(u));
    }, []);

    // 2. Fetch Users (Wait for auth)
    useEffect(() => {
        if (!authUser) return;
        const q = query(getCollectionRef(COLLECTION_PATHS.users));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setAllUsers(data);
            if(data.length === 0) {
                addDoc(getCollectionRef(COLLECTION_PATHS.users), INITIAL_ADMIN);
            }
            setLoading(false);
        });
        return () => unsub();
    }, [authUser]);

    // 3. Fetch Data (Only if logged in)
    useEffect(() => {
        if (!appUser || !authUser) return;

        // A. Fetch Students
        const unsubStudents = onSnapshot(getCollectionRef(COLLECTION_PATHS.students), snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            if(appUser.role === 'guru') {
                data = data.filter(d => d.teacherId === appUser.id);
            }
            setStudents(data);
        });

        // B. Fetch Journals
        const unsubJournals = onSnapshot(getCollectionRef(COLLECTION_PATHS.journals), snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            if(appUser.role === 'guru') {
                data = data.filter(d => d.teacherId === appUser.id);
            }
            setJournals(data);
        });

        // C. Fetch Settings
        const unsubSettings = onSnapshot(getCollectionRef(COLLECTION_PATHS.settings), snap => {
            const allSettings = snap.docs.map(d => ({id: d.id, ...d.data()}));
            const mySet = allSettings.find(s => s.userId === appUser.id);
            if(mySet) setMySettings(mySet);
            else setMySettings({});
        });

        // D. Fetch Point Logs
        const unsubPoints = onSnapshot(collection(db, 'point_logs'), snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setPointLogs(data);
        });

        // E. Fetch Master Data Points
        const unsubMaster = onSnapshot(doc(db, 'settings', 'master_points'), (docSnap) => {
            if (docSnap.exists()) {
                setMasterPoints(docSnap.data().items || []);
            } else {
                setMasterPoints([]);
            }
        });

        // F. Fetch Sanction Rules (BARU)
        const unsubSanctions = onSnapshot(doc(db, 'settings', 'sanction_rules'), (docSnap) => {
            if (docSnap.exists()) {
                setSanctionRules(docSnap.data().items || []);
            } else {
                setSanctionRules([]);
            }
        });

        return () => { 
            unsubStudents(); unsubJournals(); unsubSettings(); 
            unsubPoints(); unsubMaster(); unsubSanctions(); 
        };
    }, [appUser, authUser]);

    // --- LOGIC FUNCTIONS ---
    const handleLogin = (u, p) => {
        setLoginLoading(true);
        setLoginError('');
        setTimeout(() => {
            const user = allUsers.find(x => x.username === u && x.password === p);
            if (user) {
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
            setPointLogs([]);
            setMasterPoints([]);
            setSanctionRules([]);
        }
    };

    const handleUpdatePassword = async (data) => {
        try {
            await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.users), data.id), {
                password: data.password,
                fullName: data.fullName
            });
            setAppUser(prev => ({...prev, password: data.password, fullName: data.fullName}));
            alert("Profil berhasil diperbarui.");
        } catch (e) { alert("Gagal update profil."); }
    }

    // --- CRUD ACTIONS ---
    const addStudent = async (data) => {
        await addDoc(getCollectionRef(COLLECTION_PATHS.students), { ...data, teacherId: appUser.id, createdAt: new Date().toISOString() });
    };
    
    const importStudents = async (studentList) => {
        try {
            const batch = writeBatch(db);
            studentList.forEach(student => {
                const docRef = doc(collection(db, COLLECTION_PATHS.students));
                batch.set(docRef, { ...student, teacherId: appUser.id, createdAt: new Date().toISOString() });
            });
            await batch.commit();
            alert(`Berhasil mengimpor ${studentList.length} data siswa!`);
        } catch (e) { alert("Gagal mengimpor data."); }
    };

    const handleMoveClass = async (studentIds, newClass) => {
        try {
            const batch = writeBatch(db);
            studentIds.forEach(id => {
                const docRef = doc(getCollectionRef(COLLECTION_PATHS.students), id);
                batch.update(docRef, { class: newClass });
            });
            await batch.commit();
            alert(`Berhasil memindahkan siswa ke kelas ${newClass}`);
        } catch (e) { alert("Gagal memindahkan kelas."); }
    };

    const updateStudent = async (data) => {
        const { id, ...rest } = data;
        await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.students), id), rest);
    };
    
    const deleteStudent = async (id) => {
        if(confirm("Hapus siswa?")) await deleteDoc(doc(getCollectionRef(COLLECTION_PATHS.students), id));
    };

    const addJournal = async (data) => {
        const payload = {
            ...data, teacherId: appUser.id, createdAt: new Date(),
            studentNames: Array.isArray(data.studentNames) ? data.studentNames : [data.studentName]
        };
        await addDoc(getCollectionRef(COLLECTION_PATHS.journals), payload);
    };

    const updateJournal = async (data) => {
        const { id, ...rest } = data;
        const payload = { ...rest, updatedAt: new Date().toISOString(), studentNames: Array.isArray(data.studentNames) ? data.studentNames : [data.studentName] };
        await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.journals), id), payload);
        alert("Jurnal diperbarui.");
    };

    const saveSettings = async (data) => {
        if (mySettings.id) await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.settings), mySettings.id), data);
        else await addDoc(getCollectionRef(COLLECTION_PATHS.settings), { ...data, userId: appUser.id });
        alert("Pengaturan tersimpan.");
    };

    const addPointLog = async (data) => {
        await addDoc(collection(db, 'point_logs'), { 
            ...data, 
            teacherId: appUser.id, 
            teacherName: appUser.fullName,
            createdAt: new Date().toISOString() 
        });
    };

    const deletePointLog = async (id) => {
        await deleteDoc(doc(collection(db, 'point_logs'), id));
    };

    const saveMasterPoints = async (newItems) => {
        try {
            await setDoc(doc(db, 'settings', 'master_points'), { items: newItems });
            alert("Master data poin berhasil disimpan!");
        } catch (e) { console.error(e); alert("Gagal menyimpan."); }
    };

    // --- BARU: SIMPAN ATURAN SANKSI ---
    const saveSanctionRules = async (newItems) => {
        try {
            await setDoc(doc(db, 'settings', 'sanction_rules'), { items: newItems });
            alert("Aturan sanksi berhasil disimpan!");
        } catch (e) { console.error(e); alert("Gagal menyimpan."); }
    };

    // --- RENDER ---
    if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 bg-slate-50">Menghubungkan ke Server SIBKO...</div>;
    
    if (!appUser) return <Login onLogin={handleLogin} loading={loginLoading} error={loginError} />;

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab} userRole={appUser.role} userName={appUser.fullName} onLogout={handleLogout}>
            {appUser.role === 'admin' ? (
                <>
                    {activeTab === 'dashboard' && <AdminDashboard users={allUsers} studentsCount={students.length} journalsCount={journals.length} />}
                    {activeTab === 'users' && <AdminUserManagement users={allUsers} />}
                    {activeTab === 'account' && <AccountSettings user={appUser} onUpdatePassword={handleUpdatePassword} />}
                </>
            ) : (
                <>
                    {activeTab === 'dashboard' && <GuruDashboard students={students} journals={journals} user={appUser} pointLogs={pointLogs} />}
                    
                    {activeTab === 'students' && <StudentManager students={students} 
                    
                    // --- TAMBAHKAN DUA BARIS INI ---
        pointLogs={pointLogs}         // Kirim Data Poin
        sanctionRules={sanctionRules} // Kirim Aturan Sanksi
        // -------------------------------
                    
                    journals={journals} onAdd={addStudent} onImport={importStudents} onMoveClass={handleMoveClass} onEdit={updateStudent} onDelete={deleteStudent} />}
                    
                    {activeTab === 'journal' && <Journal students={students} journals={journals} onAdd={addJournal} onUpdate={updateJournal} settings={mySettings} />}
                    
                    {/* Halaman Buku Saku - SEKARANG MENERIMA RULES SANKSI */}
                    {activeTab === 'points' && (
                        <PointManager 
                            students={students} 
                            pointLogs={pointLogs} 
                            masterPoints={masterPoints} 
                            sanctionRules={sanctionRules} // <--- Pass Props Baru
                            onAddPoint={addPointLog} 
                            onDeletePoint={deletePointLog} 
                        />
                    )}

                    {/* Halaman Master Data Poin - SEKARANG MENERIMA PROPS BARU */}
                    {activeTab === 'master_points' && (
                        <div className="space-y-8 animate-in fade-in pb-10 p-4 md:p-6">
                            <MasterDataSettings 
                                masterPoints={masterPoints} 
                                onSavePoints={saveMasterPoints} // Ubah nama props agar jelas
                                sanctionRules={sanctionRules}   // <--- Pass Props Baru
                                onSaveSanctions={saveSanctionRules} // <--- Pass Props Baru
                            />
                        </div>
                    )}
                    
                    {activeTab === 'reports' && <Reports journals={journals} students={students} settings={mySettings} />}
                    
                    {activeTab === 'settings' && (
                        <SchoolSettings settings={mySettings} onSave={saveSettings} />
                    )}
                    
                    {activeTab === 'account' && <AccountSettings user={appUser} onUpdatePassword={handleUpdatePassword} />}
                </>
            )}
        </Layout>
    );
}