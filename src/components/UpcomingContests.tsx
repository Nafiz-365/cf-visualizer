import React, { useEffect, useState } from 'react';
import { Contest } from '../types';
import { CodeforcesService } from '../services/codeforces';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export function UpcomingContests() {
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadContests() {
            try {
                const allContests = await CodeforcesService.getContests();
                const upcoming = allContests
                    .filter((c) => c.phase === 'BEFORE' || c.phase === 'CODING')
                    .sort(
                        (a, b) =>
                            (a.startTimeSeconds || 0) -
                            (b.startTimeSeconds || 0),
                    )
                    .slice(0, 8);
                setContests(upcoming);
            } catch (err) {
                console.error('Failed to fetch contests:', err);
            } finally {
                setLoading(false);
            }
        }
        loadContests();
    }, []);

    if (loading)
        return (
            <div className="space-y-3">
                <div className="h-4 w-24 bg-white/5 animate-pulse rounded" />
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-20 bg-white/5 animate-pulse rounded-2xl"
                    />
                ))}
            </div>
        );

    if (!contests.length) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-brand-primary" />
                <h3 className="text-[10px] font-mono font-bold text-muted-app uppercase tracking-[0.2em]">
                    Upcoming Contests
                </h3>
            </div>

            <div className="space-y-3">
                {contests.map((contest) => (
                    <a
                        key={contest.id}
                        href={`https://codeforces.com/contests/${contest.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                    >
                        <div className="glass p-4 rounded-2xl border border-white/5 group-hover:border-brand-primary/30 transition-all">
                            <div className="flex items-start justify-between mb-2">
                                <span
                                    className={cn(
                                        'text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest',
                                        contest.phase === 'CODING'
                                            ? 'bg-red-500/10 text-red-500 animate-pulse'
                                            : 'bg-brand-primary/10 text-brand-primary',
                                    )}
                                >
                                    {contest.phase === 'CODING'
                                        ? 'Running Now'
                                        : 'Scheduled'}
                                </span>
                                <ExternalLink
                                    size={10}
                                    className="text-muted-app opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                            <h4 className="text-xs font-bold text-text-app mb-2 line-clamp-2 leading-tight group-hover:text-brand-primary transition-colors">
                                {contest.name}
                            </h4>
                            <div className="flex items-center gap-3 text-[10px] text-muted-app font-medium">
                                <div className="flex items-center gap-1">
                                    <Clock size={10} />
                                    {contest.startTimeSeconds &&
                                        formatDistanceToNow(
                                            contest.startTimeSeconds * 1000,
                                            { addSuffix: true },
                                        )}
                                </div>
                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                <div>
                                    {(contest.durationSeconds / 3600).toFixed(
                                        1,
                                    )}
                                    h
                                </div>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
