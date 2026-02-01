"""
One-time script to add resume screening to existing application
"""

import asyncio
import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.database.mongodb import MongoDB
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import List


class ResumeScreeningResponse(BaseModel):
    score: int = Field(..., description="Match score from 0 to 100")
    strengths: List[str] = Field(..., description="List of matching strengths")
    gaps: List[str] = Field(..., description="List of missing skills or gaps")
    transferable_skills: List[str] = Field(..., description="Skills that transfer well")
    summary: str = Field(..., description="Recruiter-friendly summary")


SYSTEM_PROMPT = """
You are an expert technical recruiter and hiring manager assistant.
Your task is to analyze a candidate's resume against a specific Job Description (JD).

GOAL: Provide a fair, objective, and structured screening report.
- Score the match from 0 to 100 based on REQUIRED skills and experience.
- Identify clear STRENGTHS (direct matches).
- Identify GAPS (missing requirements).
- Identify TRANSFERABLE SKILLS (adjacent technologies or soft skills).
- Write a concise SUMMARY for the hiring manager.

RULES:
- Be objective. Do not hallucinate skills not present in the resume.
- If the resume is very short or irrelevant, give a low score.
- The summary should be professional and neutral.
- Score < 50: Poor match
- Score 50-70: Potential match with gaps
- Score 70-85: Strong match
- Score > 85: Exceptional match
"""


async def fix_application():
    await MongoDB.connect()
    db = MongoDB.get_database()

    try:
        application_id = "697eb03e1f64259f6a779904"

        print(f"🔍 Loading application {application_id}...")
        application = await db.applications.find_one({"_id": ObjectId(application_id)})

        if not application:
            print("❌ Application not found")
            return

        if application.get("resume_screening_analysis"):
            print("ℹ️  Application already has analysis")
            return

        resume_url = application.get("resume_url")
        if not resume_url:
            print("❌ No resume URL")
            return

        # Parse resume
        from app.utils.resume_parser import parse_resume_content

        print(f"📄 Parsing resume from: {resume_url}")
        resume_data = parse_resume_content(resume_url)

        if not resume_data["success"]:
            print(f"❌ Failed to parse resume: {resume_data.get('error')}")
            return

        resume_text = resume_data["text"]
        print(f"✅ Resume parsed: {len(resume_text)} characters")

        # Get job
        job = await db.jobs.find_one({"_id": application["job_id"]})
        if not job or not job.get("description"):
            print("❌ Job not found or no description")
            return

        print(f"📋 Job: {job.get('title')}")

        # Run AI analysis
        print("🤖 Running AI analysis...")

        try:
            from anthropic import Anthropic

            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                print("❌ ANTHROPIC_API_KEY not set in environment")
                return

            client = Anthropic(api_key=api_key)

            # Call Claude API
            message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                temperature=0.1,
                system=SYSTEM_PROMPT,
                messages=[
                    {
                        "role": "user",
                        "content": f"""
JOB DESCRIPTION:
{job["description"]}

RESUME CONTENT:
{resume_text}

Analyze the resume and provide the structured report in JSON format with these fields:
- score (integer 0-100)
- strengths (array of strings)
- gaps (array of strings)  
- transferable_skills (array of strings)
- summary (string)

Return ONLY valid JSON, no markdown formatting.
""",
                    }
                ],
            )

            # Parse response
            response_text = message.content[0].text

            # Try to extract JSON from response
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            else:
                # Assume entire response is JSON
                json_text = response_text.strip()

            result_dict = json.loads(json_text)
            result = ResumeScreeningResponse(**result_dict)

        except Exception as e:
            print(f"❌ AI call failed: {e}")
            import traceback

            traceback.print_exc()
            return

        print(f"✅ Analysis complete! Score: {result.score}/100")

        # Update application
        update_data = {
            "resume_screening_analysis": {
                "score": result.score,
                "strengths": result.strengths,
                "gaps": result.gaps,
                "transferable_skills": result.transferable_skills,
                "summary": result.summary,
            },
            "resume_match_score": result.score / 100.0,
        }

        await db.applications.update_one(
            {"_id": ObjectId(application_id)}, {"$set": update_data}
        )

        print("✅ Application updated successfully!")
        print(f"   Score: {result.score}/100")
        print(f"   Strengths: {len(result.strengths)}")
        print(f"   Gaps: {len(result.gaps)}")
        print(f"   Transferable: {len(result.transferable_skills)}")
        print(f"\n   Summary: {result.summary[:100]}...")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()
    finally:
        await MongoDB.disconnect()


if __name__ == "__main__":
    asyncio.run(fix_application())
