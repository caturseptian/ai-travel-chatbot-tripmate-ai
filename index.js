// index.js
// Backend Express untuk TripMate AI - Smart Travel Assistant
// Endpoint utama: POST /api/chat
// AI Provider: Google Gemini (@google/genai) - model gemini-2.5-flash
//
// Arsitektur:
//   User → Frontend (public/) → POST /api/chat
//   Backend (Express) → Gemini API (generateContent)
//   Gemini → Backend → Frontend → UI

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// Load environment variables dari .env
dotenv.config();

// __dirname helper untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== Inisialisasi Gemini Client =====
// API key diambil dari .env (jangan pernah hardcode di kode)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn(
    '[WARN] GEMINI_API_KEY belum diset. Salin .env.example menjadi .env dan isi API key.'
  );
}
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// ===== Konfigurasi Model =====
// Model: gemini-2.5-flash → cepat, ringan, hemat (rekomendasi materi)
const MODEL_NAME = 'gemini-2.5-flash';

// Parameter generasi:
//  - temperature (0.8) → mengontrol kreativitas. Makin tinggi makin variatif/kreatif,
//    cocok untuk rekomendasi itinerary yang tidak monoton.
//  - topP (0.9) → mengontrol diversitas token. Mengambil sampel dari kumulatif
//    probabilitas 90% teratas, sehingga jawaban tetap relevan tapi bervariasi.
//  - maxOutputTokens (2048) → batas panjang jawaban. Cukup untuk itinerary multi-hari.
//  - thinkingConfig.thinkingBudget (0) → MATIKAN "thinking mode" pada gemini-2.5-flash.
//    Default-nya, model menyisihkan sebagian token untuk penalaran internal yang tidak
//    ditampilkan, sehingga jawaban sering terpotong. Untuk use case travel chat, kita
//    tidak butuh thinking, jadi kita beri seluruh budget token untuk jawaban yang
//    benar-benar dilihat user.
const GENERATION_CONFIG = {
  temperature: 0.8,
  topP: 0.9,
  maxOutputTokens: 2048,
  thinkingConfig: {
    thinkingBudget: 0,
  },
};

// ===== System Instruction (persona TripMate AI) =====
// Prompt engineering: instruksi jelas + konteks + gaya output ditentukan eksplisit.
const SYSTEM_INSTRUCTION = `Kamu adalah TripMate AI, asisten perjalanan pintar untuk pengguna Indonesia.

Tugasmu membantu pengguna merencanakan perjalanan, membuat itinerary, memberi rekomendasi destinasi, estimasi budget sederhana, rekomendasi kuliner, transportasi, dan tips perjalanan.

Gunakan Bahasa Indonesia yang santai, ramah, dan mudah dipahami.

Jika informasi kurang, tanyakan:
- kota keberangkatan
- durasi
- budget
- jumlah orang
- gaya liburan

Jangan mengarang harga atau jadwal yang tidak pasti.`;

// ===== Validasi struktur conversation =====
// Conversation harus berupa array berisi { role: 'user' | 'assistant', content: string }
function validateConversation(conversation) {
  if (!Array.isArray(conversation)) {
    return 'Field "conversation" harus berupa array.';
  }
  if (conversation.length === 0) {
    return 'Field "conversation" tidak boleh kosong.';
  }
  for (let i = 0; i < conversation.length; i++) {
    const msg = conversation[i];
    if (!msg || typeof msg !== 'object') {
      return `Item ke-${i} pada conversation tidak valid.`;
    }
    if (msg.role !== 'user' && msg.role !== 'assistant') {
      return `Item ke-${i} memiliki role tidak valid. Gunakan "user" atau "assistant".`;
    }
    if (typeof msg.content !== 'string' || msg.content.trim() === '') {
      return `Item ke-${i} memiliki content kosong atau bukan string.`;
    }
  }
  return null;
}

// Konversi format pesan kita ke format Gemini.
// Frontend pakai role 'user' | 'assistant', Gemini pakai 'user' | 'model'.
function toGeminiContent(msg) {
  return {
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  };
}

// ===== Endpoint utama: POST /api/chat =====
// Body: { conversation: [{ role, content }, ...] }
// Response sukses: { reply: "..." }
// Response error : { error: "..." }
app.post('/api/chat', async (req, res) => {
  try {
    const { conversation } = req.body || {};

    // 1) Validasi input
    const validationError = validateConversation(conversation);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (!apiKey) {
      return res.status(500).json({
        error:
          'API key belum dikonfigurasi di server. Set GEMINI_API_KEY di file .env.',
      });
    }

    // 2) Petakan history percakapan ke format Gemini
    const contents = conversation.map(toGeminiContent);

    // 3) Panggil Gemini lewat generateContent()
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        ...GENERATION_CONFIG,
      },
    });

    // 4) Ambil teks hasil + cek finishReason
    //    - "STOP"    → selesai normal
    //    - "MAX_TOKENS" → kepotong karena maxOutputTokens habis
    //    - "SAFETY"  → diblokir filter
    const reply = (response.text || '').trim();
    const finishReason = response?.candidates?.[0]?.finishReason;

    if (!reply) {
      return res
        .status(502)
        .json({ error: 'AI tidak mengembalikan jawaban. Coba lagi ya.' });
    }

    // Beri tahu user jika jawaban kepotong, supaya bisa minta lanjut.
    if (finishReason === 'MAX_TOKENS') {
      return res.json({
        reply: reply + '\n\n_(Jawaban dipotong karena terlalu panjang. Ketik "lanjutkan" untuk meminta sisanya.)_',
      });
    }

    return res.json({ reply });
  } catch (err) {
    console.error('[ERROR /api/chat]', err);

    const status = err?.status || 500;
    const message =
      err?.message || 'Terjadi kesalahan di server saat menghubungi Gemini.';

    return res.status(status).json({ error: message });
  }
});

// Health check sederhana
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TripMate AI', model: MODEL_NAME });
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`✈️  TripMate AI berjalan di http://localhost:${PORT}`);
});
