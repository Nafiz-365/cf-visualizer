import React from 'react';
import { User, RatingChange, Submission } from '../types';
import { Card } from './ui/Card';
import {
    Milestone,
    Flag,
    TrendingUp,
    Award,
    Calendar,
    History,
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface TimelineProps {
    user: User;
    ratingHistory: RatingChange[];
    submissions: Submission[];
}

export function Timeline({ user, ratingHistory, submissions }: TimelineProps) {
    const events = [
        {
            date: user.registrationTimeSeconds * 1000,
            title: 'Joined Codeforces',
            desc: 'The beginning of a competitive journey.',
            icon: Calendar,
            color: 'bg-blue-500',
        },
    ];

    const sortedRatingHistory = [...ratingHistory].sort(
        (a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds,
    );

    if (sortedRatingHistory.length > 0) {
        const firstContest = sortedRatingHistory[0];
        events.push({
            date: firstContest.ratingUpdateTimeSeconds * 1000,
            title: 'First Official Contest',
            desc: `Participated in ${firstContest.contestName}.`,
            icon: Flag,
            color: 'bg-emerald-500',
        });

        // Detect rank changes
        const rankThresholds = [
            { rating: 1200, name: 'Pupil' },
            { rating: 1400, name: 'Specialist' },
            { rating: 1600, name: 'Expert' },
            { rating: 1900, name: 'Candidate Master' },
            { rating: 2100, name: 'Master' },
            { rating: 2300, name: 'International Master' },
            { rating: 2400, name: 'Grandmaster' },
            { rating: 2600, name: 'International Grandmaster' },
            { rating: 3000, name: 'Legendary Grandmaster' },
        ];

        let currentThresholdIdx = -1;
        sortedRatingHistory.forEach((change) => {
            while (
                currentThresholdIdx + 1 < rankThresholds.length &&
                change.newRating >=
                    rankThresholds[currentThresholdIdx + 1].rating
            ) {
                currentThresholdIdx += 1;
                const threshold = rankThresholds[currentThresholdIdx];
                events.push({
                    date: change.ratingUpdateTimeSeconds * 1000,
                    title: `Promoted to ${threshold.name}`,
                    desc: `Reached ${change.newRating} rating in ${change.contestName}.`,
                    icon: Award,
                    color: 'bg-purple-500',
                });
            }
        });

        // Peak Rating
        const peak = sortedRatingHistory.reduce((prev, curr) =>
            prev.newRating > curr.newRating ? prev : curr,
        );
        events.push({
            date: peak.ratingUpdateTimeSeconds * 1000,
            title: 'Lifetime Peak Rating',
            desc: `Reached historical high of ${peak.newRating}.`,
            icon: TrendingUp,
            color: 'bg-orange-500',
        });

        // Best Rank
        const bestRank = sortedRatingHistory.reduce((prev, curr) => {
            if (prev.rank === 0) return curr;
            if (curr.rank === 0) return prev;
            return prev.rank < curr.rank ? prev : curr;
        });
        if (bestRank.rank > 0) {
            events.push({
                date: bestRank.ratingUpdateTimeSeconds * 1000,
                title: 'Best Global Rank',
                desc: `Ranked #${bestRank.rank} in ${bestRank.contestName}.`,
                icon: Milestone,
                color: 'bg-pink-500',
            });
        }
    }

    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => b.date - a.date);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                    <History size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-display font-bold text-text-app">
                        Life Path
                    </h3>
                    <p className="text-[10px] text-muted-app font-mono uppercase tracking-[0.2em] mt-1 opacity-50">
                        Major career milestones and achievements
                    </p>
                </div>
            </div>

            <div className="relative ml-2 md:ml-4 pl-6 md:pl-8 border-l border-white/10 space-y-8 md:space-y-12">
                {sortedEvents.map((event, idx) => (
                    <motion.div
                        key={`${event.title}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative"
                    >
                        {/* Legend dot */}
                        <div
                            className={`absolute -left-9.25 md:-left-12.25 top-0.5 w-6 h-6 md:w-8 md:h-8 rounded-full ${event.color} flex items-center justify-center border-2 md:border-4 border-bg-app shadow-xl`}
                        >
                            <event.icon
                                size={10}
                                className="text-white md:hidden"
                            />
                            <event.icon
                                size={12}
                                className="text-white hidden md:block"
                            />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-[9px] md:text-[10px] font-black text-muted-app uppercase tracking-widest block mb-1">
                                    {format(event.date, 'MMMM dd, yyyy')}
                                </span>
                                <h4 className="text-base md:text-lg font-display font-bold text-text-app leading-tight">
                                    {event.title}
                                </h4>
                                <p className="text-xs md:text-sm text-muted-app mt-1 leading-relaxed max-w-xl">
                                    {event.desc}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
