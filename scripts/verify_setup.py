#!/usr/bin/env python3
"""
Verify that all required environment variables and APIs are configured correctly.
Run this before using the ad generation agent.
"""

import os
import sys
from dotenv import load_dotenv


def check_env_var(name: str) -> bool:
    """Check if an environment variable is set."""
    value = os.getenv(name)
    if value:
        print(f"✓ {name}: {'*' * 10}{value[-4:] if len(value) > 4 else '****'}")
        return True
    else:
        print(f"✗ {name}: NOT SET")
        return False


def verify_qdrant():
    """Verify Qdrant connection."""
    print("\n🔍 Verifying Qdrant connection...")
    try:
        from qdrant_client import QdrantClient
        
        url = os.getenv("QDRANT_URL")
        api_key = os.getenv("QDRANT_API_KEY")
        collection = os.getenv("QDRANT_COLLECTION", "shopping-queries-images")
        
        if not url or not api_key:
            print("✗ Qdrant credentials not set")
            return False
        
        client = QdrantClient(url=url, api_key=api_key)
        
        # Try to get collection info
        info = client.get_collection(collection_name=collection)
        print(f"✓ Connected to Qdrant")
        print(f"  Collection: {collection}")

        print(f"  Points: {info.points_count}")
        return True
        
    except Exception as e:
        print(f"✗ Qdrant connection failed: {e}")
        return False


def verify_gemini():
    """Verify Gemini API."""
    print("\n🤖 Verifying Gemini API...")
    try:
        from google import genai
        
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("✗ Gemini API key not set")
            return False
        
        client = genai.Client(api_key=api_key)
        
        # Test with a simple query
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents="Say 'Hello'"
        )
        if response.text:
            print(f"✓ Gemini API working")
            print(f"  Model: gemini-2.0-flash-exp")
            return True
        else:
            print("✗ Gemini API returned empty response")
            return False
            
    except Exception as e:
        print(f"✗ Gemini API failed: {e}")
        return False


def verify_freepik():
    """Verify Freepik API."""
    print("\n🎨 Verifying Freepik API...")
    try:
        import requests
        
        api_key = os.getenv("FREEPIK_API_KEY")
        if not api_key:
            print("✗ Freepik API key not set")
            return False
        
        # Test with a simple API call (checking auth)
        headers = {
            "x-freepik-api-key": api_key,
        }
        
        # Try to access the API (this endpoint might not exist, but it will validate the key)
        response = requests.get(
            "https://api.freepik.com/v1/ai/models",
            headers=headers,
            timeout=10
        )
        
        if response.status_code in [200, 404]:  # 404 is ok, means auth worked
            print(f"✓ Freepik API key valid")
            return True
        elif response.status_code == 401:
            print(f"✗ Freepik API key invalid (401 Unauthorized)")
            return False
        else:
            print(f"⚠️  Freepik API returned status {response.status_code}")
            print(f"   This might be okay - continuing...")
            return True
            
    except Exception as e:
        print(f"✗ Freepik API failed: {e}")
        return False


def verify_dependencies():
    """Verify that all required Python packages are installed."""
    print("\n📦 Verifying Python dependencies...")
    
    required = [
        "qdrant_client",
        "fastembed",
        "google.genai",
        "dotenv",
        "PIL",
        "requests",
    ]
    
    all_ok = True
    for package in required:
        try:
            # Handle special cases
            if package == "dotenv":
                __import__("dotenv")
            elif package == "PIL":
                __import__("PIL")
            elif package == "google.genai":
                from google import genai
            else:
                __import__(package)
            print(f"✓ {package}")
        except ImportError:
            print(f"✗ {package} not installed")
            all_ok = False
    
    return all_ok


def main():
    """Main verification function."""
    print("=" * 70)
    print("🔧 AD GENERATION AGENT - SETUP VERIFICATION")
    print("=" * 70)
    
    # Load environment variables
    load_dotenv()
    print("\n📄 Checking environment variables...")
    
    required_vars = [
        "QDRANT_URL",
        "QDRANT_API_KEY",
        "GEMINI_API_KEY",
        "FREEPIK_API_KEY",
    ]
    
    optional_vars = [
        "QDRANT_COLLECTION",
        "TEXT_EMBEDDING_MODEL",
        "EMBEDDING_MODEL",
    ]
    
    # Check required variables
    all_set = True
    for var in required_vars:
        if not check_env_var(var):
            all_set = False
    
    print("\n📝 Optional variables:")
    for var in optional_vars:
        value = os.getenv(var)
        if value:
            print(f"  {var}: {value}")
        else:
            print(f"  {var}: Using default")
    
    if not all_set:
        print("\n❌ Missing required environment variables!")
        print("Please create a .env file with all required variables.")
        return False
    
    # Verify dependencies
    if not verify_dependencies():
        print("\n❌ Missing Python dependencies!")
        print("Please run: pip install -r requirements.txt")
        return False
    
    # Verify each service
    checks = [
        verify_qdrant(),
        verify_gemini(),
        verify_freepik(),
    ]
    
    # Summary
    print("\n" + "=" * 70)
    if all(checks):
        print("✅ ALL CHECKS PASSED!")
        print("You're ready to use the ad generation agent.")
        print("\nTry: python agent.py \"beach vacation essentials\"")
        return True
    else:
        print("⚠️  SOME CHECKS FAILED")
        print("Please fix the issues above before using the agent.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)



