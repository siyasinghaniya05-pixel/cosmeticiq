from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import math

router = APIRouter(prefix="/community", tags=["Community Skin Match"])

# ── Mock Community Data ─────────────────────────────────────────────

COMMUNITY_USERS: List[Dict[str, Any]] = [
    {"id": "u1", "username": "glowgettersarah", "age": 24, "skin_type": "oily", "concerns": ["acne", "oiliness", "large pores"], "climate": "humid", "avatar_color": "#FF6B6B", "products_helped": 312, "join_date": "2024-03"},
    {"id": "u2", "username": "dryskinqueen", "age": 35, "skin_type": "dry", "concerns": ["dryness", "wrinkles", "sensitivity"], "climate": "dry", "avatar_color": "#4ECDC4", "products_helped": 187, "join_date": "2023-11"},
    {"id": "u3", "username": "acnefighter_mike", "age": 21, "skin_type": "oily", "concerns": ["acne", "scarring", "hyperpigmentation"], "climate": "tropical", "avatar_color": "#45B7D1", "products_helped": 98, "join_date": "2024-06"},
    {"id": "u4", "username": "sensitiveskinlily", "age": 29, "skin_type": "sensitive", "concerns": ["redness", "rosacea", "dryness"], "climate": "temperate", "avatar_color": "#96CEB4", "products_helped": 245, "join_date": "2023-08"},
    {"id": "u5", "username": "antiagingpro", "age": 42, "skin_type": "combination", "concerns": ["wrinkles", "fine lines", "loss of elasticity"], "climate": "dry", "avatar_color": "#FFEAA7", "products_helped": 520, "join_date": "2022-12"},
    {"id": "u6", "username": "naturalglow_jo", "age": 27, "skin_type": "normal", "concerns": ["dullness", "uneven tone"], "climate": "temperate", "avatar_color": "#DDA0DD", "products_helped": 134, "join_date": "2024-01"},
    {"id": "u7", "username": "tropicalskindev", "age": 31, "skin_type": "oily", "concerns": ["acne", "sun damage", "dark spots"], "climate": "tropical", "avatar_color": "#FF8C32", "products_helped": 203, "join_date": "2023-09"},
    {"id": "u8", "username": "winterskindiva", "age": 33, "skin_type": "dry", "concerns": ["dryness", "eczema", "flaking"], "climate": "cold", "avatar_color": "#6C5CE7", "products_helped": 156, "join_date": "2024-02"},
    {"id": "u9", "username": "minimalistmaria", "age": 26, "skin_type": "combination", "concerns": ["oiliness", "blackheads", "texture"], "climate": "humid", "avatar_color": "#00B894", "products_helped": 89, "join_date": "2024-05"},
    {"id": "u10", "username": "veganbeautyalex", "age": 23, "skin_type": "normal", "concerns": ["acne", "redness"], "climate": "temperate", "avatar_color": "#E17055", "products_helped": 67, "join_date": "2024-07"},
    {"id": "u11", "username": "retinolrookie", "age": 28, "skin_type": "combination", "concerns": ["fine lines", "dullness", "sun damage"], "climate": "dry", "avatar_color": "#FDCB6E", "products_helped": 178, "join_date": "2023-12"},
    {"id": "u12", "username": "oilyskinprincess", "age": 22, "skin_type": "oily", "concerns": ["acne", "oiliness", "scarring"], "climate": "tropical", "avatar_color": "#E84393", "products_helped": 291, "join_date": "2023-07"},
    {"id": "u13", "username": "maturebeautygrace", "age": 50, "skin_type": "dry", "concerns": ["wrinkles", "age spots", "loss of firmness", "dryness"], "climate": "temperate", "avatar_color": "#A29BFE", "products_helped": 445, "join_date": "2022-06"},
    {"id": "u14", "username": "acnefree_now", "age": 19, "skin_type": "oily", "concerns": ["acne", "oiliness"], "climate": "humid", "avatar_color": "#55EFC4", "products_helped": 45, "join_date": "2024-08"},
    {"id": "u15", "username": "weatherworn_wendy", "age": 38, "skin_type": "sensitive", "concerns": ["dryness", "redness", "sensitivity", "wrinkles"], "climate": "cold", "avatar_color": "#74B9FF", "products_helped": 310, "join_date": "2023-03"},
    {"id": "u16", "username": "tropicskincare", "age": 30, "skin_type": "oily", "concerns": ["sun damage", "dark spots", "acne"], "climate": "tropical", "avatar_color": "#FF7675", "products_helped": 188, "join_date": "2024-04"},
    {"id": "u17", "username": "gentleglow_nina", "age": 25, "skin_type": "sensitive", "concerns": ["redness", "eczema", "dryness"], "climate": "dry", "avatar_color": "#00CEC9", "products_helped": 132, "join_date": "2024-02"},
    {"id": "u18", "username": "oilycombo_kai", "age": 27, "skin_type": "combination", "concerns": ["oiliness", "acne", "large pores"], "climate": "humid", "avatar_color": "#FAB1A0", "products_helped": 211, "join_date": "2023-10"},
    {"id": "u19", "username": "aginggracefully", "age": 45, "skin_type": "combination", "concerns": ["wrinkles", "dark spots", "loss of elasticity", "dryness"], "climate": "temperate", "avatar_color": "#636E72", "products_helped": 389, "join_date": "2022-09"},
    {"id": "u20", "username": "clearskinclara", "age": 20, "skin_type": "normal", "concerns": ["acne", "uneven tone"], "climate": "temperate", "avatar_color": "#DFE6E9", "products_helped": 56, "join_date": "2024-09"},
]

