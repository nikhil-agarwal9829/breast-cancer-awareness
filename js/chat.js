// Chat functionality for medical support
document.addEventListener('DOMContentLoaded', function() {
  const chatToggle = document.getElementById('chat-toggle');
  const chatContainer = document.getElementById('chat-container');
  const closeChat = document.getElementById('close-chat');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const messageDisplay = document.getElementById('message-display');

  // Check if elements exist
  if (!chatToggle || !chatContainer || !closeChat || !messageInput || !sendBtn || !messageDisplay) {
    console.log('Chat elements not found, skipping chat initialization');
    return;
  }

  // Initialize Gemini API
  const geminiAPI = new GeminiAPI();

  // Toggle chat visibility
  chatToggle.addEventListener('click', function() {
    chatContainer.classList.add('show');
    chatToggle.style.display = 'none';
    
    // Add welcome message if chat is empty
    if (messageDisplay.children.length === 0) {
      addMessage("Hello! I'm your AI health assistant specializing in breast cancer awareness and support. How can I help you today?", false);
    }
  });

  closeChat.addEventListener('click', function() {
    chatContainer.classList.remove('show');
    chatToggle.style.display = 'block';
  });

  // Send message function
  async function sendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Clear input
    messageInput.value = '';

    // Add user message
    addMessage(userMessage, true);

    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.textContent = 'Typing...';
    messageDisplay.appendChild(typingIndicator);
    messageDisplay.scrollTop = messageDisplay.scrollHeight;

    try {
      // Get AI response
      const response = await geminiAPI.generateResponse(userMessage);
      
      // Remove typing indicator
      messageDisplay.removeChild(typingIndicator);
      
      // Add bot response
      addMessage(response, false);
    } catch (error) {
      console.error('Chat error:', error);
      messageDisplay.removeChild(typingIndicator);
      addMessage("I apologize, but I encountered an error. Please try again later or contact our support team.", false);
    }
  }

  // Add message to display
  function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = text;
    messageDisplay.appendChild(messageDiv);
    messageDisplay.scrollTop = messageDisplay.scrollHeight;
  }

  // Event listeners
  sendBtn.addEventListener('click', sendMessage);
  
  messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });
});




