import React from 'react';
import {
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Tooltip,
} from 'recharts';
import { Submission } from '../types';

interface RadarStrengthProps {
    submissions: Submission[];
}

export function RadarStrength({ submissions }: RadarStrengthProps) {
    const tagStats = submissions
        .filter((s) => s.verdict === 'OK')
        .reduce(
            (acc, sub) => {
                sub.problem.tags.forEach((tag) => {
                    acc[tag] = (acc[tag] || 0) + 1;
                });
                return acc;
            },
            {} as Record<string, number>,
        );

    const data = Object.entries(tagStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([subject, count]) => ({
            subject,
            count,
            fullMark: Math.max(...Object.values(tagStats)),
        }));

    return (
        <div className="h-80 w-full group">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                    <PolarGrid
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="3 3"
                    />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{
                            fill: '#64748b',
                            fontSize: 8,
                            fontWeight: 900,
                            letterSpacing: '0.1em',
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
                                        className="bg-card-app/90 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300"
                                    >
                                        <p className="text-[10px] font-black text-muted-app uppercase tracking-widest mb-1 leading-none">
                                            Cognitive Domain
                                        </p>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-display font-black text-text-app">
                                                {payload[0].payload.subject}
                                            </p>
                                            <span className="text-xs font-bold text-brand-primary">
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
                        name="Cognitive Depth"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="#3b82f6"
                        fillOpacity={0.15}
                        animationDuration={2000}
                        activeDot={{
                            r: 4,
                            fill: '#3b82f6',
                            stroke: '#fff',
                            strokeWidth: 2,
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
