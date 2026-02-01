import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "app"))

import motor.motor_asyncio
from bson import ObjectId


async def list_apps():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["interview_platform"]

    print("Listing all applications (newest first):")
    async for app in db.applications.find().sort("created_at", -1).limit(5):
        print(
            f"ID: {str(app['_id'])} | Name: {app.get('candidate_name')} | Created: {app.get('created_at')} | ResumeScore: {app.get('resume_match_score')}"
        )


if __name__ == "__main__":
    asyncio.run(list_apps())
