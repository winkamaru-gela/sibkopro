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
import StudentPointBook from './pages/StudentPointBook';

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

        // Jika Admin, tidak perlu load data siswa/jurnal/poin
        if (appUser.role === 'admin') return;

        // Kunci Utama: schoolId (Jika admin belum set, pakai id guru sendiri sebagai default)
        const sId = appUser.schoolId || appUser.id;

        // A. Fetch Students (Hanya milik sekolah ini)
        // Guru melihat siswa miliknya + siswa yang sedang pending transfer ke dia
        const unsubStudents = onSnapshot(getCollectionRef(COLLECTION_PATHS.students), snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setStudents(data.filter(d => 
                d.teacherId === appUser.id || 
                (d.transferStatus === 'pending' && d.pendingTeacherId === appUser.id)
            ));
        });

        // B. Fetch Journals (Hanya milik guru ini)
        const unsubJournals = onSnapshot(getCollectionRef(COLLECTION_PATHS.journals), snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setJournals(data.filter(d => d.teacherId === appUser.id));
        });

        // C. Fetch Settings (DATA SEKOLAH BERSAMA)
        const unsubSettings = onSnapshot(getCollectionRef(COLLECTION_PATHS.settings), snap => {
            const allSettings = snap.docs.map(d => ({id: d.id, ...d.data()}));
            const schoolSet = allSettings.find(s => s.schoolId === sId);
            if(schoolSet) setMySettings(schoolSet);
            else setMySettings({});
        });

        // D. Fetch Point Logs
        const unsubPoints = onSnapshot(collection(db, 'point_logs'), snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setPointLogs(data.filter(d => d.teacherId === appUser.id));
        });

        // E. Fetch Master Data Points (Shared in School)
        const unsubMaster = onSnapshot(doc(db, 'settings', `master_points_${sId}`), (docSnap) => {
            if (docSnap.exists()) setMasterPoints(docSnap.data().items || []);
            else setMasterPoints([]);
        });

        // F. Fetch Sanction Rules (Shared in School)
        const unsubSanctions = onSnapshot(doc(db, 'settings', `sanction_rules_${sId}`), (docSnap) => {
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
                    if(user.role === 'admin') setActiveTab('dashboard');
                    else setActiveTab('dashboard');
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

    // --- TRANSFER SISWA LOGIC ---
    const requestTransfer = async (studentId, targetTeacherId) => {
        try {
            await updateDoc(doc(db, COLLECTION_PATHS.students, studentId), {
                transferStatus: 'pending',
                pendingTeacherId: targetTeacherId,
                requestedBy: appUser.id,
                requestedByName: appUser.fullName
            });
            alert("Permintaan transfer berhasil dikirim.");
        } catch (e) { alert("Gagal kirim permintaan."); }
    };

    const approveTransfer = async (studentId) => {
        try {
            const batch = writeBatch(db);
            const newTeacherId = appUser.id; // Penerima jadi pemilik baru

            // Update Siswa
            batch.update(doc(db, COLLECTION_PATHS.students, studentId), {
                teacherId: newTeacherId,
                transferStatus: null,
                pendingTeacherId: null,
                requestedBy: null,
                requestedByName: null
            });

            // Update Jurnal & Poin
            journals.filter(j => j.studentId === studentId).forEach(j => {
                batch.update(doc(db, COLLECTION_PATHS.journals, j.id), { teacherId: newTeacherId });
            });
            pointLogs.filter(p => p.studentId === studentId).forEach(p => {
                batch.update(doc(db, 'point_logs', p.id), { teacherId: newTeacherId });
            });

            await batch.commit();
            alert("Transfer berhasil! Seluruh riwayat siswa kini milik Anda.");
        } catch (e) { alert("Gagal menyetujui."); }
    };

    const rejectTransfer = async (studentId) => {
        try {
            await updateDoc(doc(db, COLLECTION_PATHS.students, studentId), {
                transferStatus: null,
                pendingTeacherId: null,
                requestedBy: null,
                requestedByName: null
            });
            alert("Permintaan transfer ditolak.");
        } catch (e) { alert("Gagal menolak."); }
    };

    // --- CRUD ACTIONS ---
    const addStudent = async (data) => {
        await addDoc(getCollectionRef(COLLECTION_PATHS.students), { 
            ...data, 
            teacherId: appUser.id, 
            schoolId: appUser.schoolId || appUser.id,
            createdAt: new Date().toISOString() 
        });
    };
    
    const importStudents = async (studentList) => {
        try {
            const batch = writeBatch(db);
            studentList.forEach(student => {
                const docRef = doc(collection(db, COLLECTION_PATHS.students));
                batch.set(docRef, { ...student, teacherId: appUser.id, schoolId: appUser.schoolId || appUser.id, createdAt: new Date().toISOString() });
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
        const sId = appUser.schoolId || appUser.id;
        if (mySettings.id) await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.settings), mySettings.id), data);
        else await addDoc(getCollectionRef(COLLECTION_PATHS.settings), { ...data, schoolId: sId });
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
        const sId = appUser.schoolId || appUser.id;
        try {
            await setDoc(doc(db, 'settings', `master_points_${sId}`), { items: newItems });
            alert("Master data poin sekolah berhasil disimpan!");
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const saveSanctionRules = async (newItems) => {
        const sId = appUser.schoolId || appUser.id;
        try {
            await setDoc(doc(db, 'settings', `sanction_rules_${sId}`), { items: newItems });
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
                    {activeTab === 'dashboard' && <AdminDashboard users={allUsers} studentsCount={students.length} journalsCount={journals.length} />}
                    {activeTab === 'users' && <AdminUserManagement users={allUsers} />}
                    {activeTab === 'account' && <AccountSettings user={appUser} onUpdatePassword={handleUpdatePassword} />}
                </>
            ) : (
                <>
                    {activeTab === 'dashboard' && <GuruDashboard students={students} journals={journals} user={appUser} pointLogs={pointLogs} />}
                    
                    {activeTab === 'students' && (
                        <StudentManager 
                            students={students} 
                            allTeachers={allUsers.filter(u => u.schoolId === appUser.schoolId && u.id !== appUser.id)} // Untuk Transfer
                            journals={journals}
                            pointLogs={pointLogs}
                            sanctionRules={sanctionRules}
                            user={appUser} // Pass current user
                            onAdd={addStudent} 
                            onImport={importStudents} 
                            onMoveClass={handleMoveClass} 
                            onEdit={(d) => updateDoc(doc(getCollectionRef(COLLECTION_PATHS.students), d.id), d)} 
                            onDelete={deleteStudent}
                            // Props Transfer
                            onRequestTransfer={requestTransfer}
                            onApproveTransfer={approveTransfer}
                            onRejectTransfer={rejectTransfer}
                        />
                    )}
                    
                    {activeTab === 'journal' && (
                        <Journal 
                            students={students} 
                            journals={journals} 
                            onAdd={(d) => addDoc(getCollectionRef(COLLECTION_PATHS.journals), {...d, teacherId: appUser.id})} 
                            onUpdate={(d) => updateDoc(doc(db, COLLECTION_PATHS.journals, d.id), d)} 
                            // --- FITUR HAPUS JURNAL (BARU) ---
                            onDelete={async (id) => {
                                if(confirm("Hapus catatan jurnal ini secara permanen?")) {
                                    await deleteDoc(doc(db, COLLECTION_PATHS.journals, id));
                                }
                            }}
                            settings={mySettings} 
                        />
                    )}
                    
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