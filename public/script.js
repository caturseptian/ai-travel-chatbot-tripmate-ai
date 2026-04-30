// =========================================
// TripMate AI - Frontend Script
// - Menyimpan history percakapan
// - Mengirim ke /api/chat
// - Menangani loading, error, dan dark mode
// =========================================

const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendBtn = document.getElementById('send-btn');
const errorBanner = document.getElementById('error-banner');
const suggestionsEl = document.getElementById('suggestions');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

// State percakapan: dikirim ke backend setiap kali user mengirim pesan
const conversation = [];

// ===== Welcome message =====
function showWelcome() {
  const welcome = document.createElement('div');
  welcome.className = 'welcome';
  welcome.innerHTML = `
    <h2>Halo, traveler! 👋</h2>
    <p>Aku <strong>TripMate AI</strong>, siap bantu rencanain liburanmu.<br/>
    Ceritain mau ke mana, atau pilih saran di atas. ✈️🌴</p>
  `;
  chatBox.appendChild(welcome);
}
showWelcome();

// ===== Render pesan ke UI =====
function appendMessage(role, text) {
  // Hapus welcome saat pesan pertama muncul
  const welcome = chatBox.querySelector('.welcome');
  if (welcome) welcome.remove();

  const wrapper = document.createElement('div');
  wrapper.classList.add('message', role === 'user' ? 'user' : 'bot');

  const label = document.createElement('span');
  label.className = 'role-label';
  label.textContent = role === 'user' ? 'Kamu' : 'TripMate';
  wrapper.appendChild(label);

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  wrapper.appendChild(bubble);

  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
  return wrapper;
}

// ===== Loading indicator =====
// Tampilkan teks "TripMate sedang berpikir..." plus animasi titik
function showLoading() {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message', 'bot', 'loading');
  wrapper.id = 'loading-msg';

  const label = document.createElement('span');
  label.className = 'role-label';
  label.textContent = 'TripMate';
  wrapper.appendChild(label);

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = `
    <span class="loading-text">TripMate sedang berpikir</span>
    <span class="dot"></span><span class="dot"></span><span class="dot"></span>
  `;
  wrapper.appendChild(bubble);

  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function hideLoading() {
  const el = document.getElementById('loading-msg');
  if (el) el.remove();
}

// ===== Error banner =====
function showError(message) {
  errorBanner.textContent = `⚠️ ${message}`;
  errorBanner.classList.remove('hidden');
  // Auto-hide setelah 6 detik
  clearTimeout(showError._timer);
  showError._timer = setTimeout(() => errorBanner.classList.add('hidden'), 6000);
}

function hideError() {
  errorBanner.classList.add('hidden');
}

// ===== Kirim pesan ke backend =====
async function sendMessage(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return;

  hideError();

  // Tambahkan ke history & UI
  conversation.push({ role: 'user', content: trimmed });
  appendMessage('user', trimmed);

  // Sembunyikan suggestions setelah pesan pertama
  if (suggestionsEl && !suggestionsEl.classList.contains('hidden')) {
    suggestionsEl.classList.add('hidden');
  }

  input.value = '';
  resizeTextarea();
  setSending(true);
  showLoading();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Server error (${res.status})`);
    }

    const reply = data.reply || 'Maaf, aku belum bisa memberikan jawaban.';
    conversation.push({ role: 'assistant', content: reply });
    hideLoading();
    appendMessage('bot', reply);
  } catch (err) {
    hideLoading();
    // Kembalikan pesan terakhir dari history kalau gagal,
    // supaya user bisa coba kirim ulang tanpa duplikasi.
    conversation.pop();
    showError(
      err.message ||
        'Gagal terhubung ke server. Cek koneksi internet atau coba lagi.'
    );
  } finally {
    setSending(false);
    input.focus();
  }
}

function setSending(isSending) {
  sendBtn.disabled = isSending;
  input.disabled = isSending;
}

// ===== Form submit =====
form.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage(input.value);
});

// ===== Enter untuk kirim, Shift+Enter untuk newline =====
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage(input.value);
  }
});

// ===== Auto-resize textarea =====
function resizeTextarea() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 140) + 'px';
}
input.addEventListener('input', resizeTextarea);

// ===== Suggested prompts =====
suggestionsEl.querySelectorAll('.suggestion').forEach((btn) => {
  btn.addEventListener('click', () => {
    const prompt = btn.getAttribute('data-prompt');
    if (prompt) sendMessage(prompt);
  });
});

// ===== Dark mode toggle =====
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('tripmate-theme', theme);
}

const savedTheme =
  localStorage.getItem('tripmate-theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// Fokus input saat halaman dibuka
window.addEventListener('load', () => input.focus());
