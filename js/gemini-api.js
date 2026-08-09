class GeminiAPI {
    constructor() {
        this.cache = new Map();
    }

    async generateResponse(userMessage) {
        try {
            const cachedResponse = this.cache.get(userMessage);
            if (cachedResponse) {
                return cachedResponse;
            }

            const endpoint = (typeof AIEndpoints !== 'undefined' && AIEndpoints.chat)
                ? AIEndpoints.chat
                : '/api/ai-chat';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    sessionId: typeof getSessionId === 'function' ? getSessionId() : 'anonymous',
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error?.message || data.error || 'Unknown API error';
                throw new Error(errorMessage);
            }

            const responseText = typeof parseAIChatReply === 'function'
                ? parseAIChatReply(data)
                : (data.reply || data.text || '');

            if (!responseText) {
                throw new Error('Invalid response format from API');
            }

            this.cache.set(userMessage, responseText);

            return responseText;

        } catch (error) {
            console.error('AI chat error:', error);

            if (error.message.includes('quota') || error.message.includes('429')) {
                throw new Error('API quota exceeded. Please try again later.');
            } else if (error.message.includes('invalid')) {
                throw new Error('Invalid request. Please try rephrasing your question.');
            } else if (error.message.includes('blocked')) {
                throw new Error('This content cannot be processed. Please try a different question.');
            }

            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}
