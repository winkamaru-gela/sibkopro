import React, { useState, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { 
    Plus, Save, Trash2, Edit3, ArrowLeft, LayoutTemplate, PenTool, 
    Variable, Copy, Info, Globe, Lock, User as UserIcon, ShieldAlert 
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getKopSuratHTML, getTandaTanganHTML } from '../../utils/letterUtils';

const TemplateEditor = ({ templates, user, settings }) => {
    const editorRef = useRef(null);
    const [editingTemplate, setEditingTemplate] = useState(null); 
    const [tempTitle, setTempTitle] = useState('');
    const [tempBody, setTempBody] = useState('');

    // --- DAFTAR VARIABEL UPDATE ---
    const AVAILABLE_VARIABLES = [
        { category: "Data Kop Surat", items: [
            { code: "[LOGO_KIRI]", label: "Logo Kiri (Image)" },
            { code: "[LOGO_KANAN]", label: "Logo Kanan (Image)" },
            { code: "[NAMA_PEMERINTAH]", label: "Nama Pemerintah/Yayasan" },
            { code: "[NAMA_DINAS]", label: "Nama Dinas" },
            { code: "[NAMA_SEKOLAH]", label: "Nama Sekolah" },
            { code: "[ALAMAT_1]", label: "Alamat Baris 1 (Jalan)" },
            { code: "[ALAMAT_2]", label: "Info Tambahan (Email/Web)" },
            { code: "[KOTA_SEKOLAH]", label: "Kota/Kabupaten" },
        ]},
        { category: "Data Siswa", items: [
            { code: "[NAMA_SISWA]", label: "Nama Lengkap" },
            { code: "[KELAS]", label: "Kelas" },
            { code: "[NISN]", label: "NISN" },
            { code: "[NAMA_ORANGTUA]", label: "Nama Orang Tua" },
            { code: "[HP_ORANGTUA]", label: "No. HP Ortu" },
            { code: "[ALAMAT]", label: "Alamat Siswa" },
        ]},
        { category: "Pelanggaran & Sanksi", items: [
            { code: "[TOTAL_POIN]", label: "Total Poin" },
            { code: "[SANKSI_SAAT_INI]", label: "Status Sanksi" },
            { code: "[LIST_PELANGGARAN]", label: "Tabel Riwayat Pelanggaran" },
            // [BARU]
            { code: "[KODE_PELANGGARAN]", label: "List Kode Pelanggaran" },
            { code: "[JENIS_PELANGGARAN]", label: "List Jenis Pelanggaran" },
        ]},
        { category: "Data Surat", items: [
            { code: "[NOMOR_SURAT]", label: "Nomor Surat" },
            { code: "[TANGGAL_SEKARANG]", label: "Tanggal Hari Ini" },
        ]},
        { category: "Pejabat Sekolah", items: [
            { code: "[KEPALA_SEKOLAH]", label: "Kepala Sekolah" },
            { code: "[NIP_KEPSEK]", label: "NIP Kepsek" },
            { code: "[WAKA_KESISWAAN]", label: "Waka Kesiswaan" },
            { code: "[NIP_WAKA]", label: "NIP Waka" },
            { code: "[GURU_BK]", label: "Guru BK" },
            { code: "[NIP_GURU]", label: "NIP Guru BK" },
        ]}
    ];

    const handleSaveTemplate = async () => {
        if(!tempTitle || !tempBody) return alert("Judul dan Isi tidak boleh kosong");
        
        const isGlobal = user.role === 'admin';

        const payload = {
            title: tempTitle,
            body: tempBody, 
            teacherId: user.id,
            isGlobal: isGlobal, 
            updatedAt: new Date().toISOString()
        };

        try {
            if (editingTemplate && editingTemplate.id) {
                if(editingTemplate.isGlobal && user.role !== 'admin') {
                    return alert("Anda tidak memiliki akses untuk mengubah template ini.");
                }
                await updateDoc(doc(db, 'letter_templates', editingTemplate.id), payload);
                alert("Template berhasil diperbarui");
            } else {
                await addDoc(collection(db, 'letter_templates'), payload);
                alert(isGlobal ? "Template Global (Admin) berhasil disimpan" : "Template Pribadi berhasil disimpan");
            }
            setEditingTemplate(null);
            setTempTitle('');
            setTempBody('');
        } catch (error) {
            console.error("Error saving:", error);
            alert("Gagal menyimpan: " + error.message);
        }
    };

    const handleDeleteTemplate = async (template) => {
        if(template.isGlobal && user.role !== 'admin') {
            return alert("Template Global tidak dapat dihapus oleh Guru.");
        }
        if(confirm("Hapus template ini?")) await deleteDoc(doc(db, 'letter_templates', template.id));
    };

    const insertToEditor = (html) => {
        if (editorRef.current) {
            editorRef.current.insertContent(html);
        }
    };

    const loadDefaultTemplate = () => {
        setEditingTemplate({ id: null }); 
        setTempTitle(''); 
        const initialBody = `
            ${getKopSuratHTML(settings)}
            <p style="text-align: center; font-weight: bold; font-size: 14pt; text-decoration: underline; margin-bottom: 0;">SURAT PERNYATAAN SISWA</p>
            <p style="text-align: center; margin-top: 5px;">Nomor : [NOMOR_SURAT]</p>
            <p>&nbsp;</p>
            <p>Saya yang bertanda tangan di bawah ini:</p>
            <table style="width: 100%; margin-left: 20px;">
                <tr><td width="150">Nama</td><td>: <b>[NAMA_SISWA]</b></td></tr>
                <tr><td>Kelas</td><td>: [KELAS]</td></tr>
                <tr><td>NISN</td><td>: [NISN]</td></tr>
            </table>
            <p>&nbsp;</p>
            <p>Dengan ini mengakui bahwa saya telah melakukan pelanggaran sebagai berikut:</p>
            <p><b>[JENIS_PELANGGARAN]</b></p>
            
            <p>Detail Riwayat:</p>
            [LIST_PELANGGARAN]
            
            <p style="text-align: justify;">Saya berjanji tidak akan mengulangi perbuatan tersebut.</p>
            <p>&nbsp;</p>
            ${getTandaTanganHTML(settings, user)}
        `;
        setTempBody(initialBody); 
    };

    return (
        <div className="animate-in fade-in h-full">
            {!editingTemplate && (
                <div className="space-y-6">
                     <button 
                        onClick={loadDefaultTemplate}
                        className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-600 bg-blue-50/50 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={20}/> Buat Template Baru
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map(t => {
                            const canEdit = user.role === 'admin' || !t.isGlobal;
                            return (
                                <div key={t.id} className={`bg-white p-5 rounded-xl shadow-sm border transition-all group relative overflow-hidden ${t.isGlobal ? 'border-purple-200' : 'border-slate-200 hover:shadow-md hover:border-blue-300'}`}>
                                    <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-lg text-[10px] font-bold ${t.isGlobal ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {t.isGlobal ? <span className="flex items-center gap-1"><Globe size={10}/> Global (Admin)</span> : <span className="flex items-center gap-1"><UserIcon size={10}/> Pribadi</span>}
                                    </div>

                                    <div className={`absolute top-0 left-0 w-1 h-full ${t.isGlobal ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                    
                                    <h4 className="font-bold text-slate-800 text-lg mb-2 pr-16 truncate">{t.title}</h4>
                                    <div className="text-xs text-slate-500 mb-4 h-12 overflow-hidden relative">
                                        {t.body.replace(/<[^>]*>?/gm, ' ').substring(0, 100)}...
                                        <div className="absolute bottom-0 w-full h-4 bg-gradient-to-t from-white to-transparent"></div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2 border-t pt-3">
                                        {canEdit ? (
                                            <>
                                                <button 
                                                    onClick={() => { setEditingTemplate(t); setTempTitle(t.title); setTempBody(t.body); }}
                                                    className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"
                                                >
                                                    <Edit3 size={14}/> Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteTemplate(t)}
                                                    className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1"
                                                >
                                                    <Trash2 size={14}/> Hapus
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400 text-xs py-1.5 italic">
                                                <Lock size={12}/> Terkunci (Milik Admin)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {editingTemplate && (
                <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)]">
                    
                    <div className="flex-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full">
                        {user.role === 'admin' && (
                            <div className="bg-purple-50 text-purple-700 px-4 py-2 text-[10px] font-bold border-b border-purple-100 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Globe size={12}/> MODE ADMIN: Template ini akan disimpan sebagai GLOBAL (Dapat digunakan oleh semua guru).</span>
                                <span className="flex items-center gap-1"><ShieldAlert size={12}/> Akses Penuh</span>
                            </div>
                        )}

                        <div className="p-3 border-b bg-slate-50 flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3 w-full max-w-xl">
                                <button onClick={() => setEditingTemplate(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-500">
                                    <ArrowLeft size={20}/>
                                </button>
                                <div className="flex-1">
                                    <input 
                                        className="w-full px-3 py-1.5 bg-transparent font-bold text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-lg transition-all"
                                        placeholder="Judul Template (Wajib Diisi)"
                                        value={tempTitle}
                                        onChange={e => setTempTitle(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => insertToEditor(getKopSuratHTML(settings))}
                                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1"
                                    title="Sisipkan Kop Surat"
                                >
                                    <LayoutTemplate size={16}/> <span className="hidden sm:inline">Kop</span>
                                </button>
                                <button 
                                    onClick={() => insertToEditor(getTandaTanganHTML(settings, user))}
                                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1"
                                    title="Sisipkan Tanda Tangan"
                                >
                                    <PenTool size={16}/> <span className="hidden sm:inline">TTD</span>
                                </button>
                                <button 
                                    onClick={handleSaveTemplate}
                                    className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all ml-2"
                                >
                                    <Save size={18}/> Simpan
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden relative bg-slate-100 p-0 md:p-2">
                            <div className="h-full rounded-lg overflow-hidden shadow-inner border border-slate-300">
                                <Editor
                                    apiKey="z9befhegvza1db551npe4yek5t81883n4f9rijssnf6aa5p1" 
                                    onInit={(evt, editor) => editorRef.current = editor}
                                    value={tempBody}
                                    onEditorChange={(newValue) => setTempBody(newValue)}
                                    init={{
                                        height: "100%",
                                        menubar: false,
                                        plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'],
                                        toolbar: 'undo redo | fontfamily fontsize | bold italic underline | alignleft aligncenter alignright alignjustify | lineheight | bullist numlist outdent indent | table | code preview | removeformat',
                                        
                                        line_height_formats: '1 1.15 1.5 2 2.5 3', 
                                        content_style: `
                                            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.15; }
                                            p { margin-bottom: 0.5em; margin-top: 0; }
                                            ul, ol { margin-bottom: 0.5em; margin-top: 0; }
                                            li { margin-bottom: 0; }
                                            table { border-collapse: collapse; }
                                            td { padding: 2px; }
                                        `,
                                        statusbar: false,
                                        zindex: 10
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-72 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Variable size={16} className="text-blue-600"/> Variabel Surat
                            </h3>
                            <div className="group relative">
                                <Info size={16} className="text-slate-400 cursor-help"/>
                                <div className="absolute right-0 top-6 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl z-50 hidden group-hover:block">
                                    Klik tombol variabel untuk memasukkannya ke dalam posisi kursor di editor.
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
                            {AVAILABLE_VARIABLES.map((group, idx) => (
                                <div key={idx}>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                                        {group.category}
                                    </h4>
                                    <div className="space-y-2">
                                        {group.items.map((v) => (
                                            <button
                                                key={v.code}
                                                onClick={() => insertToEditor(v.code)}
                                                className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-lg transition-all group flex items-center justify-between"
                                                title={`Klik untuk menyisipkan ${v.label}`}
                                            >
                                                <div>
                                                    <div className="text-xs font-bold text-slate-700 font-mono text-blue-700">{v.code}</div>
                                                    <div className="text-[10px] text-slate-500">{v.label}</div>
                                                </div>
                                                <Copy size={12} className="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default TemplateEditor;