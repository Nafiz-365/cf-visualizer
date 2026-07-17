import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    animate?: boolean;
    glow?: boolean;
}

export function Card({
    children,
    className,
    animate = true,
    glow = false,
    ...props
}: CardProps) {
    const Component = animate ? motion.div : 'div';

    return (
        <Component
            initial={animate ? { opacity: 0, y: 20 } : undefined}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                glow ? 'glass-glow' : 'glass-premium',
                'rounded-[1.75rem] p-5 md:p-8',
                className,
            )}
            {...(props as any)}
        >
            {children}
        </Component>
    );
}

/* ── Stat Card ─────────────────────────────────────────────────── */

export function StatCard({
    label,
    value,
    subValue,
    icon: Icon,
    color,
    trend,
}: {
    label: string;
    value?: string | number;
    subValue?: string;
    icon?: React.ElementType;
    color?: string;
    trend?: 'up' | 'down' | 'neutral';
}) {
    /** Map a `text-*` color class to the equivalent `bg-*` + `shadow-*`. */
    const resolveColor = () => {
        if (!color)
            return {
                bg: 'bg-brand-primary/10',
                text: 'text-brand-primary',
                fill: 'bg-[#4f8ef7]',
            };
        const textCls =
            color.split(' ').find((c) => c.startsWith('text-')) ?? '';
        return {
            bg: textCls.replace('text-', 'bg-') + '/10',
            text: textCls,
            fill: textCls.replace('text-', 'bg-'),
        };
    };

    const { bg, text, fill } = resolveColor();

    const trendColors: Record<string, string> = {
        up: 'text-emerald-400',
        down: 'text-rose-400',
        neutral: 'text-[var(--text-muted)]',
    };

    return (
        <Card
            className="group hover:-translate-y-1 transition-all duration-400 flex flex-col justify-between h-full
                    p-3.5 md:p-6 min-h-[110px] md:min-h-[150px]"
        >
            <div className="relative z-10 w-full">
                {/* Header row */}
                <div className="flex items-start justify-between mb-2 md:mb-3">
                    <span className="text-[7.5px] md:text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-muted)] break-words whitespace-normal pr-2 opacity-80">
                        {label}
                    </span>
                    {Icon && (
                        <div
                            className={cn(
                                'p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all duration-400',
                                'group-hover:scale-110 group-hover:rotate-3',
                                'shadow-lg shrink-0',
                                bg,
                                text,
                            )}
                        >
                            <Icon size={12} className="md:w-4 md:h-4" />
                        </div>
                    )}
                </div>

                {/* Value */}
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span
                            className={cn(
                                'font-display font-bold text-(--text-main) tracking-tight',
                                'group-hover:gradient-text transition-all duration-400',
                                (value?.toString().length ?? 0 > 12)
                                    ? 'text-sm md:text-xl'
                                    : 'text-lg sm:text-xl md:text-3xl',
                            )}
                        >
                            {value ?? '---'}
                        </span>
                        {trend && (
                            <span
                                className={cn(
                                    'text-[9px] font-black uppercase tracking-widest',
                                    trendColors[trend],
                                )}
                            >
                                {trend === 'up'
                                    ? '▲'
                                    : trend === 'down'
                                      ? '▼'
                                      : '—'}
                            </span>
                        )}
                    </div>
                    {subValue && (
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-(--text-muted) opacity-70 wrap-break-word whitespace-normal">
                            {subValue}
                        </span>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full mt-auto pt-3 md:pt-4">
                <div className="progress-track">
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '70%' }}
                        viewport={{ once: true }}
                        transition={{
                            duration: 1.4,
                            ease: 'easeOut',
                            delay: 0.15,
                        }}
                        className={cn('progress-fill', fill)}
                        style={{ background: undefined }}
                    />
                </div>
            </div>

            {/* Ghost icon */}
            {Icon && (
                <div
                    className="absolute -right-4 -bottom-4 opacity-[0.025] group-hover:opacity-[0.07]
                                group-hover:scale-125 transition-all duration-700 pointer-events-none rotate-[-15deg]"
                >
                    <Icon size={80} className="md:w-[100px] md:h-[100px]" />
                </div>
            )}
        </Card>
    );
}
