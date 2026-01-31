import asyncio
import sys
# Try imports
try:
    from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
    print("AsyncSqliteSaver found")
except ImportError:
    print("AsyncSqliteSaver NOT found")

try:
    from langgraph.checkpoint.memory import MemorySaver
    m = MemorySaver()
    print(f"MemorySaver: {m}")
    print(f"Has aget? {hasattr(m, 'aget')}")
except ImportError:
    print("MemorySaver NOT found")

async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
