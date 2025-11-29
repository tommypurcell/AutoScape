"""
Video Generator using Freepik API.
Generates 5-second videos showing yard transformation with angle rotation.
"""

import os
import requests
import time
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FREEPIK_API_URL = "https://api.freepik.com/v1/ai/image-to-video/kling-v2"
API_KEY = os.getenv("FREEPIK_API_KEY")

def generate_transformation_video(
    original_image_base64: str,
    redesign_image_base64: str,
    duration: int = 5
) -> dict:
    """
    Generate a video showing transformation from original to redesign with angle change.
    
    Args:
        original_image_base64: Base64 encoded original yard image
        redesign_image_base64: Base64 encoded 3D redesign image
        duration: Video duration in seconds (default 5)
    
    Returns:
        dict with video_url and status
    """
    if not API_KEY:
        raise ValueError("FREEPIK_API_KEY not found in environment")
    
    headers = {
        "x-freepik-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    
    # Create video generation request with angle rotation (Single Image)
    # Note: Currently using single image generation as primary method.
    # Future enhancement: If API supports start/end images, use original_image_base64 as start.
    
    logger.info(f"🎥 Generating video with original image ({len(original_image_base64)} chars) and redesign ({len(redesign_image_base64)} chars)")

    # Kling v2 payload structure based on documentation
    # image: Base64 string or URL
    # duration: "5" or "10" (string)
    payload = {
        "prompt": "Cinematic 3D camera movement, smooth orbiting view of the landscape design, high quality, photorealistic, 4k. Transformation from original yard to new design.",
        "image": redesign_image_base64, 
        "duration": str(duration),
        "cfg_scale": 0.5
    }
    
    try:
        logger.info("🎬 Initiating video generation...")
        response = requests.post(
            FREEPIK_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:  # OK
            result = response.json()
            # Response format: {"data": {"task_id": "...", "status": "CREATED"}}
            job_id = result.get("data", {}).get("task_id")
            logger.info(f"✅ Video generation started. Job ID: {job_id}")
            
            # Poll for completion
            return poll_video_status(job_id)
        else:
            logger.error(f"❌ Failed to start video generation: {response.status_code}")
            logger.error(response.text)
            return {
                "status": "error",
                "error": f"API returned {response.status_code}"
            }
            
    except Exception as e:
        logger.error(f"❌ Video generation error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

def poll_video_status(job_id: str, max_wait: int = 300) -> dict:
    """
    Poll Freepik API for video generation status.
    
    Args:
        job_id: The video generation job ID
        max_wait: Maximum time to wait in seconds
    
    Returns:
        dict with video_url and status
    """
    headers = {
        "x-freepik-api-key": API_KEY
    }
    
    status_url = f"{FREEPIK_API_URL}/{job_id}"
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            response = requests.get(status_url, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                # Response format: {"data": {"task_id": "...", "status": "...", "video_url": "..."}}
                data = result.get("data", {})
                status = data.get("status")
                
                if status == "COMPLETED": # Docs show "CREATED", assuming "COMPLETED" or similar for done
                    logger.info(f"🔍 Full completion response: {result}")
                    
                    # Check for 'generated' list (Kling v2 format)
                    generated = data.get("generated", [])
                    if generated and isinstance(generated, list) and len(generated) > 0:
                        video_url = generated[0]
                    else:
                        # Fallback to other potential fields
                        video_url = data.get("video_url") or data.get("url") or data.get("result_url")
                        
                    logger.info(f"🎉 Video generation complete: {video_url}")
                    return {
                        "status": "completed",
                        "video_url": video_url
                    }
                elif status == "failed":
                    logger.error("❌ Video generation failed")
                    return {
                        "status": "error",
                        "error": result.get("error", "Unknown error")
                    }
                else:
                    logger.info(f"⏳ Video generation in progress... ({status})")
                    time.sleep(5)  # Wait 5 seconds before next poll
            else:
                logger.error(f"❌ Status check failed: {response.status_code}")
                return {
                    "status": "error",
                    "error": f"Status check failed: {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"❌ Polling error: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    return {
        "status": "timeout",
        "error": "Video generation timed out"
    }

if __name__ == "__main__":
    # Test with placeholder
    print("Video Generator Module - Use via API endpoint")
