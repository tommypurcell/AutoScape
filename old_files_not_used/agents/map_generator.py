"""
2D Map Generator for Landscaping Projects.
Creates a visual representation of the garden plan.
"""

from PIL import Image, ImageDraw, ImageFont
import random
import os

def generate_2d_map(
    plants: list,
    width: int = 800,
    height: int = 600,
    output_path: str = "garden_map.png",
    scale_px_per_ft: int = 10
):
    """
    Generate a structural 2D top-down view of the garden (Blueprint Style).
    
    Args:
        plants: List of dicts with 'name', 'type', 'x', 'y', 'spread_ft', 'color'
        width: Canvas width in pixels
        height: Canvas height in pixels
        output_path: File path to save the map
        scale_px_per_ft: Scale factor (pixels per foot)
    """
    # Create canvas (Blueprint blue or white)
    # Using white background with black lines for standard CAD look
    canvas = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(canvas)
    
    # Draw grid (10ft major lines, 1ft minor lines)
    for x in range(0, width, int(scale_px_per_ft)):
        draw.line([(x, 0), (x, height)], fill='#f0f0f0', width=1)
    for y in range(0, height, int(scale_px_per_ft)):
        draw.line([(0, y), (width, y)], fill='#f0f0f0', width=1)
        
    # Draw plants with specific symbols based on type
    for plant in plants:
        x = plant.get('x', random.randint(50, width-50))
        y = plant.get('y', random.randint(50, height-50))
        
        # Get spread from RAG data or default
        spread_ft = plant.get('spread_ft', 5)
        radius_px = int((spread_ft / 2) * scale_px_per_ft)
        
        plant_type = plant.get('type', 'shrub').lower()
        name = plant.get('name', 'Plant')
        
        # Define bounding box
        bbox = [(x-radius_px, y-radius_px), (x+radius_px, y+radius_px)]
        
        # Draw symbol based on type
        if 'tree' in plant_type:
            if 'evergreen' in plant_type or 'pine' in name.lower():
                # Spiky edge for conifers
                draw.ellipse(bbox, outline='black', width=2)
                # Add crosshatch or inner detail
                draw.line([(x-radius_px, y), (x+radius_px, y)], fill='black', width=1)
                draw.line([(x, y-radius_px), (x, y+radius_px)], fill='black', width=1)
            else:
                # Scalloped or cloud-like for deciduous (simplified as circle with inner circles)
                draw.ellipse(bbox, outline='black', width=2)
                draw.ellipse([(x-radius_px/2, y-radius_px/2), (x+radius_px/2, y+radius_px/2)], outline='black', width=1)
        elif 'shrub' in plant_type or 'bush' in plant_type:
            # Simple circle with stipple
            draw.ellipse(bbox, outline='black', width=1)
        elif 'grass' in plant_type:
            # Tuft symbol (simplified)
            draw.ellipse(bbox, outline='gray', width=1)
        else:
            # Default circle
            draw.ellipse(bbox, outline='black', width=1)
        
        # Draw center point
        draw.ellipse([(x-2, y-2), (x+2, y+2)], fill='black')
        
        # Draw label (Name + Spread)
        try:
            font = ImageFont.truetype("Arial", 10)
        except IOError:
            font = ImageFont.load_default()
            
        label = f"{name}\n({spread_ft}ft)"
        # Calculate text size to center it (approximate)
        # For simplicity, just draw it below without fancy anchoring
        draw.text((x, y+radius_px+5), label, fill='black', font=font)
        
    # Add Legend / Title Block
    draw.rectangle([(width-250, height-100), (width-10, height-10)], fill='white', outline='black', width=2)
    draw.text((width-240, height-90), "LANDSCAPE PLAN", fill='black')
    draw.text((width-240, height-70), f"Scale: 1 inch = {100/scale_px_per_ft:.0f} ft (approx)", fill='black')
    draw.text((width-240, height-50), f"Total Items: {len(plants)}", fill='black')
    
    # Save
    canvas.save(output_path)
    print(f"✅ Structural Map saved to {output_path}")
    return output_path

if __name__ == "__main__":
    # Test Data (Structural)
    test_plants = [
        {"name": "Oak Tree", "type": "deciduous tree", "x": 200, "y": 200, "spread_ft": 20, "color": "white"},
        {"name": "Pine Tree", "type": "evergreen tree", "x": 500, "y": 150, "spread_ft": 15, "color": "white"},
        {"name": "Rose Bush", "type": "shrub", "x": 400, "y": 300, "spread_ft": 4, "color": "white"},
        {"name": "Lavender", "type": "shrub", "x": 450, "y": 320, "spread_ft": 3, "color": "white"},
        {"name": "Fountain", "type": "hardscape", "x": 600, "y": 400, "spread_ft": 6, "color": "white"},
    ]
    
    generate_2d_map(test_plants, scale_px_per_ft=10)
