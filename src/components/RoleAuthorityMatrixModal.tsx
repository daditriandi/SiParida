import React from 'react';
import {
  X,
  Shield,
  CheckCircle2,
  Ban,
  ArrowRight,
  Eye,
  FileCheck,
  UploadCloud,
  Search,
  FileText,
  BarChart3,
  UserCheck,
} from 'lucide-react';
import { UserRole, ROLE_AUTHORITIES, RoleAuthorityDefinition } from '../types';

interface RoleAuthorityMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const RoleAuthorityMatrixModal: React.FC<RoleAuthorityMatrixModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
}) => {
  if (!isOpen) return null;

  const roleList: RoleAuthorityDefinition[] = [
    ROLE_AUTHORITIES.Sesdep,
    ROLE_AUTHORITIES['Pelaksana Asdep'],
    ROLE_AUTHORITIES.Arsiparis,
    ROLE_AUTHORITIES.Asdep,
    ROLE_AUTHORITIES.Deputi,
    ROLE_AUTHORITIES.Admin,
  ];

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Sesdep':
        return <Search className="w-5 h-5 text-blue-500" />;
      case 'Pelaksana Asdep':
        return <UploadCloud className="w-5 h-5 text-emerald-500" />;
      case 'Arsiparis':
        return <FileCheck className="w-5 h-5 text-indigo-500" />;
      case 'Asdep':
        return <CheckCircle2 className="w-5 h-5 text-amber-500" />;
      case 'Deputi':
        return <BarChart3 className="w-5 h-5 text-purple-500" />;
      case 'Admin':
        return <Shield className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/30">
              <Shield className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  Tata Kelola Kearsipan Kemenko Polkam
                </span>
                <span className="text-[10px] font-medium text-slate-300">
                  Role-Based Access Control (RBAC)
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-1">
                Matriks Fungsi & Kewenangan 5 Agent / Peran SiParida
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Dialog"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            Sistem SiParida memisahkan tugas dan tanggung jawab (*separation of duties*) secara ketat agar alur kearsipan dinas 8 tahap berjalan akuntabel, mulai dari pengunggahan oleh staf unit, verifikasi oleh arsiparis, persetujuan naskah dinas oleh Asdep, pemantauan oleh Sesdep, hingga telaah eksekutif oleh Deputi.
          </div>

          {/* Cards for 5 Official Roles + Admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleList.map((auth, idx) => {
              const isSelected = currentRole === auth.role;
              return (
                <div
                  key={auth.role}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Role Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/60 shrink-0">
                          {getRoleIcon(auth.role)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                              {auth.title}
                            </h3>
                          </div>
                          <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 block mt-0.5">
                            {auth.badgeLabel}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shrink-0">
                          Aktif
                        </span>
                      ) : null}
                    </div>

                    {/* Fungsi Utama */}
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200 mb-3">
                      🎯 <span className="font-bold">Fungsi Utama:</span> {auth.fungsiUtama}
                    </div>

                    {/* Kewenangan */}
                    <div className="space-y-1.5 mb-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Kewenangan Yang Diizinkan:</span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pl-4 list-disc marker:text-emerald-500">
                        {auth.kewenangan.map((k, i) => (
                          <li key={i}>{k}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Batasan / Larangan */}
                    {auth.larangan.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <Ban className="w-3 h-3" />
                          <span>Batasan / Tidak Berwenang:</span>
                        </div>
                        <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pl-4 list-disc marker:text-rose-400">
                          {auth.larangan.map((l, i) => (
                            <li key={i}>{l}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Switch to this role button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Menu Utama: {auth.allowedPages.slice(0, 3).join(', ')}
                    </span>
                    {!isSelected ? (
                      <button
                        onClick={() => {
                          onSelectRole(auth.role);
                          onClose();
                        }}
                        className="px-3 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Uji Peran Ini</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        Sedang Digunakan
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Kewenangan ini disesuaikan dengan Kepmenko Polkam dan kaidah penyelenggaraan kearsipan ANRI.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
