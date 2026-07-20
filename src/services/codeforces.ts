import axios from 'axios';
import { User, RatingChange, Submission, Problem, Contest } from '../types';

const BASE_URL = '/api/codeforces';

export class CodeforcesService {
    private static cache = new Map<string, { data: any; expiry: number }>();
    private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    private static async fetch<T>(url: string, retries = 2): Promise<T> {
        const cached = this.cache.get(url);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }

        try {
            const response = await axios.get(url, { timeout: 65000 }); // Slightly longer than backend
            if (response.data.status !== 'OK') {
                throw new Error(
                    response.data.comment || 'Codeforces API Error',
                );
            }

            const data = response.data.result;
            this.cache.set(url, {
                data,
                expiry: Date.now() + this.CACHE_DURATION,
            });
            return data;
        } catch (error: any) {
            if (error.response?.status === 429 && retries > 0) {
                const delay = (3 - retries) * 1500; // 1.5s, 3s delay
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.fetch(url, retries - 1);
            }
            if (error.response?.status && error.response.status < 500) {
                console.warn(
                    `Error fetching ${url} (Status ${error.response.status}):`,
                    error.message,
                );
            } else {
                console.error(`Error fetching ${url}:`, error.message);
            }
            throw error;
        }
    }

    static async getUserInfo(handle: string): Promise<User> {
        const users = await this.fetch<User[]>(
            `${BASE_URL}/user.info?handles=${handle}`,
        );
        return users[0];
    }

    static async getUserRating(handle: string): Promise<RatingChange[]> {
        return this.fetch<RatingChange[]>(
            `${BASE_URL}/user.rating?handle=${handle}`,
        );
    }

    static async getUserStatus(handle: string): Promise<Submission[]> {
        return this.fetch<Submission[]>(
            `${BASE_URL}/user.status?handle=${handle}`,
        );
    }

    static async getProblemSet(): Promise<Problem[]> {
        const data = await this.fetch<{ problems: Problem[] }>(
            `${BASE_URL}/problemset.problems`,
        );
        return data.problems;
    }

    static async getTopUsers(
        count: number = 200,
        country?: string,
    ): Promise<User[]> {
        const url = country
            ? `${BASE_URL}/user.ratedList?activeOnly=true&max=${count}&country=${country}`
            : `${BASE_URL}/user.ratedList?activeOnly=true&max=${count}`;
        return this.fetch<User[]>(url);
    }

    static async getContestStandings(
        contestId: number,
        from: number = 1,
        count: number = 100,
    ): Promise<{ contest: Contest; rows: any[] }> {
        return this.fetch<{ contest: Contest; rows: any[] }>(
            `${BASE_URL}/contest.standings?contestId=${contestId}&from=${from}&count=${count}`,
        );
    }

    static async getContests(gym = false): Promise<Contest[]> {
        return this.fetch<Contest[]>(`${BASE_URL}/contest.list?gym=${gym}`);
    }

    static async getUserBlogEntries(handle: string): Promise<any[]> {
        return this.fetch<any[]>(
            `${BASE_URL}/user.blogEntries?handle=${handle}`,
        );
    }

    static getRankColor(rank: string | undefined): string {
        if (!rank) return '#94a3b8';
        rank = rank.toLowerCase();
        if (rank.includes('legendary')) return '#ff0000';
        if (rank.includes('international grandmaster')) return '#ff0000';
        if (rank.includes('grandmaster')) return '#ff0000';
        if (rank.includes('international master')) return '#ff8c00';
        if (rank.includes('master')) return '#ff8c00';
        if (rank.includes('candidate master')) return '#aa00aa';
        if (rank.includes('expert')) return '#0000ff';
        if (rank.includes('specialist')) return '#03a89e';
        if (rank.includes('pupil')) return '#008000';
        return '#808080'; // newbie
    }
}
