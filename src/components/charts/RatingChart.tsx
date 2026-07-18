import React from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine,
} from 'recharts';
import { RatingChange } from '../../types';
import { format } from 'date-fns';

const RANK_LEVELS = [
    { name: 'Grandmaster', min: 2400, color: 'rgba(239, 68, 68, 0.05)' },
    { name: 'Master', min: 2100, color: 'rgba(251, 146, 60, 0.05)' },
    { name: 'Candidate Master', min: 1900, color: 'rgba(192, 132, 252, 0.05)' },
    { name: 'Expert', min: 1600, color: 'rgba(96, 165, 250, 0.05)' },
    { name: 'Specialist', min: 1400, color: 'rgba(34, 211, 238, 0.05)' },
    { name: 'Pupil', min: 1200, color: 'rgba(74, 222, 128, 0.05)' },
    { name: 'Newbie', min: 0, color: 'rgba(148, 163, 184, 0.05)' },
];

interface RatingChartProps {
    data: RatingChange[];
}

export function RatingChart({ data }: RatingChartProps) {
    const chartData = data.map((d) => ({
        date: format(new Date(d.ratingUpdateTimeSeconds * 1000), 'MMM yyyy'),
        rating: d.newRating,
        change: d.newRating - d.oldRating,
        contest: d.contestName,
        rank: d.rank,
    }));

    if (data.length === 0) return null;

    const minVal = Math.min(...data.map((d) => d.newRating));
    const maxVal = Math.max(...data.map((d) => d.newRating));
    const minRating = Math.max(0, minVal - 200);
    const maxRating = maxVal + 300;

    return (
        <div className="w-full h-full group">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient
                            id="ratingGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#3b82f6"
                                stopOpacity={0.4}
                            />
                            <stop
                                offset="50%"
                                stopColor="#3b82f6"
                                stopOpacity={0.1}
                            />
                            <stop
                                offset="100%"
                                stopColor="#3b82f6"
                                stopOpacity={0.02}
                            />
                        </linearGradient>
                        <filter
                            id="glow"
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                        >
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite
                                in="SourceGraphic"
                                in2="blur"
                                operator="over"
                            />
                        </filter>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="6 6"
                        vertical={false}
                        stroke="rgba(255,255,255,0.02)"
                    />

                    {RANK_LEVELS.map((level, idx) => {
                        const nextLevelMin = RANK_LEVELS[idx - 1]?.min || 5000;
                        if (level.min < maxRating && nextLevelMin > minRating) {
                            return (
                                <ReferenceLine
                                    key={level.name}
                                    y={level.min}
                                    stroke={level.color.replace('0.05', '0.08')}
                                    strokeDasharray="4 4"
                                    label={{
                                        value: level.name,
                                        position: 'right',
                                        fill: level.color.replace(
                                            '0.05',
                                            '0.3',
                                        ),
                                        fontSize: 7,
                                        fontWeight: 800,
                                        letterSpacing: '0.1em',
                                    }}
                                />
                            );
                        }
                        return null;
                    })}

                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fontSize: 8,
                            fill: '#64748b',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                        }}
                        minTickGap={40}
                        dy={10}
                    />
                    <YAxis
                        domain={[minRating, maxRating]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 8, fill: '#64748b', fontWeight: 800 }}
                        width={40}
                    />
                    <Tooltip
                        allowEscapeViewBox={{ x: true, y: true }}
                        wrapperStyle={{ zIndex: 10000 }}
                        cursor={{
                            stroke: 'rgba(255,255,255,0.1)',
                            strokeWidth: 1,
                        }}
                        content={({
                            active,
                            payload,
                            coordinate,
                            viewBox,
                        }: any) => {
                            if (active && payload && payload.length) {
                                const item = payload[0].payload;

                                let translateX = '-50%';
                                if (coordinate && viewBox) {
                                    const ratio = coordinate.x / viewBox.width;
                                    if (ratio < 0.2) {
                                        translateX = '-15%';
                                    } else if (ratio > 0.8) {
                                        translateX = '-85%';
                                    }
                                }

                                const tooltipStyle = {
                                    transform: `translate(${translateX}, -120%)`,
                                    transition:
                                        'transform 100ms cubic-bezier(0.16, 1, 0.3, 1)',
                                };

                                return (
                                    <div
                                        style={tooltipStyle}
                                        className="bg-card-app/95 backdrop-blur-xl p-1.5 px-2.5 rounded-lg shadow-xl border border-white/10 animate-in fade-in zoom-in-95 duration-100"
                                    >
                                        <div className="flex items-center justify-between mb-1 gap-2">
                                            <p className="text-[7px] text-muted-app font-black uppercase tracking-[0.2em]">
                                                {item.date}
                                            </p>
                                            <div
                                                className={cn(
                                                    'px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider',
                                                    item.change >= 0
                                                        ? 'bg-emerald-500/10 text-emerald-500'
                                                        : 'bg-red-500/10 text-red-500',
                                                )}
                                            >
                                                {item.change >= 0 ? '+' : ''}
                                                {item.change}
                                            </div>
                                        </div>
                                        <p className="text-[9px] font-bold text-text-app mb-1 leading-snug wrap-break-word whitespace-normal max-w-30">
                                            {item.contest}
                                        </p>
                                        <div className="flex items-end gap-1.5">
                                            <p className="text-base font-display font-black text-text-app tracking-tighter leading-none">
                                                {item.rating}
                                            </p>
                                            <span className="text-[7px] text-muted-app font-black opacity-40 mb-0.5">
                                                RANK #{item.rank}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="rating"
                        stroke="#3b82f6"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#ratingGradient)"
                        animationDuration={2000}
                        activeDot={{
                            r: 8,
                            fill: '#3b82f6',
                            stroke: '#fff',
                            strokeWidth: 3,
                            filter: 'url(#glow)',
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
