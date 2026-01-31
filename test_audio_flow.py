
import requests
import time
import os

BASE_URL = "http://localhost:8000/api/v1"
AUDIO_FILE = "C:\\Windows\\Media\\tada.wav"

def test_flow():
    print("1. Starting interview...")
    try:
        resp = requests.post(f"{BASE_URL}/ai/interview/start-with-audio", json={
            "job_id": "demo",
            "candidate_id": "test-user",
            "candidate_name": "Test User"
        })
        if resp.status_code != 200:
            print(f"FAILED to start interview: {resp.status_code} {resp.text}")
            return
    except Exception as e:
        print(f"CONNECTION ERROR to backend: {e}")
        return

    data = resp.json()
    interview_id = data.get("interview_id")
    print(f"SUCCESS. Interview ID: {interview_id}")
    print(f"Initial Audio URL: {data.get('audio_url')}")

    print("\n2. Submitting audio response...")
    if not os.path.exists(AUDIO_FILE):
        print(f"Audio file not found at {AUDIO_FILE}")
        return

    try:
        with open(AUDIO_FILE, "rb") as f:
            files = {"audio": ("test.wav", f, "audio/wav")}
            start_time = time.time()
            resp = requests.post(
                f"{BASE_URL}/ai/interview/{interview_id}/submit-audio",
                files=files
            )
            duration = time.time() - start_time
            
        print(f"Request took {duration:.2f} seconds")
        
        if resp.status_code == 200:
            result = resp.json()
            print("SUCCESS!")
            print(f"Transcript: {result.get('transcript')}")
            print(f"Next Question: {result.get('next_question')}")
            print(f"Audio URL: {result.get('audio_url')}")
        else:
            print(f"FAILED: {resp.status_code} {resp.text}")
            
    except Exception as e:
        print(f"ERROR submitting audio: {e}")

if __name__ == "__main__":
    test_flow()
