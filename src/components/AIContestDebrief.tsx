import React, { useState } from 'react';
import { RatingChange } from '../types';
import { Button } from './ui/Button';
import {
    Trophy,
    Loader2,
    Sparkles,
    TrendingUp,
    TrendingDown,
    Minus,
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ContestDebriefProps {
    ratingHistory: RatingChange[];
    currentRating: number;
    handle: string;
}

interface DebriefData {
    trend: 'rising' | 'falling' | 'volatile' | 'stable';
    summary: string;
    topWin: string;
    keyLesson: string;
    nextAction: string;
}

function computeTrend(deltas: number[]): DebriefData['trend'] {
    if (deltas.length < 2) return 'stable';
    const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const positives = deltas.filter((d) => d > 0).length;
    const volatility = Math.max(...deltas) - Math.min(...deltas);

    if (volatility > 300) return 'volatile';
    if (avg > 20) return 'rising';
    if (avg < -20) return 'falling';
    return 'stable';
}

function generateFallbackDebrief(
    ratingHistory: RatingChange[],
    currentRating: number,
    handle: string,
): DebriefData {
    const recent = ratingHistory.slice(-5);
    const deltas = recent.map((r) => r.newRating - r.oldRating);
    const trend = computeTrend(deltas);
    const best = Math.max(...deltas);
    const bestContest = recent.find((r) => r.newRating - r.oldRating === best);
    const avgDelta = Math.round(
        deltas.reduce((a, b) => a + b, 0) / deltas.length,
    );

    const trendMessages: Record<DebriefData['trend'], string> = {
        rising: `${handle}'s last ${recent.length} contests show a positive trend (+${avgDelta} avg). Keep the momentum going.`,
        falling: `${handle}'s last ${recent.length} contests trend downward (${avgDelta} avg). A recalibration is needed.`,
        volatile: `${handle}'s performance is highly volatile — swinging between ${Math.min(...deltas)} and +${Math.max(...deltas)}. Consistency is the missing piece.`,
        stable: `${handle}'s rating has been stable across the last ${recent.length} contests (${avgDelta} avg delta). Time to push harder.`,
    };

    const topWinMessages: Record<DebriefData['trend'], string> = {
        rising: `Best result: +${best} in ${bestContest?.contestName ?? 'a recent contest'} — you clearly performed well under pressure.`,
        falling: `Your best recent result was +${Math.max(...deltas, 0)} — that performance shows you're capable of improvement.`,
        volatile: `Your peak was +${best} — you have the skill. Channel that into more consistent execution.`,
        stable: `You've maintained your rating well. Now it's time to be aggressive and target harder problems.`,
    };

    const lessonMessages: Record<DebriefData['trend'], string> = {
        rising: 'Your upsolving habits are paying off. Don\u2019t break the streak.',
        falling:
            'Review your last 3 failed contests \u2014 are you spending too long on one problem early?',
        volatile:
            'Time management during contests is your biggest lever. Practice under strict time limits.',
        stable: 'Break out of the comfort zone \u2014 register for Div 2 contests and target problems B/C.',
    };

    const actionMessages: Record<DebriefData['trend'], string> = {
        rising: `Aim for ${currentRating + 100} in the next 2 contests by solving one harder problem each round.`,
        falling: `Stabilize first: target problems at ${currentRating - 100}–${currentRating + 50} to rebuild confidence.`,
        volatile: `In your next 3 contests, stop working on C if A+B aren't solved cleanly within 30 minutes.`,
        stable: `Register for the next Div 2 and commit to attempting problem C regardless of difficulty.`,
    };

    return {
        trend,
        summary: trendMessages[trend],
        topWin: topWinMessages[trend],
        keyLesson: lessonMessages[trend],
        nextAction: actionMessages[trend],
    };
}

export function AIContestDebrief({
    ratingHistory,
    currentRating,
    handle,
}: ContestDebriefProps) {
    const [loading, setLoading] = useState(false);
    const [debrief, setDebrief] = useState<DebriefData | null>(null);

    const recentContests = ratingHistory.slice(-5);
    const deltas = recentContests.map((r) => r.newRating - r.oldRating);

    const generate = async () => {
        setLoading(true);
        try {
            const contestSummary = recentContests
                .map(
                    (r, i) =>
                        `${i + 1}. ${r.contestName}: ${r.oldRating} → ${r.newRating} (${r.newRating - r.oldRating > 0 ? '+' : ''}${r.newRating - r.oldRating}, rank #${r.rank})`,
                )
                .join('\n');

            const prompt = `
You are a competitive programming coach. Analyze this Codeforces user's last ${recentContests.length} contests and provide a brief debrief.

User: ${handle} (current rating: ${currentRating})
Last ${recentContests.length} contests:
${contestSummary}

Return ONLY a JSON object with these fields:
- "trend": one of ["rising", "falling", "volatile", "stable"]
- "summary": 1-2 sentences summarizing the overall trend
- "topWin": 1 sentence about their best performance or a positive signal
- "keyLesson": 1 sentence: the most important lesson from these contests
- "nextAction": 1 sentence: the single most impactful thing they should do next
`;

            const result = await GeminiService.customPrompt(prompt);
            if (
                Array.isArray(result) &&
                result.length > 0 &&
                result[0].summary
            ) {
                setDebrief(result[0]);
            } else if (
                result &&
                typeof result === 'object' &&
                !Array.isArray(result)
            ) {
                setDebrief(result as DebriefData);
            } else {
                setDebrief(
                    generateFallbackDebrief(
                        ratingHistory,
                        currentRating,
                        handle,
                    ),
                );
            }
        } catch {
            setDebrief(
                generateFallbackDebrief(ratingHistory, currentRating, handle),
            );
        } finally {
            setLoading(false);
        }
    };

    if (recentContests.length === 0) return null;

    const trendConfig = {
        rising: {
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            label: 'Rising',
        },
        falling: {
            icon: TrendingDown,
            color: 'text-red-400',
            bg: 'bg-red-500/10 border-red-500/20',
            label: 'Falling',
        },
        volatile: {
            icon: TrendingUp,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10 border-orange-500/20',
            label: 'Volatile',
        },
        stable: {
            icon: Minus,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20',
            label: 'Stable',
        },
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-yellow-400" />
                    <p className="text-[10px] font-mono font-bold text-muted-app uppercase tracking-[0.2em]">
                        Contest Debrief
                    </p>
                </div>
                {!debrief && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={generate}
                        disabled={loading}
                        className="text-[9px] uppercase font-black tracking-widest gap-1.5 h-7"
                    >
                        {loading ? (
                            <Loader2 size={10} className="animate-spin" />
                        ) : (
                            <Sparkles size={10} />
                        )}
                        {loading ? 'Analyzing...' : 'Generate'}
                    </Button>
                )}
                {debrief && (
                    <button
                        onClick={() => setDebrief(null)}
                        className="text-[9px] text-muted-app/40 hover:text-muted-app transition-colors uppercase tracking-widest"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Recent deltas preview */}
            <div className="flex gap-1.5 mb-4">
                {deltas.map((d, i) => (
                    <div
                        key={i}
                        className={cn(
                            'flex-1 text-center rounded-lg py-1.5 text-[10px] font-black border',
                            d > 0
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : d < 0
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                  : 'bg-white/5 border-white/10 text-muted-app/50',
                        )}
                        title={recentContests[i]?.contestName}
                    >
                        {d > 0 ? '+' : ''}
                        {d}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {!debrief && (
                    <motion.p
                        key="hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[9px] text-muted-app/40 text-center"
                    >
                        Last {recentContests.length} contest deltas shown above.
                        Generate an AI debrief for actionable insights.
                    </motion.p>
                )}

                {debrief && (
                    <motion.div
                        key="debrief"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2.5"
                    >
                        {/* Trend badge */}
                        {(() => {
                            const cfg =
                                trendConfig[debrief.trend] ??
                                trendConfig.stable;
                            const Icon = cfg.icon;
                            return (
                                <div
                                    className={cn(
                                        'flex items-center gap-2 rounded-xl px-3 py-2 border',
                                        cfg.bg,
                                    )}
                                >
                                    <Icon size={12} className={cfg.color} />
                                    <span
                                        className={cn(
                                            'text-[9px] font-black uppercase tracking-widest',
                                            cfg.color,
                                        )}
                                    >
                                        {cfg.label} Trajectory
                                    </span>
                                </div>
                            );
                        })()}

                        <div className="space-y-2">
                            {[
                                { label: 'Overview', text: debrief.summary },
                                { label: 'Best Signal', text: debrief.topWin },
                                {
                                    label: 'Key Lesson',
                                    text: debrief.keyLesson,
                                },
                                {
                                    label: 'Next Action',
                                    text: debrief.nextAction,
                                },
                            ].map((item, i) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="bg-white/3 rounded-lg px-3 py-2 border border-white/5"
                                >
                                    <p className="text-[8px] font-black text-muted-app/40 uppercase tracking-widest mb-1">
                                        {item.label}
                                    </p>
                                    <p className="text-[10px] text-muted-app leading-relaxed">
                                        {item.text}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
