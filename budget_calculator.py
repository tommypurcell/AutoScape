"""
Budget Calculator for Landscaping Projects.
Estimates costs based on a list of plants/materials and pricing data.
"""

import re
from typing import List, Dict, Any
from pricing_data import PRICING_DATABASE

def parse_price_range(price_str: str) -> tuple[float, float]:
    """Extract low and high price from string like '$10 - $20'."""
    # Remove '$' and ',' and split
    clean_str = price_str.replace('$', '').replace(',', '')
    parts = clean_str.split('-')
    
    if len(parts) == 2:
        try:
            low = float(parts[0].strip())
            high = float(parts[1].strip())
            return low, high
        except ValueError:
            pass
    elif len(parts) == 1:
        # Handle "$800+" or single price
        try:
            val = float(re.sub(r'[^\d.]', '', parts[0]))
            return val, val
        except ValueError:
            pass
            
    return 0.0, 0.0

def calculate_budget(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate estimated budget for a list of items.
    
    Args:
        items: List of dicts with 'name', 'category', 'size', 'quantity'
        
    Returns:
        Dict with total_low, total_high, and itemized breakdown
    """
    total_low = 0.0
    total_high = 0.0
    breakdown = []
    
    for item in items:
        name = item.get('name', 'Unknown Item')
        category = item.get('category', 'plant').lower()
        size = item.get('size', '1-gallon')
        quantity = item.get('quantity', 1)
        
        # Find price in database
        price_range_str = "$0 - $0"
        
        # Try to find category match
        found_category = None
        for db_cat in PRICING_DATABASE:
            if db_cat in category or db_cat in name.lower():
                found_category = db_cat
                break
        
        if found_category:
            # Try to find size match
            size_prices = PRICING_DATABASE[found_category]
            # Simple fuzzy match for size
            found_size = None
            for db_size in size_prices:
                if db_size in size:
                    found_size = db_size
                    break
            
            if not found_size:
                # Default to first available size if no match
                found_size = list(size_prices.keys())[0]
                
            price_range_str = size_prices[found_size]
        
        # Parse price
        low, high = parse_price_range(price_range_str)
        
        item_total_low = low * quantity
        item_total_high = high * quantity
        
        total_low += item_total_low
        total_high += item_total_high
        
        breakdown.append({
            "item": name,
            "quantity": quantity,
            "unit_price": price_range_str,
            "total_estimate": f"${item_total_low:,.2f} - ${item_total_high:,.2f}"
        })
        
    return {
        "total_low": total_low,
        "total_high": total_high,
        "breakdown": breakdown
    }

if __name__ == "__main__":
    # Test
    test_items = [
        {"name": "Japanese Maple", "category": "tree", "size": "15-gallon", "quantity": 2},
        {"name": "Lavender", "category": "shrub", "size": "1-gallon", "quantity": 10},
        {"name": "Pea Gravel", "category": "gravel", "size": "pea gravel", "quantity": 5} # 5 cubic yards
    ]
    
    result = calculate_budget(test_items)
    
    print(f"Budget Estimate: ${result['total_low']:,.2f} - ${result['total_high']:,.2f}")
    for item in result['breakdown']:
        print(f"- {item['quantity']}x {item['item']}: {item['total_estimate']}")
