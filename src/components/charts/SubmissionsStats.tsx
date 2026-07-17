import React, { useMemo } from 'react';
import { Submission } from '../../types';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';

interface SubmissionsStatsProps {
    submissions: Submission[];
}

const COLORS = [
    '#00B4D8', // Brand secondary
    '#ef4444', // Red-500
    '#f59e0b', // Amber-500
    '#8b5cf6', // Violet-500
    '#10b981', // Emerald-500
    '#64748b', // Slate-500
    '#ec4899', // Pink-500
];

export function SubmissionsStats({ submissions }: SubmissionsStatsProps) {
    const verdictData = useMemo(() => {
        const counts: Record<string, number> = {};
        submissions.forEach((s) => {
            counts[s.verdict] = (counts[s.verdict] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
            .sort((a, b) => b.value - a.value);
    }, [submissions]);

    const langData = useMemo(() => {
        const counts: Record<string, number> = {};
        submissions.forEach((s) => {
            // Normalize language names (e.g., Group C++ versions)
            const lang = s.programmingLanguage.split(' ')[0];
            counts[lang] = (counts[lang] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [submissions]);

    const CustomTooltip = ({ active, payload, coordinate, viewBox }: any) => {
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
                transition: 'transform 100ms cubic-bezier(0.16, 1, 0.3, 1)',
            };

            return (
                <div
                    style={tooltipStyle}
                    className="bg-card-app/95 backdrop-blur-xl p-1.5 px-2 rounded-lg border border-white/10 shadow-xl animate-in fade-in zoom-in-95 duration-100"
                >
                    <p className="text-[7px] font-black uppercase text-brand-secondary mb-0.5">
                        {payload[0].name}
                    </p>
                    <p className="text-[10px] font-bold text-text-app">
                        {payload[0].value}{' '}
                        <span className="text-[7px] opacity-50 font-medium">
                            SUBMISSIONS
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h4 className="text-[10px] font-mono font-bold text-muted-app uppercase tracking-[0.2em] mb-6">
                    Verdict Breakdown
                </h4>
                <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={verdictData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={0}
                                dataKey="value"
                            >
                                {verdictData.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
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
                                content={<CustomTooltip />}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                content={({ payload }) => (
                                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
                                        {payload?.map((entry: any, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-1.5"
                                            >
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            entry.color,
                                                    }}
                                                />
                                                <span className="text-[9px] font-bold text-muted-app uppercase tracking-widest">
                                                    {entry.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div>
                <h4 className="text-[10px] font-mono font-bold text-muted-app uppercase tracking-[0.2em] mb-6">
                    Language Usage
                </h4>
                <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={langData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={0}
                                dataKey="value"
                            >
                                {langData.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            COLORS[(index + 3) % COLORS.length]
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
                                content={<CustomTooltip />}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                content={({ payload }) => (
                                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
                                        {payload?.map((entry: any, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-1.5"
                                            >
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            entry.color,
                                                    }}
                                                />
                                                <span className="text-[9px] font-bold text-muted-app uppercase tracking-widest">
                                                    {entry.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
