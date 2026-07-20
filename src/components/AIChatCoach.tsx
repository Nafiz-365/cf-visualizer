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

function buildSystemContext(user: User, analytics: any, ratingHistory: any[]) {
    const recentDeltas = ratingHistory
        .slice(-5)
        .map((r: any) => r.newRating - r.oldRating)
        .join(', ');
    return `
You are a helpful, friendly AI assistant — like Gemini or ChatGPT. You can discuss ANY topic the user brings up: coding, math, science, life advice, general knowledge, creative writing, or anything else.

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

Be conversational, helpful, and concise. If the topic is not about competitive programming, just answer naturally like a general AI assistant.
`.trim();
}

function generateFallbackResponse(
    question: string,
    user: User,
    analytics: any,
): string {
    const q = question.toLowerCase();
    const rating = user.rating ?? 800;
    const bestTag = analytics?.bestTag ?? 'implementation';
    const accuracy = analytics?.accuracy ?? 0;
    const avgDiff = analytics?.avgDifficulty ?? 800;

    // General knowledge fallbacks
    if (
        q.includes('bfs') ||
        q.includes('dfs') ||
        q.includes('breadth') ||
        q.includes('depth')
    ) {
        return `BFS (Breadth-First Search) explores nodes level by level using a queue — great for finding the shortest path in unweighted graphs. DFS (Depth-First Search) uses a stack (or recursion) to go as deep as possible first — useful for cycle detection, topological sort, and backtracking problems.`;
    }
    if (
        q.includes('big-o') ||
        q.includes('bigo') ||
        q.includes('complexity') ||
        q.includes('time complexity')
    ) {
        return `Big-O notation describes how an algorithm's runtime grows relative to input size. O(1) is constant, O(log n) is logarithmic (like binary search), O(n) is linear, O(n²) is quadratic (like bubble sort), and O(2ⁿ) is exponential. Always aim for the lowest Big-O you can achieve.`;
    }
    if (
        q.includes('dynamic programming') ||
        q.includes(' dp ') ||
        q.includes('memoization')
    ) {
        return `Dynamic Programming solves complex problems by breaking them into overlapping subproblems and storing results to avoid redundant work. The key insight is: if a problem has "optimal substructure" and "overlapping subproblems," DP applies. Start by defining the state, then find the recurrence relation.`;
    }
    if (
        q.includes('motivat') ||
        q.includes('give up') ||
        q.includes('inspire')
    ) {
        return `Every expert was once a beginner who didn't quit. Rating drops are part of the journey — what separates those who improve from those who don't is what they do the day after a bad contest. Keep solving, keep upsolving, and trust the process.`;
    }
    if (
        q.includes('consistent') ||
        q.includes('habit') ||
        q.includes('routine')
    ) {
        return `Consistency beats intensity. Solving 2-3 problems daily for a month beats a 10-hour grind once a week. Set a specific time each day, even if it's just 30 minutes, and protect that time. Progress compounds.`;
    }
    if (
        q.includes('fun fact') ||
        q.includes('interesting') ||
        q.includes('trivia')
    ) {
        return `Fun fact: The first "bug" in computing was a literal bug — a moth found trapped in a relay of the Harvard Mark II computer in 1947. Grace Hopper's team taped it into their log book with the note "First actual case of bug being found." The term "debugging" stuck.`;
    }

    // CF-specific fallbacks
    if (
        q.includes('focus') ||
        q.includes('next rank') ||
        q.includes('improve')
    ) {
        return `To reach the next rank from ${rating}, concentrate on problems rated ${rating + 100}–${Math.min(rating + 300, 3500)}. Your strongest tag is "${bestTag}" — use it as a springboard to explore adjacent algorithms.`;
    }
    if (q.includes('weak') || q.includes('worst') || q.includes('struggle')) {
        return `Based on your average solved difficulty of ${avgDiff} vs your rating of ${rating}, you may be avoiding harder problems. Try dedicating 3 sessions/week to problems rated ${avgDiff + 100}–${avgDiff + 300}.`;
    }
    if (
        q.includes('stagnate') ||
        q.includes('stuck') ||
        q.includes('plateau')
    ) {
        return `Rating stagnation often comes from solving too many comfort-zone problems. With ${accuracy}% accuracy, your instincts are solid. After each contest, upsolve the hardest problem you couldn't finish.`;
    }
    if (q.includes('contest') || q.includes('performance')) {
        return `At rating ${rating}, aim to solve the first 2 problems in under 20 minutes each. Practice speed on problems rated ${Math.max(800, rating - 300)}–${rating - 100} to build fluency.`;
    }
    if (
        q.includes('plan') ||
        q.includes('week') ||
        q.includes('schedule') ||
        q.includes('training')
    ) {
        return `2-week plan: Days 1–3: upsolve 2 problems above your rating. Days 4–5: virtual contest. Days 6–7: review failed attempts. Target "${bestTag}" plus one new topic per week.`;
    }

    // Generic fallback
    return `I'm your AI assistant — I can help with competitive programming, general coding concepts, or anything else on your mind! Your CF profile shows ${analytics?.totalSolved ?? 0} problems solved at rating ${rating}. Ask me anything.`;
}

