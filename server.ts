import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import {
    extractAIText,
    getAIModel,
    getGeminiApiKeyError,
} from './src/lib/geminiConfig';

dotenv.config();

const geminiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

// Helper for robust JSON parsing
function safeParseJSON(text: string) {
    try {
        return JSON.parse(text.trim());
    } catch (e) {
        // Look for the first JSON-like block [ ... ] or { ... }
        const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (match) {
            try {
                return JSON.parse(match[0].trim());
            } catch (err) {
                console.error('Failed to parse extracted JSON block:', err);
            }
        }
        throw e;
    }
}

async function startServer() {
    const app = express();
    const configuredPort = Number(process.env.PORT);
    const PORT =
        Number.isInteger(configuredPort) && configuredPort > 0
            ? configuredPort
            : 3000;

    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // API Route for Codeforces Proxy
    const cfCache = new Map<
        string,
        { data: any; timestamp: number; ttl: number }
    >();
    let lastCfRequestTime = 0;
    const MIN_CF_INTERVAL = 250; // 250ms between requests to Codeforces

    app.get('/api/codeforces/:method', async (req, res) => {
        const { method } = req.params;
        const cacheKey = `${method}:${JSON.stringify(req.query)}`;

        // Determine TTL based on method
        let ttl = 1000 * 60 * 2; // Default 2 minutes
        if (method === 'problemset.problems') ttl = 1000 * 60 * 60 * 6; // 6 hours
        if (method === 'contest.list') ttl = 1000 * 60 * 30; // 30 minutes
        if (method === 'user.info') ttl = 1000 * 60 * 10; // 10 minutes

        // Check cache
        const cached = cfCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return res.json(cached.data);
        }

        // Rate limiting / Sequencing
        const now = Date.now();
        const waitTime = Math.max(0, lastCfRequestTime + MIN_CF_INTERVAL - now);
        lastCfRequestTime = now + waitTime;

        if (waitTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        try {
            const response = await axios.get(
                `https://codeforces.com/api/${method}`,
                {
                    params: req.query,
                    timeout: 60000,
                },
            );

            // Store in cache if successful
            if (response.data.status === 'OK') {
                cfCache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now(),
                    ttl,
                });
            }

            res.json(response.data);
        } catch (error: any) {
            if (error.response?.status === 429) {
                console.log(`Codeforces 429 Limited - ${method}`);
                // If we have stale cache, serve it during 429
                if (cached) {
                    return res.json(cached.data);
                }
                return res.status(429).json({
                    status: 'FAILED',
                    comment:
                        'Codeforces is currently limiting requests. Please wait a few seconds and refresh.',
                });
            }

            if (error.response?.status && error.response.status < 500) {
                console.log(
                    `Codeforces API client status info (${method}, Status ${error.response.status}):`,
                    error.message,
                );
            } else {
                console.log(
                    `Codeforces API status info (${method}):`,
                    error.message,
                );
            }

            // Handle Gateway Timeout specifically with a more helpful message
            if (
                error.code === 'ECONNABORTED' ||
                error.response?.status === 504
            ) {
                return res.status(504).json({
                    status: 'FAILED',
                    comment:
                        'Codeforces API is currently slow or overloaded. Please try again in a moment.',
                });
            }

            res.status(error.response?.status || 500).json({
                status: 'FAILED',
                comment: error.response?.data?.comment || error.message,
            });
        }
    });

    // API route for AI coaching
    const aiCache = new Map<string, { data: any; timestamp: number }>();
    const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

    app.post('/api/ai/generate', async (req, res) => {
        const keyError = getGeminiApiKeyError(geminiKey);
        if (keyError) {
            return res.status(500).json({
                error: keyError,
            });
        }

        const body = req.body ?? {};
        const prompt = typeof body.prompt === 'string' ? body.prompt : '';
        const raw = body.raw === true;

        if (typeof prompt !== 'string' || !prompt.trim()) {
            return res
                .status(400)
                .json({ error: 'A non-empty prompt is required.' });
        }
        if (prompt.length > 30_000) {
            return res.status(413).json({ error: 'Prompt is too long.' });
        }

        const model = getAIModel(geminiKey);

        // For raw (chat) mode, skip cache to keep conversation fresh
        const cacheKey = `${model}:${raw}:${prompt}`;
        if (!raw) {
            const cached = aiCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                return res.json(cached.data);
            }
        }

        try {
            let text = '';

            if (geminiKey?.startsWith('sk-or-')) {
                const response = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.8,
                        max_tokens: 1800,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${geminiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://cf-visualizer.netlify.app',
                            'X-Title': 'CF Visualizer',
                        },
                        timeout: 120000,
                    },
                );
                text = extractAIText(
                    response.data?.choices?.[0]?.message?.content ?? '',
                );
            } else {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey: geminiKey });
                const response = await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config: { maxOutputTokens: 1800 },
                });
                text = response.text ?? '';
            }

            if (!text) throw new Error('Empty response from AI');

            if (raw) {
                return res.json({ text: text.trim() });
            } else {
                try {
                    const data = safeParseJSON(text);
                    aiCache.set(cacheKey, { data, timestamp: Date.now() });
                    res.json(data);
                } catch (parseError: any) {
                    console.error(
                        'AI JSON Parse Error:',
                        parseError.message,
                        'Raw text:',
                        text,
                    );
                    res.status(500).json({
                        error: 'Failed to parse AI response as JSON',
                        details: parseError.message,
                        raw: text,
                    });
                }
            }
        } catch (error: any) {
            if (error.response?.status === 429 || error.status === 429) {
                return res.status(429).json({
                    error: 'AI Quota Exceeded',
                    message:
                        'The AI coach is currently resting. Heuristic analysis is being used as a fallback.',
                    retryAfter: 60,
                });
            }

            console.error(
                'Gemini API unusual error:',
                error.response?.data || error.message,
            );
            res.status(500).json({
                error:
                    error.message ||
                    'An unexpected error occurred during AI analysis.',
            });
        }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
}

startServer();
