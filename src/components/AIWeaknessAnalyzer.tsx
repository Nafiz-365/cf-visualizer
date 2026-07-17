import React, { useState, useMemo } from 'react';
import { Submission } from '../types';
import { Button } from './ui/Button';
import {
    AlertTriangle,
    Loader2,
    Sparkles,
    TrendingDown,
    XCircle,
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface WeaknessEntry {
    tag: string;
    attempts: number;
    solved: number;
    solveRate: number;
    advice: string;
}

interface AIWeaknessAnalyzerProps {
    submissions: Submission[];
    analytics: any;
    currentRating: number;
}

function computeTagStats(
    submissions: Submission[],
): { tag: string; attempts: number; solved: number; solveRate: number }[] {
    const tagMap: Record<string, { attempts: number; solved: number }> = {};

    submissions.forEach((s) => {
        s.problem.tags.forEach((tag) => {
            if (!tagMap[tag]) tagMap[tag] = { attempts: 0, solved: 0 };
            tagMap[tag].attempts++;
            if (s.verdict === 'OK') tagMap[tag].solved++;
        });
    });

    return Object.entries(tagMap)
        .map(([tag, stats]) => ({
            tag,
            attempts: stats.attempts,
            solved: stats.solved,
            solveRate:
                stats.attempts > 0
                    ? Math.round((stats.solved / stats.attempts) * 100)
                    : 0,
        }))
        .filter((t) => t.attempts >= 3) // Only meaningful tags
        .sort((a, b) => a.solveRate - b.solveRate) // Worst first
        .slice(0, 5);
}

function generateFallbackAdvice(
    tag: string,
    solveRate: number,
    currentRating: number,
): string {
    const low = Math.max(800, currentRating - 200);
    const high = currentRating + 100;
    if (solveRate < 30) {
        return `Your ${tag} solve rate is critically low. Start with fundamentals — solve 5 problems rated ${low}–${low + 200} in this tag before attempting anything harder.`;
    }
    if (solveRate < 60) {
        return `You're inconsistent with ${tag}. Practice 3–4 problems rated ${low}–${high} in focused sessions. Review editorial solutions after every failed attempt.`;
    }
    return `${tag} is a minor weakness. Solving 2–3 targeted problems rated ${high}–${high + 200} will solidify your understanding.`;
}

export function AIWeaknessAnalyzer({
    submissions,
    analytics,
    currentRating,
}: AIWeaknessAnalyzerProps) {
    const [loading, setLoading] = useState(false);
    const [weaknesses, setWeaknesses] = useState<WeaknessEntry[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const tagStats = useMemo(() => computeTagStats(submissions), [submissions]);

    const analyze = async () => {
        setLoading(true);
        setError(null);

        const topWeak = tagStats.slice(0, 5);
        const prompt = `
You are a competitive programming coach. A Codeforces user (rating: ${currentRating}) has these weak topics based on solve rates:

${topWeak.map((t) => `- ${t.tag}: ${t.solved}/${t.attempts} solved (${t.solveRate}% rate)`).join('\n')}

For each topic, provide ONE specific, actionable sentence of advice (max 20 words). Return ONLY a JSON array of objects with:
- "tag": the topic name (exact match from input)
- "advice": your specific coaching advice string
`;

        try {
            const result = await GeminiService.customPrompt(prompt);
            const merged: WeaknessEntry[] = topWeak.map((t) => {
                const ai = Array.isArray(result)
                    ? result.find(
                          (r: any) =>
                              r.tag?.toLowerCase() === t.tag.toLowerCase(),
                      )
                    : null;
                return {
                    ...t,
                    advice:
                        ai?.advice ||
                        generateFallbackAdvice(
                            t.tag,
                            t.solveRate,
                            currentRating,
                        ),
                };
            });
            setWeaknesses(merged);
        } catch {
            // Full fallback
            setWeaknesses(
                topWeak.map((t) => ({
                    ...t,
                    advice: generateFallbackAdvice(
                        t.tag,
                        t.solveRate,
                        currentRating,
                    ),
                })),
            );
        } finally {
            setLoading(false);
        }
    };

    const getSolveRateColor = (rate: number) => {
        if (rate < 30) return 'text-red-400';
        if (rate < 60) return 'text-orange-400';
        return 'text-yellow-400';
    };

    const getSolveRateBg = (rate: number) => {
        if (rate < 30) return 'bg-red-500/10 border-red-500/20';
        if (rate < 60) return 'bg-orange-500/10 border-orange-500/20';
        return 'bg-yellow-500/10 border-yellow-500/20';
    };

    if (tagStats.length === 0) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingDown size={14} className="text-red-400" />
                    <p className="text-[10px] font-mono font-bold text-muted-app uppercase tracking-[0.2em]">
                        Weakness Scan
                    </p>
                </div>
                {!weaknesses && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={analyze}
                        disabled={loading}
                        className="text-[9px] uppercase font-black tracking-widest gap-1.5 h-7"
                    >
                        {loading ? (
                            <Loader2 size={10} className="animate-spin" />
                        ) : (
                            <Sparkles size={10} />
                        )}
                        {loading ? 'Scanning...' : 'Scan Now'}
                    </Button>
                )}
                {weaknesses && (
                    <button
                        onClick={() => setWeaknesses(null)}
                        className="text-[9px] text-muted-app/40 hover:text-muted-app transition-colors uppercase tracking-widest"
                    >
                        Reset
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {!weaknesses && !loading && (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-6 text-center"
                    >
                        <AlertTriangle
                            size={20}
                            className="text-orange-400/30 mb-3"
                        />
                        <p className="text-[10px] text-muted-app/50 max-w-45">
                            Scan your tag history to identify where you're
                            losing the most points.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1 justify-center max-w-60">
                            {tagStats.slice(0, 4).map((t) => (
                                <span
                                    key={t.tag}
                                    className="text-[8px] bg-white/5 border border-white/8 rounded px-1.5 py-0.5 text-muted-app/40"
                                >
                                    #{t.tag} ({t.solveRate}%)
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {weaknesses && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2.5"
                    >
                        {weaknesses.map((w, i) => (
                            <motion.div
                                key={w.tag}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className={cn(
                                    'rounded-xl p-3 border',
                                    getSolveRateBg(w.solveRate),
                                )}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-black text-text-app uppercase tracking-wide">
                                        #{w.tag}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-muted-app/50">
                                            {w.solved}/{w.attempts}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-[11px] font-black',
                                                getSolveRateColor(w.solveRate),
                                            )}
                                        >
                                            {w.solveRate}%
                                        </span>
                                    </div>
                                </div>
                                {/* Solve rate bar */}
                                <div className="h-0.5 bg-white/5 rounded-full mb-2 overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all',
                                            w.solveRate < 30
                                                ? 'bg-red-400'
                                                : w.solveRate < 60
                                                  ? 'bg-orange-400'
                                                  : 'bg-yellow-400',
                                        )}
                                        style={{ width: `${w.solveRate}%` }}
                                    />
                                </div>
                                <p className="text-[9px] text-muted-app/70 leading-relaxed">
                                    {w.advice}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
