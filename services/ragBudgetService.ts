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

export async function calculateRAGBudget(designImageBase64: string): Promise<Budget | null> {
    try {
        // Convert base64 to blob
        const blob = await fetch(`data:image/png;base64,${designImageBase64}`).then(r => r.blob());

        const formData = new FormData();
        formData.append('design_image', blob, 'design.png');

        const response = await fetch('http://localhost:8002/api/freepik/analyze-and-budget', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            console.error('RAG budget API failed:', response.statusText);
            return null;
        }

        const data = await response.json();
        return data.budget;
    } catch (error) {
        console.error('Failed to calculate RAG budget:', error);
        return null;
    }
}
