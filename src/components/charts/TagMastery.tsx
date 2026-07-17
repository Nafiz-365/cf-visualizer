import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { Submission } from '../../types';

interface TagMasteryProps {
    submissions: Submission[];
}

export function TagMastery({ submissions }: TagMasteryProps) {
    const solvedByTag = React.useMemo(() => {
        const tagsMap: Record<string, number> = {};
        const solvedIds = new Set();

        submissions
            .filter((s) => s.verdict === 'OK')
            .forEach((s) => {
                const problemId = `${s.problem.contestId}-${s.problem.index}`;
                if (!solvedIds.has(problemId)) {
                    solvedIds.add(problemId);
                    s.problem.tags.forEach((tag) => {
                        tagsMap[tag] = (tagsMap[tag] || 0) + 1;
                    });
                }
            });

        return Object.entries(tagsMap)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [submissions]);

    if (solvedByTag.length === 0) return null;

    return (
        <div className="w-full h-80 group">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                    data={solvedByTag}
                >
                    <PolarGrid
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="4 4"
                    />
                    <PolarAngleAxis
                        dataKey="tag"
                        tick={{
                            fill: '#64748b',
                            fontSize: 8,
                            fontWeight: 900,
                            letterSpacing: '0.05em',
                        }}
                    />
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
                                        className="bg-card-app/95 backdrop-blur-xl p-1.5 px-2.5 rounded-lg border border-white/10 shadow-xl animate-in fade-in zoom-in-95 duration-100"
                                    >
                                        <p className="text-[7px] font-black text-muted-app uppercase tracking-wider mb-0.5">
                                            Tag Domain
                                        </p>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-[9px] font-bold text-text-app">
                                                {payload[0].payload.tag}
                                            </p>
                                            <span className="text-[8px] font-black uppercase text-brand-primary tracking-wide">
                                                {payload[0].value} Solved
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Radar
                        name="Skill Matrix"
                        dataKey="count"
                        stroke="#a855f7"
                        strokeWidth={3}
                        fill="#a855f7"
                        fillOpacity={0.15}
                        animationDuration={2500}
                        activeDot={{
                            r: 5,
                            fill: '#a855f7',
                            stroke: '#fff',
                            strokeWidth: 2,
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
