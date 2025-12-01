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
  stylePreference: string
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
    // Goal: Identify fixed geometry and define the redesign plan before rendering.

    console.log("Phase 1: Scene Understanding");
    const analysisParts: any[] = [
      { inlineData: { mimeType: yardFile.type, data: yardBase64 } },
      { text: `[The User's Yard]` }
    ];

    // Add all style reference images
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

    // Strict prompt to force JSON output for geometry consistency
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
    // Goal: Redesign the single view using the scene context.

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

    // -------------------------------------------------------------------------
    // PHASE 3: GENERATE 2D PLAN (Image Model)
    // -------------------------------------------------------------------------
    // Goal: Derive strictly from the 3D render. No hallucination. No Labels.

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
    // Goal: Accurate counting and estimation using the Pro model's reasoning.

    console.log("Phase 4: Cost Analysis");
    const analysisPrompt = `
      Act as a Senior Quantity Surveyor.
      INPUT: The provided 3D RENDER of a landscape design.
      CONTEXT: ${sceneContext}
      
      TASK: 
      1. VISUAL IDENTIFICATION: Scan the image and list every distinct material and plant group mentioned in the Design JSON.
      2. ESTIMATION: Estimate the area (sq ft) or count (qty) for each item based on a standard residential yard size.
      3. PRICING: Apply realistic US market rates (materials + installation).
      4. LABOR: You MUST include a separate line item for "Labor & Installation" (typically 30-50% of the project total) in the materials list.
      
      Output strict JSON matching the schema.
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
        responseSchema: AnalysisSchema,
      }
    });

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
    // Enhance materials list with RAG plant data
    let plantPalette: any[] = [];
    let ragEnhanced = false;

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
        body: JSON.stringify({
          materials: data.materials || []
        })
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

    return {
      analysis: {
        currentLayout: "Scene Analyzed",
        designConcept: data.designConcept || `A ${stylePreference} transformation`,
        visualDescription: data.visualDescription || "See 3D Render",
        maintenanceLevel: data.maintenanceLevel || "Medium",
      },
      estimates: {
        totalCost: data.totalCost || 0,
        currency: "USD",
        breakdown: data.materials || [],
        plantPalette,
        ragEnhanced,
      },
      renderImages: [renderImage], // Return single image in array for compatibility
      planImage: planImageUri,
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
