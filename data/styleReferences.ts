export interface StyleReference {
  id: string;
  name: string;
  imageUrl: string;
  category: 'modern' | 'traditional' | 'tropical' | 'zen' | 'cottage';
  description: string;
}

// Known styles with specific metadata
const knownStyles: Partial<StyleReference>[] = [
  {
    id: 'style-english-cottage',
    name: 'English Cottage Garden',
    imageUrl: '/images/style_english_cottage_garden.jpg',
    category: 'cottage',
    description: 'Charmingly informal with dense plantings and traditional flowers'
  },
  {
    id: 'style-english-landscape',
    name: 'English Landscape Park',
    imageUrl: '/images/style_english_landscape_park.jpg',
    category: 'traditional',
    description: 'Naturalistic rolling hills, lakes, and carefully placed trees'
  },
  {
    id: 'style-french-formal',
    name: 'French Formal',
    imageUrl: '/images/style_french_formal.jpg',
    category: 'traditional',
    description: 'Symmetry, geometric shapes, and orderly parterres'
  },
  {
    id: 'style-italian-renaissance',
    name: 'Italian Renaissance',
    imageUrl: '/images/style_italian_renaissance.jpg',
    category: 'traditional',
    description: 'Terraced gardens with statuary, fountains, and evergreens'
  },
  {
    id: 'style-mediterranean',
    name: 'Mediterranean',
    imageUrl: '/images/style_mediterranean.jpg',
    category: 'tropical',
    description: 'Drought-tolerant plants, gravel, and terra cotta accents'
  },
  {
    id: 'style-tuscan',
    name: 'Tuscan',
    imageUrl: '/images/style_tuscan.jpg',
    category: 'traditional',
    description: 'Rustic elegance with olive trees, herbs, and stone pathways'
  },
  {
    id: 'style-moorish',
    name: 'Moorish / Islamic',
    imageUrl: '/images/style_moorish_islamic.jpg',
    category: 'traditional',
    description: 'Courtyards with central water features and geometric tiles'
  },
  {
    id: 'style-japanese-zen',
    name: 'Japanese Zen Garden',
    imageUrl: '/images/style_japanese_zen_garden.jpg',
    category: 'zen',
    description: 'Dry landscape with raked gravel, rocks, and moss'
  },
  {
    id: 'style-japanese-tea',
    name: 'Japanese Tea Garden',
    imageUrl: '/images/style_japanese_tea_garden.jpg',
    category: 'zen',
    description: 'Peaceful stroll garden with lanterns and stepping stones'
  },
  {
    id: 'style-chinese-scholar',
    name: 'Chinese Scholar’s Garden',
    imageUrl: '/images/style_chinese_scholar_garden.jpg',
    category: 'zen',
    description: 'Harmonious balance of rocks, water, plants, and architecture'
  },
  {
    id: 'style-tropical',
    name: 'Tropical / Balinese',
    imageUrl: '/images/style_mediterranean.jpg', // Fallback due to quota
    category: 'tropical',
    description: 'Lush foliage, bold flowers, and exotic resort vibes'
  },
  {
    id: 'style-modern-minimalist',
    name: 'Modern Minimalist',
    imageUrl: '/images/style_modern_minimalist.jpg',
    category: 'modern',
    description: 'Clean lines, open spaces, and restrained planting palette'
  },
  {
    id: 'style-contemporary',
    name: 'Contemporary',
    imageUrl: '/images/style_contemporary.jpg',
    category: 'modern',
    description: 'Current trends with bold geometry and mixed materials'
  },
  {
    id: 'style-desert',
    name: 'Desert / Xeriscape',
    imageUrl: '/images/style_desert_xeriscape.jpg',
    category: 'tropical',
    description: 'Water-wise landscape with cacti, succulents, and rocks'
  },
  {
    id: 'style-southwestern',
    name: 'Southwestern',
    imageUrl: '/images/style_southwestern.jpg',
    category: 'tropical',
    description: 'Vibrant colors, adobe textures, and native desert plants'
  },
  {
    id: 'style-prairie',
    name: 'Prairie',
    imageUrl: '/images/style_prairie.jpg',
    category: 'cottage',
    description: 'Native grasses and wildflowers with a natural, sweeping look'
  },
  {
    id: 'style-woodland',
    name: 'Woodland',
    imageUrl: '/images/style_woodland.jpg',
    category: 'cottage',
    description: 'Shady, naturalistic garden with ferns and understory plants'
  },
  {
    id: 'style-coastal',
    name: 'Coastal',
    imageUrl: '/images/style_coastal.jpg',
    category: 'tropical',
    description: 'Breezy, salt-tolerant planting with dunes and grasses'
  },
  {
    id: 'style-colonial',
    name: 'Colonial Revival',
    imageUrl: '/images/style_english_cottage_garden.jpg', // Fallback due to quota
    category: 'traditional',
    description: 'Symmetrical, picket fences, and classic flower borders'
  },
  {
    id: 'style-alpine',
    name: 'Alpine / Rock Garden',
    imageUrl: '/images/style_alpine_rock_garden.jpg',
    category: 'cottage',
    description: 'Mountain-inspired landscape with low-growing plants and stones'
  }
];

// Dynamically load all images from /images directory
const imageModules = import.meta.glob('../images/*.{jpg,jpeg,png,webp}', { eager: true, as: 'url' });

export const styleReferences: StyleReference[] = Object.entries(imageModules).map(([path, url]) => {
  const filename = path.split('/').pop() || '';

  // Check if we have known metadata for this image
  // We check if the known image URL ends with the filename
  const known = knownStyles.find(s => s.imageUrl?.endsWith(filename));

  if (known) {
    return {
      ...known,
      imageUrl: url, // Use the resolved URL from Vite
      id: known.id || `generated-${filename}`,
      name: known.name || filename,
      category: known.category || 'modern',
      description: known.description || 'Imported style'
    } as StyleReference;
  }

  // Generate metadata for new images
  return {
    id: `generated-${filename}`,
    name: filename.split('.')[0].replace(/[-_]/g, ' '),
    imageUrl: url,
    category: 'modern',
    description: 'Imported from /images'
  };
});
