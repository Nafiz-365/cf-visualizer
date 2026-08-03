import React, { useMemo } from 'react';
import { Submission } from '../types';
import { AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

interface UnsolvedProblemsProps {
    submissions: Submission[];
}

export function UnsolvedProblems({ submissions }: UnsolvedProblemsProps) {
    const unsolved = useMemo(() => {
        const solvedIds = new Set(
            submissions
                .filter((s) => s.verdict === 'OK')
                .map((s) => `${s.problem.contestId}-${s.problem.index}`),
        );

        // Problems attempted but never solved
        const attempts = new Map<string, { problem: any; count: number }>();
        submissions.forEach((s) => {
            const id = `${s.problem.contestId}-${s.problem.index}`;
            if (!solvedIds.has(id)) {
                const current = attempts.get(id) || {
                    problem: s.problem,
                    count: 0,
                };
                attempts.set(id, { ...current, count: current.count + 1 });
            }
        });

        return Array.from(attempts.values())
            .sort((a, b) => {
                const scoreA = (a.problem.rating || 0) + a.count * 40;
                const scoreB = (b.problem.rating || 0) + b.count * 40;
                return scoreB - scoreA;
            })
            .slice(0, 10);
    }, [submissions]);

    if (unsolved.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex items-center gap-2">
                    <AlertCircle
                        size={16}
                        className="text-red-500 animate-pulse"
                    />
                    <h3 className="text-[10px] font-mono font-black text-red-500 uppercase tracking-[0.2em] shadow-red-500/20 drop-shadow-md">
                        Unsolved Mission Logs
                    </h3>
                </div>
                <span className="self-start text-[9px] font-bold text-red-500/50 uppercase sm:self-auto">
                    {unsolved.length} Pending
                </span>
            </div>

            <div className="space-y-2 max-h-64 sm:max-h-100 overflow-y-auto pr-2 custom-scrollbar">
                {unsolved.map(({ problem, count }) => (
                    <a
                        key={`${problem.contestId}-${problem.index}`}
                        href={`https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group relative"
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-red-500/0 via-red-500/5 to-red-500/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-2xl bg-white/2 hover:bg-red-500/5 border border-white/5 hover:border-red-500/30 transition-all duration-500 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] relative overflow-hidden z-10">
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-black text-brand-secondary uppercase">
                                        {problem.index}
                                    </span>
                                    <h4 className="text-[11px] font-bold text-text-app wrap-break-word whitespace-normal group-hover:text-brand-secondary transition-colors">
                                        {problem.name}
                                    </h4>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-[9px] font-medium text-muted-app/60 font-mono">
                                        {problem.rating || 'UNRATED'} RATING
                                    </span>
                                    <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                        {count > 1
                                            ? 'Repeated miss'
                                            : 'Single miss'}
                                    </span>
                                </div>
                            </div>
                            <ExternalLink
                                size={14}
                                className="text-red-400/50 group-hover:text-red-400 transition-colors group-hover:scale-110"
                            />
                        </div>
                    </a>
                ))}
            </div>

            {unsolved.length > 5 && (
                <div className="pt-2 text-center">
                    <p className="text-[9px] text-muted-app/60 font-medium italic">
                        Focus on these unsolved problems to improve your
                        technical resilience.
                    </p>
                </div>
            )}
        </div>
    );
}
