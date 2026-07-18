import React, { useMemo } from 'react';
import { Problem, Submission } from '../types';
import { Card } from './ui/Card';
import { ExternalLink, Target, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface RecommendationsProps {
    submissions: Submission[];
    problemset: Problem[];
    currentRating: number;
}

export function Recommendations({
    submissions,
    problemset,
    currentRating,
}: RecommendationsProps) {
    const suggestedProblems = useMemo(() => {
        if (!problemset.length || !submissions.length) return [];

        const solvedIds = new Set(
            submissions
                .filter((s) => s.verdict === 'OK')
                .map((s) => `${s.problem.contestId}-${s.problem.index}`),
        );

        const targetMid = (currentRating || 800) + 200;
        const targetMin = Math.max((currentRating || 800) - 100, 800);
        const targetMax = (currentRating || 800) + 400;

        return problemset
            .filter((p) => !solvedIds.has(`${p.contestId}-${p.index}`))
            .filter(
                (p) =>
                    p.rating && p.rating >= targetMin && p.rating <= targetMax,
            )
            .map((p) => ({
                ...p,
                priorityScore:
                    Math.abs((p.rating || 800) - targetMid) +
                    (p.tags.includes('dp') ? -30 : 0),
            }))
            .sort((a, b) => a.priorityScore - b.priorityScore)
            .slice(0, 5);
    }, [submissions, problemset, currentRating]);

    if (!suggestedProblems.length) return null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Target size={16} className="text-brand-secondary" />
                    <h3 className="text-[10px] font-mono font-bold text-muted-app uppercase tracking-[0.2em]">
                        Next Challenges
                    </h3>
                </div>
                <span className="self-start rounded-full bg-brand-secondary/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-brand-secondary sm:self-auto">
                    High impact
                </span>
            </div>

            <div className="space-y-3">
                {suggestedProblems.map((p, i) => (
                    <a
                        key={`${p.contestId}-${p.index}`}
                        href={`https://codeforces.com/contest/${p.contestId}/problem/${p.index}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                    >
                        <div className="glass p-4 rounded-[1.2rem] border border-white/10 bg-linear-to-br from-white/8 via-transparent to-transparent transition-all duration-500 group-hover:-translate-y-0.5 group-hover:border-brand-secondary/30 group-hover:shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
                            <div className="flex items-start justify-between mb-2">
                                <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest">
                                    {p.rating} RATED
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-app/60">
                                    {i === 0
                                        ? 'Best pick'
                                        : i === 1
                                          ? 'Strong next'
                                          : 'Worth it'}
                                </span>
                            </div>
                            <h4 className="text-xs font-bold text-text-app group-hover:text-brand-secondary transition-colors wrap-break-word whitespace-normal">
                                {p.name}
                            </h4>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {p.tags.slice(0, 2).map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-[8px] font-bold text-muted-app/60 uppercase tracking-tighter"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            <div className="pt-2">
                <p className="text-[9px] text-muted-app italic font-medium leading-relaxed">
                    <Sparkles
                        size={10}
                        className="inline mr-1 text-brand-secondary"
                    />
                    Picked around your current level so each problem feels
                    challenging but still reachable.
                </p>
            </div>
        </div>
    );
}
