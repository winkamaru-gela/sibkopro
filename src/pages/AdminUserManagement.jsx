import React, { useState } from 'react';
import { Shield, Edit, Trash2, PlusCircle, Building2, Crown } from 'lucide-react'; 
import { addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getCollectionRef } from '../config/firebase';
import { COLLECTION_PATHS, ACCESS_OPTIONS } from '../utils/constants';
import { generateCredentials, calculateExpiry, formatIndoDate } from '../utils/helpers';

const AdminUserManagement = ({ users }) => {
    // Tambah isSchoolAdmin di state form
    const [form, setForm] = useState({ username: '', password: '', fullName: '', duration: 30, schoolId: '', isSchoolAdmin: false });
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
        if(!form.username || !form.password || !form.fullName || !form.schoolId) return alert("Lengkapi data termasuk ID Sekolah!");
        
        const expiryDate = calculateExpiry(form.duration);
        const userData = {
            fullName: form.fullName,
            username: form.username,
            password: form.password,
            schoolId: form.schoolId.toUpperCase().replace(/\s+/g, '_'),
            isSchoolAdmin: form.isSchoolAdmin, // Simpan status Koordinator
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
                await addDoc(getCollectionRef(COLLECTION_PATHS.users), { ...userData, createdAt: new Date().toISOString() });
                alert("Guru BK berhasil ditambahkan.");
            }
            resetForm();
        } catch (error) { alert("Gagal menyimpan."); }
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setForm({
            fullName: user.fullName,
            username: user.username,
            password: user.password,
            schoolId: user.schoolId || '',
            isSchoolAdmin: !!user.isSchoolAdmin, // Load status koordinator
            duration: user.accessExpiry ? 30 : -1 
        });
    };

    const handleDelete = async (id) => {
        if(confirm("Yakin hapus akun ini?")) {
            await deleteDoc(doc(getCollectionRef(COLLECTION_PATHS.users), id));
        }
    };

    const resetForm = () => {
        setForm({ username: '', password: '', fullName: '', duration: 30, schoolId: '', isSchoolAdmin: false });
        setEditingId(null);
    };

    const getStatus = (expiry) => {
        if (!expiry) return { label: 'Full Time', color: 'bg-green-100 text-green-700' };
        const now = new Date();
        const exp = new Date(expiry);
        const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
        return { label: `Aktif (${diffDays} hari)`, color: 'bg-blue-100 text-blue-700' };
    };

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Shield size={24}/> Manajemen Pengguna</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit border-t-4 border-t-blue-600">
                    <h3 className="font-bold text-slate-800 mb-4">{editingId ? 'Edit Data Guru' : 'Tambah Guru Baru'}</h3>
                    <form onSubmit={handleSaveUser} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap Guru</label>
                            <input className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.fullName} onChange={(e) => handleNameChange(e.target.value)} placeholder="Nama Guru BK" required />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">ID Sekolah (Kelompok)</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                                <input className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold bg-slate-50" value={form.schoolId} onChange={e => setForm({...form, schoolId: e.target.value})} placeholder="Contoh: SMAN1_MDO" required />
                            </div>
                        </div>

                        {/* CHECKBOX KOORDINATOR */}
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 accent-yellow-600 rounded"
                                    checked={form.isSchoolAdmin}
                                    onChange={e => setForm({...form, isSchoolAdmin: e.target.checked})}
                                />
                                <div>
                                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1"><Crown size={14} className="text-yellow-600"/> Koordinator Sekolah</span>
                                    <p className="text-[10px] text-slate-500">Guru ini berhak mengedit Kop Surat & Master Poin Sekolah.</p>
                                </div>
                            </label>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Username</label>
                                <input className="w-full p-2.5 border rounded-lg bg-slate-50 font-mono text-sm" value={form.username} onChange={e=>setForm({...form, username: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
                                <input className="w-full p-2.5 border rounded-lg bg-slate-50 font-mono text-sm" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Masa Aktif</label>
                            <select className="w-full p-2.5 border rounded-lg bg-white text-sm" value={form.duration} onChange={e=>setForm({...form, duration: e.target.value})}>
                                {ACCESS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>

                        <button className={`w-full text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
                            {editingId ? <><Edit size={18}/> Update Akun</> : <><PlusCircle size={18}/> Buat Akun</>}
                        </button>
                    </form>
                </div>

                {/* TABLE */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b font-bold text-slate-700 uppercase text-xs tracking-wider">Daftar Guru BK Aktif</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                                <tr>
                                    <th className="p-4">Nama & Sekolah</th>
                                    <th className="p-4">Akun Login</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.filter(u => u.role === 'guru').map(u => {
                                    const status = getStatus(u.accessExpiry);
                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-700 flex items-center gap-1">
                                                    {u.fullName} {u.isSchoolAdmin && <Crown size={14} className="text-yellow-500" title="Koordinator"/>}
                                                </div>
                                                <div className="text-[10px] font-black text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded mt-1 border border-blue-100">{u.schoolId || 'BELUM DISET'}</div>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-slate-500">U: {u.username}<br/>P: {u.password}</td>
                                            <td className="p-4">
                                                <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${status.color}`}>{status.label}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button onClick={() => handleEdit(u)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit size={16}/></button>
                                                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserManagement;