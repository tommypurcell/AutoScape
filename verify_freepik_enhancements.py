from freepik_agent import FreepikLandscapingAgent
import json

def verify():
    print("🔍 Initializing Agent...")
    agent = FreepikLandscapingAgent()
    
    query = "ornamental tree"
    print(f"\n🔍 Searching for: '{query}'")
    
    results = agent.search_images(query, top_k=5)
    
    print(f"\nFound {len(results)} results:")
    for i, r in enumerate(results, 1):
        print(f"\n[{i}] {r['title']}")
        print(f"    Specific Name: {r.get('specific_name', 'N/A')}")
        print(f"    Price Est:     {r.get('price_estimate', 'N/A')}")
        print(f"    Score:         {r['score']:.3f}")
        
        # Verify removed fields
        removed = ["source", "likes", "downloads", "original_title"]
        found_removed = [f for f in removed if f in r]
        if found_removed:
            print(f"    ⚠️  Found removed fields: {found_removed}")
        else:
            print(f"    ✅ Cleaned (no source/likes/downloads)")

    if not results:
        print("\n⚠️  No results found yet. Ingestion might still be starting.")
        return

    print("\n🤖 Testing AI Recommendations...")
    rec = agent.get_recommendations(query, top_k=3)
    print("\nExplanation:")
    print(rec['explanation'])

if __name__ == "__main__":
    verify()
