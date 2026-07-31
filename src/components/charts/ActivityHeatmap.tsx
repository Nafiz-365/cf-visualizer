import React, {
    useMemo,
    useState,
    useRef,
    useCallback,
    useEffect,
} from 'react';
import { createPortal } from 'react-dom';
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

interface TooltipState {
    date: Date;
    count: number;
    /** viewport-relative coordinates for fixed positioning */
    vx: number;
    vy: number;
}

const CELL_SIZE = 'w-3.5 h-3.5'; // 14px — consistent column + cell
const CELL_GAP = 'gap-1'; // 4px

/** Maps submission count → Tailwind classes with premium hover states. */
function getCellClass(count: number): string {
    const base =
        'rounded-[3px] cursor-pointer transition-all duration-300 ease-out';
    const hover =
        'hover:scale-125 hover:z-50 hover:ring-2 hover:ring-white/40 hover:-translate-y-0.5';

    if (count === 0)
        return cn(
            base,
            hover,
            'bg-white/8 border border-white/10 hover:border-white/20 hover:bg-white/15',
        );

    if (count < 3)
        return cn(
            base,
            hover,
            'bg-brand-primary/30 border border-brand-primary/20 shadow-sm hover:shadow-[0_0_12px_rgba(79,142,247,0.4)]',
        );

    if (count < 6)
        return cn(
            base,
            hover,
            'bg-brand-primary/55 border border-brand-primary/30 shadow-md hover:shadow-[0_0_16px_rgba(79,142,247,0.6)] hover:brightness-110',
        );

    if (count < 10)
        return cn(
            base,
            hover,
            'bg-brand-primary/80 border border-brand-primary/40 shadow-lg hover:shadow-[0_0_20px_rgba(79,142,247,0.8)] hover:brightness-125',
        );

    // Peak activity
    return cn(
        base,
        hover,
        'bg-brand-primary border border-brand-primary/60 shadow-xl shadow-brand-primary/35 brightness-110 hover:shadow-[0_0_25px_rgba(79,142,247,1)] hover:brightness-150',
    );
}

const DAY_LABELS: Record<number, string> = { 1: 'M', 3: 'W', 5: 'F' }; // 0=Sun