export function AIChatCoach({
    user,
    submissions,
    analytics,
    ratingHistory,
}: AIChatCoachProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Hey ${user.handle}! I'm your AI assistant — I know your Codeforces profile (${analytics?.totalSolved ?? 0} solved, rated ${user.rating ?? 'N/A'}), but feel free to ask me about anything: coding, algorithms, general knowledge, or just have a chat. What's on your mind?`,
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
            analytics,
            ratingHistory,
        );
        const prompt = `${systemContext}\n\nUser says: "${messageText}"\n\nRespond naturally and helpfully. If the question is about competitive programming, use their profile stats. If it's about anything else, answer like a knowledgeable general AI assistant. Write in plain conversational text (no JSON, no markdown bullet lists).`;

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
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-secondary/20 border border-brand-secondary/20 flex items-center justify-center">
                        <Bot size={13} className="text-brand-secondary" />
                    </div>
                    <div>
                        <p className="text-[10px] text-brand-secondary font-black uppercase tracking-widest leading-none">
                            AI Coach Chat
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[9px] text-muted-app/60">
                                Online
                            </span>
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="text-[9px] h-7 gap-1.5 opacity-30 hover:opacity-100 transition-opacity"
                >
                    <RefreshCw size={10} />
                    Clear
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18 }}
                            className={cn(
                                'flex gap-2',
                                msg.role === 'user'
                                    ? 'justify-end'
                                    : 'justify-start',
                            )}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-6 h-6 rounded-full bg-brand-secondary/15 border border-brand-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <Bot
                                        size={10}
                                        className="text-brand-secondary"
                                    />
                                </div>
                            )}
                            <div
                                className={cn(
                                    'max-w-[80%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed',
                                    msg.role === 'user'
                                        ? 'bg-brand-secondary/20 text-text-app rounded-tr-sm font-medium'
                                        : 'bg-white/5 text-muted-app border border-white/5 rounded-tl-sm',
                                )}
                            >
                                {msg.content}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-6 h-6 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <UserIcon
                                        size={10}
                                        className="text-muted-app/60"
                                    />
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {isLoading && (
                        <motion.div
                            key="typing"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2 justify-start"
                        >
                            <div className="w-6 h-6 rounded-full bg-brand-secondary/15 border border-brand-secondary/20 flex items-center justify-center shrink-0">
                                <Bot
                                    size={10}
                                    className="text-brand-secondary"
                                />
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-muted-app/40 animate-bounce"
                                        style={{
                                            animationDelay: `${i * 0.15}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested questions */}
            {messages.length <= 2 && !isLoading && (
                <div className="mb-3 shrink-0">
                    <p className="text-[9px] text-muted-app/30 uppercase tracking-widest font-bold mb-1.5">
                        Try asking
                    </p>
                    <div className="flex flex-col gap-1">
                        {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                            <button
                                key={q}
                                onClick={() => sendMessage(q)}
                                className="text-left text-[10px] text-muted-app/60 border border-white/5 rounded-lg px-3 py-1.5 hover:border-brand-secondary/30 hover:text-brand-secondary hover:bg-brand-secondary/5 transition-all flex items-center gap-2 group"
                            >
                                <ChevronRight
                                    size={9}
                                    className="opacity-40 group-hover:opacity-100 shrink-0"
                                />
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="flex gap-2 shrink-0">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask your coach anything..."
                    disabled={isLoading}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-[11px] text-text-app placeholder:text-muted-app/30 focus:outline-none focus:border-brand-secondary/40 transition-colors disabled:opacity-40"
                />
                <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="h-10 w-10 rounded-xl bg-brand-secondary/20 border border-brand-secondary/20 flex items-center justify-center text-brand-secondary hover:bg-brand-secondary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                    {isLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Send size={14} />
                    )}
                </button>
            </div>
        </div>
    );
}