COMMUNITY_REVIEWS: List[Dict[str, Any]] = [
    {"user_id": "u1", "product_name": "CeraVe Foaming Facial Cleanser", "brand": "CeraVe", "rating": 5, "helpful": 34, "review": "Holy grail for oily skin! Controls oil without stripping.", "category": "cleanser"},
    {"user_id": "u1", "product_name": "Paula's Choice 2% BHA Liquid Exfoliant", "brand": "Paula's Choice", "rating": 5, "helpful": 67, "review": "Cleared my pores in 2 weeks. Use it every night.", "category": "exfoliant"},
    {"user_id": "u1", "product_name": "Niacinamide 10% + Zinc 1% Serum", "brand": "The Ordinary", "rating": 4, "helpful": 45, "review": "Oil production noticeably reduced. Affordable too.", "category": "serum"},
    {"user_id": "u2", "product_name": "Cetaphil Moisturizing Cream", "brand": "Cetaphil", "rating": 5, "helpful": 28, "review": "Only cream that doesn't sting my dry skin. Thick but absorbs well.", "category": "moisturizer"},
    {"user_id": "u2", "product_name": "La Roche-Posay Cicaplast Baume B5", "brand": "La Roche-Posay", "rating": 5, "helpful": 89, "review": "Repairs my barrier overnight. Saved me during winter.", "category": "treatment"},
    {"user_id": "u2", "product_name": "Hyaluronic Acid 2% + B5 Serum", "brand": "The Ordinary", "rating": 4, "helpful": 52, "review": "Deep hydration. Must apply on damp skin though.", "category": "serum"},
    {"user_id": "u3", "product_name": "The Inkey List Salicylic Acid Cleanser", "brand": "The Inkey List", "rating": 4, "helpful": 31, "review": "Gentle but effective for breakouts. No irritation.", "category": "cleanser"},
    {"user_id": "u3", "product_name": "Differin Gel (Adapalene 0.1%)", "brand": "Differin", "rating": 5, "helpful": 112, "review": "Prescription-strength without the prescription. Purging phase is rough but worth it.", "category": "treatment"},
    {"user_id": "u4", "product_name": "Avène Thermal Spring Water", "brand": "Avène", "rating": 5, "helpful": 38, "review": "Instant relief for rosacea flare-ups. I spray it all day.", "category": "mist"},
    {"user_id": "u4", "product_name": "Vanicream Moisturizing Skin Cream", "brand": "Vanicream", "rating": 5, "helpful": 64, "review": "Zero irritants. Dermatologist recommended and I see why.", "category": "moisturizer"},
    {"user_id": "u4", "product_name": "Centella Asiatica Cream", "brand": "Dr. Jart+", "rating": 4, "helpful": 41, "review": "Calms redness within minutes. The green tint helps too.", "category": "moisturizer"},
    {"user_id": "u5", "product_name": "SkinCeuticals C E Ferulic", "brand": "SkinCeuticals", "rating": 5, "helpful": 156, "review": "Expensive but nothing compares. Visible firmness after 3 months.", "category": "serum"},
    {"user_id": "u5", "product_name": "Retinol 1% in Squalane", "brand": "The Ordinary", "rating": 4, "helpful": 78, "review": "Great entry retinol. I work up to this from 0.5%.", "category": "serum"},
    {"user_id": "u5", "product_name": "Neutrogena Rapid Wrinkle Repair Night Moisturizer", "brand": "Neutrogena", "rating": 4, "helpful": 43, "review": "Good drugstore option with retinol. Doesn't irritate.", "category": "moisturizer"},
    {"user_id": "u6", "product_name": "Vitamin C 23% + HA Spheres 2%", "brand": "The Ordinary", "rating": 5, "helpful": 55, "review": "Brightened my complexion in just 2 weeks. Slight tingle but nothing bad.", "category": "serum"},
    {"user_id": "u6", "product_name": "Glycolic Acid 7% Toning Solution", "brand": "The Ordinary", "rating": 4, "helpful": 39, "review": "Great for even skin tone. Use 3x a week max.", "category": "toner"},
    {"user_id": "u7", "product_name": "Biore UV Aqua Rich Watery Essence SPF50+", "brand": "Bioré", "rating": 5, "helpful": 92, "review": "No white cast, light as water. Reapply every 2 hours in tropics.", "category": "sunscreen"},
    {"user_id": "u7", "product_name": "Melano CC Premium Essence", "brand": "Rohto", "rating": 5, "helpful": 67, "review": "Faded my dark spots in a month. Vitamin C that actually works.", "category": "serum"},
    {"user_id": "u8", "product_name": "First Aid Beauty Ultra Repair Cream", "brand": "First Aid Beauty", "rating": 5, "helpful": 88, "review": "Colloidal oatmeal saved my eczema. Thick layer at night works miracles.", "category": "moisturizer"},
    {"user_id": "u8", "product_name": "Aquaphor Healing Ointment", "brand": "Aquaphor", "rating": 5, "helpful": 103, "review": "Slugging with this healed my cracked skin in 3 days.", "category": "treatment"},
    {"user_id": "u9", "product_name": "COSRX AHA/BHA Clarifying Treatment Toner", "brand": "COSRX", "rating": 4, "helpful": 29, "review": "Gentle exfoliation for combo skin. Controls T-zone perfectly.", "category": "toner"},
    {"user_id": "u9", "product_name": "Innisfree Super Volcanic Pore Clay Mask", "brand": "Innisfree", "rating": 4, "helpful": 34, "review": "Deep cleans pores once a week. T-zone feels tight and smooth after.", "category": "mask"},
    {"user_id": "u10", "product_name": "Pai Rosehip BioRegenerate Oil", "brand": "Pai Skincare", "rating": 5, "helpful": 41, "review": "100% organic, cleared my redness and smells like nature.", "category": "oil"},
    {"user_id": "u11", "product_name": "CeraVe Resurfacing Retinol Serum", "brand": "CeraVe", "rating": 5, "helpful": 72, "review": "Gentle retinol with ceramides. My fine lines are fading.", "category": "serum"},
    {"user_id": "u11", "product_name": "EltaMD UV Clear SPF 46", "brand": "EltaMD", "rating": 5, "helpful": 95, "review": "Silky sunscreen with niacinamide. Won't clog pores.", "category": "sunscreen"},
    {"user_id": "u12", "product_name": "COSRX Snail Mucin 96% Essence", "brand": "COSRX", "rating": 5, "helpful": 134, "review": "Healed my acne scars faster than anything else. Texture is weird but results are real.", "category": "serum"},
    {"user_id": "u12", "product_name": "Benzoyl Peroxide 5% Gel", "brand": "Neutrogena", "rating": 4, "helpful": 56, "review": "Kills bacteria fast. Use as spot treatment only or it stains pillows.", "category": "treatment"},
    {"user_id": "u13", "product_name": "Estée Lauder Advanced Night Repair", "brand": "Estée Lauder", "rating": 5, "helpful": 167, "review": "At 50, this is my anti-aging workhorse. Skin looks 10 years younger.", "category": "serum"},
    {"user_id": "u13", "product_name": "RoC Retinol Correxion Night Cream", "brand": "RoC", "rating": 4, "helpful": 89, "review": "Affordable retinol cream. Deep wrinkles softened noticeably.", "category": "moisturizer"},
    {"user_id": "u14", "product_name": "PanOxyl Acne Foaming Wash 10%", "brand": "PanOxyl", "rating": 5, "helpful": 78, "review": "BP wash cleared my back and face acne. Leave on 2-3 min before rinsing.", "category": "cleanser"},
    {"user_id": "u15", "product_name": "Eucerin Advanced Repair Cream", "brand": "Eucerin", "rating": 5, "helpful": 54, "review": "For harsh winters, this is the only cream that prevents cracking.", "category": "moisturizer"},
    {"user_id": "u15", "product_name": "Bioderma Sensibio H2O Micellar Water", "brand": "Bioderma", "rating": 5, "helpful": 71, "review": "Gentlest makeup remover for sensitive skin. Zero irritation.", "category": "cleanser"},
    {"user_id": "u16", "product_name": "Isntree Hyaluronic Acid Watery Sun Gel SPF50+", "brand": "Isntree", "rating": 5, "helpful": 63, "review": "Best sunscreen for tropical weather. Zero white cast, hydrating.", "category": "sunscreen"},
    {"user_id": "u17", "product_name": "Laneige Cream Skin Refiner", "brand": "Laneige", "rating": 5, "helpful": 47, "review": "Like a moisturizer in toner form. Perfect for dry sensitive skin.", "category": "toner"},
    {"user_id": "u18", "product_name": "Some By Mi AHA-BHA-PHA 30 Days Miracle Toner", "brand": "Some By Mi", "rating": 4, "helpful": 51, "review": "Triple acid toner that actually works on oily combo skin without over-drying.", "category": "toner"},
    {"user_id": "u19", "product_name": "Olay Regenerist Micro-Sculpting Cream", "brand": "Olay", "rating": 5, "helpful": 134, "review": "Niacinamide and peptides for mature skin at a fraction of the price of luxury brands.", "category": "moisturizer"},
    {"user_id": "u19", "product_name": "Drunk Elephant A-Passioni Retinol Cream", "brand": "Drunk Elephant", "rating": 4, "helpful": 76, "review": "Strong retinol but buffered with nourishing oils. Great for 40+ skin.", "category": "treatment"},
    {"user_id": "u20", "product_name": "The Inkey List Niacinamide Serum", "brand": "The Inkey List", "rating": 4, "helpful": 28, "review": "Simple and effective for occasional breakouts on normal skin.", "category": "serum"},
    {"user_id": "u20", "product_name": "La Roche-Posay Toleriane Double Repair Face Moisturizer", "brand": "La Roche-Posay", "rating": 5, "helpful": 44, "review": "Lightweight, no fragrance, keeps my skin balanced all day.", "category": "moisturizer"},
]


