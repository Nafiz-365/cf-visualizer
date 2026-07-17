import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { Submission } from '../../types';

interface SolvedByRatingProps {
    submissions: Submission[];
}

export function SolvedByRating({ submissions }: SolvedByRatingProps) {
    const data = useMemo(() => {
        const ratings: Record<number, number> = {};
        const solvedIds = new Set();

        submissions
            .filter((s) => s.verdict === 'OK' && s.problem.rating)
            .forEach((s) => {
                const problemId = `${s.problem.contestId}-${s.problem.index}`;
                if (!solvedIds.has(problemId)) {
                    solvedIds.add(problemId);
                    const r = s.problem.rating!;
                    ratings[r] = (ratings[r] || 0) + 1;
                }
            });

        return Object.entries(ratings)
            .map(([rating, count]) => ({
                rating: Number(rating),
                count,
            }))
            .sort((a, b) => a.rating - b.rating);
    }, [submissions]);

    return (
        <div className="w-full h-55 group">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                >
                    <XAxis
                        dataKey="rating"
                        tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                        allowEscapeViewBox={{ x: true, y: true }}
                        wrapperStyle={{ zIndex: 10000 }}
                        cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }}
                        content={({
                            active,
                            payload,
                            coordinate,
                            viewBox,
                        }: any) => {
                            if (active && payload && payload.length) {
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
                                        className="bg-card-app/95 backdrop-blur-xl p-1.5 px-2 rounded-lg border border-white/10 shadow-xl animate-in fade-in zoom-in-95 duration-100"
                                    >
                                        <p className="text-[7px] font-black text-muted-app uppercase tracking-wider mb-0.5">
                                            {payload[0].payload.rating} Rating
                                        </p>
                                        <p className="text-xs font-bold text-text-app">
                                            {payload[0].value} Solved
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar
                        dataKey="count"
                        radius={4}
                        animationDuration={1500}
                        barSize={16}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={
                                    entry.rating < 1200
                                        ? '#64748b'
                                        : entry.rating < 1400
                                          ? '#10b981'
                                          : entry.rating < 1600
                                            ? '#0ea5e9'
                                            : entry.rating < 1900
                                              ? '#3b82f6'
                                              : entry.rating < 2100
                                                ? '#a855f7'
                                                : entry.rating < 2400
                                                  ? '#f59e0b'
                                                  : '#ef4444'
                                }
                                fillOpacity={0.7}
                                className="hover:fill-opacity-100 transition-all duration-300"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
