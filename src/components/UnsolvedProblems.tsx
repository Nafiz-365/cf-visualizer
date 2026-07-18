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
                    <AlertCircle size={16} className="text-red-500" />
                    <h3 className="text-[10px] font-mono font-bold text-muted-app uppercase tracking-[0.2em]">
                        Unsolved Challenges
                    </h3>
                </div>
                <span className="self-start text-[9px] font-bold text-red-500/50 uppercase sm:self-auto">
                    {unsolved.length} Pending
                </span>
            </div>

            <div className="space-y-2 max-h-[16rem] sm:max-h-100 overflow-y-auto pr-2 custom-scrollbar">
                {unsolved.map(({ problem, count }) => (
                    <a
                        key={`${problem.contestId}-${problem.index}`}
                        href={`https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                    >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-[1rem] hover:bg-white/8 border border-transparent hover:border-white/10 transition-all duration-500 group-hover:translate-x-1 group-hover:shadow-[0_8px_18px_rgba(0,0,0,0.10)]">
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-black text-brand-secondary uppercase">
                                        {problem.index}
                                    </span>
                                    <h4 className="text-[11px] font-bold text-text-app break-words whitespace-normal group-hover:text-brand-secondary transition-colors">
                                        {problem.name}
                                    </h4>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-[9px] font-medium text-muted-app/60">
                                        {problem.rating || 'Unrated'} RATED
                                    </span>
                                    <span className="text-[9px] font-medium text-red-500/60 uppercase">
                                        {count > 1
                                            ? 'Repeated miss'
                                            : 'Single miss'}
                                    </span>
                                </div>
                            </div>
                            <ExternalLink
                                size={12}
                                className="text-muted-app opacity-0 group-hover:opacity-100 transition-opacity"
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
