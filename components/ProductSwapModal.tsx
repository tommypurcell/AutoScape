import React, { useState, useEffect } from 'react';

interface ProductSwapModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentItemName: string;
    onSelect: (item: any) => void;
}

interface SearchResult {
    id: string;
    title: string;
    image_url: string;
    price_estimate?: string;
    specific_name?: string;
}

export const ProductSwapModal: React.FC<ProductSwapModalProps> = ({
    isOpen,
    onClose,
    currentItemName,
    onSelect,
}) => {
    const [searchQuery, setSearchQuery] = useState(currentItemName);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery(currentItemName);
            handleSearch(currentItemName);
        }
    }, [isOpen, currentItemName]);

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8002/api/freepik/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    top_k: 12
                }),
            });

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            setResults(data.results);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Swap Component</h3>
                        <p className="text-sm text-slate-500">Find a replacement for "{currentItemName}"</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-6 border-b border-slate-100">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}
                        className="relative"
                    >
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for products..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                        <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
                            <p>Searching catalog...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {results.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => onSelect(item)}
                                    className="group bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-emerald-500 transition-all hover:-translate-y-1"
                                >
                                    <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        {item.price_estimate && (
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-full text-xs font-bold">
                                                {item.price_estimate}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-medium text-slate-800 text-sm line-clamp-2 mb-1 group-hover:text-emerald-600 transition-colors">
                                            {item.specific_name || item.title}
                                        </h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <p>No results found for "{searchQuery}"</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
