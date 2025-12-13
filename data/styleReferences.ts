import { DesignStyle } from '../types';

// Map of style names to Unsplash image URLs
export const styleImages: Record<string, string> = {
  // Modern & Contemporary
  [DesignStyle.MODERN]: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
  [DesignStyle.CONTEMPORARY]: "https://images.ctfassets.net/zkpxzicsuxng/2rYa23qIukIJ3H79y5DKwo/cab140cb09425fc12bd0958e911ace77/frontstoop__1_.jpg?w=1000&q=100&fm=webp",
  [DesignStyle.SCANDINAVIAN]: "https://edwardgeorgelondon.com/wp-content/uploads/2025/02/nordic-garden-with-illuminated-gravel-path-leading-to-fire-pit-area-featuring-minimalist-outdoor-lighting-design.webp",

  // Traditional & Classic
  [DesignStyle.COTTAGE]: "https://hips.hearstapps.com/hmg-prod/images/emily-post-garden-66d352b2e4bf5.jpg?crop=0.651xw:0.921xh;0.191xw,0.0385xh&resize=1120:*",
  [DesignStyle.FRENCH]: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
  [DesignStyle.VICTORIAN]: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=800&q=80",
  [DesignStyle.COLONIAL]: "https://i.pinimg.com/1200x/71/4c/e6/714ce6357c3936db33812f9517afe78f.jpg",

  // Regional & Cultural
  [DesignStyle.JAPANESE]: "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=800&q=80",
  [DesignStyle.MEDITERRANEAN]: "https://mrplanter.com/wp-content/uploads/2025/07/v2-xm5o8-76lvj.jpg",
  [DesignStyle.TROPICAL]: "https://i.pinimg.com/736x/e6/f8/9c/e6f89c1ca64b06b8d2bfa71b69df38fc.jpg",
  [DesignStyle.XERISCAPE]: "https://www.hello-hayley.com/wp-content/uploads/2024/10/xeriscape-ideas-2.jpg",

  // Eco-Friendly & Natural
  [DesignStyle.NATIVE]: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=800&q=80",
  [DesignStyle.POLLINATOR]: "https://m.media-amazon.com/images/I/71aJ9Ab0JtL._AC_SX679_.jpg",
  [DesignStyle.PERMACULTURE]: "https://i.pinimg.com/736x/06/e3/b1/06e3b181b74450215591693858b463d0.jpg",
  [DesignStyle.RAIN_GARDEN]: "https://bloomyheaven.com/wp-content/uploads/2025/01/Stepped-Rain-Garden.jpg",

  // Specialty Styles
  [DesignStyle.MID_CENTURY]: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?auto=format&fit=crop&w=800&q=80",
  [DesignStyle.RUSTIC]: "https://wildgardenexpert.com/wp-content/uploads/2023/12/Modern-Farmhouse-Style-Garden-Ideas-5-1024x574.webp",
  [DesignStyle.COASTAL]: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
  [DesignStyle.MOUNTAIN]: "https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&w=800&q=80",
};

export const getStyleImage = (style: string): string => {
  return styleImages[style] || "https://images.unsplash.com/photo-1558904541-01470460287c?auto=format&fit=crop&w=800&q=80"; // Default fallback
};

