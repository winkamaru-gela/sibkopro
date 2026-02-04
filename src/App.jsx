import React, { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, collection, setDoc, where 
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
import StudentPointBook from './pages/StudentPointBook';
import SanctionBook from './pages/SanctionBook';
import CounselingHistory from './pages/CounselingHistory'; // <--- IMPORT BARU

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
    const [sanctionRules, setSanctionRules] = useState([]); 

    // 1. Init Firebase Auth
    useEffect(() => {
        signInAnonymously(auth).catch(console.error);
        return onAuthStateChanged(auth, u => setAuthUser(u));
    }, []);

    // 2. Fetch Users (Wait for auth) -> KHUSUS ADMIN
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

    // 3. Fetch Data (Only if logged in) -> KHUSUS GURU
    useEffect(() => {
        if (!appUser || !authUser) return;

        // Jika Admin, tidak perlu load data operasional
        if (appUser.role === 'admin') return;

        // --- ISOLASI DATA TOTAL ---
        // Kita menggunakan ID Guru (appUser.id) sebagai kunci utama.
        
        // A. Fetch Students (Hanya milik guru ini)
        const qStudents = query(getCollectionRef(COLLECTION_PATHS.students), where("teacherId", "==", appUser.id));
        const unsubStudents = onSnapshot(qStudents, snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setStudents(data);
        });

        // B. Fetch Journals (Hanya milik guru ini)
        const qJournals = query(getCollectionRef(COLLECTION_PATHS.journals), where("teacherId", "==", appUser.id));
        const unsubJournals = onSnapshot(qJournals, snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setJournals(data);
        });

        // C. Fetch Settings (PENGATURAN SEKOLAH PRIBADI GURU)
        const qSettings = query(getCollectionRef(COLLECTION_PATHS.settings), where("teacherId", "==", appUser.id));
        const unsubSettings = onSnapshot(qSettings, snap => {
            if(!snap.empty) {
                setMySettings({id: snap.docs[0].id, ...snap.docs[0].data()});
            } else {
                setMySettings({});
            }
        });

        // D. Fetch Point Logs (Hanya milik guru ini)
        const qPoints = query(collection(db, 'point_logs'), where("teacherId", "==", appUser.id));
        const unsubPoints = onSnapshot(qPoints, snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setPointLogs(data);
        });

        // E. Fetch Master Data Points (ISOLASI: Simpan dengan ID Guru)
        const unsubMaster = onSnapshot(doc(db, 'settings', `master_points_${appUser.id}`), (docSnap) => {
            if (docSnap.exists()) setMasterPoints(docSnap.data().items || []);
            else setMasterPoints([]);
        });

        // F. Fetch Sanction Rules (ISOLASI: Simpan dengan ID Guru)
        const unsubSanctions = onSnapshot(doc(db, 'settings', `sanction_rules_${appUser.id}`), (docSnap) => {
            if (docSnap.exists()) setSanctionRules(docSnap.data().items || []);
            else setSanctionRules([]);
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
            setMySettings({});
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
        await addDoc(getCollectionRef(COLLECTION_PATHS.students), { 
            ...data, 
            teacherId: appUser.id, 
            createdAt: new Date().toISOString() 
        });
    };
    
    const importStudents = async (studentList) => {
        try {
            const batch = writeBatch(db);
            studentList.forEach(student => {
                const docRef = doc(collection(db, COLLECTION_PATHS.students));
                batch.set(docRef, { 
                    ...student, 
                    teacherId: appUser.id, 
                    createdAt: new Date().toISOString() 
                });
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

    const deleteStudent = async (id) => {
        if(confirm("Hapus siswa?")) await deleteDoc(doc(getCollectionRef(COLLECTION_PATHS.students), id));
    };

    const saveSettings = async (data) => {
        if (mySettings.id) {
            await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.settings), mySettings.id), data);
        } else {
            await addDoc(getCollectionRef(COLLECTION_PATHS.settings), { ...data, teacherId: appUser.id });
        }
        alert("Pengaturan sekolah berhasil diperbarui.");
    };

    const addPointLog = async (data) => {
        await addDoc(collection(db, 'point_logs'), { 
            ...data, 
            teacherId: appUser.id, 
            teacherName: appUser.fullName,
            createdAt: new Date().toISOString() 
        });
    };

    const updatePointLog = async (data) => {
        const { id, ...rest } = data;
        try {
            await updateDoc(doc(db, 'point_logs', id), rest);
        } catch (e) {
            console.error("Gagal update poin:", e);
            alert("Gagal memperbarui data poin.");
        }
    };

    const deletePointLog = async (id) => {
        if(confirm("Hapus catatan poin ini? Data yang dihapus tidak bisa dikembalikan.")) {
            try {
                await deleteDoc(doc(db, 'point_logs', id));
            } catch (e) {
                console.error("Gagal hapus poin:", e);
                alert("Gagal menghapus data.");
            }
        }
    };

    const saveMasterPoints = async (newItems) => {
        try {
            await setDoc(doc(db, 'settings', `master_points_${appUser.id}`), { items: newItems });
            alert("Master data poin sekolah berhasil disimpan!");
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const saveSanctionRules = async (newItems) => {
        try {
            await setDoc(doc(db, 'settings', `sanction_rules_${appUser.id}`), { items: newItems });
            alert("Aturan sanksi berhasil disimpan!");
        } catch (e) { alert("Gagal menyimpan."); }
    };

    // --- RENDER ---
    if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 bg-slate-50">Menghubungkan ke Server SIBKO...</div>;
    
    if (!appUser) return <Login onLogin={handleLogin} loading={loginLoading} error={loginError} />;

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab} userRole={appUser.role} userName={appUser.fullName} onLogout={handleLogout}>
            {appUser.role === 'admin' ? (
                <>
                    {activeTab === 'dashboard' && <AdminDashboard users={allUsers} studentsCount={0} journalsCount={0} />}
                    {activeTab === 'users' && <AdminUserManagement users={allUsers} />}
                    {activeTab === 'account' && <AccountSettings user={appUser} onUpdatePassword={handleUpdatePassword} />}
                </>
            ) : (
                <>
                    {activeTab === 'dashboard' && <GuruDashboard students={students} journals={journals} user={appUser} pointLogs={pointLogs} />}
                    
                    {activeTab === 'students' && (
                        <StudentManager 
                            students={students} 
                            journals={journals}
                            pointLogs={pointLogs}
                            sanctionRules={sanctionRules}
                            user={appUser} 
                            onAdd={addStudent} 
                            onImport={importStudents} 
                            onMoveClass={handleMoveClass} 
                            onEdit={(d) => updateDoc(doc(getCollectionRef(COLLECTION_PATHS.students), d.id), d)} 
                            onDelete={deleteStudent}
                        />
                    )}
                    
                    {activeTab === 'journal' && (
                        <Journal 
                            students={students} 
                            journals={journals} 
                            onAdd={(d) => addDoc(getCollectionRef(COLLECTION_PATHS.journals), {...d, teacherId: appUser.id})} 
                            onUpdate={(d) => updateDoc(doc(db, COLLECTION_PATHS.journals, d.id), d)} 
                            onDelete={async (id) => {
                                if(confirm("Hapus catatan jurnal ini secara permanen?")) {
                                    await deleteDoc(doc(db, COLLECTION_PATHS.journals, id));
                                }
                            }}
                            settings={mySettings} 
                        />
                    )}
                    
                    {/* --- MENU BARU: RIWAYAT LAYANAN KONSELING --- */}
                    {activeTab === 'counseling_history' && (
                        <CounselingHistory 
                            students={students} 
                            journals={journals}
                            settings={mySettings}
                            user={appUser}
                        />
                    )}
                    {/* ------------------------------------------- */}

                    {activeTab === 'points' && (
                        <PointManager 
                            students={students} 
                            pointLogs={pointLogs} 
                            masterPoints={masterPoints} 
                            sanctionRules={sanctionRules} 
                            onAddPoint={addPointLog} 
                            onUpdatePoint={updatePointLog} 
                            onDeletePoint={deletePointLog} 
                        />
                    )}

                    {activeTab === 'point_book' && (
                        <StudentPointBook 
                            students={students} 
                            pointLogs={pointLogs}
                            journals={journals}
                            settings={mySettings}
                            sanctionRules={sanctionRules}
                        />
                    )}
                           
                   {activeTab === 'sanction_book' && (
                        <SanctionBook 
                            students={students}
                            pointLogs={pointLogs}
                            sanctionRules={sanctionRules}
                            settings={mySettings}
                        />
                    )}
                    
                    {activeTab === 'master_points' && (
                        <div className="space-y-8 animate-in fade-in pb-10 p-4 md:p-6">
                            <MasterDataSettings 
                                masterPoints={masterPoints} 
                                onSavePoints={saveMasterPoints}
                                sanctionRules={sanctionRules}
                                onSaveSanctions={saveSanctionRules}
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