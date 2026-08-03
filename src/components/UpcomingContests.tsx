import React, { useEffect, useState } from 'react';
import { Contest } from '../types';
import { CodeforcesService } from '../services/codeforces';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

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
                <Calendar size={16} className="text-cyan-400 animate-pulse" />
                <h3 className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-[0.2em] shadow-cyan-400/20 drop-shadow-md">
                    Mission Calendar
                </h3>
            </div>

            <div className="space-y-3">
                {contests.map((contest) => (
                    <a
                        key={contest.id}
                        href={`https://codeforces.com/contests/${contest.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group relative"
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        <div className="glass p-4 rounded-[1.2rem] border border-white/5 bg-white/2 hover:bg-cyan-500/5 transition-all duration-500 group-hover:-translate-y-0.5 group-hover:border-cyan-500/30 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] relative overflow-hidden z-10">
                            <div className="flex items-start justify-between mb-2">
                                <span
                                    className={cn(
                                        'text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border',
                                        contest.phase === 'CODING'
                                            ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
                                    )}
                                >
                                    {contest.phase === 'CODING'
                                        ? 'LIVE NOW'
                                        : 'SCHEDULED'}
                                </span>
                                <ExternalLink
                                    size={12}
                                    className="text-cyan-400/50 opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110 group-hover:text-cyan-400"
                                />
                            </div>
                            <h4 className="text-xs font-bold text-text-app mb-2 leading-tight group-hover:text-cyan-400 transition-colors wrap-break-word whitespace-normal font-display tracking-wide">
                                {contest.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-app font-mono font-medium">
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
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[9px] text-muted-app/70">
                                <span>
                                    {contest.phase === 'CODING'
                                        ? 'Live now — jump in'
                                        : 'Good prep window'}
                                </span>
                                <span className="font-semibold text-cyan-400">
                                    {contest.phase === 'CODING'
                                        ? 'INFILTRATE'
                                        : 'PREPARE'}
                                </span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
