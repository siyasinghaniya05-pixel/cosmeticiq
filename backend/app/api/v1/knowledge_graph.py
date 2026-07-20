from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

router = APIRouter(prefix="/knowledge-graph", tags=["Ingredient Knowledge Graph"])

# ── Knowledge Graph Data ────────────────────────────────────────────

INGREDIENTS: Dict[str, Dict[str, Any]] = {
    "retinol": {
        "name": "Retinol",
        "category": "active",
        "description": "Vitamin A derivative that accelerates cell turnover and boosts collagen production.",
        "benefits": ["Reduces fine lines & wrinkles", "Treats acne", "Fades hyperpigmentation", "Boosts collagen", "Improves skin texture"],
        "side_effects": ["Dryness", "Peeling", "Redness", "Sun sensitivity", "Irritation"],
        "compatible": ["hyaluronic acid", "ceramides", "niacinamide", "squalane", "centella asiatica", "peptides", "vitamin e", "panthenol", "allantoin", "zinc oxide"],
        "conflicting": ["glycolic acid", "salicylic acid", "benzoyl peroxide", "vitamin c", "aha", "bha", "alcohol denat", "witch hazel"],
        "frequency": "Nightly (build tolerance)",
        "concentration": "0.3% - 1%",
        "color": "#FF6B6B",
        "icon": "Sparkles",
    },
    "vitamin c": {
        "name": "Vitamin C",
        "category": "antioxidant",
        "description": "Powerful antioxidant that brightens, boosts collagen, and protects against free radicals.",
        "benefits": ["Brightens skin", "Boosts collagen", "Antioxidant protection", "Fades dark spots", "Reduces UV damage"],
        "side_effects": ["Stinging", "Irritation at high concentrations", "Oxidation (turns brown)"],
        "compatible": ["vitamin e", "ferulic acid", "hyaluronic acid", "niacinamide", "kojic acid", "arbutin", "green tea", "squalane", "ceramides"],
        "conflicting": ["retinol", "glycolic acid", "aha", "benzoyl peroxide"],
        "frequency": "Morning (antioxidant protection)",
        "concentration": "10% - 20%",
        "color": "#FFD93D",
        "icon": "Sun",
    },
    "niacinamide": {
        "name": "Niacinamide",
        "category": "active",
        "description": "Vitamin B3 that strengthens the skin barrier, controls oil, and reduces pores.",
        "benefits": ["Strengthens skin barrier", "Controls oil production", "Minimizes pores", "Reduces redness", "Brightens skin"],
        "side_effects": ["Mild flushing at very high concentrations (>10%)", "Rare irritation"],
        "compatible": ["hyaluronic acid", "retinol", "vitamin c", "ceramides", "peptides", "tranexamic acid", "azelaic acid", "centella asiatica"],
        "conflicting": [],
        "frequency": "Morning or Night",
        "concentration": "2% - 10%",
        "color": "#6BCB77",
        "icon": "Shield",
    },
    "hyaluronic acid": {
        "name": "Hyaluronic Acid",
        "category": "hydrating",
        "description": "Humectant that holds 1000x its weight in water for deep hydration.",
        "benefits": ["Deep hydration", "Plumps skin", "Reduces fine lines", "Improves skin texture", "Enhances product absorption"],
        "side_effects": ["Rare: Tightness if not sealed with moisturizer in dry climates"],
        "compatible": ["retinol", "vitamin c", "niacinamide", "peptides", "ceramides", "squalane", "glycolic acid", "centella asiatica", "panthenol", "vitamin e", "collagen", "allantoin"],
        "conflicting": [],
        "frequency": "Morning & Night",
        "concentration": "1% - 2%",
        "color": "#4D96FF",
        "icon": "Droplets",
    },
    "glycolic acid": {
        "name": "Glycolic Acid",
        "category": "exfoliant",
        "description": "AHA that exfoliates the skin surface for improved texture and tone.",
        "benefits": ["Exfoliates dead skin", "Improves texture", "Brightens skin", "Reduces fine lines", "Enhances product penetration"],
        "side_effects": ["Irritation", "Sun sensitivity", "Dryness", "Over-exfoliation risk"],
        "compatible": ["hyaluronic acid", "centella asiatica", "ceramides", "squalane", "panthenol"],
        "conflicting": ["retinol", "vitamin c", "aha", "retinyl palmitate", "salicylic acid"],
        "frequency": "Night (2-3x/week)",
        "concentration": "5% - 10%",
        "color": "#FF8C32",
        "icon": "FlaskConical",
    },
    "salicylic acid": {
        "name": "Salicylic Acid",
        "category": "exfoliant",
        "description": "BHA that penetrates pores to clear congestion and fight acne.",
        "benefits": ["Clears pores", "Reduces acne", "Controls oil", "Anti-inflammatory", "Prevents breakouts"],
        "side_effects": ["Dryness", "Peeling", "Irritation", "Sun sensitivity"],
        "compatible": ["hyaluronic acid", "niacinamide", "green tea", "centella asiatica"],
        "conflicting": ["retinol", "glycolic acid", "retinol", "benzoyl peroxide"],
        "frequency": "Night (1-2x/week)",
        "concentration": "0.5% - 2%",
        "color": "#E056A0",
        "icon": "Zap",
    },
    "benzoyl peroxide": {
        "name": "Benzoyl Peroxide",
        "category": "active",
        "description": "Antibacterial that kills acne-causing P. acnes bacteria.",
        "benefits": ["Kills acne bacteria", "Reduces inflammation", "Prevents breakouts", "Unclogs pores"],
        "side_effects": ["Dryness", "Bleaching of fabrics", "Redness", "Peeling", "Irritation"],
        "compatible": ["hyaluronic acid", "ceramides", "centella asiatica", "niacinamide"],
        "conflicting": ["retinol", "vitamin c", "salicylic acid"],
        "frequency": "Morning (spot treatment or short contact)",
        "concentration": "2.5% - 10%",
        "color": "#C850C0",
        "icon": "AlertTriangle",
    },
    "ceramides": {
        "name": "Ceramides",
        "category": "emollient",
        "description": "Lipids that form the skin barrier, preventing moisture loss.",
        "benefits": ["Repairs skin barrier", "Locks in moisture", "Protects against irritants", "Reduces sensitivity", "Anti-aging"],
        "side_effects": [],
        "compatible": ["hyaluronic acid", "niacinamide", "retinol", "squalane", "centella asiatica", "panthenol", "peptides", "allantoin", "vitamin e"],
        "conflicting": [],
        "frequency": "Morning & Night",
        "concentration": "1% - 5%",
        "color": "#4ECDC4",
        "icon": "ShieldCheck",
    },
    "peptides": {
        "name": "Peptides",
        "category": "active",
        "description": "Amino acid chains that signal skin to produce more collagen and elastin.",
        "benefits": ["Boosts collagen", "Firms skin", "Reduces wrinkles", "Repairs skin", "Improves elasticity"],
        "side_effects": ["Rare: Mild irritation"],
        "compatible": ["hyaluronic acid", "retinol", "niacinamide", "ceramides", "vitamin c", "vitamin e", "squalane"],
        "conflicting": ["aha", "bha"],
        "frequency": "Night",
        "concentration": "Various peptide complexes",
        "color": "#9B59B6",
        "icon": "Dna",
    },
    "centella asiatica": {
        "name": "Centella Asiatica (CICA)",
        "category": "active",
        "description": "Soothing herb that repairs skin, reduces inflammation, and boosts collagen.",
        "benefits": ["Soothes irritation", "Repairs skin barrier", "Boosts collagen", "Reduces redness", "Heals wounds"],
        "side_effects": [],
        "compatible": ["retinol", "vitamin c", "hyaluronic acid", "ceramides", "niacinamide", "panthenol", "allantoin", "salicylic acid"],
        "conflicting": [],
        "frequency": "Morning & Night",
        "concentration": "Varies (extract concentration)",
        "color": "#27AE60",
        "icon": "Leaf",
    },
    "kojic acid": {
        "name": "Kojic Acid",
        "category": "active",
        "description": "Mushroom-derived brightening agent that inhibits melanin production.",
        "benefits": ["Fades dark spots", "Brightens skin", "Evens skin tone", "Antioxidant"],
        "side_effects": ["Contact dermatitis", "Redness", "Irritation on sensitive skin"],
        "compatible": ["vitamin c", "niacinamide", "arbutin", "hyaluronic acid"],
        "conflicting": ["glycolic acid", "aha", "retinol"],
        "frequency": "Night",
        "concentration": "1% - 4%",
        "color": "#F39C12",
        "icon": "Sparkles",
    },
    "arbutin": {
        "name": "Arbutin",
        "category": "active",
        "description": "Natural brightening agent from bearberry that blocks melanin.",
        "benefits": ["Fades hyperpigmentation", "Brightens skin", "Evens tone", "Gentle alternative to hydroquinone"],
        "side_effects": ["Rare: Mild irritation"],
        "compatible": ["vitamin c", "niacinamide", "kojic acid", "hyaluronic acid"],
        "conflicting": [],
        "frequency": "Morning or Night",
        "concentration": "1% - 2%",
        "color": "#E74C3C",
        "icon": "Target",
    },
    "tranexamic acid": {
        "name": "Tranexamic Acid",
        "category": "active",
        "description": "Anti-inflammatory brightening agent effective for melasma.",
        "benefits": ["Treats melasma", "Fades dark spots", "Reduces redness", "Anti-inflammatory"],
        "side_effects": ["Mild irritation in some users"],
        "compatible": ["niacinamide", "vitamin c", "arbutin", "hyaluronic acid", "centella asiatica"],
        "conflicting": [],
        "frequency": "Morning or Night",
        "concentration": "2% - 5%",
        "color": "#1ABC9C",
        "icon": "TrendingUp",
    },
    "azelaic acid": {
        "name": "Azelaic Acid",
        "category": "active",
        "description": "Multi-tasker that fights acne, reduces redness, and brightens.",
        "benefits": ["Treats acne", "Reduces rosacea", "Brightens skin", "Anti-inflammatory", "Kills bacteria"],
        "side_effects": ["Mild stinging", "Dryness"],
        "compatible": ["niacinamide", "hyaluronic acid", "retinol", "centella asiatica"],
        "conflicting": [],
        "frequency": "Morning or Night",
        "concentration": "10% - 20%",
        "color": "#8E44AD",
        "icon": "Sparkles",
    },
    "bakuchiol": {
        "name": "Bakuchiol",
        "category": "active",
        "description": "Natural retinol alternative from babchi plant. Gentle for sensitive skin.",
        "benefits": ["Reduces wrinkles", "Improves firmness", "Treats acne", "No sun sensitivity", "Gentle"],
        "side_effects": ["Very rare irritation"],
        "compatible": ["vitamin c", "hyaluronic acid", "niacinamide", "ceramides", "centella asiatica"],
        "conflicting": ["retinol"],
        "frequency": "Morning & Night",
        "concentration": "0.5% - 1%",
        "color": "#2ECC71",
        "icon": "Leaf",
    },
    "squalane": {
        "name": "Squalane",
        "category": "emollient",
        "description": "Lightweight plant-derived oil that mimics skin's natural sebum.",
        "benefits": ["Lightweight moisture", "Non-comedogenic", "Softens skin", "Strengthens barrier", "Anti-aging"],
        "side_effects": [],
        "compatible": ["retinol", "hyaluronic acid", "vitamin c", "ceramides", "peptides", "niacinamide", "centella asiatica"],
        "conflicting": [],
        "frequency": "Morning & Night",
        "concentration": "Pure oil / in formulations",
        "color": "#3498DB",
        "icon": "Droplets",
    },
    "green tea": {
        "name": "Green Tea (EGCG)",
        "category": "antioxidant",
        "description": "Rich in EGCG polyphenols that reduce inflammation and protect against UV damage.",
        "benefits": ["Antioxidant", "Reduces inflammation", "UV protection", "Anti-aging", "Oil control"],
        "side_effects": [],
        "compatible": ["vitamin c", "retinol", "hyaluronic acid", "niacinamide", "salicylic acid"],
        "conflicting": [],
        "frequency": "Morning & Night",
        "concentration": "Varies",
        "color": "#16A085",
        "icon": "Leaf",
    },
    "vitamin e": {
        "name": "Vitamin E (Tocopherol)",
        "category": "antioxidant",
        "description": "Fat-soluble antioxidant that protects cell membranes and enhances other actives.",
        "benefits": ["Antioxidant protection", "Moisturizes", "Heals scars", "Enhances sunscreen", "Stabilizes vitamin C"],
        "side_effects": ["Rare: Contact dermatitis", "Can be comedogenic in pure form"],
        "compatible": ["vitamin c", "ferulic acid", "retinol", "hyaluronic acid", "ceramides", "peptides", "squalane"],
        "conflicting": [],
        "frequency": "Morning & Night",
        "concentration": "0.1% - 1%",
        "color": "#F1C40F",
        "icon": "Sun",
    },
    "ferulic acid": {
        "name": "Ferulic Acid",
        "category": "antioxidant",
        "description": "Plant-based antioxidant that stabilizes vitamins C and E and doubles photoprotection.",
        "benefits": ["Stabilizes vitamin C", "Boosts sunscreen", "Antioxidant", "Anti-aging", "Reduces UV damage"],
        "side_effects": [],
        "compatible": ["vitamin c", "vitamin e", "hyaluronic acid", "niacinamide"],
        "conflicting": [],
        "frequency": "Morning",
        "concentration": "0.5% - 1%",
        "color": "#D35400",
        "icon": "ShieldCheck",
    },
    "panthenol": {
        "name": "Panthenol (Vitamin B5)",
        "category": "hydrating",
        "description": "Deeply moisturizes, soothes, and promotes healing.",
        "benefits": ["Deep hydration", "Soothes irritation", "Promotes healing", "Strengthens barrier", "Softens skin"],
        "side_effects": [],
        "compatible": ["retinol", "hyaluronic acid", "ceramides", "niacinamide", "centella asiatica", "allantoin", "peptides"],
        "conflicting": [],
        "frequency": "Morning & Night",
        "concentration": "1% - 5%",
        "color": "#2980B9",
        "icon": "Heart",
    },
    "allantoin": {
        "name": "Allantoin",
        "category": "hydrating",
        "description": "Soothing compound that promotes cell regeneration and healing.",
        "benefits": ["Soothes irritation", "Promotes cell growth", "Softens skin", "Moisturizes", "Heals wounds"],
        "side_effects": [],
        "compatible": ["retinol", "hyaluronic acid", "ceramides", "panthenol", "centella asiatica", "niacinamide"],
        "conflicting": [],
        "frequency": "Morning & Night",
        "concentration": "0.1% - 2%",
        "color": "#A8E6CF",
        "icon": "Heart",
    },
    "tea tree oil": {
        "name": "Tea Tree Oil",
        "category": "active",
        "description": "Natural antibacterial and anti-inflammatory essential oil.",
        "benefits": ["Kills bacteria", "Reduces acne", "Anti-fungal", "Anti-inflammatory", "Natural alternative"],
        "side_effects": ["Contact dermatitis", "Dryness", "Irritation at high concentrations"],
        "compatible": ["hyaluronic acid", "niacinamide", "centella asiatica"],
        "conflicting": ["retinol", "aha", "glycolic acid"],
        "frequency": "Night (spot treatment)",
        "concentration": "1% - 5%",
        "color": "#00B894",
        "icon": "Droplets",
    },
}

