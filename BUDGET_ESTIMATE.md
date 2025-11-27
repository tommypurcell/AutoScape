# Freepik Landscaping RAG - Budget Estimate

Estimated costs for running the Freepik Landscaping RAG system with ~5,000 images.

## 1. Initial Setup (Data Ingestion)

Cost to ingest 5,000 images one time.

| Component | Item | Unit Cost | Quantity | Total |
|-----------|------|-----------|----------|-------|
| **Freepik API** | Image Metadata | Included in plan | 5,000 req | $0.00 |
| **Freepik API** | Image Download | Varies (Free/Sub) | 5,000 imgs | $0 - $15* |
| **Qdrant** | Vector Storage | Free Tier (1GB) | ~15MB | $0.00 |
| **Compute** | Embedding Gen | Local CPU/GPU | 5,000 imgs | $0.00 |
| **Total** | | | | **$0 - $15** |

*\*Freepik pricing depends on your plan. API usage is often included in subscriptions or has a free tier. If using a paid plan, 5000 images might consume credits.*

## 2. Ongoing Monthly Costs (Running the App)

Estimated for moderate usage (e.g., 1,000 searches/month).

| Component | Item | Pricing Model | Est. Usage | Est. Cost |
|-----------|------|---------------|------------|-----------|
| **Qdrant Cloud** | Vector DB | Free Tier (1GB) | 5,000 vectors | **$0.00** |
| **Google Gemini** | AI Recommendations | Free Tier / Pay-as-you-go | 1,000 queries | **$0.00*** |
| **Freepik API** | Search/Updates | Usage based | Low volume | **$0.00** |
| **Hosting** | API Server | Self-hosted / Cloud Run | 1 instance | **$0 - $10** |
| **Total** | | | | **$0 - $10/mo** |

*\*Gemini Flash has a generous free tier. Paid usage is very low cost ($0.10/1M tokens).*

## 3. Scaling Costs (If growing to 100k+ images)

| Component | Threshold | Cost Impact |
|-----------|-----------|-------------|
| **Qdrant** | > 1GB Storage | ~$25/mo for Managed Cloud |
| **Gemini** | High Volume | Pay-as-you-go rates apply |
| **Freepik** | High Volume | Enterprise API plan may be needed |

## Summary

- **Immediate Cost**: Likely **$0** if using existing subscriptions/free tiers.
- **Monthly Cost**: **$0 - $10** for hosting and API usage.
- **Main Variable**: Freepik API limits/credits depending on your specific plan.
