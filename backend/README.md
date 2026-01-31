# Backend - Interview Platform API

FastAPI backend for the AI-First Hiring Platform.

## Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your MongoDB Atlas connection string

# Run development server
uvicorn app.main:app --reload
```

## Environment Variables

Create a `.env` file:

```env
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/interview_platform
SECRET_KEY=your-super-secret-jwt-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry
│   ├── core/                # Configuration, security, dependencies
│   ├── database/            # MongoDB connection and collections
│   ├── models/              # Document models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── api/                 # API route handlers
│   ├── services/            # Business logic layer
│   └── utils/               # Enums and utilities
├── requirements.txt
└── README.md
```

## Phase 2 Readiness

The `ai_service_placeholder.py` contains interface stubs for:
- `generate_job_description()` - AI-generated job descriptions
- `prepare_interview_context()` - RAG context preparation
- `conduct_interview()` - LangGraph interview orchestration
- `generate_interview_feedback()` - AI feedback generation
