import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface BlogArticleData {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string;
  readTime: string;
  image?: string;
  content: React.ReactNode;
}

// Blog articles data
const blogArticles: Record<string, BlogArticleData> = {
  'from-concept-to-construction-why-designs-get-stripped-down': {
    slug: 'from-concept-to-construction-why-designs-get-stripped-down',
    title: 'From Concept to Construction: Why Designs Get Stripped Down (and When It\'s the Designer\'s Fault)',
    description: 'A deep dive into why landscape architecture designs get value-engineered, and when the blame falls on designers who prioritize aesthetics over constructibility.',
    author: 'AutoScape Editorial',
    date: 'January 15, 2025',
    readTime: '8 min read',
    content: (
      <div className="prose prose-lg max-w-none">
        <p className="lead text-xl text-slate-600 mb-8">
          If you've ever worked in landscape architecture, architecture, or construction, you already know this arc by heart: bold concept, polite client meeting, painful working drawings, and a final built project that barely resembles the original vision. A widely shared Reddit post in r/LandscapeArchitecture captured this perfectly—and the comments cut deeper than the meme.
        </p>

        <p className="mb-6">
          This isn't just about clients being cheap or contractors being villains. The uncomfortable truth is that a lot of design degradation is earned.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          The Meme Is Funny. The Reality Is Less Forgiving.
        </h2>

        <p className="mb-6">
          The image shows four stages: concept sketch, after meeting with the client, after working drawings, and after construction. Each step removes complexity, greenery, and ambition. People laugh because it's familiar. But familiarity doesn't mean inevitability.
        </p>

        <p className="mb-6">
          A former landscape architect turned construction manager weighed in with real-world examples that explain <em>why</em> designs get value-engineered into oblivion.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          Case 1: The Green Roof That Never Should Have Been Designed
        </h2>

        <p className="mb-6">
          On a Caribbean project with 180 mph design wind speeds, a high-profile LA firm proposed an extensive green roof. Sounds great—until you read the standards. The relevant wind design guidelines explicitly don't apply at those speeds. FM Global guidance outright discourages green roofs above 100 mph zones. Even the owner's internal feasibility score flagged it as a bad idea.
        </p>

        <p className="mb-6">
          This wasn't a gray area. It was basic due diligence that took half a day to research—after months of design work had already happened. That's not "creative ambition." That's negligence.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          Case 2: Oversized Trees, Undersized Thinking
        </h2>

        <p className="mb-6">
          Another project specified large-caliper deciduous trees (4–8 inches) in a country where sourcing, installing, and maintaining them was unrealistic. High mortality rates were predictable. Research shows smaller trees often outperform larger ones long-term due to transplant shock recovery. The result? Higher cost, higher failure risk, and zero real benefit—except better renderings.
        </p>

        <p className="mb-6">
          Again, this wasn't about budget cuts. It was about designers optimizing for images instead of outcomes.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          The Core Problem: Confusing Creativity With Good Design
        </h2>

        <p className="mb-6">
          Big-name firms are excellent at producing visually striking concepts. But good design isn't just about wow-factor. It's about constructibility, maintainability, safety, climate, codes, logistics, and—yes—budget. If a design can't survive contact with reality, it wasn't good design to begin with.
        </p>

        <p className="mb-6">
          That's why so many projects get "butchered" late in the process. The design never had structural integrity as an idea.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          Why This Keeps Happening
        </h2>

        <p className="mb-6">
          School rewards conceptual purity. Marketing rewards drama. Awards reward novelty. None of those reward asking boring questions early—like "Should this even be built here?" or "Who maintains this in five years?" or "What happens in a hurricane?"
        </p>

        <p className="mb-6">
          When those questions are ignored, the reckoning just happens later, under worse conditions, with more resentment.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          The Uncomfortable Takeaway
        </h2>

        <p className="mb-6">
          If your design consistently dies in value engineering, zoning review, or construction, blaming everyone else is lazy. Constraints are part of the job. Working within them <em>is</em> the craft.
        </p>

        <p className="mb-6 text-xl font-semibold text-slate-800">
          Good design survives the process. Bad design looks great until someone runs the numbers.
        </p>

        <p className="mb-12">
          Laugh at the meme—but take the critique seriously.
        </p>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            <strong>Tags:</strong> Landscape Architecture, Design Process, Value Engineering, Construction Management, Design Best Practices
          </p>
        </div>
      </div>
    ),
  },
  'how-to-create-backyard-privacy-when-surrounded-by-neighbors': {
    slug: 'how-to-create-backyard-privacy-when-surrounded-by-neighbors',
    title: 'How to Create Backyard Privacy When You\'re Surrounded by Neighbors',
    description: 'Having a fenced yard doesn\'t always mean having privacy. Learn how to design privacy where you actually sit, using layered landscaping and strategic hardscape solutions.',
    author: 'AutoScape Editorial',
    date: 'January 20, 2025',
    readTime: '6 min read',
    content: (
      <div className="prose prose-lg max-w-none">
        <p className="lead text-xl text-slate-600 mb-8">
          Having a fenced yard doesn't always mean having privacy. One highly relatable post on r/landscaping came from a homeowner whose backyard is overlooked by multiple two-story houses on all sides—making it uncomfortable to relax outdoors despite having mature trees and a 6-foot fence.
        </p>

        <p className="mb-6">
          The discussion that followed highlights a key truth most people miss: privacy isn't about the fence line—it's about sightlines and enclosure.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          Why Fences and Trees Often Aren't Enough
        </h2>

        <p className="mb-6">
          In dense suburban areas, vertical sightlines matter more than horizontal boundaries. Second-story windows easily look down into yards, especially when lawns are wide and open. Even beautiful trees along the edges don't help if the main seating areas sit exposed in the middle of the yard.
        </p>

        <p className="mb-6">
          This creates a psychological issue as much as a physical one. Even partial visibility can make a space feel unusable—especially when neighbor behavior crosses from passive to hostile.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          The Core Insight: Design Privacy Where You Sit
        </h2>

        <p className="mb-6">
          The most useful advice from the thread flipped the problem entirely: stop trying to block the entire yard. Instead, create localized privacy around where you actually spend time.
        </p>

        <p className="mb-4">This can include:</p>
        <ul className="mb-6 space-y-2">
          <li>Pergolas or gazebos with slatted sides or retractable curtains</li>
          <li>Shade sails positioned to block downward views</li>
          <li>Shrubs and understory trees placed near seating areas—not just along fences</li>
          <li>Creating "outdoor rooms" instead of one large open lawn</li>
        </ul>

        <p className="mb-6">
          When your seating area feels enclosed, the rest of the yard matters far less.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          Layered Landscaping Beats Single Solutions
        </h2>

        <p className="mb-6">
          Many commenters emphasized layered planting—combining tall, narrow evergreens with mid-height shrubs and understory trees that tolerate filtered light. This approach is more flexible, often cheaper, and more effective than planting a single row of large trees.
        </p>

        <p className="mb-6">
          It also allows privacy to be achieved faster by starting with smaller, more affordable plants that establish better and grow over time.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          Hardscape Can Do the Heavy Lifting
        </h2>

        <p className="mb-6">
          When budget, shade, or time make planting difficult, structures step in. Pergolas, privacy screens, planters with integrated trellises, and even temporary fabric solutions can immediately block views and create separation.
        </p>

        <p className="mb-6">
          Importantly, these don't require changing the entire yard—just redefining how space is used.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          Emotional Context Matters
        </h2>

        <p className="mb-6">
          What made this thread stand out wasn't just design advice—it was the human side. The homeowner wasn't imagining the exposure. They described hostile neighbors, barking dogs, trash intentionally pushed into their yard, and even harassment while mowing.
        </p>

        <p className="mb-6">
          Privacy design isn't just aesthetic. Sometimes it's about reclaiming peace.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          How AutoScape Helps Solve This Earlier
        </h2>

        <p className="mb-6">
          AutoScape is built to help homeowners visualize privacy realistically before committing to expensive or slow solutions. By testing pergola placement, planting layers, and seating layouts digitally, it becomes much easier to see which sightlines actually need blocking—and which don't.
        </p>

        <p className="mb-6">
          Instead of guessing or overbuilding, you can design privacy intentionally, one zone at a time.
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
          Final Takeaway
        </h2>

        <p className="mb-6 text-xl font-semibold text-slate-800">
          If your backyard feels exposed, the instinct is to block everything. The smarter move is to block what matters. Privacy isn't about walls—it's about comfort, scale, and smart placement.
        </p>

        <p className="mb-12">
          Design the space for how you live in it, not how it looks from above.
        </p>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            <strong>Tags:</strong> Privacy Design, Backyard Landscaping, Outdoor Living, Residential Design, Landscape Planning
          </p>
        </div>
      </div>
    ),
  },
};

