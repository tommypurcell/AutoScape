# AutoScape Enhancement List
**Generated:** February 10, 2026
**Based on:** PRD Compliance Audit

---

## CRITICAL - Fix Before Any User Testing

### 1. Security Vulnerabilities
| Issue | Location | Description | Fix |
|-------|----------|-------------|-----|
| Anonymous credit exploit | `App.tsx:250-256` | localStorage credits can be manipulated | Move to backend/require auth |
| Hardcoded test email | `BusinessDashboard.tsx:49` | Test credential in production code | Remove before deploy |
| CORS unrestricted | `stripe_checkout_api.py:46` | `allow_origins=["*"]` | Restrict to frontend domain |
| Webhook not verified | `stripe_checkout_api.py:147` | Stripe signature optional | Require & verify signature |

### 2. Authentication Gaps
| Issue | Location | Description |
|-------|----------|-------------|
| No email verification | `AuthContext.tsx` | Users can register with invalid emails |
| No password reset | `AuthModal.tsx` | Users locked out if password forgotten |
| Session expiration not handled | `AuthContext.tsx:43-73` | Stale sessions cause silent failures |

### 3. Error Handling
| Issue | Location | Description |
|-------|----------|-------------|
| No error boundaries | All components | Single crash brings down app |
| Silent credit failures | `App.tsx:258-261` | Errors logged but generation continues |
| No error logging service | Entire app | No Sentry/LogRocket integration |

---

## HIGH PRIORITY - Fix Before Production

### 4. Broken Features

#### Video Generation (Non-Functional)
- [ ] `ResultsViewV2.tsx` - Wire up `handleGenerateVideo()` button
- [ ] `video_generator.py:38-68` - Implement real Freepik API (currently returns mock)
- [ ] `video_generator.py:71-100` - Complete Gemini Veo 3.1 integration
- [ ] Add async job queue for 5-9 minute processing
- [ ] Implement video upload to Firebase Storage
- [ ] Add progress tracking UI
- [ ] Implement fallback chain: Gemini → Freepik → error message

#### RAG Enhancement (Missing P1 Feature)
- [ ] Implement Qdrant vector database integration
- [ ] Add CLIP embeddings for plant identification
- [ ] Populate plant palette with actual images
- [ ] `ragBudgetService.ts:22-25` - Replace deprecated stub with real implementation

### 5. Payment System Fixes
| Issue | Location | Fix Needed |
|-------|----------|------------|
| Webhook incomplete | `stripe_checkout_api.py` | Handle `payment_intent.succeeded` |
| No idempotency | `creditService.ts:132-155` | Prevent double-crediting |
| No subscription management | Frontend | Add Stripe Customer Portal |
| Credits deducted after generation | `App.tsx:300-315` | Deduct before, refund on failure |

### 6. Cost Estimation Improvements
- [ ] Add location-based pricing (PRD: "Regional pricing adjustments")
- [ ] Add cost validation/sanity checks
- [ ] Improve category detection logic in `ResultsViewV2.tsx:88-96`
- [ ] Add fallback pricing if Gemini fails

### 7. Designer/Business Features
| Feature | Status | Needed |
|---------|--------|--------|
| Verification workflow | Partial | Add status emails, clear process |
| Lead messaging | Mock only | Real backend implementation |
| Service areas | Missing | Geo-location filtering |
| Designer search | Missing | Discovery page for homeowners |
| Rating system | Data model only | Full review/rating UI |

---

## MEDIUM PRIORITY - Fix Before Scaling

### 8. Community Gallery
- [ ] Add style filter (PRD P2)
- [ ] Add date range filter (PRD P2)
- [ ] Add popularity sorting (PRD P2)
- [ ] Implement UI pagination/infinite scroll
- [ ] Add designer attribution to gallery cards
- [ ] Add report/flag functionality
- [ ] Fix fallback image paths for production

### 9. Admin Dashboard Improvements
- [ ] Add explicit admin role check at route level
- [ ] Implement audit logging for admin actions
- [ ] Add design review queue with flags/reports
- [ ] Integrate with Stripe API for real revenue metrics
- [ ] Add longer-term analytics and date ranges
- [ ] Add user search/filter functionality

