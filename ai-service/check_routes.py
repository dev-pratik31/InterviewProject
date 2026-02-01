import requests
import json


def list_routes():
    url = "http://localhost:8001/openapi.json"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            paths = data.get("paths", {}).keys()
            print(f"Total Routes: {len(paths)}")
            print("routes like 'resume':")
            for p in sorted(paths):
                if "resume" in p:
                    print(f" - {p}")
        else:
            print(f"Failed to get docs: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    list_routes()
