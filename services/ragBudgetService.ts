// Service to calculate RAG-based budget from generated design image

interface BudgetLineItem {
    item: string;
    match: string;
    price_estimate: string;
    cost: number;
    image_url?: string;
}

interface Budget {
    total_min_budget: number;
    currency: string;
    line_items: BudgetLineItem[];
}

const BUDGET_API_BASE =
    import.meta.env.VITE_BUDGET_API_BASE_URL ||
    process.env.BUDGET_API_BASE_URL ||
    "http://localhost:8002";

export async function calculateRAGBudget(designImageBase64: string): Promise<Budget | null> {
    console.warn("calculateRAGBudget is deprecated. RAG enhancement is now handled directly in the generation pipeline.");
    return null;
}
