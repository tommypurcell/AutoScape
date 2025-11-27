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
    output_path: str = "garden_map.png"
):
    """
    Generate a 2D top-down view of the garden.
    
    Args:
        plants: List of dicts with 'name', 'x', 'y', 'radius', 'color'
        width: Canvas width in pixels
        height: Canvas height in pixels
        output_path: File path to save the map
    """
    # Create canvas (green background for grass)
    canvas = Image.new('RGB', (width, height), color='#e6f5d0')
    draw = ImageDraw.Draw(canvas)
    
    # Draw grid
    grid_size = 50
    for x in range(0, width, grid_size):
        draw.line([(x, 0), (x, height)], fill='#d0e0c0', width=1)
    for y in range(0, height, grid_size):
        draw.line([(0, y), (width, y)], fill='#d0e0c0', width=1)
        
    # Draw plants
    for plant in plants:
        x = plant.get('x', random.randint(50, width-50))
        y = plant.get('y', random.randint(50, height-50))
        radius = plant.get('radius', 30)
        color = plant.get('color', '#228B22')
        name = plant.get('name', 'Plant')
        
        # Draw plant circle
        draw.ellipse(
            [(x-radius, y-radius), (x+radius, y+radius)],
            fill=color,
            outline='#006400',
            width=2
        )
        
        # Draw center point
        draw.ellipse(
            [(x-2, y-2), (x+2, y+2)],
            fill='black'
        )
        
        # Draw label
        try:
            # Try to load a font, fallback to default
            font = ImageFont.truetype("Arial", 12)
        except IOError:
            font = ImageFont.load_default()
            
        draw.text((x, y+radius+5), name, fill='black', anchor="mt", font=font)
        
    # Add Legend / Title
    draw.rectangle([(10, 10), (200, 60)], fill='white', outline='black')
    draw.text((20, 20), "Garden Plan", fill='black')
    draw.text((20, 40), f"Total Items: {len(plants)}", fill='black')
    
    # Save
    canvas.save(output_path)
    print(f"✅ Map saved to {output_path}")
    return output_path

if __name__ == "__main__":
    # Test Data
    test_plants = [
        {"name": "Oak Tree", "x": 200, "y": 200, "radius": 60, "color": "#228B22"},
        {"name": "Rose Bush", "x": 400, "y": 300, "radius": 25, "color": "#FF69B4"},
        {"name": "Lavender", "x": 450, "y": 320, "radius": 15, "color": "#E6E6FA"},
        {"name": "Fountain", "x": 600, "y": 400, "radius": 40, "color": "#87CEEB"},
    ]
    
    generate_2d_map(test_plants)
