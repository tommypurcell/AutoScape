#!/usr/bin/env python3
"""
Stripe Checkout API - FastAPI Backend
======================================
REST API for creating Stripe Checkout sessions for AutoScape subscriptions.

Endpoints:
- POST /api/create-checkout-session - Create a Stripe Checkout session
- POST /api/webhook - Handle Stripe webhooks (for payment confirmation)

Usage:
    python servers/stripe_checkout_api.py
    
Then access at: http://localhost:8003
"""

import os
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import stripe

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Stripe Checkout API",
    description="API for creating Stripe Checkout sessions and handling webhooks",
    version="1.0.0",
)

# In-memory idempotency set to prevent double-crediting from webhook retries
# In production, replace with Redis or a database table
processed_event_ids: set[str] = set()

# Allowed origins for CORS
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:5173",
    "https://autoscape2-9f048.web.app",
    "https://autoscape2-9f048.firebaseapp.com",
    # Add your production domain here
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Stripe-Signature"],
)

# Initialize Stripe
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
if not STRIPE_SECRET_KEY:
    logger.warning("STRIPE_SECRET_KEY not found in environment variables")
else:
    stripe.api_key = STRIPE_SECRET_KEY

# Price IDs from environment
PRICE_IDS = {
    "weekly": os.getenv("VITE_STRIPE_PRICE_ID_WEEKLY"),
    "monthly": os.getenv("VITE_STRIPE_PRICE_ID_MONTHLY"),
    "annual": os.getenv("VITE_STRIPE_PRICE_ID_ANNUAL"),
}

# Request/Response models
class CheckoutSessionRequest(BaseModel):
    userId: str
    priceId: str
    planType: str  # "weekly", "monthly", or "annual"
    credits: int

class CheckoutSessionResponse(BaseModel):
    sessionId: str
    url: str

class PortalSessionRequest(BaseModel):
    customerId: str

class PortalSessionResponse(BaseModel):
    url: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "stripe-checkout-api",
        "stripe_configured": STRIPE_SECRET_KEY is not None
    }

