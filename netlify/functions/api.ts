import axios from 'axios';
import {
    extractAIText,
    getAIModel,
    getGeminiApiKeyError,
} from '../../src/lib/geminiConfig';

const CODEFORCES_METHODS = new Set([
    'user.info',
    'user.rating',
    'user.status',
    'problemset.problems',
    'user.ratedList',
    'contest.standings',
    'contest.list',
    'user.blogEntries',
]);

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
}

function safeParseJSON(text: string) {
    try {
        return JSON.parse(text.trim());
    } catch {
        const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (!match) throw new Error('AI response did not contain JSON.');
        return JSON.parse(match[0]);
    }
}

export default async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/.netlify\/functions\/api/, '');

    if (request.method === 'GET' && path.startsWith('/codeforces/')) {
        const method = path.slice('/codeforces/'.length);
        if (!CODEFORCES_METHODS.has(method)) {
            return json(
                {
                    status: 'FAILED',
                    comment: 'Unsupported Codeforces API method.',
                },
                404,
            );
        }

        try {
            const response = await axios.get(
                `https://codeforces.com/api/${method}`,
                {
                    params: Object.fromEntries(url.searchParams),
                    timeout: 60_000,
                },
            );
            return json(response.data);
        } catch (error: any) {
            const status =
                error.response?.status === 504
                    ? 504
                    : error.response?.status || 502;
            return json(
                {
                    status: 'FAILED',
                    comment:
                        error.response?.data?.comment ||
                        error.message ||
                        'Codeforces API request failed.',
                },
                status,
            );
        }
    }

    if (request.method === 'POST' && path === '/ai/generate') {
        const apiKey =
            process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
        const keyError = getGeminiApiKeyError(apiKey);
        if (keyError) return json({ error: keyError }, 500);

        let body: { prompt?: unknown; raw?: unknown };
        try {
            body = await request.json();
        } catch {
            return json({ error: 'Request body must be valid JSON.' }, 400);
        }

        if (typeof body.prompt !== 'string' || !body.prompt.trim()) {
            return json({ error: 'A non-empty prompt is required.' }, 400);
        }
        if (body.prompt.length > 30_000)
            return json({ error: 'Prompt is too long.' }, 413);

        try {
            let text = '';

            if (typeof apiKey === 'string' && apiKey.startsWith('sk-or-')) {
                const response = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model: getAIModel(apiKey),
                        messages: [{ role: 'user', content: body.prompt }],
                        temperature: 0.8,
                        max_tokens: 1800,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
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
                const ai = new GoogleGenAI({ apiKey });
                const response = await ai.models.generateContent({
                    model: getAIModel(apiKey),
                    contents: body.prompt,
                    config: { maxOutputTokens: 1800 },
                });
                text = response.text ?? '';
            }

            if (!text) throw new Error('Empty response from AI.');
            return body.raw
                ? json({ text: text.trim() })
                : json(safeParseJSON(text));
        } catch (error: any) {
            const status = error.response?.status === 429 ? 429 : 500;
            return json(
                {
                    error:
                        status === 429
                            ? 'AI quota exceeded.'
                            : 'AI request failed.',
                    message:
                        error.response?.data?.error?.message || error.message,
                },
                status,
            );
        }
    }

    return json({ error: 'Not found.' }, 404);
}
