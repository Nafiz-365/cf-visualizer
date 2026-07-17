import React, { useState } from 'react';
import { User, Submission } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import {
    Map,
    ChevronRight,
    Lock,
    Loader2,
    Sparkles,
    XCircle,
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface RoadmapStep {
    title: string;
    topic: string;
    reason: string;
    difficulty: string;
}

interface AIRoadmapProps {
    user: User;
    submissions: Submission[];
    analytics: any;
}

export function AIRoadmap({ user, submissions, analytics }: AIRoadmapProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roadmap, setRoadmap] = useState<RoadmapStep[] | null>(null);
    const [usingFallback, setUsingFallback] = useState(false);

    const generateRoadmap = async () => {
        setLoading(true);
        setError(null);
        setUsingFallback(false);
        try {
            const prompt = `
        Create a 4-step competitive programming roadmap for user ${user.handle} who is currently ranked ${user.rank} with ${user.rating} rating.
        Their strongest field is ${analytics.bestTag} and they have solved ${analytics.totalSolved} problems.
        
        Focus on bridging the gap to the next tier.
        Return ONLY a JSON array of 4 objects with:
        - "title": Phase name (e.g., "Mastering Dynamic Programming")
        - "topic": Main tag/topic name
        - "reason": Why this is important for them right now based on stats.
        - "difficulty": Codeforces rating range for problems (e.g., "1400-1600")
      `;

            const insights = await GeminiService.customPrompt(prompt);
            if (!insights || insights.length === 0) {
                throw new Error('QUOTA_EXCEEDED'); // Trigger fallback if AI returns nothing
            }
            setRoadmap(insights);
        } catch (err: any) {
            if (err.message === 'QUOTA_EXCEEDED') {
                setUsingFallback(true);
                const r = user.rating || 800;
                setRoadmap([
                    {
                        title: 'Foundational Mastery',
                        topic: analytics.bestTag,
                        reason: `Consolidate your strength in ${analytics.bestTag} by solving 10 more problems in the ${r}-${r + 200} range.`,
                        difficulty: `${r}-${r + 200}`,
                    },
                    {
                        title: 'Technical Breach',
                        topic: 'implementation',
                        reason: 'Focus on implementation speed to ensure you can clear early problems within the first 15 minutes of a contest.',
                        difficulty: `${Math.max(r - 200, 800)}-${r}`,
                    },
                    {
                        title: 'Cognitive Expansion',
                        topic: 'math',
                        reason: 'Mathematical foundations are critical. Master combinatorics and number theory to solve B/C level problems.',
                        difficulty: `${r}-${r + 200}`,
                    },
                    {
                        title: 'Next Level Tactics',
                        topic: 'dp',
                        reason: 'To break into the next rank, mastering Dynamic Programming is essential for higher level problem solving.',
                        difficulty: `${r + 100}-${r + 400}`,
                    },
                ]);
            } else {
                console.error('Roadmap generation failed:', err);
                setError(
                    'AI Coach is temporarily offline. Please try again later.',
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-[10px] text-muted-app font-mono uppercase tracking-widest">
                        {usingFallback
                            ? 'Heuristic Growth Strategy (AI Quota Reached)'
                            : `Personalized path to ${user.maxRank || 'Expert'}`}
                    </p>
                </div>
                {!roadmap && !error && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={generateRoadmap}
                        disabled={loading}
                        className="text-[9px] uppercase font-black tracking-widest gap-2 h-8"
                    >
                        {loading ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <Sparkles size={12} />
                        )}
                        {loading ? 'Analyzing...' : 'Build Roadmap'}
                    </Button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {error && !roadmap && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-10 text-center"
                    >
                        <XCircle
                            size={24}
                            className="text-red-500 mb-4 opacity-50"
                        />
                        <p className="text-[11px] text-muted-app font-medium mb-4">
                            {error}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={generateRoadmap}
                            className="text-[9px] h-8"
                        >
                            Retry Connection
                        </Button>
                    </motion.div>
                )}
                {!roadmap && !error ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-10 text-center"
                    >
                        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                            <Lock size={20} className="text-muted-app/30" />
                        </div>
                        <p className="text-[11px] text-muted-app font-medium max-w-45">
                            Unlock your next goals by generating a custom
                            data-driven roadmap.
                        </p>
                    </motion.div>
                ) : null}
                {roadmap ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {roadmap.map((step, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className="w-7 h-7 rounded-full bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center text-[9px] font-black text-brand-secondary group-hover:scale-110 transition-transform">
                                        {i + 1}
                                    </div>
                                    {i !== roadmap.length - 1 && (
                                        <div className="w-px flex-1 bg-linear-to-b from-brand-secondary/20 to-transparent my-1.5" />
                                    )}
                                </div>
                                <div className="pb-4 flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-[12px] font-bold text-text-app group-hover:text-brand-secondary transition-colors">
                                            {step.title}
                                        </h4>
                                        <span className="text-[8px] font-black text-muted-app/40 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">
                                            {step.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-app leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                                        {step.reason}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[9px] py-1 h-8 mt-2 opacity-30 hover:opacity-100 transition-opacity"
                            onClick={() => setRoadmap(null)}
                        >
                            Reset Roadmap
                        </Button>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
