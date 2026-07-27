import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getRankColor = (rank: string) => {
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

export const getRankBg = (rank: string) => {
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
