import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { googleSignIn, googleSignOut } from '../services/googleAuth';
import { LogOut, CheckCircle2, Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  currentUser: User | null;
  onAuthChange?: (user: User | null) => void;
  onError?: (err: any) => void;
  compact?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  currentUser,
  onAuthChange,
  onError,
  compact = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await googleSignIn();
      if (onAuthChange) onAuthChange(res.user);
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      if (onError) {
        onError(err);
      }
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setErrorMsg('Domain belum diotorisasi di Firebase');
      } else {
        setErrorMsg(err.message || 'Gagal masuk dengan Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await googleSignOut();
      if (onAuthChange) onAuthChange(null);
    } catch (err: any) {
      console.error('Sign Out failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-emerald-800 dark:text-emerald-200 max-w-[140px] truncate">
            {currentUser.email || 'Google Terhubung'}
          </span>
          <button
            onClick={handleSignOut}
            title="Keluar dari Google Workspace"
            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <div className="flex items-center gap-3">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'User'}
              className="w-9 h-9 rounded-full ring-2 ring-emerald-500"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              {(currentUser.email || 'G')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{currentUser.displayName || 'Akun Google'}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
              {currentUser.email}
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          <span>Putuskan Sambungan</span>
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="inline-flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
        )}
        <span>{compact ? 'Hubungkan Google' : 'Masuk dengan Google (Google Workspace)'}</span>
      </button>
      {errorMsg && <p className="text-[11px] text-rose-500 font-medium">{errorMsg}</p>}
    </div>
  );
};
