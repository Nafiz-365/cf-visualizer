import React, { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Submission } from '../../types';

interface VerdictPieChartProps {
    submissions: Submission[];
}

const COLORS = {
    OK: '#10b981', // emerald-500
    WRONG_ANSWER: '#ef4444', // red-500
    TIME_LIMIT_EXCEEDED: '#f97316', // orange-500
    MEMORY_LIMIT_EXCEEDED: '#a855f7', // purple-500
    RUNTIME_ERROR: '#e11d48', // rose-600
    COMPILATION_ERROR: '#64748b', // slate-500
    SKIPPED: '#4b5563', // gray-600
    OTHER: '#334155', // slate-700
};

export function VerdictPieChart({ submissions }: VerdictPieChartProps) {
    const data = useMemo(() => {
        const counts: Record<string, number> = {};
        submissions.forEach((sub) => {
            const v = sub.verdict;
            counts[v] = (counts[v] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({
                name: name.replace(/_/g, ' '),
                rawName: name,
                value,
            }))
            .sort((a, b) => b.value - a.value);
    }, [submissions]);

    return (
        <div className="w-full h-80 relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <p className="text-[10px] font-black text-muted-app uppercase tracking-widest opacity-40">
                        Total
                    </p>
                    <p className="text-2xl font-display font-black text-text-app leading-none mt-1">
                        {submissions.length}
                    </p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="75%"
                        paddingAngle={0}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth={1}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={
                                    COLORS[
                                        entry.rawName as keyof typeof COLORS
                                    ] || COLORS.OTHER
                                }
                                fillOpacity={0.8}
                                stroke="rgba(0,0,0,0.2)"
                                strokeWidth={1.5}
                                className="hover:fill-opacity-100 hover:stroke-white/30 transition-all duration-300 cursor-pointer focus:outline-none"
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        allowEscapeViewBox={{ x: true, y: true }}
                        wrapperStyle={{ zIndex: 10000 }}
                        content={({
                            active,
                            payload,
                            coordinate,
                            viewBox,
                        }: any) => {
                            if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                const percentage = (
                                    (item.value / submissions.length) *
                                    100
                                ).toFixed(1);

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
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <div
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        COLORS[
                                                            item.rawName as keyof typeof COLORS
                                                        ] || COLORS.OTHER,
                                                }}
                                            />
                                            <p className="text-[7px] font-black text-text-app uppercase tracking-wider">
                                                {item.name}
                                            </p>
                                        </div>
                                        <div className="flex items-end gap-1">
                                            <p className="text-sm font-display font-black text-text-app leading-none">
                                                {item.value}
                                            </p>
                                            <p className="text-[8px] font-bold text-muted-app mb-0.5">
                                                {percentage}%
                                            </p>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        iconSize={6}
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => (
                            <span className="text-[9px] font-bold text-muted-app uppercase tracking-widest ml-1">
                                {value}
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
