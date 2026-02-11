# Product Requirements Document (PRD)
## AutoScape - AI-Powered Landscape Design Platform

**Version:** 1.0
**Date:** February 2026
**Status:** Active Development

---

## 1. Executive Summary

### 1.1 Product Vision
AutoScape is an AI-powered landscape design platform that transforms ordinary yards into breathtaking outdoor sanctuaries. Using advanced generative AI and RAG-powered botanical intelligence, homeowners can instantly visualize professional landscape designs, receive accurate cost estimates, and connect with verified landscape professionals.

### 1.2 Problem Statement
Homeowners face significant barriers when planning landscape renovations:
- **Visualization Gap:** Difficulty imagining how design changes will look in their specific space
- **Cost Uncertainty:** No easy way to estimate project costs before consulting professionals
- **Designer Discovery:** Finding and vetting qualified landscape professionals is time-consuming
- **Decision Paralysis:** Too many style options without context-appropriate guidance

### 1.3 Solution
AutoScape provides an end-to-end landscape design experience:
1. Upload a photo of your yard
2. Select a design style from curated options
3. Receive AI-generated photorealistic renders, 2D plans, and cost estimates
4. Optionally generate before/after transformation videos
5. Connect with verified landscape professionals to bring designs to life

---

## 2. Target Users

### 2.1 Primary Personas

#### Homeowner (Primary)
- **Demographics:** 25-65 years old, homeowner
- **Goals:** Visualize yard improvements, understand costs, make informed decisions
- **Pain Points:** Limited design imagination, fear of expensive mistakes, contractor trust issues
- **Usage Pattern:** 1-5 designs per project cycle

#### Landscape Professional (Secondary)
- **Demographics:** Licensed landscapers, garden designers, landscape architects
- **Goals:** Generate leads, showcase portfolio, streamline client consultations
- **Pain Points:** Difficulty conveying design vision to clients, time-consuming proposal creation
- **Usage Pattern:** Regular platform engagement for lead generation

#### Platform Administrator
- **Demographics:** Internal team members
- **Goals:** Monitor platform health, verify professionals, manage content quality
- **Usage Pattern:** Daily platform management

---

## 3. Feature Requirements

### 3.1 Core Features (MVP)

#### 3.1.1 AI Design Generation
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Image Upload | Accept yard photos (JPEG, PNG, WebP) up to 10MB | P0 |
| Image Validation | AI verification that uploaded image is a yard/garden | P0 |
| Style Selection | 19 curated design styles (Modern, Cottage, Japanese, etc.) | P0 |
| Render Generation | Generate 1-3 photorealistic design renders per request | P0 |
| 2D Plan Generation | Create orthographic top-down architectural plan | P0 |
| Design Analysis | AI description of proposed changes and concepts | P0 |

**Technical Implementation:**
- Primary AI: Google Gemini 3.0 Flash Image
- Fallback: Freepik Flux 1.1 Pro
- Output: 1024x1024px minimum resolution

#### 3.1.2 Cost Estimation
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Total Cost Estimate | Aggregate project cost in USD | P0 |
| Category Breakdown | Itemize: Hardscape, Plants, Labor, Other | P0 |
| Plant Palette | List recommended plants with individual prices | P1 |
| Location Awareness | Adjust estimates based on user location | P1 |
| RAG Enhancement | Vector search for accurate material pricing | P1 |

**Technical Implementation:**
- Qdrant Vector Database for semantic material search
- CLIP embeddings for plant identification
- Regional pricing adjustments via location input

#### 3.1.3 User Authentication
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Google OAuth | One-click Google sign-in | P0 |
| Email/Password | Traditional registration option | P0 |
| User Sync | Persist user data to Firestore on login | P0 |
| Session Management | Firebase token-based sessions | P0 |

#### 3.1.4 Design Management
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Save Designs | Persist designs to user account | P0 |
| View History | Browse previously generated designs | P0 |
| Delete Designs | Remove unwanted designs | P1 |
| Shareable Links | Generate 10-character short IDs for sharing | P0 |
| Public/Private Toggle | Control design visibility | P1 |

---

### 3.2 Enhanced Features

#### 3.2.1 Video Generation
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Transformation Video | Before-to-after morphing animation | P1 |
| Processing Time | 5-9 minutes expected duration | P1 |
| Video Storage | Firebase Storage with public URLs | P1 |
| Fallback Provider | Freepik Kling v2 if primary fails | P2 |

**Technical Implementation:**
- Primary: Google Gemini Veo 3.1
- Fallback: Freepik Kling v2
- Output: MP4 format, 720p minimum

#### 3.2.2 Community Gallery
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Public Gallery | Browse community-shared designs | P1 |
| Filtering | Filter by style, date, popularity | P2 |
| Demo Fallback | Show demo designs if gallery empty | P2 |

#### 3.2.3 Alternative Renders
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Variation Generation | Generate style variations on existing design | P2 |
| Side-by-Side Compare | React Compare Slider for before/after | P1 |

---

### 3.3 Professional Features

