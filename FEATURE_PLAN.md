# AutoScape Content Hub - Feature Integration Plan

## Architecture Overview

Transform the blog into a **Content Hub** with interactive tools that generate SEO-rich, shareable pages.

```
/resources (Content Hub)
├── /blog                    ← Existing editorial content
├── /plants                  ← Plant Finder Quiz + Generated Guides
├── /prices                  ← Price Tracker + Product Pages
├── /budget                  ← Phased Budget Planner + Templates
├── /share                   ← Social Media Post Generator
└── /scan                    ← LiDAR 3D Yard Scanner (Mobile)
```

---

## 1. Plant Finder Quiz (`/resources/plants`)

### User Flow
```
Quiz Start → Location → Soil Type → Sun/Shade → Preferences → Results Page
```

### SEO Value
Each quiz completion generates a **unique, indexable URL**:
```
/resources/plants/california-zone-9b-clay-full-sun
/resources/plants/texas-zone-8-sandy-partial-shade
/resources/plants/florida-zone-10-loamy-shade-tolerant
```

### Features
- **Quiz Questions:**
  1. ZIP code → USDA hardiness zone lookup
  2. Soil type (clay, sandy, loamy, unknown)
  3. Sun exposure (full sun, partial, shade)
  4. Yard conditions (wet/dry, slope, pets, kids)
  5. Preferences (native, low-maintenance, flowering, edible)

- **Results Page Includes:**
  - Top 20 recommended plants with images
  - Care difficulty rating
  - Mature size & spacing
  - Water requirements
  - Seasonal interest chart
  - "Where to Buy" links (affiliate)
  - Save to design / Add to palette

### Database Schema
```typescript
interface PlantData {
  id: string;
  commonName: string;
  scientificName: string;
  imageUrl: string;
  zones: number[];           // USDA zones 3-11
  soilTypes: string[];       // clay, sandy, loamy
  sunRequirements: string;   // full, partial, shade
  waterNeeds: string;        // low, moderate, high
  matureHeight: string;
  matureWidth: string;
  growthRate: string;
  maintenance: string;       // low, medium, high
  features: string[];        // native, deer-resistant, pollinator, etc.
  seasonalInterest: {
    spring: boolean;
    summer: boolean;
    fall: boolean;
    winter: boolean;
  };
  affiliateLinks: {
    homedepot?: string;
    lowes?: string;
    naturehills?: string;
  };
}
```

### Admin Features
- Manage plant database (CRUD)
- Add/edit affiliate links
- View quiz completion analytics
- See most popular plant combinations
- Export popular searches for blog topics

---

## 2. Dynamic Price Tracker (`/resources/prices`)

### User Flow
```
Browse Categories → Select Product → See Live Prices → Compare Stores → Add to Budget
```

### SEO Value
Auto-generated product comparison pages:
```
/resources/prices/pavers/travertine
/resources/prices/mulch/rubber-black
/resources/prices/fence/cedar-privacy-6ft
/resources/prices/sod/bermuda-500sqft
```

### Features
- **Categories:**
  - Pavers & Stone
  - Mulch & Soil
  - Fencing
  - Sod & Grass Seed
  - Trees & Shrubs
  - Outdoor Lighting
  - Irrigation
  - Edging & Borders

- **Price Tracking:**
  - Home Depot API / scraping
  - Lowe's API / scraping
  - Amazon (affiliate)
  - Local nurseries (manual entry)

- **Each Product Page:**
  - Current prices from 3+ stores
  - Price history chart (30/90/365 days)
  - "Best time to buy" indicator
  - Stock availability
  - Delivery/pickup options
  - Price alert signup
  - Calculator (sq ft → quantity needed)

### Database Schema
```typescript
interface ProductPrice {
  productId: string;
  productName: string;
  category: string;
  unit: string;              // "per sq ft", "each", "per bag"
  prices: {
    store: string;           // "homedepot", "lowes", "amazon"
    price: number;
    inStock: boolean;
    lastUpdated: Date;
    url: string;
  }[];
  priceHistory: {
    date: Date;
    store: string;
    price: number;
  }[];
  specifications: Record<string, string>;
  imageUrl: string;
}
```

### Backend Requirements
- **Price Scraper Service** (Python)
  - Runs daily/hourly cron job
  - Handles rate limiting
  - Stores historical prices
  - Detects sales/deals

### Admin Features
- Add/edit products
- View price trends
- Manage store integrations
- Flag broken price feeds
- See most-searched products

---

## 3. Phased Budget Planner (`/resources/budget`)

### User Flow
```
Select Project Type → Enter Total Budget → AI Categorizes Items → Drag to Phases → Generate Plan
```

### SEO Value
Shareable budget templates:
```
/resources/budget/templates/modern-backyard-20k
/resources/budget/templates/front-yard-curb-appeal-5k
/resources/budget/templates/patio-entertaining-15k
/resources/budget/saved/abc123xyz  ← User's custom budget
```

### Features
- **Budget Categories:**
  - **Must-Have:** Safety, structural, permits
  - **Should-Have:** Core design elements
  - **Nice-to-Have:** Upgrades, aesthetics
  - **Future Phase:** Year 2-3 additions

