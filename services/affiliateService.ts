// affiliateService.ts
// Service for generating Amazon affiliate links for materials in landscape designs
// Uses Gemini 3 Pro to detect objects in render images and create Amazon search queries

import { GoogleGenAI } from "@google/genai";
import { MaterialItem } from "../types";

// PRO model for object detection and material verification
const MODEL_REASONING = "gemini-3-pro-preview";

// Amazon Associate Tag (replace with your actual affiliate tag)
const AMAZON_ASSOCIATE_TAG = import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || "autoscape-20";

const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.VITE_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY;

export interface VerifiedMaterialItem extends MaterialItem {
  verified: boolean;
  amazonSearchUrl: string;
  searchQuery: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AffiliateLinksResult {
  verifiedMaterials: VerifiedMaterialItem[];
  totalItems: number;
  verifiedCount: number;
  unverifiedCount: number;
}

// Helper to convert image URL to base64
const imageUrlToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

// Generate Amazon search URL with affiliate tag
function toAmazonSearchQuery(text: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(text)}&tag=${AMAZON_ASSOCIATE_TAG}`;
}

/**
 * Step 1: Detect objects in render image using Gemini Vision
 * Step 2: Turn each object into an Amazon search query
 * Step 3: Return verified materials with Amazon search URLs
 */
export const generateAffiliateLinks = async (
  renderImageUrl: string,
  materials: MaterialItem[]
): Promise<AffiliateLinksResult> => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    console.log('🔍 Detecting objects in render image...');
    console.log(`  Analyzing ${materials.length} materials against render image`);

    // Convert render image to base64
    const renderBase64 = await imageUrlToBase64(renderImageUrl);
    const imageMimeType = renderImageUrl.includes('.png') ? 'image/png' : 'image/jpeg';

    // Prepare materials list for analysis
    const materialsText = materials.map((item, idx) => {
      return `${idx + 1}. ${item.name} (${item.quantity})`;
    }).join('\n');

    // Step 1: Detect objects and verify materials
    console.log('Step 1: Detecting objects and verifying materials...');
    const detectionPrompt = `
      You are an expert at detecting and identifying objects in landscape design images.
      
      TASK: Analyze the landscape render image and detect all visible materials, plants, and features. Then cross-reference with the provided materials list.
      
      MATERIALS LIST:
      ${materialsText}
      
      INSTRUCTIONS:
      1. Detect all objects visible in the render image (plants, hardscape materials, features, etc.)
      2. For each item in the materials list, determine:
         - Is this item visible in the image? (verified: true/false)
         - What is the best Amazon search query to find this product? (use common, searchable terms)
         - Confidence level: high (clearly visible), medium (likely present), low (uncertain)
      
      OUTPUT FORMAT (JSON):
      {
        "verifiedItems": [
          {
            "originalName": "string - exact name from materials list",
            "verified": boolean,
            "searchQuery": "string - optimized Amazon search query (e.g., 'Japanese Maple tree', 'concrete pavers', 'outdoor lighting')",
            "confidence": "high" | "medium" | "low"
          }
        ]
      }
      
      CRITICAL RULES:
      - Use simple, common product names for search queries (e.g., "Japanese Maple tree" not "Acer palmatum")
      - For hardscape: be specific (e.g., "concrete pavers", "stone edging", "gravel")
      - For plants: use common names (e.g., "lavender plants", "boxwood shrubs")
      - Make search queries specific enough to find the right product category
    `;

    const detectionParts: any[] = [
      { inlineData: { mimeType: imageMimeType, data: renderBase64 } },
      { text: `[Landscape Render Image - Detect objects and materials in this image]` },
      { text: detectionPrompt }
    ];

    const detectionRes = await ai.models.generateContent({
      model: MODEL_REASONING,
      contents: { parts: detectionParts },
      config: {
        responseMimeType: "application/json",
      }
    });

    const detectionData = JSON.parse(detectionRes.text || "{}");
    console.log('✅ Object detection completed');

    // Step 2: Turn each object into Amazon search query
    console.log('Step 2: Generating Amazon search URLs...');
    const verifiedMaterials: VerifiedMaterialItem[] = [];

    for (const verifiedItem of detectionData.verifiedItems || []) {
      // Find the original material item
      const originalItem = materials.find(m => 
        m.name.toLowerCase().includes(verifiedItem.originalName.toLowerCase()) ||
        verifiedItem.originalName.toLowerCase().includes(m.name.toLowerCase())
      );

      if (!originalItem) continue;

      // Generate Amazon search URL using the search query
      const searchQuery = verifiedItem.searchQuery || originalItem.name;
      const amazonSearchUrl = toAmazonSearchQuery(searchQuery);

      verifiedMaterials.push({
        ...originalItem,
        verified: verifiedItem.verified || false,
        amazonSearchUrl,
        searchQuery,
        confidence: verifiedItem.confidence || 'medium',
      });
    }

    // Add any materials that weren't detected but should still have links
    for (const material of materials) {
      if (!verifiedMaterials.find(v => v.name === material.name)) {
        verifiedMaterials.push({
          ...material,
          verified: false,
          searchQuery: material.name,
          amazonSearchUrl: toAmazonSearchQuery(material.name),
          confidence: 'low',
        });
      }
    }

    console.log(`✅ Generated Amazon links for ${verifiedMaterials.length} items`);

    return {
      verifiedMaterials,
      totalItems: materials.length,
      verifiedCount: verifiedMaterials.filter(m => m.verified).length,
      unverifiedCount: verifiedMaterials.filter(m => !m.verified).length,
    };

  } catch (error) {
    console.error("Affiliate Link Generation Error:", error);
    throw error;
  }
};

/**
 * Generate a simple Amazon search URL for a material item
 */
export const generateSimpleAmazonLink = (itemName: string): string => {
  return toAmazonSearchQuery(itemName);
};

