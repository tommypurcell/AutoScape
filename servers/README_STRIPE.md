# Stripe Checkout API

This server handles Stripe payment processing for AutoScape subscriptions.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables in `.env`:**
   ```env
   STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
   STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook secret from Stripe Dashboard
   VITE_STRIPE_PRICE_ID_WEEKLY=price_...  # Stripe Price ID for weekly plan
   VITE_STRIPE_PRICE_ID_MONTHLY=price_...  # Stripe Price ID for monthly plan
   VITE_STRIPE_PRICE_ID_ANNUAL=price_...  # Stripe Price ID for annual plan
   FRONTEND_URL=http://localhost:3000  # Your frontend URL
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json  # For Firestore access
   ```

3. **Run the server:**
   ```bash
   python servers/stripe_checkout_api.py
   ```
   
   Or with uvicorn:
   ```bash
   uvicorn servers.stripe_checkout_api:app --host 0.0.0.0 --port 8003
   ```

## Endpoints

### POST `/api/create-checkout-session`
Creates a Stripe Checkout session for subscription purchase.

**Request:**
```json
{
  "userId": "user123",
  "priceId": "price_abc123",
  "planType": "monthly",
  "credits": 40
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### POST `/api/webhook`
Handles Stripe webhook events. Configure this URL in your Stripe Dashboard.

**Events handled:**
- `checkout.session.completed` - Adds credits to user account
- `customer.subscription.deleted` - Handles subscription cancellation

## Stripe Dashboard Setup

1. Create products and prices in Stripe Dashboard for:
   - Weekly plan (recurring subscription)
   - Monthly plan (recurring subscription)
   - Annual plan (one-time payment)

2. Copy the Price IDs to your `.env` file

3. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Testing

Use Stripe test mode with test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## Production

For production deployment:
1. Use production Stripe keys
2. Set `FRONTEND_URL` to your production domain
3. Configure webhook endpoint with production URL
4. Ensure Firebase Admin SDK is configured with service account
