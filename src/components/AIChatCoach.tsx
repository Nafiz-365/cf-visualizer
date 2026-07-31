import React, { useState, useRef, useEffect } from 'react';
import { User, Submission } from '../types';
import { Button } from './ui/Button';
import {
    Send,
    Bot,
    User as UserIcon,
    Sparkles,
    Loader2,
    RefreshCw,
    ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { buildCoachProfileSummary } from '../lib/coachProfile';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AIChatCoachProps {
    user: User;
    submissions: Submission[];
    analytics: any;
    ratingHistory: any[];
}

const SUGGESTED_QUESTIONS = [
    'What should I focus on to reach the next rank?',
    'Explain dynamic programming in simple terms.',
    'Write me a motivational message for competitive programming.',
    'What is the difference between BFS and DFS?',
    'How do I stay consistent with practice?',
    'Tell me a fun fact about computer science.',
    'Give me a 2-week training plan.',
    'Explain Big-O notation.',
];

function buildSystemContext(
    user: User,
    submissions: Submission[],
    analytics: any,
    ratingHistory: any[],
) {
    const recentDeltas = ratingHistory
        .slice(-5)
        .map((r: any) => r.newRating - r.oldRating)
        .join(', ');
    const profile = buildCoachProfileSummary(
        user,
        submissions,
        analytics,
        ratingHistory,
    );

    return `
You are a warm, naturally conversational AI assistant. You sound like a polished, helpful companion and write in a way that feels close to ChatGPT: clear, natural, concise, and easy to read. You are thoughtful, slightly witty when appropriate, and genuinely supportive without sounding overly formal. You can discuss any topic the user brings up: coding, math, science, life advice, general knowledge, creative writing, or anything else.

You also have full context about this user's Codeforces profile, so you can give personalized competitive programming advice when asked:
- Handle: ${user.handle}
- Rating: ${user.rating ?? 'N/A'} (Max: ${user.maxRating ?? 'N/A'})
- Rank: ${user.rank ?? 'N/A'}
- Total Solved: ${analytics?.totalSolved ?? 0}
- Accuracy: ${analytics?.accuracy ?? 0}%
- Average Difficulty Solved: ${analytics?.avgDifficulty ?? 0}
- Strongest Tag: ${analytics?.bestTag ?? 'N/A'}
- Peak Activity Hour: ${analytics?.peakHour ?? 'N/A'}
- Contest Count: ${analytics?.contestCount ?? 0}
- Rating Success Rate: ${analytics?.deltaSuccessRate ?? 0}%
- Recent Rating Deltas (last 5): ${recentDeltas || 'N/A'}
- Coach Profile Insight: ${profile.strengthSignal}
- Coach Profile Improvement: ${profile.weaknessSignal}
- Recommended Next Step: ${profile.nextStep}
- Momentum Note: ${profile.recentMomentum}

Write in a friendly, natural tone. Be encouraging, practical, and genuinely helpful. Prefer short paragraphs, clear wording, and answers that feel like a real conversation. Sound polished and confident, but not stiff. Think of the style as a modern AI assistant: smooth, concise, calm, and slightly conversational. Keep responses natural and human-like rather than overly promotional, overly formal, or overly structured. Avoid turning simple answers into long structured templates, checklists, or overly formal plans unless the user explicitly asks for a detailed study plan. If the user asks a general question, respond naturally and helpfully. If the topic is coding or competitive programming, tailor the answer to their profile with smart, relevant guidance and a smooth flow. When possible, include one concrete next step or suggestion. Let the wording feel a bit more effortless and confident, like a strong assistant who knows what they are talking about.
`.trim();
}

function generateFallbackResponse(
    question: string,
    user: User,
    submissions: Submission[],
    analytics: any,
): string {
    const q = question.toLowerCase();
    const rating = user.rating ?? 800;
    const bestTag = analytics?.bestTag ?? 'implementation';
    const accuracy = analytics?.accuracy ?? 0;
    const avgDiff = analytics?.avgDifficulty ?? 800;
    const profile = buildCoachProfileSummary(user, submissions, analytics, []);

    // General knowledge fallbacks
    if (
        q.includes('bfs') ||
        q.includes('dfs') ||
        q.includes('breadth') ||
        q.includes('depth')
    ) {
        return `BFS explores a graph level by level using a queue, which makes it great for finding the shortest path in unweighted graphs. DFS goes deeper first using a stack or recursion, and it is especially useful for cycle detection, topological sorting, and backtracking.`;
    }
    if (
        q.includes('big-o') ||
        q.includes('bigo') ||
        q.includes('complexity') ||
        q.includes('time complexity')
    ) {
        return `Big-O notation is basically a way of describing how an algorithm scales as the input grows. O(1) is constant time, O(log n) is logarithmic, O(n) is linear, O(n²) is quadratic, and O(2ⁿ) is exponential. In practice, you usually want the smallest growth rate you can get.`;
    }
    if (
        q.includes('dynamic programming') ||
        q.includes(' dp ') ||
        q.includes('memoization')
    ) {
        return `Dynamic programming is a way of solving tricky problems by breaking them into smaller pieces and remembering the results so you do not recompute them over and over. It works especially well when a problem has overlapping subproblems and an optimal structure. A good starting point is to define the state first, then figure out the recurrence.`;
    }
    if (
        q.includes('motivat') ||
        q.includes('give up') ||
        q.includes('inspire')
    ) {
        return `Every strong coder has had rough days. A bad contest does not mean you are getting worse — it usually means you are in the middle of learning. The people who improve are the ones who keep showing up, reviewing their mistakes, and trying again the next day.`;
    }
    if (
        q.includes('consistent') ||
        q.includes('habit') ||
        q.includes('routine')
    ) {
        return `Consistency usually beats intensity. Doing a little bit each day tends to help more than one huge grind once a week. Pick a regular time, even if it is only 30 minutes, and protect it. Small habits stack up faster than people expect.`;
    }
    if (
        q.includes('fun fact') ||
        q.includes('interesting') ||
        q.includes('trivia')
    ) {
        return `Fun fact: the first real computer bug was literally a bug. In 1947, a moth got trapped in the hardware of the Harvard Mark II, and the team logged it as the first actual case of a bug being found. That is where the phrase “debugging” came from.`;
    }

    // CF-specific fallbacks
    if (
        q.includes('focus') ||
        q.includes('next rank') ||
        q.includes('improve')
    ) {
        return `To move up from ${rating}, I would focus on problems in the ${rating + 100}–${Math.min(rating + 300, 3500)} range. Since your strongest tag is "${bestTag}", it is a smart idea to lean on that strength while gradually exploring nearby topics. ${profile.nextStep}`;
    }
    if (q.includes('weak') || q.includes('worst') || q.includes('struggle')) {
        return `Since your average solved difficulty is ${avgDiff} while your rating is ${rating}, you may be playing it a bit too safe. Trying three sessions a week on problems in the ${avgDiff + 100}–${avgDiff + 300} range could help you improve faster. ${profile.weaknessSignal}`;
    }
    if (
        q.includes('stagnate') ||
        q.includes('stuck') ||
        q.includes('plateau')
    ) {
        return `Stagnation often happens when you stay in your comfort zone for too long. With ${accuracy}% accuracy, your instincts are already pretty solid. After each contest, try to upsolve the hardest problem you could not finish and see what you missed. ${profile.strengthSignal}`;
    }
    if (q.includes('contest') || q.includes('performance')) {
        return `At rating ${rating}, a good target is to solve the first two problems in under 20 minutes each. Practicing on problems in the ${Math.max(800, rating - 300)}–${rating - 100} range can help you build fluency and confidence.`;
    }
    if (
        q.includes('plan') ||
        q.includes('week') ||
        q.includes('schedule') ||
        q.includes('training')
    ) {
        return `A simple 2-week plan could be: Days 1–3, upsolve two problems a bit above your level. Days 4–5, do a virtual contest. Days 6–7, review what went wrong and focus on "${bestTag}" plus one new topic. That gives you both practice and recovery. ${profile.recentMomentum}`;
    }

    // Generic fallback
    return `I am your AI assistant, and I can help with competitive programming, coding concepts, or just about anything else you want to talk through. Your Codeforces profile shows ${analytics?.totalSolved ?? 0} solved problems at rating ${rating}, so I can tailor the advice to your level too. ${profile.strengthSignal} ${profile.nextStep}`;
}

function AIChatCoachImpl({
    user,
    submissions,
    analytics,
    ratingHistory,
}: AIChatCoachProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Hey ${user.handle}! I am your AI assistant, and I can help with coding, algorithms, general knowledge, or just a casual chat. I also know your Codeforces profile (${analytics?.totalSolved ?? 0} solved, rated ${user.rating ?? 'N/A'}), so I can tailor the advice to your level. What do you want to work on?`,
            timestamp: new Date(),
        },
    ]);

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const messageText = (text ?? input).trim();
        if (!messageText || isLoading) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        const systemContext = buildSystemContext(
            user,
            submissions,
            analytics,
            ratingHistory,
        );
        const prompt = `${systemContext}\n\nUser says: "${messageText}"\n\nAnswer the user's question directly and naturally, as if you are chatting with them in a friendly, helpful way. Keep it warm, conversational, and easy to read. Use simple wording, short paragraphs, and a slightly personal tone when it fits. Sound confident, polished, and calm, like a skilled assistant that feels modern and natural. If the question is about competitive programming, use their profile stats naturally and give thoughtful advice. If it is about something else, answer like a knowledgeable general AI assistant. Avoid JSON, avoid stiff formatting, and avoid sounding robotic, overly formal, or too scripted. Keep answers compact and human-sounding rather than turning them into long, bullet-heavy plans. Make the reply feel like a helpful ChatGPT answer: direct, clear, lightly conversational, and a little more effortless.`;

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, raw: true }),
            });

            let content = '';
            if (!response.ok) {
                content = generateFallbackResponse(
                    messageText,
                    user,
                    submissions,
                    analytics,
                );
            } else {
                const data = await response.json();
                if (typeof data === 'string') {
                    content = data;
                } else if (Array.isArray(data) && data[0]?.desc) {
                    content = data.map((d: any) => d.desc).join(' ');
                } else if (typeof data === 'object' && data.text) {
                    content = data.text;
                } else {
                    content = generateFallbackResponse(
                        messageText,
                        user,
                        submissions,
                        analytics,
                    );
                }
            }

            setMessages((prev) => [
                ...prev,
                {
                    id: `ai-${Date.now()}`,
                    role: 'assistant',
                    content,
                    timestamp: new Date(),
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `ai-${Date.now()}`,
                    role: 'assistant',
                    content: generateFallbackResponse(
                        messageText,
                        user,
                        submissions,
                        analytics,
                    ),
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([
            {
                id: `welcome-${Date.now()}`,
                role: 'assistant',
                content: `Chat cleared! Still here, ${user.handle}. What would you like to work on?`,
                timestamp: new Date(),
            },
        ]);
    };

    return (
        <div className="flex flex-col h-full gap-0">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4 shrink-0 pb-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                    {/* Glowing AI orb */}
                    <div className="relative w-9 h-9 shrink-0">
                        <div className="absolute inset-0 rounded-full bg-brand-secondary/20 blur-md animate-pulse" />
                        <div className="relative w-9 h-9 rounded-full bg-linear-to-br from-brand-secondary/30 to-brand-primary/20 border border-brand-secondary/25 flex items-center justify-center shadow-[0_0_18px_rgba(157,110,245,0.25)]">
                            <Sparkles
                                size={14}
                                className="text-brand-secondary"
                            />
                        </div>
                    </div>
                    <div>
                        <p className="text-[11px] text-text-app font-bold leading-none tracking-wide">
                            AI Coach
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
                            <span className="text-[9px] text-emerald-400/70 font-bold uppercase tracking-widest">
                                Online
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={clearChat}
                    className="p-2 rounded-xl text-muted-app/40 hover:text-muted-app hover:bg-white/5 transition-all duration-200 group"
                    aria-label="Clear chat"
                >
                    <RefreshCw
                        size={13}
                        className="group-hover:rotate-180 transition-transform duration-500"
                    />
                </button>
            </div>

            {/* ── Message List ────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className={cn(
                                'flex gap-2.5 items-end',
                                msg.role === 'user'
                                    ? 'justify-end'
                                    : 'justify-start',
                            )}
                        >
                            {/* AI Avatar */}
                            {msg.role === 'assistant' && (
                                <div className="w-6 h-6 rounded-full bg-linear-to-br from-brand-secondary/40 to-brand-primary/20 border border-brand-secondary/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(157,110,245,0.2)]">
                                    <Bot
                                        size={10}
                                        className="text-brand-secondary"
                                    />
                                </div>
                            )}

                            {/* Bubble */}
                            <div
                                className={cn(
                                    'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[11.5px] leading-relaxed',
                                    msg.role === 'user'
                                        ? 'bg-linear-to-br from-brand-secondary/30 to-brand-primary/20 text-text-app rounded-br-sm border border-brand-secondary/20 shadow-[0_4px_24px_rgba(157,110,245,0.12)] font-medium'
                                        : 'bg-white/4 text-muted-app border border-white/8 rounded-bl-sm shadow-[0_2px_12px_rgba(0,0,0,0.2)] backdrop-blur-sm',
                                )}
                            >
                                {msg.content}
                                <p
                                    className={cn(
                                        'text-[8.5px] mt-1.5 opacity-30 font-mono',
                                        msg.role === 'user'
                                            ? 'text-right'
                                            : 'text-left',
                                    )}
                                >
                                    {msg.timestamp.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>

                            {/* User Avatar */}
                            {msg.role === 'user' && (
                                <div className="w-6 h-6 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shrink-0 text-[8px] font-bold text-muted-app/70 uppercase">
                                    {user.handle?.[0] ?? <UserIcon size={10} />}
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {/* Wave typing indicator */}
                    {isLoading && (
                        <motion.div
                            key="typing"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-2.5 items-end justify-start"
                        >
                            <div className="w-6 h-6 rounded-full bg-linear-to-br from-brand-secondary/40 to-brand-primary/20 border border-brand-secondary/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(157,110,245,0.2)]">
                                <Bot
                                    size={10}
                                    className="text-brand-secondary"
                                />
                            </div>
                            <div className="bg-white/4 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3.5 flex items-center gap-1 backdrop-blur-sm">
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-brand-secondary/60"
                                        style={{
                                            animation:
                                                'wave 1.2s ease-in-out infinite',
                                            animationDelay: `${i * 0.2}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* ── Suggested Questions (horizontal scroll chips) ─── */}
            {messages.length <= 2 && !isLoading && (
                <div className="mb-3 shrink-0">
                    <p className="text-[9px] text-muted-app/30 uppercase tracking-widest font-black mb-2">
                        Try asking
                    </p>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1.5">
                        {SUGGESTED_QUESTIONS.map((q) => (
                            <button
                                key={q}
                                onClick={() => sendMessage(q)}
                                className="shrink-0 text-left text-[10px] text-muted-app/70 border border-white/8 rounded-full px-3 py-1.5 hover:border-brand-secondary/40 hover:text-brand-secondary hover:bg-brand-secondary/8 transition-all whitespace-nowrap"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Input Bar ───────────────────────────────────────── */}
            <div className="flex gap-2 shrink-0 items-center">
                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask your coach anything…"
                        disabled={isLoading}
                        className="w-full bg-white/4 border border-white/10 rounded-2xl px-4 py-2.5 text-[12px] text-text-app placeholder:text-muted-app/25 focus:outline-none focus:border-brand-secondary/50 focus:shadow-[0_0_0_3px_rgba(157,110,245,0.08)] transition-all duration-200 disabled:opacity-40"
                    />
                </div>
                <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="h-10 w-10 rounded-2xl bg-linear-to-br from-brand-secondary/40 to-brand-primary/30 border border-brand-secondary/25 flex items-center justify-center text-brand-secondary hover:from-brand-secondary/60 hover:to-brand-primary/40 hover:shadow-[0_0_20px_rgba(157,110,245,0.3)] transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
                    aria-label="Send message"
                >
                    {isLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Send size={13} />
                    )}
                </button>
            </div>
        </div>
    );
}

export const AIChatCoach = React.memo(AIChatCoachImpl);
