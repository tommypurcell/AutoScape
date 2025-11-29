"""
Video Generator using Freepik API​.
Generates before→after transformation videos using dual video generation + ffmpeg crossfade.
"""

import os
import requests
import time
import logging
import subprocess
import tempfile
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FREEPIK_API_URL = "https://api.freepik.com/v1/ai/image-to-video/kling-v2"
API_KEY = os.getenv("FREEPIK_API_KEY")

def check_ffmpeg():
    """Check if ffmpeg is installed."""
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def generate_transformation_video(
    original_image_base64: str,
    redesign_image_base64: str,
    duration: int = 5
) -> dict:
    """
    Generate a before→after transformation video.
    
    Process:
    1. Generate two videos concurrently (original + redesign)
    2. Poll both until complete
    3. Download both videos
    4. Merge with ffmpeg crossfade
    5. Return final video URL
    
    Args:
        original_image_base64: Base64 encoded original yard image
        redesign_image_base64: Base64 encoded redesigned yard image
        duration: Video duration in seconds (default 5)
    
    Returns:
        dict with video_url and status
    """
    if not API_KEY:
        raise ValueError("FREEPIK_API_KEY not found in environment")
    
    if not check_ffmpeg():
        return {
            "status": "error",
            "error": "ffmpeg is not installed. Please install it with: brew install ffmpeg"
        }
    
    logger.info(f"🎥 Starting dual video generation pipeline")
    logger.info(f"📸 Original image: {len(original_image_base64)} chars")
    logger.info(f"📸 Redesign image: {len(redesign_image_base64)} chars")
    
    try:
        # Step 1: Generate both videos concurrently
        task_ids = generate_dual_videos(original_image_base64, redesign_image_base64, duration)
        
        if not task_ids or len(task_ids) != 2:
            return {
                "status": "error",
                "error": "Failed to initiate dual video generation"
            }
        
        original_task_id, redesign_task_id = task_ids
        logger.info(f"✅ Both videos initiated - Original: {original_task_id}, Redesign: {redesign_task_id}")
        
        # Step 2: Poll both tasks concurrently
        video_urls = poll_dual_videos(original_task_id, redesign_task_id)
        
        if not video_urls or len(video_urls) != 2:
            return {
                "status": "error",
                "error": "Failed to complete dual video generation"
            }
        
        original_url, redesign_url = video_urls
        logger.info(f"✅ Both videos completed")
        
        # Step 3: Download both videos
        original_path, redesign_path = download_videos(original_url, redesign_url)
        
        # Step 4: Merge with ffmpeg
        merged_path = merge_videos_ffmpeg(original_path, redesign_path)
        
        # Step 5: Convert to base64 data URL for frontend
        logger.info(f"📦 Converting video to base64...")
        with open(merged_path, 'rb') as f:
            video_bytes = f.read()
        
        import base64
        video_base64 = base64.b64encode(video_bytes).decode('utf-8')
        video_data_url = f"data:video/mp4;base64,{video_base64}"
        
        # Clean up merged file
        os.unlink(merged_path)
        logger.info("🗑️  Merged file cleaned up")
        
        logger.info(f"🎉 Final video created ({len(video_base64)} chars)")
        
        return {
            "status": "completed",
            "video_url": video_data_url
        }
        
    except Exception as e:
        logger.error(f"❌ Pipeline error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

def generate_single_video(image_base64: str, video_type: str, duration: int) -> str:
    """
    Generate a single video from an image.
    
    Args:
        image_base64: Base64 encoded image
        video_type: "original" or "redesign" for logging
        duration: Video duration in seconds
    
    Returns:
        task_id if successful, None otherwise
    """
    headers = {
        "x-freepik-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "prompt": f"Subtle cinematic camera movement, smooth pan across the yard, high quality, photorealistic, 4k",
        "image": image_base64,
        "duration": str(duration),
        "cfg_scale": 0.5
    }
    
    try:
        logger.info(f"🎬 Initiating {video_type} video generation...")
        response = requests.post(
            FREEPIK_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            task_id = result.get("data", {}).get("task_id")
            logger.info(f"✅ {video_type.capitalize()} video started - Task ID: {task_id}")
            return task_id
        else:
            logger.error(f"❌ Failed to start {video_type} video: {response.status_code}")
            logger.error(response.text)
            return None
            
    except Exception as e:
        logger.error(f"❌ {video_type.capitalize()} video error: {e}")
        return None

def generate_dual_videos(original_image: str, redesign_image: str, duration: int) -> tuple:
    """
    Generate both videos concurrently.
    
    Returns:
        (original_task_id, redesign_task_id)
    """
    with ThreadPoolExecutor(max_workers=2) as executor:
        original_future = executor.submit(generate_single_video, original_image, "original", duration)
        redesign_future = executor.submit(generate_single_video, redesign_image, "redesign", duration)
        
        original_task_id = original_future.result()
        redesign_task_id = redesign_future.result()
        
        return (original_task_id, redesign_task_id)

def poll_single_video(task_id: str, video_type: str, max_wait: int = 300) -> str:
    """
    Poll a single video task until completion.
    
    Returns:
        video_url if successful, None otherwise
    """
    headers = {
        "x-freepik-api-key": API_KEY
    }
    
    status_url = f"{FREEPIK_API_URL}/{task_id}"
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            response = requests.get(status_url, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                data = result.get("data", {})
                status = data.get("status")
                
                if status == "COMPLETED":
                    generated = data.get("generated", [])
                    if generated and isinstance(generated, list) and len(generated) > 0:
                        video_url = generated[0]
                        logger.info(f"🎉 {video_type.capitalize()} video complete: {video_url[:50]}...")
                        return video_url
                    else:
                        logger.error(f"❌ {video_type.capitalize()} video: No URL in response")
                        return None
                        
                elif status == "failed":
                    logger.error(f"❌ {video_type.capitalize()} video failed")
                    return None
                else:
                    logger.info(f"⏳ {video_type.capitalize()} video in progress... ({status})")
                    time.sleep(5)
            else:
                logger.error(f"❌ {video_type.capitalize()} status check failed: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ {video_type.capitalize()} polling error: {e}")
            return None
    
    logger.error(f"❌ {video_type.capitalize()} video timed out")
    return None

def poll_dual_videos(original_task_id: str, redesign_task_id: str) -> tuple:
    """
    Poll both video tasks concurrently.
    
    Returns:
        (original_url, redesign_url)
    """
    with ThreadPoolExecutor(max_workers=2) as executor:
        original_future = executor.submit(poll_single_video, original_task_id, "original")
        redesign_future = executor.submit(poll_single_video, redesign_task_id, "redesign")
        
        original_url = original_future.result()
        redesign_url = redesign_future.result()
        
        return (original_url, redesign_url)

def download_video(url: str, video_type: str) -> str:
    """
    Download a video from URL to temp file.
    
    Returns:
        Path to downloaded file
    """
    logger.info(f"📥 Downloading {video_type} video...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{video_type}.mp4")
    
    with open(temp_file.name, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    logger.info(f"✅ {video_type.capitalize()} video downloaded: {temp_file.name}")
    return temp_file.name

def download_videos(original_url: str, redesign_url: str) -> tuple:
    """
    Download both videos concurrently.
    
    Returns:
        (original_path, redesign_path)
    """
    with ThreadPoolExecutor(max_workers=2) as executor:
        original_future = executor.submit(download_video, original_url, "original")
        redesign_future = executor.submit(download_video, redesign_url, "redesign")
        
        original_path = original_future.result()
        redesign_path = redesign_future.result()
        
        return (original_path, redesign_path)

def merge_videos_ffmpeg(original_path: str, redesign_path: str) -> str:
    """
    Merge two videos with a crossfade transition using ffmpeg.
    
    Handles videos with different resolutions by scaling both to match.
    
    Transition:
    - 0-4s: Original video
    - 4-5s: 1-second crossfade
    - 5-10s: Redesign video
    
    Returns:
        Path to merged video
    """
    logger.info("🎬 Merging videos with ffmpeg crossfade...")
    
    output_file = tempfile.NamedTemporaryFile(delete=False, suffix="_merged.mp4")
    output_path = output_file.name
    output_file.close()
    
    # ffmpeg command with scaling to handle different resolutions
    # Scale both videos to 1920x1080 (common resolution) before crossfade
    cmd = [
        "ffmpeg",
        "-y",  # Overwrite output file
        "-i", original_path,
        "-i", redesign_path,
        "-filter_complex",
        # Scale both inputs to 1920x1080, then apply crossfade
        "[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v0];"
        "[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v1];"
        "[v0][v1]xfade=transition=fade:duration=1:offset=4[outv]",
        "-map", "[outv]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",  # Ensure compatible pixel format
        output_path
    ]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        logger.info(f"✅ Videos merged successfully: {output_path}")
        
        # Clean up temp files
        os.unlink(original_path)
        os.unlink(redesign_path)
        logger.info("🗑️  Temp files cleaned up")
        
        return output_path
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ ffmpeg error: {e.stderr}")
        # Clean up on error
        if os.path.exists(output_path):
            os.unlink(output_path)
        if os.path.exists(original_path):
            os.unlink(original_path)
        if os.path.exists(redesign_path):
            os.unlink(redesign_path)
        raise

if __name__ == "__main__":
    # Test with placeholder
    print("Video Generator Module - Use via API endpoint")
