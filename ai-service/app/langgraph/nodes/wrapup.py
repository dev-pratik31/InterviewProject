"""
Wrapup Interview Node

Closing phase of the interview.
Allows candidate questions and covers final topics.
"""

from datetime import datetime

from app.langgraph.state import InterviewState
from app.llm import get_provider
from app.utils.prompts import WRAPUP_PROMPT


async def wrapup_node(state: InterviewState) -> dict:
    """
    Interview wrapup phase.
    
    Actions:
    1. Ask closing questions
    2. Give candidate opportunity to ask questions
    3. Summarize next steps
    
    Returns:
        State updates
    """
    if state["pending_response"]:
        return {}
    
    questions_in_stage = state["questions_in_stage"]
    
    # First wrapup question - candidate questions
    if questions_in_stage == 0:
        closing = (
            "We've covered a lot of ground today. Before we wrap up, "
            "do you have any questions about the role, the team, or the company?"
        )
        
        return {
            "current_question": closing,
            "messages": [{
                "role": "assistant",
                "content": closing,
                "timestamp": datetime.utcnow().isoformat(),
                "evaluation": None,
            }],
            "pending_response": True,
            "questions_asked": state["questions_asked"] + 1,
            "questions_in_stage": 1,
            "last_response": None,
        }
    
    # Second wrapup - closing statement
    if questions_in_stage == 1:
        llm = get_provider()
        
        messages = [
            {"role": "system", "content": WRAPUP_PROMPT},
            {"role": "user", "content": f"""
Job Title: {state["job_context"]["title"]}
Company: {state["job_context"]["company_name"]}

Candidate's question:
{state.get("last_response", "No questions")}

Generate a warm, professional closing statement that:
1. Thanks the candidate for their time
2. Briefly addresses their question if they asked one
3. Explains next steps (HR will be in touch)
4. Wishes them well

Keep it concise and friendly.
"""}
        ]
        
        closing = await llm.generate(messages, temperature=0.7)
        
        return {
            "current_question": closing,
            "messages": [{
                "role": "assistant",
                "content": closing,
                "timestamp": datetime.utcnow().isoformat(),
                "evaluation": None,
            }],
            "pending_response": False,  # No response needed
            "questions_in_stage": 2,
            "last_response": None,
        }
    
    # Ready for feedback
    return {
        "questions_in_stage": 2,
    }
