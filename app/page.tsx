"use client";

import { useLanguage } from '../context/LanguageContext';
import { useTest } from '../context/TestContext';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import VisitorCounter from '../components/VisitorCounter';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { hashPassword } from '../lib/auth';
import { isWorldSimEnabled } from '../lib/world-sim-feature';

const UPDATES_READ_KEY = 'rimworld_updates_read_version';
const UPDATES_VERSION = '2026-02-14-balance-v1';

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
  const worldSimEnabled = isWorldSimEnabled();

  // Reset test state whenever Home is mounted (returning from test/result)
  useEffect(() => {
    resetTest();
    const storedId = typeof window !== 'undefined' ? localStorage.getItem('last_share_id') : null;
    setLastShareId(storedId);
    const storedAccount = typeof window !== 'undefined' ? localStorage.getItem('settler_account_id') : null;
    setAccountId(storedAccount);
  }, [resetTest]);

  const canUseSupabase = useMemo(() => isSupabaseConfigured(), []);

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
        setLoginMessage(language === 'ko' ? '계정이 없습니다. 가입해주세요.' : 'Account not found. Please sign up.');
        return;
      }

      if (data.password_hash !== passwordHash) {
        setLoginMessage(language === 'ko' ? '비밀번호가 일치하지 않습니다.' : 'Incorrect password.');
        return;
      }

      localStorage.setItem('settler_account_id', data.id);
      window.dispatchEvent(new Event('accountIdChanged'));
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
    window.dispatchEvent(new Event('accountIdChanged'));
    setAccountId(null);
    setLoginMessage(language === 'ko' ? '로그아웃되었습니다.' : 'Logged out.');
  };

  const requireLogin = async () => {
    const currentAccountId = accountId || (typeof window !== 'undefined' ? localStorage.getItem('settler_account_id') : null);

    if (!currentAccountId) {
      window.alert(language === 'ko' ? '로그인이 필요합니다. 아래에서 로그인해주세요.' : 'Please log in first. Use the login form below.');
      const loginSection = document.getElementById('login-section');
      if (loginSection) {
        loginSection.scrollIntoView({ behavior: 'smooth' });
      }
      return false;
    }
    if (!canUseSupabase) {
      window.alert(language === 'ko' ? 'DB가 설정되어 있지 않습니다.' : 'Database is not configured.');
      return false;
    }
    return true;
  };

  const [showUpdates, setShowUpdates] = useState(false);
  const [hasUnreadUpdates, setHasUnreadUpdates] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seenVersion = localStorage.getItem(UPDATES_READ_KEY);
    setHasUnreadUpdates(seenVersion !== UPDATES_VERSION);
  }, []);

  const openUpdatesModal = () => {
    setShowUpdates(true);
    setHasUnreadUpdates(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(UPDATES_READ_KEY, UPDATES_VERSION);
    }
  };

  const updates = [
    {
      date: '2026.02.14',
      title: language === 'ko' ? '난이도 곡선/이벤트 밸런싱 업데이트' : 'Difficulty Curve & Event Balancing Update',
      content: language === 'ko'
        ? '초반(80일 이전) 생존 난이도를 소폭 완화하고, 100일 이후부터는 단계적으로 난이도가 상승하도록 조정했습니다. 100일 전조 이벤트와 다음 일차까지 영향을 남기는 공성/위협 이벤트를 추가해 후반 긴장감과 선택의 무게를 강화했습니다.'
        : 'Early survival (before day 80) has been slightly eased, while difficulty now scales up progressively after day 100. Added a day-100 omen event plus siege/threat events with next-day consequences to strengthen late-game tension and decision weight.'
    },
    {
      date: '2026.02.11',
      title: language === 'ko' ? '시뮬레이션 대규모 업데이트' : 'Simulation Major Update',
      content: language === 'ko'
        ? '정신(MIND) 이벤트 분리, 습격/비전투 분류 정비, 대성공 판정 및 확률 반올림 적용, 탈출 준비/출발 UX 개선, 단축키(1~0/→/Enter) 추가 등 다양한 개선이 반영되었습니다.'
        : 'Separated MIND events, refined danger/noncombat categories, added great-success rolls with rounded chances, improved evacuation/launch UX, and added shortcuts (1–0/→/Enter).'
    },
    {
      date: '2024.02.08',
      title: language === 'ko' ? '최대 체력 상향 및 도움말 시스템 추가' : 'Max HP Increase & Help System',
      content: language === 'ko'
        ? '기본/최대 체력이 10/20으로 증가했으며, 게임의 상세 규칙과 정보를 확인할 수 있는 도움말 시스템이 추가되었습니다.'
        : 'Base/Max HP increased to 10/20. Added Help system for detailed game rules and info.'
    },
    {
      date: '2024.02.08',
      title: language === 'ko' ? '실시간 채팅 기능 추가' : 'Real-time Chat Added',
      content: language === 'ko'
        ? '리더보드에서 다른 정착민들과 실시간으로 대화할 수 있습니다. 최근 30개 메시지만 표시됩니다.'
        : 'Chat with other settlers in real-time on the leaderboard. Only the last 30 messages are shown.'
    },
    {
      date: '2024.02.08',
      title: language === 'ko' ? '멘탈 관련 이벤트 및 전용 선택지' : 'Mental Events & Special Choices',
      content: language === 'ko'
        ? '이별, 반려동물의 죽음 등 멘탈 관련 이벤트가 추가되었으며, 철의 의지나 사이코패스 특성 보유 시 전용 선택지가 나타납니다.'
        : 'Added mental-state events like breakups and pet deaths, with special choices for Iron Willed and Psychopath traits.'
    },
    {
      date: '2024.02.08',
      title: language === 'ko' ? '난이도 곡선 조절 (Danger 30%)' : 'Difficulty Adjusted (Danger 30%)',
      content: language === 'ko'
        ? '후반부 위협 발생 확률을 최대 50%에서 30%로 하향 조정하여 생존 가능성을 높였습니다.'
        : 'Reduced late-game danger probability from 50% to 30% for better survival.'
    },
    {
      date: '2024.02.08',
      title: language === 'ko' ? '조용한 날 기술 체크 도입' : 'Quiet Day Skill Checks',
      content: language === 'ko'
        ? '조용한 날의 자원 획득이 확정에서 기술 레벨 기반 확률(성공 시 +1)로 변경되었습니다.'
        : 'Guaranteed resource gain on quiet days replaced by skill-based success chances.'
    },
    {
      date: '2024.02.08',
      title: language === 'ko' ? '60일 난이도 곡선 도입' : '60-Day Difficulty Curve',
      content: language === 'ko'
        ? '시뮬레이션 진행도에 따라 습격 및 위험 확률이 최대 5배까지 동적으로 증가합니다.'
        : 'Raid and danger probabilities increase up to 5x based on progress.'
    },
    {
      date: '2024.02.08',
      title: language === 'ko' ? '리더보드 상세 스탯 기록' : 'Detailed Leaderboard Stats',
      content: language === 'ko'
        ? '리더보드에서 캐릭터의 특성, 기술, MBTI 등 상세 정보를 확인할 수 있습니다.'
        : 'View trait, skill, and MBTI details for ranked settlers.'
    },
    {
      date: '2024.02.07',
      title: language === 'ko' ? '리더보드 가독성 개선' : 'Leaderboard UI Overhaul',
      content: language === 'ko'
        ? '리더보드 디자인이 더욱 림월드 스타일로 개선되었습니다.'
        : 'Improved leaderboard UI with RimWorld-style aesthetics.'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-10 sm:space-y-12 animate-fade-in-up relative">
      {/* Update Notification Bell */}
      <div className="fixed bottom-4 right-4 sm:bottom-auto sm:top-20 sm:right-6 z-40">
        <button
          onClick={openUpdatesModal}
          className="relative p-3 bg-[#111] border border-[#333] hover:border-[#9f752a] text-[#9f752a] transition-all group overflow-hidden shadow-lg"
        >
          <div className="absolute inset-0 bg-[#9f752a]/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
          <svg className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 4.36 6 6.92 6 10v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          {hasUnreadUpdates && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border border-[#111] animate-pulse"></span>
          )}
        </button>
      </div>

      {/* Updates Modal */}
      {showUpdates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1b1b1b] border border-[#6b6b6b] p-1 shadow-2xl w-full max-w-md">
            <div className="bg-[#2b2b2b] border-b border-[#6b6b6b] p-4 flex justify-between items-center">
              <h2 className="text-[#e2c178] font-bold tracking-widest text-sm uppercase">
                {language === 'ko' ? '업데이트 소식' : 'Latest Updates'}
              </h2>
              <button
                onClick={() => setShowUpdates(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#111]/50">
              {updates.map((up, i) => (
                <div key={i} className="border-l-2 border-[#9f752a] pl-3 py-1">
                  <div className="text-[10px] text-slate-500 font-mono mb-1">{up.date}</div>
                  <div className="text-sm font-bold text-slate-200 mb-1">{up.title}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{up.content}</div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-[#111] text-center">
              <button
                onClick={() => setShowUpdates(false)}
                className="px-6 py-2 bg-[#2a2a2a] border border-[#444] text-xs font-bold text-slate-300 hover:bg-[#333] transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
      <section className="text-center space-y-6">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-[var(--font-display)] font-bold text-[var(--rimworld-highlight)] tracking-wider uppercase drop-shadow-md">
          {t('app_title')}
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mb-8 max-w-xl sm:max-w-2xl mx-auto whitespace-pre-line leading-relaxed">
          {t('landing_subtitle')}
        </p>


        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <a
            href="/test/intro"
            className="inline-block w-full sm:w-auto px-8 sm:px-12 py-4 bg-[#8b5a2b] hover:bg-[#a06b35] text-white font-bold text-base sm:text-lg shadow-[0_4px_0_#5a3a1a] active:shadow-none active:translate-y-1 transition-all border border-[#5a3a1a]"
          >
            {t('start_test')}
          </a>
          <button
            onClick={async (e) => {
              e.preventDefault();
              const ok = await requireLogin();
              if (ok) {
                window.location.assign('/settlers');
              }
            }}
            className="inline-block w-full sm:w-auto px-8 py-4 bg-[#1c3d5a] hover:bg-[#2c5282] border-[#102a43] text-white font-bold text-base sm:text-lg shadow-[0_4px_0_#2a2a2a] active:shadow-none active:translate-y-1 transition-all border cursor-pointer"
          >
            {language === 'ko' ? '시뮬레이션 시작' : 'Start Simulation'}
          </button>
          <a
            href="/leaderboard"
            className="inline-block w-full sm:w-auto px-8 py-4 bg-[#2d6a4f] hover:bg-[#40916c] border-[#1b4332] text-white font-bold text-base sm:text-lg shadow-[0_4px_0_#0d1f17] active:shadow-none active:translate-y-1 transition-all border"
          >
            {language === 'ko' ? '리더보드 보기' : 'View Leaderboard'}
          </a>
        </div>
        {worldSimEnabled ? (
          <div className="w-full sm:w-auto">
            <a
              href="/simulation/world"
              className="inline-block w-full sm:w-auto px-8 py-3 bg-[#234f68] hover:bg-[#2e6a8a] border-[#163649] text-white font-bold text-sm sm:text-base shadow-[0_4px_0_#14232d] active:shadow-none active:translate-y-1 transition-all border"
            >
              {language === 'ko' ? '전체 투표 모드 (30분 턴)' : 'Global Vote Mode (30m Turn)'}
            </a>
          </div>
        ) : (
          <div className="w-full sm:w-auto">
            <div className="inline-block w-full sm:w-auto px-8 py-3 bg-[#1a1f24] border-[#2d3640] text-gray-400 font-bold text-sm sm:text-base border cursor-not-allowed">
              {language === 'ko' ? '전체 투표 모드 (임시 비활성화)' : 'Global Vote Mode (Temporarily Disabled)'}
            </div>
          </div>
        )}
        <div id="login-section" className="mt-6 w-full max-w-md mx-auto bg-[#111] border border-[#333] p-3 sm:p-4 text-left space-y-3">
          <div className="text-sm font-bold text-[#9f752a] font-[var(--font-display)]">
            {language === 'ko' ? '정착민 로그인' : 'Settler Login'}
          </div>
          {accountId ? (
            <div className="space-y-2 text-xs text-gray-300">
              <div>
                {language === 'ko' ? '로그인됨' : 'Logged in'}: <span className="text-white font-bold">{accountId}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white border border-gray-600 text-xs"
                >
                  {language === 'ko' ? '로그아웃' : 'Logout'}
                </button>
                <button
                  onClick={() => router.push('/account/settings')}
                  className="px-4 py-2 bg-[#1c3d5a] hover:bg-[#2c5282] text-white border border-blue-900 text-xs"
                >
                  {language === 'ko' ? '계정 정보' : 'Account Settings'}
                </button>
              </div>
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
                {language === 'ko' ? '로그인' : 'Login'}
              </button>
              <a
                href="/signup"
                className="block text-center text-xs text-[#9f752a] hover:text-[#e2c178] underline"
              >
                {language === 'ko' ? '가입하기' : 'Sign up'}
              </a>
            </div>
          )}
          {loginMessage && (
            <div className="text-xs text-gray-400">{loginMessage}</div>
          )}
        </div>
        <VisitorCounter />
      </section>

      {/* Theme Section: Skills & Traits */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 w-full max-w-4xl mt-10 sm:mt-12">
        {/* Traits Panel */}
        <div className="bg-[var(--rimworld-panel)] p-4 sm:p-6 border border-[var(--rimworld-border)] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--rimworld-border)] opacity-50"></div>
          <h2 className="text-xl sm:text-2xl font-[var(--font-display)] font-bold mb-4 text-[var(--rimworld-highlight)] flex items-center">
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
        <div className="bg-[var(--rimworld-panel)] p-4 sm:p-6 border border-[var(--rimworld-border)] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--rimworld-border)] opacity-50"></div>
          <h2 className="text-xl sm:text-2xl font-[var(--font-display)] font-bold mb-4 text-[var(--rimworld-highlight)] flex items-center">
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
      <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 text-xs sm:text-sm text-[#9f752a] font-medium mt-12 sm:mt-16 bg-[#111] p-3 border border-[#333] inline-block mx-auto rounded opacity-80 hover:opacity-100 transition-opacity">
        <span>⏱ {t('estimated_time')}</span>
        <span className="hidden md:inline text-gray-600"> | </span>
        <span>📝 {t('questions_count')}</span>
      </div>
    </div>
  );
}