# Build reverse lookup for relationships
NODES = list(INGREDIENTS.keys())

EDGES: List[Dict[str, Any]] = []
for ing_key, ing_data in INGREDIENTS.items():
    for comp in ing_data.get("compatible", []):
        comp_norm = comp.lower().strip()
        if comp_norm in INGREDIENTS:
            pair = tuple(sorted([ing_key, comp_norm]))
            existing = next((e for e in EDGES if e["source"] == pair[0] and e["target"] == pair[1]), None)
            if not existing:
                EDGES.append({"source": pair[0], "target": pair[1], "type": "compatible", "label": "Works Well Together"})
    for conf in ing_data.get("conflicting", []):
        conf_norm = conf.lower().strip()
        if conf_norm in INGREDIENTS:
            pair = tuple(sorted([ing_key, conf_norm]))
            existing = next((e for e in EDGES if e["source"] == pair[0] and e["target"] == pair[1]), None)
            if not existing:
                EDGES.append({"source": pair[0], "target": pair[1], "type": "conflicting", "label": "Avoid Together"})


# ── Pydantic Schemas ────────────────────────────────────────────────

class IngredientNode(BaseModel):
    id: str
    name: str
    category: str
    description: str
    color: str
    icon: str
    degree: int

class IngredientDetail(BaseModel):
    id: str
    name: str
    category: str
    description: str
    benefits: List[str]
    side_effects: List[str]
    compatible: List[str]
    conflicting: List[str]
    frequency: str
    concentration: str
    color: str
    icon: str

