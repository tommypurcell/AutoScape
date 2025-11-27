import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://api.freepik.com/v1/resources"
headers = {
    "x-freepik-api-key": os.getenv("FREEPIK_API_KEY"),
    "Accept-Language": "en-US",
}

# Test search terms to see total available results
SEARCH_TERMS = [
    "ornamental tree full plant",
    "shrub bush whole plant landscaping",
    "ornamental grass full plant",
    "hedge plant full shape",
    "flowering tree whole plant",
    "evergreen tree full plant",
    "palm tree full plant",
    "bamboo plant full",
    "topiary plant full shape",
    "perennial plant full",
    "paving stone landscaping",
    "garden gravel texture",
    "landscape rock material",
    "brick paver landscaping",
    "concrete paver garden",
    "flagstone patio material",
    "mulch landscaping material",
    "decorative stone garden",
    "retaining wall stone",
    "garden edging material",
]

print("Checking total available results for each search term:\n")
print("=" * 80)

total_available = 0

for term in SEARCH_TERMS:
    params = {
        "term": term,
        "page": 1,
        "limit": 1,
        "order": "relevance",
        "filters[content_type][photo]": 1,
    }
    
    response = requests.get(API_URL, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        total = data.get("meta", {}).get("total", 0)
        total_available += total
        print(f"{term:45s} → {total:,} results")
    else:
        print(f"{term:45s} → ERROR {response.status_code}")

print("=" * 80)
print(f"\nTOTAL AVAILABLE ACROSS ALL SEARCH TERMS: {total_available:,} images")
print(f"\nNote: This is the sum across all categories. Some images may appear in multiple searches.")
