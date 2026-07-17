import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { Submission } from '../types';

interface ProblemDistributionProps {
    submissions: Submission[];
}

export function ProblemDistribution({ submissions }: ProblemDistributionProps) {
    const solved = submissions.filter((s) => s.verdict === 'OK');

    const distribution = solved.reduce(
        (acc, s) => {
            const rating = s.problem.rating;
            if (rating) {
                acc[rating] = (acc[rating] || 0) + 1;
            }
            return acc;
        },
        {} as Record<number, number>,
    );

    const data = Object.entries(distribution)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([rating, count]) => ({
            rating: Number(rating),
            count,
        }));

    const totalSolved = data.reduce((sum, item) => sum + item.count, 0);
    const peakBucket = data.reduce(
        (best, item) => (item.count > best.count ? item : best),
        { rating: 0, count: 0 },
    );
    const ratingRange = data.length
        ? `${data[0].rating} - ${data[data.length - 1].rating}`
        : 'N/A';

    return (
        <div className="group">
            <div className="grid gap-3 mb-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-card-app/70 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-app mb-2">
                        Rating range
                    </p>
                    <p className="text-lg md:text-xl font-display font-bold text-text-app">
                        {ratingRange}
                    </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-card-app/70 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-app mb-2">
                        Peak band
                    </p>
                    <p className="text-lg md:text-xl font-display font-bold text-text-app">
                        {peakBucket.rating || 'N/A'}
                    </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-card-app/70 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-app mb-2">
                        Best density
                    </p>
                    <p className="text-lg md:text-xl font-display font-bold text-text-app">
                        {peakBucket.count} solved
                    </p>
                </div>
            </div>

            <div className="h-72 sm:h-80 w-full rounded-[1.75rem] overflow-visible bg-card-app/10 border border-white/10 px-2 py-3">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 4, left: -10, bottom: 6 }}
                    >
                        <CartesianGrid
                            strokeDasharray="6 6"
                            vertical={false}
                            stroke="rgba(255,255,255,0.08)"
                        />
                        <XAxis
                            dataKey="rating"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fill: '#94a3b8',
                                fontSize: 10,
                                fontWeight: 700,
                            }}
                            dy={10}
                            interval={0}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fill: '#94a3b8',
                                fontSize: 10,
                                fontWeight: 700,
                            }}
                        />
                        <Tooltip
                            allowEscapeViewBox={{ x: true, y: true }}
                            wrapperStyle={{ zIndex: 10000 }}
                            cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                            content={({
                                active,
                                payload,
                                coordinate,
                                viewBox,
                            }: any) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload;

                                    const isRight =
                                        coordinate && viewBox
                                            ? coordinate.x > viewBox.width * 0.7
                                            : false;
                                    const isTop =
                                        coordinate && viewBox
                                            ? coordinate.y < 72
                                            : false;

                                    const translateX = isRight
                                        ? '-100%'
                                        : '-50%';
                                    const translateY = isTop ? '16px' : '-120%';

                                    const tooltipStyle = {
                                        transform: `translate(${translateX}, ${translateY})`,
                                        transition:
                                            'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                                    };

                                    return (
                                        <div
                                            style={tooltipStyle}
                                            className="bg-card-app/95 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl"
                                        >
                                            <p className="text-[10px] font-black text-muted-app uppercase tracking-widest mb-2">
                                                Rating bucket
                                            </p>
                                            <div className="flex items-end gap-3">
                                                <p className="text-2xl font-display font-black text-text-app leading-none">
                                                    {item.rating}
                                                </p>
                                                <span className="text-[10px] font-bold text-brand-primary mb-0.5">
                                                    {item.count} solved
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-app mt-2">
                                                {(
                                                    (item.count / totalSolved) *
                                                    100
                                                ).toFixed(1)}
                                                % of solved problems
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="count"
                            radius={8}
                            animationDuration={1500}
                            maxBarSize={22}
                        >
                            {data.map((entry, index) => {
                                const color =
                                    entry.rating >= 2400
                                        ? '#ef4444'
                                        : entry.rating >= 1900
                                          ? '#a855f7'
                                          : entry.rating >= 1600
                                            ? '#3b82f6'
                                            : entry.rating >= 1200
                                              ? '#10b981'
                                              : '#64748b';
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={color}
                                        fillOpacity={0.9}
                                        className="hover:fill-opacity-100 transition-all duration-300 cursor-pointer"
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
