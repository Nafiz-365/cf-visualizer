import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { RatingChange, Submission, Problem } from '../types';
import { CodeforcesService } from '../services/codeforces';
import { motion, AnimatePresence } from 'motion/react';
import { AIContestDebrief } from './AIContestDebrief';
import {
    Trophy,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    TrendingUp,
    ChevronDown,
    ArrowUpRight,
    Award,
    Flame,
    BarChart3,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

interface ContestAnalyzerProps {
    ratingHistory: RatingChange[];
    submissions: Submission[];
    problemset: Problem[];
    userRating: number;
    userHandle: string;
}

export function ContestAnalyzer({
    ratingHistory,
    submissions,
    problemset,
    userRating,
    userHandle,
}: ContestAnalyzerProps) {
    const [selectedContestId, setSelectedContestId] = useState<string>('');

    // Pre-select first contest if available
    React.useEffect(() => {
        if (ratingHistory.length > 0 && !selectedContestId) {
            setSelectedContestId(
                ratingHistory[ratingHistory.length - 1].contestId.toString(),
            );
        }
    }, [ratingHistory, selectedContestId]);

    // Active contest details
    const activeContest = useMemo(() => {
        if (!selectedContestId) return null;
        return (
            ratingHistory.find(
                (c) => c.contestId.toString() === selectedContestId,
            ) || null
        );
    }, [selectedContestId, ratingHistory]);

    // Submissions for this contest
    const contestSubmissions = useMemo(() => {
        if (!selectedContestId) return [];
        return submissions
            .filter(
                (s) => s.problem.contestId?.toString() === selectedContestId,
            )
            .sort((a, b) => a.creationTimeSeconds - b.creationTimeSeconds);
    }, [selectedContestId, submissions]);

    // Pace and Verdict Trail Analysis
    const analysis = useMemo(() => {
        if (!activeContest) return null;

        const subs = contestSubmissions;
        const solvedMap = new Map<
            string,
            { time: number; attemptsBefore: number; ok: boolean }
        >();

        subs.forEach((sub) => {
            const index = sub.problem.index;
            if (!solvedMap.has(index)) {
                solvedMap.set(index, { time: 0, attemptsBefore: 0, ok: false });
            }

            const current = solvedMap.get(index)!;
            if (sub.verdict === 'OK') {
                if (!current.ok) {
                    current.ok = true;
                    // Approximate relative solve time since start of contest (or relative to earliest submission)
                    const baseTime =
                        subs[0]?.creationTimeSeconds || sub.creationTimeSeconds;
                    current.time = Math.round(
                        (sub.creationTimeSeconds - baseTime) / 60,
                    );
                }
            } else {
                if (!current.ok) {
                    current.attemptsBefore++;
                }
            }
        });

        const paceData = Array.from(solvedMap.entries()).map(
            ([index, info]) => ({
                problem: index,
                solveTime: info.ok ? info.time : null,
                attempts: info.attemptsBefore + (info.ok ? 1 : 0),
                solved: info.ok,
            }),
        );

        const solvedIndices = new Set(
            subs.filter((s) => s.verdict === 'OK').map((s) => s.problem.index),
        );

        return {
            paceData,
            solvedIndices,
            totalSubmissions: subs.length,
            acceptedCount: solvedIndices.size,
            wrongCount: subs.filter((s) => s.verdict !== 'OK').length,
        };
    }, [activeContest, contestSubmissions]);

    // Upsolve Calibration - find all problems in this contest that they didn't solve during/after
    const upsolveProblems = useMemo(() => {
        if (!selectedContestId) return [];
        const solvedDuring = analysis?.solvedIndices || new Set();

        // Filter problemset for this contest
        return problemset
            .filter((p) => p.contestId?.toString() === selectedContestId)
            .filter((p) => !solvedDuring.has(p.index))
            .sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }, [selectedContestId, problemset, analysis]);

    if (ratingHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Trophy size={48} className="text-muted-app opacity-20 mb-4" />
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-app mb-1">
                    No Rated Contest History Found
                </h3>
                <p className="text-[11px] text-muted-app max-w-sm">
                    This profile has not participated in any rated Codeforces
                    rounds yet. Register and compete to unlock contest insights!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5 md:space-y-6 max-w-6xl mx-auto">
            {/* Header with Selection Dropdown */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-5 border-b border-white/5">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary">
                        <Trophy size={12} />
                        Round-by-Round Diagnostics
                    </div>
                    <h2 className="text-xl md:text-3xl font-display font-black text-text-app">
                        Analyze Any Contest You Participated In
                    </h2>
                </div>

                <div className="relative shrink-0 w-full md:w-80">
                    <select
                        value={selectedContestId}
                        onChange={(e) => setSelectedContestId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-brand-primary/50 text-xs font-bold text-text-app appearance-none"
                    >
                        {ratingHistory
                            .slice()
                            .reverse()
                            .map((c) => (
                                <option
                                    key={c.contestId}
                                    value={c.contestId}
                                    className="bg-bg-app"
                                >
                                    #{c.contestId} -{' '}
                                    {c.contestName.substring(0, 36)}...
                                </option>
                            ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-app">
                        <ChevronDown size={14} />
                    </div>
                </div>
            </div>

            {activeContest && (
                <div className="space-y-5 md:space-y-6">
                    {/* Row 1: Profile & Battle Stats Card + AI Contest Debrief Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-stretch">
                        {/* Contest Core Stats Card */}
                        <div className="lg:col-span-4 flex">
                            <Card className="p-5 md:p-6 bg-linear-to-br from-card-app to-white/1 w-full flex flex-col justify-between h-full">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[9px] uppercase font-black text-brand-primary tracking-widest mb-1">
                                            Contest Profile #
                                            {activeContest.contestId}
                                        </p>
                                        <h3 className="text-base font-bold text-text-app leading-snug">
                                            {activeContest.contestName}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4 pt-4 border-t border-white/5 space-y-0">
                                        <div className="flex sm:flex-col lg:flex-row justify-between sm:items-start lg:items-center gap-1">
                                            <span className="text-[10px] font-bold text-muted-app uppercase">
                                                Your Standing
                                            </span>
                                            <span className="text-xs font-mono font-black text-text-app">
                                                Rank #{activeContest.rank}
                                            </span>
                                        </div>
                                        <div className="flex sm:flex-col lg:flex-row justify-between sm:items-start lg:items-center gap-1">
                                            <span className="text-[10px] font-bold text-muted-app uppercase">
                                                Rating Delta
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-xs font-mono font-black',
                                                    activeContest.newRating -
                                                        activeContest.oldRating >
                                                        0
                                                        ? 'text-emerald-400'
                                                        : 'text-red-400',
                                                )}
                                            >
                                                {activeContest.newRating -
                                                    activeContest.oldRating >
                                                0
                                                    ? '+'
                                                    : ''}
                                                {activeContest.newRating -
                                                    activeContest.oldRating}
                                            </span>
                                        </div>
                                        <div className="flex sm:flex-col lg:flex-row justify-between sm:items-start lg:items-center gap-1">
                                            <span className="text-[10px] font-bold text-muted-app uppercase">
                                                Performance Shift
                                            </span>
                                            <span className="text-[11px] font-mono font-bold text-muted-app">
                                                {activeContest.oldRating}{' '}
                                                <span className="text-[10px] opacity-40 mx-1">
                                                    →
                                                </span>{' '}
                                                {activeContest.newRating}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 space-y-3 mt-4">
                                    <div className="flex items-center gap-3">
                                        <Flame
                                            size={14}
                                            className="text-brand-secondary animate-pulse"
                                        />
                                        <h4 className="text-[10px] uppercase tracking-widest font-black text-brand-secondary">
                                            Battle Statistics
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                                            <p className="text-[8px] uppercase text-muted-app font-bold mb-1">
                                                Solves
                                            </p>
                                            <p className="text-base font-black text-text-app">
                                                {analysis?.acceptedCount ?? 0}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                                            <p className="text-[8px] uppercase text-muted-app font-bold mb-1">
                                                Total Tries
                                            </p>
                                            <p className="text-base font-black text-text-app">
                                                {analysis?.totalSubmissions ??
                                                    0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* AI Contest Debrief Card */}
                        <div className="lg:col-span-8 flex">
                            <Card className="p-5 md:p-6 bg-linear-to-br from-card-app to-white/1 w-full flex flex-col justify-between h-full">
                                <AIContestDebrief
                                    ratingHistory={ratingHistory}
                                    currentRating={userRating}
                                    handle={userHandle}
                                    selectedContestId={selectedContestId}
                                    contestSubmissions={contestSubmissions}
                                />
                            </Card>
                        </div>
                    </div>

                    {/* Row 2: Pace & Submission Trail (Timeline) */}
                    <Card className="p-5 md:p-6 space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <Clock
                                    size={16}
                                    className="text-brand-primary"
                                />
                                <h3 className="text-xs uppercase font-black tracking-widest text-text-app">
                                    Pace & Verdict Trail
                                </h3>
                            </div>
                            <span className="text-[8px] font-black uppercase text-muted-app tracking-[0.2em]">
                                Minutes into Contest
                            </span>
                        </div>

                        {contestSubmissions.length > 0 ? (
                            <div className="space-y-6">
                                {/* Chronological trail visualization */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {analysis?.paceData.map((item, idx) => (
                                        <div
                                            key={item.problem}
                                            className={cn(
                                                'p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between',
                                                item.solved
                                                    ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20'
                                                    : 'bg-red-500/5 border-red-500/10 hover:border-red-500/20',
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-black text-text-app font-mono bg-white/5 px-2.5 py-1 rounded-lg">
                                                    Problem {item.problem}
                                                </span>
                                                {item.solved ? (
                                                    <CheckCircle2
                                                        size={14}
                                                        className="text-emerald-400"
                                                    />
                                                ) : (
                                                    <XCircle
                                                        size={14}
                                                        className="text-red-400"
                                                    />
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                {item.solved ? (
                                                    <div>
                                                        <p className="text-[8px] uppercase text-muted-app font-bold">
                                                            Solved at
                                                        </p>
                                                        <p className="text-base font-black text-emerald-400 font-mono">
                                                            {item.solveTime}m
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-[8px] uppercase text-muted-app font-bold">
                                                            Verdict
                                                        </p>
                                                        <p className="text-sm font-bold text-red-400 font-mono">
                                                            Unsolved
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-muted-app font-medium">
                                                    Attempts:{' '}
                                                    <strong className="text-text-app">
                                                        {item.attempts}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* List of exact trail logs */}
                                <div className="space-y-2.5 pt-4 border-t border-white/5">
                                    <p className="text-[9px] uppercase tracking-wider font-black text-muted-app mb-3">
                                        Submissions Stream
                                    </p>
                                    <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                        {contestSubmissions.map((sub, i) => (
                                            <div
                                                key={sub.id}
                                                className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all gap-4"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-[10px] font-mono font-bold text-muted-app/40 shrink-0">
                                                        #{i + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-text-app truncate">
                                                            Problem{' '}
                                                            {sub.problem.index}{' '}
                                                            - {sub.problem.name}
                                                        </p>
                                                        <p className="text-[9px] font-mono text-muted-app truncate">
                                                            {
                                                                sub.programmingLanguage
                                                            }{' '}
                                                            |{' '}
                                                            {
                                                                sub.timeConsumedMillis
                                                            }
                                                            ms
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <div
                                                        className={cn(
                                                            'w-1.5 h-1.5 rounded-full',
                                                            sub.verdict === 'OK'
                                                                ? 'bg-emerald-500'
                                                                : 'bg-red-500',
                                                        )}
                                                    />
                                                    <span
                                                        className={cn(
                                                            'text-[9px] font-black uppercase tracking-wider',
                                                            sub.verdict === 'OK'
                                                                ? 'text-emerald-400'
                                                                : 'text-red-400',
                                                        )}
                                                    >
                                                        {sub.verdict === 'OK'
                                                            ? 'Accepted'
                                                            : 'Failed'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center opacity-40">
                                <Clock
                                    size={28}
                                    className="mx-auto mb-2 text-muted-app"
                                />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-app">
                                    No Active Submissions Found
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* Peer Comparison / Rank Trajectory */}
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <BarChart3
                                    size={16}
                                    className="text-brand-secondary"
                                />
                                <h3 className="text-xs uppercase font-black tracking-widest text-text-app">
                                    Contest Rank Trajectory
                                </h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-1">
                                <p className="text-[8px] uppercase tracking-wider font-black text-muted-app">
                                    Your Standings Rank
                                </p>
                                <p className="text-2xl font-black text-text-app font-mono">
                                    #{activeContest.rank}
                                </p>
                                <p className="text-[10px] text-muted-app leading-normal">
                                    Ranked in top{' '}
                                    {Math.max(
                                        1,
                                        Math.round(
                                            (activeContest.rank / 10000) * 100,
                                        ),
                                    )}
                                    % of participants.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-1">
                                <p className="text-[8px] uppercase tracking-wider font-black text-muted-app">
                                    Relative Performance
                                </p>
                                <p className="text-2xl font-black text-brand-primary font-mono">
                                    {activeContest.newRating -
                                        activeContest.oldRating >
                                    0
                                        ? 'Optimal'
                                        : 'Stable'}
                                </p>
                                <p className="text-[10px] text-muted-app leading-normal">
                                    Your rating changed by{' '}
                                    {activeContest.newRating -
                                        activeContest.oldRating >
                                    0
                                        ? '+'
                                        : ''}
                                    {activeContest.newRating -
                                        activeContest.oldRating}{' '}
                                    points relative to pre-round level.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-1">
                                <p className="text-[8px] uppercase tracking-wider font-black text-muted-app">
                                    Round Rating Leverage
                                </p>
                                <p className="text-2xl font-black text-brand-secondary font-mono">
                                    {Math.abs(
                                        activeContest.newRating -
                                            activeContest.oldRating,
                                    )}{' '}
                                    RP
                                </p>
                                <p className="text-[10px] text-muted-app leading-normal">
                                    Leveraged maximum delta potential in the
                                    competitive pool.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* What to Upsolve (Upsolve Calibration) */}
                    <Card className="p-6 space-y-6 bg-linear-to-b from-brand-secondary/3 to-transparent border border-white/10">
                        <div className="flex items-center gap-2 pb-4 border-b border-white/5">
                            <Award size={16} className="text-brand-secondary" />
                            <h3 className="text-xs uppercase font-black tracking-widest text-text-app">
                                Upsolve Calibration (Next Achievements)
                            </h3>
                        </div>

                        {upsolveProblems.length > 0 ? (
                            <div className="space-y-4">
                                <p className="text-[11px] text-muted-app max-w-xl font-medium">
                                    These problems from this round were left
                                    unsolved. Capitalize on them now to solidify
                                    weak segments and claim your training edge!
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {upsolveProblems.slice(0, 6).map((p) => (
                                        <a
                                            key={p.index}
                                            href={`https://codeforces.com/contest/${p.contestId}/problem/${p.index}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block group"
                                        >
                                            <div className="p-4 rounded-xl bg-white/4 border border-white/5 hover:border-brand-secondary/40 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-black text-brand-secondary uppercase tracking-widest">
                                                            {p.rating
                                                                ? `${p.rating} RATED`
                                                                : 'UNRATED'}
                                                        </span>
                                                        <ArrowUpRight
                                                            size={12}
                                                            className="text-muted-app group-hover:text-brand-secondary transition-colors"
                                                        />
                                                    </div>
                                                    <h4 className="text-xs font-bold text-text-app group-hover:text-brand-secondary transition-colors truncate">
                                                        Problem {p.index} -{' '}
                                                        {p.name}
                                                    </h4>
                                                </div>

                                                <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-white/5">
                                                    {p.tags
                                                        .slice(0, 2)
                                                        .map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="text-[8px] bg-white/5 text-muted-app px-2 py-0.5 rounded-full font-bold"
                                                            >
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center opacity-40">
                                <CheckCircle2
                                    size={32}
                                    className="mx-auto mb-2 text-emerald-400"
                                />
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-app">
                                    Round Fully Solved!
                                </p>
                                <p className="text-[9px] text-muted-app mt-1">
                                    You solved every problem in this round.
                                    Unbelievable performance!
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
