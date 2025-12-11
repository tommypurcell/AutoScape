import { Type } from "@google/genai";

export enum LocationType {
  HOME_GARDEN = "Home Garden",
  BACKYARD = "Backyard",
  FRONT_YARD = "Front Yard",
  PARK = "Park",
  COMMERCIAL = "Commercial Space",
  ROOFTOP = "Rooftop Garden",
}

export enum SpaceSize {
  SMALL = "Small (Home Garden)",
  MEDIUM = "Medium (Park)",
  LARGE = "Large (Cityscape)",
}

// Grouped design styles
export const DesignStyleGroups = {
  "Modern & Contemporary": [
    "Modern Minimalist",
    "Contemporary Urban",
    "Scandinavian Simple",
  ],
  "Traditional & Classic": [
    "English Cottage Garden",
    "French Formal Garden",
    "Victorian Garden",
    "Colonial Garden",
  ],
  "Regional & Cultural": [
    "Japanese Zen Garden",
    "Mediterranean",
    "Tropical Paradise",
    "Desert Xeriscape",
  ],
  "Eco-Friendly & Natural": [
    "Native Wildflower Meadow",
    "Pollinator Garden",
    "Sustainable Permaculture",
    "Rain Garden",
  ],
  "Specialty Styles": [
    "Mid-Century Modern",
    "Rustic Farmhouse",
    "Coastal Beach Garden",
    "Mountain Lodge",
  ],
};

// Flatten for backwards compatibility
export enum DesignStyle {
  ENGLISH_COTTAGE = "English Cottage Garden",
  ENGLISH_LANDSCAPE = "English Landscape Park",
  FRENCH_FORMAL = "French Formal",
  ITALIAN_RENAISSANCE = "Italian Renaissance",
  MEDITERRANEAN = "Mediterranean",
  TUSCAN = "Tuscan",
  MOORISH = "Moorish / Islamic",
  JAPANESE_ZEN = "Japanese Zen Garden",
  JAPANESE_TEA = "Japanese Tea Garden",
  CHINESE_SCHOLAR = "Chinese Scholar’s Garden",
  TROPICAL = "Tropical / Balinese",
  MODERN_MINIMALIST = "Modern Minimalist",
  CONTEMPORARY = "Contemporary",
  DESERT = "Desert / Xeriscape",
  SOUTHWESTERN = "Southwestern",
  PRAIRIE = "Prairie",
  WOODLAND = "Woodland",
  COASTAL = "Coastal",
  COLONIAL = "Colonial Revival",
  ALPINE = "Alpine / Rock Garden",
}

export interface MaterialItem {
  name: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  notes: string;
}

export interface PlantReference {
  common_name: string;
  botanical_name: string;
  image_url: string;
  quantity: number;
  size: string;
  unit_price: string;
  total_estimate: string;
  rag_verified: boolean;
}

export interface CostEstimate {
  totalCost: number;
  currency: string;
  breakdown: MaterialItem[];
  plantPalette?: PlantReference[];  // RAG-verified plants with images
  ragEnhanced?: boolean;
}

export interface DesignAnalysis {
  currentLayout: string;
  designConcept: string;
  visualDescription: string;
  maintenanceLevel: string;
}

export interface GeneratedDesign {
  analysis: DesignAnalysis;
  estimates: CostEstimate;
  renderImages: string[]; // Array of image URLs (Base64 data URIs from Gemini OR Firebase Storage URLs after save)
  planImage: string | null;   // Image URL (Base64 data URI from Gemini OR Firebase Storage URL after save)
  designJSON?: any; // Design specification from Phase 2 (plants, hardscape, features, etc.)
}

export interface AppState {
  step: 'upload' | 'processing' | 'results';
  yardImage: File | null;
  yardImagePreview: string | null;
  styleImages: File[];
  styleImagePreviews: string[];
  userPrompt: string;
  selectedStyle: DesignStyle | string;
  locationType: LocationType;
  spaceSize: SpaceSize;
  useRag: boolean;
  result: GeneratedDesign | null;
  error: string | null;
}

// Schema for Gemini JSON Output (Cost Analysis)
export const AnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    currentLayout: { type: Type.STRING, description: "Brief analysis of the yard elements visible in the RENDERED image." },
    designConcept: { type: Type.STRING, description: "Marketing-style description of the design shown in the render." },
    visualDescription: { type: Type.STRING, description: "A detailed description of the scene." },
    maintenanceLevel: { type: Type.STRING, description: "Estimated maintenance effort (Low, Medium, High)." },
    totalCost: { type: Type.NUMBER, description: "Best estimate total cost in USD (single number, no range)." },
    materials: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.STRING, description: "e.g. '500 sq ft', '12 plants'" },
          unitCost: { type: Type.STRING, description: "e.g. '$5/sq ft'" },
          totalCost: { type: Type.STRING, description: "e.g. '$2500'" },
          notes: { type: Type.STRING },
        },
        required: ["name", "quantity", "unitCost", "totalCost"],
      },
    },
  },
  required: ["currentLayout", "designConcept", "visualDescription", "maintenanceLevel", "totalCost", "materials"],
};