class GeminiAPI {
    constructor() {
        this.API_KEY = 'AIzaSyD1fC-BtfOfO1AnBAnJp8lxUqbAP8HU7YE';
        this.API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent';
        this.cache = new Map();
    }

    async generateResponse(userMessage) {
        try {
            // Check cache first
            const cachedResponse = this.cache.get(userMessage);
            if (cachedResponse) {
                return cachedResponse;
            }

            // Prepare the request
            const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: this.createPrompt(userMessage)
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            // Parse the response
            const data = await response.json();
            
            // Log for debugging
            console.log('API Response:', data);

            // Check for API errors
            if (!response.ok) {
                const errorMessage = data.error?.message || 'Unknown API error';
                console.error('API Error:', data.error);
                throw new Error(errorMessage);
            }

            // Validate response structure
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                console.error('Invalid Response Structure:', data);
                throw new Error('Invalid response format from API');
            }

            // Get the response text
            const responseText = data.candidates[0].content.parts[0].text;

            // Cache the response
            this.cache.set(userMessage, responseText);

            return responseText;

        } catch (error) {
            console.error('Gemini API Error:', error);
            
            // Check for specific error types
            if (error.message.includes('quota')) {
                throw new Error('API quota exceeded. Please try again later.');
            } else if (error.message.includes('invalid')) {
                throw new Error('Invalid request. Please try rephrasing your question.');
            } else if (error.message.includes('blocked')) {
                throw new Error('This content cannot be processed. Please try a different question.');
            }
            
            throw error;
        }
    }

    createPrompt(userMessage) {
        return `You are a medical assistant specializing in breast cancer information and support.
        Respond to this question about breast cancer: "${userMessage}"

        Format your response with:
        - Clear bullet points or numbered lists
        - Important information in *bold* using asterisks
        - Medical terms explained in simple language
        - Actionable advice when appropriate

        Keep the response:
        - Accurate and evidence-based
        - Easy to understand
        - Empathetic and supportive
        - Structured and well-organized

        Include:
        - Relevant medical information
        - When to seek professional help
        - Additional resources if applicable
        - Important disclaimers when needed`;
    }

    clearCache() {
        this.cache.clear();
    }
} 