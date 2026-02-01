# AI-Assisted Hiring & Interview Platform

An end-to-end, AI-assisted hiring platform that helps recruiters screen resumes, conduct adaptive technical interviews, and generate detailed, behavioral signal–based feedback — all while keeping humans firmly in control of hiring decisions.

---

## 🚀 Overview

Hiring today is slow, manual, and inconsistent. Recruiters often rely on resumes and subjective interviews, which do not scale well and fail to capture *how candidates think*.

This platform addresses that gap by providing:
- **AI-assisted resume screening**: Automatically analyze and score resumes against job descriptions.
- **AI-led, adaptive technical interviews**: Conduct first-round technical screens using an AI interviewer that mimics a real video call.
- **Explainable, recruiter-friendly feedback**: actionable insights based on confidence, clarity, and technical depth (not just keyword matching).

The system is designed to **assist recruiters**, not replace them.

---

## 🎯 Key Features

### 1. AI Job Description Generation
- **Effortless Creation**: HR enters only the Job Role and Years of Experience.
- **AI Generation**: The system generates a complete, structured Job Description (JD) automatically.
- **Interactive UI**: Features a ChatGPT-style typing experience for immediate feedback.
- **Structured Data**: JDs are stored with semantic embeddings for future matching.

### 2. Resume Upload & Smart Screening
- **Pre-Interview Screening**: Candidates must upload a resume before scheduling an interview.
- **Contextual Analysis**: Resumes are analyzed specifically against the Job Description.
- **Metric-Driven Insights**:
  - **Match Score (0–100)**: Instant suitability metric.
  - **Strengths**: Highlights direct matches with requirements.
  - **Gaps**: Identifies missing skills or experience.
  - **Transferable Skills**: Recognizes adjacent technologies and soft skills.
- **Privacy-First**: Results are visible *only* on the HR dashboard.

### 3. AI Video-Call Style Interview
- **Immersive Experience**: Full-screen video-call interface (Zoom/Meet style).
- **AI Persona**: Animated, non-human AI interviewer (cartoon/stylized) to reduce intimidation.
- **Technical Implementation**:
  - **Speech-to-Text (STT)**: Server-side OpenAI Whisper for accurate transcription.
  - **Text-to-Speech (TTS)**: High-quality server-side synthesized voice.
  - **No Browser APIs**: Relies on backend processing for consistency and quality.
  - **Audio-Only Upload**: No camera access required from the candidate, ensuring privacy.

### 4. Adaptive Interview Flow
- **Dynamic Questioning**: The interview engine (LangGraph) adapts questions based on the candidate's previous answers.
- **Real-Time Analysis**: Evaluates:
  - Technical Correctness
  - Communication Clarity
  - Confidence Level
- **State-Driven**: Candidates progress to deeper topics only when readiness is demonstrated.

### 5. Behavioral Signal–Based Feedback System
- **Beyond Pass/Fail**: No simple exam-style scoring or ranking.
- **Recruiter-Centric Reports**:
  - **Confidence Trends**: Visual graphs showing confidence over the course of the interview.
  - **Communication Analysis**: Clarity and articulation metrics.
  - **Technical Reasoning**: Depth of understanding evaluation.
  - **Adaptability Signals**: How well the candidate handles new or difficult concepts.
- **Clear Recommendations**:
  - ✅ Strong Fit
  - ⚠️ Potential Fit
  - ❓ Needs Further Evaluation
  - ❌ Not a Fit Currently

---

## 🧠 Architecture Overview

The platform uses a microservices-inspired architecture with clear separation of concerns:

```mermaid
graph TD
    Client[Frontend Client (React)]
    
    subgraph Services
        API[Backend API (FastAPI :8000)]
        AI[AI Service (FastAPI :8001)]
    end
    
    subgraph Data
        Mongo[(MongoDB Atlas)]
        Qdrant[(Qdrant Vector DB)]
        Storage[File Storage / S3]
    end
    
    Client -->|REST / Auth| API
    Client -->|Resume Upload| API
    Client -->|Audio Stream| AI
    
    API -->|Manage Data| Mongo
    API -->|Proxy AI Requests| AI
    
    AI -->|Orchestration| API
    AI -->|Embeddings| Qdrant
    AI -->|Persist State| Mongo
```

- **Frontend**: Handles UI, audio recording, and state management.
- **Backend API**: Manages users, auth, jobs, applications, and scheduling.
- **AI Service**: Dedicated service for heavy lifting—LLM inference, speech processing, and interview orchestration.

---

## 🧩 Technology Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Custom CSS / Modern video-call UI with dark blue–black enterprise theme.
- **Features**: Animated components, real-time feedback charts, glassmorphism design.

### Backend
- **Framework**: FastAPI (Python)
- **Security**: JWT-based authentication, Role-Based Access Control (RBAC).
- **Architecture**: Modular router structure (Auth, HR, Candidate, AI).

### AI Service
- **Orchestration**: LangGraph (State machine for adaptive interviews).
- **LLM**: Support for OpenAI (GPT-4o) and Anthropic (Claude 3.5 Sonnet).
- **Audio Processing**: 
  - **STT**: OpenAI Whisper.
  - **TTS**: Server-side generation.
- **Vector Search**: Qdrant for semantic retrieval of similar questions/contexts.

### Databases
- **MongoDB Atlas**: Primary store for users, profiles, jobs, applications, and interview logs.
- **Qdrant**: Vector database for semantically indexing JDs and interview knowledge base.

---

## 🛠️ Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Instance
- Qdrant Instance (Docker or Cloud)
- API Keys: OpenAI, Anthropic (optional)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-org/interview-platform.git
    cd interview-platform
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # or venv\Scripts\activate on Windows
    pip install -r requirements.txt
    
    # Run Backend (Port 8000)
    uvicorn app.main:app --reload
    ```

3.  **AI Service Setup**
    ```bash
    cd ai-service
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    
    # Run AI Service (Port 8001)
    uvicorn app.main:app --reload --port 8001
    ```

4.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    
    # Run Frontend (Port 5173)
    npm run dev
    ```

5.  **Environment Variables**
    Create `.env` files in `backend/` and `ai-service/` populated with your database URIs and API keys.

---
