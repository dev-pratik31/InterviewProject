import asyncio
import sys
import os
from datetime import datetime

# Add app to path
sys.path.append(os.getcwd())

from langchain_core.messages import AIMessage, HumanMessage
from app.langgraph.nodes.feedback import feedback_node
from app.langgraph.state import InterviewState


async def test_feedback_node():
    print("--- Testing Feedback Node ---")

    # Mock state
    state = {
        "job_context": {
            "title": "Senior Python Developer",
            "company_name": "Tech Corp",
            "skills_required": ["Python", "FastAPI", "System Design"],
            "experience_required": 5,
        },
        "messages": [
            AIMessage(content="Tell me about a challenging system you designed."),
            HumanMessage(
                content="I built a distributed scale-out architecture using Kafka and Kubernetes. It was tricky to handle the partitioning strategy, but I decided to go with key-based partitioning to ensure ordering."
            ),
            AIMessage(
                content="That sounds interesting. How did you handle consumer lag?"
            ),
            HumanMessage(
                content="We implemented auto-scaling consumer groups. Basically, monitoring lag and spinning up new pods. I honestly wasn't sure if it would work at first, but we load tested it and it held up."
            ),
        ],
        "confidence_scores": [0.8, 0.7, 0.9],
        "clarity_scores": [0.9, 0.8, 0.9],
        "technical_scores": [0.8, 0.9, 0.9],
        "depth_scores": [0.7, 0.8, 0.8],
        "confidence_trend": "stable",
        "struggle_count": 0,
        "fatigue_detected": False,
        "questions_asked": 2,
    }

    try:
        print("Running feedback_node...")
        result = await feedback_node(state)

        feedback = result.get("final_feedback")
        print("\n--- Result Generated ---")
        if feedback:
            print(f"Recommendation: {feedback.get('recommendation')}")
            print(f"Summary: {feedback.get('overall_summary')[:100]}...")
            print(f"Role Alignment: {feedback.get('role_alignment')}")

            # success check
            required_keys = [
                "overall_summary",
                "communication_signals",
                "confidence_signals",
                "technical_signals",
                "adaptability_signals",
                "strengths",
                "opportunities",
                "role_alignment",
                "recommendation",
            ]

            missing = [k for k in required_keys if k not in feedback]
            if missing:
                print(f"FAILED: Missing keys: {missing}")
            else:
                print("SUCCESS: All required fields present.")
        else:
            print("FAILED: No feedback generated.")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_feedback_node())