# ── Matching Algorithm ──────────────────────────────────────────────

def _compute_match_score(user_profile: Dict, community_user: Dict) -> float:
    score = 0.0
    weights = {"skin_type": 30, "concerns": 35, "age": 15, "climate": 20}

    # Skin type match (30 pts)
    if user_profile.get("skin_type", "").lower() == community_user["skin_type"].lower():
        score += weights["skin_type"]

    # Concerns overlap (35 pts)
    user_concerns = set(c.lower() for c in user_profile.get("concerns", []))
    community_concerns = set(c.lower() for c in community_user["concerns"])
    if user_concerns and community_concerns:
        overlap = len(user_concerns & community_concerns)
        total = len(user_concerns | community_concerns)
        score += weights["concerns"] * (overlap / total) if total else 0

    # Age proximity (15 pts)
    user_age = user_profile.get("age", 30)
    community_age = community_user["age"]
    age_diff = abs(user_age - community_age)
    if age_diff <= 2:
        score += weights["age"]
    elif age_diff <= 5:
        score += weights["age"] * 0.8
    elif age_diff <= 10:
        score += weights["age"] * 0.5
    else:
        score += weights["age"] * max(0, 1 - (age_diff - 10) / 30)

    # Climate match (20 pts)
    if user_profile.get("climate", "").lower() == community_user["climate"].lower():
        score += weights["climate"]
    elif user_profile.get("climate") and community_user["climate"]:
        compatible = {
            "humid": ["tropical", "temperate"],
            "tropical": ["humid"],
            "dry": ["cold"],
            "cold": ["dry"],
            "temperate": ["humid"],
        }
        if community_user["climate"] in compatible.get(user_profile.get("climate", ""), []):
            score += weights["climate"] * 0.5

    return round(score, 1)


