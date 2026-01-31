import React, { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, collection 
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

        const unsubStudents = onSnapshot(getCollectionRef(COLLECTION_PATHS.students), snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            if(appUser.role === 'guru') {
                data = data.filter(d => d.teacherId === appUser.id);
            }
            setStudents(data);
        });

        const unsubJournals = onSnapshot(getCollectionRef(COLLECTION_PATHS.journals), snap => {
            let data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            if(appUser.role === 'guru') {
                data = data.filter(d => d.teacherId === appUser.id);
            }
            setJournals(data);
        });

        const unsubSettings = onSnapshot(getCollectionRef(COLLECTION_PATHS.settings), snap => {
            const allSettings = snap.docs.map(d => ({id: d.id, ...d.data()}));
            const mySet = allSettings.find(s => s.userId === appUser.id);
            if(mySet) setMySettings(mySet);
            else setMySettings({});
        });

        return () => { unsubStudents(); unsubJournals(); unsubSettings(); };
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
        }
    };

    const handleUpdatePassword = async (data) => {
        try {
            await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.users), data.id), {
                password: data.password,
                fullName: data.fullName
            });
            // Update state lokal agar nama di dashboard langsung berubah tanpa refresh
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
                    {/* PERBAIKAN: Menambahkan prop 'user={appUser}' agar nama guru muncul di Dashboard */}
                    {activeTab === 'dashboard' && <GuruDashboard students={students} journals={journals} user={appUser} />}
                    
                    {activeTab === 'students' && <StudentManager students={students} journals={journals} onAdd={addStudent} onImport={importStudents} onMoveClass={handleMoveClass} onEdit={updateStudent} onDelete={deleteStudent} />}
                    {activeTab === 'journal' && <Journal students={students} journals={journals} onAdd={addJournal} onUpdate={updateJournal} settings={mySettings} />}
                    {activeTab === 'reports' && <Reports journals={journals} students={students} settings={mySettings} />}
                    {activeTab === 'settings' && <SchoolSettings settings={mySettings} onSave={saveSettings} />}
                    {activeTab === 'account' && <AccountSettings user={appUser} onUpdatePassword={handleUpdatePassword} />}
                </>
            )}
        </Layout>
    );
}