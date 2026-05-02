# ✈️ TripMate AI - Smart Travel Assistant Chatbot

Web chatbot berbasis AI untuk membantu pengguna Indonesia merencanakan perjalanan dengan mudah, cepat, dan menyenangkan. Dibangun dengan **Node.js + Express** dan **Google Gemini API** sesuai materi training Sesi 1–3.

## 📝 Deskripsi

**TripMate AI** adalah chatbot asisten perjalanan pintar berbahasa Indonesia. Pengguna cukup mengetik kebutuhan liburannya (misalnya *"Mau ke Bali 3 hari budget hemat"*), dan TripMate akan menjawab dengan rekomendasi itinerary, estimasi budget, kuliner khas, transportasi, dan tips praktis.

Chatbot ini **bukan rule-based** — semua jawaban dihasilkan dinamis oleh **LLM Gemini (`gemini-2.5-flash`)** lewat backend Express, sesuai arsitektur yang diajarkan di materi.

## 🎯 Use Case

TripMate AI membantu pengguna untuk:

- 🌍 Mendapatkan **rekomendasi destinasi** (Indonesia & global)
- 📅 Membuat **itinerary** liburan 1–5 hari
- 💸 Membuat **estimasi budget** sederhana
- 🍜 Mendapatkan **rekomendasi kuliner** khas daerah tujuan
- 🚆 Saran **transportasi & aktivitas**
- 💡 **Tips travel** sesuai gaya liburan (hemat, keluarga, solo, dll)

## 🏗️ Arsitektur

Mengikuti alur yang diajarkan di materi chatbot workflow:

```
User → Frontend (HTML/JS) → POST /api/chat
                                  ↓
                          Backend (Express)
                                  ↓
                       Gemini API (generateContent)
                                  ↓
                   Response → Frontend → UI Bubble
```

## 🤖 Konfigurasi AI (Gemini)

| Parameter | Nilai | Penjelasan |
|-----------|-------|------------|
| **Model** | `gemini-2.5-flash` | Cepat & ekonomis, direkomendasikan di materi |
| **Temperature** | `0.8` | Kreativitas → variasi rekomendasi itinerary |
| **Top P** | `0.9` | Diversitas token → jawaban tetap relevan tapi variatif |
| **Max output tokens** | `1024` | Cukup untuk itinerary singkat |

### System Instruction (Persona)

```txt
Kamu adalah TripMate AI, asisten perjalanan pintar untuk pengguna Indonesia.

Tugasmu membantu pengguna merencanakan perjalanan, membuat itinerary, memberi
rekomendasi destinasi, estimasi budget sederhana, rekomendasi kuliner,
transportasi, dan tips perjalanan.

Gunakan Bahasa Indonesia yang santai, ramah, dan mudah dipahami.

Jika informasi kurang, tanyakan:
- kota keberangkatan
- durasi
- budget
- jumlah orang
- gaya liburan

Jangan mengarang harga atau jadwal yang tidak pasti.
```

### Prompt Engineering yang Diterapkan

- ✅ **Clear instruction** — peran ("kamu adalah TripMate AI") dan tugas spesifik
- ✅ **Context** — target pengguna Indonesia, daftar info yang ditanyakan jika kurang
- ✅ **Output style** — Bahasa Indonesia santai, struktur praktis, tidak mengarang

## ✨ Fitur

