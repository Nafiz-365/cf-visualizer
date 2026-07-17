import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Submission } from '../../types';

interface LanguageStatsProps {
    submissions: Submission[];
}

const COLORS = [
    '#2563eb',
    '#3b82f6',
    '#60a5fa',
    '#93c5fd',
    '#bfdbfe',
    '#7c3aed',
    '#8b5cf6',
    '#a78bfa',
    '#c4b5fd',
    '#ddd6fe',
    '#059669',
    '#10b981',
    '#34d399',
    '#6ee7b7',
    '#a7f3d0',
];

export function LanguageStats({ submissions }: LanguageStatsProps) {
    const data = useMemo(() => {
        const counts: Record<string, number> = {};
        submissions.forEach((s) => {
            let lang = s.programmingLanguage;
            if (lang.includes('C++')) lang = 'C++';
            else if (lang.includes('Java')) lang = 'Java';
            else if (lang.includes('Python')) lang = 'Python';
            else if (lang.includes('C#')) lang = 'C#';

            counts[lang] = (counts[lang] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({
                name,
                value,
                percentage: ((value / submissions.length) * 100).toFixed(1),
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [submissions]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-display font-bold text-text-app">
                        Linguistic DNA
                    </h3>
                    <p className="text-[10px] font-mono text-muted-app uppercase tracking-[0.2em] mt-1 opacity-50">
                        Primary coding environments
                    </p>
                </div>
                <div className="flex -space-x-2">
                    {data.map((item, idx) => (
                        <div
                            key={item.name}
                            className="w-8 h-8 rounded-full border-2 border-bg-app flex items-center justify-center text-[10px] font-black text-white"
                            style={{
                                backgroundColor: COLORS[idx % COLORS.length],
                            }}
                        >
                            {item.name[0]}
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {data.map((item, idx) => (
                    <div key={item.name} className="group">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-text-app group-hover:text-brand-primary transition-colors">
                                {item.name}
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-display font-black text-text-app leading-none">
                                    {item.value}
                                </span>
                                <span className="text-[9px] font-bold text-muted-app uppercase opacity-40">
                                    {item.percentage}%
                                </span>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                transition={{
                                    duration: 1,
                                    ease: 'easeOut',
                                    delay: idx * 0.1,
                                }}
                                className="h-full rounded-full"
                                style={{
                                    backgroundColor:
                                        COLORS[idx % COLORS.length],
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
