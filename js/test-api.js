/**
 * Dev-only smoke test for the AI chat placeholder endpoint.
 * Run via: node won't work — open a page that includes this script with the server/Edge Function running.
 */
async function testAIChatEndpoint() {
    const endpoint = (typeof AIEndpoints !== 'undefined' && AIEndpoints.chat)
        ? AIEndpoints.chat
        : '/api/ai-chat';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'What are the early signs of breast cancer?',
                sessionId: typeof getSessionId === 'function' ? getSessionId() : 'test-session',
            }),
        });

        const data = await response.json();
        console.log('API Response:', data);

        if (response.ok) {
            const reply = typeof parseAIChatReply === 'function'
                ? parseAIChatReply(data)
                : (data.reply || data.text || '');
            console.log('API Test Successful!');
            console.log('Reply:', reply);
        } else {
            console.error('API Error:', data.error || data);
        }
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testAIChatEndpoint();
