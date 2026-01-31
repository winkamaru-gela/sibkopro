import React, { useState, useEffect } from 'react';
import { 
    Settings, Save, Image as ImageIcon, MapPin, 
    CalendarClock, Building2, FileSignature, 
    LayoutTemplate, UploadCloud, ChevronRight, ChevronDown 
} from 'lucide-react';

const SchoolSettings = ({ settings, onSave }) => {
    // Default State
    const [form, setForm] = useState({ 
        academicYear: '2025/2026',
        semester: 'Ganjil',
        ...settings 
    });
    
    // State untuk Tab Aktif
    const [activeTab, setActiveTab] = useState('periode');

    useEffect(() => {
        if(settings) setForm(prev => ({...prev, ...settings}));
    }, [settings]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    
    const handleFile = (e, key) => {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = () => setForm({...form, [key]: reader.result});
            reader.readAsDataURL(file);
        }
    };

    // Daftar Menu Tab
    const TABS = [
        { id: 'periode', label: 'Tahun Ajaran', icon: CalendarClock, desc: 'Atur semester aktif & periode' },
        { id: 'identitas', label: 'Identitas Sekolah', icon: Building2, desc: 'Nama, alamat, dan kota' },
        { id: 'kop', label: 'Kop Surat', icon: LayoutTemplate, desc: 'Logo dan judul kop' },
        { id: 'ttd', label: 'Penandatangan', icon: FileSignature, desc: 'Kepala Sekolah & Guru BK' },
    ];

    // FUNGSI RENDER KONTEN (Dipakai di Mobile & Desktop agar tidak duplikasi)
    const renderTabContent = (tabId) => {
        switch (tabId) {
            case 'periode':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="border-b pb-4 mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Periode Akademik</h2>
                                <p className="text-sm text-slate-500">Pengaturan ini mempengaruhi filter laporan dan label semester pada jurnal.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup 
                                    label="Tahun Ajaran Aktif" 
                                    name="academicYear" 
                                    value={form.academicYear} 
                                    onChange={handleChange}
                                    placeholder="Contoh: 2025/2026"
                                    help="Format disarankan: TTTT/TTTT"
                                />
                                <div className="space-y-1">
                                    <label className="block text-sm font-bold text-slate-700">Semester Aktif</label>
                                    <select 
                                        className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-sm" 
                                        name="semester" 
                                        value={form.semester || 'Ganjil'} 
                                        onChange={handleChange}
                                    >
                                        <option value="Ganjil">Semester Ganjil</option>
                                        <option value="Genap">Semester Genap</option>
                                    </select>
                                    <p className="text-[11px] text-slate-400 mt-1">Pilih semester yang sedang berjalan saat ini.</p>
                                </div>
                            </div>
                            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 text-sm text-blue-800">
                                <CalendarClock className="flex-shrink-0" size={20}/>
                                <p>Pastikan Anda memperbarui pengaturan ini setiap pergantian semester agar data jurnal tersimpan dengan label periode yang benar.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'identitas':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="border-b pb-4 mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Identitas Sekolah</h2>
                                <p className="text-sm text-slate-500">Informasi ini akan tampil pada Kop Surat Laporan.</p>
                            </div>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputGroup 
                                        label="Pemerintah / Yayasan (Baris 1)" 
                                        name="government" 
                                        value={form.government} 
                                        onChange={handleChange}
                                        placeholder="PEMERINTAH PROVINSI ..."
                                    />
                                    <InputGroup 
                                        label="Nama Sekolah (Utama)" 
                                        name="name" 
                                        value={form.name} 
                                        onChange={handleChange}
                                        placeholder="SMA NEGERI ..."
                                        bold
                                    />
                                </div>
                                <InputGroup 
                                    label="Alamat Lengkap" 
                                    name="address" 
                                    value={form.address} 
                                    onChange={handleChange}
                                    type="textarea"
                                    placeholder="Jl. Pendidikan No. 1, Desa ..., Kec..."
                                />
                                
                                <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                                    <InputGroup 
                                        label="Kota / Tempat Titimangsa" 
                                        name="city" 
                                        value={form.city} 
                                        onChange={handleChange}
                                        placeholder="Contoh: Bandung"
                                        icon={<MapPin size={16}/>}
                                        help="Akan muncul di atas tanda tangan (Misal: Bandung, 20 Januari 2025)"
                                        customClass="bg-white border-indigo-200 text-indigo-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'kop':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="border-b pb-4 mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Logo Kop Surat</h2>
                                <p className="text-sm text-slate-500">Unggah logo instansi (Kiri) dan logo sekolah (Kanan).</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <LogoUploader 
                                    label="Logo Kiri (Pemda/Yayasan)" 
                                    image={form.logo} 
                                    onChange={(e) => handleFile(e, 'logo')} 
                                />
                                <LogoUploader 
                                    label="Logo Kanan (Sekolah/Tutwuri)" 
                                    image={form.logo2} 
                                    onChange={(e) => handleFile(e, 'logo2')} 
                                />
                            </div>
                            <div className="mt-8 pt-6 border-t">
                                <h3 className="font-bold text-sm text-slate-500 mb-3 uppercase tracking-wider">Pratinjau Kop (Sederhana)</h3>
                                <div className="border p-6 bg-white flex items-center justify-between opacity-80 pointer-events-none select-none grayscale-[50%]">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 flex items-center justify-center border">
                                        {form.logo ? <img src={form.logo} className="h-full object-contain" alt="Logo"/> : <span className="text-[10px]">Logo</span>}
                                    </div>
                                    <div className="text-center flex-1 px-2 md:px-4">
                                        <div className="h-2 w-3/4 bg-slate-200 mx-auto mb-2 rounded"></div>
                                        <div className="h-3 md:h-4 w-1/2 bg-slate-800 mx-auto mb-2 rounded"></div>
                                        <div className="h-2 w-full bg-slate-200 mx-auto rounded"></div>
                                    </div>
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 flex items-center justify-center border">
                                        {form.logo2 ? <img src={form.logo2} className="h-full object-contain" alt="Logo"/> : <span className="text-[10px]">Logo</span>}
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-400 mt-2">Ini hanya ilustrasi posisi. Hasil cetak asli akan menyesuaikan ukuran kertas.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'ttd':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="border-b pb-4 mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Pejabat Penandatangan</h2>
                                <p className="text-sm text-slate-500">Nama dan NIP yang akan muncul di bagian bawah laporan.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center font-bold text-slate-600">1</div>
                                        <h3 className="font-bold text-slate-700">Kepala Sekolah</h3>
                                    </div>
                                    <InputGroup 
                                        label="Nama Lengkap & Gelar" 
                                        name="headmaster" 
                                        value={form.headmaster} 
                                        onChange={handleChange}
                                        placeholder="Dr. H. Budi Santoso, M.Pd"
                                    />
                                    <InputGroup 
                                        label="NIP / NIY" 
                                        name="nipHeadmaster" 
                                        value={form.nipHeadmaster} 
                                        onChange={handleChange}
                                        placeholder="197xxxx..."
                                        fontMono
                                    />
                                </div>
                                <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center font-bold text-slate-600">2</div>
                                        <h3 className="font-bold text-slate-700">Guru BK / Konselor</h3>
                                    </div>
                                    <InputGroup 
                                        label="Nama Lengkap & Gelar" 
                                        name="counselor" 
                                        value={form.counselor} 
                                        onChange={handleChange}
                                        placeholder="Siti Aminah, S.Pd"
                                    />
                                    <InputGroup 
                                        label="NIP / NIY" 
                                        name="nipCounselor" 
                                        value={form.nipCounselor} 
                                        onChange={handleChange}
                                        placeholder="199xxxx..."
                                        fontMono
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* HEADER */}
            <div className="bg-white border-b px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm flex-shrink-0">
                <div>
                    <h1 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="text-blue-600" /> Pengaturan Sekolah
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 hidden md:block">Kelola data instansi untuk keperluan laporan otomatis.</p>
                </div>
                <button 
                    onClick={() => onSave(form)} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 text-sm md:text-base"
                >
                    <Save size={18}/> <span className="hidden md:inline">Simpan Perubahan</span><span className="md:hidden">Simpan</span>
                </button>
            </div>

            {/* MAIN CONTENT WRAPPER (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full no-scrollbar">
                <div className="max-w-7xl mx-auto">
                    
                    {/* --- TAMPILAN MOBILE (ACCORDION / DROPDOWN) --- */}
                    <div className="md:hidden space-y-3">
                        {TABS.map(tab => (
                            <div key={tab.id} className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${activeTab === tab.id ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'border-slate-200'}`}>
                                <button 
                                    onClick={() => setActiveTab(activeTab === tab.id ? '' : tab.id)}
                                    className={`w-full flex items-center justify-between p-4 text-left transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                            <tab.icon size={20} />
                                        </div>
                                        <span className="font-bold text-sm">{tab.label}</span>
                                    </div>
                                    {activeTab === tab.id ? <ChevronDown size={20}/> : <ChevronRight size={20} className="text-slate-400"/>}
                                </button>
                                
                                {/* Form Content (Muncul di bawah jika aktif) */}
                                {activeTab === tab.id && (
                                    <div className="p-4 border-t border-blue-100 bg-slate-50/50">
                                        {renderTabContent(tab.id)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* --- TAMPILAN DESKTOP (SIDEBAR + MAIN) --- */}
                    <div className="hidden md:flex gap-6 items-start h-full">
                        <aside className="w-64 flex-shrink-0">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b bg-slate-50">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menu Pengaturan</span>
                                </div>
                                <nav className="p-2 space-y-1">
                                    {TABS.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center text-left px-3 py-3 rounded-lg transition-all ${
                                                activeTab === tab.id 
                                                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-sm' 
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-md mr-3 ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                                <tab.icon size={18} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{tab.label}</div>
                                                <div className="text-[10px] opacity-70 hidden lg:block">{tab.desc}</div>
                                            </div>
                                            {activeTab === tab.id && <ChevronRight size={16} className="ml-auto text-blue-400"/>}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </aside>

                        <main className="flex-1 w-full">
                            {renderTabContent(activeTab)}
                        </main>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- Helper Components untuk UI Rapi ---

const InputGroup = ({ label, name, value, onChange, placeholder, type = "text", help, bold, fontMono, icon, customClass }) => (
    <div className="space-y-1.5 w-full">
        <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
            {icon} {label}
        </label>
        {type === 'textarea' ? (
            <textarea 
                className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${bold ? 'font-bold' : ''} ${customClass}`}
                rows="3"
                name={name}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
            />
        ) : (
            <input 
                className={`w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${bold ? 'font-bold text-slate-900' : 'text-slate-700'} ${fontMono ? 'font-mono' : ''} ${customClass}`}
                type={type}
                name={name}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
            />
        )}
        {help && <p className="text-[11px] text-slate-400 mt-1 leading-tight">{help}</p>}
    </div>
);

const LogoUploader = ({ label, image, onChange }) => (
    <div className="w-full">
        <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
        <div className="relative group">
            <div className={`h-32 w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors bg-slate-50 ${image ? 'border-blue-300 bg-blue-50/30' : 'border-slate-300 hover:border-blue-400 hover:bg-white'}`}>
                {image ? (
                    <img src={image} className="h-full w-full object-contain p-2" alt="Preview"/>
                ) : (
                    <div className="text-center text-slate-400 group-hover:text-blue-500">
                        <UploadCloud size={32} className="mx-auto mb-2"/>
                        <span className="text-xs font-medium">Klik untuk upload logo</span>
                    </div>
                )}
            </div>
            <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={onChange} 
                accept="image/*"
            />
        </div>
    </div>
);

export default SchoolSettings;