class GraphEdge(BaseModel):
    source: str
    target: str
    type: str
    label: str

class GraphData(BaseModel):
    nodes: List[IngredientNode]
    edges: List[GraphEdge]
    categories: Dict[str, str]
    stats: Dict[str, int]

class CategoryInfo(BaseModel):
    name: str
    count: int
    ingredients: List[str]
    color: str


# ── Endpoints ───────────────────────────────────────────────────────

@router.get("/graph", response_model=GraphData)
async def get_graph():
    category_colors = {
        "active": "#FF6B6B",
        "antioxidant": "#FFD93D",
        "hydrating": "#4D96FF",
        "exfoliant": "#FF8C32",
        "emollient": "#4ECDC4",
    }
    nodes = []
    for key, data in INGREDIENTS.items():
        degree = sum(1 for e in EDGES if e["source"] == key or e["target"] == key)
        nodes.append(IngredientNode(
            id=key, name=data["name"], category=data["category"],
            description=data["description"], color=data["color"],
            icon=data["icon"], degree=degree,
        ))
    return GraphData(
        nodes=nodes, edges=EDGES,
        categories=category_colors,
        stats={
            "total_ingredients": len(INGREDIENTS),
            "total_relationships": len(EDGES),
            "compatible_pairs": sum(1 for e in EDGES if e["type"] == "compatible"),
            "conflicting_pairs": sum(1 for e in EDGES if e["type"] == "conflicting"),
        },
    )


