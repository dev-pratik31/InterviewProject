"""
Interview State Definition

TypedDict defining the complete interview state for LangGraph.
This is the central data structure that flows through all nodes.
"""

from typing import TypedDict, Literal, Optional, Annotated
from datetime import datetime

from langgraph.graph.message import add_messages


class EvaluationScores(TypedDict):
    """Scores for a single response evaluation."""
    confidence: float  # 0-1
    clarity: float     # 0-1
    technical: float   # 0-1
    depth: float       # 0-1


class Message(TypedDict):
    """A single message in the conversation."""
    role: Literal["assistant", "human"]  # LangChain standard roles
    content: str
    timestamp: str
    evaluation: Optional[EvaluationScores]


class JobContext(TypedDict):
    """Context retrieved from job description."""
    job_id: str
    title: str
    description: str
    skills_required: list[str]
    experience_required: int
    company_name: str


class InterviewState(TypedDict):
    """
    Complete interview state tracked through LangGraph.
    
    This state flows through all interview nodes and captures:
    - Interview metadata and identifiers
    - Current stage and progression control
    - Conversation history
    - Evaluation signals and aggregates
    - Final feedback output
    """
    
    # ===========================
    # Identifiers
    # ===========================
    interview_id: str
    job_id: str
    candidate_id: str
    started_at: str
    
    # ===========================
    # Stage Control
    # ===========================
    current_stage: Literal[
        "loading",      # Initial context loading
        "warmup",       # Rapport building
        "technical",    # Core technical questions
        "deep_dive",    # Advanced probing
        "wrapup",       # Closing questions
        "feedback",     # Generating feedback
        "complete"      # Interview finished
    ]
    difficulty_level: int  # 1-5, adjusted based on performance
    
    # ===========================
    # Question Tracking
    # ===========================
    questions_asked: int
    questions_in_stage: int
    max_questions_per_stage: int
    max_total_questions: int
    
    # ===========================
    # Context
    # ===========================
    job_context: Optional[JobContext]
    retrieved_questions: list[dict]  # Questions from Qdrant
    current_question: str
    current_question_id: Optional[str]
    
    # ===========================
    # Conversation
    # ===========================
    messages: Annotated[list[Message], add_messages]
    pending_response: bool  # Waiting for candidate input
    last_response: Optional[str]
    
    # ===========================
    # Evaluation Signals
    # ===========================
    # Per-response scores
    confidence_scores: list[float]
    clarity_scores: list[float]
    technical_scores: list[float]
    depth_scores: list[float]
    
    # Computed trends
    confidence_trend: Literal["improving", "stable", "declining"]
    
    # Rolling averages
    avg_confidence: float
    avg_clarity: float
    avg_technical: float
    
    # ===========================
    # Control Signals
    # ===========================
    should_simplify: bool      # Drop difficulty
    should_advance: bool       # Move to next stage
    fatigue_detected: bool     # End interview early
    struggle_count: int        # Consecutive low scores
    
    # ===========================
    # Output
    # ===========================
    final_feedback: Optional[dict]
    recommendation: Optional[Literal[
        "strong_hire",
        "hire", 
        "maybe",
        "no_hire"
    ]]
    
    # ===========================
    # Error Handling
    # ===========================
    error: Optional[str]
    retry_count: int


def create_initial_state(
    interview_id: str,
    job_id: str,
    candidate_id: str,
) -> InterviewState:
    """
    Create initial interview state.
    
    Args:
        interview_id: Unique interview identifier
        job_id: Job posting ID
        candidate_id: Candidate user ID
        
    Returns:
        Initialized InterviewState
    """
    return InterviewState(
        # Identifiers
        interview_id=interview_id,
        job_id=job_id,
        candidate_id=candidate_id,
        started_at=datetime.utcnow().isoformat(),
        
        # Stage Control
        current_stage="loading",
        difficulty_level=3,  # Start at medium
        
        # Question Tracking
        questions_asked=0,
        questions_in_stage=0,
        max_questions_per_stage=5,
        max_total_questions=15,
        
        # Context
        job_context=None,
        retrieved_questions=[],
        current_question="",
        current_question_id=None,
        
        # Conversation
        messages=[],
        pending_response=False,
        last_response=None,
        
        # Evaluation Signals
        confidence_scores=[],
        clarity_scores=[],
        technical_scores=[],
        depth_scores=[],
        confidence_trend="stable",
        avg_confidence=0.5,
        avg_clarity=0.5,
        avg_technical=0.5,
        
        # Control Signals
        should_simplify=False,
        should_advance=False,
        fatigue_detected=False,
        struggle_count=0,
        
        # Output
        final_feedback=None,
        recommendation=None,
        
        # Error Handling
        error=None,
        retry_count=0,
    )


def calculate_trend(scores: list[float]) -> Literal["improving", "stable", "declining"]:
    """
    Calculate trend from recent scores.
    
    Uses last 3 scores to determine direction.
    """
    if len(scores) < 3:
        return "stable"
    
    recent = scores[-3:]
    slope = (recent[-1] - recent[0]) / 2
    
    if slope > 0.1:
        return "improving"
    elif slope < -0.1:
        return "declining"
    return "stable"


def calculate_average(scores: list[float], window: int = 5) -> float:
    """Calculate rolling average of scores."""
    if not scores:
        return 0.5
    recent = scores[-window:]
    return sum(recent) / len(recent)
