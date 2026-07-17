import React, { useMemo } from 'react';
import { Submission } from '../../types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface ProblemLevelStatsProps {
    submissions: Submission[];
}

export function ProblemLevelStats({ submissions }: ProblemLevelStatsProps) {
    const levelData = useMemo(() => {
        const counts: Record<string, number> = {};
        const solved = submissions.filter((s) => s.verdict === 'OK');
        const uniqueSolved = new Map();

        solved.forEach((s) => {
            const id = `${s.problem.contestId}-${s.problem.index}`;
            if (!uniqueSolved.has(id)) {
                uniqueSolved.set(id, s.problem.index.charAt(0));
            }
        });

        uniqueSolved.forEach((level) => {
            counts[level] = (counts[level] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, 10); // Keep common levels A-J
    }, [submissions]);

    return (
        <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={levelData}>
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: '#94a3b8',
                            fontSize: 10,
                            fontWeight: 'bold',
                        }}
                    />
                    <YAxis hide />
                    <Tooltip
                        allowEscapeViewBox={{ x: true, y: true }}
                        wrapperStyle={{ zIndex: 10000 }}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
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
                                        <p className="text-[7px] font-black text-brand-secondary mb-0.5">
                                            LEVEL {payload[0].payload.name}
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
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {levelData.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={
                                    index < 3
                                        ? 'var(--color-brand-primary)'
                                        : 'var(--color-brand-secondary)'
                                }
                                opacity={0.8}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
