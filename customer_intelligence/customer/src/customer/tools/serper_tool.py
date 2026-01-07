import os
import requests

SERPER_API_KEY = os.getenv("SERPER_API_KEY")

def search(query: str) -> str:
    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {"q": query, "num": 5}
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    response.raise_for_status()

    data = response.json()

    # Extract only meaningful text
    results = []
    for item in data.get("organic", []):
        title = item.get("title", "")
        snippet = item.get("snippet", "")
        results.append(f"{title}: {snippet}")

    # Return compact text, not JSON
    return "\n".join(results)
