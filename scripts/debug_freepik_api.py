import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://api.freepik.com/v1/resources"

headers = {
    "x-freepik-api-key": os.getenv("FREEPIK_API_KEY"),
    "Accept-Language": "en-US",
}

params = {
    "term": "ornamental tree",
    "page": 1,
    "limit": 2,
    "order": "relevance",
    "filters[content_type][photo]": 1,
}

response = requests.get(API_URL, headers=headers, params=params)

if response.status_code == 200:
    data = response.json()
    print(json.dumps(data, indent=2))
else:
    print(f"Error {response.status_code}: {response.text}")
