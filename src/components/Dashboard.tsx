import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    Trophy,
    TrendingUp,
    Award,
    Users,
    Calendar,
    MapPin,
    CheckCircle2,
    XCircle,
    Code2,
    ChevronLeft,
    ExternalLink,
    Share2,
    Heart,
    RefreshCcw,
    Search,
    Filter,
    ArrowUp,
    ArrowDown,
    ChevronDown,
    Zap,
    BarChart3,
    Binary,
    Bookmark,
    Download,
    Target,
    LayoutList,
    Shield,
    Menu,
    X,
} from 'lucide-react';
import { format } from 'date-fns';
import { CodeforcesService } from '../services/codeforces';
import { Card, StatCard } from './ui/Card';
import { Button } from './ui/Button';
import { RatingChart } from './charts/RatingChart';
import { TagMastery } from './charts/TagMastery';
import { ActivityHeatmap } from './charts/ActivityHeatmap';
import { ContestHeatmap } from './charts/ContestHeatmap';
import { SolvedByRating } from './charts/SolvedByRating';
import { SubmissionsStats } from './charts/SubmissionsStats';
import { ProblemLevelStats } from './charts/ProblemLevelStats';
import { Recommendations } from './Recommendations';
import { UpcomingContests } from './UpcomingContests';
import { UnsolvedProblems } from './UnsolvedProblems';
import { ContestHistory } from './ContestHistory';
import { AIRoadmap } from './AIRoadmap';
import { AIChatCoach } from './AIChatCoach';
import { AIWeaknessAnalyzer } from './AIWeaknessAnalyzer';
import { AIContestDebrief } from './AIContestDebrief';
import { GeminiService, AIInsight } from '../services/geminiService';
import { cn } from '../lib/utils';
import { VerdictPieChart } from './charts/VerdictPieChart';
import { LanguageStats } from './charts/LanguageStats';
import { ErrorState } from './ErrorState';
import { Timeline } from './Timeline';
import { RadarStrength } from './RadarStrength';
import { ProblemDistribution } from './ProblemDistribution';
import { Milestone, Ghost, Globe, History as HistoryIcon } from 'lucide-react';

const getRankColor = (rank: string) => {
    const r = rank?.toLowerCase() || '';
    if (r.includes('legendary') || r.includes('international grandmaster'))
        return 'text-red-500';
    if (r.includes('grandmaster')) return 'text-red-400';
    if (r.includes('master')) return 'text-orange-400';
    if (r.includes('candidate master')) return 'text-purple-400';
    if (r.includes('expert')) return 'text-blue-400';
    if (r.includes('specialist')) return 'text-cyan-400';
    if (r.includes('pupil')) return 'text-green-400';
    return 'text-gray-400';
};

const getRankBg = (rank: string) => {
    const r = rank?.toLowerCase() || '';
    if (r.includes('legendary') || r.includes('international grandmaster'))
        return 'bg-red-500/10 border-red-500/20';
    if (r.includes('grandmaster')) return 'bg-red-400/10 border-red-400/20';
    if (r.includes('master')) return 'bg-orange-400/10 border-orange-400/20';
    if (r.includes('candidate master'))
        return 'bg-purple-400/10 border-purple-400/20';
    if (r.includes('expert')) return 'bg-blue-400/10 border-blue-400/20';
    if (r.includes('specialist')) return 'bg-cyan-400/10 border-cyan-400/20';
    if (r.includes('pupil')) return 'bg-green-400/10 border-green-400/20';
    return 'bg-gray-400/10 border-gray-400/20';
};
import { User, RatingChange, Submission, Problem, Contest } from '../types';

