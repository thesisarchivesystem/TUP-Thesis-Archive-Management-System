window.addEventListener('DOMContentLoaded', () => {
  const aiChatbotFab = document.getElementById('aiChatbotFab');
  const aiChatbotPanel = document.getElementById('aiChatbotPanel');
  const aiChatbotClose = document.getElementById('aiChatbotClose');
  const aiChatMessages = document.getElementById('aiChatMessages');
  const aiChatForm = document.getElementById('aiChatForm');
  const aiChatInput = document.getElementById('aiChatInput');
  const chatSuggestions = document.querySelectorAll('.chat-suggestion');

  if (
    !aiChatbotFab ||
    !aiChatbotPanel ||
    !aiChatbotClose ||
    !aiChatMessages ||
    !aiChatForm ||
    !aiChatInput
  ) {
    return;
  }

  function setChatOpen(isOpen) {
    aiChatbotPanel.classList.toggle('open', isOpen);
    aiChatbotPanel.setAttribute('aria-hidden', String(!isOpen));
    aiChatbotFab.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) {
      aiChatInput.focus();
    }
  }

  function appendMessage(text, type) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}`;
    bubble.textContent = text;
    aiChatMessages.appendChild(bubble);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  }

  function buildReply(message) {
    const normalized = message.toLowerCase();

    if (normalized.includes('student') || normalized.includes('sign in') || normalized.includes('login')) {
      return 'Students can use the Student sign-in page from the main archive access flow.';
    }

    if (normalized.includes('category') || normalized.includes('categories') || normalized.includes('browse')) {
      return 'You can browse the available thesis categories from the category modules and archive listings.';
    }

    if (normalized.includes('department') || normalized.includes('program')) {
      return 'The archive groups records by department and program so you can narrow your search more easily.';
    }

    if (normalized.includes('thesis') || normalized.includes('submission') || normalized.includes('file')) {
      return 'I can help guide you through thesis records, submissions, and archive-related pages on this module.';
    }

    return 'I can help you explore categories, departments, thesis records, or sign-in options. Try one of the quick prompts below.';
  }

  function handleChat(message) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    appendMessage(trimmedMessage, 'user');
    window.setTimeout(() => {
      appendMessage(buildReply(trimmedMessage), 'bot');
    }, 320);
  }

  aiChatbotFab.addEventListener('click', () => {
    const isOpen = !aiChatbotPanel.classList.contains('open');
    setChatOpen(isOpen);
  });

  aiChatbotClose.addEventListener('click', () => setChatOpen(false));

  aiChatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = aiChatInput.value;
    aiChatInput.value = '';
    handleChat(message);
  });

  chatSuggestions.forEach((button) => {
    button.addEventListener('click', () => handleChat(button.textContent || ''));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setChatOpen(false);
    }
  });

  document.addEventListener('click', (event) => {
    const clickedInsideChat = aiChatbotPanel.contains(event.target) || aiChatbotFab.contains(event.target);
    if (!clickedInsideChat) {
      setChatOpen(false);
    }
  });
});
