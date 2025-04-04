// Gemini API Configuration
const GEMINI_API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Chat UI Elements
const chatSupport = document.querySelector('.chat-support');
const chatMessages = document.querySelector('.chat-messages');
const messageInput = document.querySelector('.chat-input input');
const sendButton = document.querySelector('.chat-input button');

// Initialize chat
let conversationHistory = [];

// Function to add a message to the chat
function addMessage(message, isUser = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
    
    const textElement = document.createElement('p');
    textElement.textContent = message;
    
    messageElement.appendChild(textElement);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to generate response using Gemini API
async function generateResponse(userInput) {
    try {
        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: userInput
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response from API');
        }
    } catch (error) {
        console.error('Error generating response:', error);
        return 'I apologize, but I encountered an error. Please try again later.';
    }
}

// Function to handle user input
async function handleUserInput(userInput) {
    if (!userInput.trim()) return;

    // Add user message to chat
    addMessage(userInput, true);

    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('typing-indicator');
    typingIndicator.textContent = 'Typing...';
    chatMessages.appendChild(typingIndicator);

    // Generate and add bot response
    const response = await generateResponse(userInput);
    chatMessages.removeChild(typingIndicator);
    addMessage(response, false);

    // Store in conversation history
    conversationHistory.push(
        { role: 'user', content: userInput },
        { role: 'assistant', content: response }
    );
}

// Event Listeners
sendButton.addEventListener('click', () => {
    const userInput = messageInput.value;
    messageInput.value = '';
    handleUserInput(userInput);
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const userInput = messageInput.value;
        messageInput.value = '';
        handleUserInput(userInput);
    }
});

// Add initial greeting
document.addEventListener('DOMContentLoaded', () => {
    addMessage('Hello! I\'m your breast cancer support assistant. How can I help you today?', false);
});

// CSS for chat interface
const style = document.createElement('style');
style.textContent = `
    .chat-support {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 5px 25px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 1000;
    }

    .chat-header {
        background: linear-gradient(45deg, #ff69b4, #ff8dc7);
        color: white;
        padding: 15px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .chat-messages {
        flex-grow: 1;
        padding: 15px;
        overflow-y: auto;
    }

    .message {
        margin-bottom: 10px;
        max-width: 80%;
        padding: 10px;
        border-radius: 10px;
    }

    .user-message {
        background: #f0f0f0;
        margin-left: auto;
    }

    .bot-message {
        background: #ffe6f2;
    }

    .chat-input {
        padding: 15px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 10px;
    }

    .chat-input input {
        flex-grow: 1;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 20px;
        outline: none;
    }

    .chat-input button {
        background: linear-gradient(45deg, #ff69b4, #ff8dc7);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 20px;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .chat-input button:hover {
        transform: scale(1.05);
    }

    .typing-indicator {
        color: #666;
        font-style: italic;
        padding: 5px 10px;
    }
`;

document.head.appendChild(style); 