export const BlogArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Set SEO meta tags
  useEffect(() => {
    if (slug && blogArticles[slug]) {
      const article = blogArticles[slug];
      document.title = `${article.title} | AutoScape Blog`;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', article.description);

      // Update Open Graph tags
      const updateMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      updateMetaTag('og:title', article.title);
      updateMetaTag('og:description', article.description);
      updateMetaTag('og:type', 'article');
      updateMetaTag('og:url', `https://autoscape.online/blog/${article.slug}`);
      
      // Add canonical URL
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', `https://autoscape.online/blog/${article.slug}`);
      if (article.image) {
        updateMetaTag('og:image', article.image);
      }

      // Update Twitter Card tags
      const updateTwitterTag = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="twitter:${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', `twitter:${name}`);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      updateTwitterTag('card', 'summary_large_image');
      updateTwitterTag('title', article.title);
      updateTwitterTag('description', article.description);

      // Add structured data (JSON-LD) for SEO
      let jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (!jsonLd) {
        jsonLd = document.createElement('script');
        jsonLd.setAttribute('type', 'application/ld+json');
        document.head.appendChild(jsonLd);
      }
      
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.description,
        author: {
          '@type': 'Organization',
          name: article.author,
        },
        datePublished: article.date,
        dateModified: article.date,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://autoscape.online/blog/${article.slug}`,
        },
      };
      
      jsonLd.textContent = JSON.stringify(structuredData);
    }
  }, [slug]);

  if (!slug || !blogArticles[slug]) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Article Not Found</h1>
          <p className="text-slate-600 mb-8">The article you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/blog')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const article = blogArticles[slug];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 backdrop-blur-sm bg-white/95">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/blog')}
            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </button>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <header className="mb-12">
          <div className="mb-6">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-bold uppercase tracking-wide rounded-full">
              AI Design
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-8 leading-tight tracking-tight">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-slate-600 mb-8 pb-8 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                {article.author.charAt(0)}
              </div>
              <span className="font-medium">{article.author}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{article.readTime}</span>
            </div>
          </div>

          <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-light">
            {article.description}
          </p>
        </header>

        {/* Article Body */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-strong:font-semibold">
            {article.content}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 p-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Ready to Create Designs That Actually Get Built?
          </h3>
          <p className="text-slate-700 mb-6">
            AutoScape uses AI to help you create realistic, buildable landscape designs from day one. No more value engineering surprises.
          </p>
          <button
            onClick={() => navigate('/create')}
            className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Try AutoScape Free
          </button>
        </div>
      </article>
    </div>
  );
};

// Export for use in blog listing
export { blogArticles };
export type { BlogArticleData };
