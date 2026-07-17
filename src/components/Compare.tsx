import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { CodeforcesService } from '../services/codeforces';
import { RatingChange, User } from '../types';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Search, X, Users, AlertCircle, GitCompare } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export function Compare() {
    const [handles, setHandles] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [data, setData] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addHandle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            !input.trim() ||
            handles.includes(input.trim()) ||
            handles.length >= 4
        )
            return;

        try {
            setLoading(true);
            setError(null);
            const user = await CodeforcesService.getUserInfo(input.trim());

            setUsers((prev) => [...prev, user]);
            setHandles((prev) => [...prev, input.trim()]);
            setInput('');
        } catch (err: any) {
            setError(err.message || 'User not found');
        } finally {
            setLoading(false);
        }
    };

    const removeHandle = (handle: string) => {
        setHandles(handles.filter((h) => h !== handle));
        setUsers(users.filter((u) => u.handle !== handle));
    };

    useEffect(() => {
        const fetchAllRatings = async () => {
            if (handles.length === 0) {
                setData([]);
                return;
            }

            setLoading(true);
            try {
                const allRatings = await Promise.all(
                    handles.map((h) => CodeforcesService.getUserRating(h)),
                );

                const timePoints: Record<number, any> = {};
                allRatings.forEach((history, idx) => {
                    const handle = handles[idx];
                    history.forEach((point) => {
                        const time = point.ratingUpdateTimeSeconds;
                        if (!timePoints[time]) timePoints[time] = { time };
                        timePoints[time][handle] = point.newRating;
                    });
                });

                const sortedTimes = Object.keys(timePoints)
                    .map(Number)
                    .sort((a, b) => a - b);
                const processedData: any[] = [];
                const lastValues: Record<string, number | null> = {};
                handles.forEach((h) => (lastValues[h] = null));

                sortedTimes.forEach((time) => {
                    const point = { ...timePoints[time] };
                    handles.forEach((h) => {
                        if (point[h] !== undefined) {
                            lastValues[h] = point[h];
                        } else {
                            point[h] = lastValues[h];
                        }
                    });
                    processedData.push(point);
                });

                setData(processedData.slice(-150));
            } catch (err) {
                console.error('Comparison data fetch failed', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllRatings();
    }, [handles]);

    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b'];

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-32 md:pb-20">
            <div className="flex flex-col items-center text-center mb-12 md:mb-16">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 bg-brand-primary/10 p-4 rounded-3xl text-brand-primary border border-brand-primary/20"
                >
                    <Users size={24} className="md:w-8 md:h-8" />
                </motion.div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-extrabold mb-4 tracking-tighter text-text-app leading-tight">
                    Multi-User <span className="gradient-text">Comparison</span>
                </h1>
                <p className="text-sm md:text-base text-muted-app max-w-xl font-medium px-4">
                    Benchmark rating trajectories and performance metrics
                    between multiple competitors in real-time.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
                <div className="lg:col-span-1 space-y-6 md:space-y-6">
                    <Card className="bg-linear-to-br from-card-app to-white/1">
                        <h3 className="text-[10px] text-muted-app uppercase font-black tracking-[0.3em] mb-8 flex items-center gap-2">
                            <Users size={14} className="text-brand-primary" />{' '}
                            Squad Matrix
                        </h3>
                        <form onSubmit={addHandle} className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-brand-primary/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <Search
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-app group-focus-within:text-brand-primary transition-colors"
                                    size={16}
                                />
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Sync handle..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-brand-primary/50 transition-all font-bold text-xs text-text-app relative z-10"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-2xl text-[10px] uppercase font-black tracking-widest"
                                disabled={
                                    loading ||
                                    handles.length >= 4 ||
                                    !input.trim()
                                }
                                isLoading={loading}
                            >
                                Engage Target
                            </Button>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[10px] text-red-500 flex items-center justify-center gap-2 mt-4 font-black uppercase tracking-wider"
                                >
                                    <AlertCircle size={12} /> {error}
                                </motion.p>
                            )}
                        </form>

                        <div className="mt-10 space-y-4 pt-8 border-t border-white/5">
                            {users.map((user, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={user.handle}
                                    className={`glass-premium flex items-center justify-between p-4 group hover:bg-white/3 rounded-[1.25rem] user-card-${idx}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="relative avatar-ring shrink-0"
                                            style={{ borderRadius: '0.875rem' }}
                                        >
                                            <img
                                                src={user.avatar}
                                                className="relative w-10 h-10 rounded-xl object-cover"
                                                style={{
                                                    boxShadow: `0 0 0 2px ${colors[idx]}30`,
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <p
                                                className="text-sm font-display font-bold leading-none mb-1.5"
                                                style={{
                                                    color: 'var(--text-main)',
                                                }}
                                            >
                                                {user.handle}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full shrink-0"
                                                    style={{
                                                        backgroundColor:
                                                            colors[idx],
                                                    }}
                                                />
                                                <p
                                                    className="text-overline"
                                                    style={{
                                                        color: colors[idx],
                                                        opacity: 0.85,
                                                    }}
                                                >
                                                    {user.rating || 0} Rating
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            removeHandle(user.handle)
                                        }
                                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-muted-app hover:bg-red-500/10 hover:text-red-500 transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            ))}
                            {handles.length === 0 && (
                                <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-4xl opacity-30">
                                    <Users
                                        size={32}
                                        className="mx-auto mb-4 text-muted-app"
                                    />
                                    <p className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-app">
                                        Awaiting Input
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-3 h-full">
                    <Card className="h-100 md:h-150 flex flex-col p-5 md:p-8 overflow-visible!">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-app">
                                Time-Synchronized Rating Stream
                            </h3>
                        </div>
                        {handles.length > 0 ? (
                            <div className="flex-1 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(255,255,255,0.05)"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="time"
                                            tickFormatter={(val) =>
                                                format(
                                                    new Date(val * 1000),
                                                    'MM/yy',
                                                )
                                            }
                                            tick={{
                                                fill: '#64748b',
                                                fontSize: 10,
                                                fontWeight: 700,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            tick={{
                                                fill: '#64748b',
                                                fontSize: 10,
                                                fontWeight: 700,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            allowEscapeViewBox={{
                                                x: true,
                                                y: true,
                                            }}
                                            wrapperStyle={{ zIndex: 10000 }}
                                            content={({
                                                active,
                                                payload,
                                                label,
                                                coordinate,
                                                viewBox,
                                            }: any) => {
                                                if (
                                                    active &&
                                                    payload &&
                                                    payload.length
                                                ) {
                                                    // Safely position tooltip dynamically in the middle/hover point
                                                    const isRight =
                                                        coordinate && viewBox
                                                            ? coordinate.x >
                                                              viewBox.width *
                                                                  0.5
                                                            : false;
                                                    const isTop =
                                                        coordinate && viewBox
                                                            ? coordinate.y < 80
                                                            : false;

                                                    const translateX = isRight
                                                        ? '-100%'
                                                        : '0%';
                                                    const translateY = isTop
                                                        ? '15px'
                                                        : '-115%';

                                                    const tooltipStyle = {
                                                        transform: `translate(${translateX}, ${translateY})`,
                                                        transition:
                                                            'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                                                    };

                                                    return (
                                                        <div
                                                            style={tooltipStyle}
                                                            className="bg-card-app/90 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300"
                                                        >
                                                            <p className="text-[9px] font-black text-muted-app uppercase tracking-widest mb-2 leading-none">
                                                                {format(
                                                                    new Date(
                                                                        label *
                                                                            1000,
                                                                    ),
                                                                    'MMMM d, yyyy',
                                                                )}
                                                            </p>
                                                            <div className="flex flex-col gap-1.5">
                                                                {payload.map(
                                                                    (
                                                                        item: any,
                                                                        i: number,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                i
                                                                            }
                                                                            className="flex items-center gap-3"
                                                                        >
                                                                            <div
                                                                                className="w-1.5 h-1.5 rounded-full"
                                                                                style={{
                                                                                    backgroundColor:
                                                                                        item.color ||
                                                                                        item.stroke,
                                                                                }}
                                                                            />
                                                                            <span className="text-xs font-bold text-text-app">
                                                                                {
                                                                                    item.name
                                                                                }
                                                                            </span>
                                                                            <span className="text-xs font-black text-brand-primary ml-auto">
                                                                                {
                                                                                    item.value
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            height={40}
                                            iconType="circle"
                                            formatter={(value) => (
                                                <span className="text-[10px] font-black text-muted-app uppercase tracking-widest">
                                                    {value}
                                                </span>
                                            )}
                                        />
                                        {handles.map((h, idx) => (
                                            <Line
                                                key={h}
                                                type="monotone"
                                                dataKey={h}
                                                stroke={colors[idx]}
                                                strokeWidth={3}
                                                dot={false}
                                                animationDuration={2000}
                                                connectNulls
                                                activeDot={{
                                                    r: 4,
                                                    strokeWidth: 0,
                                                }}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 animate-pulse">
                                    <GitCompare
                                        size={32}
                                        className="text-muted-app/20"
                                    />
                                </div>
                                <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-app">
                                    Initialization Pending
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
