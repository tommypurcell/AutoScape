import { Type } from "@google/genai";

export enum DesignStyle {
  MODERN = "Modern & Minimalist",
  XERISCAPE = "Xeriscape & Drought Tolerant",
  COTTAGE = "English Cottage Garden",
  JAPANESE = "Japanese Zen Garden",
  TROPICAL = "Lush Tropical",
  MEDITERRANEAN = "Mediterranean",
  NATIVE = "Native Wildflower",
}

export interface MaterialItem {
  name: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  notes: string;
}

export interface CostEstimate {
  totalCost: number;
  currency: string;
  breakdown: MaterialItem[];
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
  renderImages: string[]; // Array of Base64 data URIs (will contain 1 item)
  planImage: string | null;   // Base64 data URI
}

export interface AppState {
  step: 'upload' | 'processing' | 'results';
  yardImage: File | null;
  yardImagePreview: string | null;
  styleImages: File[];
  styleImagePreviews: string[];
  userPrompt: string;
  selectedStyle: DesignStyle | string;
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