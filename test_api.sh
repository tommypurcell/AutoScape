#!/bin/bash

# Test the /api/freepik/generate-design endpoint
# Usage: ./test_api.sh

echo "🧪 Testing Freepik RAG API - Generate Design Endpoint"
echo ""

# Check if API is running
echo "1️⃣ Checking if API server is running..."
if ! curl -s http://localhost:8002/ > /dev/null; then
    echo "❌ API server not running. Start with: python3 freepik_api.py"
    exit 1
fi
echo "✅ API server is running"
echo ""

# Download test images if not present
if [ ! -f "test_place.jpg" ] || [ ! -f "test_concept.jpg" ]; then
    echo "2️⃣ Downloading test images..."
    # Backyard (place)
    curl -s -o test_place.jpg "https://images.pexels.com/photos/1329711/pexels-photo-1329711.jpeg?w=800" 
    # Zen garden (concept)
    curl -s -o test_concept.jpg "https://images.pexels.com/photos/2403209/pexels-photo-2403209.jpeg?w=800"
    echo "✅ Test images downloaded"
else
    echo "2️⃣ Using existing test images"
fi
echo ""

# Test the endpoint
echo "3️⃣ Calling /api/freepik/generate-design..."
echo ""

response=$(curl -s -X POST http://localhost:8002/api/freepik/generate-design \
  -F "place_image=@test_place.jpg" \
  -F "concept_image=@test_concept.jpg")

if echo "$response" | jq . > /dev/null 2>&1; then
    echo "✅ API Response (formatted):"
    echo "$response" | jq '{
        design_style: .analysis.design_style,
        constraints: .analysis.constraints,
        item_count: (.items | length),
        items: .items,
        total_budget: .budget.total_min_budget,
        line_items: .budget.line_items
    }'
    
    # Save generated image
    echo "$response" | jq -r '.generated_image_base64' | base64 -d > generated_result.png
    echo ""
    echo "💾 Generated design saved to: generated_result.png"
else
    echo "❌ Error from API:"
    echo "$response"
fi
