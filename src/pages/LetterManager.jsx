import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FileText, Settings } from 'lucide-react';

// Import Komponen Pecahan
import LetterCreator from '../components/letters/LetterCreator';
import TemplateEditor from '../components/letters/TemplateEditor';

export default function LetterManager({ students, user, settings, pointLogs, masterPoints, sanctionRules }) {
    const [activeTab, setActiveTab] = useState('create'); 
    const [templates, setTemplates] = useState([]);

    // Fetch Templates (Data di-fetch di Parent agar bisa dipakai kedua tab)
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'letter_templates'), where("teacherId", "==", user.id));
        const unsub = onSnapshot(q, (snap) => {
            setTemplates(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => unsub();
    }, [user]);

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-blue-600"/> Persuratan Digital
                    </h1>
                    <p className="text-slate-500 text-sm">Buat dan kelola surat resmi BK dengan editor profesional.</p>
                </div>
                
                {/* Tab Navigation */}
                <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                    <button 
                        onClick={() => setActiveTab('create')}
                        className={`px-5 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'create' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText size={16}/> Buat Surat
                    </button>
                    <button 
                        onClick={() => setActiveTab('templates')}
                        className={`px-5 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'templates' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Settings size={16}/> Template Editor
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'create' && (
                <LetterCreator 
                    students={students} 
                    templates={templates} 
                    settings={settings} 
                    pointLogs={pointLogs} 
                    sanctionRules={sanctionRules} 
                />
            )}

            {activeTab === 'templates' && (
                <TemplateEditor 
                    templates={templates} 
                    user={user} 
                    settings={settings} 
                />
            )}
        </div>
    );
}