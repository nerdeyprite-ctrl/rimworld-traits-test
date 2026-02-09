"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { hashPassword } from '../../lib/auth';

export default function SignupPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const canUseSupabase = useMemo(() => isSupabaseConfigured(), []);
  const [signupId, setSignupId] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!canUseSupabase) {
      setSignupMessage(language === 'ko' ? 'DB가 설정되어 있지 않습니다.' : 'Database is not configured.');
      return;
    }
    if (!signupId.trim() || !signupPw.trim()) {
      setSignupMessage(language === 'ko' ? '아이디와 비밀번호를 입력하세요.' : 'Enter ID and password.');
      return;
    }

    setSignupLoading(true);
    setSignupMessage(null);
    try {
      const { data, error } = await supabase
        .from('settler_accounts')
        .select('id')
        .eq('id', signupId.trim())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSignupMessage(language === 'ko' ? '이미 존재하는 아이디입니다.' : 'ID already exists.');
        return;
      }

      const passwordHash = await hashPassword(signupPw.trim());
      const { error: insertError } = await supabase
        .from('settler_accounts')
        .insert({ id: signupId.trim(), password_hash: passwordHash });
      if (insertError) throw insertError;

      localStorage.setItem('settler_account_id', signupId.trim());
      window.dispatchEvent(new Event('accountIdChanged'));
      setSignupMessage(language === 'ko' ? '계정이 생성되었습니다.' : 'Account created.');
      router.push('/');
    } catch (err) {
      console.error('Signup failed:', err);
      setSignupMessage(language === 'ko' ? '가입에 실패했습니다.' : 'Signup failed.');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        <div className="border-b border-[#333] pb-4">
          <h1 className="text-3xl font-bold text-[#e7c07a] tracking-tight">
            {language === 'ko' ? '정착민 가입' : 'Settler Sign Up'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {language === 'ko' ? '계정을 만들어 정착민 기록을 저장하세요.' : 'Create an account to save your settler records.'}
          </p>
        </div>

        <div className="bg-[#111] border border-[#333] p-4 space-y-3">
          <input
            value={signupId}
            onChange={(e) => setSignupId(e.target.value)}
            placeholder={language === 'ko' ? '아이디' : 'ID'}
            className="w-full bg-black/50 border border-gray-600 p-2 text-white text-sm"
          />
          <input
            type="password"
            value={signupPw}
            onChange={(e) => setSignupPw(e.target.value)}
            placeholder={language === 'ko' ? '비밀번호' : 'Password'}
            className="w-full bg-black/50 border border-gray-600 p-2 text-white text-sm"
          />
          <button
            onClick={handleSignup}
            disabled={signupLoading}
            className={`w-full px-4 py-2 text-white font-bold text-sm border ${signupLoading
              ? 'bg-[#333] border-[#2a2a2a] text-gray-400 cursor-not-allowed'
              : 'bg-[#6e4e1e] hover:bg-[#856026] border-[#9f752a]'}`}
          >
            {language === 'ko' ? '가입하기' : 'Sign up'}
          </button>
          {signupMessage && (
            <div className="text-xs text-gray-400">{signupMessage}</div>
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
