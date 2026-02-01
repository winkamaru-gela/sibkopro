import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Printer, Users, BookOpen, Map, FileText, FileCheck, 
    Filter, ChevronRight, ChevronDown, Eye, Search, X, Calendar, List
} from 'lucide-react';
import { formatIndoDate } from '../utils/helpers';

// ==========================================
// 1. KOMPONEN PORTAL PRATINJAU (TETAP SAMA)
// ==========================================
const PrintPreviewModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col animate-in fade-in duration-200 backdrop-blur-sm print:bg-white print:static">
            <style>{`
                @media print {
                    @page { size: auto; margin: 10mm; }
                    #root, .app-container, header, aside, nav { display: none !important; }
                    html, body { height: auto !important; overflow: visible !important; background-color: white !important; margin: 0 !important; padding: 0 !important; }
                    .print-portal-root { display: block !important; position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; z-index: 9999 !important; background-color: white !important; }
                    .print-paper-content { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; }
                    .print-header-actions { display: none !important; }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    tr { page-break-inside: avoid; }
                    td, th { border: 1px solid black !important; padding: 4px; color: black !important; }
                    .signature-section { page-break-inside: avoid; }
                }
            `}</style>

            <div className="bg-slate-800 text-white px-4 py-3 shadow-md flex justify-between items-center flex-shrink-0 border-b border-slate-700 print-header-actions">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                        <Printer size={20} className="text-blue-400"/> Pratinjau: {title}
                    </h2>
                    <p className="text-[10px] text-slate-400 hidden sm:block">
                        Gunakan kertas A4/F4 pada pengaturan printer.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">Tutup</button>
                    <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95">
                        <Printer size={16}/> Cetak Sekarang
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-900/50 print:bg-white print:p-0 print:overflow-visible print-portal-root">
                <div className="print-paper-content bg-white text-slate-900 shadow-2xl w-full max-w-[215mm] min-h-[297mm] p-10 md:p-14 origin-top h-fit mx-auto">
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
const Reports = ({ journals, students, settings }) => {
    const [activeTab, setActiveTab] = useState('journal');
    const [showPreview, setShowPreview] = useState(false);

    // --- GLOBAL FILTER STATE ---
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
    const [filterSemester, setFilterSemester] = useState(settings?.semester || 'Ganjil');
    const [filterYear, setFilterYear] = useState(settings?.academicYear || '2024/2025');
    
    // --- STATE KHUSUS LAPORAN KLASIKAL ---
    const [filterClass, setFilterClass] = useState(''); // Filter Kelas

    // --- STATE KHUSUS REKAM JEJAK ---
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentSearch, setStudentSearch] = useState(''); // Pencarian Nama Siswa
    const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

    // --- STATE KHUSUS BUKTI LAYANAN ---
    const [selectedJournalId, setSelectedJournalId] = useState('');
    const [proofFilterMode, setProofFilterMode] = useState('month'); // 'all', 'month', 'year'
    const [proofDate, setProofDate] = useState(new Date().toISOString().slice(0, 7));
    const [proofSearch, setProofSearch] = useState(''); // Pencarian Teks Jurnal

    // --- MEMOIZED DATA ---
    const uniqueClasses = useMemo(() => [...new Set(students.map(s => s.class))].sort(), [students]);
    
    const filteredStudents = useMemo(() => {
        if (!studentSearch) return [];
        return students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).slice(0, 10);
    }, [students, studentSearch]);

    const filteredJournalsForProof = useMemo(() => {
        return journals.filter(j => {
            // 1. Filter Waktu
            let dateMatch = true;
            if (proofFilterMode === 'month') dateMatch = j.date.startsWith(proofDate);
            if (proofFilterMode === 'year') dateMatch = j.date.startsWith(proofDate.slice(0, 4));
            
            // 2. Filter Teks (Jenis Layanan / Deskripsi)
            const searchLower = proofSearch.toLowerCase();
            const textMatch = !proofSearch || 
                j.serviceType.toLowerCase().includes(searchLower) || 
                j.description.toLowerCase().includes(searchLower);

            return dateMatch && textMatch;
        }).sort((a,b) => b.date.localeCompare(a.date)); // Terbaru di atas
    }, [journals, proofFilterMode, proofDate, proofSearch]);

    const REPORT_TYPES = [
        { id: 'journal', label: 'Jurnal Bulanan', icon: BookOpen, desc: 'Laporan aktivitas harian' },
        { id: 'classReport', label: 'Laporan Klasikal', icon: Users, desc: 'Rekap bimbingan kelas' },
        { id: 'individual', label: 'Rekam Jejak', icon: FileText, desc: 'History layanan per siswa' },
        { id: 'riskMap', label: 'Peta Kerawanan', icon: Map, desc: 'Analisis tingkat resiko' },
        { id: 'serviceProof', label: 'Bukti Layanan', icon: FileCheck, desc: 'Dokumen fisik (LPL)' },
    ];

    // Helper: Render Dokumen untuk Cetak
    const renderDocumentContent = () => {
        switch(activeTab) {
            case 'journal': return <JournalContent journals={journals} month={filterMonth} semester={filterSemester} year={filterYear} settings={settings} />;
            case 'classReport': return <ClassReportContent journals={journals} month={filterMonth} semester={filterSemester} year={filterYear} filterClass={filterClass} settings={settings} />;
            case 'individual': return <IndividualContent journals={journals} students={students} studentId={selectedStudentId} settings={settings} />;
            case 'riskMap': return <RiskMapContent students={students} year={filterYear} settings={settings} />;
            case 'serviceProof': return <ServiceProofContent journals={journals} journalId={selectedJournalId} settings={settings} />;
            default: return null;
        }
    };

    // Helper: Render Form Filter (Side Panel)
    const renderFilterForm = () => {
        const currentType = REPORT_TYPES.find(t => t.id === activeTab);
        
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="border-b pb-4 mb-4">
                        <h2 className="text-lg font-bold text-slate-800">{currentType?.label}</h2>
                        <p className="text-sm text-slate-500">Atur filter data sebelum mencetak dokumen.</p>
                    </div>

                    {/* FORM FILTER */}
                    <div className="grid grid-cols-1 gap-6 mb-6">
                        
                        {/* 1. FILTER UMUM (JURNAL & KLASIKAL) */}
                        {(activeTab === 'journal' || activeTab === 'classReport') && (
                            <>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Periode Bulan</label>
                                    <input type="month" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
                                </div>
                                
                                {activeTab === 'classReport' && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Filter Kelas (Opsional)</label>
                                        <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                                            <option value="">-- Semua Kelas --</option>
                                            {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Semester</label>
                                        <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50" value={filterSemester} onChange={e => setFilterSemester(e.target.value)}>
                                            <option value="Ganjil">Ganjil</option>
                                            <option value="Genap">Genap</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tahun</label>
                                        <input className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50" value={filterYear} onChange={e => setFilterYear(e.target.value)} />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 2. FILTER REKAM JEJAK (PENCARIAN SISWA) */}
                        {activeTab === 'individual' && (
                            <div className="relative">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Cari Nama Siswa</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Ketik nama siswa..."
                                        value={studentSearch}
                                        onChange={e => { setStudentSearch(e.target.value); setIsStudentDropdownOpen(true); setSelectedStudentId(''); }}
                                        onFocus={() => setIsStudentDropdownOpen(true)}
                                    />
                                    {selectedStudentId && (
                                        <button onClick={() => { setSelectedStudentId(''); setStudentSearch(''); }} className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500">
                                            <X size={16}/>
                                        </button>
                                    )}
                                </div>
                                {isStudentDropdownOpen && studentSearch && !selectedStudentId && (
                                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map(s => (
                                                <div 
                                                    key={s.id} 
                                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0"
                                                    onClick={() => {
                                                        setSelectedStudentId(s.id);
                                                        setStudentSearch(`${s.name} (${s.class})`);
                                                        setIsStudentDropdownOpen(false);
                                                    }}
                                                >
                                                    <div className="font-bold text-slate-700">{s.name}</div>
                                                    <div className="text-xs text-slate-500">{s.class} | {s.nisn}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 text-sm text-slate-400 text-center">Siswa tidak ditemukan</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. FILTER BUKTI LAYANAN (JURNAL ADVANCED FILTER) */}
                        {activeTab === 'serviceProof' && (
                            <div className="space-y-4">
                                {/* Mode Filter */}
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    {['all', 'month', 'year'].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setProofFilterMode(mode)}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${proofFilterMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {mode === 'all' ? 'Semua' : mode === 'month' ? 'Bulan' : 'Tahun'}
                                        </button>
                                    ))}
                                </div>

                                {/* Date Input */}
                                {proofFilterMode !== 'all' && (
                                    <div>
                                        <input 
                                            type={proofFilterMode === 'month' ? 'month' : 'number'} 
                                            placeholder={proofFilterMode === 'year' ? 'YYYY' : ''}
                                            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                                            value={proofDate}
                                            onChange={e => setProofDate(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Search Text */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg text-sm"
                                        placeholder="Cari kegiatan (Klasikal, Individu...)"
                                        value={proofSearch}
                                        onChange={e => setProofSearch(e.target.value)}
                                    />
                                </div>

                                {/* List Journal Result */}
                                <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto bg-slate-50">
                                    {filteredJournalsForProof.length > 0 ? (
                                        filteredJournalsForProof.map(j => (
                                            <div 
                                                key={j.id}
                                                onClick={() => setSelectedJournalId(j.id)}
                                                className={`p-3 border-b last:border-0 cursor-pointer transition-colors ${selectedJournalId === j.id ? 'bg-blue-100 border-blue-200' : 'hover:bg-white'}`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold bg-white border px-1.5 rounded text-slate-600">{formatIndoDate(j.date)}</span>
                                                    <span className="text-[10px] text-slate-400">{j.serviceType}</span>
                                                </div>
                                                <div className="text-xs font-bold text-slate-700 line-clamp-1">{j.studentName}</div>
                                                <div className="text-[10px] text-slate-500 italic line-clamp-1">{j.description}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-xs text-slate-400">Data jurnal tidak ditemukan.</div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'riskMap' && (
                            <div className="bg-blue-50 text-blue-700 p-3 rounded text-sm">
                                Dokumen ini akan mencetak seluruh data siswa yang diurutkan berdasarkan tingkat kerawanan (Tinggi ke Rendah).
                            </div>
                        )}
                    </div>

                    {/* TOMBOL AKSI */}
                    <div className="pt-4 border-t flex justify-end">
                        {((activeTab === 'individual' && !selectedStudentId) || (activeTab === 'serviceProof' && !selectedJournalId)) ? (
                            <button disabled className="bg-slate-200 text-slate-400 px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 cursor-not-allowed w-full md:w-auto justify-center">
                                <Eye size={18}/> Lengkapi Filter
                            </button>
                        ) : (
                            <button onClick={() => setShowPreview(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 w-full md:w-auto justify-center">
                                <Eye size={18}/> Lihat Pratinjau & Cetak
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* HEADER */}
            <div className="bg-white border-b px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm flex-shrink-0">
                <div>
                    <h1 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Printer className="text-blue-600" /> Pusat Laporan
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 hidden md:block">Kelola dan cetak dokumen administrasi BK.</p>
                </div>
            </div>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full no-scrollbar">
                <div className="max-w-7xl mx-auto">
                    
                    {/* MOBILE ACCORDION */}
                    <div className="md:hidden space-y-3">
                        {REPORT_TYPES.map(tab => (
                            <div key={tab.id} className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${activeTab === tab.id ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'border-slate-200'}`}>
                                <button 
                                    onClick={() => { 
                                        setActiveTab(tab.id); 
                                        // Reset selection states when changing tabs
                                        setSelectedStudentId(''); 
                                        setStudentSearch('');
                                        setSelectedJournalId('');
                                    }}
                                    className={`w-full flex items-center justify-between p-4 text-left transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                            <tab.icon size={20} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm block">{tab.label}</span>
                                            <span className="text-[10px] opacity-70">{tab.desc}</span>
                                        </div>
                                    </div>
                                    {activeTab === tab.id ? <ChevronDown size={20}/> : <ChevronRight size={20} className="text-slate-400"/>}
                                </button>
                                
                                {activeTab === tab.id && (
                                    <div className="p-4 border-t border-blue-100 bg-slate-50/50">
                                        {renderFilterForm()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP LAYOUT */}
                    <div className="hidden md:flex gap-6 items-start h-full">
                        <aside className="w-72 flex-shrink-0">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                                <div className="p-4 border-b bg-slate-50">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jenis Dokumen</span>
                                </div>
                                <nav className="p-2 space-y-1">
                                    {REPORT_TYPES.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => { 
                                                setActiveTab(tab.id); 
                                                setSelectedStudentId(''); 
                                                setStudentSearch('');
                                                setSelectedJournalId('');
                                            }}
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
                                                <div className="text-[10px] opacity-70">{tab.desc}</div>
                                            </div>
                                            {activeTab === tab.id && <ChevronRight size={16} className="ml-auto text-blue-400"/>}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </aside>

                        <main className="flex-1 w-full">
                            {renderFilterForm()}
                        </main>
                    </div>

                </div>
            </div>

            {/* MODAL PRATINJAU */}
            <PrintPreviewModal 
                isOpen={showPreview} 
                onClose={() => setShowPreview(false)}
                title={`Cetak ${REPORT_TYPES.find(t=>t.id === activeTab)?.label}`}
            >
                {renderDocumentContent()}
            </PrintPreviewModal>

        </div>
    );
};

// ==========================================
// 3. KONTEN DOKUMEN CETAK
// ==========================================

const JournalContent = ({ journals, month, semester, year, settings }) => {
    const data = journals.filter(j => 
        j.date.startsWith(month) && 
        (!j.semester || j.semester === semester) &&
        (!j.academicYear || j.academicYear === year)
    ).sort((a,b) => a.date.localeCompare(b.date));

    return (
        <div className="text-sm">
            <KopSurat settings={settings} />
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold underline uppercase">JURNAL KEGIATAN BIMBINGAN DAN KONSELING</h3>
                <p className="text-sm mt-1">Bulan: {new Date(month).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} | Semester: {semester} {year}</p>
            </div>
            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="bg-gray-100 text-center">
                        <th className="border border-black p-1 w-8">No</th>
                        <th className="border border-black p-1 w-20">Hari/Tgl</th>
                        <th className="border border-black p-1">Sasaran</th>
                        <th className="border border-black p-1 w-24">Layanan</th>
                        <th className="border border-black p-1">Kegiatan / Masalah</th>
                        <th className="border border-black p-1">Hasil / TL</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((j, i) => (
                        <tr key={j.id}>
                            <td className="border border-black p-1 text-center align-top">{i+1}</td>
                            <td className="border border-black p-1 align-top">{formatIndoDate(j.date)}</td>
                            <td className="border border-black p-1 align-top">{j.studentNames?.join(', ') || j.studentName}</td>
                            <td className="border border-black p-1 align-top">{j.serviceType}</td>
                            <td className="border border-black p-1 align-top text-justify">
                                {j.description}
                                {j.technique && <div className="italic text-[10px] mt-1 text-slate-600">Teknik: {j.technique}</div>}
                            </td>
                            <td className="border border-black p-1 align-top">
                                {j.resultEval || j.result || '-'}
                                <div className="font-bold text-[10px] mt-1">TL: {j.followUp}</div>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan="6" className="border border-black p-8 text-center italic">Tidak ada data jurnal pada periode ini.</td></tr>}
                </tbody>
            </table>
            <SignatureSection settings={settings} />
        </div>
    );
};

const ClassReportContent = ({ journals, month, semester, year, filterClass, settings }) => {
    // UPDATED: Tambahkan filter Class
    const data = journals.filter(j => 
        j.date.startsWith(month) && 
        j.serviceType === 'Bimbingan Klasikal' &&
        (!j.semester || j.semester === semester) &&
        (!j.academicYear || j.academicYear === year) &&
        (!filterClass || j.studentName.includes(filterClass) || j.targetClass === filterClass)
    ).sort((a,b) => a.date.localeCompare(b.date));

    return (
        <div className="text-sm">
            <KopSurat settings={settings} />
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold underline uppercase">LAPORAN LAYANAN KLASIKAL</h3>
                <p className="text-sm mt-1">
                    Bulan: {new Date(month).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} 
                    {filterClass && <span> | Kelas: {filterClass}</span>}
                </p>
            </div>
            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="bg-gray-100 text-center">
                        <th className="border border-black p-1 w-8">No</th>
                        <th className="border border-black p-1 w-24">Tanggal</th>
                        <th className="border border-black p-1 w-16">Kelas</th>
                        <th className="border border-black p-1">Topik / Materi</th>
                        <th className="border border-black p-1">Evaluasi (Proses & Hasil)</th>
                        <th className="border border-black p-1 w-24">TL</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((j, i) => (
                        <tr key={j.id}>
                            <td className="border border-black p-1 text-center align-top">{i+1}</td>
                            <td className="border border-black p-1 align-top text-center">
                                {formatIndoDate(j.date)}<br/><span className="text-[10px]">Jam ke-{j.time}</span>
                            </td>
                            <td className="border border-black p-1 align-top text-center font-bold">{j.studentNames?.join(', ') || j.studentName}</td>
                            <td className="border border-black p-1 align-top">
                                <div className="font-bold mb-1">{j.description}</div>
                                <div className="text-[10px] italic">Bidang: {j.skkpd}</div>
                            </td>
                            <td className="border border-black p-1 align-top text-justify">
                                <div className="mb-1"><strong>P:</strong> {j.processEval || '-'}</div>
                                <div><strong>H:</strong> {j.resultEval || '-'}</div>
                            </td>
                            <td className="border border-black p-1 align-top text-center">{j.followUp}</td>
                        </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan="6" className="border border-black p-8 text-center italic">Tidak ada data klasikal.</td></tr>}
                </tbody>
            </table>
            <SignatureSection settings={settings} />
        </div>
    );
};

const IndividualContent = ({ journals, students, studentId, settings }) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const history = journals.filter(j => 
        (j.studentIds && j.studentIds.includes(studentId)) || 
        (j.studentId && j.studentId === studentId)
    ).sort((a,b) => a.date.localeCompare(b.date));

    return (
        <div className="text-sm">
            <KopSurat settings={settings} />
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold underline uppercase">REKAM JEJAK LAYANAN SISWA</h3>
            </div>
            <table className="w-full mb-4 text-sm font-bold">
                <tbody>
                    <tr><td className="w-32">Nama Siswa</td><td>: {student.name}</td></tr>
                    <tr><td>Kelas / NISN</td><td>: {student.class} / {student.nisn || '-'}</td></tr>
                    <tr><td>Wali Kelas</td><td>: -</td></tr>
                </tbody>
            </table>
            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="bg-gray-100 text-center">
                        <th className="border border-black p-1 w-8">No</th>
                        <th className="border border-black p-1 w-24">Tanggal</th>
                        <th className="border border-black p-1 w-32">Layanan</th>
                        <th className="border border-black p-1">Masalah / Topik</th>
                        <th className="border border-black p-1">Hasil / Tindak Lanjut</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((j, i) => (
                        <tr key={j.id}>
                            <td className="border border-black p-1 text-center align-top">{i+1}</td>
                            <td className="border border-black p-1 align-top">{formatIndoDate(j.date)}</td>
                            <td className="border border-black p-1 align-top">{j.serviceType}</td>
                            <td className="border border-black p-1 align-top text-justify">{j.description}</td>
                            <td className="border border-black p-1 align-top">
                                {j.resultEval || j.result || '-'}
                                <div className="font-bold text-[10px] mt-1">({j.followUp})</div>
                            </td>
                        </tr>
                    ))}
                    {history.length === 0 && <tr><td colSpan="5" className="border border-black p-8 text-center italic">Belum ada riwayat layanan.</td></tr>}
                </tbody>
            </table>
            <SignatureSection settings={settings} />
        </div>
    );
};

const RiskMapContent = ({ students, year, settings }) => {
    const sorted = [...students].sort((a,b) => {
        const riskVal = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return (riskVal[b.riskLevel] || 0) - (riskVal[a.riskLevel] || 0);
    });

    return (
        <div className="text-sm">
            <KopSurat settings={settings} />
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold underline uppercase">PETA KERAWANAN SISWA</h3>
                <p className="text-sm mt-1">Tahun Ajaran: {year}</p>
            </div>
            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="bg-gray-100 text-center">
                        <th className="border border-black p-1 w-8">No</th>
                        <th className="border border-black p-1">Nama Siswa</th>
                        <th className="border border-black p-1 w-20">Kelas</th>
                        <th className="border border-black p-1 w-32">Tingkat Kerawanan</th>
                        <th className="border border-black p-1">Keterangan / Wali</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((s, i) => (
                        <tr key={s.id}>
                            <td className="border border-black p-1 text-center">{i+1}</td>
                            <td className="border border-black p-1 font-bold">{s.name}</td>
                            <td className="border border-black p-1 text-center">{s.class}</td>
                            <td className="border border-black p-1 text-center font-bold">
                                {s.riskLevel === 'HIGH' ? 'TINGGI' : s.riskLevel === 'MEDIUM' ? 'SEDANG' : 'RENDAH'}
                            </td>
                            <td className="border border-black p-1">
                                {s.parent} {s.parentPhone ? `(${s.parentPhone})` : ''}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <SignatureSection settings={settings} />
        </div>
    );
};

const ServiceProofContent = ({ journals, journalId, settings }) => {
    const j = journals.find(x => x.id === journalId);
    if (!j) return null;

    return (
        <div className="text-sm">
            <KopSurat settings={settings} />
            <div className="text-center mb-8">
                <h3 className="text-lg font-bold underline uppercase">LAPORAN PELAKSANAAN LAYANAN (LPL)</h3>
                <p className="font-bold">BIMBINGAN DAN KONSELING</p>
                <p className="mt-1 font-bold text-xs">Semester: {j.semester || '-'} Tahun: {j.academicYear || '-'}</p>
            </div>
            <div className="space-y-4 text-sm leading-relaxed border border-black p-6">
                <div className="grid grid-cols-[180px_10px_1fr] gap-1">
                    <div className="font-bold">1. Jenis Layanan</div><div>:</div><div>{j.serviceType}</div>
                    <div className="font-bold">2. Bidang Bimbingan</div><div>:</div><div>{j.skkpd || '-'}</div>
                    <div className="font-bold">3. Topik / Masalah</div><div>:</div><div>{j.description}</div>
                    <div className="font-bold">4. Sasaran / Konseli</div><div>:</div><div>{j.studentNames?.join(', ') || j.studentName}</div>
                    <div className="font-bold">5. Hari / Tanggal</div><div>:</div><div>{formatIndoDate(j.date)}</div>
                    <div className="font-bold">6. Waktu / Tempat</div><div>:</div><div>{j.time || '-'} / {j.place || '-'}</div>
                    <div className="font-bold">7. Teknik Konseling</div><div>:</div><div>{j.technique || '-'}</div>
                </div>
                <hr className="border-black border-dashed my-4"/>
                <div>
                    <div className="font-bold mb-2">8. Hasil / Evaluasi:</div>
                    <div className="pl-4 border-l-2 border-slate-200">
                        <p className="mb-2"><span className="font-bold">Proses:</span> {j.processEval || '-'}</p>
                        <p><span className="font-bold">Hasil:</span> {j.resultEval || j.result || '-'}</p>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="font-bold mb-2">9. Tindak Lanjut:</div>
                    <div className="pl-4 border-l-2 border-slate-200">{j.followUp}</div>
                </div>
            </div>
            <SignatureSection settings={settings} dateLabel={`${settings?.city || '...'}, ${formatIndoDate(j.date)}`} />
        </div>
    );
};

// --- HELPER UI ---

const KopSurat = ({ settings }) => (
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
);

const SignatureSection = ({ settings, dateLabel }) => (
    <div className="grid grid-cols-2 gap-10 mt-12 text-center text-sm font-serif signature-section">
        <div>
            <p>Mengetahui,</p>
            <p>Kepala Sekolah</p>
            <br/><br/><br/><br/>
            <p className="font-bold underline">{settings?.headmaster || '......................'}</p>
            <p>NIP. {settings?.nipHeadmaster || '......................'}</p>
        </div>
        <div>
            <p>{settings?.city || '...'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Guru BK / Konselor</p>
            <br/><br/><br/><br/>
            <p className="font-bold underline">{settings?.counselor || '......................'}</p>
            <p>NIP. {settings?.nipCounselor || '......................'}</p>
        </div>
    </div>
);

export default Reports;