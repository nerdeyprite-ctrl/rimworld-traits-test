"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../../context/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { hashPassword } from '../../../lib/auth';

export default function AccountSettingsPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const canUseSupabase = useMemo(() => isSupabaseConfigured(), []);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('settler_account_id') : null;
    setAccountId(stored);
    setChecking(false);
  }, []);

  const handleChangePassword = async () => {
    if (!accountId) {
      setMessage(language === 'ko' ? '로그인이 필요합니다.' : 'Login required.');
      return;
    }
    if (!canUseSupabase) {
      setMessage(language === 'ko' ? 'DB가 설정되어 있지 않습니다.' : 'Database is not configured.');
      return;
    }
    if (!currentPw.trim() || !newPw.trim()) {
      setMessage(language === 'ko' ? '현재 비밀번호와 새 비밀번호를 입력하세요.' : 'Enter current and new password.');
      return;
    }
    if (newPwConfirm && newPwConfirm.trim() !== newPw.trim()) {
      setMessage(language === 'ko' ? '새 비밀번호가 일치하지 않습니다.' : 'New passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const currentHash = await hashPassword(currentPw.trim());
      const { data, error } = await supabase
        .from('settler_accounts')
        .select('password_hash')
        .eq('id', accountId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data || data.password_hash !== currentHash) {
        setMessage(language === 'ko' ? '현재 비밀번호가 올바르지 않습니다.' : 'Current password is incorrect.');
        return;
      }

      const newHash = await hashPassword(newPw.trim());
      const { error: updateError } = await supabase
        .from('settler_accounts')
        .update({ password_hash: newHash })
        .eq('id', accountId);
      if (updateError) throw updateError;

      setCurrentPw('');
      setNewPw('');
      setNewPwConfirm('');
      setMessage(language === 'ko' ? '비밀번호가 변경되었습니다.' : 'Password updated.');
    } catch (err) {
      console.error('Password change failed:', err);
      setMessage(language === 'ko' ? '비밀번호 변경에 실패했습니다.' : 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-slate-200 p-4 md:p-8 font-sans">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center py-20 italic text-slate-500 animate-pulse">
            {language === 'ko' ? '계정 확인 중...' : 'Checking account...'}
          </div>
        </div>
      </div>
    );
  }

  if (!accountId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-slate-200 p-4 md:p-8 font-sans">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-[#e7c07a]">
            {language === 'ko' ? '계정 정보' : 'Account Settings'}
          </h1>
          <div className="bg-[#111] border border-[#333] p-4 text-sm text-slate-400">
            {language === 'ko' ? '로그인 후 이용할 수 있습니다.' : 'Please log in to access this page.'}
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[#1c3d5a] hover:bg-[#2c5282] text-white border border-blue-900 text-xs"
          >
            {language === 'ko' ? '홈으로' : 'Home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        <div className="border-b border-[#333] pb-4">
          <h1 className="text-3xl font-bold text-[#e7c07a] tracking-tight">
            {language === 'ko' ? '계정 정보' : 'Account Settings'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {language === 'ko' ? `로그인 계정: ${accountId}` : `Logged in as: ${accountId}`}
          </p>
        </div>

        <div className="bg-[#111] border border-[#333] p-4 space-y-3">
          <div className="text-sm font-bold text-[#9f752a]">
            {language === 'ko' ? '비밀번호 변경' : 'Change Password'}
          </div>
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder={language === 'ko' ? '현재 비밀번호' : 'Current password'}
            className="w-full bg-black/50 border border-gray-600 p-2 text-white text-sm"
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder={language === 'ko' ? '새 비밀번호' : 'New password'}
            className="w-full bg-black/50 border border-gray-600 p-2 text-white text-sm"
          />
          <input
            type="password"
            value={newPwConfirm}
            onChange={(e) => setNewPwConfirm(e.target.value)}
            placeholder={language === 'ko' ? '새 비밀번호 확인 (선택)' : 'Confirm new password (optional)'}
            className="w-full bg-black/50 border border-gray-600 p-2 text-white text-sm"
          />
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className={`w-full px-4 py-2 text-white font-bold text-sm border ${loading
              ? 'bg-[#333] border-[#2a2a2a] text-gray-400 cursor-not-allowed'
              : 'bg-[#6e4e1e] hover:bg-[#856026] border-[#9f752a]'}`}
          >
            {language === 'ko' ? '비밀번호 변경' : 'Update password'}
          </button>
          {message && (
            <div className="text-xs text-gray-400">{message}</div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-[#9f752a] hover:text-[#e2c178] underline"
          >
            {language === 'ko' ? '홈으로 돌아가기' : 'Back to home'}
          </button>
        </div>
      </div>
    </div>
  );
}
