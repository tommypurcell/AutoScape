"""
Video Generator Module - Google Gemini Veo 3.1 API

Generates before→after transformation videos for landscape designs using
Google's Veo 3.1 API with first/last frame interpolation.
"""

import os
import time
import base64
import tempfile
import logging

logger = logging.getLogger(__name__)

# Get API key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")


def generate_transformation_video(
    original_image_base64: str,
    redesign_image_base64: str,
    duration: int = 5
) -> dict:
    """
    Generate a before→after transformation video using Gemini Veo 3.1.
    
    Uses frame interpolation to create a smooth morphing effect from
    the original yard to the redesigned yard.
    
    Args:
        original_image_base64: Base64 encoded original yard image
        redesign_image_base64: Base64 encoded redesigned yard image
        duration: Video duration in seconds (not used in Veo, kept for API compat)
    
    Returns:
        dict with video_url (base64 data URL) and status
    """
    logger.info("="*80)
    logger.info("🎬 STARTING VIDEO GENERATION PIPELINE (Gemini Veo 3.1)")
    logger.info("="*80)
    
    if not GEMINI_API_KEY:
        logger.error("❌ GEMINI_API_KEY not found in environment")
        return {
            "status": "error",
            "error": "GEMINI_API_KEY not found in environment"
        }
    
    logger.info(f"✅ GEMINI_API_KEY present: {GEMINI_API_KEY[:10]}...")
    logger.info(f"📸 Original image: {len(original_image_base64)} chars")
    logger.info(f"📸 Redesign image: {len(redesign_image_base64)} chars")
    
    try:
        from google import genai
        from google.genai import types
        
        # Initialize client
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # Create image objects from base64
        # Decode base64 to bytes
        original_bytes = base64.b64decode(original_image_base64)
        redesign_bytes = base64.b64decode(redesign_image_base64)
        
        logger.info(f"📸 Original image bytes: {len(original_bytes)}")
        logger.info(f"📸 Redesign image bytes: {len(redesign_bytes)}")
        
        # Create image objects
        first_frame = types.Image(
            image_bytes=original_bytes,
            mime_type="image/png"
        )
        last_frame = types.Image(
            image_bytes=redesign_bytes,
            mime_type="image/png"
        )
        
        # Prompt for natural, simple before→after transition
        prompt = """Simple video interpolation between two landscape images.
        Natural, subtle transition from the first frame to the last frame.
        No dramatic effects or exaggeration.
        Keep everything realistic and grounded.
        Slight slow camera pan from left to right.
        Same scale, same framing, same perspective.
        Photorealistic quality.
        Silent."""
        
        logger.info("🎬 Initiating video generation with Veo 3.1...")
        logger.info(f"   Prompt: {prompt[:100]}...")
        
        # Generate video using frame interpolation
        operation = client.models.generate_videos(
            model="veo-3.1-generate-preview",
            prompt=prompt,
            image=first_frame,
            config=types.GenerateVideosConfig(
                last_frame=last_frame,
            ),
        )
        
        logger.info(f"✅ Video generation initiated. Polling for completion...")
        
        # Poll for completion
        max_wait = 300  # 5 minutes max
        poll_interval = 10  # Check every 10 seconds
        elapsed = 0
        
        while not operation.done:
            if elapsed >= max_wait:
                logger.error(f"❌ Video generation timed out after {max_wait} seconds")
                return {
                    "status": "error",
                    "error": f"Video generation timed out after {max_wait} seconds"
                }
            
            logger.info(f"⏳ Waiting for video generation... ({elapsed}s elapsed)")
            time.sleep(poll_interval)
            elapsed += poll_interval
            operation = client.operations.get(operation)
        
        logger.info("✅ Video generation completed!")
        
        # Get the generated video
        video = operation.response.generated_videos[0]
        
        # Download video to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        temp_path = temp_file.name
        temp_file.close()
        
        logger.info(f"📥 Downloading video to {temp_path}...")
        client.files.download(file=video.video)
        video.video.save(temp_path)
        
        # Read and convert to base64
        with open(temp_path, 'rb') as f:
            video_bytes = f.read()
        
        video_base64 = base64.b64encode(video_bytes).decode('utf-8')
        video_data_url = f"data:video/mp4;base64,{video_base64}"
        
        # Clean up temp file
        os.unlink(temp_path)
        
        logger.info(f"🎉 Video created successfully ({len(video_base64)} chars)")
        
        return {
            "status": "completed",
            "video_url": video_data_url
        }
        
    except ImportError as e:
        logger.error(f"❌ Missing google-genai package: {e}")
        logger.error("   Install with: pip install google-genai")
        return {
            "status": "error",
            "error": f"Missing google-genai package: {e}. Install with: pip install google-genai"
        }
    except Exception as e:
        logger.error(f"❌ Video generation error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "error": str(e)
        }


if __name__ == "__main__":
    print("Video Generator Module (Gemini Veo 3.1) - Use via API endpoint")