# ── Pydantic Schemas ────────────────────────────────────────────────

class MatchRequest(BaseModel):
    age: int = Field(..., ge=10, le=120)
    skin_type: str = Field(..., min_length=1)
    concerns: List[str] = Field(default_factory=list)
    climate: Optional[str] = None

class CommunityUserPreview(BaseModel):
    id: str
    username: str
    age: int
    skin_type: str
    concerns: List[str]
    climate: str
    avatar_color: str
    products_helped: int
    match_score: float
    match_percentage: float

class ProductReview(BaseModel):
    user_id: str
    username: str
    product_name: str
    brand: str
    rating: int
    helpful: int
    review: str
    category: str
    avatar_color: str

class MatchResult(BaseModel):
    matches: List[CommunityUserPreview]
    total_community: int
    avg_match_score: float
    top_concerns_matched: Dict[str, int]

class UserProfileRequest(BaseModel):
    age: int = Field(..., ge=10, le=120)
    skin_type: str = Field(..., min_length=1)
    concerns: List[str] = Field(default_factory=list)
    climate: Optional[str] = None

class ProductRecommendation(BaseModel):
    product_name: str
    brand: str
    category: str
    avg_rating: float
    total_reviews: int
    total_helpful: int
    reviews: List[ProductReview]


# ── Endpoints ───────────────────────────────────────────────────────

