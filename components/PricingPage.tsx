import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PricingTier {
  name: string;
  price: string;
  credits: number;
  pricePerCredit: string;
  effectiveMonthly?: string;
  description: string;
  features: string[];
  highlight?: boolean;
  cta: string;
  badge?: string;
}

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [showInsufficientCreditsMessage, setShowInsufficientCreditsMessage] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);

  useEffect(() => {
    // Check if redirected due to insufficient credits
    const message = searchParams.get('message');
    if (message === 'insufficient_credits') {
      setShowInsufficientCreditsMessage(true);
    }

    // Check for payment success or cancellation
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      alert('✅ Payment successful! Your credits have been added to your account.');
      // Refresh credits display
      window.dispatchEvent(new CustomEvent('creditsUpdated'));
      // Remove query params
      navigate('/pricing', { replace: true });
    } else if (canceled === 'true') {
      // User canceled - no action needed, just remove query params
      navigate('/pricing', { replace: true });
    }

    // Load user credits if logged in
    const loadCredits = async () => {
      if (user) {
        try {
          const { getUserCredits } = await import('../services/creditService');
          const credits = await getUserCredits(user.uid);
          setUserCredits(credits.credits);
        } catch (error) {
          console.error('Error loading credits:', error);
        }
      } else {
        // For anonymous users, check localStorage
        const anonymousCreditsUsed = parseInt(localStorage.getItem('anonymousCreditsUsed') || '0');
        setUserCredits(2 - anonymousCreditsUsed); // 2 free credits minus used
      }
    };

    loadCredits();
  }, [user, searchParams]);

  const tiers: PricingTier[] = [
    {
      name: 'Weekly',
      price: '$3.99',
      credits: 5,
      pricePerCredit: '$0.80',
      description: 'Try AutoScape without commitment',
      features: [
        '5 design credits',
        'Full access to all features',
        'Cancel anytime',
        'Perfect for trying out'
      ],
      cta: 'Start Trial',
      badge: 'TRIAL TIER'
    },
    {
      name: 'Monthly',
      price: '$24',
      credits: 40,
      pricePerCredit: '$0.60',
      description: 'Where most users should land',
      features: [
        '40 design credits',
        'Full access to all features',
        'Best value for regular users',
        'Cancel anytime'
      ],
      cta: 'Get Started',
      highlight: true,
      badge: 'MOST POPULAR'
    },
    {
      name: 'Annual',
      price: '$119',
      credits: 360,
      pricePerCredit: '$0.33',
      effectiveMonthly: '$9.92/month effective',
      description: 'Save ~60% vs monthly',
      features: [
        '360 design credits',
        'Full access to all features',
        'Priority support included',
        'Lock in your rate'
      ],
      cta: 'Select Plan',
      badge: 'BEST VALUE'
    }
  ];

  const handleSelectPlan = async (tier: PricingTier) => {
    if (!user) {
      // User needs to sign up first
      navigate('/');
      // Trigger auth modal - you might need to pass this through context or state
      return;
    }

    try {
      // Import Stripe service
      const { createCheckoutSession, redirectToCheckout, STRIPE_PRICE_IDS } = await import('../services/stripeService');
      
      // Map tier name to plan type
      const planTypeMap: Record<string, 'weekly' | 'monthly' | 'annual'> = {
        'Weekly': 'weekly',
        'Monthly': 'monthly',
        'Annual': 'annual',
      };
      
      const planType = planTypeMap[tier.name];
      if (!planType) {
        throw new Error(`Unknown plan type: ${tier.name}`);
      }
      
      // Get price ID for this plan
      const priceId = STRIPE_PRICE_IDS[planType];
      if (!priceId) {
        throw new Error(`Price ID not configured for ${planType} plan. Please check your environment variables.`);
      }
      
      console.log(`Creating checkout session for ${tier.name} plan (${planType}), priceId: ${priceId}, credits: ${tier.credits}`);
      
      // Create checkout session
      const { url } = await createCheckoutSession(
        user.uid,
        priceId,
        planType,
        tier.credits
      );
      
      // Redirect to Stripe Checkout
      redirectToCheckout(url);
      
    } catch (error) {
      console.error('Error initiating checkout:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to start checkout. Please try again.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Insufficient Credits Message */}
        {showInsufficientCreditsMessage && (
          <div className="mb-8 max-w-3xl mx-auto">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-lg shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-900 mb-2">
                    You've used all your free credits
                  </h3>
                  <p className="text-amber-800 mb-3">
                    {userCredits !== null && userCredits > 0 ? (
                      <>You have <strong>{userCredits} credit{userCredits !== 1 ? 's' : ''}</strong> remaining.</>
                    ) : (
                      <>You've used your 2 free credits. To continue creating designs, please choose a plan below.</>
                    )}
                  </p>
                  <p className="text-sm text-amber-700">
                    Select a plan to get more credits and continue using AutoScape's AI-powered design tools.
                  </p>
                </div>
                <button
                  onClick={() => setShowInsufficientCreditsMessage(false)}
                  className="flex-shrink-0 text-amber-600 hover:text-amber-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Flexible plans for every creator
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Choose the perfect plan to automate your design workflow. All plans include 24/7 support and access to our basic tools.
          </p>
          {userCredits !== null && userCredits > 0 && (
            <p className="mt-4 text-sm text-emerald-600 font-medium">
              You have {userCredits} free credit{userCredits !== 1 ? 's' : ''} remaining
            </p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-300 flex flex-col ${
                tier.highlight
                  ? 'border-emerald-500 shadow-lg'
                  : 'border-slate-200'
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                    tier.highlight
                      ? 'bg-emerald-500 text-white'
                      : tier.name === 'Annual'
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tier.badge}
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Tier Name */}
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{tier.name}</h3>
                
                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold ${
                      tier.highlight ? 'text-emerald-500' : 'text-slate-900'
                    }`}>
                      {tier.price}
                    </span>
                    {tier.name === 'Annual' && (
                      <span className="text-sm text-slate-500 font-normal">/year</span>
                    )}
                    {tier.name === 'Monthly' && (
                      <span className="text-sm text-slate-500 font-normal">/month</span>
                    )}
                    {tier.name === 'Weekly' && (
                      <span className="text-sm text-slate-500 font-normal">/week</span>
                    )}
                  </div>
                  {tier.effectiveMonthly && (
                    <div className="text-sm text-emerald-600 font-bold mt-1">
                      {tier.effectiveMonthly}
                    </div>
                  )}
                </div>

                {/* Credits & Price Per Credit */}
                <div className="mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm">{tier.credits} credits</span>
                    <span className="text-sm text-slate-500">{tier.pricePerCredit} / credit</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-600 mb-4 text-sm italic">{tier.description}</p>

                {/* Features - flex-1 to push button down */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <svg
                        className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button - aligned at bottom */}
                <button
                  onClick={() => handleSelectPlan(tier)}
                  className={`w-full py-3 rounded-lg font-semibold text-base transition-all transform active:scale-[0.98] mt-auto ${
                    tier.highlight
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-slate-500 text-sm">
            All prices are in USD. Custom enterprise plans available for large teams.{' '}
            <a href="mailto:sales@autoscape.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Contact Sales
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
