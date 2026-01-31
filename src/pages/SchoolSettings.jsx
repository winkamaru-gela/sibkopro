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
        ...settings 
    });
    
    // State untuk Tab Aktif
    const [activeTab, setActiveTab] = useState('periode');

    useEffect(() => {
        if(settings) setForm(prev => ({...prev, ...settings}));
    }, [settings]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    
    // Handler Upload File dengan Validasi Ukuran (Maks 1 MB)
    const handleFile = (e, key) => {
        const file = e.target.files[0];
        if(file) {
            // Cek ukuran file (1 MB = 1048576 bytes)
            if (file.size > 1048576) {
                alert("Ukuran file terlalu besar! Harap gunakan gambar dengan ukuran di bawah 1 MB.");
                return; // Batalkan proses jika terlalu besar
            }

            const reader = new FileReader();
            reader.onload = () => setForm(prev => ({...prev, [key]: reader.result}));
            reader.readAsDataURL(file);
        }
    };

    // Handler Hapus Logo
    const handleRemoveLogo = (key) => {
        if(confirm('Hapus logo ini?')) {
            setForm(prev => ({...prev, [key]: ''}));
        }
    };

    // Daftar Menu Tab
    const TABS = [
        { id: 'periode', label: 'Tahun Ajaran', icon: CalendarClock, desc: 'Atur semester aktif & periode' },
        { id: 'identitas', label: 'Identitas Sekolah', icon: Building2, desc: 'Nama, alamat, dan kota' },
        { id: 'kop', label: 'Kop Surat', icon: LayoutTemplate, desc: 'Logo dan judul kop' },
        { id: 'ttd', label: 'Penandatangan', icon: FileSignature, desc: 'Kepala Sekolah & Guru BK' },
    ];

    // FUNGSI RENDER KONTEN
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
                        </div>
                    </div>
                );
            
            case 'identitas':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="border-b pb-4 mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Identitas Sekolah (Kop Surat)</h2>
                                <p className="text-sm text-slate-500">Isi data secara berurutan sesuai struktur Kop Surat resmi.</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <InputGroup 
                                        label="1. Instansi Induk / Pemerintah (Baris Atas)" 
                                        name="government" 
                                        value={form.government} 
                                        onChange={handleChange}
                                        placeholder="PEMERINTAH PROVINSI SULAWESI UTARA"
                                    />
                                    <InputGroup 
                                        label="2. Nama Dinas / Yayasan (Baris Kedua)" 
                                        name="department" 
                                        value={form.department} 
                                        onChange={handleChange}
                                        placeholder="DINAS PENDIDIKAN DAERAH"
                                    />
                                </div>

                                <InputGroup 
                                    label="3. Nama Sekolah (Utama)" 
                                    name="name" 
                                    value={form.name} 
                                    onChange={handleChange}
                                    placeholder="SMA NEGERI 1 MANADO"
                                    bold
                                    customClass="text-lg"
                                />

                                <InputGroup 
                                    label="4. Alamat Lengkap & Kontak" 
                                    name="address" 
                                    value={form.address} 
                                    onChange={handleChange}
                                    type="textarea"
                                    placeholder="Jl. Pramuka No. 1, Sario, Manado. Telp (0431) 86xxxx"
                                />
                                
                                <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                                    <InputGroup 
                                        label="Kota / Tempat Titimangsa Surat" 
                                        name="city" 
                                        value={form.city} 
                                        onChange={handleChange}
                                        placeholder="Contoh: Manado"
                                        icon={<MapPin size={16}/>}
                                        customClass="bg-white border-indigo-200 text-indigo-900 font-bold"
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
                                <p className="text-sm text-slate-500">Anda dapat menggunakan file dari komputer atau tautan gambar (URL). Kosongkan jika hanya ingin menggunakan 1 logo.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* LOGO KIRI */}
                                <FlexibleLogoUploader 
                                    label="Logo Kiri (Pemda/Yayasan)" 
                                    imageValue={form.logo} 
                                    onFileChange={(e) => handleFile(e, 'logo')}
                                    onUrlChange={(val) => setForm(prev => ({...prev, logo: val}))}
                                    onRemove={() => handleRemoveLogo('logo')}
                                />
                                
                                {/* LOGO KANAN */}
                                <FlexibleLogoUploader 
                                    label="Logo Kanan (Sekolah/Tutwuri)" 
                                    imageValue={form.logo2} 
                                    onFileChange={(e) => handleFile(e, 'logo2')}
                                    onUrlChange={(val) => setForm(prev => ({...prev, logo2: val}))}
                                    onRemove={() => handleRemoveLogo('logo2')}
                                />
                            </div>

                            <div className="mt-8 pt-6 border-t">
                                <h3 className="font-bold text-sm text-slate-500 mb-3 uppercase tracking-wider">Simulasi Layout Kop</h3>
                                {/* PREVIEW KOP SURAT */}
                                <div className="border p-4 md:p-6 bg-white select-none shadow-sm relative">
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded">PREVIEW</div>
                                    <div className="flex items-center justify-between gap-4 border-b-4 border-double border-black pb-2">
                                        
                                        {/* Preview Logo Kiri */}
                                        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                                            {form.logo ? <img src={form.logo} className="h-full w-full object-contain" alt="Logo Kiri"/> : null}
                                        </div>

                                        <div className="text-center flex-1">
                                            <h4 className="font-bold text-slate-600 text-xs md:text-sm uppercase tracking-wide">{form.government || 'PEMERINTAH PROVINSI ...'}</h4>
                                            <h3 className="font-bold text-slate-700 text-sm md:text-base uppercase tracking-wide">{form.department || 'DINAS PENDIDIKAN ...'}</h3>
                                            <h1 className="font-bold text-black text-lg md:text-xl uppercase my-1">{form.name || 'NAMA SEKOLAH'}</h1>
                                            <p className="text-[10px] md:text-xs text-slate-500">{form.address || 'Alamat Sekolah...'}</p>
                                        </div>

                                        {/* Preview Logo Kanan */}
                                        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                                            {form.logo2 ? <img src={form.logo2} className="h-full w-full object-contain" alt="Logo Kanan"/> : null}
                                        </div>
                                    </div>
                                </div>
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

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full no-scrollbar">
                <div className="max-w-7xl mx-auto">
                    
                    {/* MOBILE ACCORDION */}
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
                                {activeTab === tab.id && (
                                    <div className="p-4 border-t border-blue-100 bg-slate-50/50">
                                        {renderTabContent(tab.id)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP LAYOUT */}
                    <div className="hidden md:flex gap-6 items-start h-full">
                        <aside className="w-64 flex-shrink-0">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
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

// --- HELPER COMPONENTS ---

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

// KOMPONEN UPLOAD LOGO BARU (DUA MODE: FILE & URL)
const FlexibleLogoUploader = ({ label, imageValue, onFileChange, onUrlChange, onRemove }) => {
    const [inputType, setInputType] = useState('file'); // 'file' atau 'url'

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-700">{label}</label>
                
                {/* Switch Mode Input */}
                <div className="flex bg-slate-100 rounded-md p-0.5">
                    <button 
                        onClick={() => setInputType('file')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${inputType === 'file' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
                    >
                        File
                    </button>
                    <button 
                        onClick={() => setInputType('url')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${inputType === 'url' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
                    >
                        URL
                    </button>
                </div>
            </div>

            <div className="relative group">
                <div className={`h-36 w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors relative overflow-hidden ${imageValue ? 'border-blue-300 bg-blue-50/30' : 'border-slate-300 bg-slate-50'}`}>
                    
                    {/* Tombol Hapus (Muncul jika ada gambar) */}
                    {imageValue && (
                        <button 
                            onClick={onRemove}
                            className="absolute top-2 right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 transition-colors z-10"
                            title="Hapus Logo"
                        >
                            <Trash2 size={14}/>
                        </button>
                    )}

                    {imageValue ? (
                        <img src={imageValue} className="h-full w-full object-contain p-2" alt="Preview"/>
                    ) : (
                        <div className="text-center text-slate-400 p-4 w-full">
                            {inputType === 'file' ? (
                                <>
                                    <UploadCloud size={28} className="mx-auto mb-2 text-slate-300"/>
                                    <span className="text-xs font-medium block">Klik area ini untuk upload file</span>
                                    <span className="text-[10px] opacity-60">(JPG, PNG, maks 1MB)</span>
                                </>
                            ) : (
                                <div className="w-full px-4">
                                    <LinkIcon size={24} className="mx-auto mb-2 text-slate-300"/>
                                    <input 
                                        type="text" 
                                        placeholder="Tempel tautan gambar (https://...)" 
                                        className="w-full text-xs p-2 border rounded bg-white text-center focus:ring-1 focus:ring-blue-400 outline-none"
                                        onChange={(e) => onUrlChange(e.target.value)}
                                        onClick={(e) => e.stopPropagation()} // Mencegah trigger file input
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Input File (Hanya aktif jika mode 'file' dan belum ada gambar) */}
                {inputType === 'file' && !imageValue && (
                    <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        onChange={onFileChange} 
                        accept="image/*"
                    />
                )}
            </div>
        </div>
    );
};

export default SchoolSettings;