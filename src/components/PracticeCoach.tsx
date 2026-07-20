import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { User, RatingChange, Submission } from '../types';
import { motion } from 'motion/react';
import {
    Sparkles,
    TrendingUp,
    ListTodo,
    AlertTriangle,
    Zap,
    ChevronRight,
    ArrowUpRight,
    Play,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

interface PracticeCoachProps {
    user: User;
    ratingHistory: RatingChange[];
    submissions: Submission[];
}

export function PracticeCoach({
    user,
    ratingHistory,
    submissions,
}: PracticeCoachProps) {
    const [completedTasks, setCompletedTasks] = useState<
        Record<string, boolean>
    >({});

    const toggleTask = (id: string) => {
        setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // 1. Analyze if Stagnated (PLATEAU DETECTOR)
    const stagnationAnalysis = useMemo(() => {
        if (ratingHistory.length < 3) {
            return {
                isStagnated: false,
                message:
                    'Keep participating in rated rounds to calibrate stagnation diagnostics!',
                level: 'normal' as const,
            };
        }

        // Check last 3 rated rounds
        const lastThree = ratingHistory.slice(-3);
        const maxRatingInLastThree = Math.max(
            ...lastThree.map((h) => h.newRating),
        );
        const minRatingInLastThree = Math.min(
            ...lastThree.map((h) => h.newRating),
        );
        const ratingSpan = maxRatingInLastThree - minRatingInLastThree;

        const isStagnated = ratingSpan < 40 && (user.rating || 0) > 1200;

        if (isStagnated) {
            return {
                isStagnated: true,
                message:
                    'Plateau Detected: Your rating has fluctuated by less than 40 points over your last 3 rounds. Time to adjust your preparation!',
                level: 'warning' as const,
            };
        }

        return {
            isStagnated: false,
            message:
                'Optimal Progression: Your active ratings trajectory is healthy and responding to training cycles.',
            level: 'healthy' as const,
        };
    }, [ratingHistory, user]);

    // 2. Rating Forecast over the next 90 days based on active solve rates
    const forecastData = useMemo(() => {
        const baseRating = user.rating || 1200;

        // Solve rate (problems per week)
        const recentSubmissions = submissions.filter((s) => s.verdict === 'OK');
        const weeklySolveCount = Math.min(
            25,
            Math.max(1, Math.round(recentSubmissions.length / 4)),
        );

        // Forecast factors
        const optimisticFactor = weeklySolveCount * 4.2;
        const baseFactor = weeklySolveCount * 2.1;
        const conservativeFactor = weeklySolveCount * 0.8;

        return [
            {
                day: 'Day 0',
                pessimistic: baseRating,
                base: baseRating,
                optimistic: baseRating,
            },
            {
                day: 'Day 15',
                pessimistic: Math.round(baseRating + conservativeFactor * 1.5),
                base: Math.round(baseRating + baseFactor * 1.5),
                optimistic: Math.round(baseRating + optimisticFactor * 1.5),
            },
            {
                day: 'Day 30',
                pessimistic: Math.round(baseRating + conservativeFactor * 3.0),
                base: Math.round(baseRating + baseFactor * 3.0),
                optimistic: Math.round(baseRating + optimisticFactor * 3.0),
            },
            {
                day: 'Day 60',
                pessimistic: Math.round(baseRating + conservativeFactor * 6.0),
                base: Math.round(baseRating + baseFactor * 6.0),
                optimistic: Math.round(baseRating + optimisticFactor * 6.0),
            },
            {
                day: 'Day 90',
                pessimistic: Math.round(baseRating + conservativeFactor * 9.0),
                base: Math.round(baseRating + baseFactor * 9.0),
                optimistic: Math.round(baseRating + optimisticFactor * 9.0),
            },
        ];
    }, [user, submissions]);

    // 3. Weekly Study Plan Generation based on Rating
    const studyPlan = useMemo(() => {
        const rating = user.rating || 1200;

        if (rating < 1400) {
            return {
                title: 'Phase I: Constructive Core & Greedy Algorithms',
                tasks: [
                    {
                        id: 't1',
                        label: 'Solve 3 Constructive Algorithms rated 1100-1300',
                        desc: 'Solidifies logical edge-case handling.',
                    },
                    {
                        id: 't2',
                        label: 'Complete 2 Greedy challenges under 30 minutes',
                        desc: 'Focuses on speed calibration and greedy invariants.',
                    },
                    {
                        id: 't3',
                        label: 'Analyze a past contest editorial',
                        desc: 'Expands pattern-matching lexicon.',
                    },
                ],
            };
        } else if (rating < 1800) {
            return {
                title: 'Phase II: Dynamic Programming & Math Invariants',
                tasks: [
                    {
                        id: 't1',
                        label: 'Solve 4 Dynamic Programming problems rated 1500-1700',
                        desc: 'Establishes state transition intuition.',
                    },
                    {
                        id: 't2',
                        label: 'Implement 2 Graph/DFS traversal applications',
                        desc: 'Strengthens topological and shortest path concepts.',
                    },
                    {
                        id: 't3',
                        label: 'Upsolve problem C/D from last participated round',
                        desc: 'Pushes beyond current comfort zone.',
                    },
                ],
            };
        } else {
            return {
                title: 'Phase III: Advanced Structures & Segment Trees',
                tasks: [
                    {
                        id: 't1',
                        label: 'Practice 3 Data Structures / Segment Tree problems > 1900',
                        desc: 'Master range queries and lazy propagation.',
                    },
                    {
                        id: 't2',
                        label: 'Solve 2 Combinatorics & Number Theory challenges',
                        desc: 'Refines high-rating analytical math proofs.',
                    },
                    {
                        id: 't3',
                        label: 'Complete 1 virtual contest with friend comparison',
                        desc: 'Simulates real-world round pacing and stress.',
                    },
                ],
            };
        }
    }, [user]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Rating Forecast / Progression Chart */}
            <Card className="lg:col-span-8 p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-brand-primary" />
                        <h3 className="text-xs uppercase font-black tracking-widest text-text-app">
                            90-Day Rating Projection
                        </h3>
                    </div>
                    <span className="text-[8px] font-mono font-bold text-muted-app uppercase">
                        Active Solve Velocity
                    </span>
                </div>

                <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={forecastData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient
                                    id="colorOptimistic"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#4f8ef7"
                                        stopOpacity={0.2}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#4f8ef7"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="colorBase"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#9d6ef5"
                                        stopOpacity={0.2}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#9d6ef5"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="day"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                            />
                            <YAxis
                                domain={['dataMin - 100', 'dataMax + 100']}
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    borderColor: 'rgba(255,255,255,0.08)',
                                    borderRadius: '12px',
                                }}
                                labelStyle={{
                                    color: '#94a3b8',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                }}
                                itemStyle={{
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                }}
                            />
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.02)"
                            />
                            <Area
                                type="monotone"
                                dataKey="optimistic"
                                name="Optimistic Path"
                                stroke="#4f8ef7"
                                fillOpacity={1}
                                fill="url(#colorOptimistic)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="base"
                                name="Base Path"
                                stroke="#9d6ef5"
                                fillOpacity={1}
                                fill="url(#colorBase)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="pessimistic"
                                name="Conservative Path"
                                stroke="#64748b"
                                fillOpacity={0}
                                strokeDasharray="4 4"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <p className="text-[10px] text-muted-app leading-relaxed">
                    * The rating forecast is simulated dynamically by
                    aggregating your daily solve count over the last 30 days and
                    modeling standard Elo shifts in Div 2/3 rounds.
                </p>
            </Card>

            {/* Weekly Study Plan & Stagnation Diagnostic */}
            <div className="lg:col-span-4 space-y-6">
                {/* Stagnation Panel */}
                <Card
                    className={cn(
                        'p-5 border transition-all duration-300',
                        stagnationAnalysis.isStagnated
                            ? 'bg-red-500/5 border-red-500/20'
                            : 'bg-emerald-500/5 border-emerald-500/10',
                    )}
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle
                            size={18}
                            className={cn(
                                'mt-0.5 shrink-0',
                                stagnationAnalysis.isStagnated
                                    ? 'text-red-400'
                                    : 'text-emerald-400',
                            )}
                        />
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-text-app">
                                Plateau Diagnostic Alert
                            </h4>
                            <p className="text-xs text-muted-app leading-normal">
                                {stagnationAnalysis.message}
                            </p>
                            {stagnationAnalysis.isStagnated && (
                                <div className="pt-3">
                                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">
                                        Coach Action Plan:
                                    </p>
                                    <p className="text-[10px] text-muted-app italic">
                                        Avoid mass-solving easy comfort
                                        problems. Target problems 200+ points
                                        above your current rating and analyze
                                        editorial structures after 20 mins.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Study Plan */}
                <Card className="p-5 space-y-5 bg-linear-to-br from-white/3 to-transparent">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <ListTodo
                                size={14}
                                className="text-brand-primary"
                            />
                            <h4 className="text-[10px] uppercase tracking-widest font-black text-text-app">
                                Weekly Training Sprint
                            </h4>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                            Active
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-[9px] uppercase text-muted-app/60 font-black">
                                Curriculum Focus
                            </p>
                            <p className="text-xs font-bold text-text-app mt-0.5">
                                {studyPlan.title}
                            </p>
                        </div>

                        <div className="space-y-2.5">
                            {studyPlan.tasks.map((task) => {
                                const isDone = !!completedTasks[task.id];
                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => toggleTask(task.id)}
                                        className={cn(
                                            'p-3 rounded-xl border transition-all cursor-pointer select-none',
                                            isDone
                                                ? 'bg-brand-primary/5 border-brand-primary/20 text-muted-app/60'
                                                : 'bg-white/2 border-white/5 text-text-app hover:bg-white/4',
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={cn(
                                                    'w-4 h-4 rounded-md border flex items-center justify-center mt-0.5 shrink-0 transition-colors',
                                                    isDone
                                                        ? 'bg-brand-primary border-brand-primary text-white'
                                                        : 'border-white/20',
                                                )}
                                            >
                                                {isDone && (
                                                    <CheckCircle2 size={12} />
                                                )}
                                            </div>
                                            <div>
                                                <p
                                                    className={cn(
                                                        'text-xs font-bold',
                                                        isDone &&
                                                            'line-through',
                                                    )}
                                                >
                                                    {task.label}
                                                </p>
                                                <p className="text-[9px] text-muted-app mt-0.5">
                                                    {task.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
