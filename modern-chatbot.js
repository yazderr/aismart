(async () => {
  const chatMessages = document.getElementById('chat-messages');
  const userMessageInput = document.getElementById('user-message');
  const sendMessageButton = document.getElementById('send-message');
  const loadingSpinner = document.getElementById('loading-spinner');
  let conversation = [
    { role: 'system', content: 'You are a helpful assistant who provides detailed answers.' }
  ];

  // Load conversation from KV store
  async function loadConversation() {
    try {
      const savedConvo = await puter.kv.get('chat_history');
      if (savedConvo) {
        conversation = JSON.parse(savedConvo);
        if (conversation[0].role !== 'system') {
          conversation.unshift({ role: 'system', content: 'You are a helpful assistant.' });
        }
        renderMessages();
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }

  // Save conversation to KV store
  async function saveConversation() {
    try {
      await puter.kv.set('chat_history', JSON.stringify(conversation));
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  function renderMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    // Parse message for formatting
    const formattedMessage = message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; max-height: 300px;">') // Image URLs
      .replace(/\n/g, '<br>') // New lines
      .replace(/\[LEFT\](.*?)\[\/LEFT\]/g, '<div style="text-align: left;">$1</div>') // Left alignment
      .replace(/\[CENTER\](.*?)\[\/CENTER\]/g, '<div style="text-align: center;">$1</div>') // Center alignment
      .replace(/\[RIGHT\](.*?)\[\/RIGHT\]/g, '<div style="text-align: right;">$1</div>'); // Right alignment

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

    conversation.push({ role: 'user', content: userText });
    renderMessages();

    saveConversation(); // Save conversation after each user message

    puter.ai.chat(conversation, { model: 'gpt-4o-mini' })
      .then((response) => {
        const aiMessage = response.message.content;
        conversation.push({ role: 'assistant', content: aiMessage });
        saveConversation(); // Save after AI response
        renderMessages();
      })
      .catch((error) => {
        const errorMessage = `Error: ${error.message}`;
        renderMessage(errorMessage, 'error');
        console.error(error);
      })
      .finally(() => {
        userMessageInput.value = '';
        userMessageInput.disabled = false;
        sendMessageButton.disabled = false;
        loadingSpinner.style.display = 'none';
      });
  }

  async function handleImageRequest(prompt) {
    const imagePrompt = prompt.trim();
    sendMessageButton.disabled = true;
    userMessageInput.disabled = true;
    loadingSpinner.style.display = 'block';

    try {
      const imageUrl = await puter.ai.txt2img(imagePrompt, true); // Use test mode for demonstration
      const imageDiv = document.createElement('div');
      imageDiv.className = 'message ai-message';
      imageDiv.innerHTML = `<img src="${imageUrl}" style="max-width: 100%; max-height: 300px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">`;
      chatMessages.appendChild(imageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
      console.error(error);
      renderMessage('Image generation failed.', 'error');
    } finally {
      userMessageInput.value = '';
      userMessageInput.disabled = false;
      sendMessageButton.disabled = false;
      loadingSpinner.style.display = 'none';
    }
  }

  // Load initial messages
  const initialMessages = [
    { role: 'assistant', content: "Hello! I'm your friendly AI assistant. How can I help you today?" }
  ];
  conversation.push(...initialMessages);
  renderMessages();

  sendMessageButton.addEventListener('click', handleNewMessage);
  userMessageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleNewMessage();
    } else if (e.key === '/') { // Image generation command
      userMessageInput.value = '/img ';
    }
  });

  // Load conversation from KV store on page load
  loadConversation();

  // Handle image generation command
  userMessageInput.addEventListener('input', () => {
    if (userMessageInput.value.startsWith('/img ')) {
      // Prevent standard message handling and use image generation
      userMessageInput.value = userMessageInput.value.replace(/\n/g, '');
      handleImageRequest(userMessageInput.value.replace('/img ', '').trim());
    }
  });

  // Responsive adjustments
  window.addEventListener('resize', () => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
})();
