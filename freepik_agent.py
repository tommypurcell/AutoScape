import os
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models
from fastembed import TextEmbedding
import google.generativeai as genai

# ==========================================
# CONFIGURATION
# ==========================================
COLLECTION_NAME = "freepik_landscaping"
TOP_K_RESULTS = 10

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

class FreepikLandscapingAgent:
    """RAG agent for semantic search over Freepik landscaping images."""
    
    def __init__(self):
        """Initialize the agent with Qdrant and Gemini clients."""
        load_dotenv()
        
        # Initialize Qdrant
        endpoint = os.getenv("VITE_QUADRANT_ENDPOINT") or os.getenv("QDRANT_URL")
        api_key = os.getenv("VITE_QUADRANT_API_KEY") or os.getenv("QDRANT_API_KEY")
        
        if not endpoint or not api_key:
            raise ValueError("Missing Qdrant credentials in environment")
        
        self.qdrant_client = QdrantClient(url=endpoint, api_key=api_key)
        
        # Initialize text embedding model for queries
        logger.info("🧠 Loading text embedding model...")
        self.text_embedding_model = TextEmbedding(model_name="Qdrant/clip-ViT-B-32-text")
        
        # Initialize Gemini
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            genai.configure(api_key=gemini_key)
            self.gemini_model = genai.GenerativeModel("gemini-2.0-flash-exp")
            logger.info("✅ Gemini initialized")
        else:
            self.gemini_model = None
            logger.warning("⚠️  GEMINI_API_KEY not found, AI features disabled")
        
        logger.info("✅ FreepikLandscapingAgent initialized")
    
    def _embed_query(self, query: str) -> List[float]:
        """Generate embedding for a text query."""
        embeddings = list(self.text_embedding_model.embed([query]))
        return embeddings[0].tolist()
    
    def search_images(
        self,
        query: str,
        top_k: int = TOP_K_RESULTS,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search for landscaping images.
        
        Args:
            query: Natural language search query
            top_k: Number of results to return
            filters: Optional filters (e.g., {"search_term": "tree", "premium": False})
        
        Returns:
            List of search results with metadata and scores
        """
        try:
            # Generate query embedding
            query_vector = self._embed_query(query)
            
            # Build filter conditions
            search_filter = None
            if filters:
                conditions = []
                for key, value in filters.items():
                    if isinstance(value, list):
                        conditions.append(
                            models.FieldCondition(
                                key=key,
                                match=models.MatchAny(any=value)
                            )
                        )
                    else:
                        conditions.append(
                            models.FieldCondition(
                                key=key,
                                match=models.MatchValue(value=value)
                            )
                        )
                
                if conditions:
                    search_filter = models.Filter(must=conditions)
            
            # Perform search using query_points
            search_results = self.qdrant_client.query_points(
                collection_name=COLLECTION_NAME,
                query=query_vector,
                limit=top_k,
                query_filter=search_filter
            ).points
            
            # Format results
            results = []
            for hit in search_results:
                result = {
                    "score": hit.score,
                    "id": hit.id,
                    **hit.payload
                }
                results.append(result)
            
            logger.info(f"🔍 Found {len(results)} results for query: '{query}'")
            return results
            
        except Exception as e:
            logger.error(f"❌ Search failed: {e}")
            return []
    
    def get_recommendations(
        self,
        query: str,
        context: Optional[str] = None,
        top_k: int = TOP_K_RESULTS
    ) -> Dict[str, Any]:
        """
        Get AI-powered landscaping recommendations.
        
        Args:
            query: User's landscaping question or need
            context: Additional context (e.g., climate, space constraints)
            top_k: Number of image recommendations
        
        Returns:
            Dictionary with recommendations and AI-generated explanation
        """
        # First, search for relevant images
        results = self.search_images(query, top_k=top_k)
        
        if not self.gemini_model:
            return {
                "query": query,
                "results": results,
                "explanation": "AI explanations unavailable (Gemini not configured)"
            }
        
        # Generate AI explanation
        try:
            # Build context from search results
            result_context = "\n".join([
                f"- {r['title']} (tags: {', '.join(r.get('tags', [])[:5])})"
                for r in results[:5]
            ])
            
            prompt = f"""You are a landscaping expert assistant. A user is looking for: "{query}"

{f'Additional context: {context}' if context else ''}

Based on these relevant Freepik images found:
{result_context}

Provide a helpful, concise explanation (2-3 sentences) about:
1. Why these images are relevant for their landscaping needs
2. Key considerations when using these plants/materials
3. Any design tips or best practices

Keep it practical and actionable."""

            response = self.gemini_model.generate_content(prompt)
            explanation = response.text
            
        except Exception as e:
            logger.error(f"❌ Gemini generation failed: {e}")
            explanation = "Unable to generate AI explanation at this time."
        
        return {
            "query": query,
            "context": context,
            "results": results,
            "explanation": explanation
        }
    
    def explain_results(self, query: str, results: List[Dict]) -> str:
        """Generate natural language explanation of search results."""
        if not self.gemini_model or not results:
            return "No explanation available."
        
        try:
            result_summary = "\n".join([
                f"{i+1}. {r['title']} - {r.get('search_term', 'N/A')}"
                for i, r in enumerate(results[:5])
            ])
            
            prompt = f"""User searched for: "{query}"

Top results:
{result_summary}

Provide a brief 1-2 sentence explanation of why these results match the query and how they could be used in landscaping."""

            response = self.gemini_model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            logger.error(f"❌ Explanation generation failed: {e}")
            return "Unable to generate explanation."
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the Freepik collection."""
        try:
            collection_info = self.qdrant_client.get_collection(COLLECTION_NAME)
            return {
                "collection_name": COLLECTION_NAME,
                "points_count": collection_info.points_count,
                "status": "healthy"
            }
        except Exception as e:
            logger.error(f"❌ Failed to get collection stats: {e}")
            return {
                "collection_name": COLLECTION_NAME,
                "status": "error",
                "error": str(e)
            }


def main():
    """Demo usage of the FreepikLandscapingAgent."""
    agent = FreepikLandscapingAgent()
    
    # Example searches
    test_queries = [
        "ornamental trees for front yard",
        "decorative gravel for pathways",
        "evergreen shrubs for privacy",
        "paving stones for patio",
    ]
    
    print("\n" + "="*60)
    print("FREEPIK LANDSCAPING RAG DEMO")
    print("="*60)
    
    for query in test_queries:
        print(f"\n🔍 Query: {query}")
        print("-" * 60)
        
        results = agent.search_images(query, top_k=3)
        
        if results:
            for i, result in enumerate(results, 1):
                print(f"\n{i}. {result['title']}")
                print(f"   Score: {result['score']:.3f}")
                print(f"   URL: {result['url']}")
                print(f"   Tags: {', '.join(result.get('tags', [])[:5])}")
        else:
            print("   No results found")
    
    # Example recommendation
    print("\n" + "="*60)
    print("AI RECOMMENDATION DEMO")
    print("="*60)
    
    recommendation = agent.get_recommendations(
        query="low maintenance plants for sunny garden",
        context="Small backyard in California, drought-tolerant preferred"
    )
    
    print(f"\n🤖 AI Explanation:\n{recommendation['explanation']}")
    print(f"\n📊 Found {len(recommendation['results'])} relevant images")
    
    # Collection stats
    print("\n" + "="*60)
    stats = agent.get_collection_stats()
    print(f"📊 Collection: {stats['collection_name']}")
    print(f"📈 Total images: {stats.get('points_count', 'N/A')}")
    print(f"✅ Status: {stats['status']}")


if __name__ == "__main__":
    main()
