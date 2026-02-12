
  Codebase Audit — AutoScape

  The Core Problem

  The app is a Vite + React SPA with ~17,000 lines across 75 source files. The architecture
  started flat and grew without structure. There are three distinct problems: files doing too 
  much, data living in the wrong place, and scattered duplication.

  ---
  Structural Issues

  1. Duplicate Components

  ResultsView.tsx (1,266 lines) and ResultsViewV2.tsx (1,044 lines) both exist and do nearly the
   same things. App.tsx:5 imports V2 aliased as the real one — meaning V1 is dead weight. It
  should be deleted.

  2. Monolithic Components

  | File                    | Lines | What's wrong
                     |
  |-------------------------|-------|-----------------------------------------------------------
  -------------------|
  | ResultsViewV2.tsx       | 1,044 | Video gen, 3D, affiliates, before/after, edit mode, charts
   — all one file    |
  | AdminDashboard.tsx      | 1,009 | Users, gallery, designers, credits, analytics — should be
  5 panel components |
  | LandingPage.tsx         | 665   | Hero, demo carousel, features, CTA, testimonials — nothing
   extracted         |
  | DesignConfiguration.tsx | 596   | Multi-section form with no sub-components
                     |
  | BlogArticle.tsx         | 424   | Blog content is hardcoded as JSX in the component file
                     |
  | firestoreService.ts     | 849   | Users + designs + designers + admin — should be 3–4
  separate services        |

  3. Data in the Wrong Place

  The worst offender: BlogArticle.tsx:16–116 stores entire blog articles as hardcoded JSX nodes
  inside a Record object inside a component file. Content editing requires a code deploy. All
  blog data should live in /data/blog.ts as plain objects (markdown strings or structured text),
   consumed by the component.

  4. State in Too Many Places

  Credits are tracked in AuthContext, creditService.ts, and Firestore — three sources that can
  drift. There's no single source of truth.

  5. Code Quality Smells

  - 248 console.log calls across 34 files (heaviest in firestoreService.ts: 61,
  geminiService.ts: 28)
  - 55 alert() calls across 12 files — no toast/notification system
  - DesignContext.tsx duplicates the FileReader image-handling logic already in App.tsx
  - 22+ useState hooks in a single component (ResultsViewV2)

  ---
  Proposed Folder Refactor

  /components
    /landing          HeroSection, DemoSection, FeaturesSection, TestimonialsSection
    /results          DesignComparisonView, DesignAnalysisPanel, VideoPanel, MaterialsList
    /admin            AdminUsersPanel, AdminGalleryPanel, AdminCreditsPanel, AdminOverviewPanel
    /blog             BlogCard, BlogArticleView
    /shared           Button, Modal, Toast, PageShell, SEOHead
  /data
    blog.ts           ← move all article content out of BlogArticle.tsx
    styleReferences.ts
    professionals.ts
  /services
    userService.ts    ← split out of firestoreService.ts
    designService.ts  ← split out of firestoreService.ts
    adminService.ts   ← split out of firestoreService.ts
    geminiService.ts
    creditService.ts
    stripeService.ts
    affiliateService.ts
  /hooks
    useSEO.ts
    useCredits.ts     ← single source of truth for credit state
    useDesigns.ts
  /utils
    fileUtils.ts      ← consolidate FileReader logic
    errorUtils.ts     ← replace alert() with a toast system

  ---
  Priority Order (no timelines, just sequence)

  1. Delete ResultsView.tsx — it's unused
  2. Move blog content out of BlogArticle.tsx → /data/blog.ts
  3. Replace all alert() with a toast component
  4. Strip console.log (or gate behind import.meta.env.DEV)
  5. Split firestoreService.ts into userService, designService, adminService
  6. Break ResultsViewV2 into focused subcomponents
  7. Break AdminDashboard into panel components
  8. Extract HeroSection, DemoSection, etc. from LandingPage
  9. Consolidate credit state into useCredits hook
  10. Add useSEO hook used consistently across all page components

  ---
  Docs Outline

  For a project of this size, docs should cover three audiences: contributors (how the code
  works), content editors (how to add blog posts, styles), and operators (how to deploy and
  configure).

  /docs
    README.md                 Quick start, tech stack, commands
    ARCHITECTURE.md           Folder structure, data flow diagram, routing map
    CONTRIBUTING.md           Branch naming, PR process, code style rules

    /guides
      adding-a-blog-post.md   How to add articles to /data/blog.ts
      adding-a-design-style.md  How to add to styleReferences.ts
      environment-setup.md    All env vars explained (.env.example walkthrough)
      firebase-setup.md       Firestore rules, Storage CORS, Auth providers
      stripe-setup.md         Price IDs, webhook setup, credit system logic
      deployment.md           Firebase Hosting deploy steps

    /reference
      services.md             What each service file does and its public API
      components.md           Key component props and responsibilities
      data-models.md          SavedDesign, DesignerProfile, CreditRecord types
      seo.md                  How useSEO hook works, per-page meta requirements

  Rules for writing the docs:

  - Docs live in /docs at repo root, not scattered in README.md only
  - Each guide answers one question completely (e.g. "how do I add a blog post?")
  - Architecture doc includes a visual routing map (even ASCII is fine)
  - Every env variable must appear in /docs/guides/environment-setup.md and .env.example
  - Reference docs are generated from code comments where possible — don't duplicate types
  - No docs for obvious things; write docs for things that will confuse a new dev in 6 months