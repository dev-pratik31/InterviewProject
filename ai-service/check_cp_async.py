import asyncio
import inspect
from langgraph.checkpoint.memory import MemorySaver

m = MemorySaver()
print(f"Has aget? {hasattr(m, 'aget')}")
print(f"Is aget coroutine? {inspect.iscoroutinefunction(m.aget)}")

# Helper to check if it returns awaitable
async def check():
    try:
        # Pass dummy args if needed, or catch arg error
        # aget(config)
        pass
    except:
        pass

if __name__ == "__main__":
    # Just inspect for now
    pass
