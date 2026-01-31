"""
Response Scoring

Comprehensive evaluation of interview responses.
Combines multiple signals for holistic assessment.
"""

from typing import Optional

from pydantic import BaseModel, Field

from app.evaluation.confidence import analyze_confidence
from app.llm import get_provider, get_embedding_service
from app.utils.prompts import TECHNICAL_EVALUATION_PROMPT


class EvaluationResult(BaseModel):
    """Complete evaluation of a single response."""
    confidence: float = Field(..., ge=0, le=1)
    clarity: float = Field(..., ge=0, le=1)
    technical: float = Field(..., ge=0, le=1)
    depth: float = Field(..., ge=0, le=1)
    
    # Optional detailed breakdown
    hesitation_ratio: Optional[float] = None
    assertion_score: Optional[float] = None
    structure_score: Optional[float] = None


async def evaluate_clarity(response: str) -> float:
    """
    Evaluate clarity of communication.
    
    Assesses:
    - Logical flow
    - Clear explanations
    - Appropriate vocabulary
    - Conciseness
    """
    words = response.split()
    sentences = response.replace('!', '.').replace('?', '.').split('.')
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if not words or not sentences:
        return 0.5
    
    # Average sentence length (ideal: 15-25 words)
    avg_sentence_len = len(words) / len(sentences)
    if 15 <= avg_sentence_len <= 25:
        length_score = 1.0
    elif 10 <= avg_sentence_len <= 30:
        length_score = 0.7
    else:
        length_score = 0.4
    
    # Response completeness (very short = unclear)
    if len(words) < 20:
        completeness = 0.4
    elif len(words) < 50:
        completeness = 0.6
    elif len(words) < 150:
        completeness = 0.9
    else:
        completeness = 0.8  # Very long might be rambling
    
    # Check for incomplete sentences (ends with ...)
    incomplete_penalty = 0
    if response.strip().endswith('...'):
        incomplete_penalty = 0.1
    
    clarity = (length_score * 0.4 + completeness * 0.6) - incomplete_penalty
    return max(0.0, min(1.0, clarity))


async def evaluate_technical_accuracy(
    response: str,
    question: str,
    job_context: dict,
) -> float:
    """
    Evaluate technical accuracy of response.
    
    Uses LLM to assess correctness against job requirements.
    """
    provider = get_provider()
    
    skills = job_context.get("skills_required", [])
    
    messages = [
        {"role": "system", "content": """You are an expert technical evaluator.
Rate the technical accuracy of this interview response on a scale of 0.0 to 1.0.

Consider:
- Correctness of technical information
- Relevance to the question
- Appropriate depth for the role
- Use of proper terminology

Output ONLY a number between 0.0 and 1.0."""},
        {"role": "user", "content": f"""
Question: {question}

Candidate Response: {response}

Required Skills for Role: {', '.join(skills)}

Technical accuracy score (0.0-1.0):"""}
    ]
    
    try:
        result = await provider.generate(messages, temperature=0.1, max_tokens=10)
        score = float(result.strip())
        return max(0.0, min(1.0, score))
    except Exception:
        # Fallback: use basic heuristics
        word_count = len(response.split())
        if word_count < 20:
            return 0.3
        elif word_count < 50:
            return 0.5
        else:
            return 0.6


async def evaluate_depth(response: str, question: str) -> float:
    """
    Evaluate depth of understanding shown in response.
    
    Looks for:
    - Examples and specifics
    - Trade-off discussion
    - Edge case consideration
    - Real-world experience references
    """
    response_lower = response.lower()
    
    depth_indicators = {
        "example": 0.1,
        "for instance": 0.1,
        "specifically": 0.1,
        "trade-off": 0.15,
        "trade off": 0.15,
        "complexity": 0.1,
        "edge case": 0.15,
        "exception": 0.1,
        "in production": 0.15,
        "in my experience": 0.1,
        "we implemented": 0.1,
        "we built": 0.1,
        "challenge": 0.1,
        "solution": 0.1,
        "approach": 0.1,
        "alternative": 0.1,
    }
    
    base_score = 0.3
    for indicator, weight in depth_indicators.items():
        if indicator in response_lower:
            base_score += weight
    
    return min(1.0, base_score)


async def evaluate_response(
    response: str,
    question: str,
    stage: str,
    job_context: dict,
) -> dict:
    """
    Complete evaluation of a candidate response.
    
    Combines:
    - Confidence analysis (linguistic signals)
    - Clarity assessment
    - Technical accuracy (LLM-assisted)
    - Depth evaluation
    
    Args:
        response: Candidate's response text
        question: The question that was asked
        stage: Interview stage (warmup, technical, deep_dive)
        job_context: Job details for contextual evaluation
        
    Returns:
        EvaluationResult as dict
    """
    # Parallel evaluation of different aspects
    confidence_result = await analyze_confidence(response)
    clarity = await evaluate_clarity(response)
    
    # Technical and depth are more important in later stages
    if stage == "warmup":
        technical = 0.5  # Not heavily weighted in warmup
        depth = await evaluate_depth(response, question)
    else:
        technical = await evaluate_technical_accuracy(response, question, job_context)
        depth = await evaluate_depth(response, question)
    
    return {
        "confidence": confidence_result["confidence"],
        "clarity": clarity,
        "technical": technical,
        "depth": depth,
        "hesitation_ratio": confidence_result.get("hesitation_ratio"),
        "assertion_score": confidence_result.get("assertion_score"),
        "structure_score": confidence_result.get("structure_score"),
    }
