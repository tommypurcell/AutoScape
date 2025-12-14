"""
RAG Plant Catalog - Query and retrieve specific plant information.
Integrates with freepik_landscaping collection for realistic plant selection.
"""

import logging
from typing import List, Dict, Any, Optional
from freepik_agent import FreepikLandscapingAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PlantCatalog:
    """Interface to query RAG for specific plants with images and pricing."""
    
    def __init__(self):
        self.agent = FreepikLandscapingAgent()
        logger.info("✅ Plant Catalog initialized")
    
    def find_plant(self, plant_name: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Find specific plant in RAG database.
        
        Args:
            plant_name: Common or botanical name (e.g., "Japanese Maple" or "Acer palmatum")
            top_k: Number of results to return
        
        Returns:
            List of plant entries with image, botanical name, and metadata
        """
        logger.info(f"🔍 Searching RAG for: {plant_name}")
        
        results = self.agent.search_images(plant_name, top_k=top_k)
        
        plants = []
        for result in results:
            plant_entry = {
                "common_name": self._extract_common_name(result.get('specific_name', result.get('title'))),
                "botanical_name": self._extract_botanical_name(result.get('specific_name', '')),
                "specific_name": result.get('specific_name', result.get('title')),
                "image_url": result.get('image_url', result.get('url', '')),
                "score": result.get('score', 0),
                "tags": result.get('tags', []),
                "original_title": result.get('title', ''),
                "price_estimate": result.get('price_estimate', ''),
                "description": result.get('description', '')
            }
            plants.append(plant_entry)
        
        logger.info(f"  Found {len(plants)} matching plants")
        return plants
    
    def find_plants_batch(self, plant_names: List[str], top_k: int = 2) -> Dict[str, List[Dict]]:
        """
        Find multiple plants at once.
        
        Args:
            plant_names: List of plant names to search for
            top_k: Results per plant
        
        Returns:
            Dictionary mapping plant names to their results
        """
        logger.info(f"🔍 Batch searching {len(plant_names)} plants...")
        
        results = {}
        for plant in plant_names:
            results[plant] = self.find_plant(plant, top_k=top_k)
        
        return results
    
    def find_by_category(self, category: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Find plants by category (trees, shrubs, perennials, etc.).
        
        Args:
            category: Plant category
            top_k: Number of results
        
        Returns:
            List of plants in that category
        """
        search_terms = {
            "trees": "ornamental tree deciduous evergreen",
            "shrubs": "flowering shrub evergreen bush",
            "perennials": "perennial flower garden plant",
            "grasses": "ornamental grass",
            "hardscape": "paver stone gravel rock",
            "ground_cover": "ground cover spreading plant"
        }
        
        query = search_terms.get(category.lower(), category)
        logger.info(f"🔍 Searching category '{category}': {query}")
        
        return self.find_plant(query, top_k=top_k)
    
    def get_plant_details(self, botanical_name: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information for a specific botanical name.
        
        Args:
            botanical_name: Full botanical name (e.g., "Acer palmatum")
        
        Returns:
            Plant details or None
        """
        results = self.find_plant(botanical_name, top_k=1)
        return results[0] if results else None
    
    def _extract_common_name(self, full_name: str) -> str:
        """Extract common name from 'Common Name (Botanical Name)' format."""
        if '(' in full_name:
            return full_name.split('(')[0].strip()
        return full_name
    
    def _extract_botanical_name(self, full_name: str) -> str:
        """Extract botanical name from 'Common Name (Botanical Name)' format."""
        if '(' in full_name and ')' in full_name:
            start = full_name.index('(') + 1
            end = full_name.index(')')
            return full_name[start:end]
        return ""

def create_plant_palette(design_plants: List[str]) -> Dict[str, Any]:
    """
    Create a visual plant palette from a design's plant list.
    
    Args:
        design_plants: List of plant names from the design
    
    Returns:
        Dictionary with plant details and images from RAG
    """
    catalog = PlantCatalog()
    palette = {
        "plants": [],
        "total_count": len(design_plants)
    }
    
    for plant_name in design_plants:
        matches = catalog.find_plant(plant_name, top_k=1)
        if matches:
            plant = matches[0]
            palette["plants"].append({
                "requested_name": plant_name,
                "matched_plant": plant,
                "confidence": plant['score']
            })
    
    return palette

if __name__ == "__main__":
    # Test the catalog
    catalog = PlantCatalog()
    
    # Test single plant search
    print("\n🔍 Testing: Japanese Maple")
    results = catalog.find_plant("Japanese Maple", top_k=3)
    for i, plant in enumerate(results, 1):
        print(f"\n{i}. {plant['specific_name']}")
        print(f"   Botanical: {plant['botanical_name']}")
        print(f"   Score: {plant['score']:.3f}")
    
    # Test category search
    print("\n\n🔍 Testing: Trees category")
    trees = catalog.find_by_category("trees", top_k=5)
    for i, tree in enumerate(trees, 1):
        print(f"{i}. {tree['specific_name'][:50]}...")