### 10. Design Wizard Enhancements
| Issue | Location | Fix |
|-------|----------|-----|
| No file size validation | `UploadArea.tsx` | Add 10MB limit check |
| No style image limit | `App.tsx:88-97` | Limit to 3-5 images |
| Style images not validated | `geminiService.ts:203` | Add `validateImageContent()` |
| No generation timeout | `geminiService.ts` | Add 30-second AbortController |
| Image validation fails open | `geminiService.ts:149` | Fail closed instead |

### 11. Results Page Fixes
- [ ] Separate Save (private) from Publish (share) actions
- [ ] Add defensive null checks throughout
- [ ] Complete affiliate links integration
- [ ] Implement edit mode trigger button (or remove dead code)
- [ ] Add error boundary
- [ ] Fix `ensureSaved()` confirmation timing

### 12. Mobile Responsiveness
- [ ] Test all charts on 375px width
- [ ] Add touch gesture support to before/after slider
- [ ] Optimize wizard step display for small screens
- [ ] Use bottom sheets for modals on mobile
- [ ] Add mobile-specific navigation option

---

## LOW PRIORITY - Nice to Have

### 13. Phase 2 Features (PRD Section 3.5)
- [ ] Designer reviews and ratings system
- [ ] Enhanced search and filtering for designers
- [ ] Saved style preferences per user
- [ ] Design collaboration tools

### 14. Phase 3 Features (PRD Section 3.6)
- [ ] Progressive Web App (PWA)
- [ ] Mobile-optimized camera capture
- [ ] Push notifications

### 15. Performance Optimizations
- [ ] Implement pagination/virtualization for gallery
- [ ] Add image caching before API upload
- [ ] Ensure Firestore composite indexes exist
- [ ] Implement request deduplication cache
- [ ] Profile actual page load times

### 16. Code Quality
- [ ] Replace `any` types with proper TypeScript types
- [ ] Extract magic strings to `constants.ts`
- [ ] Remove unused imports
- [ ] Add consistent error handling strategy
- [ ] Document circular dependency management

---

## Feature Completion Status

| Feature | Status | Quality |
|---------|--------|---------|
| Auth (Email/Google) | ✅ Working | 7/10 |
| Design Wizard | ✅ Working | 7/10 |
| Image Generation | ✅ Working | 8/10 |
| Cost Estimation | ⚠️ Partial | 5/10 |
| Results Display | ✅ Working | 7/10 |
| Sharing/URLs | ✅ Working | 7/10 |
| Video Generation | ❌ Broken | 2/10 |
| Community Gallery | ⚠️ Partial | 6/10 |
| Designer Profiles | ⚠️ Partial | 4/10 |
| Business Dashboard | ⚠️ Mock Only | 4/10 |
| Admin Dashboard | ⚠️ Basic | 5/10 |
| Credits System | ⚠️ Insecure | 6/10 |
| Stripe Integration | ⚠️ Incomplete | 5/10 |
| Mobile UI | ❌ Not Ready | 3/10 |
| Error Handling | ❌ Minimal | 3/10 |
| Security | ❌ Vulnerable | 4/10 |

---

## Quick Wins (< 1 hour each)

1. Remove hardcoded test email from `BusinessDashboard.tsx:49`
2. Add file size validation to `UploadArea.tsx`
3. Fix CORS in `stripe_checkout_api.py` (change `*` to specific domain)
4. Add explicit admin check in `App.tsx` before admin route
5. Add email format validation to designer forms
6. Add loading states for all async buttons

---

## Recommended Sprint Plan

### Sprint 1: Security & Auth
- Fix anonymous credit exploit
- Add email verification
- Add password reset
- Complete Stripe webhook with verification
- Restrict CORS

### Sprint 2: Core Features
- Fix video generation or disable feature
- Implement RAG enhancement
- Add location-based pricing
- Complete subscription management

### Sprint 3: Business Features
- Complete designer verification workflow
- Implement real lead messaging
- Add designer search/discovery
- Add review/rating system

### Sprint 4: Polish
- Gallery filters and pagination
- Mobile responsiveness
- Error handling improvements
- Admin dashboard enhancements
