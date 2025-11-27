"""
Full Landscaping Plan Generator.
Integrates RAG Search, Budgeting, and Structural Map Generation.
"""

import logging
from freepik_agent import FreepikLandscapingAgent
from budget_calculator import calculate_budget
from map_generator import generate_2d_map
import re

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_plant_metadata(agent, plant_name, description):
    """
    Use Gemini to extract structural metadata for the map from RAG info.
    """
    if not agent.gemini_model:
        return {"type": "shrub", "spread_ft": 3}
        
    prompt = f"""Based on the plant '{plant_name}' and description: "{description}", provide:
    1. Plant Type (choose one: deciduous tree, evergreen tree, shrub, grass, flower, hardscape)
    2. Mature Spread in feet (number only)
    
    Format: Type | Spread
    Example: deciduous tree | 20
    """
    
    try:
        response = agent.gemini_model.generate_content(prompt)
        text = response.text.strip()
        parts = text.split('|')
        if len(parts) == 2:
            return {
                "type": parts[0].strip().lower(),
                "spread_ft": float(re.sub(r'[^\d.]', '', parts[1]))
            }
    except Exception as e:
        logger.error(f"Metadata extraction failed: {e}")
        
    return {"type": "shrub", "spread_ft": 3} # Default

def generate_plan(query: str, output_map: str = "final_plan.png"):
    """
    Generate a full landscaping plan from a user query.
    """
    agent = FreepikLandscapingAgent()
    
    logger.info(f"🔍 Searching for plants matching: '{query}'...")
    results = agent.search_images(query, top_k=5)
    
    if not results:
        logger.error("No results found.")
        return
        
    # Select top 3 unique plants for the plan
    selected_plants = []
    seen_names = set()
    
    for r in results:
        name = r['title']
        if name not in seen_names:
            seen_names.add(name)
            # Get metadata from RAG/Gemini
            metadata = extract_plant_metadata(agent, name, r.get('tags', []))
            
            selected_plants.append({
                "name": name[:20], # Truncate for map
                "full_name": name,
                "type": metadata['type'],
                "spread_ft": metadata['spread_ft'],
                "quantity": 1 # Default
            })
            
            if len(selected_plants) >= 3:
                break
    
    # Calculate Budget
    logger.info("💰 Calculating budget...")
    budget = calculate_budget(selected_plants)
    logger.info(f"Estimated Budget: ${budget['total_low']:,.2f} - ${budget['total_high']:,.2f}")
    
    # Generate Map
    logger.info("🗺️ Generating structural map...")
    # Place them in a simple layout
    map_plants = []
    positions = [(200, 200), (500, 200), (350, 400)]
    
    for i, plant in enumerate(selected_plants):
        pos = positions[i] if i < len(positions) else (400, 300)
        map_plants.append({
            "name": plant['name'],
            "type": plant['type'],
            "spread_ft": plant['spread_ft'],
            "x": pos[0],
            "y": pos[1],
            "color": "white"
        })
        
    generate_2d_map(map_plants, output_path=output_map, scale_px_per_ft=10)
    logger.info("✅ Plan generation complete!")

if __name__ == "__main__":
    generate_plan("japanese garden plants")
