import asyncio
import os
import sys
from bson import ObjectId

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "app"))

# Mock DB connection or use pymongo directly
import motor.motor_asyncio


async def check_application():
    try:
        # Connect to MongoDB
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
        db = client["interview_platform"]

        app_id = "697e8efcb0e594faa32a30d9"

        # Try to find by string ID or ObjectId
        try:
            query = {"_id": ObjectId(app_id)}
        except:
            query = {"_id": app_id}

        print(f"Searching for {query}...")
        application = await db.applications.find_one(query)

        if application:
            print("--- APPLICATION FOUND ---")
            print(f"Status: {application.get('status')}")
            print(f"Resume URL: {application.get('resume_url')}")
            print(f"Resume Score: {application.get('resume_match_score')}")
            print(f"Resume Analysis: {application.get('resume_screening_analysis')}")
            print(f"Interview Scores: {application.get('interview_scores')}")

            # Check if resume text exists
            resume_text = application.get("resume_text")
            print(f"Resume Text Length: {len(resume_text) if resume_text else 0}")
        else:
            # List mostly recent applications to help debug
            print("--- APPLICATION NOT FOUND ---")
            print("Recent applications:")
            async for app in db.applications.find().sort("created_at", -1).limit(5):
                print(
                    f"ID: {app['_id']}, Name: {app.get('candidate_name')}, Score: {app.get('resume_match_score')}"
                )

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(check_application())
