import React from 'react';
import { RatingChange } from '../types';
import { Card } from './ui/Card';
import { format } from 'date-fns';
import { Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

interface ContestHistoryProps {
    ratingHistory: RatingChange[];
}

export function ContestHistory({ ratingHistory }: ContestHistoryProps) {
    const sorted = [...ratingHistory].sort(
        (a, b) => b.ratingUpdateTimeSeconds - a.ratingUpdateTimeSeconds,
    );

    return (
        <div className="overflow-y-auto max-h-125 custom-scrollbar overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-bg-app shadow-sm shadow-white/5">
                    <tr className="border-b border-white/5">
                        <th className="py-2.5 md:py-4 text-[9px] md:text-[10px] font-black text-muted-app uppercase tracking-widest pl-3 md:pl-4">
                            Contest
                        </th>
                        <th className="py-2.5 md:py-4 text-[9px] md:text-[10px] font-black text-muted-app uppercase tracking-widest">
                            Rank
                        </th>
                        <th className="py-2.5 md:py-4 text-[9px] md:text-[10px] font-black text-muted-app uppercase tracking-widest text-right">
                            Delta
                        </th>
                        <th className="py-2.5 md:py-4 text-[9px] md:text-[10px] font-black text-muted-app uppercase tracking-widest pr-3 md:pr-4 text-right">
                            Rating
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {sorted.map((contest, idx) => {
                        const delta = contest.newRating - contest.oldRating;
                        return (
                            <tr
                                key={idx}
                                className="group hover:bg-white/5 transition-colors"
                            >
                                <td className="py-2.5 md:py-4 pl-3 md:pl-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] md:text-[11px] font-bold text-text-app group-hover:text-brand-primary transition-colors wrap-break-word whitespace-normal max-w-37.5 sm:max-w-75 md:max-w-none">
                                            {contest.contestName}
                                        </span>
                                        <span className="text-[8px] md:text-[9px] font-mono text-muted-app uppercase mt-0.5 md:mt-1">
                                            {format(
                                                new Date(
                                                    contest.ratingUpdateTimeSeconds *
                                                        1000,
                                                ),
                                                'MMM dd, yyyy',
                                            )}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-2.5 md:py-4">
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        <Trophy
                                            size={10}
                                            className={cn(
                                                contest.rank <= 100
                                                    ? 'text-yellow-500'
                                                    : 'text-muted-app/20',
                                            )}
                                        />
                                        <span className="text-[10px] md:text-xs font-mono font-bold text-text-app">
                                            #{contest.rank}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-2.5 md:py-4 text-right">
                                    <div
                                        className={cn(
                                            'flex items-center justify-end gap-0.5 md:gap-1 text-[9px] md:text-[10px] font-black',
                                            delta > 0
                                                ? 'text-emerald-500'
                                                : delta < 0
                                                  ? 'text-red-500'
                                                  : 'text-muted-app',
                                        )}
                                    >
                                        {delta > 0 ? (
                                            <ArrowUp
                                                size={8}
                                                className="md:w-2.5 md:h-2.5"
                                            />
                                        ) : delta < 0 ? (
                                            <ArrowDown
                                                size={8}
                                                className="md:w-2.5 md:h-2.5"
                                            />
                                        ) : (
                                            <Minus
                                                size={8}
                                                className="md:w-2.5 md:h-2.5"
                                            />
                                        )}
                                        {Math.abs(delta)}
                                    </div>
                                </td>
                                <td className="py-2.5 md:py-4 pr-3 md:pr-4 text-right">
                                    <span className="text-[10px] md:text-xs font-mono font-black text-text-app">
                                        {contest.newRating}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
