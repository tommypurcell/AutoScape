import os
import sys
import logging
from dotenv import load_dotenv
from qdrant_client import QdrantClient

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

COLLECTION_NAME = "freepik_landscaping"

def test_collection_exists():
    """Test if the Freepik collection exists."""
    logger.info("🔍 Testing collection existence...")
    
    load_dotenv()
    endpoint = os.getenv("VITE_QUADRANT_ENDPOINT") or os.getenv("QDRANT_URL")
    api_key = os.getenv("VITE_QUADRANT_API_KEY") or os.getenv("QDRANT_API_KEY")
    
    if not endpoint or not api_key:
        logger.error("❌ Missing Qdrant credentials")
        return False
    
    try:
        client = QdrantClient(url=endpoint, api_key=api_key)
        exists = client.collection_exists(COLLECTION_NAME)
        
        if exists:
            logger.info(f"✅ Collection '{COLLECTION_NAME}' exists")
            
            # Get collection info
            info = client.get_collection(COLLECTION_NAME)
            logger.info(f"📊 Points count: {info.points_count}")
            logger.info(f"📏 Vector size: {info.config.params.vectors.size}")
            logger.info(f"📐 Distance: {info.config.params.vectors.distance}")
            
            return True
        else:
            logger.warning(f"⚠️  Collection '{COLLECTION_NAME}' does not exist")
            logger.info("💡 Run 'python scripts/freepik_ingest.py' to create and populate it")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error checking collection: {e}")
        return False

def test_search():
    """Test basic search functionality."""
    logger.info("\n🔍 Testing search functionality...")
    
    try:
        from freepik_agent import FreepikLandscapingAgent
        
        agent = FreepikLandscapingAgent()
        
        # Test query
        query = "ornamental tree"
        logger.info(f"🔎 Searching for: '{query}'")
        
        results = agent.search_images(query, top_k=3)
        
        if results:
            logger.info(f"✅ Found {len(results)} results")
            for i, result in enumerate(results, 1):
                logger.info(f"\n  {i}. {result['title']}")
                logger.info(f"     Score: {result['score']:.3f}")
                logger.info(f"     Search term: {result.get('search_term', 'N/A')}")
            return True
        else:
            logger.warning("⚠️  No results found")
            return False
            
    except Exception as e:
        logger.error(f"❌ Search test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_recommendations():
    """Test AI recommendation functionality."""
    logger.info("\n🤖 Testing AI recommendations...")
    
    try:
        from freepik_agent import FreepikLandscapingAgent
        
        agent = FreepikLandscapingAgent()
        
        query = "drought tolerant plants for California garden"
        logger.info(f"🔎 Getting recommendations for: '{query}'")
        
        recommendation = agent.get_recommendations(
            query=query,
            context="Small backyard, full sun",
            top_k=3
        )
        
        logger.info(f"✅ Got {len(recommendation['results'])} recommendations")
        logger.info(f"\n🤖 AI Explanation:\n{recommendation['explanation']}\n")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Recommendation test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_endpoints():
    """Test API endpoints (requires server to be running)."""
    logger.info("\n🌐 Testing API endpoints...")
    
    try:
        import requests
        
        base_url = "http://localhost:8002"
        
        # Test health endpoint
        logger.info("Testing /api/freepik/health...")
        response = requests.get(f"{base_url}/api/freepik/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"✅ Health check passed")
            logger.info(f"   Status: {data['status']}")
            logger.info(f"   Points: {data.get('points_count', 'N/A')}")
        else:
            logger.warning(f"⚠️  Health check returned {response.status_code}")
            return False
        
        # Test search endpoint
        logger.info("\nTesting /api/freepik/search...")
        search_data = {
            "query": "evergreen shrub",
            "top_k": 3
        }
        response = requests.post(
            f"{base_url}/api/freepik/search",
            json=search_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"✅ Search endpoint working")
            logger.info(f"   Found: {data['count']} results")
        else:
            logger.warning(f"⚠️  Search returned {response.status_code}")
            return False
        
        return True
        
    except requests.exceptions.ConnectionError:
        logger.warning("⚠️  API server not running")
        logger.info("💡 Start server with: python freepik_api.py")
        return False
    except Exception as e:
        logger.error(f"❌ API test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("FREEPIK LANDSCAPING RAG - TEST SUITE")
    print("="*60 + "\n")
    
    results = {
        "Collection Exists": test_collection_exists(),
        "Search Functionality": False,
        "AI Recommendations": False,
        "API Endpoints": False
    }
    
    # Only run search tests if collection exists
    if results["Collection Exists"]:
        results["Search Functionality"] = test_search()
        results["AI Recommendations"] = test_recommendations()
        results["API Endpoints"] = test_api_endpoints()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print("="*60 + "\n")
    
    # Exit code
    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
