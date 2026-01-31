import asyncio
import sys
import os
from uuid import uuid4

# Add app to path
sys.path.append(os.getcwd())

from langchain_core.messages import AIMessage, HumanMessage
from app.langgraph.state import create_initial_state
from app.langgraph import get_interview_graph

async def main():
    try:
        interview_id = str(uuid4())
        print(f"Testing Interview ID: {interview_id}")
        
        print("--- initializing graph ---")
        graph = get_interview_graph()
        
        state = create_initial_state(interview_id, "job1", "cand1")
        state["job_context"] = {
            "title": "Software Engineer", 
            "description": "Desc",
            "skills_required": ["Python"],
            "experience_required": 3
        }
        
        config = {"configurable": {"thread_id": interview_id}}
        
        print("--- STARTING ---")
        res1 = await graph.ainvoke(state, config)
        print("--- STARTED ---")
        print(f"Question 1: {res1.get('current_question')}")
        
    except Exception as e:
        print(f"START FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc(file=sys.stdout)
        return

    # 2. Submit Audio (Turn 1)
    try:
        print("--- SUBMITTING 1 ---")
        
        update = {
            "messages": [HumanMessage(content="This is my answer about Python.")],
            "last_response": "This is my answer about Python.",
            "pending_response": False
        }
        
        print(f"Updating state...")
        await graph.update_state(config, update)
        print("State updated.")
        
        print("Resuming graph...")
        # TRYING WITH EMPTY DICT
        res2 = await graph.ainvoke({}, config)
        print("--- SUBMITTED 1 ---")
        print(f"Question 2: {res2.get('current_question')}")
        
    except Exception as e:
        print(f"SUBMIT FAILED: {type(e).__name__}: {e}")
        import traceback
        with open("traceback.log", "w") as f:
            traceback.print_exc(file=f)

if __name__ == "__main__":
    asyncio.run(main())