@router.get("/ingredient/{ingredient_id}", response_model=IngredientDetail)
async def get_ingredient(ingredient_id: str):
    key = ingredient_id.lower().strip()
    if key not in INGREDIENTS:
        raise HTTPException(status_code=404, detail=f"Ingredient '{ingredient_id}' not found")
    data = INGREDIENTS[key]
    return IngredientDetail(id=key, **{k: v for k, v in data.items()})


@router.get("/ingredient/{ingredient_id}/neighbors")
async def get_neighbors(ingredient_id: str):
    key = ingredient_id.lower().strip()
    if key not in INGREDIENTS:
        raise HTTPException(status_code=404, detail=f"Ingredient '{ingredient_id}' not found")
    compatible = []
    conflicting = []
    for edge in EDGES:
        if edge["source"] == key:
            neighbor = edge["target"]
        elif edge["target"] == key:
            neighbor = edge["source"]
        else:
            continue
        info = INGREDIENTS.get(neighbor, {})
        item = {"id": neighbor, "name": info.get("name", neighbor), "color": info.get("color", "#999")}
        if edge["type"] == "compatible":
            compatible.append(item)
        else:
            conflicting.append(item)
    return {"compatible": compatible, "conflicting": conflicting}


@router.get("/search/{query}")
async def search_ingredients(query: str):
    q = query.lower().strip()
    if len(q) < 1:
        return []
    results = []
    for key, data in INGREDIENTS.items():
        if q in key or q in data["name"].lower() or q in data["description"].lower():
            results.append({"id": key, "name": data["name"], "category": data["category"], "color": data["color"]})
    return results[:10]


