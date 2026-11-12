import React from 'react';
import { UserRole, UnitKerja, USER_ROLES, UNIT_KERJA_LIST } from '../types';
import { Shield, Bell, Moon, Sun, Building2, UserCheck, AlertTriangle } from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSignInButton } from './GoogleSignInButton';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUnit: UnitKerja;
  onUnitChange: (unit: UnitKerja) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  pendingVerificationCount: number;
  overdueRecommendationCount: number;
  onNavigateToVerifikasi: () => void;
  onNavigateToRekomendasi: () => void;
  googleUser?: User | null;
  onGoogleAuthChange?: (user: User | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentUnit,
  onUnitChange,
  isDarkMode,
  onToggleDarkMode,
  pendingVerificationCount,
  overdueRecommendationCount,
  onNavigateToVerifikasi,
  onNavigateToRekomendasi,
  googleUser,
  onGoogleAuthChange,
}) => {
  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Unit Kerja Selection */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-sm font-medium">
          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="hidden sm:inline text-xs text-slate-600 dark:text-slate-400">Unit:</span>
          <select
            value={currentUnit}
            onChange={(e) => onUnitChange(e.target.value as UnitKerja)}
            aria-label="Pilih Unit Kerja"
            className="text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[220px] sm:max-w-[340px] truncate"
          >
            {UNIT_KERJA_LIST.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls: Alert badges, Role Switcher for Demo, Theme toggle */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Verification Alert Badge */}
        {pendingVerificationCount > 0 && (
          <button
            onClick={onNavigateToVerifikasi}
            title={`${pendingVerificationCount} kartu indeks menunggu verifikasi arsiparis`}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="tabular-nums font-mono">{pendingVerificationCount}</span>
            <span className="hidden md:inline">Verifikasi</span>
          </button>
        )}

        {/* Overdue Alert Badge */}
        {overdueRecommendationCount > 0 && (
          <button
            onClick={onNavigateToRekomendasi}
            title={`${overdueRecommendationCount} rekomendasi melewati batas tenggat`}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="tabular-nums font-mono">{overdueRecommendationCount}</span>
            <span className="hidden md:inline">Lewat Tenggat</span>
          </button>
        )}

        {/* Google Workspace Auth Status & Button */}
        <div className="hidden sm:block">
          <GoogleSignInButton
            currentUser={googleUser || null}
            onAuthChange={onGoogleAuthChange}
            compact={true}
          />
        </div>

        {/* Role Selector for Interactive Demo */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
          <UserCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ml-1.5 shrink-0" />
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden xl:inline">Peran:</span>
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            aria-label="Pilih Peran Pengguna Demo"
            className="text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {USER_ROLES.map((r) => (
              <option key={r.role} value={r.role}>
                {r.title}
              </option>
            ))}
          </select>
        </div>

        {/* Dark/Light mode toggle */}
        <button
          onClick={onToggleDarkMode}
          aria-label={isDarkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
