import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Gavel, Search, ChevronDown, Printer, AlertTriangle, 
    ChevronLeft, ChevronRight, Filter, Check, FileText, History 
} from 'lucide-react';
import SanctionDetailModal from '../components/sanctions/SanctionDetailModal';
import PointHistoryModal from '../components/points/PointHistoryModal';

const SanctionBook = ({ 
    students, pointLogs, sanctionRules, settings, 
    onUpdateStudent // Tambahkan prop ini untuk fitur simpan NIP Wali Kelas
}) => {
    const navigate = useNavigate();

    // --- STATE UI ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterRuleId, setFilterRuleId] = useState(''); 
    
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef(null);

    // Modal State - Detail Sanksi
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); 

    // Modal State - Riwayat Poin (Full Screen)
    const [historyStudent, setHistoryStudent] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterClass, filterRuleId]);

    // Close dropdown outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- DATA PROCESSING ---
    const uniqueClasses = useMemo(() => [...new Set(students.map(s => s.class))].sort(), [students]);

    const sanctionedStudents = useMemo(() => {
        return students.map(s => {
            const logs = pointLogs.filter(p => p.studentId === s.id);
            const vTotal = logs.filter(p => p.type === 'violation').reduce((a, b) => a + parseInt(b.value || 0), 0);
            const aTotal = logs.filter(p => p.type === 'achievement').reduce((a, b) => a + parseInt(b.value || 0), 0);
            const netScore = vTotal - aTotal;
            const violationTotal = vTotal; 
            const achievementTotal = aTotal;

            const activeRule = (sanctionRules || [])
                .sort((a,b) => b.max - a.max) 
                .find(rule => netScore >= rule.min && netScore <= rule.max);

            return { ...s, netScore, violationTotal, achievementTotal, activeRule };
        })
        .filter(s => s.netScore > 0) 
        .sort((a,b) => b.netScore - a.netScore); 
    }, [students, pointLogs, sanctionRules]);

    const filteredData = useMemo(() => {
        return sanctionedStudents.filter(s => {
            const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchClass = filterClass ? s.class === filterClass : true;
            const matchRule = filterRuleId ? (s.activeRule && String(s.activeRule.id) === String(filterRuleId)) : true;
            return matchSearch && matchClass && matchRule;
        });
    }, [sanctionedStudents, searchTerm, filterClass, filterRuleId]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const getSelectedFilterLabel = () => {
        if (!filterRuleId) return "Semua Jenis Sanksi";
        const rule = sanctionRules.find(r => String(r.id) === String(filterRuleId));
        return rule ? (rule.penalty || rule.action) : "Filter Sanksi";
    };

    // --- HANDLERS ---
    const handleProcessLetter = (student) => {
        const sanctionName = student.activeRule?.penalty || student.activeRule?.action || '';
        navigate('/letters', { 
            state: { 
                preSelectedStudentId: student.id,
                suggestedTemplateKeyword: sanctionName
            } 
        });
    };

    const handleOpenDetail = (student) => {
        setSelectedStudent(student);
        setIsDetailModalOpen(true);
    };

    // Handler Buka Modal Riwayat (Full Screen)
    const handleOpenHistory = (student) => {
        setHistoryStudent(student);
        setIsHistoryModalOpen(true);
    };

    // Handler Update Siswa (untuk NIP Wali Kelas dari Modal)
    const handleStudentDataUpdate = (studentId, newData) => {
        if (onUpdateStudent) {
            onUpdateStudent(studentId, newData);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 pb-20 animate-in fade-in">
            {/* HEADER */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sticky top-0 z-30">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Gavel className="text-orange-600"/> Buku Sanksi & Pelanggaran
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Total {filteredData.length} siswa dalam daftar {filterRuleId ? 'kategori terpilih' : 'sanksi'}.
                    </p>
                </div>
                
                {/* TOOLBAR FILTER */}
                <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                    {/* CUSTOM DROPDOWN FILTER SANKSI */}
                    <div className="relative w-full md:w-64" ref={filterDropdownRef}>
                        <div 
                            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                            className={`w-full px-4 py-2.5 border rounded-xl text-sm flex items-center justify-between cursor-pointer transition-all ${isFilterDropdownOpen ? 'ring-2 ring-orange-200 border-orange-400 bg-white' : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-orange-300'}`}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Filter size={16} className={`flex-shrink-0 ${filterRuleId ? 'text-orange-600' : 'text-slate-400'}`}/>
                                <span className={`truncate font-medium ${filterRuleId ? 'text-orange-700' : 'text-slate-600'}`}>{getSelectedFilterLabel()}</span>
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`}/>
                        </div>
                        {isFilterDropdownOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-80">
                                <div onClick={() => { setFilterRuleId(''); setIsFilterDropdownOpen(false); }} className={`p-3 border-b hover:bg-orange-50 cursor-pointer flex justify-between items-center transition-colors ${filterRuleId === '' ? 'bg-orange-50 text-orange-700' : 'text-slate-700'}`}>
                                    <span className="text-sm font-bold">Semua Jenis Sanksi</span>
                                    {filterRuleId === '' && <Check size={16}/>}
                                </div>
                                <div className="overflow-y-auto custom-scrollbar">
                                    {(sanctionRules || []).map(rule => (
                                        <div key={rule.id} onClick={() => { setFilterRuleId(rule.id); setIsFilterDropdownOpen(false); }} className={`p-3 border-b border-slate-50 hover:bg-orange-50 cursor-pointer flex justify-between items-center transition-colors ${String(filterRuleId) === String(rule.id) ? 'bg-orange-50' : ''}`}>
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className={`text-sm font-bold truncate ${String(filterRuleId) === String(rule.id) ? 'text-orange-700' : 'text-slate-700'}`}>
                                                    {rule.penalty || rule.action} 
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-1.5 rounded mt-0.5">Range: {rule.min} - {rule.max} Poin</div>
                                            </div>
                                            {String(filterRuleId) === String(rule.id) && <Check size={16} className="text-orange-600 flex-shrink-0"/>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FILTER KELAS */}
                    <div className="relative w-full md:w-40">
                        <select className="w-full pl-3 pr-8 py-2.5 border rounded-xl text-sm bg-slate-50 hover:bg-white focus:bg-white outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-orange-200 transition-all font-medium text-slate-600" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                            <option value="">Semua Kelas</option>
                            {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16}/>
                    </div>

                    {/* PENCARIAN */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                        <input className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-slate-50 focus:bg-white" placeholder="Cari siswa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                </div>
            </div>

            {/* TABEL DATA SISWA */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">No</th>
                                {/* KOLOM GABUNGAN: NAMA & KELAS */}
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama & Kelas</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Akumulasi Poin</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status Sanksi</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4 text-center text-sm text-slate-500 font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        
                                        {/* NAMA & KELAS GABUNGAN */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{student.name}</div>
                                            <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                    {student.class}
                                                </span>
                                                <span className="text-slate-400">•</span>
                                                <span>NISN: {student.nisn || '-'}</span>
                                            </div>
                                        </td>

                                        {/* POIN INTERAKTIF (Buka Modal Full Screen) */}
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleOpenHistory(student)}
                                                className={`inline-flex items-center justify-center min-w-[40px] h-8 px-2 rounded-lg font-black text-sm shadow-sm transition-transform active:scale-95 hover:scale-110 cursor-pointer border border-transparent hover:border-slate-300 hover:shadow-md ${
                                                    student.netScore >= 100 ? 'bg-red-100 text-red-700' : 
                                                    student.netScore >= 50 ? 'bg-orange-100 text-orange-700' : 
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}
                                                title="Klik untuk lihat riwayat lengkap"
                                            >
                                                {student.netScore}
                                            </button>
                                        </td>

                                        <td className="p-4">
                                            {student.activeRule ? (
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle size={16} className="text-red-600 flex-shrink-0"/>
                                                    <span className="text-sm font-bold text-slate-700 line-clamp-1">
                                                        {student.activeRule.penalty || student.activeRule.action}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Belum mencapai batas</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenDetail(student)}
                                                    className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all text-xs font-bold flex items-center gap-2"
                                                    title="Lihat Detail Tindak Lanjut"
                                                >
                                                    <FileText size={14}/> 
                                                    <span className="hidden sm:inline">Detail</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleProcessLetter(student)}
                                                    className="px-3 py-2 rounded-lg bg-slate-800 text-white hover:bg-orange-600 transition-all text-xs font-bold flex items-center gap-2 shadow-sm"
                                                    title="Proses Surat Sanksi"
                                                >
                                                    <Printer size={14}/> 
                                                    <span className="hidden sm:inline">Surat</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-slate-50 p-4 rounded-full mb-3">
                                                <Gavel size={32} className="opacity-30"/>
                                            </div>
                                            <p className="font-medium">Tidak ada data siswa yang sesuai filter.</p>
                                            <p className="text-xs mt-1 opacity-70">Coba ubah filter kelas atau jenis sanksi.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* FOOTER PAGINATION */}
                {filteredData.length > 0 && (
                    <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-xs text-slate-500 font-medium text-center md:text-left">
                            Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} siswa
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                disabled={currentPage === 1} 
                                className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                            >
                                <ChevronLeft size={16}/>
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                    let pageNum = i + 1;
                                    if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 3 + i;
                                    if(pageNum > totalPages) return null;
                                    return (
                                        <button 
                                            key={pageNum} 
                                            onClick={() => setCurrentPage(pageNum)} 
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                                currentPage === pageNum 
                                                ? 'bg-orange-600 text-white shadow-sm' 
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
                                className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                            >
                                <ChevronRight size={16}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            <SanctionDetailModal 
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                student={selectedStudent}
            />

            {/* MODAL RIWAYAT POIN (FULL SCREEN & SAMA PERSIS DENGAN CATATAN POIN) */}
            <PointHistoryModal 
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                student={historyStudent}
                pointLogs={pointLogs}
                settings={settings}
                sanctionRules={sanctionRules}
                onUpdateStudent={handleStudentDataUpdate} // Passing Fungsi Update NIP
            />
        </div>
    );
};

export default SanctionBook;