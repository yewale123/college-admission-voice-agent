# 🎓 College Admission Voice Agent

An AI-powered voice chatbot that helps students get instant answers about college admissions through natural voice conversations — in **Hindi and English**.

---

## 📌 What is this Project?

This is a full-stack web application where:
- **Students** can talk to an AI counselor using their voice or text and get answers about admissions, fees, eligibility, dates, documents, entrance exams, etc.
- **Admins** can upload college documents (PDF, DOCX, TXT) and the AI automatically learns from them to answer student queries.

---

## 🧠 AI Concepts Used

| Concept | Description |
|---|---|
| **RAG** (Retrieval Augmented Generation) | AI searches uploaded documents and answers from real content, not guesswork |
| **Vector Embeddings** | Documents converted to numerical vectors for semantic search |
| **Semantic Search** | Finds relevant content by meaning, not just keywords |
| **LLM** (Large Language Model) | Groq's Llama 3.1 generates human-like answers |
| **LangChain** | Framework to build the RAG pipeline |
| **Conversational Memory** | AI remembers previous messages in the conversation |
| **Auto Language Detection** | Detects Hindi or English automatically and responds accordingly |
| **Voice Activity Detection (VAD)** | Detects when user speaks during AI response (barge-in) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite + Tailwind CSS |
| Backend | Python + FastAPI |
| Database | MySQL |
| LLM | Groq API — Llama 3.1 8B Instant (Free) |
| RAG Framework | LangChain 0.3 |
| Vector Database | ChromaDB (local) |
| Embeddings | FastEmbed — BAAI/bge-small-en-v1.5 (no GPU needed) |
| Voice Input | Web Speech API (browser built-in) |
| Voice Output | Speech Synthesis API (browser built-in) |

---

## ✨ Features

### Student Interface
- 🎙️ **Continuous Voice Conversation** — Talk hands-free like ChatGPT voice mode
- ⌨️ **Text Input** — Type questions manually
- 🔄 **Auto Language Detection** — Ask in Hindi → reply in Hindi, English → English
- 🔊 **AI Voice Response** — AI speaks the answer back
- 🚨 **Barge-in Support** — Interrupt AI while it's speaking with your question
- 💬 **Real-time Transcript** — See what you're saying as you speak
- 🗑️ **Clear Conversation** — Start fresh anytime

### Admin Panel
- 📤 **Upload Documents** — PDF, DOCX, TXT (max 10MB)
- 📋 **Document Dashboard** — See all uploaded documents with status
- 🔁 **Reprocess Documents** — Re-index any document
- 🗑️ **Delete Documents** — Remove from knowledge base

---

## 📁 Project Structure

```
College admission Voice Agent/
├── backend/
│   ├── .venv/                    # Python virtual environment
│   ├── main.py                   # FastAPI app entry point
│   ├── config.py                 # Environment configuration
│   ├── database.py               # MySQL connection
│   ├── models.py                 # Database tables
│   ├── .env                      # Your credentials (not on GitHub)
│   ├── .env.example              # Template for credentials
│   ├── requirements.txt          # Python dependencies
│   ├── routes/
│   │   ├── chat.py               # Chat API endpoints
│   │   └── documents.py          # Document upload/manage endpoints
│   └── services/
│       ├── rag_service.py        # RAG pipeline + LLM
│       ├── vector_store.py       # ChromaDB vector operations
│       └── document_processor.py # PDF/DOCX/TXT parsing
├── frontend/
│   └── src/
│       ├── App.jsx               # Main app + routing
│       ├── api/api.js            # Axios API calls
│       ├── hooks/useSpeech.js    # Voice recognition + synthesis hooks
│       └── components/
│           ├── StudentChat/      # Voice chat interface
│           └── AdminDashboard/   # Document management UI
├── start_backend.bat
├── start_frontend.bat
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- MySQL 8.0+
- Google Chrome (for voice features)

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR-USERNAME/college-admission-voice-agent.git
cd college-admission-voice-agent
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
# Copy the example file
copy .env.example .env
```

Edit `backend/.env`:
```env
# Get FREE Groq API key at: https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Your MySQL credentials
DB_HOST=localhost
DB_PORT=3306
DB_NAME=college_admission_db
DB_USER=root
DB_PASSWORD=your_mysql_password
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 🚀 Running the Project

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **Google Chrome**: `http://localhost:5173`

---

## 🔑 Getting Free API Keys

| Service | Link | Free Limit |
|---|---|---|
| **Groq** (LLM) | https://console.groq.com | 14,400 requests/day |

> ⚠️ Voice features only work in **Google Chrome** browser.

---

## 📖 How to Use

### As a Student
1. Go to `http://localhost:5173`
2. Click **Student Portal**
3. Click **"Start Conversation"** → Allow microphone
4. Speak your question in Hindi or English
5. AI will respond with voice + text
6. Continue the conversation naturally

### As an Admin
1. Go to `http://localhost:5173/admin`
2. Upload admission documents (PDF/DOCX/TXT)
3. Wait for status to show **"Ready"**
4. Students can now ask questions about that content

---

## 🗄️ Database Tables (Auto-created on startup)

| Table | Purpose |
|---|---|
| `documents` | Uploaded document metadata, status, chunk count |
| `chat_sessions` | Student conversation sessions |
| `chat_messages` | All messages with language and timestamp |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat/` | Send message, get AI response |
| GET | `/api/chat/{session_id}/history` | Get conversation history |
| DELETE | `/api/chat/{session_id}` | Clear conversation |
| POST | `/api/documents/upload` | Upload a document |
| GET | `/api/documents/` | List all documents |
| DELETE | `/api/documents/{id}` | Delete a document |
| PUT | `/api/documents/{id}/reprocess` | Reprocess a document |
| GET | `/api/health` | Check server status |

---

## 📄 License

This project is for educational purposes.

---

## 👤 Author

**Pankaj** — Built as a final year / portfolio project demonstrating RAG-based AI, voice interfaces, and full-stack development.
