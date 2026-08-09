// Chat functionality for medical support
document.addEventListener('DOMContentLoaded', function() {
  let chatToggle = document.getElementById('chat-toggle');
  let chatContainer = document.getElementById('chat-container');
  let closeChat = document.getElementById('close-chat');
  let messageInput = document.getElementById('message-input');
  let sendBtn = document.getElementById('send-btn');
  let messageDisplay = document.getElementById('message-display');
  const tips = [
    'Tip: bring previous mammogram reports when booking a consultation.',
    'Reminder: new lumps, skin changes, or nipple discharge should be checked by a clinician.',
    'Tip: use the risk and report sections first so the assistant can answer with better context.',
    'Reminder: this assistant supports you, but final medical decisions should come from a qualified doctor.'
  ];

  // Check if elements exist, inject if missing
  if (!chatToggle) {
    const chatHtml = `
      <button id="chat-toggle" class="chat-toggle hvr-buzz-out"><i class="fas fa-comments"></i></button>
      <div id="chat-container" class="chat-container">
          <div class="chat-header">
              <h3>AI Health Assistant</h3>
              <button id="close-chat" class="close-chat">&times;</button>
          </div>
          <div id="message-display" class="message-display"></div>
          <div class="input-area">
              <textarea id="message-input" placeholder="Ask a question..."></textarea>
              <button id="send-btn" class="send-btn"><i class="fas fa-paper-plane"></i></button>
          </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHtml);
    
    // Re-assign variables
    chatToggle = document.getElementById('chat-toggle');
    chatContainer = document.getElementById('chat-container');
    closeChat = document.getElementById('close-chat');
    messageInput = document.getElementById('message-input');
    sendBtn = document.getElementById('send-btn');
    messageDisplay = document.getElementById('message-display');
  }

  createTipBubble();

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

  // Conversation history — only last 3 messages sent to the Edge Function
  const chatHistory = [];

  // Send message function
  async function sendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Clear input
    messageInput.value = '';

    // Add user message to display and history
    addMessage(userMessage, true);
    chatHistory.push({ role: 'user', content: userMessage });

    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.textContent = 'Typing...';
    messageDisplay.appendChild(typingIndicator);
    messageDisplay.scrollTop = messageDisplay.scrollHeight;

    try {
      const endpoint = (typeof AIEndpoints !== 'undefined' && AIEndpoints.chat)
        ? AIEndpoints.chat
        : '/api/ai-chat';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: typeof getSessionId === 'function' ? getSessionId() : 'anonymous',
          history: chatHistory.slice(-3)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Chat AI error');
      }
      const response = (typeof parseAIChatReply === 'function' ? parseAIChatReply(data) : (data.reply || data.text))
        || 'Sorry, I could not generate a response right now.';
      
      // Remove typing indicator
      messageDisplay.removeChild(typingIndicator);
      
      // Add bot response to display and history
      addMessage(response, false);
      chatHistory.push({ role: 'assistant', content: response });
    } catch (error) {
      console.error('Chat error:', error);
      messageDisplay.removeChild(typingIndicator);
      addMessage("I couldn't reach the AI service just now. You can still use the risk form, report summary, and doctor finder while I retry later.", false);
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

  function createTipBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'chat-tip-bubble';
    bubble.innerHTML = `
      <button class="chat-tip-close" type="button">&times;</button>
      <div class="chat-tip-label">Quick tip</div>
      <div class="chat-tip-text">${tips[0]}</div>
    `;
    document.body.appendChild(bubble);
    const closeBtn = bubble.querySelector('.chat-tip-close');

    let tipIndex = 0;
    setInterval(() => {
      if (bubble.dataset.dismissed === 'true') return;
      tipIndex = (tipIndex + 1) % tips.length;
      const textEl = bubble.querySelector('.chat-tip-text');
      if (textEl) textEl.textContent = tips[tipIndex];
      bubble.classList.remove('show');
      void bubble.offsetWidth;
      bubble.classList.add('show');
    }, 12000);

    bubble.addEventListener('click', () => {
      chatContainer.classList.add('show');
      chatToggle.style.display = 'none';
    });

    closeBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      bubble.dataset.dismissed = 'true';
      bubble.classList.remove('show');
    });

    setTimeout(() => bubble.classList.add('show'), 1500);
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

