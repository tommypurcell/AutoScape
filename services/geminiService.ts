// geminiService.ts
// This file contains the logic for interacting with the Google GenAI API
// It is used to generate landscape designs based on user input


import { GoogleGenAI } from "@google/genai";
import { AnalysisSchema, GeneratedDesign } from "../types";

// PRO model for reasoning, scene understanding, and complex JSON analysis
const MODEL_REASONING = "gemini-2.0-flash-exp";

// FLASH-IMAGE model for fast, high-quality visual generation
const MODEL_GENERATION = "gemini-2.0-flash-exp";

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
  onProgress?: (partialResult: Partial<GeneratedDesign>) => void
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
    // PHASE 1: SCENE UNDERSTANDING & DESIGN INTENT (Reasoning Model)
    // -------------------------------------------------------------------------
    console.log("Phase 1: Scene Understanding");
    let sceneContext = "";

    try {
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
            text: `[Style Reference Image ${index + 1}]`
          });
        });
      }

      analysisParts.push({
        text: `
          You are a Senior Landscape Architect.
          PHASE 1 TASK: Analyze the yard image to create a strict Scene JSON and Design JSON.
          1. SCENE JSON (The Truth): Identify the FIXED geometry.
          2. DESIGN JSON (The Changes): Apply the user's request: "${prompt}" in style "${stylePreference}".
          ${budget ? `Budget: "${budget}".` : ''}
          OUTPUT: Describe the scene and design intent clearly.
        `});

      const sceneUnderstandingRes = await ai.models.generateContent({
        model: MODEL_REASONING,
        contents: [{ role: 'user', parts: analysisParts }]
      });

      sceneContext = sceneUnderstandingRes.text || "";
      console.log("Scene Context Generated:", sceneContext.substring(0, 200) + "...");

    } catch (e) {
      console.error("⚠️ Phase 1 (Scene Understanding) Failed:", e);
      sceneContext = "A residential backyard space requiring landscape design improvements.";
    }

    // -------------------------------------------------------------------------
    // PHASE 2: GENERATION (With Fallback)
    // -------------------------------------------------------------------------
    console.log("🎨 Phase 2: Attempting Visual Generation");
    let primaryImage: string | null = null;
    let isFallback = false;

    try {
      // 1. Try Gemini Generation first
      const renderPrompt = `
        You are an expert landscape architect visualizer.
        Generate a PHOTOREALISTIC 3D RENDER of the ${stylePreference} garden design described below.
        
        VIEWPOINT: Eye-level from the patio/back door looking out.
        LIGHTING: Golden hour (warm, inviting sunlight).
        
        DESIGN TO VISUALIZE:
        ${sceneContext}
        
        CRITICAL INSTRUCTION:
        - Call the 'generate_image' tool to create the visual.
        - Do NOT output markdown or json. Just the image.
      `;

      const renderRes = await ai.models.generateContent({
        model: MODEL_GENERATION,
        contents: [{ role: "user", parts: [{ text: renderPrompt }] }],
        config: { temperature: 0.7 }
      });

      primaryImage = extractImage(renderRes);

      if (!primaryImage) {
        console.warn("⚠️ Gemini returned no image, attempting fallback...");
        throw new Error("No image generated by Gemini");
      }

    } catch (genError) {
      console.warn("⚠️ Generation failed, switching to Freepik RAG Fallback:", genError);

      // 2. Freepik Fallback
      try {
        const fallbackRes = await fetch('http://localhost:8002/api/freepik/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `beautiful ${stylePreference} garden landscape design photorealistic`,
            top_k: 1
          })
        });

        const fallbackData = await fallbackRes.json();
        if (fallbackData.results && fallbackData.results.length > 0) {
          primaryImage = fallbackData.results[0].image_url;
          isFallback = true;
          console.log("✅ Using Freepik fallback image");
        }
      } catch (fbError) {
        console.error("❌ Freepik fallback also failed:", fbError);
      }
    }

    if (!primaryImage) {
      throw new Error("Unable to generate or retrieve a design visual. Please try again.");
    }

    // Determine if it's a data URL (generated) or Remote URL (fallback)
    const renderImages = [primaryImage];

    // Note: We used to extract designJSON here, but we now rely on Phase 4 for detailed analysis
    // to ensure the image generation is prioritized.
    let designJSON: any = null;


    // PHASE 3: GENERATE 2D PLAN (Based on 3D Render) - Sequential to ensure we have context
    console.log("📏 Phase 3: Generating Plan");

    let planPromptContents: any[] = [{ text: "Generate a technical 2D top-down landscape plan based on the design description above." }];

    // Prepare inputs
    let renderBase64Raw: string | null = null;
    if (!isFallback && primaryImage && primaryImage.startsWith('data:')) {
      renderBase64Raw = primaryImage.split(',')[1];
      planPromptContents.unshift({ inlineData: { mimeType: 'image/jpeg', data: renderBase64Raw } });
    }

    const planPrompt = `
      Act as a Landscape Architect.
      TASK: Create a simple 2D top-down schematic plan for the garden.
      STYLE: Blueprint / Technical Drawing.
      Do NOT add text labels in the image.
      CRITICAL: Generate the image ONLY.
    `;

    planPromptContents.push({ text: planPrompt });

    // Start Plan Generation
    const planPromise = ai.models.generateContent({
      model: MODEL_GENERATION,
      contents: [{ role: 'user', parts: planPromptContents }]
    }).catch(e => {
      console.warn("Phase 3 Plan Generation Failed:", e);
      return { text: null } as any;
    });

    // PHASE 4: ESTIMATES & ANALYSIS (Parallel with Plan)
    console.log("💰 Phase 4: Estimates");

    const analysisPrompt = `
      Analyze this design based on the Style: ${stylePreference}.
      OUTPUT JSON:
      {
        "designConcept": "string",
        "visualDescription": "string",
        "maintenanceLevel": "Low/Medium/High",
        "totalCost": number,
        "plants": [ { "name": "string", "quantity": number, "description": "string" } ],
        "hardscape": [ { "name": "string", "quantity": number, "description": "string" } ],
        "features": [ { "name": "string", "quantity": number, "description": "string" } ],
        "structures": [ { "name": "string", "quantity": number, "description": "string" } ],
        "furniture": [ { "name": "string", "quantity": number, "description": "string" } ]
      }
    `;

    // Use image for analysis if available
    const analysisContents: any[] = [{ text: sceneContext }, { text: analysisPrompt }];
    if (renderBase64Raw) {
      analysisContents.unshift({ inlineData: { mimeType: 'image/jpeg', data: renderBase64Raw } });
    }

    const analysisPromise = ai.models.generateContent({
      model: MODEL_REASONING,
      contents: [{ role: 'user', parts: analysisContents }],
      config: { responseMimeType: "application/json" }
    }).catch(e => {
      console.warn("Phase 4 Analysis Failed:", e);
      return { text: "{}" } as any;
    });

    // Wait for both
    const [planRes, analysisRes] = await Promise.all([planPromise, analysisPromise]);

    // Process Plan
    const planImage = extractImage(planRes);
    // Process Analysis
    let analysisData: any = {};
    try {
      const jsonText = analysisRes.text || "{}";
      analysisData = JSON.parse(jsonText);
    } catch (e) {
      console.warn("Failed to parse analysis JSON", e);
      analysisData = { designConcept: "Analysis unavailable" };
    }

    // Transform analysis data to match our schema
    const analysis = {
      currentLayout: "Scene Analyzed",
      designConcept: analysisData.designConcept || `A ${stylePreference} transformation`,
      visualDescription: analysisData.visualDescription || "See 3D Render",
      maintenanceLevel: analysisData.maintenanceLevel || "Medium",
      plants: analysisData.plants || [], // Store for RAG
    };

    const estimates = {
      totalCost: analysisData.totalCost || 0,
      currency: "USD",
      breakdown: [
        ...(analysisData.plants || []).map((p: any) => ({ ...p, category: 'Plants', unitCost: "0", totalCost: "0", notes: p.description || "" })),
        ...(analysisData.hardscape || []).map((h: any) => ({ ...h, category: 'Hardscape', unitCost: "0", totalCost: "0", notes: h.description || "" })),
        ...(analysisData.features || []).map((f: any) => ({ ...f, category: 'Features', unitCost: "0", totalCost: "0", notes: f.description || "" })),
        ...(analysisData.structures || []).map((s: any) => ({ ...s, category: 'Structures', unitCost: "0", totalCost: "0", notes: s.description || "" })),
        ...(analysisData.furniture || []).map((f: any) => ({ ...f, category: 'Furniture', unitCost: "0", totalCost: "0", notes: f.description || "" }))
      ],
      plantPalette: [],
      ragEnhanced: false,
    };

    // EMIT PARTIAL RESULT: Render is ready!
    if (onProgress) {
      onProgress({
        renderImages: [primaryImage || ''],
        planImage: planImage || '',
        analysis,
        estimates
      });
    }

    // PHASE 5: RAG ENHANCEMENT
    try {
      console.log("🌿 Phase 5: RAG Enhancement");
      const response = await fetch('http://localhost:8002/api/enhance-with-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plants: analysisData.plants || [],
          design_style: stylePreference
        })
      });

      if (response.ok) {
        const ragData = await response.json();
        if (ragData.success && ragData.plantPalette) {
          estimates.plantPalette = ragData.plantPalette;
          estimates.ragEnhanced = true;
        }
      }
    } catch (error) {
      console.warn("RAG Enhancement unavailable:", error);
    }

    return {
      // id: crypto.randomUUID(), // Removed as potential type mismatch
      // timestamp: Date.now(), // Removed as type mismatch
      // originalImage: yardBase64, // Removed (not in type)
      renderImages: [primaryImage || ''],
      planImage: planImage || '',
      analysis: analysis,
      estimates: estimates,
      designJSON: designJSON
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
