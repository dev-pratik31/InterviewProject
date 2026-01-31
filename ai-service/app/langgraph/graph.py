"""
LangGraph Interview Graph

Defines the state machine for AI-led interviews.
Each node represents a distinct interview phase.
Transitions are conditional based on evaluation signals.
"""

from typing import Literal

from langgraph.graph import StateGraph, END

from app.langgraph.state import InterviewState
from app.langgraph.nodes.load_context import load_context_node
from app.langgraph.nodes.warmup import warmup_node
from app.langgraph.nodes.technical import technical_node
from app.langgraph.nodes.deep_dive import deep_dive_node
from app.langgraph.nodes.wrapup import wrapup_node
from app.langgraph.nodes.feedback import feedback_node
from app.config import settings


def should_advance_from_warmup(state: InterviewState) -> Literal["technical", "warmup"]:
    """
    Determine if candidate should advance from warmup to technical.
    
    Conditions to advance:
    - confidence >= 0.6
    - clarity >= 0.6
    - At least 2 questions asked
    """
    if state["should_advance"]:
        return "technical"
    
    if (
        state["avg_confidence"] >= settings.confidence_threshold_advance and
        state["avg_clarity"] >= settings.clarity_threshold_advance and
        state["questions_in_stage"] >= 2
    ):
        return "technical"
    
    # Check if max questions reached
    if state["questions_in_stage"] >= state["max_questions_per_stage"]:
        return "technical"
    
    return "warmup"


def should_advance_from_technical(state: InterviewState) -> Literal["deep_dive", "wrapup", "technical"]:
    """
    Determine if candidate should advance from technical to deep dive or wrapup.
    
    Conditions for deep dive:
    - technical >= 0.7
    - confidence trend improving or stable
    
    Conditions for wrapup:
    - fatigue detected
    - max questions reached
    - struggle count >= 3
    """
    if state["fatigue_detected"] or state["struggle_count"] >= 3:
        return "wrapup"
    
    if state["questions_in_stage"] >= state["max_questions_per_stage"]:
        if state["avg_technical"] >= settings.technical_threshold_deep_dive:
            return "deep_dive"
        return "wrapup"
    
    if (
        state["avg_technical"] >= settings.technical_threshold_deep_dive and
        state["confidence_trend"] in ["improving", "stable"] and
        state["questions_in_stage"] >= 3
    ):
        return "deep_dive"
    
    return "technical"


def should_advance_from_deep_dive(state: InterviewState) -> Literal["wrapup", "deep_dive"]:
    """
    Determine if deep dive should continue or move to wrapup.
    """
    if state["fatigue_detected"]:
        return "wrapup"
    
    if state["struggle_count"] >= 2:
        return "wrapup"
    
    if state["questions_in_stage"] >= state["max_questions_per_stage"]:
        return "wrapup"
    
    if state["questions_asked"] >= state["max_total_questions"]:
        return "wrapup"
    
    return "deep_dive"


def should_continue_after_wrapup(state: InterviewState) -> Literal["feedback", "wrapup"]:
    """
    Determine if wrapup is complete.
    """
    if state["questions_in_stage"] >= 2:
        return "feedback"
    return "wrapup"


def build_interview_graph() -> StateGraph:
    """
    Build the LangGraph state machine for interviews.
    
    Graph Structure:
    
    START → load_context → warmup ─┬→ technical ─┬→ deep_dive ─┬→ wrapup → feedback → END
                           ↑       │      ↑       │      ↑       │
                           └───────┘      └───────┘      └───────┘
                         (loop until    (loop until    (loop until
                          advance)        advance)       advance)
    
    Returns:
        Compiled StateGraph
    """
    # Create graph with state schema
    graph = StateGraph(InterviewState)
    
    # Add nodes
    graph.add_node("load_context", load_context_node)
    graph.add_node("warmup", warmup_node)
    graph.add_node("technical", technical_node)
    graph.add_node("deep_dive", deep_dive_node)
    graph.add_node("wrapup", wrapup_node)
    graph.add_node("feedback", feedback_node)
    
    # Set entry point
    graph.set_entry_point("load_context")
    
    # Add edges
    # load_context always goes to warmup
    graph.add_edge("load_context", "warmup")
    
    # Warmup conditional
    graph.add_conditional_edges(
        "warmup",
        should_advance_from_warmup,
        {
            "technical": "technical",
            "warmup": "warmup",
        }
    )
    
    # Technical conditional
    graph.add_conditional_edges(
        "technical",
        should_advance_from_technical,
        {
            "deep_dive": "deep_dive",
            "wrapup": "wrapup",
            "technical": "technical",
        }
    )
    
    # Deep dive conditional
    graph.add_conditional_edges(
        "deep_dive",
        should_advance_from_deep_dive,
        {
            "wrapup": "wrapup",
            "deep_dive": "deep_dive",
        }
    )
    
    # Wrapup conditional
    graph.add_conditional_edges(
        "wrapup",
        should_continue_after_wrapup,
        {
            "feedback": "feedback",
            "wrapup": "wrapup",
        }
    )
    
    # Feedback goes to END
    graph.add_edge("feedback", END)
    
    return graph


def compile_interview_graph():
    """
    Compile the interview graph for execution.
    
    Returns:
        Compiled graph ready for invocation
    """
    graph = build_interview_graph()
    return graph.compile()


# Compiled graph singleton
_compiled_graph = None


def get_interview_graph():
    """Get or create compiled interview graph."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = compile_interview_graph()
    return _compiled_graph
