// Chat and Notification System
class ChatSystem {
    constructor() {
        this.chatContainer = null;
        this.messageDisplay = null;
        this.inputField = null;
        this.sendButton = null;
        this.isProcessing = false;
    }

    initialize() {
        // Create chat toggle button
        const chatToggle = document.createElement('button');
        chatToggle.className = 'chat-toggle';
        chatToggle.innerHTML = '<i class="fas fa-comments"></i>';
        document.body.appendChild(chatToggle);

        // Create chat interface
        this.createChatInterface();
        
        // Initially hide chat container
        this.chatContainer.style.display = 'none';

        // Setup toggle functionality
        chatToggle.addEventListener('click', () => {
            if (this.chatContainer.style.display === 'none') {
                this.chatContainer.style.display = 'flex';
                chatToggle.style.display = 'none';
                // Add welcome message when opened
                if (this.messageDisplay.children.length === 0) {
                    this.addMessage('bot', `Hello! I'm here to help answer your questions about breast cancer. 
                        You can ask me about:
                        • Early signs and symptoms
                        • Screening and diagnosis
                        • Treatment options
                        • Support resources
                        • Prevention tips
                        
                        How can I assist you today?`);
                }
            }
        });

        // Setup other event listeners
        this.setupEventListeners();
    }

    createChatInterface() {
        // Create main chat container
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'chat-container';
        document.body.appendChild(this.chatContainer);

        // Create chat header
        const header = document.createElement('div');
        header.className = 'chat-header';
        header.innerHTML = `
            <h3>Breast Cancer Support Chat</h3>
            <button class="close-chat">×</button>
        `;
        this.chatContainer.appendChild(header);

        // Create message display area
        this.messageDisplay = document.createElement('div');
        this.messageDisplay.className = 'message-display';
        this.chatContainer.appendChild(this.messageDisplay);

        // Create input area
        const inputArea = document.createElement('div');
        inputArea.className = 'input-area';
        
        this.inputField = document.createElement('textarea');
        this.inputField.placeholder = 'Type your question here...';
        this.inputField.rows = 1;
        
        this.sendButton = document.createElement('button');
        this.sendButton.className = 'send-btn';
        this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        
        inputArea.appendChild(this.inputField);
        inputArea.appendChild(this.sendButton);
        this.chatContainer.appendChild(inputArea);
    }

    setupEventListeners() {
        // Close chat
        const closeBtn = this.chatContainer.querySelector('.close-chat');
        closeBtn.addEventListener('click', () => {
            this.chatContainer.style.display = 'none';
            document.querySelector('.chat-toggle').style.display = 'flex';
        });

        // Send message on button click
        this.sendButton.addEventListener('click', () => this.handleSendMessage());

        // Send message on Enter (but allow Shift+Enter for new lines)
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Auto-resize input field
        this.inputField.addEventListener('input', () => {
            this.inputField.style.height = 'auto';
            this.inputField.style.height = (this.inputField.scrollHeight) + 'px';
        });
    }

    handleSendMessage() {
        const message = this.inputField.value.trim();
        if (!message || this.isProcessing) return;

        try {
            // Display user message
            this.addMessage('user', message);
            this.inputField.value = '';
            this.inputField.style.height = 'auto';

            // Show typing indicator
            this.showTypingIndicator();

            // Simulate response delay
            setTimeout(() => {
                this.hideTypingIndicator();
                const response = this.getResponse(message);
                this.addMessage('bot', response);
            }, 1000);

        } catch (error) {
            console.error('Chat Error:', error);
            this.addMessage('error', 'I apologize, but I encountered an error. Please try again.');
        }
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = content;
        this.messageDisplay.appendChild(messageDiv);
        this.messageDisplay.scrollTop = this.messageDisplay.scrollHeight;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        this.messageDisplay.appendChild(typingDiv);
        this.messageDisplay.scrollTop = this.messageDisplay.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = this.messageDisplay.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    getResponse(message) {
        // Simple response logic
        const responses = {
            'hello': 'Hello! How can I help you today?',
            'hi': 'Hi! How can I assist you?',
            'symptoms': 'Common breast cancer symptoms include: lumps, changes in breast size/shape, nipple discharge, and skin changes.',
            'treatment': 'Breast cancer treatments may include surgery, chemotherapy, radiation therapy, and hormone therapy.',
            'prevention': 'Prevention tips: maintain a healthy weight, exercise regularly, limit alcohol, and get regular screenings.',
            'screening': 'Regular mammograms are recommended for women over 40. Consult your doctor about your screening schedule.',
            'support': 'We offer various support resources including support groups, counseling, and educational materials.'
        };

        const lowercaseMessage = message.toLowerCase();
        for (const [key, value] of Object.entries(responses)) {
            if (lowercaseMessage.includes(key)) {
                return value;
            }
        }

        return 'I understand you have a question about breast cancer. Please be more specific about what you would like to know, or ask about symptoms, treatment, prevention, or support resources.';
    }
}

// Initialize chat system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const chat = new ChatSystem();
    chat.initialize();
}); 