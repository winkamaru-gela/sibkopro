import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Search, Printer, Shield, ShieldAlert, 
    BookOpen, History, Award, X, ChevronDown, AlertTriangle, Trophy,
    FileText, Download 
} from 'lucide-react';
import { formatIndoDate } from '../utils/helpers';

// ==========================================
// 1. KOMPONEN PORTAL CETAK (FIXED PRINT STYLE)
// ==========================================
const PrintPreviewModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col animate-in fade-in duration-200 backdrop-blur-sm print:bg-white print:static">
            
            {/* --- CSS ISOLASI CETAK --- */}
            <style>{`
                @media print {
                    /* 1. SETUP KERTAS */
                    @page { size: auto; margin: 10mm; }

                    /* 2. SEMBUNYIKAN APLIKASI UTAMA */
                    #root, .app-container, header, aside, nav { 
                        display: none !important; 
                    }
                    
                    /* 3. RESET BODY AGAR TIDAK TERKUNCI */
                    html, body { 
                        height: auto !important; 
                        overflow: visible !important; 
                        background-color: white !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* 4. TAMPILKAN MODAL INI SEBAGAI KONTEN UTAMA */
                    .print-portal-root { 
                        display: block !important; 
                        position: absolute !important; 
                        top: 0 !important; 
                        left: 0 !important; 
                        width: 100% !important; 
                        height: auto !important;
                        z-index: 9999 !important;
                        background-color: white !important;
                    }

                    /* 5. BERSIHKAN TAMPILAN KERTAS */
                    .print-paper-content {
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                    }

                    /* 6. SEMBUNYIKAN TOMBOL HEADER MODAL */
                    .print-header-actions { display: none !important; }

                    /* 7. HANDLING PAGE BREAK */
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
const StudentPointBook = ({ students, pointLogs, journals, settings, sanctionRules }) => {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    
    // --- STATE PENCARIAN SISWA ---
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef(null);

    // --- FITUR PRIVASI ---
    const [privacyMode, setPrivacyMode] = useState({
        hideCounseling: false, 
        maskDescription: true  
    });

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

    const pointData = useMemo(() => {
        if (!student) return null;
        const logs = pointLogs.filter(p => p.studentId === student.id).sort((a,b) => new Date(b.date) - new Date(a.date));
        
        const violationTotal = logs.filter(p => p.type === 'violation').reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
        const achievementTotal = logs.filter(p => p.type === 'achievement').reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
        
        const netScoreRaw = violationTotal - achievementTotal; 
        const activeSanction = (sanctionRules || []).sort((a,b) => b.max - a.max).find(rule => netScoreRaw >= rule.min && netScoreRaw <= rule.max);

        return { logs, violationTotal, achievementTotal, netScoreRaw, activeSanction };
    }, [student, pointLogs, sanctionRules]);

    const counselingHistory = useMemo(() => {
        if (!student) return [];
        return journals.filter(j => 
            j.studentId === student.id || (j.studentIds && j.studentIds.includes(student.id))
        ).sort((a,b) => b.date.localeCompare(a.date));
    }, [student, journals]);

    const handleSelectStudent = (s) => {
        setSelectedStudentId(s.id);
        setSearchQuery(s.name);
        setIsSearchOpen(false);
    };

    // --- FUNGSI GENERATE WORD (DENGAN TABEL RINGKASAN LEBIH KECIL) ---
    const handleDownloadWord = () => {
        if (!student || !pointData) return;

        const { violationTotal, achievementTotal, netScoreRaw, activeSanction, logs } = pointData;
        const displayScore = Math.abs(netScoreRaw);
        
        const isDeficit = violationTotal > achievementTotal;
        const isSurplus = achievementTotal > violationTotal;
        const scoreColor = isDeficit ? 'red' : (isSurplus ? 'green' : 'black');

        const violationLogs = logs.filter(l => l.type === 'violation');
        const achievementLogs = logs.filter(l => l.type === 'achievement');

        // Style Definition
        const tableStyle = `border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 12px;`;
        const thStyle = `border: 1px solid black; padding: 5px; background-color: #f2f2f2; text-align: center; font-weight: bold;`;
        const tdStyle = `border: 1px solid black; padding: 5px;`;
        const centerTd = `text-align: center;`;
        const kopTextStyle = `margin: 0; text-transform: uppercase; font-size: 14pt; font-weight: bold; white-space: nowrap;`;

        let htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Buku Poin ${student.name}</title></head>
            <body style="font-family: Arial, sans-serif; font-size: 12px;">
                
                <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px double black; padding-bottom: 10px;">
                    <h3 style="${kopTextStyle}">${settings?.government || ''}</h3>
                    <h3 style="${kopTextStyle}">${settings?.department || ''}</h3>
                    <h1 style="${kopTextStyle} font-size: 14pt; font-weight: 800;">${settings?.name || 'NAMA SEKOLAH'}</h1>
                    <p style="margin:0; font-style: italic; font-size: 10pt;">${settings?.address || ''}</p>
                    <p style="margin:0; font-style: italic; font-size: 10pt;">${settings?.address2 || ''}</p>
                </div>

                <h3 style="text-align: center; text-decoration: underline; text-transform: uppercase; margin-bottom: 20px;">
                    BUKU CATATAN POIN & PERILAKU SISWA
                </h3>

                <table style="width: 100%; margin-bottom: 20px; font-weight: bold;">
                    <tr><td style="border:none; width: 120px;">Nama Siswa</td><td style="border:none;">: ${student.name}</td><td style="border:none; width: 80px;">Kelas</td><td style="border:none;">: ${student.class}</td></tr>
                    <tr><td style="border:none;">NISN</td><td style="border:none;">: ${student.nisn || '-'}</td><td style="border:none;">Jns Kelamin</td><td style="border:none;">: ${student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
                    <tr><td style="border:none;">Wali Kelas</td><td style="border:none;">: ${student.homeroomTeacher || '-'}</td><td style="border:none;">Guru Wali</td><td style="border:none;">: ${student.guardianTeacher || '-'}</td></tr>
                    <tr><td style="border:none;">Thn Ajaran</td><td style="border:none;" colspan="3">: ${settings?.academicYear || '-'} / ${settings?.semester || '-'}</td></tr>
                </table>

                <table style="${tableStyle}">
                    <thead>
                        <tr><th style="${thStyle}">Poin Pelanggaran</th><th style="${thStyle}">Poin Prestasi</th><th style="${thStyle}">Selisih Poin</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="${tdStyle} ${centerTd} color: red; font-weight: bold;">${violationTotal}</td>
                            <td style="${tdStyle} ${centerTd} color: green; font-weight: bold;">${achievementTotal}</td>
                            <td style="${tdStyle} ${centerTd} color: ${scoreColor}; font-weight: bold;">${displayScore}</td>
                        </tr>
                    </tbody>
                </table>

                ${isDeficit && activeSanction ? `
                    <h4 style="margin-bottom: 5px; color: #b91c1c;">TINDAK LANJUT & SANKSI</h4>
                    <table style="${tableStyle}">
                        <thead>
                            <tr><th style="${thStyle}">Range Poin</th><th style="${thStyle}">Tindak Lanjut</th><th style="${thStyle}">Sanksi</th></tr>
                        </thead>
                        <tbody>
                            <tr style="background-color: #fff9c4;">
                                <td style="${tdStyle} ${centerTd} color: red; font-weight: bold;">${activeSanction.min} - ${activeSanction.max}</td>
                                <td style="${tdStyle}">${activeSanction.action}</td>
                                <td style="${tdStyle}">${activeSanction.penalty}</td>
                            </tr>
                        </tbody>
                    </table>
                ` : ''}

                <h4 style="margin-bottom: 5px; color: #b91c1c;">A. CATATAN PELANGGARAN</h4>
                <table style="${tableStyle}">
                    <thead>
                        <tr><th style="${thStyle} width: 30px;">No</th><th style="${thStyle} width: 100px;">Tanggal</th><th style="${thStyle}">Uraian Pelanggaran</th><th style="${thStyle} width: 60px;">Poin</th></tr>
                    </thead>
                    <tbody>
                        ${violationLogs.length > 0 ? violationLogs.map((log, i) => `
                            <tr>
                                <td style="${tdStyle} ${centerTd}">${i+1}</td>
                                <td style="${tdStyle} ${centerTd}">${formatIndoDate(log.date)}</td>
                                <td style="${tdStyle}">${log.description}</td>
                                <td style="${tdStyle} ${centerTd} color: red; font-weight: bold;">${log.value}</td>
                            </tr>
                        `).join('') : `<tr><td colspan="4" style="${tdStyle} ${centerTd} font-style: italic;">Tidak ada catatan pelanggaran.</td></tr>`}
                    </tbody>
                </table>

                <h4 style="margin-bottom: 5px; color: #15803d;">B. CATATAN PRESTASI</h4>
                <table style="${tableStyle}">
                    <thead>
                        <tr><th style="${thStyle} width: 30px;">No</th><th style="${thStyle} width: 100px;">Tanggal</th><th style="${thStyle}">Uraian Prestasi</th><th style="${thStyle} width: 60px;">Poin</th></tr>
                    </thead>
                    <tbody>
                        ${achievementLogs.length > 0 ? achievementLogs.map((log, i) => `
                            <tr>
                                <td style="${tdStyle} ${centerTd}">${i+1}</td>
                                <td style="${tdStyle} ${centerTd}">${formatIndoDate(log.date)}</td>
                                <td style="${tdStyle}">${log.description}</td>
                                <td style="${tdStyle} ${centerTd} color: green; font-weight: bold;">${log.value}</td>
                            </tr>
                        `).join('') : `<tr><td colspan="4" style="${tdStyle} ${centerTd} font-style: italic;">Tidak ada catatan prestasi.</td></tr>`}
                    </tbody>
                </table>

                ${!privacyMode.hideCounseling ? `
                    <h4 style="margin-bottom: 5px; color: #1e40af;">C. RIWAYAT LAYANAN BK</h4>
                    ${privacyMode.maskDescription ? '<p style="font-size: 10px; font-style: italic; margin-top:0;">*Detail masalah disamarkan untuk privasi siswa.</p>' : ''}
                    <table style="${tableStyle}">
                        <thead>
                            <tr><th style="${thStyle} width: 30px;">No</th><th style="${thStyle} width: 100px;">Tanggal</th><th style="${thStyle} width: 120px;">Layanan</th><th style="${thStyle}">Topik / Masalah</th><th style="${thStyle}">Tindak Lanjut</th></tr>
                        </thead>
                        <tbody>
                            ${counselingHistory.length > 0 ? counselingHistory.map((h, i) => `
                                <tr>
                                    <td style="${tdStyle} ${centerTd}">${i+1}</td>
                                    <td style="${tdStyle} ${centerTd}">${formatIndoDate(h.date)}</td>
                                    <td style="${tdStyle}">${h.serviceType}</td>
                                    <td style="${tdStyle} font-style: italic;">${privacyMode.maskDescription ? '--- Privasi Siswa Terjaga ---' : h.description}</td>
                                    <td style="${tdStyle}">${h.followUp}</td>
                                </tr>
                            `).join('') : `<tr><td colspan="5" style="${tdStyle} ${centerTd} font-style: italic;">Belum ada riwayat layanan.</td></tr>`}
                        </tbody>
                    </table>
                ` : ''}

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
                            <p style="text-decoration: underline; font-weight: bold;">${settings?.counselor || '......................'}</p>
                            <p>NIP. {settings?.nipCounselor || '......................'}</p>
                        </td>
                    </tr>
                </table>

            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Buku_Poin_${student.name.replace(/\s+/g, '_')}.doc`;
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
                        <BookOpen className="text-blue-600"/> Buku Poin Siswa
                    </h1>
                    <p className="text-xs text-slate-500">Lihat dan cetak rekam jejak karakter siswa.</p>
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
                {student && pointData ? (
                    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Kontrol Privasi */}
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-100 p-2 rounded-full text-yellow-700"><ShieldAlert size={20}/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Kontrol Privasi Dokumen</h4>
                                    <p className="text-xs text-slate-500">Atur informasi yang ditampilkan saat dicetak atau didownload.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-2 rounded-lg border border-yellow-100 shadow-sm">
                                    <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={privacyMode.maskDescription} onChange={e => setPrivacyMode({...privacyMode, maskDescription: e.target.checked})} />
                                    <span className="text-xs font-bold text-slate-700">Samarkan Topik</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-2 rounded-lg border border-yellow-100 shadow-sm">
                                    <input type="checkbox" className="w-4 h-4 accent-red-600" checked={privacyMode.hideCounseling} onChange={e => setPrivacyMode({...privacyMode, hideCounseling: e.target.checked})} />
                                    <span className="text-xs font-bold text-slate-700">Sembunyikan BK</span>
                                </label>
                            </div>
                        </div>

                        {/* Tampilan Buku */}
                        <div className="bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden min-h-[600px]">
                            <BookContent 
                                student={student} 
                                pointData={pointData} 
                                counselingHistory={counselingHistory} 
                                settings={settings}
                                privacyMode={privacyMode} 
                                sanctionRules={sanctionRules}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <BookOpen size={64} className="mb-4 text-slate-300"/>
                        <p className="text-lg font-medium">Cari dan pilih siswa untuk membuka buku poin</p>
                    </div>
                )}
            </div>

            {/* MODAL PRATINJAU & CETAK */}
            <PrintPreviewModal 
                isOpen={showPreview} 
                onClose={() => setShowPreview(false)} 
                title={`Buku Poin - ${student?.name || 'Siswa'}`}
            >
                {student && (
                    <BookContent 
                        student={student} 
                        pointData={pointData} 
                        counselingHistory={counselingHistory} 
                        settings={settings}
                        privacyMode={privacyMode} 
                        sanctionRules={sanctionRules}
                        isPrintVersion={true}
                    />
                )}
            </PrintPreviewModal>

        </div>
    );
};

// ==========================================
// 3. SUB-KOMPONEN: ISI BUKU (DOKUMEN HTML)
// ==========================================
const BookContent = ({ student, pointData, counselingHistory, settings, privacyMode, sanctionRules, isPrintVersion = false }) => {
    const { violationTotal, achievementTotal, netScoreRaw, activeSanction, logs } = pointData;

    const violationLogs = logs.filter(l => l.type === 'violation');
    const achievementLogs = logs.filter(l => l.type === 'achievement');

    const isDeficit = violationTotal > achievementTotal;
    const isSurplus = achievementTotal > violationTotal;
    const displayScore = Math.abs(netScoreRaw);
    const scoreColorClass = isDeficit ? 'text-red-600' : (isSurplus ? 'text-green-600' : 'text-slate-800');

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
                <h2 className="text-lg font-bold underline uppercase tracking-wide">BUKU CATATAN POIN & PERILAKU SISWA</h2>
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

            {/* RINGKASAN POIN (TAMPILAN KOMPAK & RAPI) */}
            <table className="w-full border-collapse border border-black mb-6 text-center text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2 w-1/3">Poin Pelanggaran</th>
                        <th className="border border-black p-2 w-1/3">Poin Prestasi</th>
                        <th className="border border-black p-2 w-1/3">Selisih Poin</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-black p-2 font-bold text-red-600">{violationTotal}</td>
                        <td className="border border-black p-2 font-bold text-green-600">{achievementTotal}</td>
                        <td className={`border border-black p-2 font-bold ${scoreColorClass}`}>
                            {displayScore}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* KETENTUAN SANKSI */}
            {isDeficit && activeSanction && (
                <div className="mb-8">
                    <h3 className="font-bold text-sm uppercase mb-2 text-red-700">Tindak Lanjut & Sanksi</h3>
                    <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                            <tr className="bg-gray-100 text-center">
                                <th className="border border-black p-1.5 w-24">Range Poin</th>
                                <th className="border border-black p-1.5">Tindak Lanjut (Guru/Sekolah)</th>
                                <th className="border border-black p-1.5">Sanksi (Siswa)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-yellow-50 font-bold">
                                <td className="border border-black p-2 text-center text-red-600">{activeSanction.min} - {activeSanction.max}</td>
                                <td className="border border-black p-2">{activeSanction.action}</td>
                                <td className="border border-black p-2">{activeSanction.penalty}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* CATATAN PELANGGARAN */}
            <div className="mb-6">
                <h3 className="font-bold text-sm uppercase border-b border-black pb-1 mb-2 flex items-center gap-2 text-red-700">
                    <AlertTriangle size={16}/> A. Catatan Pelanggaran
                </h3>
                <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                        <tr className="bg-slate-100 text-center">
                            <th className="border border-black p-1.5 w-8">No</th>
                            <th className="border border-black p-1.5 w-24">Tanggal</th>
                            <th className="border border-black p-1.5">Uraian Pelanggaran</th>
                            <th className="border border-black p-1.5 w-16">Poin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {violationLogs.length > 0 ? violationLogs.map((log, i) => (
                            <tr key={log.id}>
                                <td className="border border-black p-1.5 text-center">{i+1}</td>
                                <td className="border border-black p-1.5 text-center">{formatIndoDate(log.date)}</td>
                                <td className="border border-black p-1.5">{log.description}</td>
                                <td className="border border-black p-1.5 text-center font-bold text-red-600">{log.value}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="border border-black p-4 text-center italic">Tidak ada catatan pelanggaran.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* CATATAN PRESTASI */}
            <div className="mb-6">
                <h3 className="font-bold text-sm uppercase border-b border-black pb-1 mb-2 flex items-center gap-2 text-green-700">
                    <Trophy size={16}/> B. Catatan Prestasi
                </h3>
                <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                        <tr className="bg-slate-100 text-center">
                            <th className="border border-black p-1.5 w-8">No</th>
                            <th className="border border-black p-1.5 w-24">Tanggal</th>
                            <th className="border border-black p-1.5">Uraian Prestasi</th>
                            <th className="border border-black p-1.5 w-16">Poin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {achievementLogs.length > 0 ? achievementLogs.map((log, i) => (
                            <tr key={log.id}>
                                <td className="border border-black p-1.5 text-center">{i+1}</td>
                                <td className="border border-black p-1.5 text-center">{formatIndoDate(log.date)}</td>
                                <td className="border border-black p-1.5">{log.description}</td>
                                <td className="border border-black p-1.5 text-center font-bold text-green-600">{log.value}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="border border-black p-4 text-center italic">Tidak ada catatan prestasi.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* RIWAYAT LAYANAN */}
            {!privacyMode.hideCounseling && (
                <div className="mb-8">
                    <h3 className="font-bold text-sm uppercase border-b border-black pb-1 mb-2 flex items-center gap-2 text-blue-800">
                        <Shield size={16}/> C. Riwayat Layanan Bimbingan Konseling
                    </h3>
                    {privacyMode.maskDescription && (
                        <p className="text-[10px] italic mb-2 text-slate-500">*Detail masalah disamarkan untuk privasi siswa.</p>
                    )}
                    <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                            <tr className="bg-slate-100 text-center">
                                <th className="border border-black p-1.5 w-8">No</th>
                                <th className="border border-black p-1.5 w-24">Tanggal</th>
                                <th className="border border-black p-1.5 w-32">Layanan</th>
                                <th className="border border-black p-1.5">Topik / Masalah</th>
                                <th className="border border-black p-1.5">Tindak Lanjut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {counselingHistory.length > 0 ? counselingHistory.map((h, i) => (
                                <tr key={h.id}>
                                    <td className="border border-black p-1.5 text-center">{i+1}</td>
                                    <td className="border border-black p-1.5 text-center">{formatIndoDate(h.date)}</td>
                                    <td className="border border-black p-1.5">{h.serviceType}</td>
                                    <td className="border border-black p-1.5 italic">
                                        {privacyMode.maskDescription ? '--- Privasi Siswa Terjaga ---' : h.description}
                                    </td>
                                    <td className="border border-black p-1.5">{h.followUp}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="border border-black p-4 text-center italic">Belum ada riwayat layanan.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

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
                    <p className="font-bold underline">{settings?.counselor || '......................'}</p>
                    <p>NIP. {settings?.nipCounselor || '......................'}</p>
                </div>
            </div>
        </div>
    );
};

export default StudentPointBook;