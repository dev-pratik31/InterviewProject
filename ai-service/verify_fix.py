import httpx
import asyncio
import io

BASE_URL = "http://localhost:8001/ai/interview"


async def test_flow():
    async with httpx.AsyncClient() as client:
        # 1. Start Interview (Audio)
        print("1. Starting Interview with Audio...")
        try:
            resp = await client.post(
                f"{BASE_URL}/start-with-audio",
                json={"job_id": "test-job", "candidate_id": "test-cand"},
            )
            if resp.status_code != 200:
                print(f"   Failed to start: {resp.status_code} - {resp.text}")
                return
            data = resp.json()
            interview_id = data["interview_id"]
            print(f"   Success! ID: {interview_id}")
        except Exception as e:
            print(f"   Failed to start: {e}")
            return

        # 2. Submit Audio (using empty bytes as mock)
        print(f"\n2. Submitting Audio to {interview_id}...")
        try:
            # Create a dummy audio file (1 second of silence or just bytes)
            # Wav header or just random bytes might fail if stt checks format,
            # but let's try sending *something*
            files = {"audio": ("test.webm", b"fake_audio_bytes", "audio/webm")}

            resp = await client.post(
                f"{BASE_URL}/{interview_id}/submit-audio", files=files
            )
            # verify we don't get 404 (400 or 422 is fine if audio is bad, but 404 is bad)
            print(f"   Status Code: {resp.status_code}")
            if resp.status_code == 404:
                print("   FAILED: Endpoint or Session not found (404)")
            elif resp.status_code == 200:
                print("   Success! Audio accepted.")
            else:
                print(f"   Response: {resp.text}")

        except Exception as e:
            print(f"   Failed to submit: {e}")


if __name__ == "__main__":
    asyncio.run(test_flow())
