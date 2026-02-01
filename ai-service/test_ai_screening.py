import requests
import json


def test_screen():
    # Note: The prefix is /ai/resume, so the full URL on localhost:8001 is /ai/resume/screen
    # If using API_PREFIX v1, check main.py. main.py doesn't seem to use prefix for includes.
    url = "http://localhost:8001/ai/resume/screen"

    payload = {
        "resume_text": "John Doe. Software Engineer. Python, React, FastAPI. 5 years experience.",
        "job_description": "We are looking for a Senior Software Engineer with Python and React experience.",
    }

    try:
        print(f"Sending request to {url}...")
        response = requests.post(url, json=payload)

        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response:")
            print(json.dumps(response.json(), indent=2))
        else:
            print("Error Response:")
            print(response.text)

    except Exception as e:
        print(f"Connection Error: {e}")
        print(
            "Make sure the AI Service is running on port 8001 (uvicorn app.main:app --port 8001)"
        )


if __name__ == "__main__":
    test_screen()
