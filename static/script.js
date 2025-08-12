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
  const askAnything = document.getElementsByClassName('ask_anything')[0];
  const disclaimer = document.getElementById('disclaimer');
  const scrollProxy = document.getElementById('scroll_proxy');
  const scrollProxySpacer = scrollProxy ? scrollProxy.querySelector('.spacer') : null;
  let started = false;

  function ensureStarted() {
    if (!started) {
      document.body.classList.remove('landing_active');
      about && (about.style.display = 'none');
      // move input to bottom and show disclaimer
      askAnything.classList.add('docked');
      disclaimer && disclaimer.classList.remove('hidden');
      started = true;
    }
  }

  // Configure Markdown renderer if available
  if (window.marked) {
    try {
      window.marked.setOptions({ gfm: true, breaks: true });
    } catch (_) {}
  }

  // Sync right-edge proxy scrollbar with chat area
  function updateProxyHeight() {
    if (!scrollProxySpacer) return;
    const total = chatArea.scrollHeight;
    const viewport = chatArea.clientHeight;
    const needsScroll = total > viewport;
    scrollProxy.style.display = needsScroll ? 'block' : 'none';
    // Set spacer height so the proxy has a matching scroll range
    scrollProxySpacer.style.height = Math.max(0, total - 1) + 'px';
  }

  let syncing = false;
  function syncFromChat() {
    if (syncing || !scrollProxy) return;
    syncing = true;
    const ratio = chatArea.scrollTop / (chatArea.scrollHeight - chatArea.clientHeight || 1);
    const proxyMax = scrollProxy.scrollHeight - scrollProxy.clientHeight;
    scrollProxy.scrollTop = ratio * proxyMax;
    syncing = false;
  }
  function syncFromProxy() {
    if (syncing || !scrollProxy) return;
    syncing = true;
    const ratio = scrollProxy.scrollTop / (scrollProxy.scrollHeight - scrollProxy.clientHeight || 1);
    const chatMax = chatArea.scrollHeight - chatArea.clientHeight;
    chatArea.scrollTop = ratio * chatMax;
    syncing = false;
  }

  if (scrollProxy) {
    scrollProxy.addEventListener('scroll', syncFromProxy, { passive: true });
  }
  chatArea.addEventListener('scroll', syncFromChat, { passive: true });
  window.addEventListener('resize', () => {
    updateProxyHeight();
    syncFromChat();
  });

  function appendMessage(text, who) {
    const row = document.createElement('div');
    row.className = 'message_row';
    const bubble = document.createElement('div');
    bubble.className = who === 'user' ? 'message_user' : 'message_bot';

    if (who === 'user') {
      bubble.textContent = text;
    } else {
      if (window.DOMPurify && window.marked) {
        bubble.innerHTML = DOMPurify.sanitize(marked.parse(text));
      } else {
        bubble.textContent = text;
      }
    }

    row.appendChild(bubble);
    chatArea.appendChild(row);
    chatArea.scrollTop = chatArea.scrollHeight;
    updateProxyHeight();
    syncFromChat();
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

  // Initialize proxy based on initial layout
  updateProxyHeight();
  syncFromChat();
});