@router.get("/categories")
async def get_categories():
    cats: Dict[str, CategoryInfo] = {}
    for key, data in INGREDIENTS.items():
        cat = data["category"]
        if cat not in cats:
            cat_colors = {"active": "#FF6B6B", "antioxidant": "#FFD93D", "hydrating": "#4D96FF", "exfoliant": "#FF8C32", "emollient": "#4ECDC4"}
            cats[cat] = CategoryInfo(name=cat, count=0, ingredients=[], color=cat_colors.get(cat, "#999"))
        cats[cat].count += 1
        cats[cat].ingredients.append(data["name"])
    return list(cats.values())


@router.get("/path/{from_id}/{to_id}")
async def find_path(from_id: str, to_id: str):
    start = from_id.lower().strip()
    end = to_id.lower().strip()
    if start not in INGREDIENTS:
        raise HTTPException(status_code=404, detail=f"Ingredient '{from_id}' not found")
    if end not in INGREDIENTS:
        raise HTTPException(status_code=404, detail=f"Ingredient '{to_id}' not found")

    # BFS shortest path
    from collections import deque
    graph: Dict[str, List[str]] = {}
    for edge in EDGES:
        graph.setdefault(edge["source"], []).append(edge["target"])
        graph.setdefault(edge["target"], []).append(edge["source"])

    visited = {start}
    queue = deque([(start, [start])])
    while queue:
        current, path = queue.popleft()
        if current == end:
            edges_in_path = []
            for i in range(len(path) - 1):
                pair = tuple(sorted([path[i], path[i + 1]]))
                edge = next((e for e in EDGES if e["source"] == pair[0] and e["target"] == pair[1]), None)
                edges_in_path.append({
                    "from": path[i], "to": path[i + 1],
                    "type": edge["type"] if edge else "unknown",
                    "from_name": INGREDIENTS.get(path[i], {}).get("name", path[i]),
                    "to_name": INGREDIENTS.get(path[i + 1], {}).get("name", path[i + 1]),
                })
            return {"path": path, "length": len(path) - 1, "edges": edges_in_path, "is_compatible": True}
        for neighbor in graph.get(current, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))
    return {"path": [], "length": -1, "edges": [], "is_compatible": False, "message": "No connection found"}
