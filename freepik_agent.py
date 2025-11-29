import os
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models
from fastembed import TextEmbedding, ImageEmbedding
import google.generativeai as genai
from pricing_data import get_pricing_context
from PIL import Image

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
        
        # Initialize vision embedding model for image search (lazy load or init here)
        # We'll init here for simplicity, but could be lazy
        logger.info("👁️ Loading vision embedding model...")
        self.vision_embedding_model = ImageEmbedding(model_name="Qdrant/clip-ViT-B-32-vision")
        
        # Initialize Gemini
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            genai.configure(api_key=gemini_key)
            genai.configure(api_key=gemini_key)
            self.gemini_model = genai.GenerativeModel("gemini-2.0-flash")
            self.image_gen_model = genai.GenerativeModel("gemini-2.0-flash-exp-image-generation")
            logger.info("✅ Gemini initialized")
        else:
            self.gemini_model = None
            logger.warning("⚠️  GEMINI_API_KEY not found, AI features disabled")
        
        logger.info("✅ FreepikLandscapingAgent initialized")
    
    def _embed_query(self, query: str) -> List[float]:
        """Generate embedding for a text query."""
        embeddings = list(self.text_embedding_model.embed([query]))
        return embeddings[0].tolist()

    def _embed_image(self, image_path: str) -> List[float]:
        """Generate embedding for an image file."""
        image = Image.open(image_path)
        if image.mode != "RGB":
            image = image.convert("RGB")
        embeddings = list(self.vision_embedding_model.embed([image]))
        return embeddings[0].tolist()

    def search_by_image(
        self,
        image_path: str,
        top_k: int = TOP_K_RESULTS,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search using an input image.
        
        Args:
            image_path: Path to the input image file
            top_k: Number of results to return
            filters: Optional filters
        
        Returns:
            List of search results with metadata and scores
        """
        try:
            # Generate image embedding
            query_vector = self._embed_image(image_path)
            
            # Build filter conditions (same as text search)
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
            
            logger.info(f"🔍 Found {len(results)} results for image: '{image_path}'")
            return results
            
        except Exception as e:
            logger.error(f"❌ Image search failed: {e}")
            return []
    
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
                    "specific_name": hit.payload.get("specific_name"),
                    "price_estimate": hit.payload.get("price_estimate"),
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
                f"- {r.get('specific_name') or r['title']} (Price: {r.get('price_estimate', 'N/A')}) - Tags: {', '.join(r.get('tags', [])[:5])}"
                for r in results[:5]
            ])
            
            # Get pricing context based on query and result tags
            all_tags = []
            for r in results[:5]:
                all_tags.extend(r.get('tags', []))
            pricing_info = get_pricing_context(query, all_tags)
            
            prompt = f"""You are a landscaping expert assistant. A user is looking for: "{query}"

{f'Additional context: {context}' if context else ''}

Based on these relevant Freepik images found (with estimated market prices):
{result_context}

Use the provided price estimates as a primary reference. If missing, use this market pricing reference:
{pricing_info}

Provide a helpful, concise explanation about:
1. Why these images are relevant for their landscaping needs
2. Key considerations when using these plants/materials
3. Any design tips or best practices
4. **Estimated Budget**: Provide an approximate price range based on the market pricing reference provided above.

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
                f"{i+1}. {r.get('specific_name') or r['title']} - Price: {r.get('price_estimate', 'N/A')}"
                for i, r in enumerate(results[:5])
            ])
            
            prompt = f"""User searched for: "{query}"

Top results:
{result_summary}

Provide a brief explanation of why these results match the query, how they could be used in landscaping, and an estimated price range for the items shown."""

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

    def analyze_environment(self, place_image: Image.Image, concept_image: Image.Image) -> Dict[str, str]:
        """Analyze place and concept images for environmental and style cues."""
        if not self.gemini_model:
            raise ValueError("Gemini not configured")
            
        prompt = """
        Analyze these two images and respond with ONLY a valid JSON object (no explanatory text before or after).
        
        First image: Place to be landscaped - identify hardiness zone, terrain, environmental constraints.
        Second image: Concept style - identify design style and materials.
        
        Respond with this exact JSON structure:
        {
          "environment_summary": "description of the place",
          "constraints": ["constraint1", "constraint2"],
          "design_style": "style name",
          "generation_prompt": "detailed prompt for image generation"
        }
        """
        
        try:
            response = self.gemini_model.generate_content([prompt, place_image, concept_image])
            text = response.text.strip()
            
            logger.info(f"🔍 Raw Gemini response (first 300 chars): {text[:300]}")
            
            # Extract JSON from markdown code blocks
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            # Try to find JSON object pattern
            import json
            import re
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
            if json_match:
                text = json_match.group(0)
                logger.info(f"📝 Extracted JSON: {text[:200]}")
            
            return json.loads(text)
        except Exception as e:
            logger.error(f"❌ Environment analysis failed: {e}")
            logger.error(f"💬 Full response was: {text[:500] if 'text' in locals() else 'No response received'}")
            raise

    def generate_design(self, prompt: str) -> Image.Image:
        """Generate a landscape design image."""
        if not hasattr(self, 'image_gen_model'):
             raise ValueError("Image generation model not configured")
             
        try:
            response = self.image_gen_model.generate_content(prompt)
            # Extract image from response
            if hasattr(response, 'images') and response.images:
                return response.images[0]
            elif hasattr(response, 'parts'):
                 for part in response.parts:
                     if hasattr(part, 'image'):
                         return part.image
            
            # Fallback placeholder
            logger.warning("⚠️  Could not extract image from response, returning placeholder")
            return Image.new('RGB', (1024, 1024), color='green')
            
        except Exception as e:
            logger.error(f"❌ Image generation failed: {e}")
            raise

    def extract_items_from_design(self, design_image: Image.Image) -> List[str]:
        """Identify specific items in the generated design."""
        if not self.gemini_model:
            raise ValueError("Gemini not configured")
            
        prompt = """
        Identify the key plants and hardscape elements in this landscape design.
        Return a JSON list of strings, where each string is a specific item name (e.g., "Japanese Maple", "Slate Pavers").
        Limit to the top 5-10 most prominent items.
        """
        
        try:
            response = self.gemini_model.generate_content([prompt, design_image])
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            import json
            return json.loads(text)
        except Exception as e:
            logger.error(f"❌ Item extraction failed: {e}")
            return []

    def calculate_budget(self, items: List[str]) -> Dict[str, Any]:
        """Calculate budget based on identified items using RAG."""
        total_min_budget = 0
        line_items = []
        
        for item in items:
            # Search for the item in Qdrant
            results = self.search_images(item, top_k=1)
            if results:
                match = results[0]
                price_str = match.get('price_estimate', '')
                # Extract number from price string (very basic heuristic)
                import re
                prices = re.findall(r'\$(\d+)', price_str)
                if prices:
                    price = int(prices[0])
                    total_min_budget += price
                    line_items.append({
                        "item": item,
                        "match": match.get('specific_name') or match.get('title'),
                        "price_estimate": price_str,
                        "cost": price,
                        "image_url": match.get('image_url')
                    })
                else:
                    line_items.append({
                        "item": item,
                        "match": match.get('specific_name') or match.get('title'),
                        "price_estimate": price_str,
                        "cost": 0,
                        "image_url": match.get('image_url')
                    })
            else:
                line_items.append({
                    "item": item,
                    "match": "No match found",
                    "price_estimate": "N/A",
                    "cost": 0
                })
                
        return {
            "total_min_budget": total_min_budget,
            "currency": "USD",
            "line_items": line_items
        }

    def generate_design_and_budget(self, place_image: Image.Image, concept_image: Image.Image) -> Dict[str, Any]:
        """Orchestrate the full design-to-budget workflow."""
        
        # 1. Analyze
        logger.info("🔍 Analyzing environment...")
        analysis = self.analyze_environment(place_image, concept_image)
        
        # 2. Generate
        logger.info("🎨 Generating design...")
        design_image = self.generate_design(analysis['generation_prompt'])
        
        # 3. Extract Items
        logger.info("📝 Extracting items...")
        items = self.extract_items_from_design(design_image)
        
        # 4. Calculate Budget
        logger.info("💰 Calculating budget...")
        budget = self.calculate_budget(items)
        
        return {
            "analysis": analysis,
            "generated_design": design_image,
            "items": items,
            "budget": budget
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
