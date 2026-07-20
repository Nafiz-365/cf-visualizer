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
    selectedContestId?: string;
    contestSubmissions?: any[];
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
    const volatility = Math.max(...deltas) - Math.min(...deltas);

    if (volatility > 300) return 'volatile';
    if (avg > 20) return 'rising';
    if (avg < -20) return 'falling';
    return 'stable';
}

function generateSingleContestFallback(
    activeContest: RatingChange,
    submissions: any[],
    handle: string,
): DebriefData {
    const delta = activeContest.newRating - activeContest.oldRating;
    const trend = delta > 0 ? 'rising' : delta < 0 ? 'falling' : 'stable';

    const solved = submissions.filter((s) => s.verdict === 'OK');
    const solvedIndices = Array.from(
        new Set(solved.map((s) => s.problem.index)),
    ).join(', ');

    return {
        trend,
        summary: `Contest performance debrief for ${activeContest.contestName}. You achieved rank #${activeContest.rank} with a rating change of ${delta > 0 ? '+' : ''}${delta}.`,
        topWin: solvedIndices
            ? `You successfully solved problem(s): ${solvedIndices} during the round.`
            : `You competed in this round, making ${submissions.length} total submission(s).`,
        keyLesson:
            'Tactical focus should be on reducing wrong submissions and improving speed on early problems.',
        nextAction:
            'Upsolve the next unsolved problem from this contest set to reinforce your skills.',
    };
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
    selectedContestId,
    contestSubmissions,
}: ContestDebriefProps) {
    const [loading, setLoading] = useState(false);
    const [debrief, setDebrief] = useState<DebriefData | null>(null);

    // Reset when selected contest changes
    React.useEffect(() => {
        setDebrief(null);
    }, [selectedContestId]);

    const activeContest = React.useMemo(() => {
        if (!selectedContestId) return null;
        return (
            ratingHistory.find(
                (h) => h.contestId.toString() === selectedContestId,
            ) || null
        );
    }, [selectedContestId, ratingHistory]);

    const isSingleMode = !!selectedContestId && !!activeContest;

    const recentContests = ratingHistory.slice(-5);
    const deltas = recentContests.map((r) => r.newRating - r.oldRating);

    const generate = async () => {
        setLoading(true);
        try {
            let prompt = '';
            if (isSingleMode && activeContest) {
                const subsSummary = (contestSubmissions || [])
                    .map(
                        (s) =>
                            `${s.problem.index} - ${s.problem.name}: ${s.verdict} (attempted ${Math.round(s.creationTimeSeconds / 60)}m into contest)`,
                    )
                    .slice(0, 20)
                    .join('\n');

                prompt = `
You are an expert competitive programming coach. Analyze this Codeforces user's performance in a single specific contest and provide a tactical debrief.

User: ${handle}
Rating change in this contest: ${activeContest.oldRating} → ${activeContest.newRating} (delta: ${activeContest.newRating - activeContest.oldRating > 0 ? '+' : ''}${activeContest.newRating - activeContest.oldRating}, rank: #${activeContest.rank})
Contest: ${activeContest.contestName}

Submissions during the contest:
${subsSummary || 'No submissions recorded during this contest.'}

Return ONLY a JSON object with these fields:
- "trend": one of ["rising", "falling", "volatile", "stable"] (reflecting this specific contest's performance and rating delta)
- "summary": 1-2 sentences summarizing their performance in this round (e.g., speed, accuracy, or where they got stuck)
- "topWin": 1 sentence highlighting their best moment (e.g., fast solve, high accuracy, or persistent attempts)
- "keyLesson": 1 sentence identifying the key area of improvement (e.g., time management, penalty, or upsolving)
- "nextAction": 1 sentence with a specific tactical next step (e.g., target specific problem levels or practice format)
`;
            } else {
                const contestSummary = recentContests
                    .map(
                        (r, i) =>
                            `${i + 1}. ${r.contestName}: ${r.oldRating} → ${r.newRating} (${r.newRating - r.oldRating > 0 ? '+' : ''}${r.newRating - r.oldRating}, rank #${r.rank})`,
                    )
                    .join('\n');

                prompt = `
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
            }

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
                if (isSingleMode && activeContest) {
                    setDebrief(
                        generateSingleContestFallback(
                            activeContest,
                            contestSubmissions || [],
                            handle,
                        ),
                    );
                } else {
                    setDebrief(
                        generateFallbackDebrief(
                            ratingHistory,
                            currentRating,
                            handle,
                        ),
                    );
                }
            }
        } catch {
            if (isSingleMode && activeContest) {
                setDebrief(
                    generateSingleContestFallback(
                        activeContest,
                        contestSubmissions || [],
                        handle,
                    ),
                );
            } else {
                setDebrief(
                    generateFallbackDebrief(
                        ratingHistory,
                        currentRating,
                        handle,
                    ),
                );
            }
        } finally {
            setLoading(false);
        }
    };

    if (recentContests.length === 0 && !isSingleMode) return null;

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
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                    <Trophy size={16} className="text-yellow-400 shrink-0" />
                    <p className="text-xs font-mono font-bold text-muted-app uppercase tracking-wider truncate">
                        Contest Debrief
                    </p>
                </div>
                {!debrief && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={generate}
                        disabled={loading}
                        className="text-[10px] uppercase font-black tracking-wider gap-1.5 h-8 px-3 shrink-0"
                    >
                        {loading ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <Sparkles size={12} />
                        )}
                        {loading ? 'Analyzing...' : 'Generate'}
                    </Button>
                )}
                {debrief && (
                    <button
                        onClick={() => setDebrief(null)}
                        className="text-[10px] text-muted-app/50 hover:text-muted-app transition-colors uppercase tracking-wider font-semibold shrink-0"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Recent deltas preview */}
            <div className="flex flex-wrap items-center justify-start gap-2">
                {deltas.map((d, i) => (
                    <div
                        key={i}
                        className={cn(
                            'text-center rounded-xl px-3 py-1.5 text-xs font-black border transition-colors flex-1 sm:flex-initial min-w-12.5',
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
                        className="text-xs text-muted-app/60 text-center py-2 leading-relaxed"
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
                        className="space-y-3"
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
                                        'flex items-center gap-2 rounded-xl px-3 py-2.5 border',
                                        cfg.bg,
                                    )}
                                >
                                    <Icon size={14} className={cfg.color} />
                                    <span
                                        className={cn(
                                            'text-xs font-bold uppercase tracking-wider',
                                            cfg.color,
                                        )}
                                    >
                                        {cfg.label} Trajectory
                                    </span>
                                </div>
                            );
                        })()}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4 space-y-0">
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
                                    className="bg-white/3 rounded-xl px-4 py-3 border border-white/5"
                                >
                                    <p className="text-[10px] font-bold text-muted-app/50 uppercase tracking-wider mb-1.5">
                                        {item.label}
                                    </p>
                                    <p className="text-xs sm:text-sm text-text-app/90 leading-relaxed font-normal">
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
