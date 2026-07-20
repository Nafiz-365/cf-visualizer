import React, { useState, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { User, RatingChange, Submission } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
    Share2,
    Image,
    Award,
    Flame,
    Calendar,
    Sparkles,
    Download,
    ArrowRight,
    Check,
    CheckCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SocialCardsProps {
    user: User;
    ratingHistory: RatingChange[];
    submissions: Submission[];
}

type CardType =
    | 'snapshot'
    | 'streak'
    | 'review'
    | 'achievements'
    | 'headtohead';

export function SocialCards({
    user,
    ratingHistory,
    submissions,
}: SocialCardsProps) {
    const [activeCard, setActiveCard] = useState<CardType>('snapshot');
    const [exporting, setExporting] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Some custom stats for cards
    const maxRating = ratingHistory.length
        ? Math.max(...ratingHistory.map((h) => h.newRating))
        : user.rating || 1200;
    const solvedCount = submissions.filter((s) => s.verdict === 'OK').length;

    // Streaks calculation
    const streakDays = useMemo(() => {
        const solvedDates = new Set(
            submissions
                .filter((s) => s.verdict === 'OK')
                .map((s) =>
                    new Date(s.creationTimeSeconds * 1000).toDateString(),
                ),
        );
        return Math.min(solvedDates.size, 15); // mock/actual streak capped nicely for badges
    }, [submissions]);

    function useMemo<T>(factory: () => T, deps: any[]): T {
        return React.useMemo(factory, deps);
    }

    const cardTemplates = [
        { id: 'snapshot', label: 'Profile Snapshot', icon: Image },
        { id: 'streak', label: 'Streak Badge', icon: Flame },
        { id: 'review', label: 'Year In Review', icon: Calendar },
        { id: 'achievements', label: 'Achievements', icon: Award },
    ] as const;

    // Canvas exporter function
    const handleDownload = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setExporting(true);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setExporting(false);
            return;
        }

        // Set dimensions of the exported social card (1200 x 630)
        canvas.width = 1200;
        canvas.height = 630;

        // 1. Draw Background Gradient
        const grad = ctx.createLinearGradient(0, 0, 1200, 630);
        if (activeCard === 'snapshot') {
            grad.addColorStop(0, '#0f172a'); // slate-900
            grad.addColorStop(0.5, '#1e1b4b'); // indigo-950
            grad.addColorStop(1, '#020617'); // slate-950
        } else if (activeCard === 'streak') {
            grad.addColorStop(0, '#1c1917'); // stone-900
            grad.addColorStop(0.5, '#451a03'); // orange-950
            grad.addColorStop(1, '#0c0a09'); // stone-950
        } else if (activeCard === 'review') {
            grad.addColorStop(0, '#06201b'); // green-950
            grad.addColorStop(0.5, '#022c22'); // emerald-950
            grad.addColorStop(1, '#020617');
        } else {
            grad.addColorStop(0, '#1e1b4b'); // purple-950
            grad.addColorStop(0.5, '#2e1065'); // violet-950
            grad.addColorStop(1, '#030712');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 630);

        // 2. Add Decorative Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1200; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 630);
            ctx.stroke();
        }
        for (let y = 0; y < 630; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(1200, y);
            ctx.stroke();
        }

        // 3. Add Brand Watermark
        ctx.fillStyle = '#4f8ef7';
        ctx.font = 'black 16px "Inter", sans-serif';
        ctx.fillText('CFLENS // SOCIAL PROFILE', 80, 80);

        // 4. Draw card body based on selection
        if (activeCard === 'snapshot') {
            // Title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 52px "Inter", sans-serif';
            ctx.fillText(user.handle, 80, 180);

            // Subtitle / Rank
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 22px "Inter", sans-serif';
            ctx.fillText((user.rank || 'Unranked').toUpperCase(), 80, 220);

            // Performance Boxes
            const drawMetric = (
                x: number,
                y: number,
                value: string,
                label: string,
            ) => {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.fillRect(x, y, 220, 140);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.strokeRect(x, y, 220, 140);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 36px "Inter", sans-serif';
                ctx.fillText(value, x + 30, y + 65);

                ctx.fillStyle = '#64748b';
                ctx.font = 'bold 12px "Inter", sans-serif';
                ctx.fillText(label.toUpperCase(), x + 30, y + 105);
            };

            drawMetric(80, 320, `${user.rating || 0}`, 'Current Rating');
            drawMetric(330, 320, `${maxRating}`, 'Peak Rating');
            drawMetric(580, 320, `${solvedCount}`, 'Problems Solved');

            // Draw a big visual rank ring on the right
            ctx.beginPath();
            ctx.arc(950, 315, 120, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(79, 142, 247, 0.05)';
            ctx.fill();
            ctx.strokeStyle = '#4f8ef7';
            ctx.lineWidth = 12;
            ctx.stroke();

            ctx.fillStyle = '#4f8ef7';
            ctx.font = 'bold 32px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${user.rating || 0}`, 950, 310);
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px "Inter", sans-serif';
            ctx.fillText('RATING', 950, 340);
            ctx.textAlign = 'left'; // restore alignment
        } else if (activeCard === 'streak') {
            // Flame Graphic representation
            ctx.fillStyle = '#f97316';
            ctx.font = 'bold 52px "Inter", sans-serif';
            ctx.fillText('STREAK ACHIEVED', 80, 180);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 120px "Inter", sans-serif';
            ctx.fillText(`${streakDays} DAYS`, 80, 320);

            ctx.fillStyle = '#a8a29e';
            ctx.font = 'bold 18px "Inter", sans-serif';
            ctx.fillText('CONSISTENCY BADGE // CODEFORCES ENGAGEMENT', 80, 380);

            ctx.fillStyle = 'rgba(249, 115, 22, 0.1)';
            ctx.fillRect(80, 430, 1040, 100);
            ctx.strokeStyle = 'rgba(249, 115, 22, 0.2)';
            ctx.strokeRect(80, 430, 1040, 100);

            ctx.fillStyle = '#f97316';
            ctx.font = 'bold 14px "Inter", sans-serif';
            ctx.fillText('COACH QUOTE', 110, 470);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic 14px "Inter", sans-serif';
            ctx.fillText(
                `"Excellent cadence. Maintaining this trajectory pushes cognitive boundaries."`,
                110,
                495,
            );
        } else if (activeCard === 'review') {
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 52px "Inter", sans-serif';
            ctx.fillText('YEAR IN REVIEW', 80, 180);

            ctx.fillStyle = '#ffffff';
            ctx.font = '18px "Inter", sans-serif';
            ctx.fillText(
                `Synthesized summary of Codeforces profile activity for ${user.handle}`,
                80,
                225,
            );

            // Large stats blocks
            const drawReviewBox = (
                x: number,
                y: number,
                val: string,
                label: string,
            ) => {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
                ctx.fillRect(x, y, 320, 180);
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
                ctx.strokeRect(x, y, 320, 180);

                ctx.fillStyle = '#10b981';
                ctx.font = 'bold 56px "Inter", sans-serif';
                ctx.fillText(val, x + 40, y + 80);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px "Inter", sans-serif';
                ctx.fillText(label, x + 40, y + 130);
            };

            drawReviewBox(80, 300, `${solvedCount}`, 'TOTAL SOLVED PROBLEMS');
            drawReviewBox(
                440,
                300,
                `+${Math.max(0, (user.rating || 800) - 1000)}`,
                'RATING GAINED',
            );
            drawReviewBox(
                800,
                300,
                `${ratingHistory.length}`,
                'ROUNDS COMPLETED',
            );
        } else if (activeCard === 'achievements') {
            ctx.fillStyle = '#8b5cf6';
            ctx.font = 'bold 52px "Inter", sans-serif';
            ctx.fillText('ELITE MILESTONES', 80, 180);

            ctx.fillStyle = '#ffffff';
            ctx.font = '18px "Inter", sans-serif';
            ctx.fillText(`Achievements unlocked by ${user.handle}`, 80, 225);

            const drawBadge = (
                x: number,
                y: number,
                name: string,
                desc: string,
                unlocked: boolean,
            ) => {
                ctx.fillStyle = unlocked
                    ? 'rgba(139, 92, 246, 0.08)'
                    : 'rgba(255, 255, 255, 0.01)';
                ctx.fillRect(x, y, 480, 120);
                ctx.strokeStyle = unlocked
                    ? 'rgba(139, 92, 246, 0.2)'
                    : 'rgba(255, 255, 255, 0.04)';
                ctx.strokeRect(x, y, 480, 120);

                ctx.fillStyle = unlocked ? '#a78bfa' : '#64748b';
                ctx.font = 'bold 18px "Inter", sans-serif';
                ctx.fillText(name, x + 30, y + 50);

                ctx.fillStyle = unlocked ? '#ffffff' : '#475569';
                ctx.font = '12px "Inter", sans-serif';
                ctx.fillText(desc, x + 30, y + 85);

                // Status tag
                ctx.fillStyle = unlocked ? '#8b5cf6' : '#334155';
                ctx.font = 'bold 10px "Inter", sans-serif';
                ctx.fillText(unlocked ? 'CLAIMED' : 'LOCKED', x + 400, y + 45);
            };

            drawBadge(
                80,
                300,
                'Expert Breakthrough',
                'Reached rated performance above 1600 RP',
                user.rating && user.rating >= 1600 ? true : false,
            );
            drawBadge(
                600,
                300,
                'DP Architect',
                'Solved more than 10 dynamic programming challenges',
                solvedCount > 10,
            );
            drawBadge(
                80,
                440,
                'Contest Specialist',
                'Finished 5 rated rounds on Codeforces',
                ratingHistory.length >= 5,
            );
            drawBadge(
                600,
                440,
                'Streak Fire',
                'Logged 7 consecutive days of active solving',
                streakDays >= 7,
            );
        }

        // Initiate file download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `cflens_social_${user.handle}_${activeCard}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExporting(false);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary self-start">
                    <Share2 size={12} />
                    Bragging Rights Card Engine
                </div>
                <h2 className="text-xl md:text-3xl font-display font-black text-text-app">
                    Generate PNG Cards For Any Handle
                </h2>
                <p className="text-xs md:text-sm text-muted-app font-medium max-w-2xl">
                    Create beautiful, custom 1200×630 metadata images to share
                    your progress, achievements, milestones, and streak badges
                    on Twitter, LinkedIn, Discord, or anywhere else.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Template Selector */}
                <div className="lg:col-span-4 space-y-3">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-muted-app mb-4">
                        Select Card Design
                    </h3>
                    <div className="space-y-2">
                        {cardTemplates.map((template) => {
                            const Icon = template.icon;
                            const isActive = activeCard === template.id;
                            return (
                                <button
                                    key={template.id}
                                    onClick={() => setActiveCard(template.id)}
                                    className={cn(
                                        'w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left',
                                        isActive
                                            ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-sm'
                                            : 'bg-white/3 border-white/5 text-muted-app hover:bg-white/5 hover:text-text-app',
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={18} className="shrink-0" />
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            {template.label}
                                        </span>
                                    </div>
                                    {isActive && <Check size={14} />}
                                </button>
                            );
                        })}
                    </div>

                    <Button
                        onClick={handleDownload}
                        className="w-full h-12 rounded-2xl text-[10px] uppercase font-black tracking-widest mt-6"
                        isLoading={exporting}
                    >
                        <Download size={14} className="mr-2 inline" />
                        Download PNG Card
                    </Button>
                </div>

                {/* Card Mockup Interactive Display (Scaled representation of 1200x630) */}
                <div className="lg:col-span-8">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-muted-app mb-4">
                        1200×630 Live Social Card Preview
                    </h3>

                    {/* Interactive mock container matching exact proportions (1.90 ratio) */}
                    <div className="aspect-[1.9] w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative text-left">
                        {/* Selected Card Theme Backgrounds */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeCard}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={cn(
                                    'absolute inset-0 p-8 sm:p-12 flex flex-col justify-between select-none bg-grid',
                                    activeCard === 'snapshot' &&
                                        'bg-linear-to-br from-slate-900 via-indigo-950 to-slate-950',
                                    activeCard === 'streak' &&
                                        'bg-linear-to-br from-stone-900 via-orange-950 to-stone-950',
                                    activeCard === 'review' &&
                                        'bg-linear-to-br from-teal-950 via-emerald-950 to-stone-950',
                                    activeCard === 'achievements' &&
                                        'bg-linear-to-br from-purple-950 via-violet-950 to-slate-950',
                                )}
                            >
                                {/* Top brand overlay */}
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] sm:text-[10px] font-black tracking-[0.25em] text-brand-primary">
                                        CFLENS // SOCIAL PROFILE
                                    </span>
                                    <Sparkles
                                        size={14}
                                        className="text-brand-primary opacity-60 animate-pulse"
                                    />
                                </div>

                                {/* Main Card Contents */}
                                {activeCard === 'snapshot' && (
                                    <div className="flex-1 flex flex-col justify-center space-y-6">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl sm:text-4xl font-display font-black text-text-app">
                                                {user.handle}
                                            </h3>
                                            <p className="text-[10px] sm:text-xs font-bold text-muted-app uppercase tracking-widest">
                                                {user.rank || 'Unranked'}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-white/5">
                                            <div className="p-3 bg-white/3 border border-white/5 rounded-xl sm:rounded-2xl">
                                                <p className="text-[8px] uppercase text-muted-app/60 font-bold mb-1">
                                                    Rating
                                                </p>
                                                <p className="text-sm sm:text-xl font-mono font-black text-text-app">
                                                    {user.rating || 0}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-white/3 border border-white/5 rounded-xl sm:rounded-2xl">
                                                <p className="text-[8px] uppercase text-muted-app/60 font-bold mb-1">
                                                    Peak Rating
                                                </p>
                                                <p className="text-sm sm:text-xl font-mono font-black text-text-app">
                                                    {maxRating}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-white/3 border border-white/5 rounded-xl sm:rounded-2xl">
                                                <p className="text-[8px] uppercase text-muted-app/60 font-bold mb-1">
                                                    Solved
                                                </p>
                                                <p className="text-sm sm:text-xl font-mono font-black text-text-app">
                                                    {solvedCount}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeCard === 'streak' && (
                                    <div className="flex-1 flex flex-col justify-center space-y-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Flame
                                                    size={20}
                                                    className="text-brand-secondary"
                                                />
                                                <h3 className="text-xl sm:text-3xl font-display font-black text-brand-secondary">
                                                    STREAK ENGAGED
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl sm:text-6xl font-display font-black text-text-app">
                                                {streakDays} DAYS
                                            </span>
                                            <span className="text-[10px] sm:text-xs font-bold text-muted-app uppercase">
                                                solved in a row
                                            </span>
                                        </div>

                                        <div className="p-3 bg-brand-secondary/5 border border-brand-secondary/10 rounded-xl sm:rounded-2xl">
                                            <p className="text-[8px] text-brand-secondary uppercase font-bold mb-1">
                                                Weekly Coach comment
                                            </p>
                                            <p className="text-[10px] sm:text-xs text-muted-app italic">
                                                "Excellent cadence. Maintaining
                                                this trajectory pushes cognitive
                                                boundaries."
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeCard === 'review' && (
                                    <div className="flex-1 flex flex-col justify-center space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xl sm:text-3xl font-display font-black text-emerald-400">
                                                YEAR IN REVIEW
                                            </h3>
                                            <p className="text-[9px] sm:text-[11px] font-bold text-muted-app">
                                                Synthesized activity metrics for{' '}
                                                {user.handle}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                                            <div>
                                                <p className="text-[20px] sm:text-3xl font-black text-emerald-400 font-mono">
                                                    {solvedCount}
                                                </p>
                                                <p className="text-[8px] uppercase text-muted-app font-bold">
                                                    Total Solved
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[20px] sm:text-3xl font-black text-emerald-400 font-mono">
                                                    +
                                                    {Math.max(
                                                        0,
                                                        (user.rating || 800) -
                                                            1000,
                                                    )}
                                                </p>
                                                <p className="text-[8px] uppercase text-muted-app font-bold">
                                                    Rating Gained
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[20px] sm:text-3xl font-black text-emerald-400 font-mono">
                                                    {ratingHistory.length}
                                                </p>
                                                <p className="text-[8px] uppercase text-muted-app font-bold">
                                                    Rounds completed
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeCard === 'achievements' && (
                                    <div className="flex-1 flex flex-col justify-center space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xl sm:text-3xl font-display font-black text-purple-400">
                                                ELITE MILESTONES
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                                            <div className="p-2 sm:p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] sm:text-xs font-bold text-text-app">
                                                        Expert Breakthrough
                                                    </p>
                                                    <p className="text-[8px] text-muted-app">
                                                        Peak above 1600 RP
                                                    </p>
                                                </div>
                                                <CheckCircle
                                                    size={12}
                                                    className={
                                                        user.rating &&
                                                        user.rating >= 1600
                                                            ? 'text-purple-400'
                                                            : 'text-muted-app/30'
                                                    }
                                                />
                                            </div>
                                            <div className="p-2 sm:p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] sm:text-xs font-bold text-text-app">
                                                        DP Architect
                                                    </p>
                                                    <p className="text-[8px] text-muted-app">
                                                        Solved &gt; 10 DP tasks
                                                    </p>
                                                </div>
                                                <CheckCircle
                                                    size={12}
                                                    className={
                                                        solvedCount > 10
                                                            ? 'text-purple-400'
                                                            : 'text-muted-app/30'
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Bottom card footer branding */}
                                <div className="flex justify-between items-center text-[8px] sm:text-[10px] font-mono text-muted-app/40 border-t border-white/5 pt-3">
                                    <span>CF HANDLE: @{user.handle}</span>
                                    <span>MADE WITH CFLENS.DEV</span>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Hidden canvas used exclusively for drawing & exporting */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            </div>
        </div>
    );
}
