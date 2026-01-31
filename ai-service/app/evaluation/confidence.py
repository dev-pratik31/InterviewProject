"""
Confidence Evaluation

Extracts confidence signals from candidate responses.
Uses linguistic analysis only - NO emotion detection.
"""

import re
from typing import Optional

from pydantic import BaseModel, Field

from app.llm import get_provider
from app.utils.prompts import CONFIDENCE_ANALYSIS_PROMPT


class ConfidenceSignals(BaseModel):
    """Extracted confidence indicators."""
    hesitation_ratio: float = Field(..., ge=0, le=1)
    assertion_score: float = Field(..., ge=0, le=1)
    structure_score: float = Field(..., ge=0, le=1)
    

# Hesitation markers (linguistic only)
HESITATION_PATTERNS = [
    r"\bi think\b",
    r"\bmaybe\b",
    r"\bperhaps\b",
    r"\bprobably\b",
    r"\bnot sure\b",
    r"\bi guess\b",
    r"\bsorry\b",
    r"\bum+\b",
    r"\buh+\b",
    r"\blike\b",  # filler
    r"\byou know\b",
    r"\bkind of\b",
    r"\bsort of\b",
    r"\bi believe\b",  # less certain than "I know"
]

# Assertion markers (confident language)
ASSERTION_PATTERNS = [
    r"\bi know\b",
    r"\bi am certain\b",
    r"\bi am confident\b",
    r"\bdefinitely\b",
    r"\bclearly\b",
    r"\bobviously\b",
    r"\bspecifically\b",
    r"\bin my experience\b",
    r"\bi have implemented\b",
    r"\bi built\b",
    r"\bi led\b",
    r"\bi designed\b",
]


def count_patterns(text: str, patterns: list[str]) -> int:
    """Count occurrences of regex patterns in text."""
    text_lower = text.lower()
    total = 0
    for pattern in patterns:
        matches = re.findall(pattern, text_lower)
        total += len(matches)
    return total


def calculate_hesitation_ratio(response: str) -> float:
    """
    Calculate ratio of hesitation markers to total words.
    
    Returns:
        Hesitation ratio (0 = very confident, 1 = very hesitant)
    """
    words = response.split()
    if not words:
        return 0.5
    
    hesitations = count_patterns(response, HESITATION_PATTERNS)
    
    # Normalize by word count
    ratio = hesitations / len(words)
    
    # Cap at 0.5 max (even very hesitant responses don't go to 1.0)
    return min(ratio * 10, 1.0)  # Scale up for sensitivity


def calculate_assertion_score(response: str) -> float:
    """
    Calculate assertion strength from confident language markers.
    
    Returns:
        Assertion score (0 = no assertions, 1 = very assertive)
    """
    words = response.split()
    if not words:
        return 0.5
    
    assertions = count_patterns(response, ASSERTION_PATTERNS)
    
    # Score based on presence of assertions
    if assertions == 0:
        return 0.3
    elif assertions <= 2:
        return 0.5
    elif assertions <= 4:
        return 0.7
    else:
        return 0.9


def calculate_structure_score(response: str) -> float:
    """
    Evaluate structural organization of response.
    
    Looks for:
    - Paragraph breaks or logical sections
    - Numbered points or bullet-style organization
    - Clear intro/body/conclusion pattern
    
    Returns:
        Structure score (0 = unstructured, 1 = well-structured)
    """
    # Check for structural elements
    has_numbers = bool(re.search(r'\d+[\.\):]', response))
    has_bullets = bool(re.search(r'[-•*]\s', response))
    has_paragraphs = response.count('\n\n') > 0 or response.count('. ') > 3
    
    # Check for transition words (indicates logical flow)
    transitions = [
        r'\bfirst(ly)?\b', r'\bsecond(ly)?\b', r'\bthird(ly)?\b',
        r'\bthen\b', r'\bnext\b', r'\bfinally\b',
        r'\bfor example\b', r'\bspecifically\b',
        r'\bin conclusion\b', r'\bto summarize\b',
        r'\bhowever\b', r'\balso\b', r'\badditionally\b',
    ]
    transition_count = count_patterns(response, transitions)
    
    # Calculate score
    score = 0.3  # Base score
    
    if has_numbers or has_bullets:
        score += 0.3
    if has_paragraphs:
        score += 0.2
    if transition_count >= 2:
        score += 0.2
    
    return min(score, 1.0)


async def analyze_confidence(response: str) -> dict:
    """
    Analyze confidence signals in a candidate response.
    
    Combines rule-based pattern matching with LLM analysis
    for robust confidence scoring.
    
    Args:
        response: Candidate's response text
        
    Returns:
        dict with confidence metrics
    """
    # Rule-based analysis
    hesitation_ratio = calculate_hesitation_ratio(response)
    assertion_score = calculate_assertion_score(response)
    structure_score = calculate_structure_score(response)
    
    # Calculate base confidence
    # Higher hesitation = lower confidence
    # Higher assertion = higher confidence
    base_confidence = (
        0.25 * (1 - hesitation_ratio) +
        0.35 * assertion_score +
        0.20 * structure_score +
        0.20 * 0.5  # Placeholder for semantic depth
    )
    
    return {
        "confidence": round(base_confidence, 3),
        "hesitation_ratio": round(hesitation_ratio, 3),
        "assertion_score": round(assertion_score, 3),
        "structure_score": round(structure_score, 3),
        "analysis_method": "rule_based",
    }


async def analyze_confidence_with_llm(response: str) -> dict:
    """
    Analyze confidence using LLM for more nuanced understanding.
    
    Used as secondary analysis for edge cases.
    """
    provider = get_provider()
    
    messages = [
        {"role": "system", "content": CONFIDENCE_ANALYSIS_PROMPT.format(response=response)},
        {"role": "user", "content": "Analyze the confidence level and provide a score from 0.0 to 1.0."}
    ]
    
    try:
        result = await provider.generate(messages, temperature=0.2, max_tokens=200)
        
        # Extract score from response
        score_match = re.search(r'(\d+\.?\d*)', result)
        if score_match:
            score = float(score_match.group(1))
            if score > 1:
                score = score / 10  # Handle if returned as percentage
            return {
                "confidence": min(max(score, 0), 1),
                "analysis_method": "llm",
                "raw_analysis": result[:200],
            }
    except Exception:
        pass
    
    # Fallback to rule-based
    return await analyze_confidence(response)
