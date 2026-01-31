import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Trophy, AlertTriangle, Search, PlusCircle, 
    ChevronRight, AlertOctagon, Calendar, Check, ChevronDown, X
} from 'lucide-react';

const PointManager = ({ students, pointLogs, masterPoints, sanctionRules, onAddPoint, onDeletePoint }) => {
    // State Tab
    const [activeTab, setActiveTab] = useState('violation');
    
    // State UI Utama
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null); 
    const [isInputModalOpen, setIsInputModalOpen] = useState(false); 
    
    // State untuk Custom Dropdown dengan Search
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownSearch, setDropdownSearch] = useState(''); // State pencarian dalam dropdown
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null); // Ref untuk auto-focus input search

    // State Form Input
    const [formData, setFormData] = useState({
        code: '', 
        value: 5,
        description: '',
        date: new Date().toISOString().slice(0, 10)
    });

    // Reset saat ganti tab
    useEffect(() => {
        setSearchTerm('');
        setSelectedStudent(null);
        setIsInputModalOpen(false);
        setIsDropdownOpen(false);
        setDropdownSearch('');
    }, [activeTab]);

    // Auto-focus ke input search saat dropdown dibuka
    useEffect(() => {
        if (isDropdownOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current.focus();
            }, 100);
        } else {
            setDropdownSearch(''); // Reset search saat ditutup
        }
    }, [isDropdownOpen]);

    // Tutup dropdown jika klik di luar
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 1. Kalkulasi Poin Siswa
    const studentPoints = useMemo(() => {
        return students.map(s => {
            const logs = pointLogs.filter(p => p.studentId === s.id);
            const violationTotal = logs
                .filter(p => p.type === 'violation')
                .reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
            
            const achievementTotal = logs
                .filter(p => p.type === 'achievement')
                .reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);

            const netScore = violationTotal - achievementTotal;

            const activeSanction = (sanctionRules || [])
                .sort((a,b) => b.max - a.max) 
                .find(rule => netScore >= rule.min && netScore <= rule.max);

            return {
                ...s,
                violationTotal,
                achievementTotal,
                netScore,
                activeSanction,
                logs: logs.sort((a,b) => new Date(b.date) - new Date(a.date))
            };
        });
    }, [students, pointLogs, sanctionRules]);

    // 2. Filter Siswa
    const filteredStudents = useMemo(() => {
        return studentPoints.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.class.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => a.name.localeCompare(b.name)); 
    }, [studentPoints, searchTerm]);

    // 3. Filter Master Data (Dropdown Options) + Fitur Cari di Dropdown
    const availableOptions = useMemo(() => {
        return (masterPoints || []).filter(item => item.type === activeTab);
    }, [masterPoints, activeTab]);

    const filteredOptions = useMemo(() => {
        if (!dropdownSearch) return availableOptions;
        const lowerSearch = dropdownSearch.toLowerCase();
        return availableOptions.filter(item => 
            item.code.toLowerCase().includes(lowerSearch) || 
            item.label.toLowerCase().includes(lowerSearch)
        );
    }, [availableOptions, dropdownSearch]);

    // --- HANDLERS ---

    const handleStudentClick = (student) => {
        setSelectedStudent(student);
        setIsInputModalOpen(true);
        setFormData({
            code: '',
            value: 5,
            description: '',
            date: new Date().toISOString().slice(0, 10)
        });
    };

    const handleSelectOption = (item) => {
        setFormData(prev => ({
            ...prev,
            code: String(item.code),
            description: item.label,
            value: item.point
        }));
        setIsDropdownOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedStudent) return;
        
        onAddPoint({
            type: activeTab,
            value: formData.value,
            description: formData.description,
            studentId: selectedStudent.id,
            studentName: selectedStudent.name,
            class: selectedStudent.class,
            date: formData.date 
        });
        
        setIsInputModalOpen(false);
        alert(`${activeTab === 'violation' ? 'Pelanggaran' : 'Prestasi'} berhasil dicatat!`);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            
            {/* HEADER TAB NAVIGASI */}
            <div className="bg-white px-4 pt-4 pb-0 shadow-sm border-b sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-slate-800">Catatan Poin</h1>
                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        Total Siswa: {filteredStudents.length}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('violation')}
                        className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'violation' 
                            ? 'border-red-500 text-red-600 bg-red-50/50' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <AlertTriangle size={18}/> Catat Pelanggaran
                    </button>
                    <button 
                        onClick={() => setActiveTab('achievement')}
                        className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'achievement' 
                            ? 'border-green-500 text-green-600 bg-green-50/50' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Trophy size={18}/> Catat Prestasi
                    </button>
                </div>
            </div>

            {/* SEARCH BAR SISWA */}
            <div className="p-4 bg-white border-b border-slate-100 sticky top-[108px] md:top-[115px] z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder={activeTab === 'violation' ? "Cari Siswa untuk Pelanggaran..." : "Cari Siswa Berprestasi..."}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 transition-all ${
                            activeTab === 'violation' ? 'focus:ring-red-200 border-red-100' : 'focus:ring-green-200 border-green-100'
                        }`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* LIST SISWA */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredStudents.map(student => (
                        <div 
                            key={student.id}
                            onClick={() => handleStudentClick(student)}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform cursor-pointer flex justify-between items-center relative overflow-hidden"
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                student.netScore >= 50 ? 'bg-red-500' : 
                                student.netScore >= 20 ? 'bg-orange-400' : 'bg-blue-400'
                            }`}></div>

                            <div className="pl-3">
                                <h4 className="font-bold text-slate-800">{student.name}</h4>
                                <p className="text-xs text-slate-500">{student.class} | {student.nisn}</p>
                                {student.activeSanction && (
                                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">
                                        <AlertOctagon size={10}/> {student.activeSanction.action}
                                    </span>
                                )}
                            </div>

                            <div className="text-right">
                                <div className={`text-lg font-black ${
                                    activeTab === 'violation' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {activeTab === 'violation' ? student.violationTotal : student.achievementTotal}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                    {activeTab === 'violation' ? 'Poin Minus' : 'Poin Plus'}
                                </div>
                            </div>
                            
                            <ChevronRight className="text-slate-300 ml-2" size={18}/>
                        </div>
                    ))}

                    {filteredStudents.length === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-400">
                            <p className="text-sm">Siswa tidak ditemukan.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL INPUT DENGAN SEARCHABLE DROPDOWN --- */}
            {isInputModalOpen && selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full md:w-[500px] md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
                        
                        {/* Modal Header */}
                        <div className={`p-4 border-b flex justify-between items-center ${
                            activeTab === 'violation' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                        } rounded-t-2xl flex-shrink-0`}>
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    {activeTab === 'violation' ? <AlertTriangle size={20}/> : <Trophy size={20}/>}
                                    {activeTab === 'violation' ? 'Catat Pelanggaran' : 'Catat Prestasi'}
                                </h3>
                                <p className="text-xs opacity-80">{selectedStudent.name} - {selectedStudent.class}</p>
                            </div>
                            <button onClick={() => setIsInputModalOpen(false)} className="p-2 bg-white/50 rounded-full hover:bg-white/80 transition-colors">
                                <X size={20}/>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-5">
                            
                            {/* === SEARCHABLE CUSTOM DROPDOWN === */}
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    Pilih Jenis {activeTab === 'violation' ? 'Pelanggaran' : 'Prestasi'}
                                </label>
                                
                                {/* Trigger Button */}
                                <div 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`w-full p-4 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${
                                        isDropdownOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-300'
                                    } ${
                                        activeTab === 'violation' ? 'bg-red-50/30' : 'bg-green-50/30'
                                    }`}
                                >
                                    <span className={`text-sm font-medium ${!formData.code ? 'text-slate-400' : 'text-slate-800'} whitespace-normal break-words line-clamp-2 text-left flex-1 mr-2`}>
                                        {formData.description || "-- Ketuk untuk memilih --"}
                                    </span>
                                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}/>
                                </div>

                                {/* Dropdown Menu Content */}
                                {isDropdownOpen && (
                                    <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 origin-top flex flex-col max-h-72">
                                        
                                        {/* INPUT PENCARIAN DI DALAM DROPDOWN */}
                                        <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                                                <input 
                                                    ref={searchInputRef}
                                                    type="text" 
                                                    placeholder="Cari kode atau nama..." 
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                                                    value={dropdownSearch}
                                                    onChange={(e) => setDropdownSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* DAFTAR OPSI (Scrollable) */}
                                        <div className="overflow-y-auto flex-1">
                                            {filteredOptions.length > 0 ? (
                                                filteredOptions.map(opt => (
                                                    <div 
                                                        key={opt.id}
                                                        onClick={() => handleSelectOption(opt)}
                                                        className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex justify-between items-start gap-3 transition-colors ${
                                                            formData.code === String(opt.code) ? 'bg-blue-50' : ''
                                                        }`}
                                                    >
                                                        <div className="flex-1">
                                                            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Kode: {opt.code}</span>
                                                            <p className="text-sm text-slate-700 leading-snug whitespace-normal break-words">
                                                                {opt.label}
                                                            </p>
                                                        </div>
                                                        <div className={`font-bold text-sm whitespace-nowrap px-2 py-1 rounded ${
                                                            activeTab === 'violation' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'
                                                        }`}>
                                                            {opt.point} Poin
                                                        </div>
                                                        {formData.code === String(opt.code) && <Check size={16} className="text-blue-500 mt-1"/>}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-6 text-center text-slate-400 text-sm italic">
                                                    Tidak ditemukan "{dropdownSearch}".
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Detail Input Lainnya */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Poin</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 border border-slate-300 rounded-lg font-bold text-center outline-none focus:border-blue-500"
                                        value={formData.value}
                                        onChange={e => setFormData({...formData, value: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tanggal</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-400" size={16}/>
                                        <input 
                                            type="date"
                                            className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm"
                                            value={formData.date}
                                            onChange={e => setFormData({...formData, date: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keterangan Tambahan</label>
                                <textarea 
                                    className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm h-24 resize-none"
                                    placeholder={`Detail tambahan untuk ${activeTab === 'violation' ? 'pelanggaran' : 'prestasi'} ini...`}
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>

                            {/* History Singkat */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="font-bold text-slate-500">Riwayat Terakhir</span>
                                    <span className="text-slate-400">Total Poin Saat Ini: <b className="text-slate-800">{selectedStudent.netScore}</b></span>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {selectedStudent.logs.slice(0, 3).map(log => (
                                        <div key={log.id} className="text-xs flex justify-between border-b border-slate-100 pb-1 last:border-0">
                                            <span className="truncate flex-1 pr-2 text-slate-600">{log.description}</span>
                                            <span className={`font-bold ${log.type === 'violation' ? 'text-red-500' : 'text-green-500'}`}>
                                                {log.value}
                                            </span>
                                        </div>
                                    ))}
                                    {selectedStudent.logs.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada data.</p>}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t bg-slate-50 rounded-b-2xl">
                            <button 
                                onClick={handleSubmit}
                                className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                                    activeTab === 'violation' 
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                                    : 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                }`}
                            >
                                <PlusCircle size={20}/> 
                                Simpan {activeTab === 'violation' ? 'Pelanggaran' : 'Prestasi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PointManager;