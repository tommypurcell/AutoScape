#!/usr/bin/env python3
"""
Plant RAG Pipeline Test
========================
End-to-end test of the plant RAG system.

Tests:
1. Agent initialization
2. Knowledge base search
3. Answer generation
4. Multiple test queries
5. Source citation verification
"""

import os
import sys
from dotenv import load_dotenv
from plant_agent import PlantRAGAgent


def test_plant_rag():
    """Test the complete plant RAG pipeline."""
    load_dotenv()
    
    print("=" * 80)
    print("🌱 PLANT RAG SYSTEM - END-TO-END TEST")
    print("=" * 80)
    
    # Check environment variables
    print("\n[Step 1] Checking environment...")
    required = {
        "QDRANT_URL": os.getenv("QDRANT_URL") or os.getenv("VITE_QUADRANT_ENDPOINT"),
        "QDRANT_API_KEY": os.getenv("QDRANT_API_KEY") or os.getenv("VITE_QUADRANT_API_KEY"),
        "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY"),
    }
    
    missing = [k for k, v in required.items() if not v]
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        return False
    
    print("✅ All environment variables set")
    
    # Initialize agent
    print("\n[Step 2] Initializing Plant RAG Agent...")
    try:
        agent = PlantRAGAgent(
            qdrant_url=required["QDRANT_URL"],
            qdrant_api_key=required["QDRANT_API_KEY"],
            gemini_api_key=required["GEMINI_API_KEY"],
            collection_name=os.getenv("PLANT_COLLECTION", "plant-knowledge")
        )
        print("✅ Agent initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize agent: {e}")
        return False
    
    # Test queries
    test_queries = [
        "How do I prevent tomato blight?",
        "What are the best practices for composting?",
        "How often should I water succulents?",
    ]
    
    print(f"\n[Step 3] Testing {len(test_queries)} queries...")
    print("-" * 80)
    
    all_passed = True
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n📝 Test Query {i}/{len(test_queries)}")
        print(f"Question: {query}")
        print()
        
        try:
            # Search knowledge base
            print("  🔍 Searching knowledge base...")
            sources = agent.search_knowledge(query, limit=3)
            
            if not sources:
                print("  ⚠️  No sources found - collection may be empty")
                all_passed = False
                continue
            
            print(f"  ✅ Found {len(sources)} relevant sources")
            
            # Show top source
            top_source = sources[0]
            print(f"  📚 Top source (score: {top_source.score:.2%}):")
            print(f"     Category: {top_source.category}")
            print(f"     Q: {top_source.question[:80]}...")
            print(f"     A: {top_source.answer[:100]}...")
            
            # Generate answer
            print("\n  🤖 Generating answer with Gemini...")
            result = agent.generate_answer(query, sources)
            
            print(f"  ✅ Answer generated (confidence: {result['confidence']:.2%})")
            print(f"\n  💡 Answer:")
            print(f"  {'-' * 76}")
            
            # Print answer with wrapping
            answer_lines = result['answer'].split('\n')
            for line in answer_lines:
                if len(line) <= 76:
                    print(f"  {line}")
                else:
                    # Simple word wrap
                    words = line.split()
                    current_line = "  "
                    for word in words:
                        if len(current_line) + len(word) + 1 <= 78:
                            current_line += word + " "
                        else:
                            print(current_line.rstrip())
                            current_line = "  " + word + " "
                    if current_line.strip():
                        print(current_line.rstrip())
            
            print(f"  {'-' * 76}")
            
        except Exception as e:
            print(f"  ❌ Test failed: {e}")
            all_passed = False
            import traceback
            traceback.print_exc()
    
    # Summary
    print("\n" + "=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED!")
        print("\n🎉 Plant RAG system is working correctly!")
        print("\nNext steps:")
        print("  • Start the API: python plant_api.py")
        print("  • Test the endpoint: curl -X POST http://localhost:8001/api/plant/query \\")
        print("      -H 'Content-Type: application/json' \\")
        print("      -d '{\"query\": \"How do I grow tomatoes?\"}'")
    else:
        print("⚠️  SOME TESTS FAILED")
        print("\nPossible issues:")
        print("  • Collection may be empty - run: python scripts/plant_ingest.py")
        print("  • API credentials may be incorrect")
        print("  • Network connectivity issues")
    print("=" * 80)
    
    return all_passed


if __name__ == "__main__":
    try:
        success = test_plant_rag()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
