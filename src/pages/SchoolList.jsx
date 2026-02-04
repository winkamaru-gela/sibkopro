import React, { useMemo, useRef } from 'react';
import { Printer, School, Users, MapPin } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const SchoolList = ({ users, allSettings }) => {
    const printRef = useRef();

    // Grouping Guru berdasarkan School ID
    const schoolGroups = useMemo(() => {
        const groups = {};
        const teachers = users.filter(u => u.role === 'guru');

        teachers.forEach(t => {
            const sId = t.schoolId || 'BELUM_DISET';
            if (!groups[sId]) {
                const setting = allSettings.find(s => s.schoolId === sId);
                groups[sId] = {
                    id: sId,
                    name: setting?.name || sId,
                    address: setting?.address || '-',
                    headmaster: setting?.headmaster || '-',
                    teachers: []
                };
            }
            groups[sId].teachers.push(t);
        });

        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    }, [users, allSettings]);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: 'Daftar_Sekolah_Pengguna_SIBKO'
    });

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-full">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <School className="text-blue-600"/> Daftar Sekolah Pengguna
                    </h2>
                    <p className="text-sm text-slate-500">Rekapitulasi sekolah dan guru bimbingan konseling.</p>
                </div>
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow transition-transform active:scale-95">
                    <Printer size={18}/> Cetak Data
                </button>
            </div>

            <div className="overflow-auto">
                <div ref={printRef} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 min-w-[800px] text-slate-900">
                    <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
                        <h1 className="text-2xl font-extrabold uppercase">DAFTAR SEKOLAH PENGGUNA APLIKASI SIBKO</h1>
                        <p className="text-sm text-slate-500">Generated on: {new Date().toLocaleDateString('id-ID', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</p>
                    </div>

                    <div className="space-y-8">
                        {schoolGroups.length > 0 ? schoolGroups.map((school, idx) => (
                            <div key={school.id} className="break-inside-avoid">
                                <div className="bg-slate-100 p-3 rounded-t-lg border border-slate-300 flex justify-between items-center">
                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                        <span className="bg-slate-800 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">{idx + 1}</span>
                                        {school.name}
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono">ID: {school.id}</div>
                                </div>
                                
                                <div className="border-x border-slate-300 p-4 text-sm bg-slate-50 grid grid-cols-2 gap-4">
                                    <div><span className="font-bold">Alamat:</span> {school.address}</div>
                                    <div><span className="font-bold">Kepala Sekolah:</span> {school.headmaster}</div>
                                </div>

                                <table className="w-full text-sm border-collapse border border-slate-300">
                                    <thead className="bg-slate-200">
                                        <tr>
                                            <th className="border border-slate-300 p-2 w-10 text-center">No</th>
                                            <th className="border border-slate-300 p-2">Nama Guru BK</th>
                                            <th className="border border-slate-300 p-2 w-48">NIP</th>
                                            <th className="border border-slate-300 p-2 w-40 text-center">Status Admin</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {school.teachers.map((t, i) => (
                                            <tr key={t.id}>
                                                <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                                                <td className="border border-slate-300 p-2 font-bold">{t.fullName}</td>
                                                <td className="border border-slate-300 p-2 font-mono">{t.nip || '-'}</td>
                                                <td className="border border-slate-300 p-2 text-center">
                                                    {t.isSchoolAdmin ? <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold border border-yellow-200">Koordinator</span> : 'Guru'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )) : (
                            <div className="text-center p-10 text-slate-400 italic">Belum ada data sekolah yang terdaftar.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolList;