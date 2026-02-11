"""
Meshy.ai 3D Scene Generator Module

Generates 3D models from landscape images using Meshy.ai's Image-to-3D API.
The output is a GLB file that can be rendered in Three.js.
"""

import os
import time
import base64
import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Get API key from environment
MESHY_API_KEY = os.getenv("MESHY_API_KEY")
MESHY_API_BASE = "https://api.meshy.ai/v2"


def generate_3d_scene(
    image_base64: str,
    enable_pbr: bool = True,
    surface_mode: str = "hard",
    target_polycount: int = 30000
) -> dict:
    """
    Generate a 3D model from a landscape image using Meshy.ai.

    Args:
        image_base64: Base64-encoded image (the rendered landscape design)
        enable_pbr: Enable PBR textures for realistic rendering
        surface_mode: 'hard' for outdoor scenes, 'organic' for plants
        target_polycount: Target polygon count for the mesh

    Returns:
        dict with status, model_url (GLB), thumbnail_url, etc.
    """
    logger.info("=" * 80)
    logger.info("🎨 STARTING 3D SCENE GENERATION (Meshy.ai)")
    logger.info("=" * 80)

    if not MESHY_API_KEY:
        logger.error("❌ MESHY_API_KEY not found in environment")
        return {
            "status": "error",
            "error": "MESHY_API_KEY not found in environment"
        }

    logger.info(f"✅ MESHY_API_KEY present: {MESHY_API_KEY[:10]}...")
    logger.info(f"📸 Image size: {len(image_base64)} chars")

    headers = {
        "Authorization": f"Bearer {MESHY_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        # Step 1: Create Image-to-3D task
        logger.info("🚀 Creating Image-to-3D task...")

        # Meshy accepts base64 with data URI prefix
        if not image_base64.startswith("data:"):
            image_data_url = f"data:image/png;base64,{image_base64}"
        else:
            image_data_url = image_base64

        create_payload = {
            "image_url": image_data_url,
            "enable_pbr": enable_pbr,
            "surface_mode": surface_mode,
            "target_polycount": target_polycount,
            "should_remesh": True
        }

        create_response = requests.post(
            f"{MESHY_API_BASE}/image-to-3d",
            headers=headers,
            json=create_payload,
            timeout=30
        )

        if create_response.status_code != 200 and create_response.status_code != 202:
            error_detail = create_response.text
            logger.error(f"❌ Meshy API error: {error_detail}")
            return {
                "status": "error",
                "error": f"Meshy API error: {error_detail}"
            }

        task_data = create_response.json()
        task_id = task_data.get("result")

        if not task_id:
            return {
                "status": "error",
                "error": "No task ID returned from Meshy API"
            }

        logger.info(f"✅ Task created: {task_id}")

        # Step 2: Poll for completion
        max_wait = 300  # 5 minutes max
        poll_interval = 5  # Check every 5 seconds
        elapsed = 0

        while elapsed < max_wait:
            logger.info(f"⏳ Polling task status... ({elapsed}s elapsed)")

            status_response = requests.get(
                f"{MESHY_API_BASE}/image-to-3d/{task_id}",
                headers=headers,
                timeout=30
            )

            if status_response.status_code != 200:
                logger.warning(f"⚠️ Status check failed: {status_response.text}")
                time.sleep(poll_interval)
                elapsed += poll_interval
                continue

            status_data = status_response.json()
            status = status_data.get("status")

            logger.info(f"📊 Task status: {status}")

            if status == "SUCCEEDED":
                model_urls = status_data.get("model_urls", {})
                glb_url = model_urls.get("glb")
                fbx_url = model_urls.get("fbx")
                obj_url = model_urls.get("obj")
                thumbnail_url = status_data.get("thumbnail_url")

                logger.info(f"🎉 3D model generated successfully!")
                logger.info(f"   GLB URL: {glb_url}")

                return {
                    "status": "completed",
                    "model_url": glb_url,  # Primary format for Three.js
                    "glb_url": glb_url,
                    "fbx_url": fbx_url,
                    "obj_url": obj_url,
                    "thumbnail_url": thumbnail_url,
                    "task_id": task_id
                }

            elif status == "FAILED":
                error_msg = status_data.get("task_error", {}).get("message", "Unknown error")
                logger.error(f"❌ Task failed: {error_msg}")
                return {
                    "status": "error",
                    "error": f"3D generation failed: {error_msg}"
                }

            elif status in ["PENDING", "IN_PROGRESS"]:
                progress = status_data.get("progress", 0)
                logger.info(f"   Progress: {progress}%")
                time.sleep(poll_interval)
                elapsed += poll_interval
            else:
                # Unknown status, keep waiting
                time.sleep(poll_interval)
                elapsed += poll_interval

        return {
            "status": "error",
            "error": f"3D generation timed out after {max_wait} seconds"
        }

    except requests.exceptions.Timeout:
        logger.error("❌ Request timeout")
        return {
            "status": "error",
            "error": "Request to Meshy API timed out"
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error: {e}")
        return {
            "status": "error",
            "error": f"Request error: {str(e)}"
        }
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


def get_task_status(task_id: str) -> dict:
    """
    Get the status of a 3D generation task.
    Useful for async polling from the frontend.
    """
    if not MESHY_API_KEY:
        return {"status": "error", "error": "MESHY_API_KEY not found"}

    headers = {
        "Authorization": f"Bearer {MESHY_API_KEY}"
    }

    try:
        response = requests.get(
            f"{MESHY_API_BASE}/image-to-3d/{task_id}",
            headers=headers,
            timeout=30
        )

        if response.status_code != 200:
            return {"status": "error", "error": response.text}

        data = response.json()
        status = data.get("status")

        result = {
            "status": status.lower() if status else "unknown",
            "progress": data.get("progress", 0),
            "task_id": task_id
        }

        if status == "SUCCEEDED":
            model_urls = data.get("model_urls", {})
            result["model_url"] = model_urls.get("glb")
            result["glb_url"] = model_urls.get("glb")
            result["thumbnail_url"] = data.get("thumbnail_url")
            result["status"] = "completed"
        elif status == "FAILED":
            result["error"] = data.get("task_error", {}).get("message", "Unknown error")
            result["status"] = "error"

        return result

    except Exception as e:
        return {"status": "error", "error": str(e)}


if __name__ == "__main__":
    print("Meshy 3D Generator Module - Use via API endpoint")
