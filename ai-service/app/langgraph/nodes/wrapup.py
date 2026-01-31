"""
Wrapup Node

Final phase of the interview.
Allows candidate questions and closing remarks.
"""

from datetime import datetime

from langchain_core.messages import AIMessage, HumanMessage

from app.langgraph.state import InterviewState
from app.llm import get_provider
from app.config import settings


def get_message_content(message) -> str:
    """Extract content from either a dict or LangChain message object."""
    if hasattr(message, "content"):
        return message.content
    elif isinstance(message, dict):
        return message.get("content", "")
    return str(message)


def is_assistant_message(message) -> bool:
    """Check if message is from assistant/AI."""
    if hasattr(message, "type"):
        return message.type == "ai"
    elif isinstance(message, dict):
        return message.get("role") == "assistant"
    return False


WRAPUP_PROMPT = """You are concluding a technical interview. Your role is to:
1. Thank the candidate for their time
2. Ask if they have any questions about the role or company
3. Provide a brief, encouraging closing

Keep responses warm and professional."""


async def wrapup_node(state: InterviewState) -> dict:
    """
    Wrapup phase of the interview.

    Actions:
    1. Thank candidate
    2. Allow candidate questions
    3. Provide closing remarks

    Returns:
        State updates
    """
    updates = {}

    # Check if we're waiting for candidate response
    if state["pending_response"]:
        return {}

    # Check if wrapup is complete
    if state["questions_in_stage"] >= 2:
        # Generate closing message
        closing = (
            "Thank you so much for taking the time to interview with us today. "
            "You've given us a lot of great insights into your experience and skills. "
            "We'll be reviewing all candidates and will be in touch soon with next steps. "
            "Have a great rest of your day!"
        )

        new_message = AIMessage(content=closing)

        return {
            "current_question": closing,
            "messages": [new_message],
            "current_stage": "complete",
            "pending_response": False,
        }

    # Generate wrapup question/message
    llm = get_provider()

    if state["questions_in_stage"] == 0:
        # First wrapup message - transition and ask for questions
        message = (
            "We're coming to the end of our interview. Before we wrap up, "
            "I want to thank you for your thoughtful responses throughout our conversation. "
            "Do you have any questions for me about the role, the team, or the company?"
        )
    else:
        # Respond to candidate's question if they had one
        last_response = state.get("last_response", "")

        messages = [
            {"role": "system", "content": WRAPUP_PROMPT},
            {
                "role": "user",
                "content": f"""
The candidate asked or said: "{last_response}"

Job context:
- Title: {state["job_context"]["title"]}
- Company: {state["job_context"].get("company_name", "the company")}

Provide a helpful response to their question or comment, then ask if they have any other questions.
Keep it concise and professional.
""",
            },
        ]

        message = await llm.generate(messages, temperature=0.7)

    # Create message using AIMessage
    new_message = AIMessage(content=message)

    return {
        **updates,
        "current_question": message,
        "messages": [new_message],
        "pending_response": True,
        "questions_in_stage": state["questions_in_stage"] + 1,
        "last_response": None,
    }
