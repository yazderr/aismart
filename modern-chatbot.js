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
    messageDiv.textContent = message;
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

    puter.ai.chat(conversation, { model: 'gpt-4o-mini' })
      .then((response) => {
        const aiMessage = response.message.content;
        conversation.push({ role: 'assistant', content: aiMessage });
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
    }
  });

  // Responsive adjustments
  window.addEventListener('resize', () => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
})();