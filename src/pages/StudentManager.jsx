import React, { useState, useRef, useMemo } from 'react';
import { 
    Users, X, ArrowRightLeft, FileSpreadsheet, Upload, PlusCircle, 
    Save, Search, Phone, User, Eye, Edit, Trash2, BookOpen, 
    Activity, CheckCircle, MoreVertical, Filter, GraduationCap, 
    MapPin, Briefcase, Calendar, ChevronDown, Trophy, AlertTriangle, 
    Gavel, AlertOctagon, UserCheck, ChevronUp
} from 'lucide-react';
import { formatIndoDate, parseImportDate } from '../utils/helpers';
import { RISK_LEVELS } from '../utils/constants';

const StudentManager = ({ students, journals, pointLogs, sanctionRules, onAdd, onEdit, onDelete, onImport, onMoveClass }) => {
    // State UI
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [viewDetail, setViewDetail] = useState(null); 
    const [showMobileMenu, setShowMobileMenu] = useState(false); 
    const [expandBio, setExpandBio] = useState(false); // State untuk toggle biodata

    // State Data Form
    const [formData, setFormData] = useState({ 
        nisn: '', name: '', class: '', gender: 'L', 
        pob: '', dob: '', address: '', phone: '',
        parent: '', parentPhone: '', jobParent: '',
        career: '', riskLevel: 'LOW' 
    });
    const [editingId, setEditingId] = useState(null);
    const fileInputRef = useRef(null);

    // State Pindah Kelas
    const [isMoveMode, setIsMoveMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [targetClass, setTargetClass] = useState('');

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.class.toLowerCase().includes(search.toLowerCase()) ||
        s.nisn?.includes(search)
    );

    // --- LOGIC: HITUNG POIN & SANKSI ---
    const getStudentPointStatus = (studentId) => {
        const logs = (pointLogs || []).filter(p => p.studentId === studentId);
        const violationTotal = logs.filter(p => p.type === 'violation').reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
        const achievementTotal = logs.filter(p => p.type === 'achievement').reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
        const netScore = violationTotal - achievementTotal;
        const activeSanction = (sanctionRules || []).sort((a,b) => b.max - a.max).find(rule => netScore >= rule.min && netScore <= rule.max);
        return { violationTotal, achievementTotal, netScore, activeSanction, logs };
    };

    // --- LOGIC HELPERS ---
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleEditClick = (student) => {
        setEditingId(student.id);
        setFormData({ ...formData, ...student });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // --- BULK ACTION LOGIC ---
    const handleSelectAll = (e) => {
        if(e.target.checked) setSelectedIds(filteredStudents.map(s => s.id));
        else setSelectedIds([]);
    }

    const handleSelectOne = (id) => {
        if(selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
        else setSelectedIds([...selectedIds, id]);
    }

    const executeMoveClass = () => {
        if(!targetClass) return alert("Masukkan nama kelas tujuan!");
        if(selectedIds.length === 0) return alert("Pilih minimal satu siswa!");
        
        if(confirm(`Pindahkan ${selectedIds.length} siswa terpilih ke kelas ${targetClass}?`)) {
            onMoveClass(selectedIds, targetClass);
            setIsMoveMode(false);
            setSelectedIds([]);
            setTargetClass('');
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-6 relative min-h-screen pb-20">
            
            {/* HEADER TOOLBAR & SEARCH */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10">
                <div className="w-full md:w-auto flex justify-between items-center">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-blue-600"/> Data Siswa
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{filteredStudents.length}</span>
                    </h2>
                    
                    {!isMoveMode && (
                        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden bg-slate-100 text-slate-600 p-2 rounded-lg border border-slate-200">
                            <MoreVertical size={20}/>
                        </button>
                    )}
                </div>
                
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-center">
                    {isMoveMode ? (
                        <div className="flex flex-wrap items-center gap-2 bg-orange-50 p-2 rounded-lg border border-orange-200 animate-in fade-in w-full md:w-auto">
                            <span className="text-xs font-bold text-orange-700 px-2 whitespace-nowrap">{selectedIds.length} Dipilih</span>
                            <input 
                                className="flex-1 text-sm p-2 border rounded-md focus:ring-2 ring-orange-400 outline-none min-w-[120px]" 
                                placeholder="Kelas Tujuan..." 
                                value={targetClass}
                                onChange={e => setTargetClass(e.target.value.toUpperCase())}
                            />
                            <button onClick={executeMoveClass} className="bg-orange-600 text-white p-2 rounded-md hover:bg-orange-700 text-xs font-bold px-3">
                                PINDAH
                            </button>
                            <button onClick={() => {setIsMoveMode(false); setSelectedIds([])}} className="text-slate-500 hover:text-slate-700 p-2">
                                <X size={18}/>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="relative w-full md:w-64">
                                <Search className="text-slate-400 absolute left-3 top-2.5" size={18}/>
                                <input 
                                    className="w-full pl-10 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors" 
                                    placeholder="Cari nama, kelas, NISN..." 
                                    value={search} 
                                    onChange={e=>setSearch(e.target.value)}
                                />
                            </div>
                            
                            <div className="hidden md:flex gap-2">
                                <button onClick={() => setIsMoveMode(true)} className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                                    <ArrowRightLeft size={18}/>
                                </button>
                                <button onClick={handleDownloadTemplate} className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                                    <FileSpreadsheet size={18}/>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportFile} />
                                <button onClick={() => fileInputRef.current.click()} className="bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
                                    <Upload size={18}/>
                                </button>
                                <button onClick={() => {resetForm(); setShowForm(!showForm)}} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
                                    <PlusCircle size={18}/> {showForm ? 'Batal' : 'Tambah'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MOBILE MENU DROPDOWN */}
            {showMobileMenu && !isMoveMode && (
                <div className="md:hidden bg-white p-3 rounded-xl shadow-lg border border-slate-200 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                    <button onClick={() => {resetForm(); setShowForm(!showForm); setShowMobileMenu(false);}} className="col-span-2 bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                        <PlusCircle size={20}/> {showForm ? 'Batal Input' : 'Tambah Siswa Baru'}
                    </button>
                    <button onClick={() => {setIsMoveMode(true); setShowMobileMenu(false);}} className="flex flex-col items-center gap-1 p-3 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold border border-orange-100">
                        <ArrowRightLeft size={20}/> Pindah Kelas
                    </button>
                    <button onClick={handleDownloadTemplate} className="flex flex-col items-center gap-1 p-3 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                        <FileSpreadsheet size={20}/> Template CSV
                    </button>
                    <button onClick={() => fileInputRef.current.click()} className="col-span-2 flex items-center justify-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
                        <Upload size={18}/> Import Data dari CSV
                    </button>
                </div>
            )}

            {/* FORM INPUT SISWA */}
            {showForm && (
                <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-xl animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            {editingId ? <Edit className="text-blue-600"/> : <PlusCircle className="text-blue-600"/>}
                            {editingId ? 'Edit Data Siswa' : 'Input Siswa Baru'}
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-red-500"><X size={24}/></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Form Identitas */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
                                <User size={14}/> Identitas Siswa
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Nama Lengkap" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required placeholder="Nama Siswa"/>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputGroup label="NISN" value={formData.nisn} onChange={e=>setFormData({...formData, nisn: e.target.value})} placeholder="00xxxx"/>
                                    <InputGroup label="Kelas" value={formData.class} onChange={e=>setFormData({...formData, class: e.target.value})} required placeholder="X-1"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Jenis Kelamin</label>
                                    <select className="w-full p-2.5 border rounded-lg bg-white text-sm" value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})}>
                                        <option value="L">Laki-laki</option>
                                        <option value="P">Perempuan</option>
                                    </select>
                                </div>
                                <InputGroup label="Tempat Lahir" value={formData.pob} onChange={e=>setFormData({...formData, pob: e.target.value})} />
                                <InputGroup label="Tanggal Lahir" type="date" value={formData.dob} onChange={e=>setFormData({...formData, dob: e.target.value})} />
                                <InputGroup label="No HP Siswa" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} placeholder="08xxx"/>
                            </div>
                            <InputGroup label="Alamat Lengkap" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} placeholder="Jalan, Desa, Kecamatan..."/>
                        </div>

                        {/* Form Ortu */}
                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-4">
                            <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2 mb-2 border-b border-purple-200 pb-2">
                                <Users size={14}/> Orang Tua / Wali
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <InputGroup label="Nama Ortu/Wali" value={formData.parent} onChange={e=>setFormData({...formData, parent: e.target.value})} />
                                <InputGroup label="Pekerjaan" value={formData.jobParent} onChange={e=>setFormData({...formData, jobParent: e.target.value})} />
                                <InputGroup label="No HP Ortu" value={formData.parentPhone} onChange={e=>setFormData({...formData, parentPhone: e.target.value})} />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-4 pt-2 border-t">
                            <div className="w-full md:w-1/3">
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Tingkat Kerawanan (EWS)</label>
                                <select className={`w-full p-2.5 border rounded-lg font-bold text-sm ${formData.riskLevel === 'HIGH' ? 'text-red-600 bg-red-50 border-red-200' : formData.riskLevel === 'MEDIUM' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 'text-green-600 bg-green-50 border-green-200'}`} value={formData.riskLevel} onChange={e=>setFormData({...formData, riskLevel: e.target.value})}>
                                    <option value="LOW">Resiko Rendah (Normal)</option>
                                    <option value="MEDIUM">Resiko Sedang (Perlu Pantauan)</option>
                                    <option value="HIGH">Resiko Tinggi (Perlu Tindakan)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button type="button" onClick={resetForm} className="flex-1 md:flex-none px-6 py-2.5 text-slate-500 hover:bg-slate-100 rounded-lg font-bold text-sm border border-transparent hover:border-slate-200 transition-colors">Batal</button>
                                <button type="submit" className="flex-1 md:flex-none bg-blue-600 text-white font-bold rounded-lg px-8 py-2.5 shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-transform active:scale-95">
                                    <Save size={18}/> Simpan Data
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* LIST SISWA (MOBILE) */}
            <div className="md:hidden space-y-3">
                {filteredStudents.map(s => (
                    <div key={s.id} className={`bg-white p-4 rounded-xl shadow-sm border relative overflow-hidden transition-all active:scale-[0.99] ${selectedIds.includes(s.id) ? 'border-orange-400 bg-orange-50' : 'border-slate-200'}`}>
                        {isMoveMode && (
                            <div className="absolute top-0 right-0 p-3 bg-white/80 rounded-bl-xl backdrop-blur-sm z-10">
                                <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => handleSelectOne(s.id)} className="w-5 h-5 accent-orange-600"/>
                            </div>
                        )}

                        <div className="flex gap-3 items-start mb-3" onClick={() => { setViewDetail(s); setExpandBio(false); }}>
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 flex-shrink-0">
                                <User size={24}/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-800 text-base line-clamp-1">{s.name}</h3>
                                <div className="flex items-center gap-2 text-xs mt-1">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{s.class}</span>
                                    <span className="text-slate-500">{s.nisn || 'No NISN'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg mb-3">
                            <div className="flex items-center gap-1.5"><Phone size={12}/> {s.phone || '-'}</div>
                            <div className="flex items-center gap-1.5"><User size={12}/> {s.parent || 'Wali -'}</div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${RISK_LEVELS[s.riskLevel].badge}`}>
                                {RISK_LEVELS[s.riskLevel].label}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => { setViewDetail(s); setExpandBio(false); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 border border-slate-200">
                                    <Eye size={16}/>
                                </button>
                                <button onClick={() => handleEditClick(s)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-100">
                                    <Edit size={16}/>
                                </button>
                                <button onClick={() => onDelete(s.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* TABLE SISWA (DESKTOP) */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                            <tr>
                                {isMoveMode && (
                                    <th className="p-4 w-10 text-center">
                                        <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filteredStudents.length} className="w-4 h-4 accent-orange-500 cursor-pointer"/>
                                    </th>
                                )}
                                <th className="p-4">Identitas Siswa</th>
                                <th className="p-4">L/P</th>
                                <th className="p-4">Kontak</th>
                                <th className="p-4">Status Resiko</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map(s => (
                                <tr key={s.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.includes(s.id) ? 'bg-orange-50' : ''}`}>
                                    {isMoveMode && (
                                        <td className="p-4 text-center">
                                            <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => handleSelectOne(s.id)} className="w-4 h-4 accent-orange-500 cursor-pointer"/>
                                        </td>
                                    )}
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700 text-base">{s.name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5 flex gap-2">
                                            <span className="bg-slate-200 px-1.5 rounded font-mono text-slate-700 font-bold">{s.class}</span>
                                            <span>{s.nisn || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-600">{s.gender}</td>
                                    <td className="p-4">
                                        {s.phone && <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1"><Phone size={12}/> {s.phone}</div>}
                                        {s.parent && <div className="flex items-center gap-1.5 text-xs text-slate-600"><User size={12}/> {s.parent}</div>}
                                        {!s.phone && !s.parent && <span className="text-slate-300 italic">-</span>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white ${RISK_LEVELS[s.riskLevel].badge}`}>
                                            {RISK_LEVELS[s.riskLevel].label}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setViewDetail(s); setExpandBio(false); }} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors border border-blue-100" title="Lihat Profil">
                                                <Eye size={16}/>
                                            </button>
                                            <button onClick={() => handleEditClick(s)} className="text-orange-600 bg-orange-50 hover:bg-orange-100 p-2 rounded-lg transition-colors border border-orange-100" title="Edit Data">
                                                <Edit size={16}/>
                                            </button>
                                            <button onClick={() => onDelete(s.id)} className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors border border-red-100" title="Hapus Data">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && <tr><td colSpan={isMoveMode ? 6 : 5} className="p-10 text-center text-slate-400 italic">Data siswa tidak ditemukan. Silakan tambah atau import data baru.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- BUKU PRIBADI SISWA (MODAL SINGLE PAGE VIEW) --- */}
            {viewDetail && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in">
                    <div className="bg-white md:rounded-2xl shadow-2xl w-full max-w-4xl h-full md:max-h-[95vh] flex flex-col overflow-hidden">
                        
                        {/* Header Modal */}
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
                            <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen size={20}/> Buku Pribadi Siswa</h3>
                            <button onClick={() => setViewDetail(null)} className="hover:bg-slate-700 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                        </div>

                        {/* Konten Scrollable */}
                        <div className="flex-1 overflow-y-auto bg-slate-100 pb-10">
                            {(() => {
                                const { violationTotal, achievementTotal, netScore, activeSanction, logs } = getStudentPointStatus(viewDetail.id);
                                const history = getStudentHistory(viewDetail.id);

                                return (
                                    <>
                                        {/* 1. STICKY HEADER SISWA */}
                                        <div className="bg-white p-4 md:p-6 border-b border-slate-200 sticky top-0 z-20 shadow-sm flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl flex-shrink-0 shadow-inner">
                                                {viewDetail.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-xl font-bold text-slate-800 line-clamp-1">{viewDetail.name}</h2>
                                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                                                    <span className="bg-slate-100 px-2 rounded font-mono font-bold text-slate-700 border border-slate-200">{viewDetail.class}</span>
                                                    <span>{viewDetail.nisn}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. ALERT & STATUS POIN (LANGSUNG TERLIHAT) */}
                                        <div className="p-4 md:p-6 space-y-4">
                                            
                                            {/* Sanksi Alert: Paling Atas agar jadi perhatian */}
                                            {activeSanction ? (
                                                <div className="bg-red-600 text-white rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center gap-4 animate-in slide-in-from-top-4 border-l-8 border-red-800">
                                                    <div className="bg-red-800/50 p-3 rounded-full flex-shrink-0">
                                                        <AlertOctagon size={32}/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-red-200 uppercase tracking-widest mb-1">STATUS: PERLU TINDAK LANJUT</p>
                                                        <h3 className="text-2xl font-bold leading-tight">{activeSanction.action}</h3>
                                                        <p className="text-red-100 mt-1 opacity-90">Sanksi: {activeSanction.penalty}</p>
                                                    </div>
                                                    <div className="text-center bg-white/10 px-4 py-2 rounded-lg">
                                                        <span className="block text-xs font-bold opacity-70">Total Poin</span>
                                                        <span className="block text-2xl font-bold">{netScore}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-green-600 text-white rounded-xl p-4 shadow-lg flex items-center gap-4 border-l-8 border-green-800">
                                                    <div className="bg-green-800/50 p-2 rounded-full">
                                                        <CheckCircle size={24}/>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg">Status Disiplin: Aman</h3>
                                                        <p className="text-xs text-green-100 opacity-80">Siswa belum mencapai batas poin sanksi.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Statistik Card */}
                                            <div className="grid grid-cols-3 gap-2 md:gap-4">
                                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                                                    <p className="text-[10px] md:text-xs text-red-500 font-bold uppercase mb-1">Pelanggaran</p>
                                                    <p className="text-xl md:text-2xl font-bold text-slate-800">{violationTotal}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                                                    <p className="text-[10px] md:text-xs text-green-600 font-bold uppercase mb-1">Prestasi</p>
                                                    <p className="text-xl md:text-2xl font-bold text-slate-800">{achievementTotal}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center relative overflow-hidden">
                                                    <div className={`absolute top-0 left-0 w-1 h-full ${netScore > 0 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                                                    <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase mb-1">Poin Bersih</p>
                                                    <p className={`text-xl md:text-2xl font-bold ${netScore > 0 ? 'text-orange-600' : 'text-green-600'}`}>{netScore}</p>
                                                </div>
                                            </div>

                                            {/* 3. TIMELINE RIWAYAT POIN & LAYANAN (Digabung agar kronologis) */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                                {/* Kolom Kiri: Riwayat Poin */}
                                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><Gavel size={16}/> Catatan Poin</h4>
                                                        <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">{logs.length}</span>
                                                    </div>
                                                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                                                        {logs.length > 0 ? logs.map(log => (
                                                            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-3">
                                                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'violation' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between items-start">
                                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${log.type === 'violation' ? 'text-red-600' : 'text-green-600'}`}>
                                                                            {log.type === 'violation' ? 'Pelanggaran' : 'Prestasi'}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400">{formatIndoDate(log.date)}</span>
                                                                    </div>
                                                                    <p className="text-sm font-medium text-slate-800 mt-0.5">{log.description}</p>
                                                                    <p className="text-xs text-slate-500 mt-1 font-mono">Nilai: {log.value}</p>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="p-8 text-center text-slate-400 italic text-sm">Belum ada catatan poin.</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Kolom Kanan: Riwayat Layanan */}
                                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><Activity size={16}/> Layanan BK</h4>
                                                        <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">{history.length}</span>
                                                    </div>
                                                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                                                        {history.length > 0 ? history.map(h => (
                                                            <div key={h.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                                                                        {h.serviceType}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400">{formatIndoDate(h.date)}</span>
                                                                </div>
                                                                <p className="text-sm text-slate-700 line-clamp-2">{h.description}</p>
                                                            </div>
                                                        )) : (
                                                            <div className="p-8 text-center text-slate-400 italic text-sm">Belum ada riwayat layanan.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 4. BIODATA (COLLAPSIBLE / DI BAWAH) */}
                                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-6">
                                                <button 
                                                    onClick={() => setExpandBio(!expandBio)}
                                                    className="w-full p-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors rounded-t-xl"
                                                >
                                                    <span className="font-bold text-slate-700 flex items-center gap-2"><UserCheck size={16}/> Informasi Lengkap Siswa</span>
                                                    {expandBio ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                                </button>
                                                
                                                {expandBio && (
                                                    <div className="p-5 border-t border-slate-200 animate-in slide-in-from-top-2 fade-in">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                                            <div className="space-y-3">
                                                                <h5 className="font-bold text-xs text-slate-400 uppercase border-b pb-1 mb-2">Data Diri</h5>
                                                                <div className="flex justify-between"><span className="text-slate-500">Tempat Lahir</span> <span className="font-medium">{viewDetail.pob || '-'}</span></div>
                                                                <div className="flex justify-between"><span className="text-slate-500">Tanggal Lahir</span> <span className="font-medium">{formatIndoDate(viewDetail.dob)}</span></div>
                                                                <div className="flex justify-between"><span className="text-slate-500">Jenis Kelamin</span> <span className="font-medium">{viewDetail.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span></div>
                                                                <div className="flex justify-between"><span className="text-slate-500">Alamat</span> <span className="font-medium text-right max-w-[200px]">{viewDetail.address || '-'}</span></div>
                                                                <div className="flex justify-between"><span className="text-slate-500">No HP</span> <span className="font-medium">{viewDetail.phone || '-'}</span></div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <h5 className="font-bold text-xs text-slate-400 uppercase border-b pb-1 mb-2">Data Wali</h5>
                                                                <div className="flex justify-between"><span className="text-slate-500">Nama Wali</span> <span className="font-medium">{viewDetail.parent || '-'}</span></div>
                                                                <div className="flex justify-between"><span className="text-slate-500">Pekerjaan</span> <span className="font-medium">{viewDetail.jobParent || '-'}</span></div>
                                                                <div className="flex justify-between"><span className="text-slate-500">Kontak Wali</span> <span className="font-medium text-blue-600">{viewDetail.parentPhone || '-'}</span></div>
                                                                <div className="flex justify-between mt-4 bg-yellow-50 p-2 rounded">
                                                                    <span className="text-slate-500 font-bold">Resiko Awal</span> 
                                                                    <span className={`font-bold ${RISK_LEVELS[viewDetail.riskLevel].badge} px-2 rounded`}>{RISK_LEVELS[viewDetail.riskLevel].label}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                        
                        <div className="p-4 border-t bg-white flex justify-end flex-shrink-0">
                            <button onClick={() => setViewDetail(null)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors w-full md:w-auto">
                                Tutup Buku
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-component untuk Input yang Rapi
const InputGroup = ({ label, value, onChange, placeholder, required, type="text" }) => (
    <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">{label}</label>
        <input 
            type={type}
            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300" 
            value={value} 
            onChange={onChange} 
            placeholder={placeholder}
            required={required}
        />
    </div>
);

export default StudentManager;