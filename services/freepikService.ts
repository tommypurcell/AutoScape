/**
 * Freepik API Service for Image Generation
 * Uses Freepik's Mystic API for AI image generation
 */

interface FreepikImageRequest {
  prompt: string;
  num_images?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
  image?: string; // Base64 encoded image for img2img
  styling_preset?: string;
}

interface FreepikImageResponse {
  data: Array<{
    base64: string;
    seed: number;
  }>;
}

const FREEPIK_API_URL = import.meta.env.DEV 
  ? 'http://localhost:3001/api/freepik/generate'  // Use proxy in development
  : 'https://api.freepik.com/v1/ai/text-to-image'; // Direct in production

/**
 * Generate an image using Freepik's API
 */
export const generateFreepikImage = async (
  prompt: string,
  options: {
    numImages?: number;
    guidanceScale?: number;
    steps?: number;
    seed?: number;
    baseImage?: string; // Base64 image for img2img
    style?: string;
  } = {}
): Promise<string[]> => {
  const apiKey = process.env.FREEPIK_API_KEY || import.meta.env.VITE_FREEPIK_API_KEY;
  
  if (!apiKey) {
    throw new Error('Freepik API key not found in environment variables');
  }

  const requestBody: FreepikImageRequest = {
    prompt,
    num_images: options.numImages || 1,
    guidance_scale: options.guidanceScale || 7.5,
    num_inference_steps: options.steps || 50,
    ...(options.seed && { seed: options.seed }),
    ...(options.baseImage && { image: options.baseImage }),
    ...(options.style && { styling_preset: options.style }),
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add API key if not using proxy (production)
    if (!import.meta.env.DEV) {
      const apiKey = process.env.FREEPIK_API_KEY || import.meta.env.VITE_FREEPIK_API_KEY;
      if (!apiKey) {
        throw new Error('Freepik API key not found in environment variables');
      }
      headers['x-freepik-api-key'] = apiKey;
    }

    const response = await fetch(FREEPIK_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Freepik API error: ${response.status} ${response.statusText}. ${
          errorData.message || ''
        }`
      );
    }

    const data: FreepikImageResponse = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No images returned from Freepik API');
    }

    // Convert base64 to data URLs
    return data.data.map(img => `data:image/png;base64,${img.base64}`);
  } catch (error) {
    console.error('Freepik API error:', error);
    throw error;
  }
};

/**
 * Generate landscape design render using Freepik
 */
export const generateLandscapeRender = async (
  yardImageBase64: string,
  designPrompt: string,
  stylePreference: string
): Promise<string> => {
  const fullPrompt = `
    ${designPrompt}
    
    Style: ${stylePreference}, photorealistic, high definition, professional landscape photography.
    
    Requirements:
    - Keep the house architecture and windows exactly as shown
    - Maintain the perimeter fences in their original positions
    - Transform only the yard and landscaping elements
    - Professional landscape design quality
    - Natural lighting and realistic materials
  `.trim();

  const images = await generateFreepikImage(fullPrompt, {
    numImages: 1,
    baseImage: yardImageBase64,
    guidanceScale: 8.0,
    steps: 50,
    style: 'photographic',
  });

  return images[0];
};

/**
 * Generate 2D plan view using Freepik
 */
export const generate2DPlan = async (
  renderImageBase64: string,
  sceneContext: string
): Promise<string> => {
  const planPrompt = `
    Create a top-down orthographic 2D architectural plan view of this landscape design.
    
    Context: ${sceneContext}
    
    Requirements:
    - Strictly orthographic 90° overhead view
    - Flat architectural style with clean lines
    - No labels or text annotations
    - Accurate representation of all elements from the 3D render
    - Professional landscape architecture drawing style
    - Clear differentiation between hardscape, planting areas, and structures
  `.trim();

  const images = await generateFreepikImage(planPrompt, {
    numImages: 1,
    baseImage: renderImageBase64,
    guidanceScale: 7.0,
    steps: 40,
    style: 'digital-art',
  });

  return images[0];
};