#### 3.3.1 Designer Onboarding
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Profile Creation | Business name, bio, specialties, experience | P1 |
| Portfolio Upload | Up to 10 portfolio images | P1 |
| Verification Request | Submit for admin verification | P1 |
| Service Areas | City, state, service radius | P2 |

#### 3.3.2 Business Dashboard
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Profile Management | Edit business information | P1 |
| Lead Inbox | View and respond to homeowner inquiries | P1 |
| Portfolio Gallery | Manage public design portfolio | P1 |
| Analytics | View profile impressions and lead metrics | P2 |

#### 3.3.3 Lead Generation
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Contact Designer | Modal for homeowners to message designers | P1 |
| Design Attachment | Attach design reference to message | P2 |
| Message Notifications | Email alerts for new leads | P2 |

---

### 3.4 Monetization Features

#### 3.4.1 Credit System
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Free Trial | 2 free credits for new users | P0 |
| Credit Consumption | 1 credit per design generation | P0 |
| Credit Tracking | Display current balance in UI | P0 |
| Purchase Prompt | Redirect to pricing when credits exhausted | P0 |

#### 3.4.2 Subscription Tiers
| Tier | Price | Credits | Cost per Credit |
|------|-------|---------|-----------------|
| Weekly | $3.99 | 5 | $0.80 |
| Monthly | TBD | TBD | TBD |
| Annual | TBD | TBD | TBD |

**Technical Implementation:**
- Payment: Stripe Checkout Sessions
- Webhooks: Stripe webhook for payment confirmation
- Credit Addition: Automatic on successful payment

---

### 3.5 Admin Features

#### 3.5.1 Admin Dashboard
| Requirement | Description | Priority |
|-------------|-------------|----------|
| User Management | View all users, adjust roles | P1 |
| Designer Verification | Approve/reject designer applications | P1 |
| Design Moderation | Review and remove inappropriate content | P2 |
| Analytics | Charts for design styles, user trends, revenue | P1 |

---

## 4. Technical Architecture

### 4.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Routing | React Router v7 |
| State Management | React Context API |
| Backend | Python (FastAPI) |
| Database | Firebase Firestore (NoSQL) |
| Authentication | Firebase Auth |
| Storage | Firebase Cloud Storage |
| AI/ML | Google Gemini, Freepik API |
| Vector Search | Qdrant Cloud |
| Payments | Stripe |
| Hosting | Firebase Hosting + Cloud Run |

### 4.2 Data Models

#### Design Document
```typescript
interface Design {
  id: string;
  shortId: string;              // 10-char shareable ID
  userId: string;
  yardImageUrl: string;         // Original upload
  renderImages: string[];       // Generated renders
  planImage: string;            // 2D architectural plan
  videoUrl?: string;            // Transformation video
  estimates: {
    totalCost: number;
    currency: "USD";
    breakdown: MaterialItem[];
    plantPalette: Plant[];
    ragEnhanced: boolean;
  };
  analysis: {
    currentLayout: string;
    designConcept: string;
    visualDescription: string;
    maintenanceLevel: string;
  };
  style: DesignStyle;
  isPublic: boolean;
  createdAt: Timestamp;
}
```

