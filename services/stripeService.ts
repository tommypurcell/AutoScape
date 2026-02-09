// stripeService.ts
// Service for Stripe payment integration

import { API_ENDPOINTS } from '../config/api';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

export interface PricingTier {
  name: string;
  price: string;
  priceId: string; // Stripe Price ID
  credits: number;
}

// Stripe Price IDs from environment variables
export const STRIPE_PRICE_IDS: Record<string, string> = {
  weekly: import.meta.env.VITE_STRIPE_PRICE_ID_WEEKLY || '',
  monthly: import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY || '',
  annual: import.meta.env.VITE_STRIPE_PRICE_ID_ANNUAL || '',
};

/**
 * Initialize Stripe (client-side)
 * Note: Not needed for Stripe Checkout redirect flow, but kept for potential future use
 */
export const initializeStripe = async () => {
  // For Stripe Checkout (redirect-based), we don't need the client-side library
  // The backend creates the session and returns a URL, we just redirect
  return null;
};

/**
 * Create a Stripe Checkout session
 * Calls the backend API to create a checkout session
 */
export const createCheckoutSession = async (
  userId: string,
  priceId: string,
  planType: 'weekly' | 'monthly' | 'annual',
  credits: number
): Promise<{ sessionId: string; url: string }> => {
  try {
    // Validate priceId format (should start with "price_")
    if (!priceId.startsWith('price_')) {
      console.warn(`Warning: Price ID "${priceId}" doesn't start with "price_". Make sure you're using a Stripe Price ID, not a Product ID.`);
    }

    const response = await fetch(API_ENDPOINTS.createCheckoutSession, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        priceId,
        planType,
        credits,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      sessionId: data.sessionId,
      url: data.url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Provide helpful error messages
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Cannot connect to payment server. Please make sure the Stripe checkout API is running on port 8003.\n\n' +
        'To start it, run: python servers/stripe_checkout_api.py'
      );
    }
    
    throw error;
  }
};

/**
 * Redirect to Stripe Checkout
 * Uses the checkout URL from the session
 */
export const redirectToCheckout = async (checkoutUrl: string) => {
  if (!checkoutUrl) {
    throw new Error('Checkout URL is required');
  }
  
  // Redirect to Stripe Checkout
  window.location.href = checkoutUrl;
};

/**
 * Handle successful payment (called from webhook or redirect)
 */
export const handlePaymentSuccess = async (userId: string, credits: number) => {
  // This should be called from your backend webhook
  // For now, this is a placeholder
  console.log('Payment successful:', { userId, credits });
  // The backend should call addCredits after verifying the payment
};