@router.post("/match", response_model=MatchResult)
async def find_matches(req: MatchRequest):
    user_profile = req.model_dump()
    scored = []
    for cu in COMMUNITY_USERS:
        score = _compute_match_score(user_profile, cu)
        scored.append(CommunityUserPreview(
            id=cu["id"], username=cu["username"], age=cu["age"],
            skin_type=cu["skin_type"], concerns=cu["concerns"],
            climate=cu["climate"], avatar_color=cu["avatar_color"],
            products_helped=cu["products_helped"],
            match_score=score,
            match_percentage=round(score, 1),
        ))
    scored.sort(key=lambda x: x.match_score, reverse=True)
    avg = round(sum(s.match_score for s in scored) / len(scored), 1) if scored else 0

    # Count concern overlaps
    concern_counts: Dict[str, int] = {}
    for cu in COMMUNITY_USERS:
        for c in cu["concerns"]:
            if c.lower() in [x.lower() for x in req.concerns]:
                concern_counts[c] = concern_counts.get(c, 0) + 1

    return MatchResult(
        matches=scored[:20],
        total_community=len(COMMUNITY_USERS),
        avg_match_score=avg,
        top_concerns_matched=concern_counts,
    )


@router.get("/user/{user_id}")
async def get_community_user(user_id: str):
    for u in COMMUNITY_USERS:
        if u["id"] == user_id:
            reviews = [
                {**r, "username": u["username"], "avatar_color": u["avatar_color"]}
                for r in COMMUNITY_REVIEWS if r["user_id"] == user_id
            ]
            return {**u, "reviews": reviews}
    raise HTTPException(status_code=404, detail="User not found")


