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

FREEPIK_VIDEO_API_URL = "https://api.freepik.com/v1/videos/kling-v2/tasks"
FREEPIK_IMAGE_API_URL = "https://api.freepik.com/v1/ai/text-to-image"
API_KEY = os.getenv("FREEPIK_API_KEY")

def generate_image_from_text(prompt: str) -> dict:
    """
    Generate an image from text using Freepik Flux API.
    """
    if not API_KEY:
        raise ValueError("FREEPIK_API_KEY not found in environment")
    
    headers = {
        "x-freepik-api-key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    payload = {
        "prompt": prompt,
        "aspect_ratio": "16:9",
        "realism": "photorealistic",
        "image": {"size": "landscape_4_3"} 
    }
    
    try:
        logger.info(f"🎨 Generating image for prompt: {prompt[:50]}...")
        response = requests.post(
            FREEPIK_IMAGE_API_URL,
            headers=headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            image_base64 = result.get("data", [{}])[0].get("base64")
            if image_base64:
                return {
                    "status": "completed",
                    "image_base64": image_base64
                }
            else:
                return {"status": "error", "error": "No image data in response"}
        else:
            logger.error(f"❌ Image generation failed: {response.status_code} - {response.text}")
            return {"status": "error", "error": f"API returned {response.status_code}"}
            
    except Exception as e:
        logger.error(f"❌ Image generation error: {e}")
        return {"status": "error", "error": str(e)}

def generate_transformation_video(
    original_image_base64: str,
    redesign_image_base64: str,
    duration: int = 5
) -> dict:
    """
    Generate a video using Freepik Kling v2 (Image-to-Video).
    """
    if not API_KEY:
        raise ValueError("FREEPIK_API_KEY not found in environment")
    
    headers = {
        "x-freepik-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    
    # Kling v2 payload
    # Note: redesign_image_base64 should be a base64 string (no data URI prefix) or URL
    # If it has prefix, strip it
    if "base64," in redesign_image_base64:
        image_data = redesign_image_base64.split("base64,")[1]
    else:
        image_data = redesign_image_base64

    payload = {
        "prompt": "Cinematic camera movement, smooth motion, high quality, 4k",
        "image": image_data,
        "duration": duration,
        "cfg_scale": 0.5
    }
    
    try:
        logger.info("🎬 Initiating video generation (Kling v2)...")
        response = requests.post(
            FREEPIK_VIDEO_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:  # Kling might return 200 for task creation
            result = response.json()
            job_id = result.get("data", {}).get("id")
            if not job_id:
                 # Try top level id if structure differs
                 job_id = result.get("id")
            
            if job_id:
                logger.info(f"✅ Video generation started. Job ID: {job_id}")
                return poll_video_status(job_id)
            else:
                logger.error(f"❌ Failed to get job ID from response: {result}")
                return {"status": "error", "error": "No job ID in response"}
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

def poll_video_status(job_id: str, max_wait: int = 600) -> dict:
    """
    Poll Freepik API for video generation status.
    """
    headers = {
        "x-freepik-api-key": API_KEY
    }
    
    status_url = f"{FREEPIK_VIDEO_API_URL}/{job_id}"
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            response = requests.get(status_url, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                data = result.get("data", {})
                status = data.get("status")
                
                if status == "completed":
                    video_url = data.get("video_url")
                    # Sometimes url is in a different field or nested
                    if not video_url:
                         # Check if there is a 'url' field directly
                         video_url = data.get("url")
                    
                    if video_url:
                        logger.info(f"🎉 Video generation complete: {video_url}")
                        return {
                            "status": "completed",
                            "video_url": video_url
                        }
                    else:
                        logger.error("❌ Completed but no video URL found")
                        return {"status": "error", "error": "No video URL"}
                        
                elif status == "failed":
                    logger.error("❌ Video generation failed")
                    return {
                        "status": "error",
                        "error": data.get("error", "Unknown error")
                    }
                else:
                    logger.info(f"⏳ Video generation in progress... ({status})")
                    time.sleep(10)  # Wait 10 seconds before next poll
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
