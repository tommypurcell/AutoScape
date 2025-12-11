// geminiService.ts
// This file contains the logic for interacting with the Google GenAI API
// It is used to generate landscape designs based on user input


import { GoogleGenAI } from "@google/genai";
import { AnalysisSchema, GeneratedDesign } from "../types";

// PRO model for reasoning, scene understanding, and complex JSON analysis
const MODEL_REASONING = "gemini-3-pro-preview";

// FLASH-IMAGE model for fast, high-quality visual generation
const MODEL_GENERATION = "gemini-2.5-flash-image";

// Helper to convert file to base64 string
const fileToGenericBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const extractImage = (res: any): string | null => {
  for (const part of res.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.VITE_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY;

export const generateLandscapeDesign = async (
  yardFile: File,
  styleFiles: File[],
  prompt: string,
  stylePreference: string,
  budget: string,
  onProgress?: (partialResult: Partial<GeneratedDesign>) => void,
  useRag: boolean = true
): Promise<GeneratedDesign> => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Convert files to base64
  const yardBase64 = await fileToGenericBase64(yardFile);
  const styleBase64Array: string[] = [];

  // Convert all style images to base64
  for (const styleFile of styleFiles) {
    const base64 = await fileToGenericBase64(styleFile);
    styleBase64Array.push(base64);
  }

  try {
    // -------------------------------------------------------------------------
    // PHASE 1: SCENE UNDERSTANDING & DESIGN INTENT (Pro Model)
    // -------------------------------------------------------------------------
    console.log("Phase 1: Scene Understanding");
    const analysisParts: any[] = [
      { inlineData: { mimeType: yardFile.type, data: yardBase64 } },
      { text: `[The User's Yard]` }
    ];

    if (styleFiles.length > 0) {
      styleFiles.forEach((styleFile, index) => {
        analysisParts.push({
          inlineData: { mimeType: styleFile.type, data: styleBase64Array[index] }
        });
        analysisParts.push({
          text: `[Style Reference Image ${index + 1}${styleFiles.length > 1 ? ` of ${styleFiles.length}` : ''}]`
        });
      });
    }

    analysisParts.push({
      text: `
      You are a Senior Landscape Architect.
      
      PHASE 1 TASK: Analyze the yard image to create a strict Scene JSON and Design JSON.
      
      1. SCENE JSON (The Truth): Identify the FIXED geometry that must not change.
         Structure:
         {
           "house": { "footprint": "...", "windows": "..." },
           "fences": "...",
           "shed": { "exists": boolean, "location": "..." },
           "terrain": "...",
           "existingTrees": "..."
         }
      
      2. DESIGN JSON (The Changes): Apply the user's request: "${prompt}" in style "${stylePreference}".
         ${budget ? `IMPORTANT: The user has a budget of "${budget}". Ensure the design features and materials are realistic for this budget.` : ''}
         Structure:
         {
           "newHardscape": "...",
           "newPlantings": "...",
           "furniture": "..."
         }

      OUTPUT FORMAT: Provide a structured text response containing these two JSON blocks clearly labeled.
      Do NOT invent structures that aren't in the photo.
    `});

    const sceneUnderstandingRes = await ai.models.generateContent({
      model: MODEL_REASONING,
      contents: { parts: analysisParts }
    });

    const sceneContext = sceneUnderstandingRes.text || "";
    console.log("Scene Context Generated:", sceneContext.substring(0, 200) + "...");

    // -------------------------------------------------------------------------
    // PHASE 2: GENERATE 3D RENDER (Image Model)
    // -------------------------------------------------------------------------
    console.log("Phase 2: Generating Render");

    const renderPrompt = `
      Act as a Photorealist Landscape Renderer.
      INPUT: [The User's Yard] (The base geometry).

      SCENE DATA (SOURCE OF TRUTH):
      ${sceneContext}

      TASK: Overpaint this specific view to match the Design JSON described above.

      STRICT RULES:
      1. GEOMETRY ANCHORS: You MUST keep the house architecture, windows, and perimeter fences EXACTLY as they appear in the input photo. Do not move the camera.
      2. STYLE: ${stylePreference}. Photorealistic, high definition.
      3. Do NOT hallucinate new buildings.

      ADDITIONAL OUTPUT REQUIREMENT:
      After producing the render, output an additional JSON block describing EXACTLY what you added to the scene.
      Format:
      {
        "plants": ["list of specific plants with quantities, e.g., '5 Japanese Maples', '12 Lavender bushes'"],
        "hardscape": ["list of hardscape features with quantities, e.g., 'Stone patio 200 sqft', 'Gravel pathway 80 sqft'"],
        "features": ["list of features like 'Fire pit', 'Water fountain', 'Lighting fixtures'"],
        "structures": ["list of structures like 'Pergola', 'Arbor', 'Trellis'"],
        "furniture": ["list of outdoor furniture like 'Bench', '2 Lounge chairs'"],
        "quantities": {
          "sod_sqft": 0,
          "mulch_sqft": 0,
          "gravel_sqft": 0,
          "pavers_sqft": 0
        }
      }

      Return this JSON directly in the text portion of the response after generating the image.
      Be specific and comprehensive - include EVERYTHING you added to transform the yard.
    `;

    const renderRes = await ai.models.generateContent({
      model: MODEL_GENERATION,
      contents: {
        parts: [
          { inlineData: { mimeType: yardFile.type, data: yardBase64 } },
          { text: renderPrompt }
        ]
      }
    });

    const renderImage = extractImage(renderRes);

    if (!renderImage) {
      throw new Error("Failed to generate render image");
    }
    const renderBase64Raw = renderImage.split(',')[1];

    // Extract design JSON from text response
    let designJSON: any = null;
    try {
      const renderText = renderRes.text || "";
      console.log("Render response text:", renderText.substring(0, 500));

      // Try to extract JSON from the response
      const jsonMatch = renderText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        designJSON = JSON.parse(jsonMatch[0]);
        console.log("✅ Design JSON extracted from render:", JSON.stringify(designJSON, null, 2));
      } else {
        console.warn("⚠️ No JSON block found in render response");
      }
    } catch (error) {
      console.warn("⚠️ Failed to extract design JSON from render:", error);
    }

    // EMIT PARTIAL RESULT: Render is ready!
    if (onProgress) {
      onProgress({
        renderImages: [renderImage],
        // We can emit empty/loading states for others if needed, or just omit them
        // The UI should handle missing fields gracefully
      });
    }

    // -------------------------------------------------------------------------
    // PHASE 3: GENERATE 2D PLAN (Image Model)
    // -------------------------------------------------------------------------
    console.log("Phase 3: Generating Plan");

    const planPrompt = `
      Act as a Landscape Architect Drafter.
      INPUT: The provided 3D RENDER of a designed yard.
      CONTEXT: ${sceneContext}
      
      TASK: Generate a single, accurate, top-down orthographic raster plan based ONLY on the input render.
      
      INSTRUCTIONS:
      1. Analyze the render to identify fixed geometry (house edges, fences) and new design elements (hardscape, plants).
      2. Transform this into a strictly orthographic 90° overhead view.
      
      CRITICAL RULES:
      - NO LABELS: Do not add any text, labels, or callouts to the image.
      - NO HALLUCINATIONS: Do not invent objects not visible in the render.
      - GEOMETRY: Must match the render exactly.
      
      STYLING:
      - Flat architectural style.
      - Clean lines.
      - White background.
      - Simple colors: Green (plants), Gray/Beige (hardscape), Brown (wood).
    `;

    const planPromise = ai.models.generateContent({
      model: MODEL_GENERATION,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/png", data: renderBase64Raw } },
          { text: planPrompt }
        ]
      }
    });

    // -------------------------------------------------------------------------
    // PHASE 4: COST & QUANTITY ANALYSIS (Pro Model)
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // PHASE 4: COST & QUANTITY ANALYSIS (Pro Model)
    // -------------------------------------------------------------------------
    console.log("Phase 4: Cost Analysis");

    const analysisPrompt = `
      Act as a Senior Quantity Surveyor specializing in landscape architecture.

      Your task:
      Analyze the rendered image and the design context to produce a DETAILED QUANTITY TAKEOFF with PRICING in STRICT JSON format.
      
      TASK: 
      1. VISUAL IDENTIFICATION: Scan the image and list every distinct material and plant group.
      2. ESTIMATION: Estimate the area (sq ft) or count (qty) for each item based on a standard residential yard size.
      3. PRICING: Apply realistic US market rates (materials + installation). Include unit costs and calculate total costs.
      ${budget ? `4. BUDGET CHECK: The user's target budget is \"${budget}\". If the total exceeds this, suggest cost-saving alternatives.` : ''}
      5. LABOR: You MUST include a separate line item for \"Labor & Installation\" (typically 30-50% of material costs).
      6. TOTAL COST: Calculate and include the totalCost as the sum of all line items.
      
      RETURN JSON ONLY. NO TEXT.

      SCHEMA:
      {
        "designConcept": "string - brief design description",
        "visualDescription": "string - detailed scene description",
        "maintenanceLevel": "Low | Medium | High",
        "totalCost": number,
        "materials": [
          {
            "name": "string (e.g. 'Japanese Maple' or 'Paver Patio')",
            "quantity": "string (e.g. '3 plants' or '200 sqft')",
            "unitCost": "string (e.g. '$45/plant' or '$12/sqft')",
            "totalCost": "string (e.g. '$135' or '$2,400')",
            "notes": "string (e.g. 'Acer palmatum, 5-gallon container' or 'Natural stone pavers with installation')",
            "category": "Plants | Hardscape | Features | Structures | Furniture | Labor"
          }
        ],
        "plants": [
          { "name": "string", "quantity": number, "description": "string" }
        ],
        "hardscape": [
          { "name": "string", "quantity": number, "description": "string" }
        ],
        "features": [
          { "name": "string", "quantity": number, "description": "string" }
        ],
        "structures": [
          { "name": "string", "quantity": number, "description": "string" }
        ],
        "furniture": [
          { "name": "string", "quantity": number, "description": "string" }
        ]
      }

      CRITICAL RULES:
      - Every item in "materials" array MUST have realistic pricing (unitCost and totalCost).
      - totalCost at the root MUST be the sum of all materials[].totalCost (parse the numeric values).
      - Be precise with plant names (e.g., "Agave attenuata" instead of just "Agave").
      - Include installation/labor costs for each applicable item.
      - All costs should be realistic for 2024 US market rates.
    `;

    const analysisPromise = ai.models.generateContent({
      model: MODEL_REASONING,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/png", data: renderBase64Raw } },
          { text: analysisPrompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    // Wait for both Plan and Analysis
    const [planRes, analysisRes] = await Promise.all([planPromise, analysisPromise]);

    const planImage = extractImage(planRes);
    if (!planImage) {
      throw new Error("Failed to generate plan image");
    }
    const planBase64Raw = planImage.split(',')[1];
    const planImageUri = `data:image/png;base64,${planBase64Raw}`;
    const jsonText = analysisRes.text || "{}";
    const data = JSON.parse(jsonText);

    // -------------------------------------------------------------------------
    // PHASE 5: RAG ENHANCEMENT (Optional)
    // -------------------------------------------------------------------------
    let plantPalette: any[] = [];
    let ragEnhanced = false;

    if (useRag) {
      try {
        const ragApiBase =
          import.meta.env.VITE_RAG_API_BASE_URL ||
          process.env.RAG_API_BASE_URL ||
          "http://localhost:8002";
        const ragUrl = `${ragApiBase.replace(/\/$/, "")}/api/enhance-with-rag`;
        console.log("Phase 5: RAG Enhancement");
        const ragResponse = await fetch(ragUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data) // Send the structured data directly
        });

        if (ragResponse.ok) {
          const ragData = await ragResponse.json();
          plantPalette = ragData.plantPalette || [];
          ragEnhanced = ragData.rag_enhanced || false;
          console.log(`✅ RAG Enhancement: Found ${plantPalette.length} plants in catalog`);
        } else {
          console.warn("RAG Enhancement failed, continuing without it");
        }
      } catch (error) {
        console.warn("RAG Enhancement unavailable:", error);
      }
    } else {
      console.log("Phase 5: RAG Enhancement skipped (disabled by user)");
    }

    const finalResult: GeneratedDesign = {
      analysis: {
        currentLayout: "Scene Analyzed",
        designConcept: data.designConcept || `A ${stylePreference} transformation`,
        visualDescription: data.visualDescription || "See 3D Render",
        maintenanceLevel: data.maintenanceLevel || "Medium",
      },
      estimates: {
        totalCost: (() => {
          // If totalCost is provided by the API, use it
          if (data.totalCost && data.totalCost > 0) {
            return data.totalCost;
          }

          // Otherwise, calculate it from materials breakdown
          if (data.materials && Array.isArray(data.materials)) {
            const sum = data.materials.reduce((acc: number, item: any) => {
              const totalCostStr = item.totalCost || "0";
              const numericValue = parseFloat(totalCostStr.replace(/[^0-9.]/g, '')) || 0;
              return acc + numericValue;
            }, 0);
            return sum > 0 ? sum : 15000; // Fallback to a reasonable estimate
          }

          // Last resort fallback
          return 15000;
        })(),
        currency: "USD",
        breakdown: (data.materials && Array.isArray(data.materials) && data.materials.length > 0)
          ? data.materials.map((item: any) => ({
            name: item.name || "Unknown Item",
            quantity: item.quantity || "1",
            unitCost: item.unitCost || "$0",
            totalCost: item.totalCost || "$0",
            notes: item.notes || item.description || "",
            category: item.category || "Other"
          }))
          : [
            // Fallback breakdown if materials array is missing or empty
            ...(data.plants || []).map((p: any) => ({
              name: p.name,
              quantity: `${p.quantity || 1}`,
              unitCost: "$50/plant",
              totalCost: `$${(p.quantity || 1) * 50}`,
              notes: p.description || "",
              category: 'Plants'
            })),
            ...(data.hardscape || []).map((h: any) => ({
              name: h.name,
              quantity: `${h.quantity || 100} sqft`,
              unitCost: "$12/sqft",
              totalCost: `$${(h.quantity || 100) * 12}`,
              notes: h.description || "",
              category: 'Hardscape'
            })),
            ...(data.features || []).map((f: any) => ({
              name: f.name,
              quantity: `${f.quantity || 1}`,
              unitCost: "$200/item",
              totalCost: `$${(f.quantity || 1) * 200}`,
              notes: f.description || "",
              category: 'Features'
            })),
            ...(data.structures || []).map((s: any) => ({
              name: s.name,
              quantity: `${s.quantity || 1}`,
              unitCost: "$500/item",
              totalCost: `$${(s.quantity || 1) * 500}`,
              notes: s.description || "",
              category: 'Structures'
            })),
            ...(data.furniture || []).map((f: any) => ({
              name: f.name,
              quantity: `${f.quantity || 1}`,
              unitCost: "$150/item",
              totalCost: `$${(f.quantity || 1) * 150}`,
              notes: f.description || "",
              category: 'Furniture'
            })),
            {
              name: "Labor & Installation",
              quantity: "1",
              unitCost: "$5,000",
              totalCost: "$5,000",
              notes: "Professional installation and labor costs",
              category: 'Labor'
            }
          ],
        plantPalette,
        ragEnhanced,
      },
      renderImages: [renderImage],
      planImage: planImageUri,
      designJSON: designJSON, // Include the design specification from Phase 2
    };

    // Final emit
    if (onProgress) {
      onProgress(finalResult);
    }

    return finalResult;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export interface Annotation {
  type: 'circle' | 'pen';
  x: number;
  y: number;
  radius?: number;
  path?: { x: number; y: number }[];
  description: string;
  color: string;
}

export const analyzeAndRegenerateDesign = async (
  originalRenderImage: string, // Base64 data URI
  annotatedImage: string, // Base64 data URI with user annotations
  annotations: Annotation[],
  originalYardImage?: File | null
): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    // Extract base64 from data URIs
    const originalBase64 = originalRenderImage.split(',')[1];
    const annotatedBase64 = annotatedImage.split(',')[1];

    // Prepare annotations description
    const annotationsText = annotations.map((ann, idx) => {
      if (ann.type === 'circle') {
        return `Annotation ${idx + 1} (Circle): Located at coordinates (${Math.round(ann.x)}, ${Math.round(ann.y)}) with radius ${Math.round(ann.radius || 0)}. User wants: "${ann.description}"`;
      } else {
        return `Annotation ${idx + 1} (Pen/Drawing): Path drawn by user. User wants: "${ann.description}"`;
      }
    }).join('\n');

    // Phase 1: Analyze the annotated image to understand what needs to change
    console.log("Phase 1: Analyzing annotations");
    const analysisPrompt = `
      You are a Senior Landscape Architect analyzing user annotations on a landscape design render.
      
      CRITICAL ANALYSIS APPROACH - Follow this two-step process:
      
      STEP 1: UNDERSTAND THE ENTIRE IMAGE CONTEXT FIRST
      - Examine the complete landscape design render to understand the overall design style, theme, and aesthetic
      - Identify the overall color palette, materials, and design language used throughout
      - Note the spatial relationships, proportions, and flow of the entire design
      - Understand the context of surrounding elements (house, fences, pathways, existing features)
      - Recognize the lighting conditions, time of day, and atmosphere of the scene
      
      STEP 2: FOCUS ON THE ANNOTATED AREAS WITHIN CONTEXT
      - Now examine the specific annotated areas (circles or drawn paths) marked by the user
      - Identify what currently exists in each annotated location
      - Understand how each annotated area relates to and fits within the overall design context
      - Consider how changes in the annotated areas will affect the visual harmony of the entire scene
      
      ANNOTATIONS:
      ${annotationsText}
      
      TASK: Create a comprehensive modification plan that:
      1. First establishes the full design context (style, materials, colors, spatial relationships)
      2. Then identifies what currently exists in each annotated area
      3. Determines what should replace or be added based on:
         - The user's description for each annotation
         - How it will integrate with the surrounding design elements
         - How it maintains or enhances the overall design coherence
         - How it respects the existing style and aesthetic
      
      OUTPUT: Provide a detailed, structured description with two sections:
      
      SECTION 1 - FULL CONTEXT ANALYSIS:
      - Overall design style and aesthetic (e.g., "Modern Minimalist with clean lines and neutral tones")
      - Dominant materials and textures throughout the scene
      - Color palette and visual harmony
      - Spatial relationships and flow
      - Lighting and atmosphere
      
      SECTION 2 - ANNOTATED AREA MODIFICATIONS:
      For each annotation listed above, provide:
      - Exact location within the scene (e.g., "in the center of the yard, between the patio and the fence")
      - Current elements in that area (e.g., "grass lawn with small shrubs")
      - Relationship to surrounding elements (e.g., "adjacent to the stone patio and near the house foundation")
      - Desired changes based on the user's description for that annotation
      - How the modification will integrate with the overall design
      - Specific materials, plants, or features to add/change that match the overall aesthetic
      
      Be extremely specific about how each change will look and feel within the context of the entire design.
      Ensure that modifications in annotated areas feel natural and cohesive with the rest of the landscape.
    `;

    const analysisParts: any[] = [
      { inlineData: { mimeType: "image/png", data: annotatedBase64 } },
      { text: `[Annotated Render - User has marked areas to change]` },
      { inlineData: { mimeType: "image/png", data: originalBase64 } },
      { text: `[Original Render - Reference for what currently exists]` },
      { text: analysisPrompt }
    ];

    // If we have the original yard image, include it for context
    if (originalYardImage) {
      const yardBase64 = await fileToGenericBase64(originalYardImage);
      analysisParts.splice(2, 0, 
        { inlineData: { mimeType: originalYardImage.type, data: yardBase64 } },
        { text: `[Original Yard Photo - For reference]` }
      );
    }

    const analysisRes = await ai.models.generateContent({
      model: MODEL_REASONING,
      contents: { parts: analysisParts }
    });

    const modificationPlan = analysisRes.text || "";
    console.log("Modification Plan:", modificationPlan);

    // Phase 2: Generate new render with modifications
    console.log("Phase 2: Generating modified render");
    const generationPrompt = `
      Act as a Photorealist Landscape Renderer.
      
      TASK: Modify the provided landscape render according to the user's requested changes.
      
      ORIGINAL RENDER: The first image shows the current design.
      ANNOTATED RENDER: The second image shows where the user wants changes (marked with red circles/drawings).
      MODIFICATION PLAN: ${modificationPlan}
      
      INSTRUCTIONS:
      1. Keep ALL elements that are NOT in the annotated areas exactly as they are
      2. Apply the modifications ONLY to the areas marked by the user
      3. Maintain the same style, lighting, and overall aesthetic as the original render
      4. Ensure the modifications blend seamlessly with the rest of the design
      5. Keep the same camera angle and perspective
      6. Maintain photorealistic quality
      
      CRITICAL RULES:
      - Do NOT change anything outside the annotated areas
      - Do NOT move or modify the house, fences, or other fixed structures
      - The modifications should look natural and integrated
      - Preserve the original design's style and quality
    `;

    const generationParts: any[] = [
      { inlineData: { mimeType: "image/png", data: originalBase64 } },
      { text: `[Original Render]` },
      { inlineData: { mimeType: "image/png", data: annotatedBase64 } },
      { text: `[Annotated Render with User Markings]` },
      { text: generationPrompt }
    ];

    const renderRes = await ai.models.generateContent({
      model: MODEL_GENERATION,
      contents: { parts: generationParts }
    });

    const newRenderImage = extractImage(renderRes);
    if (!newRenderImage) {
      throw new Error("Failed to generate modified render image");
    }

    console.log("✅ Modified render generated successfully");
    return newRenderImage;

  } catch (error) {
    console.error("Edit Mode Generation Error:", error);
    throw error;
  }
};