export const styleDescriptions: Record<string, string> = {
  [DesignStyle.MODERN]: "Defined by clean lines, geometric shapes, and a minimalist approach. Often uses concrete, steel, and a restrained plant palette.",
  [DesignStyle.CONTEMPORARY]: "Current and trendy, focusing on bold patterns, sustainable materials, and indoor-outdoor living integration.",
  [DesignStyle.SCANDINAVIAN]: "Simplicity, functionality, and connection to nature. Features light tones, wood accents, and cozy 'hygge' elements.",
  [DesignStyle.COTTAGE]: "Romantic and informal, overflowing with flowers, curving paths, and traditional materials like brick and picket fences.",
  [DesignStyle.FRENCH]: "Formal and symmetrical, characterized by clipped boxwoods, gravel paths, fountains, and elegant statuary.",
  [DesignStyle.VICTORIAN]: "Ornate and manicured, often featuring carpet bedding, cast iron details, and distinct garden rooms.",
  [DesignStyle.COLONIAL]: "Practical and geometric, combining functional fruit/vegetable gardens with ornamental boxwood parterres.",
  [DesignStyle.JAPANESE]: "Deeply symbolic and serene, utilizing rocks, water, moss, and pruned trees to create idealized nature in miniature.",
  [DesignStyle.MEDITERRANEAN]: "Inspired by Southern Europe, featuring warm terracotta, drought-tolerant plants (lavender, olive), and gravel or tile courtyards.",
  [DesignStyle.TROPICAL]: "Lush, vibrant, and exotic. Creates a jungle-like atmosphere with large-leaved plants, bright flowers, and water features.",
  [DesignStyle.XERISCAPE]: "Water-wise landscaping designed for arid climates. focuses on native plants, gravel mulch, and minimal irrigation.",
  [DesignStyle.NATIVE]: "Habitat-focused design using plants indigenous to your region to support local wildlife and require less maintenance.",
  [DesignStyle.POLLINATOR]: "Specifically designed to attract bees, butterflies, and hummingbirds with nectar-rich, blooming plants.",
  [DesignStyle.PERMACULTURE]: "A holistic system modeled on natural ecosystems, emphasizing edible landscaping and self-sustaining cycles.",
  [DesignStyle.RAIN_GARDEN]: "Functional landscaping designed to capture and filter stormwater runoff using moisture-loving plants and depressed areas.",
  [DesignStyle.MID_CENTURY]: "Retro-modern aesthetic from the 1950s-60s. Features abstract shapes, breeze blocks, and indoor-outdoor flow.",
  [DesignStyle.RUSTIC]: "Natural and unrefined, using raw materials like wood and stone to create a rugged, countryside feel.",
  [DesignStyle.COASTAL]: "Relaxed and breezy, utilizing salt-tolerant plants, sandy textures, and white-washed or weathered wood elements.",
  [DesignStyle.MOUNTAIN]: "Rugged and naturalistic, incorporating heavy stone, large boulders, and hardy evergreens to blend with an alpine environment.",
};

export interface StyleReference {
  id: string;
  name: string;
  imageUrl: string;
  category: 'modern' | 'traditional' | 'tropical' | 'zen' | 'cottage';
  description: string;
}

// Re-export styleReferences for backward compatibility with Gallery/About pages
// mapped to the new correct images
export const styleReferences: StyleReference[] = [
  {
    id: 'modern-1',
    name: 'Modern Showcase',
    imageUrl: styleImages[DesignStyle.MODERN],
    category: 'modern',
    description: 'Contemporary design with clean lines'
  },
  {
    id: 'modern-2',
    name: 'Seattle Modern',
    imageUrl: styleImages[DesignStyle.CONTEMPORARY],
    category: 'modern',
    description: 'Pacific Northwest modern landscape'
  },
  {
    id: 'zen-1',
    name: 'Japanese Zen',
    imageUrl: styleImages[DesignStyle.JAPANESE],
    category: 'zen',
    description: 'Peaceful rock and sand garden'
  },
  {
    id: 'cottage-1',
    name: 'English Cottage',
    imageUrl: styleImages[DesignStyle.COTTAGE],
    category: 'cottage',
    description: 'Lush floral abundance'
  },
  {
    id: 'tropical-1',
    name: 'Tropical Oasis',
    imageUrl: styleImages[DesignStyle.TROPICAL],
    category: 'tropical',
    description: 'Exotic greenery and relaxation'
  },
  {
    id: 'mediterranean-1',
    name: 'Mediterranean Villa',
    imageUrl: styleImages[DesignStyle.MEDITERRANEAN],
    category: 'traditional',
    description: 'Sun-baked warmth and terracotta'
  }
];
