export interface User {
    handle: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    city?: string;
    organization?: string;
    contribution: number;
    rank?: string;
    rating?: number;
    maxRank?: string;
    maxRating?: number;
    lastOnlineTimeSeconds: number;
    registrationTimeSeconds: number;
    friendOfCount: number;
    avatar: string;
    titlePhoto: string;
}

export interface RatingChange {
    contestId: number;
    contestName: string;
    handle: string;
    rank: number;
    ratingUpdateTimeSeconds: number;
    oldRating: number;
    newRating: number;
}

export interface Submission {
    id: number;
    contestId: number;
    creationTimeSeconds: number;
    relativeTimeSeconds: number;
    problem: Problem;
    author: Party;
    programmingLanguage: string;
    verdict: string;
    testset: string;
    passedTestCount: number;
    timeConsumedMillis: number;
    memoryConsumedBytes: number;
}

export interface Problem {
    contestId: number;
    index: string;
    name: string;
    type: string;
    points?: number;
    rating?: number;
    tags: string[];
}

export interface Contest {
    id: number;
    name: string;
    type: string;
    phase:
        | 'BEFORE'
        | 'CODING'
        | 'PENDING_SYSTEM_TEST'
        | 'SYSTEM_TEST'
        | 'FINISHED';
    frozen: boolean;
    durationSeconds: number;
    startTimeSeconds?: number;
    relativeTimeSeconds?: number;
}

export interface Party {
    contestId: number;
    members: { handle: string }[];
    participantType: string;
    ghost: boolean;
    startTimeSeconds?: number;
}

export interface AnalyticsSummary {
    totalSolved: number;
    maxRating: number;
    currentRating: number;
    rank: string;
    bestRank: number;
    avgDifficulty: number;
    mostSolvedTag: string;
    consistencyScore: number;
}