@router.get("/user/{user_id}/reviews")
async def get_user_reviews(user_id: str):
    u = next((x for x in COMMUNITY_USERS if x["id"] == user_id), None)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    reviews = [
        {**r, "username": u["username"], "avatar_color": u["avatar_color"]}
        for r in COMMUNITY_REVIEWS if r["user_id"] == user_id
    ]
    return {"reviews": reviews, "total": len(reviews)}


@router.post("/top-products", response_model=List[ProductRecommendation])
async def get_top_products(req: MatchRequest, limit: int = Query(default=8, ge=1, le=20)):
    user_profile = req.model_dump()

    # Find best matching users
    scored = []
    for cu in COMMUNITY_USERS:
        score = _compute_match_score(user_profile, cu)
        if score >= 30:
            scored.append((cu["id"], score))
    scored.sort(key=lambda x: x[1], reverse=True)
    top_user_ids = set(uid for uid, _ in scored[:10])

    # Collect reviews from matching users
    matching_reviews = [
        {**r, "avatar_color": next((u["avatar_color"] for u in COMMUNITY_USERS if u["id"] == r["user_id"]), "#999"),
         "username": next((u["username"] for u in COMMUNITY_USERS if u["id"] == r["user_id"]), "?")}
        for r in COMMUNITY_REVIEWS if r["user_id"] in top_user_ids
    ]

    # Group by product
    product_map: Dict[str, Dict] = {}
    for rev in matching_reviews:
        key = rev["product_name"].lower()
        if key not in product_map:
            product_map[key] = {
                "product_name": rev["product_name"],
                "brand": rev["brand"],
                "category": rev["category"],
                "ratings": [],
                "helpful_total": 0,
                "reviews": [],
            }
        product_map[key]["ratings"].append(rev["rating"])
        product_map[key]["helpful_total"] += rev["helpful"]
        product_map[key]["reviews"].append({
            "user_id": rev["user_id"], "username": rev["username"],
            "product_name": rev["product_name"], "brand": rev["brand"],
            "rating": rev["rating"], "helpful": rev["helpful"],
            "review": rev["review"], "category": rev["category"],
            "avatar_color": rev["avatar_color"],
        })

    results = []
    for data in product_map.values():
        avg = round(sum(data["ratings"]) / len(data["ratings"]), 1)
        results.append(ProductRecommendation(
            product_name=data["product_name"],
            brand=data["brand"],
            category=data["category"],
            avg_rating=avg,
            total_reviews=len(data["ratings"]),
            total_helpful=data["helpful_total"],
            reviews=data["reviews"],
        ))
    results.sort(key=lambda x: (x.avg_rating * x.total_helpful), reverse=True)
    return results[:limit]


@router.get("/concerns")
async def get_all_concerns():
    all_concerns = set()
    for u in COMMUNITY_USERS:
        for c in u["concerns"]:
            all_concerns.add(c.lower())
    return sorted(all_concerns)


@router.get("/stats")
async def get_community_stats():
    skin_types = {}
    climates = {}
    all_concerns = {}
    for u in COMMUNITY_USERS:
        skin_types[u["skin_type"]] = skin_types.get(u["skin_type"], 0) + 1
        climates[u["climate"]] = climates.get(u["climate"], 0) + 1
        for c in u["concerns"]:
            all_concerns[c] = all_concerns.get(c, 0) + 1
    return {
        "total_users": len(COMMUNITY_USERS),
        "total_reviews": len(COMMUNITY_REVIEWS),
        "skin_types": skin_types,
        "climates": climates,
        "top_concerns": dict(sorted(all_concerns.items(), key=lambda x: x[1], reverse=True)[:10]),
    }