- **Smart Categorization:**
  - AI suggests priority based on:
    - Safety requirements
    - ROI / home value impact
    - Dependency chain (need fence before pool)
    - Seasonal timing (plant in fall, hardscape in spring)

- **Output:**
  - Phase 1/2/3 breakdown with timelines
  - Monthly payment calculator
  - Material list with quantities
  - Contractor vs DIY recommendations
  - Print-ready PDF export

### Database Schema
```typescript
interface BudgetPlan {
  id: string;
  userId?: string;
  shortId: string;           // For sharing
  projectType: string;
  totalBudget: number;
  phases: {
    name: string;            // "Phase 1: Foundation"
    priority: number;
    targetDate?: Date;
    items: {
      name: string;
      category: string;      // must-have, should-have, nice-to-have
      estimatedCost: number;
      actualCost?: number;
      diyable: boolean;
      notes: string;
    }[];
    subtotal: number;
  }[];
  createdAt: Date;
  isPublic: boolean;
}
```

### Admin Features
- Create budget templates
- Set default item categories
- View popular budget ranges
- Analytics on phase completion

---

## 4. Social Media Post Generator (`/resources/share`)

### User Flow
```
Upload Before/After → AI Generates Caption → Select Platform → Customize → Download/Share
```

### SEO Value
Gallery of transformations with unique URLs:
```
/resources/share/gallery
/resources/share/transformation/abc123
```

### Features
- **Supported Platforms:**
  - Instagram (1080x1080, 1080x1350)
  - Facebook (1200x630)
  - Pinterest (1000x1500)
  - TikTok thumbnail (1080x1920)
  - Twitter/X (1200x675)

- **AI Caption Generation:**
  - Style options: Professional, Casual, Humorous
  - Auto-generates relevant hashtags
  - Includes before/after stats (sq ft changed, plants added)
  - Optional: Include cost breakdown
  - CTA options: "DM for details", "Link in bio", custom

- **Design Options:**
  - Side-by-side comparison
  - Swipe reveal animation (video)
  - Slider overlay
  - Grid collage (4 angles)
  - Story format with text overlays

- **Output:**
  - High-res downloadable images
  - Video exports (MP4)
  - Copy-paste captions with hashtags
  - Direct share to platforms (OAuth)
  - Watermark with AutoScape branding (optional)

### Database Schema
```typescript
interface SocialPost {
  id: string;
  userId: string;
  designId?: string;         // Link to original design
  beforeImage: string;
  afterImage: string;
  platform: string;
  dimensions: { width: number; height: number };
  caption: string;
  hashtags: string[];
  generatedImageUrl: string;
  generatedVideoUrl?: string;
  shares: number;
  createdAt: Date;
}
```

### Admin Features
- View most-shared posts
- Manage hashtag suggestions
- Review for brand compliance
- Feature posts in gallery

---

## 5. LiDAR 3D Yard Scanner (`/resources/scan`)

### Overview
Use iPhone/iPad LiDAR to capture accurate yard dimensions and terrain.

### User Flow (Mobile Only)
```
Open Scanner → Walk Perimeter → Mark Features → Process → Get 3D Model
```

### Features
- **Capture:**
  - AR-guided boundary walking
  - Automatic edge detection
  - Mark existing features (trees, structures, slopes)
  - Measure curved areas accurately

- **Output:**
  - 3D mesh of yard terrain
  - Accurate square footage
  - Elevation changes / slopes
  - Existing hardscape boundaries
  - Tree canopy coverage

- **Integration with Design Wizard:**
  - Import 3D scan as base layer
  - AI understands actual terrain
  - More accurate cost estimates
  - Better plant placement recommendations

### Technical Requirements
```typescript
interface YardScan {
  id: string;
  userId: string;
  scanData: {
    mesh: string;            // 3D mesh file URL
    pointCloud: string;      // Point cloud data
    dimensions: {
      totalSqFt: number;
      perimeter: number;
      maxElevationChange: number;
    };
    features: {
      type: string;          // tree, structure, slope
      position: { x: number; y: number; z: number };
      dimensions?: { width: number; height: number; depth: number };
    }[];
  };
  thumbnailUrl: string;
  createdAt: Date;
}
```

### Implementation Options
1. **Native iOS App** - Best LiDAR access, separate app
2. **React Native Module** - If building mobile app
3. **WebXR** - Limited browser support, less accurate
4. **Third-party SDK** - Polycam, Matterport APIs

### Recommended: Progressive Web App + Native Scanner
- Main app stays web-based
- Separate lightweight iOS app for scanning only
- Scan exports to AutoScape via deep link

---

## 6. Content Hub Navigation

