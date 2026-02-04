import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
    BookOpen, X, AlertOctagon, CheckCircle, Gavel, Activity, UserCheck, 
    ChevronUp, ChevronDown, GripVertical, User, Calendar, Phone 
} from 'lucide-react';
import { formatIndoDate } from '../../utils/helpers';

const StudentDetailModal = ({ student, onClose, pointLogs = [], sanctionRules = [], journals = [] }) => {
    // --- STATE RESIZING (Sama seperti Modal Poin) ---
    const [drawerWidth, setDrawerWidth] = useState(600); // Default lebih lebar untuk detail siswa
    const isResizingRef = useRef(false);
    const [expandBio, setExpandBio] = useState(true); // Default Expanded agar informatif

    // --- LOGIC RESIZING ---
    const startResizing = useCallback((e) => {
        isResizingRef.current = true;
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'ew-resize';
        e.preventDefault();
    }, []);

    const stopResizing = useCallback(() => {
        isResizingRef.current = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
    }, []);

    const resize = useCallback((e) => {
        if (!isResizingRef.current) return;
        const newWidth = window.innerWidth - e.clientX;
        // Limit lebar: Min 400px, Max 95% layar
        if (newWidth > 400 && newWidth < window.innerWidth * 0.95) {
            setDrawerWidth(newWidth);
        }
    }, []);

    // --- DATA CALCULATION ---
    const { netScore, activeSanction, logs, violationTotal, achievementTotal } = useMemo(() => {
        if (!student) return { netScore: 0, activeSanction: null, logs: [], violationTotal: 0, achievementTotal: 0 };
        
        const sLogs = pointLogs.filter(p => p.studentId === student.id);
        const vTotal = sLogs.filter(p => p.type === 'violation').reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
        const aTotal = sLogs.filter(p => p.type === 'achievement').reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
        const score = vTotal - aTotal;
        const sanction = (sanctionRules || []).sort((a,b) => b.max - a.max).find(rule => score >= rule.min && score <= rule.max);
        
        return { 
            netScore: score, 
            activeSanction: sanction, 
            logs: sLogs.sort((a,b) => new Date(b.date) - new Date(a.date)),
            violationTotal: vTotal,
            achievementTotal: aTotal
        };
    }, [student, pointLogs, sanctionRules]);

    const studentJournals = useMemo(() => {
        if (!student) return [];
        return journals
            .filter(j => j.studentId === student.id || (j.studentIds && j.studentIds.includes(student.id)))
            .sort((a,b) => b.createdAt - a.createdAt); // Terbaru diatas
    }, [student, journals]);


    if (!student) return null;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* BACKDROP */}
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* SIDE DRAWER RESIZABLE */}
            <div 
                className="relative h-full bg-white shadow-2xl flex animate-in slide-in-from-right duration-300"
                style={{ width: `${drawerWidth}px` }}
            >
                {/* --- HANDLE GESER --- */}
                <div 
                    onMouseDown={startResizing}
                    className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 hover:bg-blue-400 cursor-ew-resize z-10 transition-colors flex items-center justify-center group"
                    title="Geser untuk mengubah lebar panel"
                >
                    <GripVertical size={12} className="text-slate-400 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"/>
                </div>

                {/* KONTEN DRAWER */}
                <div className="flex-1 flex flex-col h-full border-l border-slate-200 bg-slate-50/50">
                    
                    {/* HEADER */}
                    <div className="p-6 border-b flex justify-between items-start bg-white border-blue-100 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 shadow-sm">
                                <BookOpen size={24}/>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Buku Pribadi Siswa</h2>
                                <p className="text-sm text-slate-500 font-medium">Rekam jejak, biodata, dan prestasi</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <X size={24}/>
                        </button>
                    </div>

                    {/* BODY (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        
                        {/* KARTU PROFIL UTAMA */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 flex flex-col items-center border-b border-slate-100 relative">
                                {/* Badge Status di Pojok */}
                                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${activeSanction ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                    {activeSanction ? 'Perlu Perhatian' : 'Siswa Baik'}
                                </div>

                                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-3xl font-bold text-slate-400 mb-4 shadow-inner ring-4 ring-white">
                                    {student.name.charAt(0)}
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 text-center">{student.name}</h2>
                                <p className="text-slate-500 font-medium mt-1">{student.class} • NISN: {student.nisn || '-'}</p>
                                
                                {/* SCORE BOARD */}
                                <div className="grid grid-cols-3 gap-2 w-full mt-6">
                                    <div className="text-center p-3 bg-red-50 rounded-xl border border-red-100">
                                        <div className="text-xl font-black text-red-600">{violationTotal}</div>
                                        <div className="text-[10px] font-bold text-red-400 uppercase">Pelanggaran</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-xl border border-green-100">
                                        <div className="text-xl font-black text-green-600">{achievementTotal}</div>
                                        <div className="text-[10px] font-bold text-green-400 uppercase">Prestasi</div>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100 relative overflow-hidden">
                                        <div className={`text-xl font-black z-10 relative ${netScore > 0 ? 'text-red-600' : 'text-blue-600'}`}>{netScore}</div>
                                        <div className="text-[10px] font-bold text-blue-400 uppercase z-10 relative">Net Poin</div>
                                    </div>
                                </div>
                            </div>

                            {/* ACCORDION BIODATA */}
                            <div className="bg-slate-50/50">
                                <button onClick={() => setExpandBio(!expandBio)} className="w-full flex justify-between items-center p-4 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                    <span className="flex items-center gap-2"><User size={16}/> Detail Biodata & Kontak</span>
                                    {expandBio ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                </button>
                                
                                {expandBio && (
                                    <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm animate-in slide-in-from-top-2">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Jenis Kelamin</label>
                                            <p className="font-medium text-slate-700">{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Nama Wali</label>
                                            <p className="font-medium text-slate-700">{student.parent || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Kontak Siswa</label>
                                            <p className="font-medium text-slate-700 flex items-center gap-2">
                                                <Phone size={14} className="text-slate-400"/> {student.phone || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Kontak Wali</label>
                                            <p className="font-medium text-slate-700 flex items-center gap-2">
                                                <Phone size={14} className="text-slate-400"/> {student.parentPhone || '-'}
                                            </p>
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Alamat</label>
                                            <p className="font-medium text-slate-700">{student.address || '-'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* STATUS SANKSI */}
                        {activeSanction && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-4 items-start shadow-sm">
                                <div className="p-2 bg-white rounded-full text-red-600 shadow-sm"><AlertOctagon size={24}/></div>
                                <div>
                                    <h4 className="font-bold text-red-800 text-lg">Status Sanksi: {activeSanction.penalty || activeSanction.action}</h4>
                                    <p className="text-red-600 text-sm mt-1 leading-snug">{activeSanction.action}</p>
                                </div>
                            </div>
                        )}

                        {/* TAB HISTORY */}
                        <div className="space-y-6">
                            {/* History Poin */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Gavel size={18}/> Riwayat Pelanggaran & Prestasi</h3>
                                {logs.length > 0 ? (
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        {logs.map((log, idx) => (
                                            <div key={log.id} className={`p-4 flex gap-3 ${idx !== logs.length-1 ? 'border-b border-slate-100' : ''}`}>
                                                <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${log.type === 'violation' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${log.type === 'violation' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                            {log.type === 'violation' ? 'Pelanggaran' : 'Prestasi'}
                                                        </span>
                                                        <span className="text-xs text-slate-400">{log.date}</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-800 mt-1">{log.description}</p>
                                                    <div className="mt-1 text-xs text-slate-500 font-mono">Kode: {log.code} • Nilai: <b>{log.value}</b></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-sm">Belum ada data poin.</div>
                                )}
                            </div>

                            {/* History Jurnal */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Activity size={18}/> Catatan Jurnal & Konseling</h3>
                                {studentJournals.length > 0 ? (
                                    <div className="space-y-3">
                                        {studentJournals.map(journal => (
                                            <div key={journal.id} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm hover:border-blue-300 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-slate-400"/>
                                                        <span className="text-xs font-bold text-slate-500">{journal.date ? formatIndoDate(journal.date) : 'Tanggal -'}</span>
                                                    </div>
                                                    <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded uppercase tracking-wide">Jurnal</span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-sm">{journal.title || 'Catatan Harian'}</h4>
                                                <p className="text-sm text-slate-600 mt-1 line-clamp-3">{journal.notes || journal.content}</p>
                                                {journal.followUp && (
                                                    <div className="mt-3 pt-3 border-t border-slate-50 flex gap-2 items-start">
                                                        <UserCheck size={14} className="text-green-600 mt-0.5"/>
                                                        <p className="text-xs text-green-700 font-medium italic">{journal.followUp}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-sm">Belum ada catatan jurnal.</div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* FOOTER */}
                    <div className="p-4 border-t bg-white flex justify-end">
                        <button onClick={onClose} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
                            Tutup Panel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDetailModal;