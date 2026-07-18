import React, { useMemo, useState, useRef } from 'react';
import { Submission } from '../../types';
import {
    format,
    subDays,
    startOfToday,
    eachDayOfInterval,
    startOfWeek,
    isSameMonth,
} from 'date-fns';
import { cn } from '../../lib/utils';

interface HeatmapProps {
    submissions: Submission[];
    rangeDays?: number;
    anchorDate?: string;
}

export function ActivityHeatmap({
    submissions,
    rangeDays = 365,
    anchorDate,
}: HeatmapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState<{
        date: Date;
        count: number;
        x: number;
        y: number;
    } | null>(null);

    const { weeks, monthLabels } = useMemo(() => {
        const counts: Record<string, number> = {};
        submissions.forEach((s) => {
            const date = format(
                new Date(s.creationTimeSeconds * 1000),
                'yyyy-MM-dd',
            );
            counts[date] = (counts[date] || 0) + 1;
        });

        const end = anchorDate
            ? new Date(`${anchorDate}T00:00:00`)
            : startOfToday();
        const start = subDays(end, Math.max(rangeDays - 1, 30));
        const startOfGraph = startOfWeek(start);

        const days = eachDayOfInterval({
            start: startOfGraph,
            end: end,
        });

        const weeksArray: { date: Date; count: number }[][] = [];
        let currentWeek: { date: Date; count: number }[] = [];

        days.forEach((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            currentWeek.push({
                date: day,
                count: counts[dateStr] || 0,
            });

            if (currentWeek.length === 7) {
                weeksArray.push(currentWeek);
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            weeksArray.push(currentWeek);
        }

        // Generate Month Labels
        const labels: { label: string; index: number }[] = [];
        weeksArray.forEach((week, i) => {
            const firstDay = week[0].date;
            if (i === 0 || !isSameMonth(firstDay, weeksArray[i - 1][0].date)) {
                labels.push({ label: format(firstDay, 'MMM'), index: i });
            }
        });

        return { weeks: weeksArray, monthLabels: labels };
    }, [submissions, rangeDays, anchorDate]);

    const hasActivity = submissions.length > 0;

    const getColor = (count: number) => {
        if (count === 0) return 'bg-white/8 border border-white/10';
        if (count < 3)
            return 'bg-brand-primary/30 border border-brand-primary/20 shadow-sm shadow-brand-primary/10';
        if (count < 6)
            return 'bg-brand-primary/55 border border-brand-primary/30 shadow-md shadow-brand-primary/15';
        if (count < 10)
            return 'bg-brand-primary/80 border border-brand-primary/40 shadow-lg shadow-brand-primary/20';
        return 'bg-brand-primary border border-brand-primary/60 shadow-xl shadow-brand-primary/35 brightness-110';
    };

    const handleMouseEnter = (
        day: { date: Date; count: number },
        e: React.MouseEvent<HTMLDivElement>,
    ) => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const targetRect = e.currentTarget.getBoundingClientRect();

        // Position of cell center relative to container
        const x = targetRect.left - containerRect.left + targetRect.width / 2;
        // Position of cell top relative to container
        const y = targetRect.top - containerRect.top;

        setHovered({
            date: day.date,
            count: day.count,
            x,
            y,
        });
    };

    const getTooltipStyle = () => {
        if (!hovered || !containerRef.current) return {};
        const containerWidth =
            containerRef.current.getBoundingClientRect().width;
        const tooltipWidth = 90; // compact tooltip estimation

        // Compute left coordinate so the tooltip is centered on the hovered cell
        let leftPos = hovered.x - tooltipWidth / 2;

        // Prevent spilling out of the left layout boundary (minimum 8px indent)
        if (leftPos < 8) {
            leftPos = 8;
        }
        // Prevent spilling out of the right layout boundary (minimum 8px indent)
        else if (leftPos + tooltipWidth > containerWidth - 8) {
            leftPos = containerWidth - tooltipWidth - 8;
        }

        return {
            left: `${leftPos}px`,
            top: `${hovered.y - 8}px`, // compact offset
            transform: 'translate(0, -100%)', // align perfectly
        };
    };

    return (
        <div
            ref={containerRef}
            className="w-full relative select-none min-h-55 flex flex-col justify-between"
        >
            {/* Velocity Header */}
            <div className="flex items-center justify-between pb-2">
                <div>
                    <p className="text-[10px] text-muted-app font-black uppercase tracking-[0.2em]">
                        Velocity Map
                    </p>
                    <p className="text-[9px] text-muted-app opacity-40 mt-1 uppercase font-bold">
                        {rangeDays === 30
                            ? 'Recent pulse'
                            : rangeDays === 90
                              ? 'Rolling quarter'
                              : rangeDays === 180
                                ? 'Half-year rhythm'
                                : 'Annual activity distribution'}
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
                    <span className="text-[8px] font-black text-muted-app uppercase opacity-40">
                        Rare
                    </span>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-xs bg-white/5" />
                        <div className="w-2.5 h-2.5 rounded-xs bg-brand-primary/20" />
                        <div className="w-2.5 h-2.5 rounded-xs bg-brand-primary/55" />
                        <div className="w-2.5 h-2.5 rounded-xs bg-brand-primary/80" />
                        <div className="w-2.5 h-2.5 rounded-xs bg-brand-primary brightness-110" />
                    </div>
                    <span className="text-[8px] font-black text-muted-app uppercase opacity-40">
                        Peak
                    </span>
                </div>
            </div>

            {/* Stable Scrollable Container */}
            <div className="relative w-full min-h-37.5 overflow-visible mt-2">
                {/* Inner container with horizontal scroll (with thin custom-scrollbar) */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 pt-1 px-1 w-full min-h-[150px] custom-scrollbar">
                    {weeks.map((week, weekIdx) => {
                        const monthLabel = monthLabels.find(
                            (lbl) => lbl.index === weekIdx,
                        );
                        return (
                            <div
                                key={weekIdx}
                                className="flex flex-col gap-1 shrink-0 relative w-3.5"
                            >
                                {/* Month Label Header */}
                                <div className="h-4 text-[8px] font-mono text-muted-app uppercase font-black opacity-50 relative pointer-events-none select-none">
                                    {monthLabel && (
                                        <span className="absolute left-0 top-0 whitespace-nowrap">
                                            {monthLabel.label}
                                        </span>
                                    )}
                                </div>

                                {/* The 7 Day Cells */}
                                {week.map((day, dayIdx) => (
                                    <div
                                        key={dayIdx}
                                        onMouseEnter={(e) =>
                                            handleMouseEnter(day, e)
                                        }
                                        onMouseLeave={() => setHovered(null)}
                                        className={cn(
                                            'w-3 h-3 rounded-[4px] cursor-pointer relative transition-all duration-75 hover:brightness-125 hover:ring-1 hover:ring-brand-primary/80 hover:z-10',
                                            getColor(day.count),
                                        )}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {!hasActivity && (
                <div className="absolute inset-x-0 bottom-2 flex justify-center">
                    <div className="rounded-full border border-dashed border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-app/70">
                        No submissions in this window
                    </div>
                </div>
            )}

            {/* Floating Dynamic Tooltip: outside of clipping wrapper to prevent cutting off */}
            {hovered && (
                <div
                    style={getTooltipStyle()}
                    className="absolute z-50 pointer-events-none"
                >
                    <div className="bg-card-app/95 backdrop-blur-xl p-1.5 px-2 rounded-lg border border-white/10 shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
                        <p className="text-[7px] font-black text-text-app">
                            {format(hovered.date, 'MMM d, yyyy')}
                        </p>
                        <p className="text-[8px] font-bold text-brand-primary uppercase mt-0.5">
                            {hovered.count} Solutions
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
