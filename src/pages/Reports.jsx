import React, { useState, useMemo } from 'react';
import { 
    Printer, Users, FileCheck, BookOpen, Map, 
    ChevronRight, ChevronDown, Calendar, FileText, 
    LayoutTemplate, Filter, Search 
} from 'lucide-react';
import { formatIndoDate } from '../utils/helpers';

// --- MAIN COMPONENT ---
const Reports = ({ journals, students, settings }) => {
  const [activeTab, setActiveTab] = useState('journal');

  // Definisi Menu Laporan
  const REPORT_TYPES = [
    { id: 'journal', label: 'Jurnal Bulanan', icon: BookOpen, desc: 'Laporan aktivitas harian per bulan' },
    { id: 'classReport', label: 'Laporan Klasikal', icon: Users, desc: 'Rekap khusus bimbingan kelas' },
    { id: 'individual', label: 'Rekam Jejak Siswa', icon: FileText, desc: 'History layanan per individu' },
    { id: 'riskMap', label: 'Peta Kerawanan', icon: Map, desc: 'Sebaran tingkat resiko siswa' },
    { id: 'serviceProof', label: 'Bukti Layanan (LPL)', icon: FileCheck, desc: 'Dokumen fisik per kegiatan' },
  ];

  // Helper untuk render konten
  const renderContent = (typeId) => {
      switch(typeId) {
          case 'journal': return <JournalReportView journals={journals} settings={settings} />;
          case 'classReport': return <ClassReportView journals={journals} settings={settings} />;
          case 'individual': return <IndividualReportView journals={journals} students={students} settings={settings} />;
          case 'riskMap': return <RiskMapReportView students={students} settings={settings} />;
          case 'serviceProof': return <ServiceProofView journals={journals} settings={settings} />;
          default: return null;
      }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* GLOBAL PRINT STYLES */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          .print-hidden { display: none !important; }
          .signature-section { page-break-inside: avoid; }
          table, tr, td, th { page-break-inside: avoid; border-color: black !important; }
          .bg-slate-50 { background-color: white !important; } 
        }
      `}</style>

      {/* HEADER */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm flex-shrink-0 print:hidden">
        <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Printer className="text-blue-600" /> Pusat Laporan & Cetak
            </h1>
            <p className="text-xs text-slate-500 mt-1 hidden md:block">Pilih jenis dokumen, atur filter, dan cetak laporan otomatis.</p>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden max-w-7xl mx-auto w-full gap-6 items-start print:p-0 print:block">
        
        {/* SIDEBAR NAVIGATION (Desktop Only) */}
        <aside className="hidden md:block w-72 flex-shrink-0 print:hidden p-6 pr-0 h-full overflow-y-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-0">
                <div className="p-4 border-b bg-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jenis Dokumen</span>
                </div>
                <nav className="p-2 space-y-1">
                    {REPORT_TYPES.map(tab => (
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
                                <div className="text-[10px] opacity-70">{tab.desc}</div>
                            </div>
                            {activeTab === tab.id && <ChevronRight size={16} className="ml-auto text-blue-400"/>}
                        </button>
                    ))}
                </nav>
            </div>
        </aside>

        {/* MAIN CONTENT AREA (Mobile & Desktop) */}
        <main className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 print:block print:overflow-visible scroll-smooth">
            
            {/* TAMPILAN MOBILE (ACCORDION) */}
            <div className="md:hidden space-y-3 mb-8 print:hidden">
                {REPORT_TYPES.map(tab => (
                    <div key={tab.id} className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${activeTab === tab.id ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'border-slate-200'}`}>
                        <button 
                            onClick={() => setActiveTab(activeTab === tab.id ? '' : tab.id)}
                            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                    <tab.icon size={20} />
                                </div>
                                <div>
                                    <span className="font-bold text-sm block">{tab.label}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">{tab.desc}</span>
                                </div>
                            </div>
                            {activeTab === tab.id ? <ChevronDown size={20}/> : <ChevronRight size={20} className="text-slate-400"/>}
                        </button>
                        
                        {/* KONTEN MOBILE (Untuk Interaksi Layar) */}
                        {activeTab === tab.id && (
                            <div className="p-2 border-t border-blue-100 bg-slate-100/50">
                                {renderContent(tab.id)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* TAMPILAN DESKTOP & PRINT SOURCE (PERBAIKAN UTAMA DISINI) */}
            {/* Class 'print:block' ditambahkan agar konten ini selalu dirender saat mode cetak, meskipun di layar HP (hidden) */}
            <div className="hidden md:block pb-20 print:block">
                {renderContent(activeTab)}
            </div>

        </main>

      </div>
    </div>
  );
};

