import React, { useState, useMemo, useEffect } from 'react';
import { 
    Trophy, AlertTriangle, Search, AlertOctagon, ChevronRight, ChevronLeft, User 
} from 'lucide-react';
import PointInputModal from '../components/points/PointInputModal';

const PointManager = ({ 
    students, pointLogs, masterPoints, sanctionRules, 
    onAddPoint, onUpdatePoint, onDeletePoint 
}) => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState('violation');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null); 
    const [isModalOpen, setIsModalOpen] = useState(false); 
    
    // --- STATE PAGINATION ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // Grid 3x4 atau 4x3

    // Reset pagination saat pencarian/tab berubah
    useEffect(() => { setCurrentPage(1); }, [searchTerm, activeTab]);

    // --- DATA PROCESSING ---
    const processedStudents = useMemo(() => {
        return students.map(s => {
            const logs = pointLogs.filter(p => p.studentId === s.id);
            const violationTotal = logs.filter(p => p.type === 'violation').reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
            const achievementTotal = logs.filter(p => p.type === 'achievement').reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
            const netScore = violationTotal - achievementTotal;
            const activeSanction = (sanctionRules || []).sort((a,b) => b.max - a.max).find(rule => netScore >= rule.min && netScore <= rule.max);
            
            return { ...s, violationTotal, achievementTotal, netScore, activeSanction };
        });
    }, [students, pointLogs, sanctionRules]);

    const filteredStudents = useMemo(() => {
        return processedStudents.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.class.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => a.name.localeCompare(b.name)); 
    }, [processedStudents, searchTerm]);

    // --- PAGINATION SLICING ---
    const paginatedStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredStudents, currentPage]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    const handleStudentClick = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative animate-in fade-in">
            {/* HEADER */}
            <div className="bg-white px-4 pt-4 pb-0 shadow-sm border-b sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-slate-800">Catatan Poin</h1>
                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        Total Siswa: {filteredStudents.length}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('violation')} className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all flex items-center justify-center gap-2 ${activeTab === 'violation' ? 'border-red-500 text-red-600 bg-red-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <AlertTriangle size={18}/> Catat Pelanggaran
                    </button>
                    <button onClick={() => setActiveTab('achievement')} className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all flex items-center justify-center gap-2 ${activeTab === 'achievement' ? 'border-green-500 text-green-600 bg-green-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <Trophy size={18}/> Catat Prestasi
                    </button>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="p-4 bg-white border-b border-slate-100 sticky top-[108px] z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input type="text" placeholder={activeTab === 'violation' ? "Cari Siswa untuk Pelanggaran..." : "Cari Siswa Berprestasi..."} className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 transition-all ${activeTab === 'violation' ? 'focus:ring-red-200 border-red-100' : 'focus:ring-green-200 border-green-100'}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                </div>
            </div>

            {/* LIST SISWA (GRID VIEW) */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {paginatedStudents.map(student => (
                        <div key={student.id} onClick={() => handleStudentClick(student)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform cursor-pointer flex justify-between items-center relative overflow-hidden hover:border-blue-300">
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${student.netScore >= 50 ? 'bg-red-500' : student.netScore >= 20 ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                            <div className="pl-3 overflow-hidden">
                                <h4 className="font-bold text-slate-800 line-clamp-1">{student.name}</h4>
                                <p className="text-xs text-slate-500">{student.class} | {student.nisn}</p>
                                {student.activeSanction && <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 line-clamp-1"><AlertOctagon size={10}/> {student.activeSanction.action}</span>}
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                                <div className={`text-lg font-black ${activeTab === 'violation' ? 'text-red-600' : 'text-green-600'}`}>{activeTab === 'violation' ? student.violationTotal : student.achievementTotal}</div>
                                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{activeTab === 'violation' ? 'Poin Minus' : 'Poin Plus'}</div>
                            </div>
                            <ChevronRight className="text-slate-300 ml-2" size={18}/>
                        </div>
                    ))}
                    {paginatedStudents.length === 0 && <div className="col-span-full text-center py-10 text-slate-400"><p className="text-sm">Siswa tidak ditemukan.</p></div>}
                </div>

                {/* --- PAGINATION CONTROL (Style Data Siswa) --- */}
                {filteredStudents.length > itemsPerPage && (
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-6">
                        <div className="text-xs text-slate-500 font-medium hidden md:block">
                            Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} siswa
                        </div>
                        <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={16}/></button>
                            <span className="flex items-center text-xs font-bold bg-slate-50 px-3 rounded-lg md:hidden">Hal {currentPage} / {totalPages}</span>
                            <div className="hidden md:flex items-center gap-1">
                                {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                    let pageNum = i + 1;
                                    if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 3 + i;
                                    if(pageNum > totalPages) return null;
                                    return (
                                        <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-slate-50 hover:bg-slate-100'}`}>{pageNum}</button>
                                    );
                                })}
                            </div>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={16}/></button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL INPUT */}
            <PointInputModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                student={selectedStudent}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                masterPoints={masterPoints}
                pointLogs={pointLogs}
                onSubmit={onAddPoint}
                onUpdate={onUpdatePoint}
                onDelete={onDeletePoint}
            />
        </div>
    );
};

export default PointManager;