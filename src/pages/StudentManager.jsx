import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { 
    Users, X, ArrowRightLeft, Upload, PlusCircle, 
    Search, MoreVertical, ChevronDown, Download, ChevronLeft, ChevronRight,
    AlertCircle, CheckCircle, Settings, Power 
} from 'lucide-react';
import * as XLSX from 'xlsx'; 
import { parseImportDate } from '../utils/helpers';

// IMPORT COMPONENTS
import StudentForm from '../components/students/StudentForm';
import StudentTable from '../components/students/StudentTable';
import StudentMobileList from '../components/students/StudentMobileList';
import StudentDetailModal from '../components/students/StudentDetailModal';

const StudentManager = ({ students, journals, pointLogs, sanctionRules, user, onAdd, onEdit, onDelete, onImport, onMoveClass }) => {
    // --- STATE UI ---
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState(''); 
    const [showForm, setShowForm] = useState(false);
    const [viewDetail, setViewDetail] = useState(null); 
    const [showMobileMenu, setShowMobileMenu] = useState(false); 
    
    // --- FITUR CERDAS (DETEKTOR) ---
    const [isDetectorEnabled, setIsDetectorEnabled] = useState(true); // Default: Aktif
    const [showMissingClassOnly, setShowMissingClassOnly] = useState(false); 

    // --- STATE PAGINATION ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    // State Pindah Kelas
    const [isMoveMode, setIsMoveMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [targetClass, setTargetClass] = useState('');

    const [editingData, setEditingData] = useState(null);
    const fileInputRef = useRef(null);

    // --- MEMOIZED DATA ---
    const uniqueClasses = useMemo(() => {
        return [...new Set((students || []).map(s => s.class).filter(Boolean))].sort();
    }, [students]);

    // 1. FITUR CERDAS: Hitung siswa tanpa kelas (Hanya jika Enabled)
    const missingClassCount = useMemo(() => {
        if (!isDetectorEnabled) return 0; // Jika dimatikan, return 0
        return (students || []).filter(s => !s.class || s.class.trim() === '').length;
    }, [students, isDetectorEnabled]);

    // 2. LOGIKA FILTER UTAMA
    const filteredStudents = useMemo(() => {
        return (students || []).filter(s => {
            // Prioritas 1: Jika Mode "Cek Data Kosong" aktif
            if (showMissingClassOnly && isDetectorEnabled) {
                return !s.class || s.class.trim() === '';
            }

            // Prioritas 2: Filter Normal
            const matchSearch = 
                s.name.toLowerCase().includes(search.toLowerCase()) || 
                (s.class && s.class.toLowerCase().includes(search.toLowerCase())) ||
                (s.nisn && s.nisn.includes(search));
            
            const matchClass = filterClass ? s.class === filterClass : true;
            
            return matchSearch && matchClass;
        });
    }, [students, search, filterClass, showMissingClassOnly, isDetectorEnabled]);

    // --- LOGIC PAGINATION ---
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    // Reset halaman jika filter berubah
    useEffect(() => { setCurrentPage(1); }, [search, filterClass, showMissingClassOnly]);

    const paginatedStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredStudents, currentPage]);


    // --- HANDLERS ---
    const handleSelectAll = useCallback((e) => {
        if(e.target.checked) setSelectedIds(paginatedStudents.map(s => s.id));
        else setSelectedIds([]);
    }, [paginatedStudents]);

    const handleSelectOne = useCallback((id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
    }, []);

    const handleEditClick = (student) => {
        setEditingData(student);
        setShowForm(true);
    };

    const handleFormSubmit = (data) => {
        if (editingData) {
            onEdit({ ...data, id: editingData.id });
        } else {
            onAdd(data);
        }
        setShowForm(false);
        setEditingData(null);
    };

    const executeMoveClass = () => {
        if(!targetClass) return alert("Masukkan nama kelas tujuan!");
        if(selectedIds.length === 0) return alert("Pilih minimal satu siswa!");
        if(confirm(`Pindahkan ${selectedIds.length} siswa terpilih ke kelas ${targetClass}?`)) {
            onMoveClass(selectedIds, targetClass);
            setIsMoveMode(false);
            setSelectedIds([]);
            setTargetClass('');
            // Jika kita sedang di mode perbaikan data, matikan modenya setelah selesai
            if(showMissingClassOnly && missingClassCount <= selectedIds.length) {
                setShowMissingClassOnly(false);
            }
        }
    };

    // --- EXCEL LOGIC ---
    const handleExportData = () => {
        if (filteredStudents.length === 0) return alert("Tidak ada data siswa untuk diekspor.");
        const dataToExport = filteredStudents.map(s => ({
            "NISN": s.nisn, "Nama Lengkap": s.name, "Kelas": s.class, 
            "L/P": s.gender, "No HP": s.phone, "Wali": s.parent
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
        XLSX.writeFile(wb, "Data_Siswa_SIBKO.xlsx");
    };

    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); 
                const newStudents = jsonData.map(row => ({
                    nisn: row["NISN"] ? String(row["NISN"]) : '',
                    name: row["Nama Lengkap"],
                    class: row["Kelas"], // Jika Excel kosong, ini akan undefined
                    gender: row["L/P"],
                    parent: row["Wali"],
                    phone: row["No HP"]
                }));
                if (newStudents.length > 0 && confirm(`Import ${newStudents.length} siswa?`)) onImport(newStudents);
            } catch (error) { console.error(error); alert("Gagal membaca file Excel."); }
        };
        reader.readAsBinaryString(file); e.target.value = null; 
    };

    // Toggle Mode Cek Data
    const toggleMissingDataMode = () => {
        if (showMissingClassOnly) {
            setShowMissingClassOnly(false);
            setIsMoveMode(false); 
        } else {
            setShowMissingClassOnly(true);
            setSearchTerm('');
            setFilterClass('');
        }
    };

    // Toggle Enable/Disable Detektor
    const toggleDetector = () => {
        setIsDetectorEnabled(!isDetectorEnabled);
        if (isDetectorEnabled) setShowMissingClassOnly(false); // Matikan mode filter jika didisable
    };

    return (
        <div className="p-4 md:p-6 space-y-6 relative min-h-screen pb-20 animate-in fade-in">
            {/* HEADER TOOLBAR */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4 sticky top-0 z-20">
                <div className="w-full lg:w-auto flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Users className="text-blue-600"/> Data Siswa
                        </h2>
                        {/* TOGGLE DETECTOR BUTTON */}
                        <button 
                            onClick={toggleDetector}
                            className={`p-1.5 rounded-lg transition-colors ${isDetectorEnabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                            title={isDetectorEnabled ? "Nonaktifkan Detektor Data Kosong" : "Aktifkan Detektor Data Kosong"}
                        >
                            <Power size={14} className={isDetectorEnabled ? "drop-shadow-sm" : ""}/>
                        </button>
                    </div>
                    
                    {/* BUTTON SMART DETECTOR (MOBILE) */}
                    {missingClassCount > 0 && isDetectorEnabled && (
                        <button onClick={toggleMissingDataMode} className={`md:hidden p-2 rounded-full ${showMissingClassOnly ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-600 animate-pulse'}`}>
                            <AlertCircle size={20}/>
                        </button>
                    )}

                    {!isMoveMode && (
                        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden bg-slate-100 text-slate-600 p-2 rounded-lg border border-slate-200"><MoreVertical size={20}/></button>
                    )}
                </div>
                
                <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto items-center">
                    {/* --- PANEL PINDAH KELAS --- */}
                    {isMoveMode ? (
                        <div className="flex flex-wrap items-center gap-2 bg-orange-50 p-2 rounded-lg border border-orange-200 w-full md:w-auto animate-in slide-in-from-right">
                            <span className="text-xs font-bold text-orange-700 px-2 whitespace-nowrap">{selectedIds.length} Dipilih</span>
                            <input className="flex-1 text-sm p-2 border rounded-md focus:ring-2 ring-orange-400 outline-none min-w-[120px]" placeholder="Kelas Tujuan (Mis: X-A)..." value={targetClass} onChange={e => setTargetClass(e.target.value.toUpperCase())}/>
                            <button onClick={executeMoveClass} className="bg-orange-600 text-white p-2 rounded-md hover:bg-orange-700 text-xs font-bold px-3">SIMPAN</button>
                            <button onClick={() => {setIsMoveMode(false); setSelectedIds([])}} className="text-slate-500 hover:text-slate-700 p-2"><X size={18}/></button>
                        </div>
                    ) : (
                        <>
                            {/* --- SMART FEATURE: DETEKTOR DATA KOSONG (DESKTOP) --- */}
                            {isDetectorEnabled && (
                                missingClassCount > 0 ? (
                                    <button 
                                        onClick={toggleMissingDataMode}
                                        className={`hidden md:flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all border ${
                                            showMissingClassOnly 
                                            ? 'bg-orange-600 text-white border-orange-600 shadow-md' 
                                            : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                                        }`}
                                        title={showMissingClassOnly ? "Kembali ke semua data" : "Klik untuk melihat data yang perlu diperbaiki"}
                                    >
                                        <AlertCircle size={18} className={!showMissingClassOnly ? "animate-pulse" : ""}/>
                                        {showMissingClassOnly ? "Keluar Mode Perbaikan" : `${missingClassCount} Belum Ada Kelas`}
                                    </button>
                                ) : (
                                    // Indikator Data Aman
                                    <div className="hidden md:flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-green-700 bg-green-50 border border-green-200 cursor-default" title="Semua siswa sudah memiliki kelas">
                                        <CheckCircle size={16}/> Data Kelas Lengkap
                                    </div>
                                )
                            )}

                            {/* DROPDOWN FILTER KELAS */}
                            {!showMissingClassOnly && (
                                <div className="relative w-full md:w-auto">
                                    <select className="w-full md:w-36 pl-3 pr-8 py-2.5 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer font-medium text-slate-600" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                                        <option value="">Semua Kelas</option>
                                        {uniqueClasses.map((cls) => (<option key={cls} value={cls}>{cls}</option>))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16}/>
                                </div>
                            )}

                            {/* SEARCH BAR */}
                            <div className="relative w-full md:w-56">
                                <Search className="text-slate-400 absolute left-3 top-2.5" size={18}/>
                                <input className="w-full pl-10 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors" placeholder="Cari nama, NISN..." value={search} onChange={e=>setSearch(e.target.value)} disabled={showMissingClassOnly}/>
                            </div>
                            
                            {/* TOMBOL AKSI LAINNYA */}
                            <div className="hidden md:flex gap-2">
                                <button onClick={() => setIsMoveMode(true)} className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" title="Pindah Kelas Massal"><ArrowRightLeft size={18}/></button>
                                <button onClick={handleExportData} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"><Download size={18}/></button>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportFile} />
                                <button onClick={() => fileInputRef.current.click()} className="bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"><Upload size={18}/></button>
                                <button onClick={() => { setEditingData(null); setShowForm(!showForm); }} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"><PlusCircle size={18}/> {showForm ? 'Batal' : 'Tambah'}</button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* INFO BANNER SAAT MODE PERBAIKAN */}
            {showMissingClassOnly && isDetectorEnabled && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-full"><AlertCircle size={24}/></div>
                        <div>
                            <h3 className="font-bold text-orange-800">Mode Perbaikan Data</h3>
                            <p className="text-sm text-orange-700">Menampilkan {missingClassCount} siswa yang belum memiliki kelas. Silakan centang siswa dan gunakan tombol "Pindah Kelas" untuk menetapkan kelas mereka.</p>
                        </div>
                    </div>
                    {!isMoveMode && (
                        <button onClick={() => setIsMoveMode(true)} className="w-full md:w-auto px-4 py-2 bg-orange-600 text-white font-bold rounded-lg text-sm hover:bg-orange-700 shadow-sm">
                            Mulai Perbaiki (Pindah Kelas)
                        </button>
                    )}
                </div>
            )}

            {/* MOBILE MENU */}
            {showMobileMenu && !isMoveMode && (
                <div className="md:hidden bg-white p-3 rounded-xl shadow-lg border border-slate-200 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                    <button onClick={() => { setEditingData(null); setShowForm(true); setShowMobileMenu(false); }} className="col-span-2 bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"><PlusCircle size={20}/> Tambah Siswa Baru</button>
                    {missingClassCount > 0 && isDetectorEnabled && (
                        <button onClick={() => { toggleMissingDataMode(); setShowMobileMenu(false); }} className="col-span-2 bg-orange-100 text-orange-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 border border-orange-200"><AlertCircle size={20}/> {showMissingClassOnly ? 'Keluar Mode Perbaikan' : `Perbaiki ${missingClassCount} Data Kosong`}</button>
                    )}
                    <button onClick={() => {setIsMoveMode(true); setShowMobileMenu(false);}} className="flex flex-col items-center gap-1 p-3 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold border border-orange-100"><ArrowRightLeft size={20}/> Pindah Kelas</button>
                    <button onClick={handleExportData} className="flex flex-col items-center gap-1 p-3 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100"><Download size={20}/> Export Data</button>
                    <button onClick={() => fileInputRef.current.click()} className="col-span-2 flex items-center justify-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100"><Upload size={18}/> Import Excel</button>
                </div>
            )}

            {/* FORM AREA */}
            {showForm && (
                <StudentForm 
                    initialData={editingData} 
                    onSubmit={handleFormSubmit} 
                    onCancel={() => { setShowForm(false); setEditingData(null); }}
                    isEditing={!!editingData}
                />
            )}

            {/* LIST AREA */}
            <StudentMobileList 
                students={paginatedStudents} 
                isMoveMode={isMoveMode} 
                selectedIds={selectedIds} 
                onSelectOne={handleSelectOne} 
                onView={setViewDetail} 
                onEdit={handleEditClick} 
                onDelete={onDelete} 
            />

            <StudentTable 
                students={paginatedStudents} 
                isMoveMode={isMoveMode} 
                selectedIds={selectedIds} 
                onSelectAll={handleSelectAll} 
                onSelectOne={handleSelectOne} 
                onView={setViewDetail} 
                onEdit={handleEditClick} 
                onDelete={onDelete} 
            />

            {/* PAGINATION CONTROL */}
            {filteredStudents.length > itemsPerPage && (
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-4">
                    <div className="text-xs text-slate-500 font-medium">
                        Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} siswa
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16}/>
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 3 + i;
                                    if(pageNum > totalPages) return null; 
                                }
                                return (
                                    <button 
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                                            currentPage === pageNum 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16}/>
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL AREA */}
            {viewDetail && (
                <StudentDetailModal 
                    student={viewDetail} 
                    onClose={() => setViewDetail(null)}
                    pointLogs={pointLogs}
                    sanctionRules={sanctionRules}
                    journals={journals}
                />
            )}
        </div>
    );
};

export default StudentManager;