@app.post("/api/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(request: CheckoutSessionRequest):
    """
    Create a Stripe Checkout session for subscription purchase
    
    Args:
        request: CheckoutSessionRequest with userId, priceId, planType, and credits
        
    Returns:
        CheckoutSessionResponse with sessionId and checkout URL
    """
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured. Missing STRIPE_SECRET_KEY.")
    
    try:
        # Validate priceId matches one of our configured prices
        if request.priceId not in PRICE_IDS.values():
            logger.warning(f"Invalid priceId: {request.priceId}")
            raise HTTPException(status_code=400, detail="Invalid price ID")
        
        # Get the base URL from environment or use default
        base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        success_url = f"{base_url}/pricing?success=true&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{base_url}/pricing?canceled=true"
        
        # Create Stripe Checkout session
        # All plans (weekly, monthly, annual) are subscriptions
        # Annual is a recurring subscription billed yearly
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': request.priceId,
                'quantity': 1,
            }],
            mode='subscription',  # All plans are subscriptions (annual is yearly recurring)
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=request.userId,  # Store userId for webhook processing
            metadata={
                'userId': request.userId,
                'planType': request.planType,
                'credits': str(request.credits),
            },
            allow_promotion_codes=True,
        )
        
        logger.info(f"Created checkout session {session.id} for user {request.userId}, plan: {request.planType}")
        
        return CheckoutSessionResponse(
            sessionId=session.id,
            url=session.url
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


def _add_credits_to_firestore(userId: str, credits: int) -> None:
    """Helper to add credits to a user account via Firestore."""
    from firebase_admin import firestore, initialize_app, credentials
    import firebase_admin

    if not firebase_admin._apps:
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            initialize_app(cred)
        else:
            initialize_app()

    db = firestore.client()
    user_credits_ref = db.collection('userCredits').document(userId)

    user_credits_doc = user_credits_ref.get()
    if user_credits_doc.exists:
        current_data = user_credits_doc.to_dict()
        current_credits = current_data.get('credits', 0)
        total_purchased = current_data.get('totalCreditsPurchased', 0)

        user_credits_ref.update({
            'credits': current_credits + credits,
            'totalCreditsPurchased': total_purchased + credits,
            'lastUpdated': firestore.SERVER_TIMESTAMP,
        })
        logger.info(f"✅ Added {credits} credits to user {userId}. New total: {current_credits + credits}")
    else:
        user_credits_ref.set({
            'credits': credits,
            'freeCreditsUsed': 0,
            'totalCreditsPurchased': credits,
            'lastUpdated': firestore.SERVER_TIMESTAMP,
        })
        logger.info(f"✅ Initialized user {userId} with {credits} credits")


@app.post("/api/create-portal-session", response_model=PortalSessionResponse)
async def create_portal_session(request: PortalSessionRequest):
    """
    Create a Stripe Customer Portal session for subscription management.
    Allows users to update payment methods, cancel subscriptions, etc.
    """
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    try:
        base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        session = stripe.billing_portal.Session.create(
            customer=request.customerId,
            return_url=f"{base_url}/pricing",
        )
        logger.info(f"Created portal session for customer {request.customerId}")
        return PortalSessionResponse(url=session.url)
    except stripe.error.StripeError as e:
        logger.error(f"Stripe portal error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating portal session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/webhook")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    """
    Handle Stripe webhook events
    
    This endpoint should be called by Stripe when payment events occur.
    Configure the webhook URL in Stripe Dashboard to point to this endpoint.
    """
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")
    
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        logger.warning("STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    try:
        payload = await request.body()
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, webhook_secret
        )
        
        # Handle the event
        event_id = event.get('id', '')

        # Idempotency check: skip if we've already processed this event
        if event_id in processed_event_ids:
            logger.info(f"Skipping already-processed event: {event_id}")
            return {"status": "already_processed"}

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            userId = session.get('client_reference_id') or session.get('metadata', {}).get('userId')
            planType = session.get('metadata', {}).get('planType')
            credits = int(session.get('metadata', {}).get('credits', 0))
            
            logger.info(f"Payment successful for user {userId}, plan: {planType}, credits: {credits}")
            
            # Add credits to user account via Firestore
            try:
                _add_credits_to_firestore(userId, credits)
            except ImportError:
                logger.warning("firebase-admin not installed. Install with: pip install firebase-admin")
                logger.info(f"TODO: Add {credits} credits to user {userId} via Firestore")
            except Exception as e:
                logger.error(f"Error adding credits to Firestore: {str(e)}")
                # Don't fail the webhook - log error for manual processing

        elif event['type'] == 'payment_intent.succeeded':
            # Handle direct payment intent success (covers cases where checkout.session.completed
            # might be missed, or for non-checkout payments)
            payment_intent = event['data']['object']
            metadata = payment_intent.get('metadata', {})
            userId = metadata.get('userId')
            credits = int(metadata.get('credits', 0))

            if userId and credits > 0:
                logger.info(f"payment_intent.succeeded for user {userId}, credits: {credits}")
                try:
                    _add_credits_to_firestore(userId, credits)
                except Exception as e:
                    logger.error(f"Error adding credits from payment_intent: {str(e)}")
            else:
                logger.info(f"payment_intent.succeeded without userId/credits metadata, skipping credit grant")

        elif event['type'] == 'invoice.payment_succeeded':
            # Handle recurring subscription payments (renewal)
            invoice = event['data']['object']
            subscription_id = invoice.get('subscription')
            customer_id = invoice.get('customer')

            if subscription_id:
                try:
                    subscription = stripe.Subscription.retrieve(subscription_id)
                    userId = subscription.get('metadata', {}).get('userId')
                    credits = int(subscription.get('metadata', {}).get('credits', 0))

                    if userId and credits > 0:
                        logger.info(f"Subscription renewal for user {userId}, credits: {credits}")
                        _add_credits_to_firestore(userId, credits)
                except Exception as e:
                    logger.error(f"Error processing subscription renewal: {str(e)}")
            
        elif event['type'] == 'customer.subscription.deleted':
            # Handle subscription cancellation
            subscription = event['data']['object']
            logger.info(f"Subscription canceled: {subscription.id}")
            
        else:
            logger.info(f"Unhandled event type: {event['type']}")

        # Mark event as processed for idempotency
        processed_event_ids.add(event_id)
        # Keep set from growing unbounded in long-running server
        if len(processed_event_ids) > 10000:
            processed_event_ids.clear()
        return {"status": "success"}
        
    except ValueError as e:
        logger.error(f"Invalid payload: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Webhook error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8003))
    uvicorn.run(app, host="0.0.0.0", port=port)
