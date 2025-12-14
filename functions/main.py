"""
Firebase Cloud Functions for AutoScape - Video Generation

Uses Gemini Veo 3.1 API for before→after transformation videos.
"""

import os
import time
import base64
import tempfile
from firebase_functions import https_fn, options
from google import genai
from google.genai import types


# Set memory and timeout for video generation (processing intensive)
options.set_global_options(
    region="us-central1",
    memory=options.MemoryOption.GB_1,
    timeout_sec=540  # 9 minutes max
)


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins="*",
        cors_methods=["GET", "POST", "OPTIONS"]
    ),
    secrets=["GEMINI_API_KEY"]
)
def generate_video(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP Cloud Function for video generation.
    
    Expects JSON body with:
    - original_image: base64 encoded original yard image
    - redesign_image: base64 encoded redesigned yard image
    
    Returns JSON with:
    - status: "completed" or "error"
    - video_url: base64 data URL of the video (if successful)
    - error: error message (if failed)
    """
    import json
    
    try:
        # Parse request
        data = req.get_json()
        if not data:
            return https_fn.Response(
                json.dumps({"status": "error", "error": "No JSON body provided"}),
                status=400,
                mimetype="application/json"
            )
        
        original_base64 = data.get("original_image")
        redesign_base64 = data.get("redesign_image")
        
        if not original_base64 or not redesign_base64:
            return https_fn.Response(
                json.dumps({"status": "error", "error": "Missing original_image or redesign_image"}),
                status=400,
                mimetype="application/json"
            )
        
        # Get API key from secret
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return https_fn.Response(
                json.dumps({"status": "error", "error": "GEMINI_API_KEY not configured"}),
                status=500,
                mimetype="application/json"
            )
        
        # Generate video

        provider = data.get("provider", "gemini")
        
        # Generate video
        result = generate_transformation_video(original_base64, redesign_base64, api_key, provider)
        
        status_code = 200 if result["status"] == "completed" else 500
        return https_fn.Response(
            json.dumps(result),
            status=status_code,
            mimetype="application/json"
        )
        
    except Exception as e:
        return https_fn.Response(
            json.dumps({"status": "error", "error": str(e)}),
            status=500,
            mimetype="application/json"
        )


def generate_transformation_video(original_base64: str, redesign_base64: str, api_key: str, provider: str = "gemini") -> dict:
    """
    Generate video using specified provider.
    """
    provider = provider.lower()
    
    if provider == "freepik":
        return generate_freepik_video(original_base64, redesign_base64)
    
    return generate_gemini_video(original_base64, redesign_base64, api_key)


def generate_freepik_video(original_base64: str, redesign_base64: str) -> dict:
    """
    Generate video using Freepik (Mock with reliable video source).
    For demo purposes, returns a simple working video.
    """
    time.sleep(2)  # Simulate API latency
    
    # Use a simple test video that's publicly accessible (Internet Archive)
    # This is a short nature clip that should work anywhere
    return {
        "status": "completed",
        "video_url": "https://ia800501.us.archive.org/10/items/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
        "provider": "freepik"
    }


def generate_gemini_video(original_base64: str, redesign_base64: str, api_key: str) -> dict:
    """
    Generate video using Gemini Veo 3.1.
    """
    try:
        # Initialize client
        client = genai.Client(api_key=api_key)
        
        # Decode base64 to bytes
        original_bytes = base64.b64decode(original_base64)
        redesign_bytes = base64.b64decode(redesign_base64)
        
        # Create image objects
        first_frame = types.Image(
            image_bytes=original_bytes,
            mime_type="image/png"
        )
        last_frame = types.Image(
            image_bytes=redesign_bytes,
            mime_type="image/png"
        )
        
        # Prompt for natural transition
        prompt = """Simple video interpolation between two landscape images.
        Natural, subtle transition from the first frame to the last frame.
        No dramatic effects or exaggeration.
        Keep everything realistic and grounded.
        Slight slow camera pan from left to right.
        Same scale, same framing, same perspective.
        Photorealistic quality.
        Silent."""
        
        # Generate video
        operation = client.models.generate_videos(
            model="veo-3.1-generate-preview",
            prompt=prompt,
            image=first_frame,
            config=types.GenerateVideosConfig(
                last_frame=last_frame,
            ),
        )
        
        # Poll for completion (max 8 minutes)
        max_wait = 480
        poll_interval = 10
        elapsed = 0
        
        while not operation.done:
            if elapsed >= max_wait:
                return {
                    "status": "error",
                    "error": f"Video generation timed out after {max_wait} seconds"
                }
            
            time.sleep(poll_interval)
            elapsed += poll_interval
            operation = client.operations.get(operation)
        
        # Get the video
        video = operation.response.generated_videos[0]
        
        # Download to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        temp_path = temp_file.name
        temp_file.close()
        
        client.files.download(file=video.video)
        video.video.save(temp_path)
        
        # Read and convert to base64
        with open(temp_path, 'rb') as f:
            video_bytes = f.read()
        
        video_base64 = base64.b64encode(video_bytes).decode('utf-8')
        video_data_url = f"data:video/mp4;base64,{video_base64}"
        
        # Clean up
        os.unlink(temp_path)
        
        return {
            "status": "completed",
            "video_url": video_data_url,
            "provider": "gemini"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
