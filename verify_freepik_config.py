import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def verify_freepik_config():
    print("🔍 Verifying Freepik Configuration...")
    
    # Check API Key
    api_key = os.getenv("FREEPIK_API_KEY")
    if not api_key:
        print("❌ FREEPIK_API_KEY is missing from environment variables!")
        return False
    
    # Mask key for display
    masked_key = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "****"
    print(f"✅ FREEPIK_API_KEY found: {masked_key}")
    
    # Verify video_generator.py usage
    try:
        from video_generator import API_KEY as MODULE_KEY, FREEPIK_API_URL
        
        if MODULE_KEY != api_key:
            print("❌ video_generator.py is using a different API key!")
            return False
            
        print(f"✅ video_generator.py is using the correct API key")
        print(f"✅ API URL: {FREEPIK_API_URL}")
        
        if "api.freepik.com/v1/ai/image-to-video/kling-v2" not in FREEPIK_API_URL:
            print("⚠️  Warning: API URL does not look like Freepik Kling v2 API")
            
    except ImportError:
        print("❌ Could not import video_generator.py")
        return False
        
    print("\n✅ Verification Successful: Video generation is configured to use Freepik with your API key.")
    return True

if __name__ == "__main__":
    success = verify_freepik_config()
    sys.exit(0 if success else 1)