// --- REUSABLE UI COMPONENTS FOR REPORTS ---

const ReportFilterCard = ({ children, onPrint, title }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 print:hidden">
        <div className="flex flex-col gap-4">
            <div className="w-full">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <Filter size={16} className="text-slate-400"/>
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Filter & Pengaturan {title}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {children}
                </div>
            </div>
            <div className="flex justify-end border-t pt-4">
                <button 
                    onClick={onPrint} 
                    className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 flex-shrink-0"
                >
                    <Printer size={18}/> Cetak Dokumen
                </button>
            </div>
        </div>
    </div>
);

const FilterInput = ({ label, value, onChange, type="text", options=[], placeholder }) => (
    <div className="w-full">
        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">{label}</label>
        {type === 'select' ? (
            <select 
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                value={value} 
                onChange={onChange}
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        ) : (
            <input 
                type={type}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={value} 
                onChange={onChange}
                placeholder={placeholder}
            />
        )}
    </div>
);

// --- REPORT VIEWS ---

function JournalReportView({ journals, settings }) {
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [orientation, setOrientation] = useState('landscape');
  const [semesterFilter, setSemesterFilter] = useState(settings?.semester || 'Ganjil');
  const [yearFilter, setYearFilter] = useState(settings?.academicYear || '2024/2025');
  
  const monthlyJournals = journals.filter(j => {
      const matchMonth = j.date.startsWith(reportMonth);
      if (!matchMonth) return false;
      if (j.semester && j.semester !== semesterFilter) return false;
      if (j.academicYear && j.academicYear !== yearFilter) return false;
      return true;
  }).sort((a,b) => a.date.localeCompare(b.date));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <style>{`@media print { @page { size: ${orientation} auto; margin: 10mm; } }`}</style>

      <ReportFilterCard title="Jurnal" onPrint={() => window.print()}>
          <FilterInput type="month" label="Bulan Laporan" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
          <FilterInput label="Tahun Ajaran" value={yearFilter} onChange={e => setYearFilter(e.target.value)} />
          <FilterInput type="select" label="Semester" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} 
              options={[{value:'Ganjil', label:'Ganjil'}, {value:'Genap', label:'Genap'}]} 
          />
          <FilterInput type="select" label="Orientasi Kertas" value={orientation} onChange={e => setOrientation(e.target.value)} 
              options={[{value:'landscape', label:'Landscape (Mendatar)'}, {value:'portrait', label:'Portrait (Tegak)'}]} 
          />
      </ReportFilterCard>

      <div className={`print-area bg-white p-6 md:p-12 shadow-md border border-slate-200 mx-auto transition-all duration-300 ${
          orientation === 'landscape' ? 'max-w-[297mm] min-h-[210mm]' : 'max-w-[210mm] min-h-[297mm]'
      } print:w-full print:max-w-none print:min-h-0 print:border-none print:shadow-none overflow-x-auto`}>
           <KopSurat settings={settings} />
           <div className="text-center mb-6">
              <h3 className="text-xl font-bold underline uppercase">JURNAL KEGIATAN BIMBINGAN DAN KONSELING</h3>
              <p className="mt-1">Bulan: <span className="font-bold">{new Date(reportMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span> | Semester: {semesterFilter} {yearFilter}</p>
           </div>
           <div className="overflow-x-auto">
               <table className="w-full border-collapse border border-black text-xs md:text-sm min-w-[600px]">
                 <thead>
                   <tr className="bg-gray-100 text-center">
                     <th className="border border-black p-2 w-8">No</th>
                     <th className="border border-black p-2 w-24">Hari/Tanggal</th>
                     <th className="border border-black p-2">Sasaran</th>
                     <th className="border border-black p-2 w-32">Jenis Layanan</th>
                     <th className="border border-black p-2">Uraian Kegiatan / Masalah</th>
                     <th className="border border-black p-2">Hasil / Tindak Lanjut</th>
                   </tr>
                 </thead>
                 <tbody>
                   {monthlyJournals.map((j, idx) => (
                       <tr key={idx}>
                         <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                         <td className="border border-black p-2 align-top">{formatIndoDate(j.date)}</td>
                         <td className="border border-black p-2 align-top">{j.studentNames?.join(', ') || j.studentName}</td>
                         <td className="border border-black p-2 align-top">{j.serviceType}</td>
                         <td className="border border-black p-2 align-top text-justify">
                            {j.description}
                            {j.technique && <div className="mt-1 italic text-slate-600">Teknik: {j.technique}</div>}
                         </td>
                         <td className="border border-black p-2 align-top">
                            <div>{j.resultEval || j.result || '-'}</div>
                            <div className="font-bold mt-1">({j.followUp})</div>
                         </td>
                       </tr>
                   ))}
                   {monthlyJournals.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic border border-black">Belum ada data jurnal pada bulan ini.</td></tr>}
                 </tbody>
               </table>
           </div>
           <SignatureSection settings={settings} dateLabel={`${settings.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
      </div>
    </div>
  );
}

function ClassReportView({ journals, settings }) {
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [orientation, setOrientation] = useState('landscape');
  const [semesterFilter, setSemesterFilter] = useState(settings?.semester || 'Ganjil');
  const [yearFilter, setYearFilter] = useState(settings?.academicYear || '2024/2025');

  const classicalJournals = journals.filter(j => {
      const matchMonth = j.date.startsWith(reportMonth);
      const isClassical = j.serviceType === 'Bimbingan Klasikal';
      if (!matchMonth || !isClassical) return false;
      if (j.semester && j.semester !== semesterFilter) return false;
      if (j.academicYear && j.academicYear !== yearFilter) return false;
      return true;
  }).sort((a,b) => a.date.localeCompare(b.date));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <style>{`@media print { @page { size: ${orientation} auto; margin: 10mm; } }`}</style>

      <ReportFilterCard title="Layanan Klasikal" onPrint={() => window.print()}>
          <FilterInput type="month" label="Bulan Laporan" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
          <FilterInput label="Tahun Ajaran" value={yearFilter} onChange={e => setYearFilter(e.target.value)} />
          <FilterInput type="select" label="Semester" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} 
              options={[{value:'Ganjil', label:'Ganjil'}, {value:'Genap', label:'Genap'}]} 
          />
          <FilterInput type="select" label="Orientasi Kertas" value={orientation} onChange={e => setOrientation(e.target.value)} 
              options={[{value:'landscape', label:'Landscape'}, {value:'portrait', label:'Portrait'}]} 
          />
      </ReportFilterCard>

      <div className={`print-area bg-white p-6 md:p-12 shadow-md border border-slate-200 mx-auto transition-all duration-300 ${
          orientation === 'landscape' ? 'max-w-[297mm] min-h-[210mm]' : 'max-w-[210mm] min-h-[297mm]'
      } print:w-full print:max-w-none print:min-h-0 print:border-none print:shadow-none overflow-x-auto`}>
           <KopSurat settings={settings} />
           <div className="text-center mb-6">
              <h3 className="text-xl font-bold underline uppercase">LAPORAN LAYANAN BIMBINGAN KLASIKAL</h3>
              <p className="mt-1">Bulan: <span className="font-bold">{new Date(reportMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span> | Semester: {semesterFilter} {yearFilter}</p>
           </div>
           <div className="overflow-x-auto">
               <table className="w-full border-collapse border border-black text-xs md:text-sm min-w-[600px]">
                 <thead>
                   <tr className="bg-gray-100 text-center">
                     <th className="border border-black p-2 w-8">No</th>
                     <th className="border border-black p-2 w-24">Hari/Tanggal</th>
                     <th className="border border-black p-2 w-20">Kelas</th>
                     <th className="border border-black p-2">Materi / Topik Layanan</th>
                     <th className="border border-black p-2">Evaluasi (Proses & Hasil)</th>
                     <th className="border border-black p-2 w-32">Tindak Lanjut</th>
                   </tr>
                 </thead>
                 <tbody>
                   {classicalJournals.map((j, idx) => (
                       <tr key={idx}>
                         <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                         <td className="border border-black p-2 align-top text-center">{formatIndoDate(j.date)}<br/><span className="text-[10px]">Jam ke-{j.time}</span></td>
                         <td className="border border-black p-2 align-top text-center font-bold">{j.studentNames?.join(', ') || j.studentName}</td>
                         <td className="border border-black p-2 align-top text-justify">
                            <div className="font-bold mb-1">{j.description}</div>
                            <div className="text-[10px] italic text-slate-600">Bidang: {j.skkpd || '-'}</div>
                         </td>
                         <td className="border border-black p-2 align-top text-justify">
                            <div><strong>Proses:</strong> {j.processEval || '-'}</div>
                            <div className="mt-1"><strong>Hasil:</strong> {j.resultEval || '-'}</div>
                         </td>
                         <td className="border border-black p-2 align-top text-center">{j.followUp}</td>
                       </tr>
                   ))}
                   {classicalJournals.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic border border-black">Belum ada data bimbingan klasikal.</td></tr>}
                 </tbody>
               </table>
           </div>
           <SignatureSection settings={settings} dateLabel={`${settings.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
      </div>
    </div>
  );
}

function IndividualReportView({ journals, students, settings }) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [orientation, setOrientation] = useState('portrait'); 
  
  // --- FILTER BARU ---
  const [searchName, setSearchName] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // 1. Ambil daftar kelas unik
  const uniqueClasses = useMemo(() => [...new Set(students.map(s => s.class))].sort(), [students]);

  // 2. Filter Daftar Siswa di Dropdown berdasarkan Nama & Kelas
  const filteredStudentOptions = useMemo(() => {
    return students
        .filter(s => {
            const matchName = s.name.toLowerCase().includes(searchName.toLowerCase());
            const matchClass = filterClass ? s.class === filterClass : true;
            return matchName && matchClass;
        })
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(s => ({ value: s.id, label: `${s.name} (${s.class})` }));
  }, [students, searchName, filterClass]);

  // 3. Ambil data history jika siswa terpilih
  const studentHistory = useMemo(() => {
    if (!selectedStudentId) return [];
    return journals.filter(j => 
      (j.studentIds && j.studentIds.includes(selectedStudentId)) || 
      (j.studentId && j.studentId === selectedStudentId)
    ).sort((a,b) => a.date.localeCompare(b.date));
  }, [selectedStudentId, journals]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <style>{`@media print { @page { size: ${orientation} auto; margin: 10mm; } }`}</style>

      <ReportFilterCard title="Rekam Jejak" onPrint={() => window.print()}>
          {/* SEARCH NAMA */}
          <FilterInput 
              label="Cari Nama" 
              value={searchName} 
              onChange={e => setSearchName(e.target.value)} 
              placeholder="Ketik nama siswa..." 
          />
          
          {/* FILTER KELAS */}
          <FilterInput 
              type="select" 
              label="Filter Kelas" 
              value={filterClass} 
              onChange={e => setFilterClass(e.target.value)} 
              options={[{value: '', label: 'Semua Kelas'}, ...uniqueClasses.map(c => ({value: c, label: c}))]} 
          />

          {/* SELECTOR SISWA (YANG SUDAH DIFILTER) */}
          <FilterInput 
              type="select" 
              label="Pilih Siswa" 
              value={selectedStudentId} 
              onChange={e => setSelectedStudentId(e.target.value)} 
              options={[{value:'', label:'-- Pilih Siswa --'}, ...filteredStudentOptions]} 
          />
          
          <FilterInput 
              type="select" 
              label="Orientasi Kertas" 
              value={orientation} 
              onChange={e => setOrientation(e.target.value)} 
              options={[{value:'portrait', label:'Portrait'}, {value:'landscape', label:'Landscape'}]} 
          />
      </ReportFilterCard>

      {selectedStudent ? (
        <div className={`print-area bg-white p-6 md:p-12 shadow-md border border-slate-200 mx-auto transition-all duration-300 ${
            orientation === 'landscape' ? 'max-w-[297mm] min-h-[210mm]' : 'max-w-[210mm] min-h-[297mm]'
        } print:w-full print:max-w-none print:min-h-0 print:border-none print:shadow-none overflow-x-auto`}>
           <KopSurat settings={settings} />
           <div className="text-center mb-6">
              <h3 className="text-xl font-bold underline uppercase">Laporan Perkembangan Peserta Didik</h3>
              <p className="text-sm font-bold mt-1">REKAM JEJAK LAYANAN BK</p>
           </div>
           <table className="w-full mb-4 text-sm font-bold">
             <tbody>
               <tr><td className="w-32">Nama Siswa</td><td>: {selectedStudent.name}</td></tr>
               <tr><td>Kelas</td><td>: {selectedStudent.class}</td></tr>
               <tr><td>NISN</td><td>: {selectedStudent.nisn}</td></tr>
             </tbody>
           </table>
           <div className="overflow-x-auto">
               <table className="w-full border-collapse border border-black text-xs md:text-sm min-w-[500px]">
                 <thead>
                   <tr className="bg-gray-100 text-center">
                     <th className="border border-black p-2 w-8">No</th>
                     <th className="border border-black p-2 w-24">Tanggal</th>
                     <th className="border border-black p-2">Jenis Layanan</th>
                     <th className="border border-black p-2">Topik / Masalah</th>
                     <th className="border border-black p-2">Tindak Lanjut / Hasil</th>
                   </tr>
                 </thead>
                 <tbody>
                   {studentHistory.map((j, idx) => (
                       <tr key={idx}>
                         <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                         <td className="border border-black p-2 align-top">{formatIndoDate(j.date)}</td>
                         <td className="border border-black p-2 align-top">{j.serviceType}</td>
                         <td className="border border-black p-2 align-top text-justify">{j.description}</td>
                         <td className="border border-black p-2 align-top">
                            {j.resultEval || j.result || '-'}
                            <div className="font-bold text-[10px] mt-1">({j.followUp})</div>
                         </td>
                       </tr>
                   ))}
                   {studentHistory.length === 0 && <tr><td colSpan="5" className="text-center p-4 border border-black italic">Belum ada riwayat layanan untuk siswa ini.</td></tr>}
                 </tbody>
               </table>
           </div>
           <SignatureSection settings={settings} dateLabel={`${settings.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
        </div>
      ) : (
        <EmptyState message="Silakan cari dan pilih siswa terlebih dahulu untuk melihat rekam jejak." />
      )}
    </div>
  );
}

function RiskMapReportView({ students, settings }) {
  const [orientation, setOrientation] = useState('portrait');
  const sortedStudents = [...students].sort((a,b) => {
      const riskOrder = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      const riskA = riskOrder[a.riskLevel] || 4;
      const riskB = riskOrder[b.riskLevel] || 4;
      if (riskA !== riskB) return riskA - riskB;
      return a.name.localeCompare(b.name);
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <style>{`@media print { @page { size: ${orientation} auto; margin: 10mm; } }`}</style>

      <ReportFilterCard title="Peta Kerawanan" onPrint={() => window.print()}>
          <FilterInput type="select" label="Orientasi Kertas" value={orientation} onChange={e => setOrientation(e.target.value)} 
              options={[{value:'portrait', label:'Portrait'}, {value:'landscape', label:'Landscape'}]} 
          />
      </ReportFilterCard>

      <div className={`print-area bg-white p-6 md:p-12 shadow-md border border-slate-200 mx-auto transition-all duration-300 ${
          orientation === 'landscape' ? 'max-w-[297mm] min-h-[210mm]' : 'max-w-[210mm] min-h-[297mm]'
      } print:w-full print:max-w-none print:min-h-0 print:border-none print:shadow-none overflow-x-auto`}>
           <KopSurat settings={settings} />
           <div className="text-center mb-6">
              <h3 className="text-xl font-bold underline uppercase">PETA KERAWANAN SISWA</h3>
              <p className="mt-1">Tahun Pelajaran: {settings?.academicYear || new Date().getFullYear() + '/' + (new Date().getFullYear()+1)}</p>
           </div>
           <div className="overflow-x-auto">
               <table className="w-full border-collapse border border-black text-xs md:text-sm min-w-[500px]">
                 <thead>
                   <tr className="bg-gray-100 text-center">
                     <th className="border border-black p-2 w-8">No</th>
                     <th className="border border-black p-2">Nama Siswa</th>
                     <th className="border border-black p-2 w-20">Kelas</th>
                     <th className="border border-black p-2 w-32">Tingkat Kerawanan</th>
                     <th className="border border-black p-2">Keterangan / Wali</th>
                   </tr>
                 </thead>
                 <tbody>
                   {sortedStudents.map((s, idx) => (
                       <tr key={s.id}>
                         <td className="border border-black p-2 text-center">{idx + 1}</td>
                         <td className="border border-black p-2 font-bold">{s.name}</td>
                         <td className="border border-black p-2 text-center">{s.class}</td>
                         <td className="border border-black p-2 text-center font-bold">
                            {s.riskLevel === 'HIGH' ? 'TINGGI' : s.riskLevel === 'MEDIUM' ? 'SEDANG' : 'RENDAH'}
                         </td>
                         <td className="border border-black p-2">
                            {s.parent} {s.parentPhone ? `(${s.parentPhone})` : ''}
                         </td>
                       </tr>
                   ))}
                   {sortedStudents.length === 0 && <tr><td colSpan="5" className="text-center p-4 border border-black italic">Belum ada data siswa.</td></tr>}
                 </tbody>
               </table>
           </div>
           <SignatureSection settings={settings} dateLabel={`${settings.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
      </div>
    </div>
  );
}

function ServiceProofView({ journals, settings }) {
  const [selectedJournalId, setSelectedJournalId] = useState('');
  const [orientation, setOrientation] = useState('portrait'); 
  
  const sortedJournals = [...journals].sort((a,b) => b.date.localeCompare(a.date));
  const selectedJournal = journals.find(j => j.id === selectedJournalId);
  const journalOptions = useMemo(() => sortedJournals.map(j => ({value: j.id, label: `${j.date} - ${j.serviceType} (${j.studentName || 'Siswa'})`})), [journals]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <style>{`@media print { @page { size: ${orientation} auto; margin: 10mm; } }`}</style>

      <ReportFilterCard title="Bukti Fisik (LPL)" onPrint={() => window.print()}>
          <FilterInput type="select" label="Pilih Kegiatan Layanan" value={selectedJournalId} onChange={e => setSelectedJournalId(e.target.value)} 
              options={[{value:'', label:'-- Pilih Kegiatan --'}, ...journalOptions]} 
          />
          <FilterInput type="select" label="Orientasi Kertas" value={orientation} onChange={e => setOrientation(e.target.value)} 
              options={[{value:'portrait', label:'Portrait'}, {value:'landscape', label:'Landscape'}]} 
          />
      </ReportFilterCard>

      {selectedJournal ? (
        <div className={`print-area bg-white p-6 md:p-12 shadow-md border border-slate-200 mx-auto transition-all duration-300 ${
            orientation === 'landscape' ? 'max-w-[297mm] min-h-[210mm]' : 'max-w-[210mm] min-h-[297mm]'
        } print:w-full print:max-w-none print:min-h-0 print:border-none print:shadow-none`}>
           <KopSurat settings={settings} />
           <div className="text-center mb-8"><h3 className="text-xl font-bold underline uppercase">LAPORAN PELAKSANAAN LAYANAN (LPL)</h3><p className="font-bold">BIMBINGAN DAN KONSELING</p><p className="mt-1 font-bold">Semester: {selectedJournal.semester || '-'} Tahun Ajaran: {selectedJournal.academicYear || '-'}</p></div>
           <div className="space-y-4 text-sm leading-relaxed">
             <div className="grid grid-cols-[200px_10px_1fr] gap-1">
                <div className="font-bold">1. Jenis Layanan</div><div>:</div><div>{selectedJournal.serviceType}</div>
                <div className="font-bold">2. Bidang Bimbingan</div><div>:</div><div>{selectedJournal.skkpd || '-'}</div>
                <div className="font-bold">3. Topik / Masalah</div><div>:</div><div>{selectedJournal.description}</div>
                <div className="font-bold">4. Sasaran / Konseli</div><div>:</div><div>{selectedJournal.studentNames?.join(', ') || selectedJournal.studentName}</div>
                <div className="font-bold">5. Hari / Tanggal</div><div>:</div><div>{formatIndoDate(selectedJournal.date)}</div>
                <div className="font-bold">6. Waktu / Tempat</div><div>:</div><div>{selectedJournal.time || '-'} / {selectedJournal.place || '-'}</div>
                <div className="font-bold">7. Teknik Konseling</div><div>:</div><div>{selectedJournal.technique || '-'}</div>
             </div>
             <div className="mt-6">
                <div className="font-bold mb-2">8. Hasil / Evaluasi:</div>
                <div className="border border-black p-4 min-h-[100px] text-justify">
                    <p className="mb-2"><span className="font-bold">Proses:</span> {selectedJournal.processEval || '-'}</p>
                    <p><span className="font-bold">Hasil:</span> {selectedJournal.resultEval || selectedJournal.result || '-'}</p>
                </div>
             </div>
             <div className="mt-4">
                <div className="font-bold mb-2">9. Tindak Lanjut:</div>
                <div className="border border-black p-4">{selectedJournal.followUp}</div>
             </div>
           </div>
           <SignatureSection settings={settings} dateLabel={`${settings.city || '...'}, ${formatIndoDate(selectedJournal.date)}`} />
        </div>
      ) : (
        <EmptyState message="Pilih salah satu kegiatan layanan untuk mencetak bukti fisik." />
      )}
    </div>
  );
}

// --- SUB COMPONENTS (Helpers) ---

const EmptyState = ({ message }) => (
    <div className="text-center p-12 bg-white border border-dashed border-slate-300 rounded-xl text-slate-400 print:hidden shadow-sm">
        <LayoutTemplate size={48} className="mx-auto mb-3 opacity-30 text-blue-500"/>
        <p className="text-sm font-medium">{message}</p>
    </div>
);

const KopSurat = ({ settings }) => (
    <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-6">
        <div className="w-24 h-24 flex items-center justify-center">
            {settings?.logo && <img src={settings.logo} className="w-full h-full object-contain" alt="Logo" />}
        </div>
        <div className="flex-1 text-center px-4">
            {settings?.government && <h3 className="text-lg font-medium uppercase tracking-wide leading-tight">{settings.government}</h3>}
            <h2 className="text-2xl font-extrabold uppercase my-1">{settings?.name || 'Nama Sekolah'}</h2>
            <p className="text-sm italic">{settings?.address || 'Alamat Sekolah'}</p>
        </div>
        <div className="w-24 h-24 flex items-center justify-center">
            {settings?.logo2 && <img src={settings.logo2} className="w-full h-full object-contain" alt="Logo 2" />}
        </div> 
    </div>
);

const SignatureSection = ({ settings, dateLabel }) => (
    <div className="grid grid-cols-2 gap-10 mt-12 text-center break-inside-avoid signature-section text-sm font-serif">
      <div>
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <br/><br/><br/><br/>
          <p className="font-bold underline">{settings?.headmaster || '......................'}</p>
          <p>NIP. {settings?.nipHeadmaster || '......................'}</p>
      </div>
      <div>
          <p>{dateLabel}</p> 
          <p>Guru BK / Konselor</p>
          <br/><br/><br/><br/>
          <p className="font-bold underline">{settings?.counselor || '......................'}</p>
          <p>NIP. {settings?.nipCounselor || '......................'}</p>
      </div>
   </div>
);

export default Reports;