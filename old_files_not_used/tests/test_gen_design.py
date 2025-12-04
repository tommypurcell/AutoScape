from freepik_agent import FreepikLandscapingAgent
from PIL import Image
import os

def test_workflow():
    if not os.path.exists("place.jpg") or not os.path.exists("concept.jpg"):
        print("❌ Please download sample images first (place.jpg, concept.jpg)")
        return

    print("🚀 Initializing Agent...")
    agent = FreepikLandscapingAgent()
    
    print("\n🖼️  Loading images...")
    place_img = Image.open("place.jpg")
    concept_img = Image.open("concept.jpg")
    
    print("\n⚙️  Running Generative Design & Budgeting Workflow...")
    try:
        result = agent.generate_design_and_budget(place_img, concept_img)
        
        print("\n✅ Workflow Complete!")
        
        print("\n📊 Analysis:")
        print(f"   Style: {result['analysis'].get('design_style')}")
        print(f"   Constraints: {result['analysis'].get('constraints')}")
        
        print("\n🎨 Generated Design:")
        result['generated_design'].save("generated_design.png")
        print("   Saved to 'generated_design.png'")
        
        print("\n📝 Identified Items:")
        for item in result['items']:
            print(f"   - {item}")
            
        print("\n💰 Budget Estimate:")
        print(f"   Total: ${result['budget']['total_min_budget']}")
        print("\n   Line Items:")
        for item in result['budget']['line_items']:
            print(f"   - {item['item']} -> Match: {item['match']} (${item['cost']})")
            
    except Exception as e:
        print(f"\n❌ Workflow failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_workflow()
