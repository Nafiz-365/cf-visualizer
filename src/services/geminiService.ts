export interface AIInsight {
    title: string;
    desc: string;
    type: 'tactical' | 'growth' | 'flow';
}

export class GeminiService {
    private static getCached(key: string): any {
        try {
            const cached = localStorage.getItem(`gemini_cache_${key}`);
            if (cached) {
                const { data, expiry } = JSON.parse(cached);
                if (expiry > Date.now()) return data;
            }
        } catch (e) {
            console.error('Cache read error:', e);
        }
        return null;
    }

    private static setCache(key: string, data: any): void {
        try {
            const expiry = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
            localStorage.setItem(
                `gemini_cache_${key}`,
                JSON.stringify({ data, expiry }),
            );
        } catch (e) {
            console.error('Cache write error:', e);
        }
    }

    static async analyzeProfile(
        userData: any,
        ratingHistory: any[],
        analytics: any,
    ): Promise<AIInsight[]> {
        const cacheKey = `analysis_${userData.handle}_${analytics.totalSolved}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;
        const prompt = `
      You are an expert competitive programming coach for Codeforces.
      Analyze this user profile and provide 3 highly specific, professional insights.
      
      User Data:
      - Handle: ${userData.handle}
      - Rating: ${userData.rating} (Max: ${userData.maxRating})
      - Rank: ${userData.rank}
      
      Analytics:
      - Total Solved: ${analytics.totalSolved}
      - Accuracy: ${analytics.accuracy}%
      - Average Problem Difficulty: ${analytics.avgDifficulty}
      - Strongest Tag: ${analytics.bestTag}
      - Peak Activity Hour: ${analytics.peakHour}
      
      Rating History Count: ${ratingHistory.length}
      Latest 3 deltas: ${ratingHistory
          .slice(-3)
          .map((r: any) => r.newRating - r.oldRating)
          .join(', ')}

      Return a JSON array of exactly 3 objects with properties:
      - "title": A punchy 2-3 word title.
      - "desc": A detailed 1-2 sentence coaching advice.
      - "type": One of ["tactical", "growth", "flow"].
      
      Output ONLY the JSON array.
    `;

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('QUOTA_EXCEEDED');
                }
                throw new Error(`Server returned ${response.status}`);
            }

            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error: any) {
            if (error.message !== 'QUOTA_EXCEEDED') {
                console.error('Gemini Analysis Error:', error);
            }
            return [
                {
                    title: 'Strategic Edge',
                    desc: `Expertise in ${analytics.bestTag} is your primary competitive edge. Focus on maintaining high accuracy in this domain while gradually exploring adjacent topics.`,
                    type: 'tactical',
                },
                {
                    title: 'Growth Window',
                    desc: `With a current rating of ${userData.rating}, focus on problems in the ${Math.min(userData.rating + 200, 3500)} range to trigger significant improvement.`,
                    type: 'growth',
                },
                {
                    title: 'Peak Ritual',
                    desc: `Your productivity peaks around ${analytics.peakHour}. Schedule your most demanding training sessions or contest participations within this window.`,
                    type: 'flow',
                },
            ];
        }
    }

    static async customPrompt(prompt: string): Promise<any[]> {
        const cacheKey = `custom_${btoa(encodeURIComponent(prompt)).slice(0, 32)}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('QUOTA_EXCEEDED');
                }
                throw new Error(`Server returned ${response.status}`);
            }

            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error: any) {
            if (error.message === 'QUOTA_EXCEEDED') {
                throw new Error('QUOTA_EXCEEDED');
            }
            console.error('Gemini Custom Prompt Error:', error);
            return [];
        }
    }
}
