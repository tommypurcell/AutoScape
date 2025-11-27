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
    id: 'modern-1',
    name: 'Modern Showcase',
    imageUrl: '/images/2022-CA118-Showcase-RAP06636-HDR.jpg',
    category: 'modern',
    description: 'Contemporary design with clean lines'
  },
  {
    id: 'modern-2',
    name: 'Seattle Modern',
    imageUrl: '/images/YardzenSeattle_Credit_SashaReikoPhotographyforYardzen-88c2c54068904e41b591c6782484df18.webp',
    category: 'modern',
    description: 'Pacific Northwest modern landscape'
  },
  {
    id: 'modern-3',
    name: 'Modern Patio',
    imageUrl: '/images/298815228_170632415484129_1384064757048194521_n-5aa965d810fe43559536e0996cea381e.jpg',
    category: 'modern',
    description: 'Sleek outdoor living space'
  },
  {
    id: 'modern-4',
    name: 'Contemporary Garden',
    imageUrl: '/images/158b592c7b478f551066a9b553f70d8e.jpg',
    category: 'modern',
    description: 'Minimalist garden design'
  },
  {
    id: 'modern-5',
    name: 'Modern Landscape',
    imageUrl: '/images/189b44d054e9c68797dbda0c306d38c8.jpg',
    category: 'modern',
    description: 'Clean geometric patterns'
  },
  {
    id: 'modern-6',
    name: 'Urban Modern',
    imageUrl: '/images/1c2b05823dae22373dc2274f10dbba76.jpg',
    category: 'modern',
    description: 'City-style modern yard'
  },
  {
    id: 'modern-7',
    name: 'Elegant Modern',
    imageUrl: '/images/1fe4d6765b4b183a2332231f35423390.jpg',
    category: 'modern',
    description: 'Sophisticated outdoor space'
  },
  {
    id: 'modern-8',
    name: 'Modern Retreat',
    imageUrl: '/images/28b4536e469fd0b45653005c75a34fc5.jpg',
    category: 'modern',
    description: 'Private modern sanctuary'
  },
  {
    id: 'modern-9',
    name: 'Contemporary Yard',
    imageUrl: '/images/33095a394078a009ed23f2a95ea676ac.jpg',
    category: 'modern',
    description: 'Modern architectural landscape'
  },
  {
    id: 'modern-10',
    name: 'Modern Oasis',
    imageUrl: '/images/4ed2f92e09783575ebbd64a4aa5f9e92.jpg',
    category: 'modern',
    description: 'Tranquil modern design'
  },
  {
    id: 'modern-11',
    name: 'Stylish Modern',
    imageUrl: '/images/6399be5e3d431d61544c9891589b7cbb.jpg',
    category: 'modern',
    description: 'Chic outdoor living'
  },
  {
    id: 'modern-12',
    name: 'Modern Elegance',
    imageUrl: '/images/819c7b84848bdf7ef7a9e3db6fabd818.jpg',
    category: 'modern',
    description: 'Refined modern aesthetic'
  },
  {
    id: 'modern-13',
    name: 'Modern Classic',
    imageUrl: '/images/a01d09a4f1331a25dd8536d8f04134ac.jpg',
    category: 'modern',
    description: 'Timeless modern design'
  },
  {
    id: 'modern-14',
    name: 'Contemporary Space',
    imageUrl: '/images/ddacb720e35d52365ed145f632fde90d.jpg',
    category: 'modern',
    description: 'Modern outdoor room'
  },
  {
    id: 'modern-15',
    name: 'Modern Garden',
    imageUrl: '/images/ed1da0e109d1e48f006223b28156d92a.jpg',
    category: 'modern',
    description: 'Structured modern planting'
  },
  {
    id: 'modern-16',
    name: 'Modern Design',
    imageUrl: '/images/f55f01d7ae056cdb26e5258f86655496.jpg',
    category: 'modern',
    description: 'Bold modern statement'
  },
  {
    id: 'modern-17',
    name: 'Modern Courtyard',
    imageUrl: '/images/fd58d221751af7e938006fcc91f32987.jpg',
    category: 'modern',
    description: 'Intimate modern space'
  },
  {
    id: 'modern-18',
    name: 'Modern Style',
    imageUrl: '/images/fde400ef1c7d856bc6f2ab99bfe7bf27.jpg',
    category: 'modern',
    description: 'Contemporary landscape style'
  },
  {
    id: 'modern-19',
    name: 'Modern Inspiration',
    imageUrl: '/images/images.jpeg',
    category: 'modern',
    description: 'Modern design inspiration'
  },
  {
    id: 'modern-20',
    name: 'Modern Vision',
    imageUrl: '/images/maxresdefault.jpg',
    category: 'modern',
    description: 'Modern landscape vision'
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