export function Dashboard() {
    const { handle } = useParams<{ handle: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [ratingHistory, setRatingHistory] = useState<RatingChange[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [blogs, setBlogs] = useState<any[]>([]);
    const [problemset, setProblemset] = useState<Problem[]>([]);
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSubmission, setSelectedSubmission] =
        useState<Submission | null>(null);
    const [copied, setCopied] = useState(false);
    const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
    const [loadingInsights, setLoadingInsights] = useState(false);

    // Tablet/Desktop specific state
    const [sortKey, setSortKey] = useState<string>('creationTimeSeconds');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [verdictFilter, setVerdictFilter] = useState('ALL');
    const [languageFilter, setLanguageFilter] = useState('ALL');

    useEffect(() => {
        if (handle) {
            loadData(handle);
            saveToRecent(handle);
        }
    }, [handle]);

    const toggleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const exportSubmissionsToCSV = () => {
        const dataToExport = processedSubmissions.length
            ? processedSubmissions
            : submissions;
        if (!dataToExport.length) return;

        const headers = [
            'Problem Name',
            'Verdict',
            'Language',
            'Time Consumed (ms)',
            'Memory Consumed (MB)',
        ];
        const rows = dataToExport.map((sub) => [
            `"${sub.problem.name.replace(/"/g, '""')}"`, // Handle quotes in names
            sub.verdict,
            sub.programmingLanguage,
            sub.timeConsumedMillis.toString(),
            (sub.memoryConsumedBytes / 1024 / 1024).toFixed(2),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute(
            'download',
            `cf_submissions_${handle}_${format(new Date(), 'yyyy-MM-dd')}.csv`,
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const saveToRecent = (h: string) => {
        const recent = JSON.parse(
            localStorage.getItem('recent_handles') || '[]',
        );
        const updated = [
            h,
            ...recent.filter((item: string) => item !== h),
        ].slice(0, 5);
        localStorage.setItem('recent_handles', JSON.stringify(updated));
    };

    const loadData = async (h: string) => {
        setLoading(true);
        setError(null);
        try {
            // Define a safe fetch helper to prevent non-critical failures from breaking the app
            const safeFetch = async <T,>(
                promise: Promise<T>,
                defaultValue: T,
            ): Promise<T> => {
                try {
                    return await promise;
                } catch (e) {
                    console.warn('Non-critical fetch failed:', e);
                    return defaultValue;
                }
            };

            const [u, r, s, p, c, b] = await Promise.all([
                CodeforcesService.getUserInfo(h),
                CodeforcesService.getUserRating(h),
                CodeforcesService.getUserStatus(h),
                safeFetch(CodeforcesService.getProblemSet(), []),
                safeFetch(CodeforcesService.getContests(), []),
                safeFetch(CodeforcesService.getUserBlogEntries(h), []),
            ]);
            setUser(u);
            setRatingHistory(r);
            setSubmissions(s);
            setProblemset(p);
            setContests(c);
            setBlogs(b);

            // Trigger AI Analysis
            const stats = calculateAnalytics(s);
            generateAIInsights(u, r, stats);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    const refreshSubmissions = async () => {
        if (!handle) return;
        setRefreshing(true);
        try {
            const s = await CodeforcesService.getUserStatus(handle);
            setSubmissions(s);
        } catch (err: any) {
            console.error(err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const generateAIInsights = async (
        user: any,
        history: any[],
        stats: any,
    ) => {
        if (!user || stats.totalSolved === 0) return;
        setLoadingInsights(true);
        try {
            const insights = await GeminiService.analyzeProfile(
                user,
                history,
                stats,
            );
            setAiInsights(insights);
        } catch (err) {
            console.error('AI Insight Error:', err);
        } finally {
            setLoadingInsights(false);
        }
    };

    const calculateAnalytics = (subs: Submission[]) => {
        const solved = subs.filter((s) => s.verdict === 'OK');
        const uniqueSolved = new Set(
            solved.map((s) => `${s.problem.contestId}-${s.problem.index}`),
        );

        // Advanced Insights
        const tags: Record<string, number> = {};
        const hours: Record<number, number> = {};
        solved.forEach((s) => {
            s.problem.tags.forEach((t) => (tags[t] = (tags[t] || 0) + 1));
            const hour = new Date(s.creationTimeSeconds * 1000).getHours();
            hours[hour] = (hours[hour] || 0) + 1;
        });

        const bestTag =
            Object.entries(tags).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        const peakHour =
            Object.entries(hours).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;

        // Performance Metrics
        const ratingChanges = ratingHistory.map(
            (r) => r.newRating - r.oldRating,
        );
        const maxDelta = ratingChanges.length ? Math.max(...ratingChanges) : 0;
        const minDelta = ratingChanges.length ? Math.min(...ratingChanges) : 0;
        const positiveDeltas = ratingChanges.filter((d) => d > 0).length;
        const deltaSuccessRate = ratingChanges.length
            ? ((positiveDeltas / ratingHistory.length) * 100).toFixed(1)
            : 0;
        const avgRank = ratingHistory.length
            ? Math.round(
                  ratingHistory.reduce((acc, r) => acc + r.rank, 0) /
                      ratingHistory.length,
              )
            : 0;

        return {
            totalSolved: uniqueSolved.size,
            accuracy: (
                (solved.length / Math.max(subs.length, 1)) *
                100
            ).toFixed(1),
            avgDifficulty:
                Math.round(
                    solved.reduce(
                        (acc, s) => acc + (s.problem.rating || 0),
                        0,
                    ) / Math.max(solved.length, 1),
                ) || 0,
            bestTag,
            peakHour: `${peakHour}:00`,
            maxDelta,
            minDelta,
            deltaSuccessRate,
            avgRank,
            contestCount: ratingHistory.length,
        };
    };

    const analytics = useMemo(() => {
        if (!submissions.length) return null;
        return calculateAnalytics(submissions);
    }, [submissions]);

    // Compute live session stats for the AI tab
    const liveSessionStats = useMemo(() => {
        if (!submissions.length)
            return { streak: 0, intensity: 'Low', efficiency: '0%' };

        // Streak: consecutive days with at least one accepted submission
        const solvedDays = new Set(
            submissions
                .filter((s) => s.verdict === 'OK')
                .map((s) =>
                    new Date(s.creationTimeSeconds * 1000).toDateString(),
                ),
        );
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            if (solvedDays.has(d.toDateString())) streak++;
            else if (i > 0) break; // allow today to be missing
        }

        // Intensity: based on solves in last 30 days
        const thirtyDaysAgo = Date.now() / 1000 - 30 * 86400;
        const recentSolves = submissions.filter(
            (s) => s.verdict === 'OK' && s.creationTimeSeconds > thirtyDaysAgo,
        ).length;
        const intensity =
            recentSolves > 60 ? 'High' : recentSolves > 25 ? 'Medium' : 'Low';

        // Efficiency = accuracy
        const acc = analytics?.accuracy ?? 0;
        const efficiency = `${acc}%`;

        return { streak, intensity, efficiency };
    }, [submissions, analytics]);

    const availableLanguages = useMemo(() => {
        const langs = new Set<string>();
        submissions.forEach((s) => langs.add(s.programmingLanguage));
        return Array.from(langs).sort();
    }, [submissions]);

    const processedSubmissions = useMemo(() => {
        let filtered = [...submissions];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (s) =>
                    s.problem.name.toLowerCase().includes(q) ||
                    s.problem.index.toLowerCase().includes(q),
            );
        }

        if (verdictFilter !== 'ALL') {
            filtered = filtered.filter((s) => s.verdict === verdictFilter);
        }

        if (languageFilter !== 'ALL') {
            filtered = filtered.filter(
                (s) => s.programmingLanguage === languageFilter,
            );
        }

        filtered.sort((a, b) => {
            let valA: any, valB: any;
            switch (sortKey) {
                case 'problem':
                    valA = a.problem.name;
                    valB = b.problem.name;
                    break;
                case 'verdict':
                    valA = a.verdict;
                    valB = b.verdict;
                    break;
                case 'lang':
                    valA = a.programmingLanguage;
                    valB = b.programmingLanguage;
                    break;
                case 'time':
                    valA = a.timeConsumedMillis;
                    valB = b.timeConsumedMillis;
                    break;
                case 'memory':
                    valA = a.memoryConsumedBytes;
                    valB = b.memoryConsumedBytes;
                    break;
                case 'when':
                    valA = a.creationTimeSeconds;
                    valB = b.creationTimeSeconds;
                    break;
                default:
                    valA = a.creationTimeSeconds;
                    valB = b.creationTimeSeconds;
            }
            return sortDirection === 'asc'
                ? valA < valB
                    ? -1
                    : 1
                : valA > valB
                  ? -1
                  : 1;
        });

        return filtered;
    }, [
        submissions,
        searchQuery,
        verdictFilter,
        languageFilter,
        sortKey,
        sortDirection,
    ]);

    const [activeTab, setActiveTab] = useState<
        | 'overview'
        | 'analytics'
        | 'submissions'
        | 'ai'
        | 'prep'
        | 'social'
        | 'journey'
    >('overview');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const TABS = [
        { id: 'overview', label: 'Overview', icon: LayoutList },
        { id: 'journey', label: 'Journey', icon: Milestone },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'submissions', label: 'History', icon: Code2 },
        { id: 'ai', label: 'AI Coach', icon: Zap },
        { id: 'prep', label: 'Preparation', icon: Target },
        { id: 'social', label: 'Social', icon: Users },
    ] as const;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-bg-app">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap
                            size={20}
                            className="text-brand-primary animate-pulse"
                        />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <p className="text-sm font-display font-medium text-text-app animate-pulse">
                        Analyzing Profile Intelligence...
                    </p>
                    <p className="text-[10px] text-muted-app font-mono uppercase tracking-[0.2em]">
                        Synthesizing {handle}'s achievements
                    </p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <ErrorState
                message={error || 'User not found'}
                onRetry={handle ? () => loadData(handle) : undefined}
                onHome={() => navigate('/')}
            />
        );
    }

    return (
        <div className="min-h-screen bg-bg-app flex relative">
            <div className="mesh-background">
                <div className="w-200 h-200 bg-brand-primary/10 -top-50 -left-50" />
                <div
                    className="w-150 h-150 bg-brand-secondary/10 top-[20%] -right-32"
                    style={{ animationDelay: '-5s' }}
                />
            </div>

            {/* Mobile Drawer (Overlay backdrop + Sidebar sliding from left) */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
                        />
                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{
                                type: 'spring',
                                damping: 25,
                                stiffness: 200,
                            }}
                            className="md:hidden fixed left-0 top-0 w-72 h-screen bg-bg-app border-r border-white/10 z-100 flex flex-col p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <Trophy size={16} />
                                    </div>
                                    <span className="text-xs font-display font-black text-text-app uppercase tracking-wider">
                                        Scout Menu
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 rounded-xl text-muted-app hover:text-text-app hover:bg-white/5 transition-colors"
                                    aria-label="Close menu"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <nav className="flex-1 space-y-1">
                                {TABS.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative text-sm',
                                                isActive
                                                    ? 'bg-brand-primary/10 text-brand-primary'
                                                    : 'text-muted-app hover:bg-white/5 hover:text-text-app',
                                            )}
                                        >
                                            <Icon
                                                size={18}
                                                className={cn(
                                                    'shrink-0 transition-transform duration-500',
                                                    isActive && 'scale-110',
                                                )}
                                            />
                                            <span className="text-[11px] font-bold uppercase tracking-widest">
                                                {tab.label}
                                            </span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeTabMobile"
                                                    className="absolute left-0 w-1 h-6 bg-brand-primary rounded-r-full"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="p-4 mt-auto">
                                <Link
                                    to="/"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <button className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white/5 border border-white/5 text-muted-app hover:bg-white/10 hover:text-text-app transition-all text-left">
                                        <Search size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            New Scout
                                        </span>
                                    </button>
                                </Link>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Modern Sidebar Navigation (Desktop) */}
            <aside className="hidden md:flex w-20 lg:w-64 border-r border-white/5 glass fixed left-0 top-0 h-screen flex-col z-50 transition-all duration-500 pt-8">
                <nav className="flex-1 px-3 space-y-1">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative',
                                    isActive
                                        ? 'bg-brand-primary/10 text-brand-primary'
                                        : 'text-muted-app hover:bg-white/5 hover:text-text-app',
                                )}
                            >
                                <Icon
                                    size={20}
                                    className={cn(
                                        'shrink-0 transition-transform duration-500',
                                        isActive && 'scale-110',
                                    )}
                                />
                                <span className="text-[11px] font-bold uppercase tracking-widest hidden lg:block">
                                    {tab.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-6 bg-brand-primary rounded-r-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto">
                    <Link to="/">
                        <button className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white/5 border border-white/5 text-muted-app hover:bg-white/10 hover:text-text-app transition-all text-left">
                            <Search size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">
                                New Scout
                            </span>
                        </button>
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-0 mt-0 md:mt-0 md:ml-20 lg:ml-64 overflow-y-auto custom-scrollbar relative">
                <header className="sticky top-0 z-40 bg-bg-app/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-3 md:py-4">
                    <div className="flex flex-row items-center justify-between gap-2 md:gap-4 max-w-7xl mx-auto">
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 min-w-0 bg-white/5 border border-white/10 rounded-[2rem] px-3 py-3 md:px-4 md:py-4 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
                            {/* Mobile hamburger menu */}
                            <button
                                onClick={() =>
                                    setIsMobileMenuOpen(!isMobileMenuOpen)
                                }
                                className="md:hidden p-2 -ml-2 rounded-xl text-muted-app hover:text-text-app hover:bg-white/10 transition-colors shrink-0"
                                aria-label="Open menu"
                            >
                                <Menu size={20} />
                            </button>

                            <button
                                onClick={() => setIsProfileModalOpen(true)}
                                className="relative group shrink-0"
                            >
                                <div
                                    className={cn(
                                        'absolute -inset-1 rounded-2xl blur opacity-20 transition-all group-hover:opacity-40 group-hover:blur-md',
                                        getRankBg(user.rank || ''),
                                    )}
                                />
                                <img
                                    src={user.avatar}
                                    className="relative w-11 h-11 md:w-14 md:h-14 rounded-2xl border border-white/10 object-cover shadow-lg group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-bg-app border-2 border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Target
                                        size={8}
                                        className="text-brand-primary"
                                    />
                                </div>
                            </button>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1 min-w-0">
                                    <h1
                                        className="text-sm md:text-xl lg:text-2xl font-display font-black text-text-app tracking-tight group cursor-pointer hover:text-brand-primary transition-colors break-words whitespace-normal"
                                        onClick={() =>
                                            setIsProfileModalOpen(true)
                                        }
                                    >
                                        {user.handle}
                                    </h1>
                                    <span
                                        className={cn(
                                            'text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border leading-none shrink-0',
                                            getRankBg(user.rank || '').split(
                                                ' ',
                                            )[1],
                                        )}
                                    >
                                        {user.rank || 'Unranked'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-muted-app">
                                    <div className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-brand-primary shrink-0">
                                        <Zap size={10} />
                                        {user.rating} RL
                                    </div>
                                    <div className="w-px h-4 bg-white/10 shrink-0" />
                                    <div className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider">
                                        {user.maxRank || 'New Recruit'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                            <div className="hidden sm:flex items-center gap-2 mr-2 md:mr-4 text-muted-app">
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
                                        Operational Success
                                    </span>
                                    <span className="text-xs font-mono font-bold text-emerald-500">
                                        {analytics?.accuracy}%
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 md:px-4 h-7 md:h-9 rounded-lg md:rounded-xl border-white/5 shrink-0"
                                onClick={handleShare}
                            >
                                {copied ? (
                                    'Copied'
                                ) : (
                                    <Share2
                                        size={10}
                                        className="md:w-3 md:h-3"
                                    />
                                )}
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 md:px-4 h-7 md:h-9 rounded-lg md:rounded-xl bg-brand-primary shadow-lg shadow-brand-primary/20 shrink-0"
                                onClick={exportSubmissionsToCSV}
                            >
                                <Download size={10} className="md:w-3 md:h-3" />
                            </Button>
                            <Link to="/">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="md:hidden text-[7px] font-black uppercase tracking-widest px-2.5 h-7 rounded-lg border-white/5 shrink-0 flex items-center justify-center"
                                >
                                    <Search size={10} />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 pt-4 md:pt-6 pb-24 md:pb-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{
                                duration: 0.35,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                        >
                            {activeTab === 'overview' && (
                                <div className="space-y-6 md:space-y-10">
                                    {/* Hero Summary */}
                                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-8 items-stretch">
                                        <Card className="xl:col-span-8 p-4 md:p-10 bg-linear-to-br from-brand-primary/5 via-transparent to-transparent border-brand-primary/10 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Trophy size={120} />
                                            </div>
                                            <div className="flex items-center gap-2 mb-4 md:mb-6">
                                                <div className="px-2 py-0.5 rounded bg-brand-primary text-[8px] font-black text-white uppercase tracking-widest shadow-lg shadow-brand-primary/20">
                                                    Operational Profile
                                                </div>
                                            </div>
                                            <h3 className="text-xl md:text-3xl lg:text-4xl font-display font-black text-text-app mb-3 md:mb-6 leading-tight tracking-tighter">
                                                Mastering{' '}
                                                <span className="text-brand-primary">
                                                    {analytics?.bestTag}
                                                </span>{' '}
                                                at{' '}
                                                <span className="text-brand-secondary">
                                                    {analytics?.avgDifficulty}
                                                </span>{' '}
                                                Level
                                            </h3>
                                            <p className="text-xs md:text-sm lg:text-base text-muted-app leading-relaxed max-w-2xl opacity-70 group-hover:opacity-100 transition-opacity">
                                                The data indicates reaching a
                                                threshold of{' '}
                                                <span className="text-text-app font-bold">
                                                    {analytics?.totalSolved}
                                                </span>{' '}
                                                successful executions. Your
                                                focus on high-accuracy problem
                                                solving shows structured growth
                                                toward the next rating
                                                milestone.
                                            </p>
                                            <div className="mt-4 md:mt-8 flex items-center gap-4 md:gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-muted-app/40 uppercase tracking-widest">
                                                        Top Efficiency
                                                    </p>
                                                    <p className="text-xs md:text-sm font-display font-bold text-text-app">
                                                        {analytics?.peakHour}
                                                    </p>
                                                </div>
                                                <div className="w-px h-8 bg-white/5" />
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-muted-app/40 uppercase tracking-widest">
                                                        Problem Domain
                                                    </p>
                                                    <p className="text-xs md:text-sm font-display font-bold text-text-app">
                                                        {analytics?.bestTag}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>

                                        <div className="xl:col-span-4 grid grid-cols-2 xl:grid-cols-1 gap-3 md:gap-6">
                                            <Card className="p-3 md:p-8 flex flex-col justify-center relative overflow-hidden group">
                                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700">
                                                    <Zap
                                                        size={100}
                                                        className="text-brand-primary"
                                                    />
                                                </div>
                                                <div className="relative z-10">
                                                    <h4 className="text-[8px] md:text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1.5 md:mb-4">
                                                        Streak Status
                                                    </h4>
                                                    <p className="text-sm sm:text-lg md:text-2xl font-display font-bold text-text-app mb-0.5 md:mb-1 leading-tight">
                                                        Consistent Athlete
                                                    </p>
                                                    <p className="text-[9px] md:text-[11px] text-muted-app font-medium leading-normal">
                                                        Maintained activity over
                                                        the last quarter
                                                    </p>
                                                </div>
                                            </Card>
                                            <Card className="p-3 md:p-8 flex flex-col justify-center relative overflow-hidden group">
                                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700">
                                                    <Shield
                                                        size={100}
                                                        className="text-brand-secondary"
                                                    />
                                                </div>
                                                <div className="relative z-10">
                                                    <h4 className="text-[8px] md:text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-1.5 md:mb-4">
                                                        Historical Guard
                                                    </h4>
                                                    <p className="text-sm sm:text-lg md:text-2xl font-display font-bold text-text-app mb-0.5 md:mb-1 leading-tight">
                                                        Peak {user.maxRating}
                                                    </p>
                                                    <p className="text-[9px] md:text-[11px] text-muted-app font-medium leading-normal">
                                                        Securing{' '}
                                                        {user.maxRank ||
                                                            'Expert'}{' '}
                                                        status records
                                                    </p>
                                                </div>
                                            </Card>
                                        </div>
                                    </div>

                                    {/* Grid Stats */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                                        <StatCard
                                            label="Total Solved"
                                            value={analytics?.totalSolved}
                                            subValue="Unique Problems"
                                            icon={CheckCircle2}
                                        />
                                        <StatCard
                                            label="Accuracy"
                                            value={`${analytics?.accuracy}%`}
                                            subValue="Submission Precision"
                                            icon={Zap}
                                            color="bg-orange-500/10 text-orange-500"
                                        />
                                        <StatCard
                                            label="Avg Difficulty"
                                            value={analytics?.avgDifficulty}
                                            subValue="Rating Weight"
                                            icon={Binary}
                                            color="bg-brand-secondary/10 text-brand-secondary"
                                        />
                                        <StatCard
                                            label="Rank Milestone"
                                            value={user.maxRank}
                                            subValue="Historical Peak"
                                            icon={Award}
                                            color="bg-emerald-500/10 text-emerald-500"
                                        />
                                        <div className="col-span-2 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                                            <StatCard
                                                label="Contests"
                                                value={analytics?.contestCount}
                                                subValue="Official Appearances"
                                                icon={Users}
                                                color="bg-blue-500/10 text-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                                        <StatCard
                                            label="Max Delta"
                                            value={
                                                analytics?.maxDelta != null &&
                                                analytics.maxDelta > 0
                                                    ? `+${analytics.maxDelta}`
                                                    : (analytics?.maxDelta ??
                                                      '-')
                                            }
                                            subValue="Highest Gain"
                                            icon={TrendingUp}
                                            color="bg-emerald-500/10 text-emerald-500"
                                        />
                                        <StatCard
                                            label="Min Delta"
                                            value={analytics?.minDelta}
                                            subValue="Deepest Drop"
                                            icon={TrendingUp}
                                            trend="down"
                                            color="bg-red-500/10 text-red-500"
                                        />
                                        <div className="col-span-2 md:col-span-1">
                                            <StatCard
                                                label="Success Rate"
                                                value={`${analytics?.deltaSuccessRate}%`}
                                                subValue="Positive Delta %"
                                                icon={TrendingUp}
                                                color="bg-brand-primary/10 text-brand-primary"
                                            />
                                        </div>
                                    </div>

                                    {/* Main Rating Evolution */}
                                    <Card className="p-5 md:p-10 shadow-2xl relative overflow-visible!">
                                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6 md:mb-10">
                                            <div>
                                                <h3 className="text-lg md:text-2xl font-display font-bold text-text-app tracking-tight">
                                                    Competitive Trajectory
                                                </h3>
                                                <p className="text-[9px] md:text-[10px] font-mono text-muted-app uppercase tracking-[0.2em] mt-1.5 md:mt-2 opacity-40">
                                                    Rating fluctuations across{' '}
                                                    {ratingHistory.length}{' '}
                                                    contests
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3, 4].map((i) => (
                                                        <div
                                                            key={i}
                                                            className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/5 border-2 border-bg-app flex items-center justify-center"
                                                        >
                                                            <Trophy
                                                                size={10}
                                                                className="text-brand-primary"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="px-2.5 py-1 bg-brand-primary/5 border border-brand-primary/10 rounded-full flex items-center gap-1.5">
                                                    <RefreshCcw
                                                        size={8}
                                                        className="text-brand-primary"
                                                    />
                                                    <span className="text-[7px] md:text-[8px] font-black text-brand-primary tracking-widest uppercase">
                                                        Live Trace
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-55 sm:h-80 md:h-112.5">
                                            <RatingChart data={ratingHistory} />
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'journey' && (
                                <div className="max-w-4xl mx-auto">
                                    <Timeline
                                        user={user}
                                        ratingHistory={ratingHistory}
                                        submissions={submissions}
                                    />
                                </div>
                            )}

                            {activeTab === 'analytics' && (
                                <div className="space-y-6 md:space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                        <Card className="p-4 md:p-8 overflow-visible!">
                                            <div className="mb-6 md:mb-8">
                                                <h3 className="text-lg md:text-xl font-display font-bold text-text-app">
                                                    Problem Versatility
                                                </h3>
                                                <p className="text-[10px] font-mono text-muted-app uppercase tracking-[0.2em] mt-1 opacity-50">
                                                    Solution distribution by
                                                    complexity
                                                </p>
                                            </div>
                                            <ProblemDistribution
                                                submissions={submissions}
                                            />
                                        </Card>
                                        <Card className="p-4 md:p-8 overflow-visible!">
                                            <div className="mb-6 md:mb-8">
                                                <h3 className="text-lg md:text-xl font-display font-bold text-text-app">
                                                    Skill Signature
                                                </h3>
                                                <p className="text-[10px] font-mono text-muted-app uppercase tracking-[0.2em] mt-1 opacity-50">
                                                    Top 6 cognitive domains
                                                    visualized
                                                </p>
                                            </div>
                                            <RadarStrength
                                                submissions={submissions}
                                            />
                                        </Card>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                                        <Card className="p-4 md:p-8 overflow-visible!">
                                            <div className="mb-6 md:mb-8">
                                                <h3 className="text-lg md:text-xl font-display font-bold text-text-app">
                                                    Solution Verdicts
                                                </h3>
                                                <p className="text-[10px] font-mono text-muted-app uppercase tracking-[0.2em] mt-1 opacity-50">
                                                    Outcome distribution
                                                </p>
                                            </div>
                                            <VerdictPieChart
                                                submissions={submissions}
                                            />
                                        </Card>
                                        <Card className="p-4 md:p-8 lg:col-span-2 overflow-visible!">
                                            <LanguageStats
                                                submissions={submissions}
                                            />
                                        </Card>
                                    </div>

                                    <Card className="p-4 md:p-8">
                                        <div className="flex items-center gap-3 mb-6 md:mb-8 text-text-app">
                                            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                                                <HistoryIcon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg md:text-xl font-display font-bold">
                                                    Battle History
                                                </h3>
                                                <p className="text-[10px] font-mono text-muted-app uppercase tracking-[0.2em] mt-1 opacity-50">
                                                    A comprehensive record of
                                                    official contests
                                                </p>
                                            </div>
                                        </div>
                                        <ContestHistory
                                            ratingHistory={ratingHistory}
                                        />
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'submissions' && (
                                <Card className="p-0 overflow-hidden shadow-2xl">
                                    <div className="p-4 md:p-8 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card-app/30">
                                        <div>
                                            <h3 className="text-lg md:text-xl font-display font-bold text-text-app">
                                                Submissions Archive
                                            </h3>
                                            <p className="text-[10px] font-mono text-muted-app uppercase tracking-[0.2em] mt-1 opacity-50">
                                                Detailed execution stream
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 w-full lg:w-auto">
                                            <div className="relative group flex-1 lg:w-64">
                                                <Search
                                                    size={14}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-app"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    className="pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-text-app focus:outline-hidden focus:border-brand-primary w-full transition-all"
                                                    value={searchQuery}
                                                    onChange={(e) =>
                                                        setSearchQuery(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <select
                                                className="px-2.5 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-text-app focus:outline-hidden shrink-0"
                                                value={verdictFilter}
                                                onChange={(e) =>
                                                    setVerdictFilter(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="ALL">All</option>
                                                <option value="OK">
                                                    Accepted
                                                </option>
                                                <option value="WRONG_ANSWER">
                                                    Wrong
                                                </option>
                                                <option value="TIME_LIMIT_EXCEEDED">
                                                    TLE
                                                </option>
                                            </select>
                                            <Button
                                                variant="secondary"
                                                onClick={refreshSubmissions}
                                                isLoading={refreshing}
                                                className="h-9 px-3 shrink-0 rounded-xl"
                                            >
                                                <RefreshCcw
                                                    size={14}
                                                    className={
                                                        refreshing
                                                            ? 'animate-spin'
                                                            : ''
                                                    }
                                                />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="max-h-162.5 overflow-y-auto custom-scrollbar overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 z-10 bg-bg-app shadow-sm shadow-white/5">
                                                <tr>
                                                    {[
                                                        {
                                                            id: 'problem',
                                                            label: 'Problem Subject',
                                                            className: '',
                                                        },
                                                        {
                                                            id: 'verdict',
                                                            label: 'Status',
                                                            className: '',
                                                        },
                                                        {
                                                            id: 'lang',
                                                            label: 'Sys',
                                                            className:
                                                                'hidden sm:table-cell',
                                                        },
                                                        {
                                                            id: 'time',
                                                            label: 'Latency',
                                                            className:
                                                                'hidden md:table-cell',
                                                        },
                                                        {
                                                            id: 'when',
                                                            label: 'Timestamp',
                                                            className: '',
                                                        },
                                                    ].map((h) => (
                                                        <th
                                                            key={h.id}
                                                            onClick={() =>
                                                                toggleSort(h.id)
                                                            }
                                                            className={cn(
                                                                'px-4 md:px-8 py-3 md:py-5 text-[9px] uppercase font-black text-muted-app tracking-[0.2em] border-b border-white/5 cursor-pointer hover:text-brand-primary transition-colors group/header',
                                                                h.className,
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {h.label}
                                                                <ChevronDown
                                                                    size={10}
                                                                    className={cn(
                                                                        'transition-transform opacity-0 group-hover/header:opacity-100',
                                                                        sortKey ===
                                                                            h.id &&
                                                                            'opacity-100',
                                                                        sortKey ===
                                                                            h.id &&
                                                                            sortDirection ===
                                                                                'asc' &&
                                                                            'rotate-180',
                                                                    )}
                                                                />
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {processedSubmissions
                                                    .slice(0, 100)
                                                    .map((sub) => (
                                                        <tr
                                                            key={sub.id}
                                                            onClick={() =>
                                                                setSelectedSubmission(
                                                                    sub,
                                                                )
                                                            }
                                                            className="group hover:bg-brand-primary/2 transition-colors cursor-pointer"
                                                        >
                                                            <td className="px-4 md:px-8 py-3 md:py-5">
                                                                <div className="flex flex-col">
                                                                    <span
                                                                        className="text-sm font-bold text-text-app group-hover:text-brand-primary transition-colors cursor-pointer"
                                                                        onClick={() =>
                                                                            window.open(
                                                                                `https://codeforces.com/contest/${sub.problem.contestId}/problem/${sub.problem.index}`,
                                                                                '_blank',
                                                                            )
                                                                        }
                                                                    >
                                                                        {
                                                                            sub
                                                                                .problem
                                                                                .name
                                                                        }
                                                                    </span>
                                                                    <span className="text-[10px] font-mono font-bold text-muted-app/40 mt-1 uppercase">
                                                                        #
                                                                        {
                                                                            sub
                                                                                .problem
                                                                                .contestId
                                                                        }
                                                                        {
                                                                            sub
                                                                                .problem
                                                                                .index
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 md:px-8 py-3 md:py-5">
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className={cn(
                                                                            'w-2 h-2 rounded-full',
                                                                            sub.verdict ===
                                                                                'OK'
                                                                                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                                                                : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
                                                                        )}
                                                                    />
                                                                    <span
                                                                        className={cn(
                                                                            'text-[10px] font-black uppercase tracking-widest',
                                                                            sub.verdict ===
                                                                                'OK'
                                                                                ? 'text-emerald-500'
                                                                                : 'text-red-500',
                                                                        )}
                                                                    >
                                                                        {sub.verdict ===
                                                                        'OK'
                                                                            ? 'Accepted'
                                                                            : 'Failed'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 md:px-8 py-3 md:py-5 text-[11px] font-mono text-muted-app font-bold hidden sm:table-cell">
                                                                {
                                                                    sub.programmingLanguage
                                                                }
                                                            </td>
                                                            <td className="px-4 md:px-8 py-3 md:py-5 text-[11px] font-mono text-muted-app font-bold hidden md:table-cell">
                                                                {
                                                                    sub.timeConsumedMillis
                                                                }
                                                                ms
                                                            </td>
                                                            <td className="px-4 md:px-8 py-3 md:py-5 text-[11px] font-mono text-muted-app font-bold">
                                                                {format(
                                                                    new Date(
                                                                        sub.creationTimeSeconds *
                                                                            1000,
                                                                    ),
                                                                    'MMM dd, HH:mm',
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}

                            {activeTab === 'ai' && (
                                <div className="space-y-6 md:space-y-8">
                                    {/* Row 1: Intelligence Roadmap + Chat Coach */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                                        {/* Roadmap */}
                                        <div className="lg:col-span-7">
                                            <Card className="p-0 overflow-hidden flex flex-col h-full">
                                                <div className="p-5 md:p-6 border-b border-white/5 bg-linear-to-r from-brand-primary/10 via-transparent to-transparent">
                                                    <h3 className="text-lg font-display font-bold text-text-app">
                                                        Intelligence Roadmap
                                                    </h3>
                                                    <p className="text-[10px] font-mono text-muted-app uppercase tracking-[0.2em] mt-1 opacity-50">
                                                        AI-generated growth
                                                        strategy
                                                    </p>
                                                </div>
                                                <div className="p-5 md:p-6 flex-1">
                                                    <AIRoadmap
                                                        user={user}
                                                        submissions={
                                                            submissions
                                                        }
                                                        analytics={analytics}
                                                    />
                                                </div>
                                            </Card>
                                        </div>

                                        {/* AI Chat Coach */}
                                        <div className="lg:col-span-5">
                                            <Card className="p-5 md:p-6 flex flex-col h-full min-h-130">
                                                <AIChatCoach
                                                    user={user}
                                                    submissions={submissions}
                                                    analytics={analytics}
                                                    ratingHistory={
                                                        ratingHistory
                                                    }
                                                />
                                            </Card>
                                        </div>
                                    </div>

                                    {/* Row 2: Focus Recommendation (dynamic) + Live Session Stats */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                        {/* Dynamic Focus Recommendation */}
                                        <Card className="p-5 md:p-6 bg-brand-primary/5 border-brand-primary/10 sm:col-span-2 lg:col-span-1">
                                            <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-3">
                                                Focus Recommendation
                                            </h4>
                                            {analytics ? (
                                                <>
                                                    <p className="text-xs font-bold text-text-app mb-1 leading-relaxed">
                                                        Based on your stats,
                                                        prioritize{' '}
                                                        <span className="text-brand-primary">
                                                            {analytics.bestTag}
                                                        </span>{' '}
                                                        and target problems
                                                        rated{' '}
                                                        <span className="text-brand-primary">
                                                            {(user?.rating ??
                                                                800) + 100}
                                                            –
                                                            {Math.min(
                                                                (user?.rating ??
                                                                    800) + 300,
                                                                3500,
                                                            )}
                                                        </span>
                                                        .
                                                    </p>
                                                    <p className="text-[10px] text-muted-app/60 leading-relaxed">
                                                        Your{' '}
                                                        {
                                                            analytics.deltaSuccessRate
                                                        }
                                                        % contest win rate and{' '}
                                                        {analytics.accuracy}%
                                                        accuracy suggest{' '}
                                                        {Number(
                                                            analytics.deltaSuccessRate,
                                                        ) >= 50
                                                            ? 'you\u2019re ready to push harder \u2014 attempt Div 2 C/D problems.'
                                                            : 'consistency training will drive your next rating breakthrough.'}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-[10px] text-muted-app/50">
                                                    Loading your profile data...
                                                </p>
                                            )}
                                        </Card>

                                        {/* Live Session Stats */}
                                        <Card className="p-5 md:p-6">
                                            <h4 className="text-[10px] font-black text-muted-app uppercase tracking-widest mb-4">
                                                Live Session Stats
                                            </h4>
                                            <div className="space-y-3.5">
                                                {[
                                                    {
                                                        label: 'Intensity',
                                                        value: liveSessionStats.intensity,
                                                        color:
                                                            liveSessionStats.intensity ===
                                                            'High'
                                                                ? 'text-emerald-400'
                                                                : liveSessionStats.intensity ===
                                                                    'Medium'
                                                                  ? 'text-yellow-400'
                                                                  : 'text-orange-400',
                                                    },
                                                    {
                                                        label: 'Streak',
                                                        value:
                                                            liveSessionStats.streak >
                                                            0
                                                                ? `${liveSessionStats.streak} day${liveSessionStats.streak !== 1 ? 's' : ''}`
                                                                : 'No streak',
                                                        color:
                                                            liveSessionStats.streak >
                                                            7
                                                                ? 'text-emerald-400'
                                                                : liveSessionStats.streak >
                                                                    2
                                                                  ? 'text-brand-primary'
                                                                  : 'text-muted-app/50',
                                                    },
                                                    {
                                                        label: 'Efficiency',
                                                        value: liveSessionStats.efficiency,
                                                        color:
                                                            Number(
                                                                analytics?.accuracy ??
                                                                    0,
                                                            ) >= 70
                                                                ? 'text-emerald-400'
                                                                : Number(
                                                                        analytics?.accuracy ??
                                                                            0,
                                                                    ) >= 50
                                                                  ? 'text-yellow-400'
                                                                  : 'text-orange-400',
                                                    },
                                                ].map((item) => (
                                                    <div
                                                        key={item.label}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <span className="text-[10px] font-bold text-muted-app/50 uppercase tracking-wide">
                                                            {item.label}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'text-xs font-black uppercase',
                                                                item.color,
                                                            )}
                                                        >
                                                            {item.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>

                                        {/* Contest count + rating summary */}
                                        <Card className="p-5 md:p-6">
                                            <h4 className="text-[10px] font-black text-muted-app uppercase tracking-widest mb-4">
                                                At a Glance
                                            </h4>
                                            <div className="space-y-3.5">
                                                {[
                                                    {
                                                        label: 'Contests',
                                                        value:
                                                            analytics?.contestCount ??
                                                            0,
                                                        color: 'text-brand-secondary',
                                                    },
                                                    {
                                                        label: 'Avg Rank',
                                                        value: analytics?.avgRank
                                                            ? `#${analytics.avgRank}`
                                                            : '—',
                                                        color: 'text-text-app',
                                                    },
                                                    {
                                                        label: 'Best Delta',
                                                        value: analytics?.maxDelta
                                                            ? `+${analytics.maxDelta}`
                                                            : '—',
                                                        color: 'text-emerald-400',
                                                    },
                                                ].map((item) => (
                                                    <div
                                                        key={item.label}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <span className="text-[10px] font-bold text-muted-app/50 uppercase tracking-wide">
                                                            {item.label}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'text-xs font-black',
                                                                item.color,
                                                            )}
                                                        >
                                                            {item.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Row 3: Weakness Analyzer + Contest Debrief */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                        <Card className="p-5 md:p-6">
                                            <AIWeaknessAnalyzer
                                                submissions={submissions}
                                                analytics={analytics}
                                                currentRating={
                                                    user?.rating ?? 800
                                                }
                                            />
                                        </Card>
                                        <Card className="p-5 md:p-6">
                                            <AIContestDebrief
                                                ratingHistory={ratingHistory}
                                                currentRating={
                                                    user?.rating ?? 800
                                                }
                                                handle={user?.handle ?? ''}
                                            />
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'prep' && (
                                <div className="space-y-6 md:space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                                        <div className="lg:col-span-8 space-y-6 md:space-y-8">
                                            {/* Activity Matrix with Context */}
                                            <Card className="p-4 md:p-8 relative overflow-visible!">
                                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6 md:mb-8 relative z-10">
                                                    <div>
                                                        <h3 className="text-xl md:text-2xl font-display font-bold text-text-app">
                                                            Cognitive
                                                            Consistency
                                                        </h3>
                                                        <p className="text-[10px] font-mono text-muted-app uppercase tracking-[0.2em] mt-1.5 opacity-40">
                                                            Execution heatmap of
                                                            the last year
                                                        </p>
                                                    </div>
                                                    <div className="p-2 md:p-3 bg-brand-primary/10 rounded-xl md:rounded-2xl text-brand-primary shrink-0">
                                                        <Calendar
                                                            size={20}
                                                            className="md:w-6 md:h-6"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="relative z-10">
                                                    <ActivityHeatmap
                                                        submissions={
                                                            submissions
                                                        }
                                                    />
                                                </div>
                                            </Card>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                                <Card className="p-4 md:p-8 bg-card-app/30 border-white/5">
                                                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                                                        <div className="w-1.5 h-6 bg-brand-secondary rounded-full" />
                                                        <h3 className="text-sm font-black text-text-app uppercase tracking-widest">
                                                            Target
                                                            Recommendations
                                                        </h3>
                                                    </div>
                                                    <Recommendations
                                                        submissions={
                                                            submissions
                                                        }
                                                        problemset={problemset}
                                                        currentRating={
                                                            user?.rating || 800
                                                        }
                                                    />
                                                </Card>
                                                <Card className="p-4 md:p-8 bg-card-app/30 border-white/5">
                                                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                                                        <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                                        <h3 className="text-sm font-black text-text-app uppercase tracking-widest">
                                                            Unsolved Challenges
                                                        </h3>
                                                    </div>
                                                    <UnsolvedProblems
                                                        submissions={
                                                            submissions
                                                        }
                                                    />
                                                </Card>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-4 space-y-6 md:space-y-8">
                                            <Card className="p-4 md:p-8 bg-linear-to-b from-brand-primary/5 to-transparent border-brand-primary/10 relative overflow-hidden">
                                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-primary/10 rounded-full blur-3xl" />
                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-6 md:mb-8">
                                                        <h3 className="text-sm font-black text-text-app uppercase tracking-widest">
                                                            Official Schedule
                                                        </h3>
                                                        <Zap
                                                            size={16}
                                                            className="text-brand-primary"
                                                        />
                                                    </div>
                                                    <UpcomingContests />
                                                </div>
                                            </Card>

                                            <Card className="p-4 md:p-8 relative overflow-hidden">
                                                <h3 className="text-sm font-black text-text-app uppercase tracking-widest mb-6 md:mb-8">
                                                    Advancement Vector
                                                </h3>
                                                <div className="space-y-6 relative z-10">
                                                    <div className="p-4 md:p-6 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all duration-500">
                                                        <p className="text-[10px] font-black text-muted-app uppercase tracking-widest mb-3 opacity-40 group-hover:opacity-100 transition-opacity">
                                                            Current Breakthrough
                                                            Phase
                                                        </p>
                                                        <div className="flex items-center justify-between mb-6">
                                                            <span className="text-xl md:text-2xl font-display font-black text-text-app tracking-tight">
                                                                Expert Status
                                                            </span>
                                                            <span className="text-xs md:text-sm font-mono font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
                                                                1600 RP
                                                            </span>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden mb-2 shadow-inner">
                                                            <motion.div
                                                                initial={{
                                                                    width: 0,
                                                                }}
                                                                animate={{
                                                                    width: `${((user?.rating ?? 0) / 1600) * 100}%`,
                                                                }}
                                                                className="h-full bg-linear-to-r from-brand-primary to-brand-secondary rounded-full relative"
                                                            >
                                                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-size-[1rem_1rem] animate-[progress_1s_linear_infinite]" />
                                                            </motion.div>
                                                        </div>
                                                        <div className="flex justify-between mt-4">
                                                            <span className="text-[10px] font-bold text-muted-app italic">
                                                                Progressing...
                                                            </span>
                                                            <span className="text-[10px] font-black text-text-app uppercase">
                                                                {Math.round(
                                                                    ((user?.rating ??
                                                                        0) /
                                                                        1600) *
                                                                        100,
                                                                )}
                                                                %
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'social' && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                                    <div className="lg:col-span-8 space-y-6 md:space-y-8">
                                        <Card className="p-4 md:p-8">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="text-xl md:text-2xl font-display font-bold text-text-app">
                                                        Engagement Stream
                                                    </h3>
                                                    <p className="text-[10px] font-mono text-muted-app uppercase tracking-[0.2em] mt-2 opacity-40">
                                                        Public blog entries and
                                                        announcements
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                                                    <Users size={24} />
                                                </div>
                                            </div>

                                            {blogs.length > 0 ? (
                                                <div className="space-y-6">
                                                    {blogs.map((blog) => (
                                                        <div
                                                            key={blog.id}
                                                            className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                                                            onClick={() =>
                                                                window.open(
                                                                    `https://codeforces.com/blog/entry/${blog.id}`,
                                                                    '_blank',
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-[9px] font-mono font-bold text-brand-primary uppercase tracking-[0.2em]">
                                                                    {format(
                                                                        new Date(
                                                                            blog.creationTimeSeconds *
                                                                                1000,
                                                                        ),
                                                                        'MMM dd, yyyy',
                                                                    )}
                                                                </span>
                                                                <div className="flex items-center gap-4 text-muted-app text-[10px] font-bold">
                                                                    <div className="flex items-center gap-1">
                                                                        <ArrowUp
                                                                            size={
                                                                                12
                                                                            }
                                                                            className="text-emerald-500"
                                                                        />
                                                                        {
                                                                            blog.rating
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <h4 className="text-base font-bold text-text-app group-hover:text-brand-primary transition-colors break-words whitespace-normal mb-2">
                                                                {blog.title.replace(
                                                                    /<\/?[^>]+(>|$)/g,
                                                                    '',
                                                                )}
                                                            </h4>
                                                            <div className="flex items-center gap-3">
                                                                {blog.tags.map(
                                                                    (
                                                                        tag: string,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                tag
                                                                            }
                                                                            className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-muted-app/60 border border-white/5"
                                                                        >
                                                                            #
                                                                            {
                                                                                tag
                                                                            }
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                                    <Users
                                                        size={48}
                                                        className="text-muted-app opacity-20 mb-4"
                                                    />
                                                    <p className="text-sm font-medium text-muted-app">
                                                        No public blog entries
                                                        found for this user.
                                                    </p>
                                                </div>
                                            )}
                                        </Card>
                                    </div>

                                    <div className="lg:col-span-4 space-y-8">
                                        <Card className="p-5 md:p-8">
                                            <h3 className="text-sm font-black text-text-app uppercase tracking-widest mb-8">
                                                Social Influence
                                            </h3>
                                            <div className="space-y-6">
                                                <div className="p-5 md:p-6 rounded-2xl bg-brand-primary/5 border border-brand-primary/10">
                                                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-2 opacity-60">
                                                        Total Contribution
                                                    </p>
                                                    <p className="text-3xl font-display font-black text-text-app">
                                                        {user.contribution || 0}
                                                    </p>
                                                </div>
                                                <div className="p-5 md:p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 opacity-60">
                                                        Social Influence
                                                    </p>
                                                    <p className="text-3xl font-display font-black text-text-app">
                                                        {(user as any)
                                                            .friendOfCount || 0}
                                                    </p>
                                                    <p className="text-[9px] text-muted-app mt-1 uppercase font-bold tracking-tighter">
                                                        Followers on Codeforces
                                                    </p>
                                                </div>
                                                <div className="p-5 md:p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                                                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-2 opacity-60">
                                                        Blog Count
                                                    </p>
                                                    <p className="text-3xl font-display font-black text-text-app">
                                                        {blogs.length}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="p-5 md:p-8">
                                            <h3 className="text-sm font-black text-text-app uppercase tracking-widest mb-8">
                                                Community Status
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                                    <span className="text-[10px] font-bold text-muted-app uppercase">
                                                        Last Online
                                                    </span>
                                                    <span className="text-[10px] font-mono text-text-app font-bold">
                                                        {format(
                                                            new Date(
                                                                user.lastOnlineTimeSeconds *
                                                                    1000,
                                                            ),
                                                            'MMM dd, HH:mm',
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                                    <span className="text-[10px] font-bold text-muted-app uppercase">
                                                        Member Since
                                                    </span>
                                                    <span className="text-[10px] font-mono text-text-app font-bold">
                                                        {format(
                                                            new Date(
                                                                user.registrationTimeSeconds *
                                                                    1000,
                                                            ),
                                                            'MMM dd, yyyy',
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Detailed Profile Modal */}
            <AnimatePresence>
                {isProfileModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
                        onClick={() => setIsProfileModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-bg-app w-full max-w-2xl rounded-[40px] overflow-hidden border border-white/10 shadow-3xl flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header/Hero */}
                            <div className="relative h-48 shrink-0">
                                <div
                                    className={cn(
                                        'absolute inset-0 opacity-20',
                                        getRankBg(user.rank || ''),
                                    )}
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-bg-app via-bg-app/50 to-transparent" />

                                <button
                                    onClick={() => setIsProfileModalOpen(false)}
                                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10 backdrop-blur-md"
                                >
                                    <XCircle
                                        size={20}
                                        className="text-text-app"
                                    />
                                </button>

                                <div className="absolute -bottom-10 left-10 flex items-end gap-6">
                                    <div className="relative group">
                                        <div
                                            className={cn(
                                                'absolute -inset-1 rounded-4xl blur-lg opacity-40',
                                                getRankBg(user.rank || ''),
                                            )}
                                        />
                                        <img
                                            src={user.titlePhoto || user.avatar}
                                            className="relative w-32 h-32 rounded-4xl border-4 border-bg-app object-cover shadow-2xl"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <h2 className="text-3xl font-display font-black text-text-app tracking-tighter leading-none mb-2">
                                            {user.handle}
                                        </h2>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    'text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-white/10',
                                                    getRankBg(
                                                        user.rank || '',
                                                    ).split(' ')[1],
                                                )}
                                            >
                                                {user.rank || 'Unranked'}
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-muted-app opacity-60 uppercase">
                                                Max {user.maxRank}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-10 pt-16 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
                                    <DetailItem
                                        label="Full Intelligence Name"
                                        value={
                                            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                                            'Classified'
                                        }
                                    />
                                    <DetailItem
                                        label="Current Rating"
                                        value={user.rating || 'N/A'}
                                        isMono
                                    />
                                    <DetailItem
                                        label="Peak Rating"
                                        value={user.maxRating || 'N/A'}
                                        isMono
                                    />
                                    <DetailItem
                                        label="Origin (Country)"
                                        value={user.country || 'Global'}
                                    />
                                    <DetailItem
                                        label="Field Base (City)"
                                        value={user.city || 'Undisclosed'}
                                    />
                                    <DetailItem
                                        label="Organization"
                                        value={
                                            user.organization || 'Independent'
                                        }
                                    />
                                    <DetailItem
                                        label="Social Footprint"
                                        value={`${(user as any).friendOfCount || 0} Followers`}
                                        isMono
                                    />
                                    <DetailItem
                                        label="Contribution"
                                        value={user.contribution || 0}
                                        isMono
                                    />
                                    <DetailItem
                                        label="Member Capacity"
                                        value={format(
                                            new Date(
                                                user.registrationTimeSeconds *
                                                    1000,
                                            ),
                                            'MMM dd, yyyy',
                                        )}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-muted-app uppercase tracking-[0.2em] opacity-40">
                                        Intelligence Overview
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                            <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-2">
                                                Primary Domain
                                            </p>
                                            <p className="text-lg font-display font-bold text-text-app">
                                                {analytics?.bestTag}
                                            </p>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">
                                                Success Velocity
                                            </p>
                                            <p className="text-lg font-display font-bold text-text-app">
                                                {analytics?.totalSolved} Solved
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 pt-10 border-t border-white/5 flex gap-4">
                                    <a
                                        href={`https://codeforces.com/profile/${user.handle}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1"
                                    >
                                        <Button className="w-full h-14 rounded-2xl gap-3 font-black uppercase tracking-widest text-[11px] bg-brand-primary">
                                            <ExternalLink size={18} /> Deep
                                            Trace Profile
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Submission Details Modal */}
            <AnimatePresence>
                {selectedSubmission && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                        onClick={() => setSelectedSubmission(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass w-full max-w-xl rounded-[40px] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                            <Code2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-display font-bold text-text-app">
                                                Submission Internal
                                            </h3>
                                            <p className="text-[10px] font-mono text-muted-app uppercase tracking-widest font-bold">
                                                Trace ID #
                                                {selectedSubmission.id}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setSelectedSubmission(null)
                                        }
                                        className="p-3 hover:bg-white/5 rounded-full transition-colors"
                                    >
                                        <XCircle
                                            size={24}
                                            className="text-muted-app"
                                        />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
                                    <DetailItem
                                        label="Problem Name"
                                        value={selectedSubmission.problem.name}
                                    />
                                    <DetailItem
                                        label="Contest ID"
                                        value={`#${selectedSubmission.contestId}`}
                                    />
                                    <div className="col-span-2 md:col-span-1">
                                        <DetailItem
                                            label="Status Verdict"
                                            value={selectedSubmission.verdict}
                                            isVerdict
                                        />
                                    </div>
                                    <DetailItem
                                        label="Language"
                                        value={
                                            selectedSubmission.programmingLanguage
                                        }
                                    />
                                    <DetailItem
                                        label="Execution Time"
                                        value={`${selectedSubmission.timeConsumedMillis}ms`}
                                        isMono
                                    />
                                    <DetailItem
                                        label="Memory Heap"
                                        value={`${Math.round(selectedSubmission.memoryConsumedBytes / 1024 / 1024)}MB`}
                                        isMono
                                    />
                                    <DetailItem
                                        label="Testset"
                                        value={selectedSubmission.testset}
                                    />
                                    <DetailItem
                                        label="Passed Tests"
                                        value={
                                            selectedSubmission.passedTestCount
                                        }
                                        isMono
                                    />
                                    <DetailItem
                                        label="Submitted At"
                                        value={format(
                                            new Date(
                                                selectedSubmission.creationTimeSeconds *
                                                    1000,
                                            ),
                                            'MMM dd, HH:mm:ss',
                                        )}
                                        isMono
                                    />

                                    <div className="col-span-2 md:col-span-3">
                                        <p className="text-[10px] text-muted-app uppercase font-black tracking-[0.2em] mb-2">
                                            Problem Tags
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSubmission.problem.tags.map(
                                                (tag) => (
                                                    <span
                                                        key={tag}
                                                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-muted-app uppercase tracking-wider"
                                                    >
                                                        {tag}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <a
                                        href={`https://codeforces.com/contest/${selectedSubmission.contestId}/submission/${selectedSubmission.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1"
                                    >
                                        <Button className="w-full h-14 rounded-2xl gap-2 font-black uppercase tracking-widest text-[11px]">
                                            <ExternalLink size={16} /> View on
                                            Codeforces
                                        </Button>
                                    </a>
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            setSelectedSubmission(null)
                                        }
                                        className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px]"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function InsightCard({ title, desc, icon: Icon, color }: any) {
    return (
        <Card className="p-6 transition-all duration-500 group relative bg-linear-to-br from-card-app to-white/1 hover:-translate-y-1 hover:shadow-2xl">
            <div
                className={cn(
                    'p-3 rounded-2xl w-fit mb-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg',
                    color ||
                        'text-brand-primary bg-brand-primary/10 shadow-brand-primary/5',
                )}
            >
                <Icon size={18} />
            </div>
            <h4 className="text-base font-display font-bold text-text-app mb-2 tracking-tight group-hover:text-brand-primary transition-colors">
                {title}
            </h4>
            <p className="text-xs leading-relaxed text-muted-app font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                {desc}
            </p>

            {/* Interactive Detail */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary">
                    Analytical Detail
                </span>
                <div className="w-8 h-px bg-brand-primary/30" />
            </div>

            <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-700 group-hover:scale-150 rotate-12 pointer-events-none">
                {Icon && <Icon size={80} />}
            </div>
        </Card>
    );
}

function DetailItem({ label, value, isVerdict, isMono }: any) {
    return (
        <div className="space-y-1.5">
            <p className="text-[10px] text-muted-app uppercase font-black tracking-[0.2em]">
                {label}
            </p>
            {isVerdict ? (
                <span
                    className={cn(
                        'text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider',
                        value === 'OK'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20',
                    )}
                >
                    {value === 'OK' ? 'Accepted' : value.replace(/_/g, ' ')}
                </span>
            ) : (
                <p
                    className={cn(
                        'text-sm font-bold text-text-app',
                        isMono && 'font-mono text-brand-primary',
                    )}
                >
                    {value}
                </p>
            )}
        </div>
    );
}
