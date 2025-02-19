(async () => {
  const chatMessages = document.getElementById('chat-messages');
  const userMessageInput = document.getElementById('user-message');
  const sendMessageButton = document.getElementById('send-message');
  const loadingSpinner = document.getElementById('loading-spinner');
  let conversation = [
    { role: 'system', content: 'You are a helpful assistant who provides detailed answers.' }
  ];

  function renderMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const formattedMessage = message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; max-height: 300px;">')
      .replace(/\n/g, '<br>')
      .replace(/\[LEFT\](.*?)\[\/LEFT\]/g, '<div style="text-align: left;">$1</div>')
      .replace(/\[CENTER\](.*?)\[\/CENTER\]/g, '<div style="text-align: center;">$1</div>')
      .replace(/\[RIGHT\](.*?)\[\/RIGHT\]/g, '<div style="text-align: right;">$1</div>');

    messageDiv.innerHTML = formattedMessage;
    chatMessages.appendChild(messageDiv);
  }

  function renderMessages() {
    chatMessages.innerHTML = '';
    conversation.forEach((msg, index) => {
      if (msg.role === 'assistant' && index !== 0) {
        renderMessage(msg.content, 'ai');
      } else if (msg.role === 'user') {
        renderMessage(msg.content, 'user');
      }
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function handleNewMessage() {
    const userText = userMessageInput.value.trim();
    if (!userText) return;

    sendMessageButton.disabled = true;
    userMessageInput.disabled = true;
    loadingSpinner.style.display = 'block';

    async function processMessage() {
      if (!puter.auth.isSignedIn()) {
        try {
          await puter.ui.authenticateWithPuter(); // Use UI-based authentication
        } catch (error) {
          console.error('Authentication failed:', error);
          renderMessage('Authentication failed. Please try again.', 'error');
          return;
        }
      }

      conversation.push({ role: 'user', content: userText });
      saveConversation();
      renderMessages();

      try {
        const response = await puter.ai.chat(conversation, { model: 'gpt-4o-mini' });
        const aiMessage = response.message.content;
        conversation.push({ role: 'assistant', content: aiMessage });
        saveConversation();
        renderMessages();
      } catch (error) {
        const errorMessage = `Error: ${error.message}`;
        renderMessage(errorMessage, 'error');
        console.error(error);
      } finally {
        userMessageInput.value = '';
        userMessageInput.disabled = false;
        sendMessageButton.disabled = false;
        loadingSpinner.style.display = 'none';
      }
    }

    processMessage();
  }

  function saveConversation() {
    puter.kv.set('chat_history', JSON.stringify(conversation))
      .catch(error => console.error('Error saving conversation:', error));
  }

  function loadConversation() {
    puter.kv.get('chat_history')
      .then(savedConvo => {
        if (savedConvo) {
          conversation = JSON.parse(savedConvo);
          if (conversation[0].role !== 'system') {
            conversation.unshift({ role: 'system', content: 'You are a helpful assistant.' });
          }
          renderMessages();
        }
      })
      .catch(error => console.error('Error loading conversation:', error));
  }

  loadConversation();

  sendMessageButton.addEventListener('click', handleNewMessage);
  userMessageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleNewMessage();
    } else if (e.key === '/') { // Image generation command
      userMessageInput.value = '/img ';
    }
  });

  // Render initial messages
  conversation.push({ role: 'assistant', content: "Hello! I'm your friendly AI assistant. How can I help you today?" });
  renderMessages();

  // Responsive adjustments
  window.addEventListener('resize', () => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
})();
