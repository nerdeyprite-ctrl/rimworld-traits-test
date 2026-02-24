"use client";

import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

type ChatMessage = {
    id: number;
    created_at: string;
    account_id: string;
    message: string;
    room?: string | null;
};

const MAX_MESSAGES = 30;

type ChatBoxProps = {
    room?: string;
    title?: string;
};

export default function ChatBox({ room = 'lobby', title }: ChatBoxProps) {
    const { language } = useLanguage();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [accountId, setAccountId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isConfigured, setIsConfigured] = useState(false);
    const [schemaError, setSchemaError] = useState<string | null>(null);

    useEffect(() => {
        setIsConfigured(isSupabaseConfigured());

        // 초기 로드
        const updateAccountId = () => {
            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem('settler_account_id');
                setAccountId(stored);
            }
        };

        updateAccountId();

        // localStorage 변경 감지
        window.addEventListener('storage', updateAccountId);
        // 같은 탭에서의 변경 감지를 위한 커스텀 이벤트
        window.addEventListener('accountIdChanged', updateAccountId);

        return () => {
            window.removeEventListener('storage', updateAccountId);
            window.removeEventListener('accountIdChanged', updateAccountId);
        };
    }, []);

    useEffect(() => {
        if (!isConfigured) return;
        setSchemaError(null);

        // 초기 메시지 로드
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('room', room)
                .order('created_at', { ascending: false })
                .limit(MAX_MESSAGES);

            if (error) {
                const msg = String(error.message ?? '');
                if (msg.includes('room')) {
                    setSchemaError(
                        language === 'ko'
                            ? "채팅 room 컬럼이 없습니다. `supabase/chat_messages_room.sql`을 실행하세요."
                            : "Missing chat room column. Run `supabase/chat_messages_room.sql`."
                    );
                } else {
                    console.error('Failed to load chat messages:', error);
                }
                return;
            }

            if (data) {
                setMessages(data.reverse());
            }
        };

        fetchMessages();

        // Realtime 구독
        const channel = supabase
            .channel(`chat_messages_channel_${room}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `room=eq.${room}`
                },
                (payload) => {
                    setMessages((prev) => {
                        const newMessages = [...prev, payload.new as ChatMessage];
                        // 30줄 제한
                        if (newMessages.length > MAX_MESSAGES) {
                            return newMessages.slice(-MAX_MESSAGES);
                        }
                        return newMessages;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isConfigured, room, language]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !accountId || loading || schemaError) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert([
                    {
                        account_id: accountId,
                        message: inputMessage.trim(),
                        room
                    }
                ]);

            if (!error) {
                setInputMessage('');
            } else {
                console.error('Failed to send message:', error);
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isConfigured) {
        return (
            <div className="bg-[#111] border border-[#333] p-4 text-center text-slate-500 text-xs">
                {language === 'ko' ? '채팅 기능을 사용할 수 없습니다.' : 'Chat unavailable'}
            </div>
        );
    }

    const headerTitle = title
        ?? (room === 'world'
            ? (language === 'ko' ? '전체투표 채팅' : 'Global Vote Chat')
            : (language === 'ko' ? '정착민 채팅' : 'Settler Chat'));

    const headerSubtitle = room === 'world'
        ? (language === 'ko' ? '월드 투표 참여자 전용 채팅' : 'World vote participants only')
        : (language === 'ko' ? '최근 30개 메시지만 표시됩니다' : 'Last 30 messages only');

    return (
        <div className="bg-[#111] border border-[#333] flex flex-col h-[600px]">
            {/* Header */}
            <div className="bg-[#1a1a1a] border-b border-[#333] p-3">
                <h3 className="text-xs font-bold text-[#9f752a] uppercase tracking-widest">
                    💬 {headerTitle}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                    {headerSubtitle}
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {schemaError && (
                    <div className="bg-[#2a1313] border border-[#7a2a2a] text-red-200 text-xs p-2">
                        {schemaError}
                    </div>
                )}
                {messages.length === 0 ? (
                    <div className="text-center py-10 text-slate-600 text-xs italic">
                        {language === 'ko' ? '아직 메시지가 없습니다.' : 'No messages yet.'}
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="bg-[#1a1a1a] border border-[#222] p-2 hover:border-[#333] transition-colors">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-[10px] font-bold text-[#e2c178] uppercase font-mono">
                                    {msg.account_id}
                                </span>
                                <span className="text-[9px] text-slate-600 font-mono">
                                    {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                    })}
                                </span>
                            </div>
                            <div className="text-xs text-slate-300 break-words leading-relaxed">
                                {msg.message}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <div className="border-t border-[#333] p-3">
                {accountId ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={language === 'ko' ? '메시지 입력...' : 'Type message...'}
                            maxLength={200}
                            disabled={loading || !!schemaError}
                            className="flex-1 bg-black/50 border border-[#444] p-2 text-white text-xs focus:border-[#9f752a] focus:outline-none disabled:opacity-50"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={loading || !inputMessage.trim() || !!schemaError}
                            className="px-4 py-2 bg-[#6e4e1e] hover:bg-[#856026] border border-[#9f752a] text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {language === 'ko' ? '전송' : 'Send'}
                        </button>
                    </div>
                ) : (
                    <div className="text-center text-xs text-slate-500 italic">
                        {language === 'ko' ? '채팅하려면 로그인하세요.' : 'Login to chat.'}
                    </div>
                )}
            </div>
        </div>
    );
}
