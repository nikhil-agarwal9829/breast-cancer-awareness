async function testGeminiAPI() {
    const API_KEY = 'AIzaSyD1fC-BtfOfO1AnBAnJp8lxUqbAP8HU7YE';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent';

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "What are the early signs of breast cancer?"
                    }]
                }]
            })
        });

        const data = await response.json();
        console.log('API Response:', data);
        
        if (response.ok) {
            console.log('API Test Successful!');
            console.log('Response:', data.candidates[0].content.parts[0].text);
        } else {
            console.error('API Error:', data.error);
        }
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

// Run the test
testGeminiAPI(); 