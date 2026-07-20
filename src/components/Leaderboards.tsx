import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/Card';
import { CodeforcesService } from '../services/codeforces';
import { VerdictPieChart } from './charts/VerdictPieChart';
import { ErrorState } from './ErrorState';
import { User, Contest } from '../types';
import {
    Trophy,
    Globe,
    MapPin,
    Filter,
    Search,
    Calendar,
    ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { format, subDays, isAfter } from 'date-fns';

type ContestType = 'ALL' | 'DIV1' | 'DIV2' | 'DIV3' | 'EDU';
type TimeRange = 'ALL' | '7DAYS' | 'MONTH';

export function Leaderboards() {
    const [users, setUsers] = useState<User[]>([]);
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [contestFilter, setContestFilter] = useState<ContestType>('ALL');
    const [timeFilter, setTimeFilter] = useState<TimeRange>('ALL');
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [topUsers, allContests] = await Promise.all([
                CodeforcesService.getTopUsers(200),
                CodeforcesService.getContests(),
            ]);
            setUsers(topUsers);
            setContests(allContests);
        } catch (err: any) {
            console.error('Leaderboard fetch failed', err);
            setError(err.message || 'Failed to sync with global leaderboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredContests = useMemo(() => {
        let filtered = contests.filter((c) => c.phase === 'FINISHED');

        if (contestFilter !== 'ALL') {
            filtered = filtered.filter((c) => {
                const name = c.name.toUpperCase();
                if (contestFilter === 'DIV1')
                    return name.includes('DIV. 1') && !name.includes('DIV. 2');
                if (contestFilter === 'DIV2') return name.includes('DIV. 2');
                if (contestFilter === 'DIV3') return name.includes('DIV. 3');
                if (contestFilter === 'EDU')
                    return name.includes('EDUCATIONAL');
                return true;
            });
        }

        if (timeFilter !== 'ALL') {
            const now = new Date();
            const cutoff =
                timeFilter === '7DAYS' ? subDays(now, 7) : subDays(now, 30);
            filtered = filtered.filter(
                (c) =>
                    c.startTimeSeconds !== undefined &&
                    isAfter(new Date(c.startTimeSeconds * 1000), cutoff),
            );
        }

        return filtered.slice(0, 50); // Top 50 recent matching contests
    }, [contests, contestFilter, timeFilter]);

    const filteredUsers = useMemo(() => {
        return users.filter(
            (u) =>
                u.handle.toLowerCase().includes(search.toLowerCase()) ||
                (u.country &&
                    u.country.toLowerCase().includes(search.toLowerCase())),
        );
    }, [users, search]);

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={fetchData}
                onHome={() => navigate('/')}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-32 md:pb-20">
            <div className="flex flex-col items-center text-center mb-12 md:mb-16">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 bg-brand-primary/10 p-4 rounded-3xl text-brand-primary border border-brand-primary/20"
                >
                    <Trophy size={24} className="md:w-8 md:h-8" />
                </motion.div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-extrabold mb-4 tracking-tighter text-text-app">
                    Global <span className="gradient-text">Elite.</span>
                </h1>
                <p className="text-sm md:text-base text-muted-app max-w-xl font-medium px-4">
                    Discover the top performers and analyze the latest
                    competitive trends across the Codeforces ecosystem.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    <Card className="p-0 overflow-hidden">
                        <div className="p-5 md:p-8 border-b border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-base md:text-xl font-display font-bold text-text-app tracking-tight mb-1">
                                    Top Rated Users
                                </h3>
                                <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-muted-app">
                                    Global Standings (Updated Daily)
                                </p>
                            </div>
                            <div className="relative group w-full xl:w-auto xl:min-w-60">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-app group-focus-within:text-brand-primary transition-colors"
                                    size={14}
                                />
                                <input
                                    type="text"
                                    placeholder="Filter by handle or country..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[10px] md:text-xs focus:outline-hidden focus:border-brand-primary/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-200 custom-scrollbar overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 z-10 bg-bg-app shadow-sm shadow-white/5">
                                    <tr className="border-b border-white/5">
                                        <th className="px-3 md:px-8 py-2.5 md:py-4 text-[9px] md:text-[10px] font-black text-muted-app uppercase tracking-widest">
                                            Rank
                                        </th>
                                        <th className="px-3 md:px-8 py-2.5 md:py-4 text-[9px] md:text-[10px] font-black text-muted-app uppercase tracking-widest">
                                            Handle
                                        </th>
                                        <th className="px-3 md:px-8 py-2.5 md:py-4 text-[9px] md:text-[10px] font-black text-muted-app uppercase tracking-widest">
                                            Rating
                                        </th>
                                        <th className="px-3 md:px-8 py-2.5 md:py-4 text-[9px] md:text-[10px] font-black text-muted-app uppercase tracking-widest text-right">
                                            Location
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading
                                        ? Array.from({ length: 10 }).map(
                                              (_, i) => (
                                                  <tr
                                                      key={i}
                                                      className="animate-pulse"
                                                  >
                                                      <td
                                                          colSpan={4}
                                                          className="px-4 md:px-8 py-3 md:py-4 h-16 bg-white/1"
                                                      />
                                                  </tr>
                                              ),
                                          )
                                        : filteredUsers
                                              .slice(0, 50)
                                              .map((user, i) => (
                                                  <tr
                                                      key={user.handle}
                                                      className="group hover:bg-white/3 transition-colors cursor-pointer"
                                                      onClick={() =>
                                                          navigate(
                                                              `/dashboard/${user.handle}`,
                                                          )
                                                      }
                                                  >
                                                      <td className="px-3 md:px-8 py-2.5 md:py-4">
                                                          <span
                                                              className={cn(
                                                                  'text-[10px] md:text-xs font-black px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-white/5 border border-white/10',
                                                                  i === 0 &&
                                                                      'text-amber-400 bg-amber-400/10 border-amber-400/20',
                                                                  i === 1 &&
                                                                      'text-slate-400 bg-slate-400/10 border-slate-400/20',
                                                                  i === 2 &&
                                                                      'text-amber-700 bg-amber-700/10 border-amber-700/20',
                                                              )}
                                                          >
                                                              #{i + 1}
                                                          </span>
                                                      </td>
                                                      <td className="px-3 md:px-8 py-2.5 md:py-4">
                                                          <div className="flex items-center gap-2 md:gap-3">
                                                              <div
                                                                  className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-[9px] md:text-[10px] text-white shrink-0"
                                                                  style={{
                                                                      backgroundColor:
                                                                          CodeforcesService.getRankColor(
                                                                              user.rank,
                                                                          ),
                                                                  }}
                                                              >
                                                                  {user.handle
                                                                      .charAt(0)
                                                                      .toUpperCase()}
                                                              </div>
                                                              <div className="min-w-0">
                                                                  <p className="text-xs md:text-sm font-bold text-text-app group-hover:text-brand-primary transition-colors wrap-break-word whitespace-normal max-w-20 sm:max-w-37.5 md:max-w-none">
                                                                      {
                                                                          user.handle
                                                                      }
                                                                  </p>
                                                                  <p className="text-[8px] md:text-[10px] font-mono text-muted-app uppercase tracking-widest wrap-break-word whitespace-normal">
                                                                      {(
                                                                          user.rank ||
                                                                          'Newbie'
                                                                      ).replace(
                                                                          /_/g,
                                                                          ' ',
                                                                      )}
                                                                  </p>
                                                              </div>
                                                          </div>
                                                      </td>
                                                      <td className="px-3 md:px-8 py-2.5 md:py-4 text-xs md:text-sm font-mono font-bold text-text-app">
                                                          {user.rating}
                                                      </td>
                                                      <td className="px-3 md:px-8 py-2.5 md:py-4 text-right">
                                                          <div className="flex items-center justify-end gap-1 md:gap-2 text-muted-app text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                                                              <MapPin
                                                                  size={10}
                                                                  className="opacity-40"
                                                              />
                                                              <span className="wrap-break-word whitespace-normal max-w-15 sm:max-w-none">
                                                                  {user.country ||
                                                                      'Global'}
                                                              </span>
                                                          </div>
                                                      </td>
                                                  </tr>
                                              ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <Filter
                                    size={16}
                                    className="text-brand-primary"
                                />
                                <h3 className="text-[10px] font-mono font-bold text-muted-app uppercase tracking-[0.2em]">
                                    Filters
                                </h3>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] text-muted-app font-bold uppercase tracking-widest mb-3">
                                    Contest Type
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {['ALL', 'DIV1', 'DIV2', 'DIV3', 'EDU'].map(
                                        (type) => (
                                            <button
                                                key={type}
                                                onClick={() =>
                                                    setContestFilter(
                                                        type as ContestType,
                                                    )
                                                }
                                                className={cn(
                                                    'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all',
                                                    contestFilter === type
                                                        ? 'bg-brand-primary text-white text-text-app border-brand-primary shadow-lg shadow-brand-primary/20'
                                                        : 'bg-white/5 text-muted-app border-white/10 hover:bg-white/10',
                                                )}
                                            >
                                                {type}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] text-muted-app font-bold uppercase tracking-widest mb-3">
                                    Time Range
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'ALL', label: 'All Time' },
                                        { id: '7DAYS', label: 'Last 7 Days' },
                                        { id: 'MONTH', label: 'Last Month' },
                                    ].map((range) => (
                                        <button
                                            key={range.id}
                                            onClick={() =>
                                                setTimeFilter(
                                                    range.id as TimeRange,
                                                )
                                            }
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all',
                                                timeFilter === range.id
                                                    ? 'bg-brand-primary text-white text-text-app border-brand-primary shadow-lg shadow-brand-primary/20'
                                                    : 'bg-white/5 text-muted-app border-white/10 hover:bg-white/10',
                                            )}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <Calendar
                                size={14}
                                className="text-brand-secondary"
                            />
                            <h3 className="text-[10px] font-mono font-bold text-muted-app uppercase tracking-[0.2em]">
                                Recent Contests
                            </h3>
                        </div>

                        <div className="space-y-2">
                            <AnimatePresence mode="popLayout">
                                {filteredContests.map((contest) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={contest.id}
                                        className="glass-premium group p-5 bg-white/1 hover:bg-white/3 transition-all cursor-pointer rounded-3xl"
                                        onClick={() =>
                                            navigate(`/contest/${contest.id}`)
                                        }
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h4 className="text-xs font-bold text-text-app wrap-break-word whitespace-normal group-hover:text-brand-primary transition-colors">
                                                    {contest.name}
                                                </h4>
                                                <p className="text-[9px] font-mono text-muted-app uppercase tracking-widest mt-1.5 font-bold">
                                                    {contest.startTimeSeconds &&
                                                        format(
                                                            new Date(
                                                                contest.startTimeSeconds *
                                                                    1000,
                                                            ),
                                                            'MMM dd, yyyy',
                                                        )}
                                                </p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors">
                                                <ChevronRight
                                                    size={14}
                                                    className="text-muted-app group-hover:text-brand-primary transition-all group-hover:translate-x-0.5"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {filteredContests.length === 0 && (
                                <div className="py-12 bg-white/1 rounded-2xl border border-dashed border-white/5 text-center">
                                    <p className="text-[10px] font-mono text-muted-app uppercase tracking-[0.2em]">
                                        No Matches Found
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
