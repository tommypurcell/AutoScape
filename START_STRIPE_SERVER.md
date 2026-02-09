# Starting the Stripe Checkout API Server

The Stripe checkout API server needs to be running for payment processing to work.

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install stripe fastapi uvicorn python-dotenv
   ```

2. **Set up environment variables in `.env`:**
   ```env
   STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
   STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook secret (optional for testing)
   VITE_STRIPE_PRICE_ID_WEEKLY=price_...  # Must start with "price_"
   VITE_STRIPE_PRICE_ID_MONTHLY=price_...  # Must start with "price_"
   VITE_STRIPE_PRICE_ID_ANNUAL=price_...  # Must start with "price_"
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start the server:**
   ```bash
   python servers/stripe_checkout_api.py
   ```
   
   The server will start on `http://localhost:8003`

## Important Notes

- **Price IDs vs Product IDs**: Make sure your environment variables use **Price IDs** (start with `price_`), not Product IDs (start with `prod_`)
- The server must be running before users can purchase plans
- For production, deploy this API to a cloud service (Cloud Run, Heroku, etc.)

## Testing

Once the server is running, you can test it:
```bash
curl http://localhost:8003/health
```

You should see:
```json
{"status":"healthy","service":"stripe-checkout-api","stripe_configured":true}
```
