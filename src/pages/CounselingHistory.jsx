// src/pages/CounselingHistory.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Search, Printer, ShieldAlert, BookOpen, X, ChevronDown, 
    FileText, Lock, Eye, EyeOff, Trash2
} from 'lucide-react';
import { formatIndoDate } from '../utils/helpers';

// ==========================================
// 1. KOMPONEN PORTAL CETAK
// ==========================================
const PrintPreviewModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col animate-in fade-in duration-200 backdrop-blur-sm print:bg-white print:static">
            
            {/* --- CSS ISOLASI CETAK --- */}
            <style>{`
                @media print {
                    @page { size: auto; margin: 10mm; }
                    #root, .app-container, header, aside, nav { display: none !important; }
                    html, body { height: auto !important; overflow: visible !important; background-color: white !important; margin: 0 !important; }
                    .print-portal-root { display: block !important; position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; z-index: 9999 !important; background-color: white !important; }
                    .print-paper-content { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; }
                    .print-header-actions { display: none !important; }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    tr { page-break-inside: avoid; }
                    td, th { border: 1px solid black !important; padding: 4px; color: black !important; }
                    .signature-section { page-break-inside: avoid; }
                }
            `}</style>

            {/* Header Modal */}
            <div className="bg-slate-800 text-white px-4 py-3 shadow-md flex justify-between items-center flex-shrink-0 border-b border-slate-700 print-header-actions">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                        <Printer size={20} className="text-blue-400"/> Pratinjau: {title}
                    </h2>
                    <p className="text-[10px] text-slate-400 hidden sm:block">
                        Gunakan kertas A4/F4. Anda dapat mengatur ukuran kertas di dialog cetak browser.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                        Tutup
                    </button>
                    <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95">
                        <Printer size={16}/> Cetak / PDF
                    </button>
                </div>
            </div>

            {/* Area Konten */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-900/50 print:bg-white print:p-0 print:overflow-visible print-portal-root">
                <div className="print-paper-content bg-white text-slate-900 shadow-2xl w-full max-w-[215mm] min-h-[297mm] p-10 md:p-12 origin-top h-fit mx-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

// ==========================================
// 2. KOMPONEN UTAMA
// ==========================================
const CounselingHistory = ({ students, journals, settings, user }) => {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    
    // --- STATE PENCARIAN SISWA ---
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef(null);

    // --- MODE PRIVASI (3 OPSI) ---
    // 'show' = Tampilkan Semua
    // 'mask' = Samarkan Topik
    // 'hide' = Sembunyikan Baris
    const [privacyMode, setPrivacyMode] = useState('mask'); 

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return students;
        return students.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.nisn?.includes(searchQuery) ||
            s.class?.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a,b) => a.name.localeCompare(b.name));
    }, [students, searchQuery]);

    const student = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

    // FILTER DATA JURNAL
    const counselingHistory = useMemo(() => {
        if (!student) return [];
        
        let data = journals.filter(j => 
            j.studentId === student.id || (j.studentIds && j.studentIds.includes(student.id))
        ).sort((a,b) => b.date.localeCompare(a.date));

        // JIKA MODE = 'hide', buang baris privasi
        if (privacyMode === 'hide') {
            data = data.filter(j => {
                const isPrivate = j.isPrivate || (j.serviceType && j.serviceType.toLowerCase().includes('pribadi'));
                return !isPrivate;
            });
        }

        return data;
    }, [student, journals, privacyMode]);

    const handleSelectStudent = (s) => {
        setSelectedStudentId(s.id);
        setSearchQuery(s.name);
        setIsSearchOpen(false);
    };

    // --- FUNGSI DOWNLOAD WORD ---
    const handleDownloadWord = () => {
        if (!student) return;

        const rowsHTML = counselingHistory.map((h, i) => {
            // CEK STATUS PRIVASI RECORD INI
            const isPrivate = h.isPrivate || (h.serviceType && h.serviceType.toLowerCase().includes('pribadi'));
            
            // LOGIKA TEXT TOPIK BERDASARKAN MODE
            let descText = h.description;
            let textStyle = '';

            if (isPrivate && privacyMode === 'mask') {
                descText = '--- Privasi (Disamarkan) ---';
                textStyle = 'font-style: italic; color: #666;';
            }

            return `
            <tr>
                <td style="border: 1px solid black; padding: 5px; text-align: center;">${i+1}</td>
                <td style="border: 1px solid black; padding: 5px; text-align: center;">${formatIndoDate(h.date)}</td>
                <td style="border: 1px solid black; padding: 5px; vertical-align: top;">
                    <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">${h.serviceType}</div>
                    <div style="font-size: 11px;">
                        <b>Bidang:</b> ${h.skkpd || '-'}<br/>
                        <b>Kategori:</b> ${h.category || '-'}<br/>
                        <b>Teknik:</b> ${h.technique || '-'}
                    </div>
                </td>
                <td style="border: 1px solid black; padding: 5px; vertical-align: top; ${textStyle}">
                    ${descText}
                </td>
                <td style="border: 1px solid black; padding: 5px; vertical-align: top;">${h.followUp}</td>
            </tr>
            `;
        }).join('');

        const tableStyle = `border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 12px;`;
        const thStyle = `border: 1px solid black; padding: 5px; background-color: #f2f2f2; text-align: center; font-weight: bold;`;
        const kopTextStyle = `margin: 0; text-transform: uppercase; font-size: 14pt; font-weight: bold; white-space: nowrap;`;

        let htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Riwayat Konseling ${student.name}</title></head>
            <body style="font-family: Arial, sans-serif; font-size: 12px;">
                <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px double black; padding-bottom: 10px;">
                    <h3 style="${kopTextStyle}">${settings?.government || ''}</h3>
                    <h3 style="${kopTextStyle}">${settings?.department || ''}</h3>
                    <h1 style="${kopTextStyle} font-size: 14pt; font-weight: 800;">${settings?.name || 'NAMA SEKOLAH'}</h1>
                    <p style="margin:0; font-style: italic; font-size: 10pt;">${settings?.address || ''}</p>
                </div>
                <h3 style="text-align: center; text-decoration: underline; text-transform: uppercase; margin-bottom: 20px;">RIWAYAT LAYANAN KONSELING</h3>
                <table style="width: 100%; margin-bottom: 20px; font-weight: bold;">
                    <tr><td style="border:none; width: 120px;">Nama Siswa</td><td style="border:none;">: ${student.name}</td><td style="border:none; width: 80px;">Kelas</td><td style="border:none;">: ${student.class}</td></tr>
                    <tr><td style="border:none;">NISN</td><td style="border:none;">: ${student.nisn || '-'}</td><td style="border:none;">Jns Kelamin</td><td style="border:none;">: ${student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
                </table>
                <table style="${tableStyle}">
                    <thead>
                        <tr><th style="${thStyle} width: 30px;">No</th><th style="${thStyle} width: 80px;">Tanggal</th><th style="${thStyle} width: 180px;">Jenis & Detail</th> <th style="${thStyle}">Masalah / Topik</th> <th style="${thStyle} width: 100px;">Tindak Lanjut</th></tr>
                    </thead>
                    <tbody>${rowsHTML || '<tr><td colspan="5" style="border:1px solid black; padding:5px; text-align:center;">Belum ada riwayat.</td></tr>'}</tbody>
                </table>
                 <br/><br/>
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="border: none; text-align: center; width: 50%;">
                            <p>Mengetahui,<br/>Orang Tua / Wali</p>
                            <br/><br/><br/>
                            <p style="text-decoration: underline; font-weight: bold;">( ${student.parent ? student.parent : '....................................'} )</p>
                        </td>
                        <td style="border: none; text-align: center; width: 50%;">
                            <p>${settings?.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru BK / Konselor</p>
                            <br/><br/><br/>
                            <p style="text-decoration: underline; font-weight: bold;">${settings?.counselor || user?.fullName || '......................'}</p>
                            <p>NIP. {settings?.nipCounselor || '......................'}</p>
                        </td>
                    </tr>
                </table>
            </body></html>
        `;

        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Riwayat_Konseling_${student.name.replace(/\s+/g, '_')}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            
            {/* Header Toolbar */}
            <div className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-purple-600"/> Riwayat Layanan Konseling
                    </h1>
                    <p className="text-xs text-slate-500">Cetak rekam jejak bimbingan siswa.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                    
                    {/* INPUT PENCARIAN */}
                    <div className="relative w-full md:w-80" ref={searchRef}>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                            <input 
                                type="text"
                                className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ketik nama siswa..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsSearchOpen(true);
                                    if(e.target.value === '') setSelectedStudentId('');
                                }}
                                onFocus={() => setIsSearchOpen(true)}
                            />
                            {selectedStudentId ? (
                                <button onClick={() => { setSelectedStudentId(''); setSearchQuery(''); setIsSearchOpen(true); }} className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500">
                                    <X size={16}/>
                                </button>
                            ) : (
                                <ChevronDown className="absolute right-3 top-2.5 text-slate-400" size={16}/>
                            )}
                        </div>

                        {/* DROPDOWN HASIL PENCARIAN */}
                        {isSearchOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map(s => (
                                        <div key={s.id} onClick={() => handleSelectStudent(s)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0">
                                            <div className="font-bold text-slate-800 text-sm">{s.name}</div>
                                            <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                                                <span>Kelas: {s.class}</span>
                                                <span>NISN: {s.nisn || '-'}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-slate-400 text-sm italic">Siswa tidak ditemukan.</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button disabled={!selectedStudentId} onClick={handleDownloadWord} className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all flex-1 md:flex-none" title="Download Format Word">
                            <FileText size={18}/> Doc
                        </button>
                        <button disabled={!selectedStudentId} onClick={() => setShowPreview(true)} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all flex-1 md:flex-none">
                            <Printer size={18}/> Cetak
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content (Preview di Layar) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {student ? (
                    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        
                        {/* KONTROL DOKUMEN - 3 PILIHAN FLEKSIBEL */}
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-100 p-2 rounded-full text-yellow-700"><ShieldAlert size={20}/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Mode Tampilan Privasi</h4>
                                    <p className="text-xs text-slate-500">Tentukan bagaimana data sensitif ditampilkan pada dokumen.</p>
                                </div>
                            </div>
                            
                            {/* PILIHAN RADIO BUTTON */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* OPSI 1: TAMPILKAN SEMUA */}
                                <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-lg border transition-all ${privacyMode === 'show' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <input 
                                        type="radio" 
                                        name="privacy_mode" 
                                        className="w-4 h-4 accent-blue-600"
                                        checked={privacyMode === 'show'}
                                        onChange={() => setPrivacyMode('show')}
                                    />
                                    <div className="text-xs">
                                        <span className="font-bold block text-slate-700 flex items-center gap-1"><Eye size={12}/> Tampilkan</span>
                                        <span className="text-slate-500 text-[10px]">Data privasi terlihat</span>
                                    </div>
                                </label>

                                {/* OPSI 2: SAMARKAN TOPIK */}
                                <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-lg border transition-all ${privacyMode === 'mask' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <input 
                                        type="radio" 
                                        name="privacy_mode" 
                                        className="w-4 h-4 accent-blue-600"
                                        checked={privacyMode === 'mask'}
                                        onChange={() => setPrivacyMode('mask')}
                                    />
                                    <div className="text-xs">
                                        <span className="font-bold block text-slate-700 flex items-center gap-1"><EyeOff size={12}/> Samarkan Topik</span>
                                        <span className="text-slate-500 text-[10px]">Ganti teks masalah</span>
                                    </div>
                                </label>

                                {/* OPSI 3: SEMBUNYIKAN BARIS */}
                                <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-lg border transition-all ${privacyMode === 'hide' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <input 
                                        type="radio" 
                                        name="privacy_mode" 
                                        className="w-4 h-4 accent-blue-600"
                                        checked={privacyMode === 'hide'}
                                        onChange={() => setPrivacyMode('hide')}
                                    />
                                    <div className="text-xs">
                                        <span className="font-bold block text-slate-700 flex items-center gap-1"><Trash2 size={12}/> Sembunyikan</span>
                                        <span className="text-slate-500 text-[10px]">Hilangkan baris</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Tampilan Buku */}
                        <div className="bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden min-h-[600px]">
                            <BookContent 
                                student={student} 
                                counselingHistory={counselingHistory} 
                                settings={settings}
                                user={user}
                                privacyMode={privacyMode}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <BookOpen size={64} className="mb-4 text-slate-300"/>
                        <p className="text-lg font-medium">Cari dan pilih siswa untuk membuka riwayat konseling</p>
                    </div>
                )}
            </div>

            {/* MODAL PRATINJAU & CETAK */}
            <PrintPreviewModal 
                isOpen={showPreview} 
                onClose={() => setShowPreview(false)} 
                title={`Riwayat Konseling - ${student?.name || 'Siswa'}`}
            >
                {student && (
                    <BookContent 
                        student={student} 
                        counselingHistory={counselingHistory} 
                        settings={settings}
                        isPrintVersion={true}
                        user={user}
                        privacyMode={privacyMode}
                    />
                )}
            </PrintPreviewModal>

        </div>
    );
};

// ==========================================
// 3. SUB-KOMPONEN: ISI DOKUMEN (KHUSUS CETAK)
// ==========================================
const BookContent = ({ student, counselingHistory, settings, isPrintVersion = false, user, privacyMode }) => {
    
    return (
        <div className={`text-slate-900 ${isPrintVersion ? 'text-sm' : 'p-8'}`}>
            
            {/* KOP SURAT */}
            <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-6">
                <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    {settings?.logo && <img src={settings.logo} className="h-full object-contain" alt="Logo" />}
                </div>
                
                <div className="flex-1 text-center px-4 min-w-0">
                    <h3 className="font-bold text-black text-lg md:text-xl uppercase tracking-wide whitespace-nowrap leading-tight">
                        {settings?.government || ''}
                    </h3>
                    <h3 className="font-bold text-black text-lg md:text-xl uppercase tracking-wide whitespace-nowrap leading-tight">
                        {settings?.department || ''}
                    </h3>
                    <h1 className="font-extrabold text-black text-lg md:text-xl uppercase whitespace-nowrap leading-tight my-1">
                        {settings?.name || 'NAMA SEKOLAH'}
                    </h1>
                    <div className="text-xs text-black font-serif italic leading-tight mt-1">
                        <p>{settings?.address || 'Alamat Sekolah...'}</p>
                        {settings?.address2 && <p>{settings.address2}</p>}
                    </div>
                </div>
                
                <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    {settings?.logo2 && <img src={settings.logo2} className="h-full object-contain" alt="Logo" />}
                </div>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-lg font-bold underline uppercase tracking-wide">RIWAYAT LAYANAN BIMBINGAN KONSELING</h2>
            </div>

            {/* IDENTITAS SISWA */}
            <table className="w-full mb-6 text-sm font-bold">
                <tbody>
                    <tr><td className="w-32 py-1">Nama Siswa</td><td>: {student.name}</td><td className="w-32">Kelas</td><td>: {student.class}</td></tr>
                    <tr><td className="py-1">NISN</td><td>: {student.nisn || '-'}</td><td>Jenis Kelamin</td><td>: {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
                    <tr>
                        <td className="py-1">Wali Kelas</td>
                        <td>: {student.homeroomTeacher || '-'}</td>
                        <td>Guru Wali</td>
                        <td>: {student.guardianTeacher || '-'}</td>
                    </tr>
                    <tr>
                        <td className="py-1">Thn Ajaran / Sem</td>
                        <td colSpan="3">: {settings?.academicYear || '-'} / {settings?.semester || '-'}</td>
                    </tr>
                </tbody>
            </table>

            {/* RIWAYAT LAYANAN */}
            <div className="mb-8">
                <h3 className="font-bold text-sm uppercase border-b border-black pb-1 mb-2 flex items-center gap-2 text-blue-800">
                    <FileText size={16}/> C. Daftar Layanan
                </h3>
                {privacyMode === 'mask' && (
                    <p className="text-[10px] italic mb-2 text-slate-500">*Topik layanan yang bersifat privasi disamarkan pada dokumen ini.</p>
                )}
                {privacyMode === 'hide' && (
                    <p className="text-[10px] italic mb-2 text-slate-500">*Layanan yang bersifat privasi tidak ditampilkan pada dokumen ini.</p>
                )}
                
                <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                        <tr className="bg-slate-100 text-center">
                            <th className="border border-black p-1.5 w-8">No</th>
                            <th className="border border-black p-1.5 w-24">Tanggal</th>
                            <th className="border border-black p-1.5 w-48">Jenis & Detail Layanan</th> <th className="border border-black p-1.5">Topik / Masalah</th> <th className="border border-black p-1.5 w-32">Tindak Lanjut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {counselingHistory.length > 0 ? counselingHistory.map((h, i) => {
                            // LOGIKA TAMPILAN BERDASARKAN MODE PRIVASI
                            const isPrivate = h.isPrivate || (h.serviceType && h.serviceType.toLowerCase().includes('pribadi'));
                            const isMasked = isPrivate && privacyMode === 'mask';
                            
                            return (
                                <tr key={h.id}>
                                    <td className="border border-black p-1.5 text-center">{i+1}</td>
                                    <td className="border border-black p-1.5 text-center">{formatIndoDate(h.date)}</td>
                                    
                                    {/* KOLOM GABUNGAN (JENIS LAYANAN & DETAIL) */}
                                    <td className="border border-black p-1.5 text-left align-top">
                                        <div className="font-bold underline mb-1 flex items-center gap-1">
                                            {h.serviceType}
                                            {/* Indikator visual kecil jika ini data privasi (agar guru sadar) */}
                                            {isPrivate && <Lock size={10} className="text-red-500" />}
                                        </div>
                                        <div className="text-[10px] space-y-1">
                                            <div><span className="font-bold">Bidang:</span> {h.skkpd || '-'}</div>
                                            <div><span className="font-bold">Kategori:</span> {h.category || '-'}</div>
                                            <div><span className="font-bold">Teknik:</span> {h.technique || '-'}</div>
                                        </div>
                                    </td>

                                    {/* KOLOM TOPIK */}
                                    <td className="border border-black p-1.5 text-left align-top">
                                        <div className={`text-sm ${isMasked ? 'italic text-gray-400' : ''}`}>
                                            {isMasked ? '--- Privasi (Disamarkan) ---' : h.description}
                                        </div>
                                    </td>

                                    <td className="border border-black p-1.5 align-top">{h.followUp}</td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan="5" className="border border-black p-4 text-center italic">
                                {privacyMode === 'hide' && counselingHistory.length === 0 
                                    ? "Tidak ada layanan publik (data privasi disembunyikan)."
                                    : "Belum ada riwayat layanan."
                                }
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* TANDA TANGAN */}
            <div className="grid grid-cols-2 gap-10 mt-12 text-center text-sm font-serif signature-section break-inside-avoid">
                <div>
                    <p>Mengetahui,</p>
                    <p>Orang Tua / Wali</p>
                    <br/><br/><br/><br/>
                    <p className="font-bold underline">
                        ( {student.parent ? student.parent : '....................................'} )
                    </p>
                </div>
                <div>
                    <p>{settings?.city || '...'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p>Guru BK / Konselor</p>
                    <br/><br/><br/><br/>
                    <p className="font-bold underline">{settings?.counselor || user?.fullName || '......................'}</p>
                    <p>NIP. {settings?.nipCounselor || '......................'}</p>
                </div>
            </div>
        </div>
    );
};

export default CounselingHistory;