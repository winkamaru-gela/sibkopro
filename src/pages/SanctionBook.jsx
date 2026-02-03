import React, { useState, useMemo, useEffect } from 'react';
import { Gavel, Printer, Search, FileText, X, AlertTriangle, Settings, Edit3, ListOrdered, Calendar, UserCheck, User } from 'lucide-react';
import { formatIndoDate } from '../utils/helpers';

export default function SanctionBook({ students, pointLogs, sanctionRules, settings }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- STATE MODAL & SURAT ---
  const [showModal, setShowModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  
  // Opsi Surat
  const [letterType, setLetterType] = useState('call'); 
  const [letterNumber, setLetterNumber] = useState('');
  
  // Opsi Tanda Tangan
  const [signatories, setSignatories] = useState({
      homeroom: true,   
      counselor: true,  
      studentAffairs: false, 
      principal: false  
  });

  // Data NIP Wali Kelas (Manual Override)
  const [homeroomNip, setHomeroomNip] = useState('');

  // Data Jadwal & Lokasi 
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('09.00 WITA');
  const [meetPlace, setMeetPlace] = useState(''); 
  const [meetPurpose, setMeetPurpose] = useState('Pembinaan & Konsultasi Siswa'); 

  // --- STATE TEKS EDITABLE ---
  const [customBody, setCustomBody] = useState('');
  const [customClosing, setCustomClosing] = useState('');

  // State Poin Janji
  const [promisePoints, setPromisePoints] = useState([
      "Mentaati segala Tata Tertib Sekolah yang berlaku.",
      "Tidak akan mengulangi kesalahan/pelanggaran yang sama maupun pelanggaran lainnya.",
      "Bersedia menerima sanksi yang lebih berat apabila melanggar janji ini (Skorsing / Dikembalikan ke Orang Tua)."
  ]);

  // --- LOGIKA UTAMA: MENGHITUNG SISWA SANKSI ---
  const sanctionedStudents = useMemo(() => {
    if (!students || !pointLogs || !sanctionRules) return [];
    let results = [];
    const sortedRules = [...sanctionRules].sort((a,b) => a.min - b.min);

    students.forEach(student => {
        const logs = pointLogs.filter(p => p.studentId === student.id);
        const violationTotal = logs.filter(p => p.type === 'violation').reduce((acc, curr) => acc + (parseInt(curr.value) || 0), 0);
        const achievementTotal = logs.filter(p => p.type === 'achievement').reduce((acc, curr) => acc + (parseInt(curr.value) || 0), 0);
        const netScore = violationTotal - achievementTotal;
        const activeSanction = sortedRules.find(r => netScore >= parseInt(r.min) && netScore <= parseInt(r.max));

        if (activeSanction && violationTotal > 0) {
            results.push({
                student, netScore, violationTotal, achievementTotal, activeSanction,
            });
        }
    });
    return results.sort((a,b) => b.netScore - a.netScore);
  }, [students, pointLogs, sanctionRules]);

  const filteredData = sanctionedStudents.filter(item => 
    item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- GENERATE TEXT ---
  const handleOpenPrint = (data) => {
    setSelectedData(data);
    setLetterType('call');
    
    // Auto Generate Nomor
    const today = new Date();
    const monthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][today.getMonth()];
    setLetterNumber(`421.5/..../BK-SMK/${monthRoman}/${today.getFullYear()}`);
    
    // Set Default NIP Wali Kelas
    setHomeroomNip(data.student.homeroomTeacherNip || '');

    setMeetDate(new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    setMeetPlace(`Ruang BK ${settings?.name || 'Sekolah'}`); 
    setMeetPurpose('Pembinaan & Konsultasi Siswa'); 
    
    setCustomBody(`Sehubungan dengan hal tersebut, kami mengharap kehadiran Bapak/Ibu/Wali murid ke sekolah untuk berkonsultasi dan menindaklanjuti permasalahan ini pada:`);
    setCustomClosing(`Mengingat pentingnya hal tersebut bagi keberlangsungan pendidikan putra/putri Bapak/Ibu, kami sangat mengharapkan kehadirannya tepat waktu.\n\nAtas perhatian dan kerja samanya, kami sampaikan terima kasih.`);

    setShowModal(true);
  };

  useEffect(() => {
    if(!selectedData) return;
    if(letterType === 'statement') {
        setCustomBody(`Oleh karena itu, saya berjanji dengan sungguh-sungguh untuk:`);
        setCustomClosing(`Demikian surat pernyataan ini saya buat dengan kesadaran sendiri tanpa paksaan dari pihak manapun, untuk dipergunakan sebagaimana mestinya.`);
    } else {
         setCustomBody(`Sehubungan dengan hal tersebut, kami mengharap kehadiran Bapak/Ibu/Wali murid ke sekolah untuk berkonsultasi dan menindaklanjuti permasalahan ini pada:`);
         setCustomClosing(`Mengingat pentingnya hal tersebut bagi keberlangsungan pendidikan putra/putri Bapak/Ibu, kami sangat mengharapkan kehadirannya tepat waktu.\n\nAtas perhatian dan kerja samanya, kami sampaikan terima kasih.`);
    }
  }, [letterType, selectedData]);

  // --- HELPER NAMA ORANG TUA / WALI ---
  const getParentName = () => {
      const s = selectedData?.student;
      if (!s) return '..........................';
      if (s.guardianName && s.guardianName.trim() !== '') return s.guardianName;
      if (s.fatherName && s.fatherName.trim() !== '') return s.fatherName;
      if (s.motherName && s.motherName.trim() !== '') return s.motherName;
      return '..........................';
  };

  // --- HELPER UKURAN FONT KOP SURAT ---
  const getHeaderFontSize = (text) => {
      if (!text) return 'text-2xl'; 
      const len = text.length;
      if (len > 50) return 'text-base leading-tight'; 
      if (len > 35) return 'text-lg leading-tight';   
      if (len > 25) return 'text-xl leading-tight';   
      return 'text-2xl leading-tight'; 
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
             <div className="bg-red-100 p-2 rounded-lg text-red-600"><Gavel size={24} /></div>
             Buku Sanksi & Administrasi
           </h1>
           <p className="text-slate-500 text-sm mt-1 ml-12">
             Monitoring pelanggaran siswa dan cetak dokumen pemanggilan otomatis.
           </p>
        </div>
        
        <div className="relative w-full md:w-72 group">
          <Search className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari Nama / Kelas..." 
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                <th className="p-4 w-14 text-center">No</th>
                <th className="p-4">Identitas Siswa</th>
                <th className="p-4 text-center">Total Poin</th>
                <th className="p-4">Status & Tindak Lanjut</th>
                <th className="p-4 text-center w-40">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredData.map((item, index) => (
                <tr key={item.student.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="p-4 text-center text-slate-500 font-mono">{index + 1}</td>
                    <td className="p-4">
                        <div className="font-bold text-slate-800 text-base mb-1">{item.student.name}</div>
                        <div className="flex gap-2">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{item.student.class}</span>
                            <span className="text-xs text-slate-400 py-0.5">{item.student.nisn}</span>
                        </div>
                    </td>
                    <td className="p-4 text-center">
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full text-sm">
                            {item.netScore}
                        </span>
                    </td>
                    <td className="p-4 max-w-sm">
                        <div className="flex flex-col gap-1">
                            <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <AlertTriangle size={12} className="text-amber-500"/> 
                                Range Poin: {item.activeSanction.min} - {item.activeSanction.max}
                            </div>
                            <div className="text-sm text-slate-700 leading-snug">
                                {item.activeSanction.penalty}
                            </div>
                        </div>
                    </td>
                    <td className="p-4 text-center">
                        <button 
                            onClick={() => handleOpenPrint(item)} 
                            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 mx-auto text-xs font-bold shadow-md transition-all active:scale-95 w-full"
                        >
                            <Printer size={14} /> Proses Surat
                        </button>
                    </td>
                </tr>
                ))}
                {filteredData.length === 0 && (
                    <tr>
                        <td colSpan="5" className="p-12 text-center text-slate-400 italic bg-slate-50/30">
                            Tidak ada siswa yang mencapai ambang batas sanksi saat ini.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* --- MODAL UTAMA --- */}
      {showModal && selectedData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 md:p-6 print:p-0 print:bg-white print:fixed print:inset-0">
          
          <div className="bg-white w-full max-w-[95%] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden print:shadow-none print:h-auto print:w-full print:max-w-none print:rounded-none">
            
            {/* HEADER MODAL (Hidden saat Print) */}
            <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shrink-0 print:hidden">
               <div className="flex items-center gap-4">
                   <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <FileText size={24}/>
                   </div>
                   <div>
                       <h3 className="font-bold text-lg text-slate-800">Cetak Dokumen Administrasi</h3>
                       <p className="text-xs text-slate-500">Sesuaikan data di panel kiri, lihat hasil di panel kanan.</p>
                   </div>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-transform active:scale-95">
                    <Printer size={18}/> Cetak Dokumen
                 </button>
                 <button onClick={() => setShowModal(false)} className="bg-slate-100 text-slate-500 px-3 py-2.5 rounded-xl hover:bg-slate-200 hover:text-red-500 transition-colors">
                    <X size={20}/>
                 </button>
               </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                
                {/* --- SIDE PANEL: EDITOR (KIRI) --- */}
                <div className="w-[350px] lg:w-[400px] bg-slate-50 border-r border-slate-200 overflow-y-auto p-5 space-y-6 print:hidden shrink-0">
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold border-b pb-2">
                            <Settings size={16} className="text-blue-500"/> Konfigurasi Dasar
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Jenis Dokumen</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setLetterType('call')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${letterType === 'call' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Panggilan</button>
                                <button onClick={() => setLetterType('statement')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${letterType === 'statement' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Pernyataan</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Nomor Surat</label>
                            <input value={letterNumber} onChange={e => setLetterNumber(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"/>
                        </div>
                    </div>

                    {letterType === 'call' && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold border-b pb-2"><Calendar size={16} className="text-blue-500"/> Jadwal</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Hari/Tanggal</label><input value={meetDate} onChange={e => setMeetDate(e.target.value)} className="w-full p-2 border rounded-lg text-xs"/></div>
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pukul</label><input value={meetTime} onChange={e => setMeetTime(e.target.value)} className="w-full p-2 border rounded-lg text-xs"/></div>
                            </div>
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tempat</label><input value={meetPlace} onChange={e => setMeetPlace(e.target.value)} className="w-full p-2 border rounded-lg text-xs"/></div>
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tujuan</label><input value={meetPurpose} onChange={e => setMeetPurpose(e.target.value)} className="w-full p-2 border rounded-lg text-xs"/></div>
                        </div>
                    )}

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold border-b pb-2"><Edit3 size={16} className="text-blue-500"/> Edit Redaksi</div>
                        <div><label className="text-xs font-bold text-slate-500 block mb-1.5">Pengantar</label><textarea value={customBody} onChange={e => setCustomBody(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg text-xs h-28 outline-none resize-none"/></div>
                        {letterType === 'statement' && (
                            <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                <label className="text-xs font-bold text-slate-500 block mb-2"><ListOrdered size={12}/> Poin Janji</label>
                                {promisePoints.map((point, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2"><span className="text-xs font-bold text-slate-400 py-1">{idx+1}.</span><textarea value={point} onChange={(e) => {const newPoints = [...promisePoints]; newPoints[idx] = e.target.value; setPromisePoints(newPoints);}} className="w-full p-1.5 border rounded text-xs h-12 outline-none resize-none"/></div>
                                ))}
                            </div>
                        )}
                        <div><label className="text-xs font-bold text-slate-500 block mb-1.5">Penutup</label><textarea value={customClosing} onChange={e => setCustomClosing(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg text-xs h-24 outline-none resize-none"/></div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold border-b pb-2"><UserCheck size={16} className="text-blue-500"/> Penandatangan</div>
                        
                        <div className="space-y-3">
                            {/* Input NIP Wali Kelas Manual */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                    <User size={10}/> NIP Wali Kelas (Opsional)
                                </label>
                                <input 
                                    value={homeroomNip} 
                                    onChange={e => setHomeroomNip(e.target.value)} 
                                    placeholder="Ketik NIP jika kosong..."
                                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-2 pt-2 border-t">
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded"><input type="checkbox" checked={signatories.homeroom} onChange={e=>setSignatories({...signatories, homeroom: e.target.checked})} className="rounded text-blue-600"/> <span className="text-sm">Wali Kelas</span></label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded"><input type="checkbox" checked={signatories.studentAffairs} onChange={e=>setSignatories({...signatories, studentAffairs: e.target.checked})} className="rounded text-blue-600"/> <span className="text-sm">Waka Kesiswaan</span></label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded"><input type="checkbox" checked={signatories.principal} onChange={e=>setSignatories({...signatories, principal: e.target.checked})} className="rounded text-blue-600"/> <span className="text-sm">Kepala Sekolah</span></label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- PREVIEW PANEL (KANAN) --- */}
                <div className="flex-1 bg-slate-200/50 p-8 overflow-y-auto flex justify-center print:p-0 print:bg-white print:overflow-visible print:block">
                    
                    {/* KERTAS */}
                    <div className="bg-white shadow-xl print:shadow-none w-[210mm] min-h-[297mm] p-10 md:p-12 print:p-0 print:w-full print:h-auto print:static relative transition-all print:box-border" id="print-area">
                        
                        {/* 1. KOP SURAT */}
                        <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-6">
                            <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                                {settings?.logo && <img src={settings.logo} className="object-contain max-h-full max-w-full" alt="Logo" />}
                            </div>
                            <div className="flex-1 text-center px-4 min-w-0">
                                <h3 className={`font-bold uppercase whitespace-nowrap leading-none mb-1 ${getHeaderFontSize(settings?.government)}`}>{settings?.government || 'PEMERINTAH PROVINSI ...'}</h3>
                                <h3 className={`font-bold uppercase whitespace-nowrap leading-none mb-1 ${getHeaderFontSize(settings?.department)}`}>{settings?.department || 'DINAS PENDIDIKAN'}</h3>
                                <h1 className={`font-black uppercase whitespace-nowrap leading-none mb-1 ${getHeaderFontSize(settings?.name)}`}>{settings?.name || 'NAMA SEKOLAH'}</h1>
                                <div className="text-sm font-serif italic leading-tight mt-1">
                                    <p>{settings?.address || 'Alamat Sekolah...'}</p>
                                    {settings?.address2 && <p>{settings?.address2}</p>}
                                </div>
                            </div>
                            <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                                {settings?.logo2 && <img src={settings.logo2} className="object-contain max-h-full max-w-full" alt="Logo" />}
                            </div>
                        </div>

                        {/* 2. KONTEN UTAMA */}
                        <div className="font-serif text-[12pt] leading-snug text-justify text-black print-text-wrap">
                            
                            {letterType === 'call' ? (
                                <>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-1/2">
                                            <table className="w-full">
                                                <tbody>
                                                    <tr><td className="align-top w-16">Nomor</td><td className="align-top px-1">:</td><td>{letterNumber}</td></tr>
                                                    <tr><td className="align-top">Lamp</td><td className="align-top px-1">:</td><td>1 Lembar</td></tr>
                                                    <tr><td className="align-top">Hal</td><td className="align-top px-1">:</td><td className="font-bold underline">PANGGILAN ORANG TUA</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="w-1/2 text-right">
                                            <p className="mb-6">{settings?.city || 'Tempat'}, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                                            
                                            {/* Tujuan Surat (Diperlebar & Digeser Kiri) */}
                                            <div className="text-left inline-block w-80">
                                                <p>Kepada Yth,</p>
                                                <p className="font-bold">Bapak/Ibu Orang Tua/Wali</p>
                                                <p>dari Siswa: <span className="font-bold">{selectedData.student.name}</span></p>
                                                <p>di - </p>
                                                <p className="pl-4">Tempat</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="mb-2">Dengan hormat,</p>
                                    <p className="mb-3">Diberitahukan bahwa berdasarkan data kedisiplinan siswa (Buku Poin), putra/putri Bapak/Ibu tercatat memiliki akumulasi <span className="font-bold">{selectedData.netScore} Poin</span>.</p>
                                    <p className="mb-3 bg-gray-50 border border-gray-200 p-2 italic text-sm print:border-black print:bg-transparent">
                                        <span className="font-bold not-italic">Sesuai Aturan Sekolah (Poin {selectedData.activeSanction.min}-{selectedData.activeSanction.max}):</span> <br/>
                                        "{selectedData.activeSanction.penalty}"
                                    </p>
                                    
                                    <div className="mb-3 whitespace-pre-wrap">{customBody}</div>

                                    <div className="ml-8 mb-4">
                                        <table className="w-full font-bold">
                                        <tbody>
                                            <tr><td className="w-32 py-0.5">Hari / Tanggal</td><td>: {meetDate}</td></tr>
                                            <tr><td className="py-0.5">Pukul</td><td>: {meetTime}</td></tr>
                                            <tr><td className="py-0.5">Tempat</td><td>: {meetPlace}</td></tr>
                                            <tr><td className="py-0.5">Tujuan</td><td>: {meetPurpose}</td></tr>
                                        </tbody>
                                        </table>
                                    </div>

                                    <div className="mb-8 whitespace-pre-wrap">{customClosing}</div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-center font-bold text-xl underline uppercase mb-6">SURAT PERNYATAAN SISWA</h2>
                                    <p className="mb-3">Yang bertanda tangan di bawah ini:</p>
                                    <table className="w-full ml-4 mb-4">
                                        <tbody>
                                            <tr><td className="w-40 py-0.5">Nama Lengkap</td><td>: <span className="font-bold">{selectedData.student.name}</span></td></tr>
                                            <tr><td className="py-0.5">Kelas / NISN</td><td>: {selectedData.student.class} / {selectedData.student.nisn}</td></tr>
                                            <tr><td className="py-0.5">Orang Tua / Wali</td><td>: {getParentName()}</td></tr>
                                            <tr><td className="py-0.5">Alamat</td><td>: {selectedData.student.address}</td></tr>
                                        </tbody>
                                    </table>
                                    
                                    <p className="mb-3 indent-12">Dengan ini menyatakan dengan sesungguhnya bahwa saya telah melakukan pelanggaran tata tertib sekolah dengan akumulasi <span className="font-bold">{selectedData.netScore} Poin</span>.</p>
                                    <p className="mb-3 bg-gray-50 border border-gray-200 p-2 italic text-sm print:border-black print:bg-transparent">
                                        <span className="font-bold not-italic">Sesuai aturan sekolah, saya bersedia menerima sanksi:</span> <br/>
                                        "{selectedData.activeSanction.penalty}"
                                    </p>

                                    <div className="whitespace-pre-wrap mb-3">{customBody}</div>

                                    <div className="mb-4 pl-4">
                                        <table className="w-full">
                                            <tbody>
                                                {promisePoints.map((point, index) => (
                                                    <tr key={index}><td className="align-top w-8 font-bold">{index + 1}.</td><td className="align-top text-justify">{point}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="whitespace-pre-wrap mb-6">{customClosing}</div>
                                    <div className="text-right mb-6">
                                        <p>{settings?.city || 'Tempat'}, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-8 px-8 break-inside-avoid mb-8">
                                        <div className="text-center flex flex-col items-center">
                                            <p>Mengetahui/Menyetujui,</p>
                                            <p className="mb-2">Orang Tua / Wali</p>
                                            <div className="h-20 w-full"></div> 
                                            {/* Nama Ortu: Single Line & Non-Wrapping */}
                                            <p className="font-bold underline w-full whitespace-nowrap">({getParentName()})</p>
                                        </div>
                                        <div className="text-center flex flex-col items-center">
                                            <p>Yang Membuat Pernyataan,</p>
                                            <p className="mb-2 invisible">Siswa Bersangkutan</p>
                                            <div className="h-20 w-20 border border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-400 print:border-black print:text-black print:opacity-30 mb-1">MATERAI<br/>10.000</div>
                                            {/* Nama Siswa: Single Line & Non-Wrapping */}
                                            <p className="font-bold underline w-full whitespace-nowrap">{selectedData.student.name}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* 3. TANDA TANGAN PIHAK SEKOLAH */}
                            <div className="mt-4 pt-4 break-inside-avoid">
                                <div className="text-center font-bold mb-4">Mengetahui Pihak Sekolah:</div>
                                
                                {/* 1. BARIS ATAS */}
                                <div className="flex justify-between px-8 mb-6">
                                    {/* KIRI: Wali Kelas */}
                                    {signatories.homeroom ? (
                                        <div className="w-64 text-center">
                                            <p>Wali Kelas</p>
                                            <br/><br/><br/>
                                            {/* Nama: Single Line */}
                                            <p className="font-bold underline whitespace-nowrap">{selectedData.student.homeroomTeacher || '................'}</p>
                                            {homeroomNip ? <p>NIP. {homeroomNip}</p> : <p>NIP. ........................</p>}
                                        </div>
                                    ) : <div className="w-64"></div>}
                                    
                                    {/* KANAN: Guru BK */}
                                    <div className="w-64 text-center">
                                        <p>Guru BK / Konselor</p>
                                        <br/><br/><br/>
                                        <p className="font-bold underline whitespace-nowrap">{settings?.counselor || '................'}</p>
                                        <p>NIP. {settings?.nipCounselor}</p>
                                    </div>
                                </div>

                                {/* 2. BARIS BAWAH */}
                                {(signatories.studentAffairs || signatories.principal) && (
                                    <div className="flex justify-center gap-20">
                                        {/* KIRI: Kesiswaan */}
                                        {signatories.studentAffairs && (
                                            <div className="w-64 text-center">
                                                <p>Waka Kesiswaan</p>
                                                <br/><br/><br/>
                                                <p className="font-bold underline whitespace-nowrap">{settings?.studentAffairs || '................'}</p>
                                                <p>NIP. {settings?.nipStudentAffairs}</p>
                                            </div>
                                        )}

                                        {/* KANAN: Kepala Sekolah */}
                                        {signatories.principal && (
                                            <div className="w-64 text-center">
                                                <p>Kepala Sekolah</p>
                                                <br/><br/><br/>
                                                <p className="font-bold underline whitespace-nowrap">{settings?.principal || '................'}</p>
                                                <p>NIP. {settings?.nipPrincipal}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    #print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto !important;
                        margin: 0;
                        padding: 0;
                        box-shadow: none;
                        background: white;
                        display: block;
                    }

                    .break-inside-avoid { 
                        page-break-inside: avoid; 
                        break-inside: avoid;
                    }
                    
                    * { 
                        -webkit-print-color-adjust: exact !important; 
                        color-adjust: exact !important; 
                        color: black !important;
                    }

                    .print\\:hidden { display: none !important; }
                }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}