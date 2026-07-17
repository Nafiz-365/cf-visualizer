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

        // Filter problems within a challenging range
        const targetMin = (currentRating || 800) + 0;
        const targetMax = (currentRating || 800) + 400;

        return problemset
            .filter((p) => !solvedIds.has(`${p.contestId}-${p.index}`))
            .filter(
                (p) =>
                    p.rating && p.rating >= targetMin && p.rating <= targetMax,
            )
            .sort(() => 0.5 - Math.random()) // Randomize for variety
            .slice(0, 6);
    }, [submissions, problemset, currentRating]);

    if (!suggestedProblems.length) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-brand-secondary" />
                <h3 className="text-[10px] font-mono font-bold text-muted-app uppercase tracking-[0.2em]">
                    Next Challenges
                </h3>
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
                        <div className="glass p-4 rounded-2xl border border-white/5 group-hover:border-brand-secondary/30 transition-all group-hover:translate-x-1">
                            <div className="flex items-start justify-between mb-2">
                                <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest">
                                    {p.rating} RATED
                                </span>
                                <ExternalLink
                                    size={12}
                                    className="text-muted-app opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                            <h4 className="text-xs font-bold text-text-app group-hover:text-brand-secondary transition-colors line-clamp-1">
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
                    Recommended based on your current rating delta and unsolved
                    problemset.
                </p>
            </div>
        </div>
    );
}