function ActivityHeatmapImpl({
    submissions,
    rangeDays = 365,
    anchorDate,
}: HeatmapProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    // ── Build weeks + month labels ──────────────────────────────────
    const { weeks, monthLabels } = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const s of submissions) {
            const d = format(
                new Date(s.creationTimeSeconds * 1000),
                'yyyy-MM-dd',
            );
            counts[d] = (counts[d] ?? 0) + 1;
        }

        const end = anchorDate
            ? new Date(`${anchorDate}T00:00:00`)
            : startOfToday();
        const start = subDays(end, Math.max(rangeDays - 1, 30));

        // Enforce weekStartsOn: 0 (Sunday) to prevent locale shifts
        const graphStart = startOfWeek(start, { weekStartsOn: 0 });

        const days = eachDayOfInterval({ start: graphStart, end });

        const weeksArray: { date: Date; count: number }[][] = [];
        let cur: { date: Date; count: number }[] = [];

        for (const day of days) {
            cur.push({
                date: day,
                count: counts[format(day, 'yyyy-MM-dd')] ?? 0,
            });
            if (cur.length === 7) {
                weeksArray.push(cur);
                cur = [];
            }
        }
        if (cur.length > 0) weeksArray.push(cur);

        const labels: { label: string; index: number }[] = [];
        weeksArray.forEach((week, i) => {
            const first = week[0].date;
            if (i === 0 || !isSameMonth(first, weeksArray[i - 1][0].date)) {
                labels.push({ label: format(first, 'MMM'), index: i });
            }
        });

        return { weeks: weeksArray, monthLabels: labels };
    }, [submissions, rangeDays, anchorDate]);

    const hasActivity = submissions.length > 0;

    // ── Auto-scroll to the rightmost (most recent) week on mount ────
    useEffect(() => {
        if (scrollRef.current) {
            // Adding a tiny timeout ensures the DOM has painted the exact width before scrolling
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollLeft =
                        scrollRef.current.scrollWidth;
                }
            }, 50);
        }
    }, [weeks]);

    // ── Tooltip positioning (viewport-fixed to escape overflow clip) ─
    const handleMouseEnter = useCallback(
        (
            day: { date: Date; count: number },
            e: React.MouseEvent<HTMLDivElement>,
        ) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip({
                date: day.date,
                count: day.count,
                vx: rect.left + rect.width / 2,
                vy: rect.top,
            });
        },
        [],
    );

    const handleMouseLeave = useCallback(() => setTooltip(null), []);

    // ── Memoize Grid Rendering (Performance Optimization) ───────────
    // Prevents re-rendering 365 cells every time the tooltip state changes on hover
    const gridContent = useMemo(() => {
        return weeks.map((week, weekIdx) => {
            const monthLabel = monthLabels.find((l) => l.index === weekIdx);
            return (
                <div
                    key={weekIdx}
                    className={cn('flex flex-col shrink-0', CELL_GAP)}
                >
                    {/* Month label header */}
                    <div className="h-4.5 relative pointer-events-none select-none">
                        {monthLabel && (
                            <span className="absolute left-0 top-0 text-[9px] font-mono font-black text-muted-app uppercase opacity-50 whitespace-nowrap">
                                {monthLabel.label}
                            </span>
                        )}
                    </div>

                    {/* 7 day cells */}
                    {week.map((day, dayIdx) => (
                        <div
                            key={dayIdx}
                            onMouseEnter={(e) => handleMouseEnter(day, e)}
                            onMouseLeave={handleMouseLeave}
                            className={cn(CELL_SIZE, getCellClass(day.count))}
                            aria-label={`${format(day.date, 'MMM d, yyyy')}: ${day.count} submissions`}
                            role="gridcell"
                        />
                    ))}
                </div>
            );
        });
    }, [weeks, monthLabels, handleMouseEnter, handleMouseLeave]);

    return (
        <div className="w-full relative select-none flex flex-col gap-3">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-muted-app font-black uppercase tracking-[0.2em]">
                        Velocity Map
                    </p>
                    <p className="text-[9px] text-muted-app opacity-40 mt-0.5 uppercase font-bold">
                        {rangeDays === 30
                            ? 'Recent pulse'
                            : rangeDays === 90
                              ? 'Rolling quarter'
                              : rangeDays === 180
                                ? 'Half-year rhythm'
                                : 'Annual activity distribution'}
                    </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10 shadow-inner">
                    <span className="text-[8px] font-black text-muted-app uppercase opacity-40">
                        Rare
                    </span>
                    <div className="flex gap-1.5 items-center">
                        {[
                            'bg-white/8',
                            'bg-brand-primary/25',
                            'bg-brand-primary/50',
                            'bg-brand-primary/80',
                            'bg-brand-primary brightness-110 shadow-[0_0_8px_rgba(79,142,247,0.6)]',
                        ].map((cls, i) => (
                            <div
                                key={i}
                                className={cn('w-2.5 h-2.5 rounded-xs', cls)}
                            />
                        ))}
                    </div>
                    <span className="text-[8px] font-black text-muted-app uppercase opacity-40">
                        Peak
                    </span>
                </div>
            </div>

            {/* ── Grid ───────────────────────────────────────────── */}
            <div className="flex gap-1 relative z-10">
                {/* Day-of-week labels (Sun–Sat) */}
                <div className={cn('flex flex-col pt-5.5 shrink-0', CELL_GAP)}>
                    {Array.from({ length: 7 }, (_, i) => (
                        <div
                            key={i}
                            className={cn(
                                CELL_SIZE,
                                'flex items-center justify-end pr-1',
                                'text-[8px] font-mono font-bold text-muted-app opacity-40 leading-none',
                            )}
                        >
                            {DAY_LABELS[i] ?? ''}
                        </div>
                    ))}
                </div>

                {/* Scrollable week columns */}
                <div
                    ref={scrollRef}
                    className={cn(
                        'flex overflow-x-auto pb-3 pt-0 px-1 custom-scrollbar scroll-smooth',
                        CELL_GAP,
                    )}
                >
                    {gridContent}
                </div>
            </div>

            {/* Empty state */}
            {!hasActivity && (
                <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
                    <div className="rounded-full border border-dashed border-white/10 bg-card-app/80 backdrop-blur-sm px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-app/70 shadow-lg">
                        No submissions in this window
                    </div>
                </div>
            )}

            {/* ── Tooltip — fixed to viewport, escapes overflow clip ── */}
            {tooltip && <TooltipPortal tooltip={tooltip} />}
        </div>
    );
}

// ── Tooltip rendered at fixed viewport position ─────────────────────
function TooltipPortal({ tooltip }: { tooltip: TooltipState }) {
    const TOOLTIP_W = 120;
    const TOOLTIP_H = 48;

    // Clamp horizontally so it never overflows the viewport edges
    const left = Math.max(
        12,
        Math.min(
            tooltip.vx - TOOLTIP_W / 2,
            window.innerWidth - TOOLTIP_W - 12,
        ),
    );
    const top = tooltip.vy - TOOLTIP_H - 12;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                left,
                top,
                zIndex: 99999,
                pointerEvents: 'none',
            }}
            className="animate-in fade-in zoom-in-95 duration-200 ease-out"
        >
            <div className="bg-card-app/95 backdrop-blur-xl px-3 py-2 rounded-xl border border-brand-primary/20 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_16px_rgba(79,142,247,0.15)] whitespace-nowrap">
                <p className="text-[9px] font-black text-text-app opacity-80">
                    {format(tooltip.date, 'MMM d, yyyy')}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_4px_#4f8ef7]" />
                    <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wide">
                        {tooltip.count}{' '}
                        {tooltip.count === 1 ? 'Solution' : 'Solutions'}
                    </p>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export const ActivityHeatmap = React.memo(ActivityHeatmapImpl);
