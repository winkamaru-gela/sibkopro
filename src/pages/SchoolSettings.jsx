import React, { useState, useEffect } from 'react';
import { 
    Settings, Save, Image as ImageIcon, MapPin, 
    CalendarClock, Building2, FileSignature, 
    LayoutTemplate, UploadCloud, ChevronRight, ChevronDown, Link as LinkIcon, Trash2 
} from 'lucide-react';

const SchoolSettings = ({ settings, onSave }) => {
    // Default State
    const [form, setForm] = useState({ 
        academicYear: '2025/2026',
        semester: 'Ganjil',
        logo: '',
        logo2: '',
        government: '',
        department: '',
        name: '',
        address: '',
        address2: '',
        city: '', // Kota penandatanganan
        // Data Pejabat
        principal: '', nipPrincipal: '',
        counselor: '', nipCounselor: '',
        studentAffairs: '', nipStudentAffairs: '', // Data Kesiswaan Baru
        ...settings 
    });
    
    const [activeTab, setActiveTab] = useState('periode');

    useEffect(() => {
        if(settings) setForm(prev => ({...prev, ...settings}));
    }, [settings]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    
    // Handler Upload File (Sama seperti sebelumnya)
    const handleFile = (e, key) => {
        const file = e.target.files[0];
        if(file) {
            if (file.size > 1048576) return alert("Ukuran file maksimal 1MB");
            const reader = new FileReader();
            reader.onloadend = () => setForm(prev => ({ ...prev, [key]: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onSave(form);
    };

    // Sub-component Tab Button
    const TabButton = ({ id, label, icon: Icon }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
                activeTab === id 
                ? 'bg-blue-50 border-blue-600 text-blue-700' 
                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
        >
            <Icon size={18} />
            <span>{label}</span>
            {activeTab === id && <ChevronRight size={16} className="ml-auto opacity-50"/>}
        </button>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto pb-24">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Settings className="text-blue-600"/> Pengaturan Sekolah
            </h1>

            <div className="flex flex-col md:flex-row gap-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                {/* Sidebar Tab */}
                <div className="w-full md:w-64 bg-white border-r border-slate-100 py-4 flex-shrink-0">
                    <div className="px-4 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Menu Pengaturan</div>
                    <nav className="space-y-1">
                        <TabButton id="periode" label="Tahun Ajaran" icon={CalendarClock} />
                        <TabButton id="identitas" label="Identitas Sekolah" icon={Building2} />
                        <TabButton id="kop" label="Kop Surat & Logo" icon={LayoutTemplate} />
                        <TabButton id="pejabat" label="Pejabat Penandatangan" icon={FileSignature} />
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    
                    {/* 1. TAHUN AJARAN */}
                    {activeTab === 'periode' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-lg font-bold border-b pb-2 mb-4">Periode Akademik</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup label="Tahun Pelajaran" name="academicYear" value={form.academicYear} onChange={handleChange} placeholder="Contoh: 2025/2026" />
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">Semester Aktif</label>
                                    <select name="semester" value={form.semester} onChange={handleChange} className="w-full p-2.5 border rounded-lg bg-white">
                                        <option value="Ganjil">Ganjil</option>
                                        <option value="Genap">Genap</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. IDENTITAS SEKOLAH */}
                    {activeTab === 'identitas' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-lg font-bold border-b pb-2 mb-4">Identitas Sekolah</h2>
                            <InputGroup label="Nama Sekolah" name="name" value={form.name} onChange={handleChange} placeholder="SMK NEGERI 1 CONTOH" />
                            <InputGroup label="Pemerintah Provinsi/Daerah" name="government" value={form.government} onChange={handleChange} placeholder="PEMERINTAH PROVINSI ..." />
                            <InputGroup label="Dinas / Yayasan" name="department" value={form.department} onChange={handleChange} placeholder="DINAS PENDIDIKAN DAERAH" />
                            
                            <div className="grid grid-cols-1 gap-4">
                                <InputGroup label="Alamat Baris 1 (Jalan)" name="address" value={form.address} onChange={handleChange} placeholder="Jl. Raya No. 1..." />
                                <InputGroup label="Alamat Baris 2 (Telp/Web)" name="address2" value={form.address2} onChange={handleChange} placeholder="Telp: 0431-xxxxx website: ..." />
                                <InputGroup label="Kota / Tempat Surat" name="city" value={form.city} onChange={handleChange} placeholder="Manado, Gorontalo, dll" />
                            </div>
                        </div>
                    )}

                    {/* 3. PEJABAT PENANDATANGAN (UPDATED: Tambah Kesiswaan) */}
                    {activeTab === 'pejabat' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-lg font-bold border-b pb-2 mb-4">Data Penandatangan Dokumen</h2>
                            
                            {/* Kepala Sekolah */}
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><UserCheckIcon /> Kepala Sekolah</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputGroup label="Nama Lengkap & Gelar" name="principal" value={form.principal} onChange={handleChange} placeholder="Nama Kepala Sekolah" />
                                    <InputGroup label="NIP / NIY" name="nipPrincipal" value={form.nipPrincipal} onChange={handleChange} placeholder="NIP..." />
                                </div>
                            </div>

                            {/* Guru BK */}
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><UserCheckIcon /> Guru BK / Konselor</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputGroup label="Nama Lengkap & Gelar" name="counselor" value={form.counselor} onChange={handleChange} placeholder="Nama Guru BK" />
                                    <InputGroup label="NIP / NIY" name="nipCounselor" value={form.nipCounselor} onChange={handleChange} placeholder="NIP..." />
                                </div>
                            </div>

                            {/* Waka Kesiswaan (BARU) */}
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><UserCheckIcon /> Waka Kesiswaan</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputGroup label="Nama Lengkap & Gelar" name="studentAffairs" value={form.studentAffairs} onChange={handleChange} placeholder="Nama Waka Kesiswaan" />
                                    <InputGroup label="NIP / NIY" name="nipStudentAffairs" value={form.nipStudentAffairs} onChange={handleChange} placeholder="NIP..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. LOGO & KOP SURAT */}
                    {activeTab === 'kop' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-lg font-bold border-b pb-2 mb-4">Logo Kop Surat</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <ImageUploader label="Logo Kiri (Pemda/Yayasan)" imageValue={form.logo} onFileChange={(e) => handleFile(e, 'logo')} onRemove={() => setForm({...form, logo: ''})} />
                                <ImageUploader label="Logo Kanan (Sekolah/Tut Wuri)" imageValue={form.logo2} onFileChange={(e) => handleFile(e, 'logo2')} onRemove={() => setForm({...form, logo2: ''})} />
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-xl font-bold transition-transform active:scale-95"
                >
                    <Save size={20}/> Simpan Pengaturan
                </button>
            </div>
        </div>
    );
};

// Helper Components
const UserCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>;

const InputGroup = ({ label, name, value, onChange, placeholder }) => (
    <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
        <input 
            type="text" 
            name={name}
            value={value || ''} 
            onChange={onChange} 
            placeholder={placeholder}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
    </div>
);

const ImageUploader = ({ label, imageValue, onFileChange, onRemove }) => (
    <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">{label}</label>
        <div className="relative w-full h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group">
            {imageValue ? (
                <>
                    <img src={imageValue} alt="Preview" className="h-full object-contain p-2" />
                    <button onClick={onRemove} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16}/>
                    </button>
                </>
            ) : (
                <>
                    <UploadCloud size={32} className="text-slate-400 mb-2"/>
                    <span className="text-xs text-slate-500">Klik untuk upload (Max 1MB)</span>
                    <input type="file" onChange={onFileChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                </>
            )}
        </div>
    </div>
);

export default SchoolSettings;