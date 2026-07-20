import { Submission, User } from '../types';

export interface CoachProfileSummary {
    dominantTag: string;
    strengthSignal: string;
    weaknessSignal: string;
    nextStep: string;
    recentMomentum: string;
}

export function buildCoachProfileSummary(
    user: User,
    submissions: Submission[],
    analytics: any,
    ratingHistory: any[],
): CoachProfileSummary {
    const tagStats = new Map<
        string,
        { solved: number; failed: number; attempted: number }
    >();

    for (const submission of submissions.slice(-120)) {
        const tags = submission.problem?.tags ?? [];
        if (!tags.length) continue;

        for (const tag of tags) {
            const current = tagStats.get(tag) ?? {
                solved: 0,
                failed: 0,
                attempted: 0,
            };

            current.attempted += 1;
            if (submission.verdict === 'OK') {
                current.solved += 1;
            } else if (
                submission.verdict !== 'TESTING' &&
                submission.verdict !== 'PREPARING'
            ) {
                current.failed += 1;
            }

            tagStats.set(tag, current);
        }
    }

    const rankedTags = [...tagStats.entries()].sort((a, b) => {
        const solvedDiff = b[1].solved - a[1].solved;
        if (solvedDiff !== 0) return solvedDiff;
        return b[1].attempted - a[1].attempted;
    });

    const dominantTag =
        analytics?.bestTag ?? rankedTags[0]?.[0] ?? 'implementation';
    const weaknessTag =
        rankedTags
            .filter(([tag]) => tag !== dominantTag)
            .sort((a, b) => {
                const failedDiff = b[1].failed - a[1].failed;
                if (failedDiff !== 0) return failedDiff;
                return b[1].attempted - a[1].attempted;
            })[0]?.[0] ?? dominantTag;

    const rating = user.rating ?? 800;
    const accuracy = analytics?.accuracy ?? 0;
    const recentDeltas = ratingHistory
        .slice(-5)
        .map((entry: any) => entry.newRating - entry.oldRating)
        .join(', ');

    const strengthSignal = `You seem strongest in ${dominantTag}, and that is a solid foundation for growth.`;
    const weaknessSignal =
        weaknessTag && weaknessTag !== dominantTag
            ? `Your most likely improvement zone is ${weaknessTag}; it appears more often in tricky or failed attempts.`
            : 'Your profile suggests you are doing well overall, so the next step is to push into slightly harder problems.';
    const nextStep =
        weaknessTag && weaknessTag !== dominantTag
            ? `A strong next step is to spend your next session on ${weaknessTag} problems, then review mistakes and keep accuracy above ${Math.max(accuracy, 70)}%.`
            : `A strong next step is to push into harder ${dominantTag} problems around the ${Math.max(rating - 100, 800)}–${Math.min(rating + 200, 3500)} range.`;
    const recentMomentum = recentDeltas
        ? `Your recent rating deltas are ${recentDeltas}, so you are trending in a promising direction.`
        : 'Your recent trend is still developing, so steady reps will matter most.';

    return {
        dominantTag,
        strengthSignal,
        weaknessSignal,
        nextStep,
        recentMomentum,
    };
}
