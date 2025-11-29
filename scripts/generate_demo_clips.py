import os
import time
import base64
import logging
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from video_generator import generate_image_from_text, generate_transformation_video

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Output directory
OUTPUT_DIR = "demo_clips"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def save_base64_image(base64_str, filename):
    """Save base64 string as image file"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(base64.b64decode(base64_str))
    logger.info(f"💾 Saved image: {filepath}")
    return filepath

def main():
    logger.info("🚀 Starting Demo Video Asset Generation")
    
    scenes = [
        {
            "name": "scene_1_problem",
            "prompt": "A boring, empty, neglected backyard with patchy grass and a plain wooden fence, realistic, 4k, overcast lighting",
            "motion": {"type": "pan", "direction": "horizontal"} 
        },
        {
            "name": "scene_2_solution",
            "prompt": "A stunning modern zen garden backyard with bamboo fencing, stone pavers, and lush greenery, photorealistic, 4k, architectural render, golden hour lighting",
            "motion": {"type": "camera_rotation", "angle": 15, "direction": "horizontal"}
        },
        {
            "name": "scene_3_analysis",
            "prompt": "Futuristic technology concept, glowing wireframe of a house and garden, digital data streams, blue and emerald green color scheme, 8k, high tech",
            "motion": {"type": "zoom", "direction": "in"}
        },
        {
            "name": "scene_6_tech_stack",
            "prompt": "A futuristic 3D holographic network diagram showing connected nodes of Artificial Intelligence, glowing server racks, floating data cubes, cybernetic interface, dark background with neon blue and purple accents, 8k, unreal engine 5 render",
            "motion": {"type": "pan", "direction": "horizontal"}
        },
        {
            "name": "scene_5_budget",
            "prompt": "A curated collection of landscape design materials, stone samples, plants, and wood textures arranged neatly on a white background, high end product photography, studio lighting",
            "motion": {"type": "pan", "direction": "vertical"}
        }
    ]

    for scene in scenes:
        logger.info(f"\n🎬 Processing {scene['name']}...")
        
        # 1. Generate Image
        logger.info("   Generating base image...")
        img_result = generate_image_from_text(scene['prompt'])
        
        if img_result['status'] == 'completed':
            image_b64 = img_result['image_base64']
            save_base64_image(image_b64, f"{scene['name']}.jpg")
            
            # 2. Generate Video
            logger.info("   Animating video...")
            # Note: generate_transformation_video expects 'original' and 'redesign' for transition
            # But we can hack it to just animate one image by passing the same image or modifying the function
            # For now, let's try passing the same image to see if it just animates the 'redesign' as per our previous code
            
            # We need to make sure the base64 string has the prefix for the API if needed, 
            # but usually the API takes raw base64 or data URI. 
            # The video_generator.py passes it directly.
            
            # Construct data URI
            image_data_uri = f"data:image/jpeg;base64,{image_b64}"
            
            video_result = generate_transformation_video(
                original_image_base64=image_data_uri, # Not used in current single-image logic but required by sig
                redesign_image_base64=image_data_uri,
                duration=5
            )
            
            if video_result['status'] == 'completed':
                video_url = video_result['video_url']
                logger.info(f"   ✅ Video generated: {video_url}")
                
                # Download video
                import requests
                v_response = requests.get(video_url)
                video_path = os.path.join(OUTPUT_DIR, f"{scene['name']}.mp4")
                with open(video_path, 'wb') as f:
                    f.write(v_response.content)
                logger.info(f"   💾 Saved video: {video_path}")
                
            else:
                logger.error(f"   ❌ Video generation failed: {video_result.get('error')}")
                
        else:
            logger.error(f"   ❌ Image generation failed: {img_result.get('error')}")
            
        # Wait a bit between requests to be nice to the API
        time.sleep(5)

    logger.info("\n✨ All scenes processed!")

if __name__ == "__main__":
    main()