- 💬 Chat interaktif dengan **memory percakapan** (history dikirim ke API)
- 🧠 Powered by **Google Gemini** (`gemini-2.5-flash`) lewat `@google/genai`
- 🎨 UI modern bertema travel, **responsive** di mobile & desktop
- 🌗 **Dark mode toggle** (preferensi tersimpan di `localStorage`)
- ⚡ **Suggested prompts**: *Itinerary Bali 3 hari*, *Wisata murah Jogja*, *Liburan keluarga Bandung*
- ⌨️ **Enter** untuk kirim, **Shift + Enter** untuk newline
- 🔄 Indikator **"TripMate sedang berpikir..."** saat menunggu balasan AI
- 📜 **Auto-scroll** ke pesan terbaru
- ⚠️ **Error handling** yang ramah pengguna
- 🔐 API key tersimpan aman di file **`.env`**

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Backend**: Express.js (ES Modules), CORS, dotenv
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (no framework)
- **AI / LLM**: [Google Gemini API](https://ai.google.dev/) via [`@google/genai`](https://www.npmjs.com/package/@google/genai)

## 📁 Struktur Proyek

```
ai-travel-chatbot/
├── public/
│   ├── index.html      # UI chatbot (header, suggestions, chat box, input)
│   ├── style.css       # Styling + dark mode (CSS variables)
│   └── script.js       # Logika frontend, fetch /api/chat, history
├── index.js            # Express server + endpoint /api/chat (Gemini)
├── package.json        # ES Modules, deps: express, cors, dotenv, @google/genai
├── .env.example        # Contoh konfigurasi environment
├── .gitignore
└── README.md
```

## ⚙️ Setup & Cara Install

> Pastikan **Node.js v18+** sudah terpasang. Cek dengan `node -v`.

1. **Clone repo** ini:

   ```bash
   git clone https://github.com/<username-kamu>/ai-travel-chatbot.git
   cd ai-travel-chatbot
   ```

2. **Install dependencies** (sesuai materi):

   ```bash
   npm install express dotenv cors @google/genai
   ```

   Atau lebih singkat (sudah ada di `package.json`):

   ```bash
   npm install
   ```

3. **Siapkan API key Gemini**:

   - Buka [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Login dengan akun Google, klik **Create API key**
   - Salin file `.env.example` menjadi `.env`:

     ```bash
     cp .env.example .env
     ```

   - Edit `.env` dan isi:

     ```env
     GEMINI_API_KEY=
     PORT=3000
     ```

## ▶️ Cara Menjalankan Lokal

Mode normal:

```bash
npm start
```

Mode development (auto-reload):

```bash
npm run dev
```

Buka browser ke:

```
http://localhost:3000
```

Selamat ngobrol dengan **TripMate AI**! ✈️🌴

## 🔌 API Endpoint

### `POST /api/chat`

**Request body:**

```json
{
  "conversation": [
    { "role": "user", "content": "Saya mau liburan ke Bali 3 hari" }
  ]
}
```

**Response sukses:**

```json
{
  "reply": "Asik, liburan ke Bali! Aku bantuin yaa..."
}
```

**Response error:**

```json
{
  "error": "Pesan error yang ramah pengguna"
}
```

**Validasi backend:**
- `conversation` harus berupa **array** dan tidak kosong
- Tiap item wajib punya `role` (`"user"` atau `"assistant"`) dan `content` (string non-kosong)

## 📤 Catatan Pengumpulan Tugas (GitHub)

1. Pastikan file **`.env`** TIDAK ikut ter-commit (sudah di-`.gitignore`).
2. Push ke GitHub repo publik:

   ```bash
   git init
   git add .
   git commit -m "feat: initial commit TripMate AI"
   git branch -M main
   git remote add origin https://github.com/<username-kamu>/ai-travel-chatbot.git
   git push -u origin main
   ```

3. Kumpulkan kepada dosen/pembimbing:
   - **URL repository GitHub** (publik)
   - **Screenshot UI** chatbot saat berjalan (lihat bagian di bawah)

## 📸 Screenshots

Tambahkan screenshot UI di sini.

<!--
Contoh:

![Tampilan utama TripMate AI](docs/screenshot-light.png)
![Mode gelap](docs/screenshot-dark.png)
![Contoh percakapan itinerary Bali](docs/screenshot-chat.png)
-->

## 📝 Lisensi

MIT - bebas digunakan untuk keperluan belajar dan tugas akhir.

---

Dibuat dengan ❤️ untuk traveler Indonesia.
