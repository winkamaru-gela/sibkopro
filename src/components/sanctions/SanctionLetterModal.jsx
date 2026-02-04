import React from 'react';
import { X, FileText, Clock, Construction } from 'lucide-react';

const SanctionLetterModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
            
            {/* Modal Box */}
            <div className="bg-white w-full max-w-sm md:max-w-md rounded-2xl shadow-2xl p-8 relative flex flex-col items-center text-center animate-in zoom-in-95">
                
                {/* Tombol Tutup */}
                <button 
                    onClick={onClose} 
                    className="absolute right-4 top-4 p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Ilustrasi Icon */}
                <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-orange-50/50">
                    <Construction size={40} />
                </div>

                {/* Teks Judul */}
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                    Fitur Sedang Dipersiapkan
                </h2>

                {/* Deskripsi */}
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    Mohon maaf, fitur <b>Cetak Surat Panggilan Otomatis</b> saat ini sedang dalam tahap pengembangan oleh tim developer. <br/><br/>
                    Silakan gunakan format surat manual untuk sementara waktu.
                </p>

                {/* Tombol Aksi */}
                <button 
                    onClick={onClose}
                    className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-transform active:scale-95 shadow-lg shadow-slate-200"
                >
                    Saya Mengerti
                </button>

                {/* Footer Info */}
                <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-full">
                    <Clock size={12} />
                    <span>Coming Soon v1.1</span>
                </div>

            </div>
        </div>
    );
};

export default SanctionLetterModal;