# AI Service - Interview Platform Phase 2

AI-powered interview engine using LangGraph, Qdrant, and LLM providers.

## Setup

```bash
# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your API keys

# Run service
uvicorn app.main:app --port 8001 --reload
```

## Architecture

```
ai-service/
├── app/
│   ├── main.py              # FastAPI entry
│   ├── config.py            # Settings
│   ├── llm/                  # LLM providers
│   ├── langgraph/           # Interview state machine
│   ├── evaluation/          # Confidence & scoring
│   ├── vectorstore/         # Qdrant integration
│   ├── api/                 # Endpoints
│   └── utils/               # Prompts & helpers
└── requirements.txt
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/generate-jd` | Generate job description |
| POST | `/ai/interview/start` | Start interview session |
| POST | `/ai/interview/respond` | Process candidate response |
| GET | `/ai/interview/{id}/state` | Get interview state |
| POST | `/ai/interview/{id}/complete` | Complete and get feedback |

## Environment Variables

```env
OPENAI_API_KEY=sk-...
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=optional
MONGODB_URL=mongodb+srv://...
```
