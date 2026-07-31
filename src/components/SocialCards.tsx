import React, { useState, useRef, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { User, RatingChange, Submission } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
    Share2,
    Image as ImageIcon,
    Award,
    Flame,
    Calendar,
    Sparkles,
    Download,
    Check,
    CheckCircle,
    Database,
    Swords,
    Search,
    AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CodeforcesService } from '../services/codeforces';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);

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
    | 'system_dump'
    | 'head_to_head';

function SocialCardsImpl({
    user,
    ratingHistory,
    submissions,
}: SocialCardsProps) {
    const [activeCard, setActiveCard] = useState<CardType>('snapshot');
    const [exporting, setExporting] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Opponent state for Head-to-Head
    const [opponentInput, setOpponentInput] = useState('');
    const [opponentUser, setOpponentUser] = useState<User | null>(null);
    const [opponentSubmissions, setOpponentSubmissions] = useState<
        Submission[]
    >([]);
    const [isFetchingOpponent, setIsFetchingOpponent] = useState(false);
    const [opponentError, setOpponentError] = useState<string | null>(null);

    const handleFetchOpponent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!opponentInput.trim()) return;
        setIsFetchingOpponent(true);
        setOpponentError(null);
        try {
            const [data, subs] = await Promise.all([
                CodeforcesService.getUserInfo(opponentInput.trim()),
                CodeforcesService.getUserStatus(opponentInput.trim()),
            ]);
            setOpponentUser(data);
            setOpponentSubmissions(subs);
        } catch (err: any) {
            setOpponentError(err.message || 'User not found');
        } finally {
            setIsFetchingOpponent(false);
        }
    };

    const maxRating = ratingHistory.length
        ? Math.max(...ratingHistory.map((h) => h.newRating))
        : user.rating || 1200;
    const solvedCount = submissions.filter((s) => s.verdict === 'OK').length;

    // Real continuous streak calculation
    const streakDays = useMemo(() => {
        if (!submissions.length) return 0;
        const sorted = [...submissions]
            .filter((s) => s.verdict === 'OK')
            .sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds);
        if (sorted.length === 0) return 0;

        let streak = 1;
        let lastDate = new Date(sorted[0].creationTimeSeconds * 1000);
        lastDate.setHours(0, 0, 0, 0);

        for (let i = 1; i < sorted.length; i++) {
            const d = new Date(sorted[i].creationTimeSeconds * 1000);
            d.setHours(0, 0, 0, 0);
            const diffTime = Math.abs(lastDate.getTime() - d.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streak++;
                lastDate = d;
            } else if (diffDays > 1) {
                break;
            }
        }
        return streak;
    }, [submissions]);

    const getDetailedStats = (subs: Submission[]) => {
        const okSubmissions = subs.filter((s) => s.verdict === 'OK');

        const langCounts: Record<string, number> = {};
        let favLang = 'N/A';
        let maxLang = 0;

        const tagCounts: Record<string, number> = {};
        let favTag = 'N/A';
        let maxTag = 0;

        let totalDifficulty = 0;
        let difficultyCount = 0;

        okSubmissions.forEach((s) => {
            if (s.programmingLanguage) {
                langCounts[s.programmingLanguage] =
                    (langCounts[s.programmingLanguage] || 0) + 1;
                if (langCounts[s.programmingLanguage] > maxLang) {
                    maxLang = langCounts[s.programmingLanguage];
                    favLang = s.programmingLanguage;
                }
            }

            s.problem.tags?.forEach((tag) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                if (tagCounts[tag] > maxTag) {
                    maxTag = tagCounts[tag];
                    favTag = tag;
                }
            });

            if (s.problem.rating) {
                totalDifficulty += s.problem.rating;
                difficultyCount++;
            }
        });

        if (favLang.includes('C++')) favLang = 'C++';
        else if (favLang.includes('Python')) favLang = 'Python';
        else if (favLang.includes('Java') && !favLang.includes('Script'))
            favLang = 'Java';

        return {
            favLang,
            favTag,
            avgDifficulty:
                difficultyCount > 0
                    ? Math.round(totalDifficulty / difficultyCount)
                    : 0,
            successRate:
                subs.length > 0
                    ? ((okSubmissions.length / subs.length) * 100).toFixed(1)
                    : '0.0',
            totalSolved: okSubmissions.length,
        };
    };

    const detailedStats = useMemo(
        () => getDetailedStats(submissions),
        [submissions],
    );
    const opponentDetailedStats = useMemo(
        () => getDetailedStats(opponentSubmissions),
        [opponentSubmissions],
    );

    const cardTemplates = [
        {
            id: 'snapshot',
            label: 'SYS_OVERVIEW',
            icon: ImageIcon,
            color: '#00eeff',
        },
        {
            id: 'streak',
            label: 'ENGAGEMENT_CORE',
            icon: Flame,
            color: '#f97316',
        },
        {
            id: 'review',
            label: 'ANNUAL_METRICS',
            icon: Calendar,
            color: '#10b981',
        },
        {
            id: 'achievements',
            label: 'ELITE_PROTOCOLS',
            icon: Award,
            color: '#bc13fe',
        },
        {
            id: 'system_dump',
            label: 'SYSTEM_DUMP',
            icon: Database,
            color: '#ef4444',
        },
        {
            id: 'head_to_head',
            label: 'HEAD_TO_HEAD',
            icon: Swords,
            color: '#f43f5e',
        },
    ] as const;

    const handleDownload = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setExporting(true);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setExporting(false);
            return;
        }

        let avatarImg: HTMLImageElement | null = null;
        let oppAvatarImg: HTMLImageElement | null = null;

        if (
            (activeCard === 'snapshot' || activeCard === 'head_to_head') &&
            (user.titlePhoto || user.avatar)
        ) {
            try {
                const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(user.titlePhoto || user.avatar)}&output=png`;
                avatarImg = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = proxyUrl;
                });
            } catch (e) {
                console.error('Failed to load avatar', e);
            }
        }

        if (
            activeCard === 'head_to_head' &&
            opponentUser &&
            (opponentUser.titlePhoto || opponentUser.avatar)
        ) {
            try {
                const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(opponentUser.titlePhoto || opponentUser.avatar)}&output=png`;
                oppAvatarImg = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = proxyUrl;
                });
            } catch (e) {
                console.error('Failed to load opponent avatar', e);
            }
        }

        let userFlagImg: HTMLImageElement | null = null;
        let oppFlagImg: HTMLImageElement | null = null;

        const loadFlag = async (countryStr?: string) => {
            if (!countryStr) return null;
            const code = countries.getAlpha2Code(countryStr, 'en');
            if (!code) return null;
            try {
                return await new Promise<HTMLImageElement>(
                    (resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
                    },
                );
            } catch {
                return null;
            }
        };

        if (activeCard === 'head_to_head' || activeCard === 'snapshot') {
            userFlagImg = await loadFlag(user.country);
        }
        if (activeCard === 'head_to_head' && opponentUser) {
            oppFlagImg = await loadFlag(opponentUser.country);
        }

        canvas.width = 1200;
        canvas.height = 630;

        const themeColor =
            cardTemplates.find((t) => t.id === activeCard)?.color || '#00eeff';

        // Background (Deep space / tech void)
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, 1200, 630);

        // Dot Grid Pattern
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let x = 0; x <= 1200; x += 24) {
            for (let y = 0; y <= 630; y += 24) {
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        // Radar / Radial Glow behind content
        const glow = ctx.createRadialGradient(600, 315, 0, 600, 315, 600);
        glow.addColorStop(0, `${themeColor}20`); // 12% opacity
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 1200, 630);

        // Tech Corners Helper
        const drawCorners = (
            x: number,
            y: number,
            w: number,
            h: number,
            size: number,
            color: string,
        ) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y + size);
            ctx.lineTo(x, y);
            ctx.lineTo(x + size, y);
            ctx.moveTo(x + w - size, y);
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w, y + size);
            ctx.moveTo(x, y + h - size);
            ctx.lineTo(x, y + h);
            ctx.lineTo(x + size, y + h);
            ctx.moveTo(x + w - size, y + h);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x + w, y + h - size);
            ctx.stroke();
        };

        // Draw Outer Frame Corners
        drawCorners(40, 40, 1120, 550, 40, `${themeColor}80`);

        // Decorative Tech Lines & Barcodes
        ctx.fillStyle = `${themeColor}40`;
        for (let i = 0; i < 10; i++) {
            ctx.fillRect(100 + i * 12, 50, 4 + Math.random() * 4, 4);
        }
        ctx.fillStyle = `${themeColor}`;
        ctx.font = '10px "Courier New", monospace';
        ctx.fillText(`CF_NODE: ${user.handle.toUpperCase()}`, 100, 42);
        ctx.fillText(
            `STATUS: ONLINE`,
            1100 - ctx.measureText(`STATUS: ONLINE`).width,
            42,
        );

        // Watermark
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = themeColor;
        ctx.font = 'bold 18px "Inter", sans-serif';
        ctx.fillText('CF VISUALIZER // TERMINAL', 80, 560);
        ctx.shadowBlur = 0;

        const drawFit = (
            text: string,
            x: number,
            y: number,
            maxW: number,
            align: CanvasTextAlign,
            sz: number,
            color: string,
        ) => {
            let s = sz;
            ctx.font = `bold ${s}px "Inter", sans-serif`;
            while (ctx.measureText(text).width > maxW && s > 7) {
                s -= 0.5;
                ctx.font = `bold ${s}px "Inter", sans-serif`;
            }
            ctx.fillStyle = color;
            ctx.textAlign = align;
            ctx.fillText(text, x, y);
        };

        // Card Specific Content
        if (activeCard === 'snapshot') {
            // Main Handle with Glow
            ctx.shadowColor = '#0ef';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 56px "Inter", sans-serif';
            ctx.fillText(user.handle.toUpperCase(), 80, 150);
            ctx.shadowBlur = 0;

            // Subtitle / Rank
            ctx.fillStyle = '#0ef';
            ctx.font = 'bold 20px "Inter", sans-serif';
            ctx.letterSpacing = '4px';
            ctx.fillText(
                `[ RANK: ${(user.rank || 'UNRANKED').toUpperCase()} ]`,
                80,
                190,
            );
            ctx.letterSpacing = '0px';

            // Detailed Stats Table
            const snapRows = [
                { label: 'RATING', val: String(user.rating || 0) },
                { label: 'MAX RTG', val: String(user.maxRating || 'N/A') },
                { label: 'SOLVED', val: String(detailedStats.totalSolved) },
                { label: 'ACCURACY', val: `${detailedStats.successRate}%` },
                { label: 'WEAPON', val: detailedStats.favLang },
                { label: 'DOMAIN', val: detailedStats.favTag.toUpperCase() },
                { label: 'ORG', val: user.organization || 'INDIE' },
                { label: 'LOC', val: '', flag: userFlagImg },
            ];

            const TABLE_X = 80;
            const TABLE_Y = 230;
            const ROW_H = 50;
            const COL_W = 360;
            const COL_GAP = 20;

            snapRows.forEach((row, i) => {
                const colIdx = i % 2;
                const rowIdx = Math.floor(i / 2);

                const cellX = TABLE_X + colIdx * (COL_W + COL_GAP);
                const cellY = TABLE_Y + rowIdx * ROW_H;
                const textY = cellY + ROW_H / 2 + 5;

                // Bg
                ctx.fillStyle = 'rgba(0, 238, 255, 0.05)';
                ctx.fillRect(cellX, cellY, COL_W, ROW_H - 6);

                // Border
                ctx.strokeStyle = 'rgba(0, 238, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.strokeRect(cellX, cellY, COL_W, ROW_H - 6);

                // Label (Left-aligned)
                ctx.fillStyle = 'rgba(165, 243, 252, 0.7)';
                ctx.font = 'bold 14px "Courier New", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(row.label, cellX + 15, textY);

                // Value (Right-aligned)
                const rightEdge = cellX + COL_W - 15;
                if (row.flag) {
                    ctx.drawImage(row.flag, rightEdge - 28, textY - 14, 28, 18);
                }
                if (row.val) {
                    drawFit(
                        String(row.val),
                        rightEdge,
                        textY,
                        COL_W - 100,
                        'right',
                        18,
                        '#22d3ee',
                    );
                }
            });
            ctx.textAlign = 'left';

            // Circular Progress on right
            ctx.save();
            ctx.beginPath();
            ctx.arc(1000, 330, 100, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(0, 238, 255, 0.1)';
            ctx.lineWidth = 15;
            ctx.stroke();

            if (avatarImg) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(1000, 330, 100, 0, 2 * Math.PI);
                ctx.clip();
                ctx.drawImage(avatarImg, 900, 230, 200, 200);
                ctx.fillStyle = 'rgba(0, 238, 255, 0.15)'; // tech tint overlay
                ctx.fillRect(900, 230, 200, 200);
                ctx.restore();
            }

            ctx.beginPath();
            const endAngle =
                (Math.min(user.rating || 0, 4000) / 4000) * 2 * Math.PI;
            ctx.arc(1000, 330, 100, -Math.PI / 2, -Math.PI / 2 + endAngle);
            ctx.shadowColor = '#00eeff';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#00eeff';
            ctx.lineWidth = 15;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('PWR LEVEL', 1000, 480);
            ctx.fillStyle = '#00eeff';
            ctx.font = 'bold 28px "Inter"';
            ctx.fillText(`${user.rating || 0}`, 1000, 520);
            ctx.textAlign = 'left';
        } else if (activeCard === 'streak') {
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 64px "Inter", sans-serif';
            ctx.fillText('ENGAGEMENT MAX', 80, 200);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#f97316';
            ctx.font = 'bold 24px "Inter", sans-serif';
            ctx.letterSpacing = '4px';
            ctx.fillText(`[ SYSTEM OVERRIDE ]`, 80, 250);
            ctx.letterSpacing = '0px';

            // Streak Value
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 140px "Inter", sans-serif';
            ctx.fillText(`${streakDays}`, 80, 420);

            ctx.shadowBlur = 10;
            ctx.fillStyle = '#f97316';
            ctx.font = 'bold 48px "Inter", sans-serif';
            ctx.fillText(
                'DAYS',
                80 + ctx.measureText(`${streakDays}`).width + 20,
                420,
            );
            ctx.shadowBlur = 0;

            ctx.fillStyle = 'rgba(249, 115, 22, 0.1)';
            ctx.fillRect(80, 480, 1040, 80);
            drawCorners(80, 480, 1040, 80, 10, '#f97316');

            ctx.fillStyle = '#f97316';
            ctx.font = 'bold 16px "Inter", sans-serif';
            ctx.fillText('SYS.MSG //', 110, 525);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px "Courier New", monospace';
            ctx.fillText(
                `CONTINUOUS SOLVING STREAK DETECTED. COGNITIVE ENGINE AT PEAK.`,
                220,
                525,
            );
        } else if (activeCard === 'review') {
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 64px "Inter", sans-serif';
            ctx.fillText('ANNUAL METRICS', 80, 200);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 24px "Inter", sans-serif';
            ctx.letterSpacing = '4px';
            ctx.fillText(`[ DATA AGGREGATION COMPLETE ]`, 80, 250);
            ctx.letterSpacing = '0px';

            const drawReviewBox = (
                x: number,
                y: number,
                val: string,
                label: string,
            ) => {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
                ctx.fillRect(x, y, 320, 180);
                drawCorners(x, y, 320, 180, 15, '#10b981');

                ctx.shadowColor = '#10b981';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 64px "Inter", sans-serif';
                ctx.fillText(val, x + 40, y + 90);
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#10b981';
                ctx.font = 'bold 16px "Courier New", monospace';
                ctx.fillText(label, x + 40, y + 140);
            };

            drawReviewBox(80, 320, `${solvedCount}`, '> TOTAL_SOLVED');
            drawReviewBox(
                440,
                320,
                `+${Math.max(0, (user.rating || 800) - 1000)}`,
                '> RATING_DELTA',
            );
            drawReviewBox(
                800,
                320,
                `${ratingHistory.length}`,
                '> ROUNDS_SYNCED',
            );
        } else if (activeCard === 'achievements') {
            ctx.shadowColor = '#bc13fe';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 64px "Inter", sans-serif';
            ctx.fillText('ELITE PROTOCOLS', 80, 200);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#bc13fe';
            ctx.font = 'bold 24px "Inter", sans-serif';
            ctx.letterSpacing = '4px';
            ctx.fillText(`[ MILESTONES UNLOCKED ]`, 80, 250);
            ctx.letterSpacing = '0px';

            const drawBadge = (
                x: number,
                y: number,
                name: string,
                desc: string,
                unlocked: boolean,
            ) => {
                ctx.fillStyle = unlocked
                    ? 'rgba(188, 19, 254, 0.1)'
                    : 'rgba(255, 255, 255, 0.02)';
                ctx.fillRect(x, y, 480, 120);

                if (unlocked) {
                    drawCorners(x, y, 480, 120, 15, '#bc13fe');
                    ctx.shadowColor = '#bc13fe';
                    ctx.shadowBlur = 10;
                } else {
                    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                    ctx.strokeRect(x, y, 480, 120);
                }

                ctx.fillStyle = unlocked ? '#ffffff' : '#64748b';
                ctx.font = 'bold 24px "Inter", sans-serif';
                ctx.fillText(name, x + 30, y + 55);
                ctx.shadowBlur = 0;

                ctx.fillStyle = unlocked ? '#e9d5ff' : '#475569';
                ctx.font = '14px "Courier New", monospace';
                ctx.fillText(desc, x + 30, y + 90);

                ctx.fillStyle = unlocked ? '#bc13fe' : '#334155';
                ctx.font = 'bold 12px "Inter", sans-serif';
                ctx.fillText(
                    unlocked ? '[ VERIFIED ]' : '[ LOCKED ]',
                    x + 370,
                    y + 50,
                );
            };

            drawBadge(
                80,
                320,
                'EXPERT_BURST',
                'Peak performance >= 1600 RP',
                user.rating && user.rating >= 1600 ? true : false,
            );
            drawBadge(
                600,
                320,
                'DP_ARCHITECT',
                'Solved > 10 DP algorithms',
                solvedCount > 10,
            );
            drawBadge(
                80,
                460,
                'CONTEST_SPEC',
                '5+ rated rounds completed',
                ratingHistory.length >= 5,
            );
            drawBadge(
                600,
                460,
                'STREAK_FIRE',
                '7+ consecutive days active',
                streakDays >= 7,
            );
        } else if (activeCard === 'system_dump') {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 64px "Inter", sans-serif';
            ctx.fillText('SYSTEM DUMP', 80, 200);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 24px "Inter", sans-serif';
            ctx.letterSpacing = '4px';
            ctx.fillText(`[ COMPREHENSIVE DATA EXTRACTION ]`, 80, 250);
            ctx.letterSpacing = '0px';

            const drawDumpBox = (
                x: number,
                y: number,
                val: string,
                label: string,
            ) => {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
                ctx.fillRect(x, y, 240, 100);

                // Tech frame
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y + 100);
                ctx.lineTo(x, y + 20);
                ctx.lineTo(x + 20, y);
                ctx.lineTo(x + 240, y);
                ctx.lineTo(x + 240, y + 100);
                ctx.closePath();
                ctx.stroke();

                ctx.fillStyle = '#94a3b8';
                ctx.font = 'bold 12px "Courier New", monospace';
                ctx.fillText(`// ${label}`, x + 15, y + 25);

                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px "Courier New", monospace';
                let displayVal = val;
                // scale down font if value is too long
                if (ctx.measureText(displayVal).width > 210) {
                    ctx.font = 'bold 18px "Courier New", monospace';
                }
                ctx.fillText(displayVal, x + 15, y + 75);
                ctx.shadowBlur = 0;
            };

            const stats = [
                {
                    label: 'MAX RANK',
                    val: (user.maxRank || 'N/A').toUpperCase(),
                },
                { label: 'CONTRIBUTION', val: `+${user.contribution}` },
                { label: 'FAV LANG', val: detailedStats.favLang },
                { label: 'TOP TAG', val: detailedStats.favTag.toUpperCase() },
                { label: 'AVG DIFF', val: `${detailedStats.avgDifficulty}` },
                { label: 'ACCURACY', val: `${detailedStats.successRate}%` },
                { label: 'TOTAL SUBS', val: `${submissions.length}` },
                { label: 'FRIENDS OF', val: `${user.friendOfCount}` },
            ];

            let startX = 80;
            let startY = 320;
            stats.forEach((stat, idx) => {
                const row = Math.floor(idx / 4);
                const col = idx % 4;
                drawDumpBox(
                    startX + col * 260,
                    startY + row * 120,
                    stat.val,
                    stat.label,
                );
            });
        } else if (activeCard === 'head_to_head' && opponentUser) {
            // === CANVAS 1200×630 Layout ===
            // Left col: x=0..220 | Table: x=220..980 | Right col: x=980..1200
            // Title: y=0..50 | Content: y=50..620

            const CANVAS_H = 630;
            const CANVAS_W = 1200;
            // Match HTML layout exactly: 30% left avatar, 40% table, 30% right avatar
            const SIDE_W = CANVAS_W * 0.3; // 360px
            const TABLE_X = SIDE_W;
            const TABLE_W = CANVAS_W * 0.4; // 480px
            const TABLE_CENTER = TABLE_X + TABLE_W / 2;
            const L_CX = SIDE_W / 2; // 180
            const R_CX = CANVAS_W - SIDE_W / 2; // 1020
            const TITLE_H = 50;
            const CONTENT_START = TITLE_H;
            const CONTENT_H = CANVAS_H - TITLE_H - 10; // 570

            // ── Title ──────────────────────────────────
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#f43f5e';
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'center';
            // Simulate tracking wide like HTML
            ctx.fillText(
                '⚔  B A T T L E   A N A L Y S I S  ⚔',
                CANVAS_W / 2,
                34,
            );
            ctx.shadowBlur = 0;

            // ── Avatar helper ──────────────────────────
            const drawAvatar = (
                img: HTMLImageElement | null,
                cx: number,
                cy: number,
                r: number,
                color: string,
            ) => {
                if (img) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
                    // Add tint to match HTML preview bg-color/20 mix-blend-color
                    ctx.fillStyle = `${color}33`; // 20% opacity tint
                    ctx.fill();
                    ctx.restore();
                }
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
                // glow
                ctx.strokeStyle = `${color}30`;
                ctx.lineWidth = 7;
                ctx.beginPath();
                ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
                ctx.stroke();
            };

            // Avatar radius & Y: center in top portion of side columns
            const AVATAR_R = 90;
            const AVATAR_Y = CONTENT_START + AVATAR_R + 30; // y ≈ 170

            // ── Left avatar ────────────────────────────
            drawAvatar(avatarImg, L_CX, AVATAR_Y, AVATAR_R, '#06b6d4');
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#06b6d4';
            ctx.font = 'bold 18px "Inter", sans-serif';
            ctx.textAlign = 'center';
            let lHandle = user.handle;
            while (
                ctx.measureText(lHandle).width > SIDE_W - 10 &&
                lHandle.length > 3
            )
                lHandle = lHandle.slice(0, -1);
            ctx.fillText(lHandle, L_CX, AVATAR_Y + AVATAR_R + 26);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.fillText(
                (user.maxRank || 'N/A').toUpperCase(),
                L_CX,
                AVATAR_Y + AVATAR_R + 44,
            );

            // ── Right avatar ───────────────────────────
            drawAvatar(oppAvatarImg, R_CX, AVATAR_Y, AVATAR_R, '#f97316');
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#f97316';
            ctx.font = 'bold 18px "Inter", sans-serif';
            ctx.textAlign = 'center';
            let rHandle = opponentUser.handle;
            while (
                ctx.measureText(rHandle).width > SIDE_W - 10 &&
                rHandle.length > 3
            )
                rHandle = rHandle.slice(0, -1);
            ctx.fillText(rHandle, R_CX, AVATAR_Y + AVATAR_R + 26);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.fillText(
                (opponentUser.maxRank || 'N/A').toUpperCase(),
                R_CX,
                AVATAR_Y + AVATAR_R + 44,
            );

            // ── Stats table ────────────────────────────
            const statRows = [
                {
                    label: 'RATING',
                    left: String(user.rating || 0),
                    right: String(opponentUser.rating || 0),
                },
                {
                    label: 'MAX RTG',
                    left: String(user.maxRating || 'N/A'),
                    right: String(opponentUser.maxRating || 'N/A'),
                },
                {
                    label: 'SOLVED',
                    left: String(detailedStats.totalSolved),
                    right: String(opponentDetailedStats.totalSolved),
                },
                {
                    label: 'ACCURACY',
                    left: `${detailedStats.successRate}%`,
                    right: `${opponentDetailedStats.successRate}%`,
                },
                {
                    label: 'WEAPON',
                    left: detailedStats.favLang,
                    right: opponentDetailedStats.favLang,
                },
                {
                    label: 'DOMAIN',
                    left: detailedStats.favTag.toUpperCase(),
                    right: opponentDetailedStats.favTag.toUpperCase(),
                },
                {
                    label: 'ORG',
                    left: user.organization || 'INDIE',
                    right: opponentUser.organization || 'INDIE',
                },
                {
                    label: 'LOC',
                    left: user.country || 'EARTH',
                    right: opponentUser.country || 'EARTH',
                    leftFlag: userFlagImg,
                    rightFlag: oppFlagImg,
                },
            ];

            const NUM_ROWS = statRows.length;
            // Pack rows tightly instead of stretching across the whole height, to match HTML `justify-start` behavior
            const ROW_H = 42;
            const TABLE_START_Y = CONTENT_START + 60; // Start slightly below title so it aligns nicely with avatars

            // Match HTML percentages exactly: 38% / 24% / 38%
            const COL_L_W = TABLE_W * 0.38; // left value col width
            const COL_M_W = TABLE_W * 0.24; // center label col width
            const COL_R_W = TABLE_W * 0.38; // right value col width

            statRows.forEach((row, i) => {
                const rowY = TABLE_START_Y + i * ROW_H;
                const textY = rowY + ROW_H / 2 + 6;

                // Alternating bg - matching HTML bg-cyan-500/5 and bg-orange-500/5
                ctx.fillStyle =
                    i % 2 === 0
                        ? 'rgba(6,182,212,0.05)'
                        : 'rgba(249,115,22,0.05)';
                ctx.fillRect(TABLE_X, rowY, TABLE_W, ROW_H);

                // Top separator (matching HTML border-slate-700/40)
                ctx.strokeStyle = 'rgba(51,65,85,0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(TABLE_X, rowY);
                ctx.lineTo(TABLE_X + TABLE_W, rowY);
                ctx.stroke();

                // Left value (right-aligned)
                const leftEdge = TABLE_X + COL_L_W - 14;
                if ((row as any).leftFlag) {
                    ctx.drawImage(
                        (row as any).leftFlag,
                        leftEdge - 20,
                        textY - 12,
                        20,
                        12,
                    );
                    drawFit(
                        row.left,
                        leftEdge - 26,
                        textY,
                        COL_L_W - 40,
                        'right',
                        15,
                        '#06b6d4',
                    );
                } else {
                    drawFit(
                        row.left,
                        leftEdge,
                        textY,
                        COL_L_W - 20,
                        'right',
                        15,
                        '#06b6d4',
                    );
                }

                // Center label
                ctx.fillStyle = '#475569';
                ctx.font = 'bold 10px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(row.label, TABLE_X + COL_L_W + COL_M_W / 2, textY);

                // Right value (left-aligned, with flag if LOC)
                const rightEdge = TABLE_X + COL_L_W + COL_M_W + 12;
                if ((row as any).rightFlag) {
                    ctx.drawImage(
                        (row as any).rightFlag,
                        rightEdge,
                        textY - 12,
                        20,
                        12,
                    );
                    drawFit(
                        row.right,
                        rightEdge + 26,
                        textY,
                        COL_R_W - 40,
                        'left',
                        15,
                        '#f97316',
                    );
                } else {
                    drawFit(
                        row.right,
                        rightEdge,
                        textY,
                        COL_R_W - 20,
                        'left',
                        15,
                        '#f97316',
                    );
                }
            });

            // Bottom border
            const tableBottom = TABLE_START_Y + NUM_ROWS * ROW_H;
            ctx.strokeStyle = 'rgba(51,65,85,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(TABLE_X, tableBottom);
            ctx.lineTo(TABLE_X + TABLE_W, tableBottom);
            ctx.stroke();
        }

        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `cf_visualizer_${user.handle}_${activeCard}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Canvas export failed:', err);
            alert(
                'Sorry, downloading failed. Please check the console for details.',
            );
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-500 self-start border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <Share2 size={12} />
                    Terminal Export Engine
                </div>
                <h2 className="text-xl md:text-3xl font-display font-black text-text-app">
                    Generate Tech-Dashboard PNGs
                </h2>
                <p className="text-xs md:text-sm text-muted-app font-medium max-w-2xl font-mono">
                    Export high-resolution cyberpunk data cards to share your
                    Codeforces metrics. Optimized for 1200x630 resolution.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
                {/* Template Selector */}
                <div className="lg:col-span-4 space-y-3">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-muted-app mb-4 font-mono">
                        &gt; Select Protocol
                    </h3>
                    <div className="space-y-2 md:space-y-3">
                        {cardTemplates.map((template) => {
                            const Icon = template.icon;
                            const isActive = activeCard === template.id;
                            const themeClass =
                                template.id === 'snapshot'
                                    ? 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                    : template.id === 'streak'
                                      ? 'text-orange-500 border-orange-500/30 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                                      : template.id === 'review'
                                        ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                        : template.id === 'system_dump'
                                          ? 'text-red-500 border-red-500/30 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                                          : template.id === 'head_to_head'
                                            ? 'text-rose-500 border-rose-500/30 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                                            : 'text-purple-500 border-purple-500/30 bg-purple-500/10 shadow-[0_0_15px_rgba(188,19,254,0.15)]';

                            return (
                                <button
                                    key={template.id}
                                    onClick={() => setActiveCard(template.id)}
                                    className={cn(
                                        'w-full flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all text-left group overflow-hidden relative',
                                        isActive
                                            ? themeClass
                                            : 'bg-(--bg-card) border-(--glass-border) text-muted-app hover:bg-(--glass-bg) hover:text-text-app',
                                    )}
                                >
                                    <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-size-[10px_10px]" />
                                    <div className="flex items-center gap-3 relative z-10">
                                        <Icon
                                            size={16}
                                            className="shrink-0 md:w-4.5 md:h-4.5"
                                        />
                                        <span className="text-[10px] md:text-xs font-bold font-mono tracking-widest">
                                            {template.label}
                                        </span>
                                    </div>
                                    {isActive && (
                                        <Check
                                            size={14}
                                            className="relative z-10"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <Button
                        onClick={handleDownload}
                        className="w-full h-10 md:h-12 rounded-xl text-[10px] uppercase font-black tracking-widest mt-4 md:mt-6 font-mono border border-(--glass-border) relative overflow-hidden group hover:scale-[1.02] transition-transform text-white bg-slate-900"
                        isLoading={exporting}
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10 flex items-center justify-center">
                            <Download size={14} className="mr-2 inline" />
                            EXECUTE_EXPORT.PNG
                        </span>
                    </Button>
                </div>

                {/* Card Mockup Interactive Display */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                        <h3 className="text-[10px] uppercase font-black tracking-widest text-muted-app font-mono">
                            &gt; Live Canvas Feed
                        </h3>
                        <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                    </div>

                    {/* Interactive mock container matching exact proportions (1.90 ratio) */}
                    <div className="aspect-[1.9] w-full rounded-xl md:rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-800 relative text-left bg-slate-950">
                        {/* Background dot grid */}
                        <div className="absolute inset-0 bg-grid-white/[0.03] bg-size-[12px_12px] md:bg-size-[24px_24px]" />

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeCard}
                                initial={{
                                    opacity: 0,
                                    scale: 0.98,
                                    filter: 'blur(4px)',
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    filter: 'blur(0px)',
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 1.02,
                                    filter: 'blur(4px)',
                                }}
                                transition={{ duration: 0.3 }}
                                className={cn(
                                    'absolute inset-0 p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-between select-none overflow-hidden',
                                )}
                            >
                                {/* Radial Glow */}
                                <div
                                    className={cn(
                                        'absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))]',
                                        activeCard === 'snapshot' &&
                                            'from-cyan-400 via-transparent to-transparent',
                                        activeCard === 'streak' &&
                                            'from-orange-500 via-transparent to-transparent',
                                        activeCard === 'review' &&
                                            'from-emerald-500 via-transparent to-transparent',
                                        activeCard === 'system_dump' &&
                                            'from-red-500 via-transparent to-transparent',
                                        activeCard === 'achievements' &&
                                            'from-purple-500 via-transparent to-transparent',
                                    )}
                                />

                                {/* Tech Corners in HTML */}
                                <div
                                    className={cn(
                                        'absolute top-2 left-2 md:top-4 md:left-4 w-4 h-4 md:w-8 md:h-8 border-t border-l md:border-t-2 md:border-l-2',
                                        activeCard === 'snapshot'
                                            ? 'border-cyan-500/50'
                                            : activeCard === 'streak'
                                              ? 'border-orange-500/50'
                                              : activeCard === 'review'
                                                ? 'border-emerald-500/50'
                                                : activeCard === 'system_dump'
                                                  ? 'border-red-500/50'
                                                  : 'border-purple-500/50',
                                    )}
                                />
                                <div
                                    className={cn(
                                        'absolute top-2 right-2 md:top-4 md:right-4 w-4 h-4 md:w-8 md:h-8 border-t border-r md:border-t-2 md:border-r-2',
                                        activeCard === 'snapshot'
                                            ? 'border-cyan-500/50'
                                            : activeCard === 'streak'
                                              ? 'border-orange-500/50'
                                              : activeCard === 'review'
                                                ? 'border-emerald-500/50'
                                                : activeCard === 'system_dump'
                                                  ? 'border-red-500/50'
                                                  : 'border-purple-500/50',
                                    )}
                                />
                                <div
                                    className={cn(
                                        'absolute bottom-2 left-2 md:bottom-4 md:left-4 w-4 h-4 md:w-8 md:h-8 border-b border-l md:border-b-2 md:border-l-2',
                                        activeCard === 'snapshot'
                                            ? 'border-cyan-500/50'
                                            : activeCard === 'streak'
                                              ? 'border-orange-500/50'
                                              : activeCard === 'review'
                                                ? 'border-emerald-500/50'
                                                : activeCard === 'system_dump'
                                                  ? 'border-red-500/50'
                                                  : 'border-purple-500/50',
                                    )}
                                />
                                <div
                                    className={cn(
                                        'absolute bottom-2 right-2 md:bottom-4 md:right-4 w-4 h-4 md:w-8 md:h-8 border-b border-r md:border-b-2 md:border-r-2',
                                        activeCard === 'snapshot'
                                            ? 'border-cyan-500/50'
                                            : activeCard === 'streak'
                                              ? 'border-orange-500/50'
                                              : activeCard === 'review'
                                                ? 'border-emerald-500/50'
                                                : activeCard === 'system_dump'
                                                  ? 'border-red-500/50'
                                                  : 'border-purple-500/50',
                                    )}
                                />

                                {/* Top brand overlay */}
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-2 md:gap-4">
                                        <div className="flex gap-0.5 md:gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        'w-0.5 h-0.5 md:w-1 md:h-1 rounded-full',
                                                        activeCard ===
                                                            'snapshot'
                                                            ? 'bg-cyan-500/40'
                                                            : activeCard ===
                                                                'streak'
                                                              ? 'bg-orange-500/40'
                                                              : activeCard ===
                                                                  'review'
                                                                ? 'bg-emerald-500/40'
                                                                : activeCard ===
                                                                    'system_dump'
                                                                  ? 'bg-red-500/40'
                                                                  : 'bg-purple-500/40',
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[6px] sm:text-[8px] md:text-[10px] font-mono tracking-widest text-slate-400">
                                            CF_NODE: {user.handle.toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-[6px] sm:text-[8px] md:text-[10px] font-mono tracking-widest text-slate-400">
                                        STATUS: ONLINE
                                    </span>
                                </div>

                                {/* Main Card Contents */}
                                {activeCard === 'snapshot' && (
                                    <div className="flex-1 flex items-center justify-between relative z-10">
                                        <div className="flex flex-col justify-center space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 w-full pr-2">
                                            <div className="space-y-0 md:space-y-1">
                                                <h3 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-black text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.6)] truncate">
                                                    {user.handle.toUpperCase()}
                                                </h3>
                                                <p className="text-[7px] sm:text-[9px] md:text-xs font-mono font-bold text-cyan-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">
                                                    [ RANK:{' '}
                                                    {user.rank || 'Unranked'} ]
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-1 sm:gap-2 pt-1 sm:pt-2 md:pt-4 border-t border-cyan-500/20 w-full max-w-lg">
                                                {[
                                                    {
                                                        label: 'RATING',
                                                        val: user.rating || 0,
                                                    },
                                                    {
                                                        label: 'MAX RTG',
                                                        val: maxRating,
                                                    },
                                                    {
                                                        label: 'SOLVED',
                                                        val: solvedCount,
                                                    },
                                                    {
                                                        label: 'ACCURACY',
                                                        val: `${detailedStats.successRate}%`,
                                                    },
                                                    {
                                                        label: 'WEAPON',
                                                        val: detailedStats.favLang,
                                                    },
                                                    {
                                                        label: 'DOMAIN',
                                                        val: detailedStats.favTag.toUpperCase(),
                                                    },
                                                    {
                                                        label: 'ORG',
                                                        val:
                                                            user.organization ||
                                                            'INDIE',
                                                    },
                                                    {
                                                        label: 'LOC',
                                                        val: '',
                                                        flag: user.country,
                                                    },
                                                ].map((stat, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex justify-between items-center py-1 px-1.5 sm:px-2 border border-cyan-500/20 bg-cyan-950/30 rounded-sm"
                                                    >
                                                        <span className="text-[5px] sm:text-[7px] md:text-[9px] text-cyan-200/70 font-mono tracking-widest shrink-0">
                                                            {stat.label}
                                                        </span>
                                                        <div className="flex items-center gap-1 sm:gap-2 min-w-0 justify-end ml-2">
                                                            {stat.flag &&
                                                                countries.getAlpha2Code(
                                                                    stat.flag,
                                                                    'en',
                                                                ) && (
                                                                    <img
                                                                        src={`https://flagcdn.com/w20/${countries.getAlpha2Code(stat.flag, 'en')?.toLowerCase()}.png`}
                                                                        alt="flag"
                                                                        className="w-2.5 h-1.5 sm:w-3 sm:h-2 md:w-4 md:h-3 rounded-[1px] object-cover shrink-0"
                                                                        crossOrigin="anonymous"
                                                                    />
                                                                )}
                                                            {stat.val && (
                                                                <span className="text-[6px] sm:text-[8px] md:text-xs font-bold font-mono text-cyan-400 leading-none truncate">
                                                                    {stat.val}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Avatar / PWR LEVEL Display */}
                                        <div className="flex flex-col items-center justify-center pr-2 sm:pr-4 md:pr-12 shrink-0">
                                            <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full flex items-center justify-center before:absolute before:-inset-0.5 md:before:-inset-1 before:rounded-full before:bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                                {/* The actual progress ring */}
                                                <div
                                                    className="absolute -inset-0.5 md:-inset-1 rounded-full"
                                                    style={{
                                                        background: `conic-gradient(#00eeff ${(Math.min(user.rating || 0, 4000) / 4000) * 360}deg, transparent 0)`,
                                                    }}
                                                />
                                                {/* Mask inner for ring effect */}
                                                <div className="absolute inset-0 bg-slate-950 rounded-full z-10" />

                                                {/* Avatar Image */}
                                                {(user.titlePhoto ||
                                                    user.avatar) && (
                                                    <img
                                                        src={`https://wsrv.nl/?url=${encodeURIComponent(user.titlePhoto || user.avatar)}&output=png`}
                                                        alt="Avatar"
                                                        crossOrigin="anonymous"
                                                        className="relative z-20 w-full h-full object-cover rounded-full mix-blend-luminosity opacity-80"
                                                    />
                                                )}
                                                <div className="absolute inset-0 rounded-full bg-cyan-500/20 mix-blend-color z-30 pointer-events-none" />
                                            </div>
                                            <div className="text-center mt-2 md:mt-4 relative z-10">
                                                <p className="text-[5px] sm:text-[7px] md:text-[10px] uppercase text-white font-mono font-bold tracking-widest">
                                                    PWR LEVEL
                                                </p>
                                                <p className="text-xs sm:text-sm md:text-xl lg:text-2xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                                                    {user.rating || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeCard === 'streak' && (
                                    <div className="flex-1 flex flex-col justify-center space-y-3 sm:space-y-4 md:space-y-6 relative z-10">
                                        <div className="space-y-0 md:space-y-1">
                                            <h3 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-black text-white drop-shadow-[0_0_10px_rgba(249,115,22,0.6)]">
                                                ENGAGEMENT MAX
                                            </h3>
                                            <p className="text-[7px] sm:text-[9px] md:text-xs font-mono font-bold text-orange-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">
                                                [ SYSTEM OVERRIDE ]
                                            </p>
                                        </div>

                                        <div className="flex items-baseline gap-2 md:gap-4">
                                            <span className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]">
                                                {streakDays}
                                            </span>
                                            <span className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-black text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">
                                                DAYS
                                            </span>
                                        </div>

                                        <div className="p-2 md:p-4 bg-orange-950/20 border-l-2 md:border-l-4 border-orange-500 rounded-r-md md:rounded-r-lg backdrop-blur-md">
                                            <p className="text-[6px] sm:text-[8px] md:text-xs text-orange-400 uppercase font-black tracking-widest mb-0.5 md:mb-1 flex items-center gap-1 md:gap-2">
                                                <Flame className="w-2 h-2 md:w-3 md:h-3" />
                                                SYS.MSG //
                                            </p>
                                            <p className="text-[6px] sm:text-[8px] md:text-xs text-slate-300 font-mono leading-tight">
                                                CONTINUOUS SOLVING STREAK
                                                DETECTED. COGNITIVE ENGINE AT
                                                PEAK.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeCard === 'review' && (
                                    <div className="flex-1 flex flex-col justify-center space-y-3 sm:space-y-4 md:space-y-6 relative z-10">
                                        <div className="space-y-0 md:space-y-1">
                                            <h3 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-black text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]">
                                                ANNUAL METRICS
                                            </h3>
                                            <p className="text-[7px] sm:text-[9px] md:text-xs font-mono font-bold text-emerald-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">
                                                [ DATA AGGREGATION COMPLETE ]
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 md:gap-4 pt-2 md:pt-4">
                                            {[
                                                {
                                                    label: '> TOTAL_SOLVED',
                                                    val: solvedCount,
                                                },
                                                {
                                                    label: '> RATING_DELTA',
                                                    val: `+${Math.max(0, (user.rating || 800) - 1000)}`,
                                                },
                                                {
                                                    label: '> ROUNDS_SYNCED',
                                                    val: ratingHistory.length,
                                                },
                                            ].map((stat, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-2 sm:p-4 md:p-6 bg-emerald-950/10 border border-emerald-500/30 rounded-md md:rounded-lg backdrop-blur-sm relative"
                                                >
                                                    <div className="absolute top-0 left-0 w-1 h-1 md:w-2 md:h-2 border-t border-l border-emerald-500" />
                                                    <div className="absolute bottom-0 right-0 w-1 h-1 md:w-2 md:h-2 border-b border-r border-emerald-500" />
                                                    <p className="text-lg sm:text-2xl md:text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
                                                        {stat.val}
                                                    </p>
                                                    <p className="text-[5px] sm:text-[7px] md:text-[10px] font-mono text-emerald-400 mt-1 md:mt-2">
                                                        {stat.label}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeCard === 'achievements' && (
                                    <div className="flex-1 flex flex-col justify-center space-y-3 sm:space-y-4 md:space-y-6 relative z-10">
                                        <div className="space-y-0 md:space-y-1">
                                            <h3 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-black text-white drop-shadow-[0_0_10px_rgba(188,19,254,0.6)]">
                                                ELITE PROTOCOLS
                                            </h3>
                                            <p className="text-[7px] sm:text-[9px] md:text-xs font-mono font-bold text-purple-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">
                                                [ MILESTONES UNLOCKED ]
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 md:gap-4">
                                            {[
                                                {
                                                    name: 'EXPERT_BURST',
                                                    desc: 'Peak performance >= 1600 RP',
                                                    unl:
                                                        user.rating &&
                                                        user.rating >= 1600
                                                            ? true
                                                            : false,
                                                },
                                                {
                                                    name: 'DP_ARCHITECT',
                                                    desc: 'Solved > 10 DP algorithms',
                                                    unl: solvedCount > 10,
                                                },
                                                {
                                                    name: 'CONTEST_SPEC',
                                                    desc: '5+ rated rounds completed',
                                                    unl:
                                                        ratingHistory.length >=
                                                        5,
                                                },
                                                {
                                                    name: 'STREAK_FIRE',
                                                    desc: '7+ consecutive days active',
                                                    unl: streakDays >= 7,
                                                },
                                            ].map((badge, idx) => (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        'p-2 md:p-4 rounded-md md:rounded-lg flex flex-col justify-center border backdrop-blur-sm relative overflow-hidden',
                                                        badge.unl
                                                            ? 'bg-purple-900/20 border-purple-500/40'
                                                            : 'bg-slate-900/40 border-slate-700/50',
                                                    )}
                                                >
                                                    <div className="flex justify-between items-center mb-0.5 md:mb-1">
                                                        <p
                                                            className={cn(
                                                                'text-[8px] sm:text-xs md:text-sm font-black font-mono',
                                                                badge.unl
                                                                    ? 'text-white drop-shadow-[0_0_6px_rgba(188,19,254,0.8)]'
                                                                    : 'text-slate-500',
                                                            )}
                                                        >
                                                            {badge.name}
                                                        </p>
                                                        <p
                                                            className={cn(
                                                                'text-[6px] sm:text-[8px] md:text-[10px] font-black',
                                                                badge.unl
                                                                    ? 'text-purple-400'
                                                                    : 'text-slate-600',
                                                            )}
                                                        >
                                                            {badge.unl
                                                                ? '[ VERIFIED ]'
                                                                : '[ LOCKED ]'}
                                                        </p>
                                                    </div>
                                                    <p
                                                        className={cn(
                                                            'text-[5px] sm:text-[7px] md:text-[10px] font-mono',
                                                            badge.unl
                                                                ? 'text-purple-300'
                                                                : 'text-slate-600',
                                                        )}
                                                    >
                                                        {badge.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeCard === 'system_dump' && (
                                    <div className="flex-1 flex flex-col justify-center space-y-3 sm:space-y-4 md:space-y-6 relative z-10">
                                        <div className="space-y-0 md:space-y-1">
                                            <h3 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-black text-white drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                                                SYSTEM DUMP
                                            </h3>
                                            <p className="text-[7px] sm:text-[9px] md:text-xs font-mono font-bold text-red-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">
                                                [ COMPREHENSIVE DATA EXTRACTION
                                                ]
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 pt-2 md:pt-4 border-t border-red-500/20">
                                            {[
                                                {
                                                    label: 'MAX RANK',
                                                    val: (
                                                        user.maxRank || 'N/A'
                                                    ).toUpperCase(),
                                                },
                                                {
                                                    label: 'CONTRIBUTION',
                                                    val: `+${user.contribution}`,
                                                },
                                                {
                                                    label: 'FAV LANG',
                                                    val: detailedStats.favLang,
                                                },
                                                {
                                                    label: 'TOP TAG',
                                                    val: detailedStats.favTag.toUpperCase(),
                                                },
                                                {
                                                    label: 'AVG DIFF',
                                                    val: detailedStats.avgDifficulty,
                                                },
                                                {
                                                    label: 'ACCURACY',
                                                    val: `${detailedStats.successRate}%`,
                                                },
                                                {
                                                    label: 'TOTAL SUBS',
                                                    val: submissions.length,
                                                },
                                                {
                                                    label: 'FRIENDS OF',
                                                    val: user.friendOfCount,
                                                },
                                            ].map((stat, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-1 sm:p-2 md:p-3 bg-red-950/20 border-l border-b border-red-500/30 overflow-hidden flex flex-col justify-center"
                                                >
                                                    <p className="text-[5px] sm:text-[7px] md:text-[9px] uppercase text-slate-400 font-mono tracking-widest mb-0.5 sm:mb-1 shrink-0">
                                                        // {stat.label}
                                                    </p>
                                                    <p className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-bold text-white font-mono drop-shadow-[0_0_5px_rgba(239,68,68,0.5)] wrap-break-word leading-tight">
                                                        {stat.val}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeCard === 'head_to_head' && (
                                    <div className="flex-1 flex flex-col justify-center relative z-10 w-full h-full min-h-0">
                                        {!opponentUser ? (
                                            <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto w-full h-full">
                                                <div className="text-center space-y-2">
                                                    <h3 className="text-xl md:text-2xl font-black text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                                                        ENTER CHALLENGER
                                                    </h3>
                                                    <p className="text-[8px] md:text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                                                        Initiate Head-to-Head
                                                        Protocol
                                                    </p>
                                                </div>
                                                <form
                                                    onSubmit={
                                                        handleFetchOpponent
                                                    }
                                                    className="w-full space-y-3 relative z-50 pointer-events-auto"
                                                >
                                                    <div className="relative">
                                                        <Search
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500/50"
                                                            size={14}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Opponent Handle..."
                                                            value={
                                                                opponentInput
                                                            }
                                                            onChange={(e) =>
                                                                setOpponentInput(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full bg-rose-950/20 border border-rose-500/30 rounded-lg py-2 pl-9 pr-3 text-xs text-white font-mono outline-none focus:border-rose-500 transition-colors"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="submit"
                                                        disabled={
                                                            isFetchingOpponent ||
                                                            !opponentInput.trim()
                                                        }
                                                        isLoading={
                                                            isFetchingOpponent
                                                        }
                                                        className="w-full py-2 text-[10px] bg-rose-600 hover:bg-rose-500 text-white font-black tracking-widest rounded-lg transition-colors border-none"
                                                    >
                                                        ENGAGE
                                                    </Button>
                                                    {opponentError && (
                                                        <p className="text-[10px] text-red-500 text-center font-mono flex items-center justify-center gap-1">
                                                            <AlertCircle
                                                                size={10}
                                                            />{' '}
                                                            {opponentError}
                                                        </p>
                                                    )}
                                                </form>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col min-h-0">
                                                {/* Header */}
                                                <div className="text-center pb-1 shrink-0">
                                                    <p className="text-[6px] sm:text-[8px] font-mono text-rose-400 tracking-[0.2em] uppercase">
                                                        ⚔ Battle Analysis ⚔
                                                    </p>
                                                </div>
                                                {/* Stats Table */}
                                                <div className="flex-1 flex items-stretch min-h-0 overflow-hidden">
                                                    {/* Left Player */}
                                                    <div className="flex flex-col items-center shrink-0 w-[30%]">
                                                        <div className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-full border-2 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.4)] overflow-hidden mb-1">
                                                            <img
                                                                src={`https://wsrv.nl/?url=${encodeURIComponent(user.titlePhoto || user.avatar)}&output=png`}
                                                                crossOrigin="anonymous"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-cyan-500/20 mix-blend-color pointer-events-none" />
                                                        </div>
                                                        <p className="text-[7px] sm:text-[9px] md:text-xs font-black text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)] w-full text-center leading-tight px-1">
                                                            {user.handle}
                                                        </p>
                                                        <p className="text-[5px] sm:text-[6px] md:text-[8px] text-cyan-200/70 uppercase font-mono leading-tight">
                                                            {user.maxRank ||
                                                                'N/A'}
                                                        </p>
                                                    </div>

                                                    {/* Stats Columns */}
                                                    <div className="flex-1 flex flex-col justify-start min-w-0 px-1 overflow-hidden">
                                                        {[
                                                            {
                                                                label: 'RATING',
                                                                left:
                                                                    user.rating ||
                                                                    0,
                                                                right:
                                                                    opponentUser.rating ||
                                                                    0,
                                                            },
                                                            {
                                                                label: 'MAX RTG',
                                                                left:
                                                                    user.maxRating ||
                                                                    'N/A',
                                                                right:
                                                                    opponentUser.maxRating ||
                                                                    'N/A',
                                                            },
                                                            {
                                                                label: 'SOLVED',
                                                                left: detailedStats.totalSolved,
                                                                right: opponentDetailedStats.totalSolved,
                                                            },
                                                            {
                                                                label: 'ACCURACY',
                                                                left: `${detailedStats.successRate}%`,
                                                                right: `${opponentDetailedStats.successRate}%`,
                                                            },
                                                            {
                                                                label: 'WEAPON',
                                                                left: detailedStats.favLang,
                                                                right: opponentDetailedStats.favLang,
                                                            },
                                                            {
                                                                label: 'DOMAIN',
                                                                left: detailedStats.favTag,
                                                                right: opponentDetailedStats.favTag,
                                                            },
                                                            {
                                                                label: 'ORG',
                                                                left:
                                                                    user.organization ||
                                                                    'INDIE',
                                                                right:
                                                                    opponentUser.organization ||
                                                                    'INDIE',
                                                            },
                                                            {
                                                                label: 'LOC',
                                                                left:
                                                                    user.country ||
                                                                    'EARTH',
                                                                right:
                                                                    opponentUser.country ||
                                                                    'EARTH',
                                                                leftFlag:
                                                                    user.country,
                                                                rightFlag:
                                                                    opponentUser.country,
                                                            },
                                                        ].map((row, i) => (
                                                            <div
                                                                key={i}
                                                                className={cn(
                                                                    'flex items-center border-b border-slate-700/40 py-0.5 sm:py-0.75 min-h-0',
                                                                    i % 2 === 0
                                                                        ? 'bg-cyan-500/5'
                                                                        : 'bg-orange-500/5',
                                                                )}
                                                            >
                                                                <div className="w-[38%] flex items-center justify-end pr-1">
                                                                    <span className="text-cyan-400 font-bold text-[5px] sm:text-[7px] md:text-[9px] font-mono leading-tight truncate">
                                                                        {String(
                                                                            row.left,
                                                                        )}
                                                                    </span>
                                                                    {(
                                                                        row as any
                                                                    )
                                                                        .leftFlag &&
                                                                        countries.getAlpha2Code(
                                                                            (
                                                                                row as any
                                                                            )
                                                                                .leftFlag,
                                                                            'en',
                                                                        ) && (
                                                                            <img
                                                                                src={`https://flagcdn.com/w20/${countries.getAlpha2Code((row as any).leftFlag, 'en')?.toLowerCase()}.png`}
                                                                                alt="flag"
                                                                                className="w-2 h-1.5 sm:w-3 sm:h-2 rounded-sm object-cover ml-1 shrink-0"
                                                                                crossOrigin="anonymous"
                                                                            />
                                                                        )}
                                                                </div>
                                                                <span className="text-slate-500 text-[4px] sm:text-[6px] md:text-[8px] font-mono text-center w-[24%] shrink-0 tracking-widest leading-tight">
                                                                    {row.label}
                                                                </span>
                                                                <div className="w-[38%] flex items-center justify-start pl-1">
                                                                    {(
                                                                        row as any
                                                                    )
                                                                        .rightFlag &&
                                                                        countries.getAlpha2Code(
                                                                            (
                                                                                row as any
                                                                            )
                                                                                .rightFlag,
                                                                            'en',
                                                                        ) && (
                                                                            <img
                                                                                src={`https://flagcdn.com/w20/${countries.getAlpha2Code((row as any).rightFlag, 'en')?.toLowerCase()}.png`}
                                                                                alt="flag"
                                                                                className="w-2 h-1.5 sm:w-3 sm:h-2 rounded-sm object-cover mr-1 shrink-0"
                                                                                crossOrigin="anonymous"
                                                                            />
                                                                        )}
                                                                    <span className="text-orange-400 font-bold text-[5px] sm:text-[7px] md:text-[9px] font-mono leading-tight truncate">
                                                                        {String(
                                                                            row.right,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Right Player */}
                                                    <div className="flex flex-col items-center shrink-0 w-[30%]">
                                                        <div className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-full border-2 border-orange-500/60 shadow-[0_0_10px_rgba(249,115,22,0.4)] overflow-hidden mb-1">
                                                            <img
                                                                src={`https://wsrv.nl/?url=${encodeURIComponent(opponentUser.titlePhoto || opponentUser.avatar)}&output=png`}
                                                                crossOrigin="anonymous"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-orange-500/20 mix-blend-color pointer-events-none" />
                                                        </div>
                                                        <p className="text-[7px] sm:text-[9px] md:text-xs font-black text-orange-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)] w-full text-center leading-tight px-1">
                                                            {
                                                                opponentUser.handle
                                                            }
                                                        </p>
                                                        <p className="text-[5px] sm:text-[6px] md:text-[8px] text-orange-200/70 uppercase font-mono leading-tight">
                                                            {opponentUser.maxRank ||
                                                                'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Bottom footer */}
                                <div className="flex justify-between items-center text-[6px] sm:text-[8px] md:text-[10px] font-bold tracking-widest relative z-10 pt-2 md:pt-4 border-t border-slate-800">
                                    <span
                                        className={cn(
                                            activeCard === 'snapshot'
                                                ? 'text-cyan-500 drop-shadow-[0_0_3px_rgba(6,182,212,0.8)]'
                                                : activeCard === 'streak'
                                                  ? 'text-orange-500 drop-shadow-[0_0_3px_rgba(249,115,22,0.8)]'
                                                  : activeCard === 'review'
                                                    ? 'text-emerald-500 drop-shadow-[0_0_3px_rgba(16,185,129,0.8)]'
                                                    : activeCard ===
                                                        'system_dump'
                                                      ? 'text-red-500 drop-shadow-[0_0_3px_rgba(239,68,68,0.8)]'
                                                      : activeCard ===
                                                          'head_to_head'
                                                        ? 'text-rose-500 drop-shadow-[0_0_3px_rgba(244,63,94,0.8)]'
                                                        : 'text-purple-500 drop-shadow-[0_0_3px_rgba(188,19,254,0.8)]',
                                        )}
                                    >
                                        CF VISUALIZER // TERMINAL
                                    </span>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <canvas ref={canvasRef} className="hidden" />
                </div>
            </div>
        </div>
    );
}

export const SocialCards = React.memo(SocialCardsImpl);
