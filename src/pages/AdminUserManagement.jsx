import React, { useState } from 'react';
import { Shield, Edit, Trash2, PlusCircle } from 'lucide-react';
import { addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getCollectionRef } from '../config/firebase';
import { COLLECTION_PATHS, ACCESS_OPTIONS } from '../utils/constants';
import { generateCredentials, calculateExpiry, formatIndoDate } from '../utils/helpers';

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

export default AdminUserManagement;