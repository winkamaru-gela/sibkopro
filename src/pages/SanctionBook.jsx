import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Gavel, Search, ChevronDown, Printer, AlertTriangle, 
    ChevronLeft, ChevronRight, Filter, Check, FileText 
} from 'lucide-react';
import SanctionLetterModal from '../components/sanctions/SanctionLetterModal';
import SanctionDetailModal from '../components/sanctions/SanctionDetailModal';

const SanctionBook = ({ students, pointLogs, sanctionRules, settings }) => {
    // --- STATE UI ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterRuleId, setFilterRuleId] = useState(''); 
    
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef(null);

    // Modal State
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); 

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; 

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

            const activeRule = (sanctionRules || [])
                .sort((a,b) => b.max - a.max) 
                .find(rule => netScore >= rule.min && netScore <= rule.max);

            return { ...s, netScore, activeRule };
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

    // Helper Label Filter (Gunakan PENALTY)
    const getSelectedFilterLabel = () => {
        if (!filterRuleId) return "Semua Jenis Sanksi";
        const rule = sanctionRules.find(r => String(r.id) === String(filterRuleId));
        // PERBAIKAN: Gunakan 'penalty' (Kolom Sanksi)
        return rule ? (rule.penalty || rule.action) : "Filter Sanksi";
    };

    // --- HANDLERS ---
    const handleOpenPrint = (student) => {
        setSelectedStudent(student);
        setIsPrintModalOpen(true);
    };

    const handleOpenDetail = (student) => {
        setSelectedStudent(student);
        setIsDetailModalOpen(true);
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
                                                    {/* PERBAIKAN: Tampilkan rule.penalty */}
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

            {/* LIST KARTU SISWA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedData.map(student => (
                    <div key={student.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group relative">
                        <div className={`h-1.5 w-full ${student.netScore >= 100 ? 'bg-red-600' : student.netScore >= 50 ? 'bg-orange-500' : 'bg-yellow-400'}`}></div>

                        <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="overflow-hidden">
                                    <h3 className="font-bold text-slate-800 text-lg line-clamp-1" title={student.name}>{student.name}</h3>
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{student.class}</span>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                    <div className="text-2xl font-black text-red-600">{student.netScore}</div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Total Poin</div>
                                </div>
                            </div>

                            {/* STATUS SANKSI */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 h-[72px] overflow-hidden flex flex-col justify-center">
                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Status Sanksi</div>
                                {student.activeRule ? (
                                    <div className="flex items-start gap-2 text-red-700 font-bold text-sm leading-tight">
                                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0"/>
                                        {/* PERBAIKAN: Gunakan 'penalty' agar tampil SP1, SP2, dst */}
                                        <span className="line-clamp-2">
                                            {student.activeRule.penalty || student.activeRule.action || "Sanksi Tidak Bernama"}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-slate-500 text-sm italic">Belum mencapai batas sanksi</span>
                                )}
                            </div>

                            {/* TOMBOL AKSI */}
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleOpenDetail(student)}
                                    className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                    title="Lihat Tindak Lanjut"
                                >
                                    <FileText size={16}/> Tindak Lanjut
                                </button>
                                <button 
                                    onClick={() => handleOpenPrint(student)}
                                    className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
                                    title="Cetak Surat Panggilan"
                                >
                                    <Printer size={16}/> Cetak
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {paginatedData.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        <Gavel size={48} className="mx-auto mb-3 opacity-20"/>
                        <p>Tidak ada siswa yang sesuai kriteria filter.</p>
                    </div>
                )}
            </div>

            {/* Pagination Control */}
            {filteredData.length > itemsPerPage && (
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-2">
                    <div className="text-xs text-slate-500 font-medium hidden md:block">
                        Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} siswa
                    </div>
                    <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronLeft size={16}/></button>
                        <span className="flex items-center text-xs font-bold bg-slate-50 px-3 rounded-lg md:hidden">Hal {currentPage} / {totalPages}</span>
                        <div className="hidden md:flex items-center gap-1">
                            {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 3 + i;
                                if(pageNum > totalPages) return null;
                                return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${currentPage === pageNum ? 'bg-orange-600 text-white' : 'bg-slate-50 hover:bg-slate-100'}`}>{pageNum}</button>;
                            })}
                        </div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronRight size={16}/></button>
                    </div>
                </div>
            )}

            {/* MODALS */}
            <SanctionLetterModal 
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                student={selectedStudent}
                settings={settings}
                sanctionRule={selectedStudent?.activeRule}
            />
            <SanctionDetailModal 
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                student={selectedStudent}
            />
        </div>
    );
};

export default SanctionBook;