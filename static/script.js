const logoButton = document.getElementsByClassName('logo_tog')[0];
const dropdown = document.getElementsByClassName('something')[0];

logoButton.addEventListener('click', (event) => {
  dropdown.classList.toggle('hidden');
  event.stopPropagation();
});

document.addEventListener('click', () => {
  dropdown.classList.add('hidden');
});
const accounthold = document.getElementsByClassName('accounthold')[0];
const accountopen = document.getElementsByClassName('accountopen')[0];
accounthold.addEventListener('click', (event) => {
  accountopen.classList.toggle('hidden');
  event.stopPropagation();
});
document.addEventListener('click', () => {
  accountopen.classList.add('hidden');
});


document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementsByClassName('send_btn')[0];
  const input = document.getElementsByClassName('ask_anything_input')[0];
  const chatArea = document.getElementById('chat_area');
  const about = document.getElementsByClassName('aboutchat')[0];
  let started = false;

  function ensureStarted() {
    if (!started) {
      document.body.classList.remove('landing_active');
      about && (about.style.display = 'none');
      started = true;
    }
  }

  function appendMessage(text, who) {
    const row = document.createElement('div');
    row.className = 'message_row';
    const bubble = document.createElement('div');
    bubble.className = who === 'user' ? 'message_user' : 'message_bot';
    bubble.textContent = text;
    row.appendChild(bubble);
    chatArea.appendChild(row);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;
    ensureStarted();
    appendMessage(message, 'user');
    input.value = '';
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      appendMessage(data.reply || 'No response', 'bot');
    } catch (err) {
      appendMessage('Error: unable to reach chatbot. Please try again.', 'bot');
      console.error(err);
    }
  }

  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});
