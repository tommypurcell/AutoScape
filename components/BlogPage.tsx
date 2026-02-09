import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogArticles } from './BlogArticle';

export const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 12;

  const articles = Object.values(blogArticles).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Pagination
  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const paginatedArticles = articles.slice(startIndex, startIndex + articlesPerPage);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-emerald-700 to-teal-800 overflow-hidden">
        {/* Abstract shape */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-3">
            <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wider rounded-full">
              BLOG - CATEGORY
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-emerald-100 mb-3 leading-tight">
            AI Design
          </h1>
          <p className="text-base md:text-lg text-white/90 max-w-2xl leading-relaxed">
            Exploring the intersection of artificial intelligence and landscape architecture. From generative masterplans to sustainable site analysis.
          </p>
        </div>
      </div>

      {/* Articles Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sort Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Showing {articles.length} articles in</span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
              AI Design
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">SORT BY</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular' | 'trending')}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              <option value="latest">Latest</option>
              <option value="popular">Popular</option>
              <option value="trending">Trending</option>
            </select>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {paginatedArticles.map((article, index) => (
            <article
              key={article.slug}
              onClick={() => navigate(`/blog/${article.slug}`)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
            >
              {/* Article Image Placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-teal-100 overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/0 transition-colors"></div>
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wide rounded-full">
                    AI Design
                  </span>
                </div>
                {article.date && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium rounded-full">
                      {article.date}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors leading-tight line-clamp-2">
                  {article.title}
                </h2>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed line-clamp-2">
                  {article.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {article.readTime}
                    </span>
                  </div>
                  <button className="text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1.5 text-sm group-hover:gap-2 transition-all">
                    {index === 0 ? 'Read Article' : 'Details'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-600 text-lg">No articles yet. Check back soon!</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="text-slate-400 px-2">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
