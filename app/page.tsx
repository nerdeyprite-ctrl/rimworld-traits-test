"use client";

import { useLanguage } from '../context/LanguageContext';
import { useTest } from '../context/TestContext';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import VisitorCounter from '../components/VisitorCounter';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Home() {
  const { t, language } = useLanguage();
  const { resetTest } = useTest();
  const router = useRouter();
  const [lastShareId, setLastShareId] = useState<string | null>(null);
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  // Reset test state whenever Home is mounted (returning from test/result)
  useEffect(() => {
    resetTest();
    const storedId = typeof window !== 'undefined' ? localStorage.getItem('last_share_id') : null;
    setLastShareId(storedId);
    const storedAccount = typeof window !== 'undefined' ? localStorage.getItem('settler_account_id') : null;
    setAccountId(storedAccount);
  }, [resetTest]);

  const canUseSupabase = useMemo(() => isSupabaseConfigured(), []);

  const hashPassword = async (value: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleLogin = async () => {
    if (!canUseSupabase) {
      setLoginMessage(language === 'ko' ? 'DB가 설정되어 있지 않습니다.' : 'Database is not configured.');
      return;
    }
    if (!loginId.trim() || !loginPw.trim()) {
      setLoginMessage(language === 'ko' ? '아이디와 비밀번호를 입력하세요.' : 'Enter ID and password.');
      return;
    }
    setLoginLoading(true);
    setLoginMessage(null);
    try {
      const passwordHash = await hashPassword(loginPw.trim());
      const { data, error } = await supabase
        .from('settler_accounts')
        .select('id, password_hash')
        .eq('id', loginId.trim())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        const { error: insertError } = await supabase
          .from('settler_accounts')
          .insert({ id: loginId.trim(), password_hash: passwordHash });
        if (insertError) throw insertError;
        localStorage.setItem('settler_account_id', loginId.trim());
        setAccountId(loginId.trim());
        setLoginMessage(language === 'ko' ? '계정이 생성되었습니다.' : 'Account created.');
        return;
      }

      if (data.password_hash !== passwordHash) {
        setLoginMessage(language === 'ko' ? '비밀번호가 일치하지 않습니다.' : 'Incorrect password.');
        return;
      }

      localStorage.setItem('settler_account_id', data.id);
      setAccountId(data.id);
      setLoginMessage(language === 'ko' ? '로그인되었습니다.' : 'Logged in.');
    } catch (err) {
      console.error('Login failed:', err);
      setLoginMessage(language === 'ko' ? '로그인에 실패했습니다.' : 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('settler_account_id');
    setAccountId(null);
    setLoginMessage(language === 'ko' ? '로그아웃되었습니다.' : 'Logged out.');
  };

  const requireLoginAndSettlers = async () => {
    if (!accountId) {
      window.alert(language === 'ko' ? '로그인이 필요합니다.' : 'Please log in first.');
      return false;
    }
    if (!canUseSupabase) {
      window.alert(language === 'ko' ? 'DB가 설정되어 있지 않습니다.' : 'Database is not configured.');
      return false;
    }
    setCheckLoading(true);
    try {
      const { data, error } = await supabase
        .from('settler_profiles')
        .select('id')
        .eq('account_id', accountId)
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) {
        window.alert(language === 'ko' ? '저장된 캐릭터가 없습니다.' : 'No saved character found.');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to check settlers:', err);
      window.alert(language === 'ko' ? '정착민 조회에 실패했습니다.' : 'Failed to fetch settlers.');
      return false;
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 animate-fade-in-up">
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-[var(--rimworld-highlight)] tracking-wider uppercase drop-shadow-md">
          {t('app_title')}
        </h1>
        <p className="text-sm md:text-base text-gray-400 mb-8 max-w-2xl mx-auto whitespace-pre-line leading-relaxed">
          {t('landing_subtitle')}
        </p>


        <div className="flex flex-col md:flex-row items-center justify-center gap-3">
          <a
            href="/test/intro"
            className="inline-block px-12 py-4 bg-[#8b5a2b] hover:bg-[#a06b35] text-white font-bold text-lg shadow-[0_4px_0_#5a3a1a] active:shadow-none active:translate-y-1 transition-all border border-[#5a3a1a]"
          >
            {t('start_test')}
          </a>
          <button
            onClick={async () => {
              const ok = await requireLoginAndSettlers();
              if (ok) {
                router.push('/settlers');
              }
            }}
            className={`inline-block px-8 py-4 text-white font-bold text-lg shadow-[0_4px_0_#2a2a2a] active:shadow-none active:translate-y-1 transition-all border ${checkLoading
              ? 'bg-[#333] border-[#2a2a2a] text-gray-400 cursor-wait'
              : 'bg-[#1c3d5a] hover:bg-[#2c5282] border-[#102a43]'}`}
          >
            {language === 'ko' ? '정착민 관리하기' : 'Manage Settlers'}
          </button>
        </div>
        <div className="mt-6 w-full max-w-md mx-auto bg-[#111] border border-[#333] p-4 text-left space-y-3">
          <div className="text-sm font-bold text-[#9f752a]">
            {language === 'ko' ? '정착민 로그인' : 'Settler Login'}
          </div>
          {accountId ? (
            <div className="space-y-2 text-xs text-gray-300">
              <div>
                {language === 'ko' ? '로그인됨' : 'Logged in'}: <span className="text-white font-bold">{accountId}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white border border-gray-600 text-xs"
              >
                {language === 'ko' ? '로그아웃' : 'Logout'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder={language === 'ko' ? '아이디' : 'ID'}
                className="w-full bg-black/50 border border-gray-600 p-2 text-white text-sm"
              />
              <input
                type="password"
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                placeholder={language === 'ko' ? '비밀번호' : 'Password'}
                className="w-full bg-black/50 border border-gray-600 p-2 text-white text-sm"
              />
              <button
                onClick={handleLogin}
                disabled={loginLoading}
                className={`w-full px-4 py-2 text-white font-bold text-sm border ${loginLoading
                  ? 'bg-[#333] border-[#2a2a2a] text-gray-400 cursor-not-allowed'
                  : 'bg-[#6e4e1e] hover:bg-[#856026] border-[#9f752a]'}`}
              >
                {language === 'ko' ? '로그인 / 가입' : 'Login / Register'}
              </button>
            </div>
          )}
          {loginMessage && (
            <div className="text-xs text-gray-400">{loginMessage}</div>
          )}
        </div>
        <VisitorCounter />
      </section>

      {/* Theme Section: Skills & Traits */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-12">
        {/* Traits Panel */}
        <div className="bg-[var(--rimworld-panel)] p-6 border border-[var(--rimworld-border)] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--rimworld-border)] opacity-50"></div>
          <h2 className="text-2xl font-bold mb-4 text-[var(--rimworld-highlight)] flex items-center">
            {t('landing_traits_title')}
          </h2>
          <p className="text-gray-300 mb-4 text-sm whitespace-pre-line">
            {t('landing_traits_desc')}
          </p>
          {/* Detailed list kept static or partially translated for now due to complexity */}
          <ul className="list-none text-gray-400 text-sm space-y-2 pl-2 border-l-2 border-[var(--rimworld-border)]">
            {language === 'ko' ? (
              <>
                <li>• Mood (기분): 우울증 vs 낙천적</li>
                <li>• Work (노동): 게으름 vs 일벌레</li>
                <li>• Social (사교): 직설적 vs 다정다감</li>
              </>
            ) : (
              <>
                <li>• Mood: Depressive vs Sanguine</li>
                <li>• Work: Lazy vs Industrious</li>
                <li>• Social: Abrasive vs Kind</li>
              </>
            )}
          </ul>
        </div>

        {/* Skills Panel */}
        <div className="bg-[var(--rimworld-panel)] p-6 border border-[var(--rimworld-border)] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--rimworld-border)] opacity-50"></div>
          <h2 className="text-2xl font-bold mb-4 text-[var(--rimworld-highlight)] flex items-center">
            {t('landing_skills_title')}
          </h2>
          <p className="text-gray-300 mb-4 text-sm whitespace-pre-line">
            {t('landing_skills_desc')}
          </p>
          <ul className="list-none text-gray-400 text-sm space-y-2 pl-2 border-l-2 border-[var(--rimworld-border)]">
            {language === 'ko' ? (
              <>
                <li>• 전투: 사격, 격투</li>
                <li>• 생존: 조리, 의학, 원예</li>
                <li>• 지능: 연구, 예술</li>
              </>
            ) : (
              <>
                <li>• Combat: Shooting, Melee</li>
                <li>• Survival: Cooking, Medicine, Plants</li>
                <li>• Intellect: Research, Artistic</li>
              </>
            )}
          </ul>
        </div>
      </section>

      {/* Info Section (Bottom) */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-6 text-xs md:text-sm text-[#9f752a] font-medium mt-16 bg-[#111] p-3 border border-[#333] inline-block mx-auto rounded opacity-80 hover:opacity-100 transition-opacity">
        <span>⏱ {t('estimated_time')}</span>
        <span className="hidden md:inline text-gray-600"> | </span>
        <span>📝 {t('questions_count')}</span>
      </div>
    </div>
  );
}
