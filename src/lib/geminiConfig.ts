export type AIProvider = 'gemini' | 'openrouter' | 'none';

export function getAIProvider(apiKey?: string): AIProvider {
    const normalized = apiKey?.trim();

    if (!normalized) return 'none';
    if (normalized.startsWith('sk-or-')) return 'openrouter';
    if (normalized.startsWith('AIza')) return 'gemini';
    return 'none';
}

export function getGeminiApiKeyError(apiKey?: string): string | null {
    const normalized = apiKey?.trim();

    if (!normalized) {
        return 'AI API key is not configured.';
    }

    if (getAIProvider(normalized) === 'none') {
        return 'Use a Google AI Studio key starting with "AIza" or an OpenRouter key starting with "sk-or-".';
    }

    return null;
}

export function getAIModel(apiKey?: string): string {
    return getAIProvider(apiKey) === 'openrouter'
        ? 'openai/gpt-4o-mini'
        : 'gemini-2.5-flash';
}

export function extractAIText(content: unknown): string {
    if (typeof content === 'string') return content.trim();

    if (Array.isArray(content)) {
        return content
            .map((part) => extractAIText(part))
            .filter(Boolean)
            .join('\n')
            .trim();
    }

    if (content && typeof content === 'object') {
        const record = content as Record<string, unknown>;

        if (typeof record.text === 'string') return record.text.trim();
        if (typeof record.content === 'string') return record.content.trim();
        if (typeof record.message === 'string') return record.message.trim();

        if (Array.isArray(record.content)) {
            return extractAIText(record.content);
        }

        if (record.parts && Array.isArray(record.parts)) {
            return extractAIText(record.parts);
        }

        if (record.message && typeof record.message === 'object') {
            return extractAIText(record.message);
        }

        if (record.choices && Array.isArray(record.choices)) {
            const firstChoice = record.choices[0] as
                | Record<string, unknown>
                | undefined;
            if (
                firstChoice?.message &&
                typeof firstChoice.message === 'object'
            ) {
                return extractAIText(firstChoice.message);
            }
            if (typeof firstChoice?.text === 'string')
                return firstChoice.text.trim();
        }
    }

    return '';
}
