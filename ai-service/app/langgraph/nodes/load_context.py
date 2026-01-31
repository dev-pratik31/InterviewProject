"""
Load Context Node

First node in the interview graph.
Retrieves job context and prepares initial questions.
"""

from app.langgraph.state import InterviewState
from app.vectorstore.job_embeddings import get_job_context
from app.vectorstore.question_store import get_questions_for_stage


async def load_context_node(state: InterviewState) -> dict:
    """
    Load job context and prepare interview.
    
    Actions:
    1. Use pre-fetched job context or create default
    2. Get initial warmup questions (or use defaults)
    3. Prepare opening message
    
    Returns:
        State updates
    """
    try:
        # Use pre-fetched job context from state, or try to fetch
        job_context = state.get("job_context")
        
        if not job_context:
            # Try to fetch from Qdrant
            try:
                job_context = await get_job_context(state["job_id"])
            except Exception as e:
                print(f"Warning: Could not fetch job context: {e}")
        
        # Create default context if still missing
        if not job_context:
            job_context = {
                "job_id": state["job_id"],
                "title": "Software Engineer",
                "company_name": "Company",
                "skills_required": ["Python", "Problem Solving"],
                "experience_required": 2,
            }
        
        # Get warmup questions (with fallback)
        questions = []
        try:
            questions = await get_questions_for_stage(
                stage="warmup",
                skills=job_context.get("skills_required", []),
                difficulty=state["difficulty_level"],
                limit=5
            )
        except Exception as e:
            print(f"Warning: Could not fetch questions: {e}")
        
        # Create opening message
        title = job_context.get('title', 'this position')
        company = job_context.get('company_name', 'the company')
        
        opening = (
            f"Hello! Welcome to your interview for the {title} "
            f"position at {company}. I'm your AI interviewer, "
            f"and I'll be conducting this session today.\n\n"
            f"We'll start with a few questions to get to know you better, "
            f"then move into some technical discussions. Feel free to take your time "
            f"with your responses.\n\n"
            f"Let's begin - can you tell me a bit about yourself and what interests "
            f"you about this role?"
        )
        
        return {
            "job_context": job_context,
            "retrieved_questions": questions,
            "current_stage": "warmup",
            "current_question": opening,
            "messages": [{
                "role": "assistant",
                "content": opening,
                "timestamp": state["started_at"],
                "evaluation": None,
            }],
            "pending_response": True,
        }
        
    except Exception as e:
        return {
            "error": f"Context loading failed: {str(e)}",
            "current_stage": "complete",
        }

