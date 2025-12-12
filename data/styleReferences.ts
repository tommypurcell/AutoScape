export interface StyleReference {
  id: string;
  name: string;
  imageUrl: string;
  category: 'modern' | 'traditional' | 'tropical' | 'zen' | 'cottage';
  description: string;
}

// Static list of curated styles - no dynamic imports to avoid duplicates
export const styleReferences: StyleReference[] = [
  {
    id: 'modern-1',
    name: 'Modern Showcase',
    imageUrl: new URL('../images/2022-CA118-Showcase-RAP06636-HDR.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Contemporary design with clean lines'
  },
  {
    id: 'modern-2',
    name: 'Seattle Modern',
    imageUrl: new URL('../images/YardzenSeattle_Credit_SashaReikoPhotographyforYardzen-88c2c54068904e41b591c6782484df18.webp', import.meta.url).href,
    category: 'modern',
    description: 'Pacific Northwest modern landscape'
  },
  {
    id: 'modern-3',
    name: 'Modern Patio',
    imageUrl: new URL('../images/298815228_170632415484129_1384064757048194521_n-5aa965d810fe43559536e0996cea381e.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Sleek outdoor living space'
  },
  {
    id: 'modern-4',
    name: 'Contemporary Garden',
    imageUrl: new URL('../images/158b592c7b478f551066a9b553f70d8e.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Minimalist garden design'
  },
  {
    id: 'modern-5',
    name: 'Modern Landscape',
    imageUrl: new URL('../images/189b44d054e9c68797dbda0c306d38c8.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Clean geometric patterns'
  },
  {
    id: 'modern-6',
    name: 'Urban Modern',
    imageUrl: new URL('../images/1c2b05823dae22373dc2274f10dbba76.jpg', import.meta.url).href,
    category: 'modern',
    description: 'City-style modern yard'
  },
  {
    id: 'modern-7',
    name: 'Elegant Modern',
    imageUrl: new URL('../images/1fe4d6765b4b183a2332231f35423390.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Sophisticated outdoor space'
  },
  {
    id: 'modern-8',
    name: 'Modern Retreat',
    imageUrl: new URL('../images/28b4536e469fd0b45653005c75a34fc5.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Private modern sanctuary'
  },
  {
    id: 'modern-9',
    name: 'Contemporary Yard',
    imageUrl: new URL('../images/33095a394078a009ed23f2a95ea676ac.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Modern architectural landscape'
  },
  {
    id: 'modern-10',
    name: 'Modern Oasis',
    imageUrl: new URL('../images/4ed2f92e09783575ebbd64a4aa5f9e92.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Tranquil modern design'
  },
  {
    id: 'modern-11',
    name: 'Stylish Modern',
    imageUrl: new URL('../images/6399be5e3d431d61544c9891589b7cbb.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Chic outdoor living'
  },
  {
    id: 'modern-12',
    name: 'Modern Elegance',
    imageUrl: new URL('../images/819c7b84848bdf7ef7a9e3db6fabd818.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Refined modern aesthetic'
  },
  {
    id: 'modern-13',
    name: 'Modern Classic',
    imageUrl: new URL('../images/a01d09a4f1331a25dd8536d8f04134ac.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Timeless modern design'
  },
  {
    id: 'modern-14',
    name: 'Contemporary Space',
    imageUrl: new URL('../images/ddacb720e35d52365ed145f632fde90d.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Modern outdoor room'
  },
  {
    id: 'modern-15',
    name: 'Modern Garden',
    imageUrl: new URL('../images/ed1da0e109d1e48f006223b28156d92a.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Structured modern planting'
  },
  {
    id: 'modern-16',
    name: 'Modern Design',
    imageUrl: new URL('../images/f55f01d7ae056cdb26e5258f86655496.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Bold modern statement'
  },
  {
    id: 'modern-17',
    name: 'Modern Courtyard',
    imageUrl: new URL('../images/fd58d221751af7e938006fcc91f32987.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Intimate modern space'
  },
  {
    id: 'modern-18',
    name: 'Modern Style',
    imageUrl: new URL('../images/fde400ef1c7d856bc6f2ab99bfe7bf27.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Contemporary landscape style'
  },
  {
    id: 'modern-19',
    name: 'Modern Inspiration',
    imageUrl: new URL('../images/images.jpeg', import.meta.url).href,
    category: 'modern',
    description: 'Modern design inspiration'
  },
  {
    id: 'modern-20',
    name: 'Modern Vision',
    imageUrl: new URL('../images/maxresdefault.jpg', import.meta.url).href,
    category: 'modern',
    description: 'Modern landscape vision'
  }
];
