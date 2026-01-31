"""
Evaluation Rubric

Defines scoring criteria and thresholds for interview assessment.
"""

from typing import Literal


# ===========================
# SCORE DEFINITIONS
# ===========================

SCORE_DEFINITIONS = {
    "confidence": {
        "0.0-0.3": "Very hesitant, uncertain language, incomplete thoughts",
        "0.3-0.5": "Some hesitation, mixed confidence signals",
        "0.5-0.7": "Generally confident, occasional hedging",
        "0.7-0.9": "Confident and clear assertions",
        "0.9-1.0": "Very confident, authoritative communication",
    },
    "clarity": {
        "0.0-0.3": "Unclear, rambling, hard to follow",
        "0.3-0.5": "Somewhat clear but lacks structure",
        "0.5-0.7": "Clear communication with good structure",
        "0.7-0.9": "Very clear, well-organized responses",
        "0.9-1.0": "Exceptionally clear and concise",
    },
    "technical": {
        "0.0-0.3": "Significant gaps, incorrect information",
        "0.3-0.5": "Basic understanding, some gaps",
        "0.5-0.7": "Solid technical knowledge",
        "0.7-0.9": "Strong technical depth",
        "0.9-1.0": "Expert-level technical mastery",
    },
    "depth": {
        "0.0-0.3": "Surface-level only",
        "0.3-0.5": "Some examples, limited depth",
        "0.5-0.7": "Good examples and considerations",
        "0.7-0.9": "Deep understanding with trade-offs",
        "0.9-1.0": "Comprehensive expertise demonstrated",
    },
}


# ===========================
# RECOMMENDATION THRESHOLDS
# ===========================

RECOMMENDATION_CRITERIA = {
    "strong_hire": {
        "min_technical": 0.8,
        "min_overall": 0.75,
        "description": "Exceptional candidate, clear hire",
    },
    "hire": {
        "min_technical": 0.65,
        "min_overall": 0.6,
        "description": "Good candidate, recommend hiring",
    },
    "maybe": {
        "min_technical": 0.45,
        "min_overall": 0.45,
        "description": "Borderline, needs discussion",
    },
    "no_hire": {
        "min_technical": 0.0,
        "min_overall": 0.0,
        "description": "Does not meet requirements",
    },
}


def get_recommendation(
    avg_technical: float,
    avg_confidence: float,
    avg_clarity: float,
) -> Literal["strong_hire", "hire", "maybe", "no_hire"]:
    """
    Determine hiring recommendation based on scores.
    
    Args:
        avg_technical: Average technical score (0-1)
        avg_confidence: Average confidence score (0-1)
        avg_clarity: Average clarity score (0-1)
        
    Returns:
        Recommendation string
    """
    overall = (
        avg_technical * 0.5 +
        avg_clarity * 0.25 +
        avg_confidence * 0.25
    )
    
    for rec in ["strong_hire", "hire", "maybe", "no_hire"]:
        criteria = RECOMMENDATION_CRITERIA[rec]
        if (
            avg_technical >= criteria["min_technical"] and
            overall >= criteria["min_overall"]
        ):
            return rec
    
    return "no_hire"


def get_score_description(score_type: str, score: float) -> str:
    """
    Get human-readable description for a score.
    
    Args:
        score_type: Type of score (confidence, clarity, technical, depth)
        score: Score value (0-1)
        
    Returns:
        Description string
    """
    definitions = SCORE_DEFINITIONS.get(score_type, {})
    
    for range_str, description in definitions.items():
        low, high = map(float, range_str.split("-"))
        if low <= score <= high:
            return description
    
    return "Score out of range"


# ===========================
# STAGE WEIGHTS
# ===========================

STAGE_WEIGHTS = {
    "warmup": {
        "confidence": 0.4,
        "clarity": 0.4,
        "technical": 0.1,
        "depth": 0.1,
    },
    "technical": {
        "confidence": 0.2,
        "clarity": 0.2,
        "technical": 0.4,
        "depth": 0.2,
    },
    "deep_dive": {
        "confidence": 0.15,
        "clarity": 0.15,
        "technical": 0.35,
        "depth": 0.35,
    },
}


def calculate_stage_score(
    confidence: float,
    clarity: float,
    technical: float,
    depth: float,
    stage: str,
) -> float:
    """
    Calculate weighted score for a specific stage.
    
    Different stages weight dimensions differently:
    - Warmup: Communication focus
    - Technical: Technical accuracy focus
    - Deep Dive: Depth and technical focus
    """
    weights = STAGE_WEIGHTS.get(stage, STAGE_WEIGHTS["technical"])
    
    return (
        confidence * weights["confidence"] +
        clarity * weights["clarity"] +
        technical * weights["technical"] +
        depth * weights["depth"]
    )