#### User Document
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'user' | 'pro' | 'admin';
  createdAt: Timestamp;
  lastLogin: Timestamp;
}
```

#### User Credits Document
```typescript
interface UserCredits {
  credits: number;
  freeCreditsUsed: number;
  totalCreditsPurchased: number;
  lastUpdated: Timestamp;
}
```

#### Designer Document
```typescript
interface Designer {
  userId: string;
  businessName: string;
  fullName: string;
  email: string;
  phone?: string;
  city: string;
  state: string;
  specialties: string[];
  yearsExperience: string;
  website?: string;
  bio: string;
  avatarUrl: string;
  portfolioImages: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4.3 API Endpoints

#### Frontend Services (TypeScript)
| Service | Purpose |
|---------|---------|
| geminiService | AI image generation and analysis |
| firestoreService | Database CRUD operations |
| creditService | Credit management |
| stripeService | Payment processing |
| storageService | File uploads |
| ragBudgetService | Cost estimation enhancement |

#### Backend APIs (Python/FastAPI)
| Endpoint | Port | Purpose |
|----------|------|---------|
| `/api/create-checkout-session` | 8003 | Stripe checkout |
| `/api/webhook` | 8003 | Stripe webhooks |
| `/api/enhance-with-rag` | 8002 | Plant/cost RAG |
| `/api/generate-video` | 8001 | Video generation |

### 4.4 Third-Party Integrations

| Service | Purpose | Fallback |
|---------|---------|----------|
| Google Gemini | Primary AI generation | Freepik |
| Freepik API | Secondary AI generation | - |
| Qdrant | Vector search for RAG | Static pricing |
| Stripe | Payment processing | - |
| Firebase | Auth, DB, Storage | - |

---

## 5. Design Styles Catalog

AutoScape supports 19 curated landscape design styles:

### Modern & Contemporary
1. Modern Minimalist
2. Contemporary Urban
3. Scandinavian Simple
4. Mid-Century Modern

### Traditional & Classic
5. English Cottage Garden
6. French Formal Garden
7. Victorian Garden
8. Colonial Garden

### Regional & Cultural
9. Japanese Zen Garden
10. Mediterranean
11. Tropical Paradise
12. Desert Xeriscape

### Eco-Friendly & Natural
13. Native Wildflower Meadow
14. Pollinator Garden
15. Sustainable Permaculture
16. Rain Garden

### Specialty
17. Rustic Farmhouse
18. Coastal Beach Garden
19. Mountain Lodge

---

## 6. User Flows

### 6.1 Design Generation Flow
```
Landing Page → Upload Photo → Select Style → Configure Details
     ↓              ↓              ↓              ↓
  Sign In      Validation     Preview       Generate
     ↓              ↓              ↓              ↓
   Account      Valid Yard    Style Card    AI Processing
     ↓                                          ↓
  Dashboard  ←←←←←←←←←←←←←←←←←←←←←←←←←←←  Results Page
```

### 6.2 Payment Flow
```
Low Credits → Pricing Page → Select Plan → Stripe Checkout
     ↓             ↓              ↓              ↓
  Warning      View Tiers    Weekly/Mo/Yr   Payment Form
     ↓                                          ↓
  Redirect                                   Success
     ↓                                          ↓
  Blocked  ←←←←  Return to App  ←←←  Credits Added
```

### 6.3 Designer Onboarding Flow
```
Business Page → Apply → Profile Form → Submit → Admin Review
      ↓           ↓          ↓           ↓           ↓
  Learn More   Sign In   Fill Details  Pending   Verified
                                          ↓           ↓
                                       Waiting   Dashboard
```

---

## 7. Non-Functional Requirements

### 7.1 Performance
| Metric | Target |
|--------|--------|
| Design Generation | < 30 seconds |
| Page Load | < 2 seconds |
| Image Upload | < 5 seconds (10MB) |
| Video Generation | < 10 minutes |

### 7.2 Scalability
- Support 10,000 concurrent users
- Handle 1,000 design generations per hour
- Store 1M+ designs

### 7.3 Reliability
- 99.9% uptime SLA
- Automatic failover for AI providers
- Graceful degradation for non-critical features

### 7.4 Security
- Firebase Authentication for all user operations
- Firestore security rules for data access control
- HTTPS-only traffic
- PCI compliance via Stripe (no card data stored)
- Environment variable management for secrets

---

## 8. Success Metrics

### 8.1 Key Performance Indicators (KPIs)

| Metric | Definition | Target |
|--------|------------|--------|
| Design Completion Rate | Designs completed / Designs started | > 70% |
| Conversion Rate | Paid users / Total users | > 5% |
| Designer Lead Rate | Messages sent / Designs viewed | > 2% |
| User Retention (D7) | Users returning within 7 days | > 30% |
| NPS Score | Net Promoter Score | > 40 |

### 8.2 Business Metrics
- Monthly Active Users (MAU)
- Average Revenue Per User (ARPU)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Designer Verification Rate

---

## 9. Roadmap

### Phase 1: Core Platform (Current)
- [x] AI design generation
- [x] Cost estimation
- [x] User authentication
- [x] Design saving and sharing
- [x] Credit system and Stripe integration
- [x] Video generation
- [x] Designer profiles

### Phase 2: Marketplace Enhancement (Q2 2026)
- [ ] Designer reviews and ratings
- [ ] Enhanced search and filtering
- [ ] Saved style preferences
- [ ] Design collaboration tools

### Phase 3: Mobile Experience (Q3 2026)
- [ ] Progressive Web App (PWA)
- [ ] Mobile-optimized camera capture
- [ ] Push notifications

### Phase 4: Enterprise Features (Q4 2026)
- [ ] Team accounts
- [ ] White-label solutions
- [ ] API access for partners
- [ ] Bulk design generation

---

## 10. Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI API rate limits | High | Medium | Multi-provider fallback |
| Cost estimation accuracy | Medium | Medium | RAG enhancement, user feedback |
| Designer quality control | High | Low | Verification process, reviews |
| Payment processing issues | High | Low | Stripe reliability, support escalation |
| Image generation quality | Medium | Medium | Multiple render variants, regeneration |

---

## 11. Appendix

### A. Environment Variables
```
VITE_GEMINI_API_KEY
VITE_FIREBASE_*
QDRANT_URL, QDRANT_API_KEY
STRIPE_SECRET_KEY
FREEPIK_API_KEY
```

### B. Key Files Reference
| File | Purpose |
|------|---------|
| `App.tsx` | Main routing and app structure |
| `components/DesignWizard.tsx` | Multi-step design wizard |
| `components/ResultsViewV2.tsx` | Results display |
| `services/geminiService.ts` | AI integration |
| `services/firestoreService.ts` | Database operations |
| `services/creditService.ts` | Credit management |
| `servers/stripe_checkout_api.py` | Payment backend |

### C. Design Style Reference Images
All style reference images are stored in `/public/images/` and cataloged in `data/styleReferences.ts`.

---

**Document Owner:** Product Team
**Last Updated:** February 2026
**Review Cycle:** Monthly
