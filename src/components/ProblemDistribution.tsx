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

    return (
        <div className="h-80 w-full group">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                >
                    <CartesianGrid
                        strokeDasharray="6 6"
                        vertical={false}
                        stroke="rgba(255,255,255,0.02)"
                    />
                    <XAxis
                        dataKey="rating"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }}
                    />
                    <Tooltip
                        allowEscapeViewBox={{ x: true, y: true }}
                        wrapperStyle={{ zIndex: 10000 }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        content={({
                            active,
                            payload,
                            coordinate,
                            viewBox,
                        }: any) => {
                            if (active && payload && payload.length) {
                                const item = payload[0].payload;

                                // Safely position tooltip dynamically in the middle/hover point
                                const isRight =
                                    coordinate && viewBox
                                        ? coordinate.x > viewBox.width * 0.5
                                        : false;
                                const isTop =
                                    coordinate && viewBox
                                        ? coordinate.y < 80
                                        : false;

                                const translateX = isRight ? '-100%' : '0%';
                                const translateY = isTop ? '15px' : '-115%';

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
                                        <p className="text-[10px] font-black text-muted-app uppercase tracking-widest mb-1">
                                            Index Rating
                                        </p>
                                        <div className="flex items-end gap-3">
                                            <p className="text-2xl font-display font-black text-text-app leading-none">
                                                {item.rating}
                                            </p>
                                            <span className="text-[10px] font-bold text-brand-primary mb-0.5">
                                                {item.count} Solved
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar
                        dataKey="count"
                        radius={6}
                        animationDuration={1500}
                        maxBarSize={20}
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
                                    fillOpacity={0.8}
                                    className="hover:fill-opacity-100 transition-all duration-300 cursor-pointer"
                                />
                            );
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