### New Routes
```typescript
// App.tsx additions
<Route path="/resources" element={<ResourcesHub />} />
<Route path="/resources/plants" element={<PlantFinder />} />
<Route path="/resources/plants/:slug" element={<PlantGuidePage />} />
<Route path="/resources/prices" element={<PriceTracker />} />
<Route path="/resources/prices/:category/:product" element={<ProductPricePage />} />
<Route path="/resources/budget" element={<BudgetPlanner />} />
<Route path="/resources/budget/templates/:slug" element={<BudgetTemplate />} />
<Route path="/resources/budget/saved/:id" element={<SavedBudget />} />
<Route path="/resources/share" element={<SocialGenerator />} />
<Route path="/resources/share/gallery" element={<TransformationGallery />} />
<Route path="/resources/scan" element={<LidarScanner />} />
<Route path="/blog" element={<BlogPage />} />  // Move under resources?
<Route path="/blog/:slug" element={<BlogArticle />} />
```

### Header Navigation Update
```
Home | Create | Gallery | Resources ▾ | Pricing | Business
                            ├── Plant Finder
                            ├── Price Tracker
                            ├── Budget Planner
                            ├── Share Generator
                            ├── 3D Scanner
                            └── Blog
```

---

## 7. SEO Strategy

### Generated Content Pages
Each tool generates thousands of indexable pages:

| Tool | Example URLs | Estimated Pages |
|------|--------------|-----------------|
| Plant Finder | `/plants/zone-9-clay-full-sun` | 500+ combinations |
| Price Tracker | `/prices/pavers/travertine` | 200+ products |
| Budget Planner | `/budget/templates/modern-patio-10k` | 50+ templates |
| Social Gallery | `/share/gallery` | Unlimited user content |

### Schema.org Markup
```json
// Plant Guide Page
{
  "@type": "HowTo",
  "name": "Best Plants for Zone 9 Clay Soil",
  "step": [...]
}

// Price Comparison Page
{
  "@type": "Product",
  "name": "Travertine Pavers",
  "offers": [
    { "@type": "Offer", "seller": "Home Depot", "price": "4.99" },
    { "@type": "Offer", "seller": "Lowe's", "price": "5.49" }
  ]
}

// Budget Template
{
  "@type": "Article",
  "name": "Modern Backyard on a $20k Budget"
}
```

### Internal Linking
- Blog articles link to relevant plant guides
- Plant guides link to price comparisons
- Price pages link to budget templates
- Budget templates link to design wizard
- All pages link to main conversion (Create)

---

## 8. Admin Dashboard Additions

### New Admin Sections
```
Admin Dashboard
├── Users (existing)
├── Designs (existing)
├── Designers (existing)
├── Analytics (existing)
├── Plants            ← NEW
│   ├── Plant Database CRUD
│   ├── Zone/Soil mappings
│   └── Affiliate link management
├── Products          ← NEW
│   ├── Product catalog
│   ├── Price feed status
│   └── Store integrations
├── Budget Templates  ← NEW
│   ├── Template editor
│   └── Default categories
├── Social Posts      ← NEW
│   ├── Moderation queue
│   └── Featured posts
└── Content           ← NEW
    ├── Blog articles
    ├── SEO performance
    └── Sitemap generator
```

---

## 9. Database Collections (Firestore)

### New Collections
```
plants/                 # Plant database
├── {plantId}

products/               # Price tracker products
├── {productId}

priceHistory/           # Historical prices
├── {productId}/prices/{timestamp}

budgetTemplates/        # Pre-made budget templates
├── {templateId}

userBudgets/            # User-created budgets
├── {budgetId}

socialPosts/            # Generated social content
├── {postId}

yardScans/              # LiDAR scan data
├── {scanId}

quizResults/            # Plant quiz completions (for analytics)
├── {resultId}
```

---

## 10. Implementation Priority

### Phase 1: Plant Finder (Week 1-2)
- Build quiz UI
- Create plant database (start with 100 popular plants)
- Generate SEO-friendly result pages
- Add to navigation

### Phase 2: Price Tracker (Week 3-4)
- Build product catalog
- Implement price scraper (start with Home Depot)
- Create comparison pages
- Add price alert emails

### Phase 3: Budget Planner (Week 5-6)
- Build drag-drop budget UI
- Create 10 starter templates
- Add AI categorization
- Shareable URLs

### Phase 4: Social Generator (Week 7-8)
- Build post composer
- Implement image generation
- Add caption AI
- Direct share integration

### Phase 5: LiDAR Scanner (Week 9-12)
- Research SDK options
- Build iOS prototype
- Integrate with design wizard
- Beta test with users

---

## 11. Revenue Opportunities

| Feature | Revenue Model |
|---------|--------------|
| Plant Finder | Affiliate links (nurseries, Amazon) |
| Price Tracker | Affiliate links (Home Depot, Lowe's) |
| Budget Planner | Premium templates, contractor referrals |
| Social Generator | Watermark removal (paid feature) |
| LiDAR Scanner | Premium accuracy features |

---

## 12. Quick Wins for SEO

1. **Add sitemap.xml** generator for all dynamic pages
2. **Create robots.txt** allowing all tool pages
3. **Add canonical URLs** to prevent duplicate content
4. **Implement breadcrumbs** for all nested pages
5. **Add FAQ schema** to plant guides
6. **Create location landing pages** (/plants/california, /plants/texas)
