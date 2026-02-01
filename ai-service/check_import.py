import sys
import os

# Add ai-service to path
sys.path.append(os.getcwd())

try:
    print("Attempting to import app.api.resume_screener...")
    from app.api import resume_screener

    print("Import SUCCESS")
    print(f"Router prefix: {resume_screener.router.prefix}")
except Exception as e:
    print(f"Import FAILED: {e}")
    import traceback

    traceback.print_exc()
