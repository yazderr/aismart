function renderMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message`;

  // Parse message for formatting
  const formattedMessage = message
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
    .replace(/\n/g, '<br>') // New lines
    .replace(/\[LEFT\](.*?)\[\/LEFT\]/g, '<div style="text-align: left;">$1</div>') // Left alignment
    .replace(/\[CENTER\](.*?)\[\/CENTER\]/g, '<div style="text-align: center;">$1</div>') // Center alignment
    .replace(/\[RIGHT\](.*?)\[\/RIGHT\]/g, '<div style="text-align: right;">$1</div>'); // Right alignment

  messageDiv.innerHTML = formattedMessage;
  chatMessages.appendChild(messageDiv);
}
