import os
import sys
import base64
import logging
from dotenv import load_dotenv

# Load env
load_dotenv()

# Setup logging to stdout
logging.basicConfig(level=logging.INFO)

# Import function
from video_generator import generate_transformation_video

def test_real_api():
    print("🚀 Starting real API test...")
    
    # Read a real image
    img_path = "concept.jpg"
    if not os.path.exists(img_path):
        print(f"❌ Image {img_path} not found")
        return

    with open(img_path, "rb") as f:
        img_bytes = f.read()
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        
    print(f"📸 Loaded image ({len(img_base64)} chars)")
    
    # Call generation
    # We use the same image for original and redesign for this test
    result = generate_transformation_video(img_base64, img_base64)
    
    print("\n📊 Result:")
    print(result)

if __name__ == "__main__":
    test_real_api()
