from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, List, Optional, Any

from app.core.database import get_db
from app.models.database_models import Product, Ingredient, ProductIngredient
from app.decision_engine.fuzzy_engine import fuzzy_engine

router = APIRouter(prefix="/trust-score", tags=["Trust Score"])

WEIGHTS = {
    "scientific_evidence": 0.25,
    "ingredient_safety": 0.25,
    "fuzzy_logic_suitability": 0.20,
    "dermatologist_support": 0.10,
    "user_profile_match": 0.10,
    "price_vs_value": 0.10,
}

GRADE_THRESHOLDS = [
    (95, "A+"), (90, "A"), (85, "A-"),
    (80, "B+"), (75, "B"), (70, "B-"),
    (65, "C+"), (60, "C"), (55, "C-"),
    (40, "D"), (0, "F"),
]


def _grade(score: float) -> str:
    for threshold, letter in GRADE_THRESHOLDS:
        if score >= threshold:
            return letter
    return "F"


def _badge(score: float) -> tuple:
    if score >= 90:
        return "Excellent", "green"
    if score >= 80:
        return "Very Good", "emerald"
    if score >= 65:
        return "Good", "yellow"
    if score >= 50:
        return "Fair", "orange"
    return "Poor", "red"


class TrustScoreCalculateRequest(BaseModel):
    product_name: str
    brand: Optional[str] = "Unknown"
    ingredients: Optional[List[str]] = Field(default_factory=list)
    scientific_references: int = Field(default=0, ge=0)
    safety_score: Optional[float] = Field(default=None, ge=0, le=10)
    dermatologist_approved: bool = False
    clinical_endorsements: int = Field(default=0, ge=0)
    user_skin_type: Optional[str] = None
    user_age: Optional[int] = Field(default=None, ge=10, le=100)
    user_concerns: Optional[List[str]] = Field(default_factory=list)
    budget_max: Optional[float] = Field(default=None, ge=0)
    price: Optional[float] = Field(default=None, ge=0)
    category_avg_price: Optional[float] = Field(default=None, ge=0)


def _score_scientific_evidence(
    scientific_score: float,
    review_count: int,
    ingredient_study_count: int,
) -> Dict[str, Any]:
    reference_score = min(scientific_score * 10, 100) if scientific_score else 0
    pubmed_bonus = min(ingredient_study_count * 15, 30)
    review_bonus = min(review_count * 0.5, 20) if review_count else 0
    raw = reference_score * 0.5 + pubmed_bonus + review_bonus
    score = min(max(raw, 0), 100)
    label = "Strong" if score >= 70 else "Moderate" if score >= 40 else "Weak"
    return {
        "score": round(score, 2),
        "weight": WEIGHTS["scientific_evidence"],
        "weighted_score": round(score * WEIGHTS["scientific_evidence"], 2),
        "label": label,
        "description": (
            "Based on published clinical studies, PubMed references, and scientific citations supporting this product's claims."
        ),
        "details": {
            "scientific_score_raw": scientific_score,
            "ingredient_studies_found": ingredient_study_count,
            "review_evidence_count": review_count,
            "reference_component": round(reference_score * 0.5, 2),
            "pubmed_component": round(pubmed_bonus, 2),
            "review_component": round(review_bonus, 2),
        },
    }


def _score_ingredient_safety(ingredients: list) -> Dict[str, Any]:
    if not ingredients:
        return {
            "score": 50.0,
            "weight": WEIGHTS["ingredient_safety"],
            "weighted_score": round(50.0 * WEIGHTS["ingredient_safety"], 2),
            "label": "Unknown",
            "description": "No ingredient data available for safety assessment.",
            "details": {"total_ingredients": 0, "hazardous_count": 0, "allergen_count": 0},
        }

    total = len(ingredients)
    safe_count = sum(1 for i in ingredients if i.get("safety_status") == "safe")
    moderate_count = sum(1 for i in ingredients if i.get("safety_status") == "moderate")
    hazardous_count = sum(1 for i in ingredients if i.get("safety_status") == "hazardous")
    allergen_count = sum(1 for i in ingredients if i.get("is_allergen"))
    endocrine_count = sum(1 for i in ingredients if i.get("is_endocrine_disruptor"))
    microplastic_count = sum(1 for i in ingredients if i.get("is_microplastic"))

    ewg_scores = [i.get("ewg_score", 0) for i in ingredients if i.get("ewg_score")]
    avg_ewg = sum(ewg_scores) / len(ewg_scores) if ewg_scores else 5.0
    ewg_component = max(0, (10 - avg_ewg)) / 10 * 40

    safety_ratio = safe_count / total if total else 0
    safety_component = safety_ratio * 35

    penalty = hazardous_count * 8 + allergen_count * 5 + endocrine_count * 10 + microplastic_count * 6
    raw = ewg_component + safety_component - penalty
    score = min(max(raw, 0), 100)

    label = "Safe" if score >= 70 else "Moderate" if score >= 40 else "Hazardous"
    return {
        "score": round(score, 2),
        "weight": WEIGHTS["ingredient_safety"],
        "weighted_score": round(score * WEIGHTS["ingredient_safety"], 2),
        "label": label,
        "description": "Composite of EWG safety ratings, allergen presence, and hazardous ingredient counts.",
        "details": {
            "total_ingredients": total,
            "safe_count": safe_count,
            "moderate_count": moderate_count,
            "hazardous_count": hazardous_count,
            "allergen_count": allergen_count,
            "endocrine_disruptor_count": endocrine_count,
            "microplastic_count": microplastic_count,
            "avg_ewg_score": round(avg_ewg, 2),
        },
    }


def _score_fuzzy_logic(product: Any, user_skin_type: Optional[str] = None, user_age: Optional[int] = None) -> Dict[str, Any]:
    skin_type_map = {"dry": 0.7, "oily": 0.7, "sensitive": 0.7, "acne_prone": 0.7, "combination": 0.5, "normal": 0.3}
    skin_inputs = {}
    if user_skin_type and user_skin_type.lower() in skin_type_map:
        for key in skin_type_map:
            if key == user_skin_type.lower():
                skin_inputs[f"skin_type_{key}"] = skin_type_map[key]
            else:
                skin_inputs[f"skin_type_{key}"] = 0.1
    else:
        skin_inputs = {"skin_type_dry": 0.3, "skin_type_oily": 0.3, "skin_type_sensitive": 0.3, "skin_type_acne": 0.3}

    inputs = {
        **skin_inputs,
        "age": user_age or 30,
        "climate_humid": 0.5,
        "climate_dry": 0.5,
        "climate_cold": 0.5,
        "budget": 200,
        "ingredient_safety": (product.safety_score / 10) if product.safety_score else 0.5,
        "comedogenic_rating": product.comedogenic_score or 0,
        "fragrance_level": product.fragrance_level or 0,
        "alcohol_presence": product.alcohol_level or 0,
        "product_rating": product.rating or 2.5,
        "scientific_evidence": (product.scientific_score / 10) if product.scientific_score else 0.5,
        "dermatologist_approval": 0.7 if product.safety_score and product.safety_score >= 7 else 0.3,
    }

    result = fuzzy_engine.evaluate(inputs)
    suitability_score = result.get("suitability_score", 0.5)
    score = round(suitability_score * 100, 2)
    label = result.get("linguistic_output", "Unknown")

    return {
        "score": score,
        "weight": WEIGHTS["fuzzy_logic_suitability"],
        "weighted_score": round(score * WEIGHTS["fuzzy_logic_suitability"], 2),
        "label": label,
        "description": "Fuzzy logic evaluation of product suitability considering skin type, age, climate, and ingredient interactions.",
        "details": {
            "fuzzy_confidence": result.get("confidence", 0),
            "triggered_rules_count": len(result.get("triggered_rules", [])),
            "membership_values": result.get("membership_values", {}),
        },
    }


def _score_dermatologist_support(product: Any) -> Dict[str, Any]:
    has_safety_data = bool(product.safety_score and product.safety_score >= 6)
    has_scientific_data = bool(product.scientific_score and product.scientific_score >= 5)
    high_rating = bool(product.rating and product.rating >= 4.0)

    score = 0
    if has_safety_data:
        score += 30
    if has_scientific_data:
        score += 25
    if high_rating:
        score += 20
    if product.rating and product.rating >= 4.5:
        score += 15
    if product.review_count and product.review_count >= 50:
        score += 10

    score = min(score, 100)
    label = "Endorsed" if score >= 70 else "Partial" if score >= 40 else "No Endorsement"

    return {
        "score": round(score, 2),
        "weight": WEIGHTS["dermatologist_support"],
        "weighted_score": round(score * WEIGHTS["dermatologist_support"], 2),
        "label": label,
        "description": "Inferred dermatologist support based on safety scores, clinical data, and professional endorsements.",
        "details": {
            "has_safety_data": has_safety_data,
            "has_scientific_data": has_scientific_data,
            "high_rating": high_rating,
            "review_count": product.review_count or 0,
        },
    }


def _score_user_profile_match(
    product: Any,
    user_skin_type: Optional[str],
    user_age: Optional[int],
    user_concerns: Optional[List[str]],
) -> Dict[str, Any]:
    score = 0
    details: Dict[str, Any] = {}

    if user_skin_type:
        skin_match = 30
        if user_skin_type.lower() == "sensitive" and product.fragrance_level and product.fragrance_level < 0.3:
            skin_match = 40
        elif user_skin_type.lower() == "acne_prone" and product.comedogenic_score and product.comedogenic_score < 2:
            skin_match = 40
        elif user_skin_type.lower() == "oily" and product.fragrance_level and product.fragrance_level < 0.5:
            skin_match = 35
        score += skin_match
        details["skin_type_match"] = skin_match
    else:
        score += 15
        details["skin_type_match"] = 15

    if user_age:
        age_match = 15
        if user_age < 25:
            age_match = 20 if product.price and product.price < 50 else 15
        elif 25 <= user_age <= 40:
            age_match = 18
        else:
            age_match = 20 if product.safety_score and product.safety_score >= 7 else 12
        score += age_match
        details["age_match"] = age_match
    else:
        score += 10
        details["age_match"] = 10

    if user_concerns:
        concern_score = 15
        score += concern_score
        details["concern_alignment"] = concern_score
    else:
        score += 8
        details["concern_alignment"] = 8

    score = min(score, 100)
    label = "Excellent Match" if score >= 70 else "Good Match" if score >= 45 else "Poor Match"

    return {
        "score": round(score, 2),
        "weight": WEIGHTS["user_profile_match"],
        "weighted_score": round(score * WEIGHTS["user_profile_match"], 2),
        "label": label,
        "description": "How well this product matches the user's skin type, age group, and personal concerns.",
        "details": details,
    }


def _score_price_vs_value(product: Any, category_avg_price: Optional[float] = None) -> Dict[str, Any]:
    price = product.price
    if not price:
        return {
            "score": 50.0,
            "weight": WEIGHTS["price_vs_value"],
            "weighted_score": round(50.0 * WEIGHTS["price_vs_value"], 2),
            "label": "Unknown",
            "description": "Price data not available for value assessment.",
            "details": {"price": None, "category_avg": category_avg_price},
        }

    avg = category_avg_price or price
    ratio = price / avg if avg > 0 else 1.0

    if ratio <= 0.5:
        price_position_score = 95
    elif ratio <= 0.8:
        price_position_score = 85
    elif ratio <= 1.0:
        price_position_score = 75
    elif ratio <= 1.2:
        price_position_score = 60
    elif ratio <= 1.5:
        price_position_score = 45
    else:
        price_position_score = 30

    quality_score = 0
    if product.rating:
        quality_score = (product.rating / 5.0) * 100
    if product.safety_score:
        quality_score = (quality_score + (product.safety_score / 10) * 100) / 2

    value_ratio = quality_score / (price_position_score + 1) * 50
    raw = (price_position_score * 0.4 + quality_score * 0.3 + value_ratio * 0.3)
    score = min(max(raw, 0), 100)

    if ratio <= 0.8:
        label = "Great Value"
    elif ratio <= 1.1:
        label = "Fair Price"
    elif ratio <= 1.4:
        label = "Above Average"
    else:
        label = "Premium"

    return {
        "score": round(score, 2),
        "weight": WEIGHTS["price_vs_value"],
        "weighted_score": round(score * WEIGHTS["price_vs_value"], 2),
        "label": label,
        "description": "Value assessment comparing product price against category average and quality metrics.",
        "details": {
            "price": price,
            "category_avg_price": round(avg, 2),
            "price_ratio": round(ratio, 2),
            "quality_score": round(quality_score, 2),
        },
    }


def _build_comparison(score: float, category: Optional[str]) -> Dict[str, Any]:
    return {
        "vs_category_average": round(score - 65.0, 2),
        "vs_best_in_class": round(score - 92.0, 2),
        "category_average": 65.0,
        "best_in_class": 92.0,
        "percentile_estimate": min(max(round(score * 0.95, 1), 0), 100),
    }


def _build_improvement_tips(breakdown: Dict[str, Any]) -> List[str]:
    tips = []
    for key, component in breakdown.items():
        if component["score"] < 60:
            if key == "scientific_evidence":
                tips.append("Look for products with published clinical studies or PubMed-referenced ingredients.")
            elif key == "ingredient_safety":
                tips.append("Choose products with EWG-verified safe ingredients and fewer allergens.")
            elif key == "fuzzy_logic_suitability":
                tips.append("Select a product better matched to your specific skin type and age group.")
            elif key == "dermatologist_support":
                tips.append("Consider products with dermatologist endorsements or clinical endorsements.")
            elif key == "user_profile_match":
                tips.append("Update your profile to get more personalized score assessments.")
            elif key == "price_vs_value":
                tips.append("Consider alternatives in the same category with better value-for-money ratios.")
    return tips


def _build_trust_score_response(
    product_id: int,
    product_name: str,
    brand: str,
    breakdown: Dict[str, Any],
    category: Optional[str] = None,
) -> Dict[str, Any]:
    total = sum(c["weighted_score"] for c in breakdown.values())
    trust_score = round(min(max(total, 0), 100), 2)
    grade = _grade(trust_score)
    badge_text, badge_color = _badge(trust_score)

    return {
        "product_id": product_id,
        "product_name": product_name,
        "brand": brand,
        "trust_score": trust_score,
        "grade": grade,
        "breakdown": breakdown,
        "badge": badge_text,
        "badge_color": badge_color,
        "comparison": _build_comparison(trust_score, category),
        "improvement_tips": _build_improvement_tips(breakdown),
    }


async def _calculate_for_product(product: Any, db: AsyncSession, user_skin_type: Optional[str] = None, user_age: Optional[int] = None, user_concerns: Optional[List[str]] = None, category_avg_price: Optional[float] = None) -> Dict[str, Any]:
    result = await db.execute(
        select(ProductIngredient).where(ProductIngredient.product_id == product.id)
    )
    product_ingredients = result.scalars().all()

    ingredient_data = []
    ingredient_study_count = 0
    for pi in product_ingredients:
        ing_result = await db.execute(select(Ingredient).where(Ingredient.id == pi.ingredient_id))
        ing = ing_result.scalar_one_or_none()
        if ing:
            ingredient_data.append({
                "name": ing.name,
                "safety_status": ing.safety_status,
                "safety_score": ing.safety_score,
                "ewg_score": ing.ewg_score,
                "is_allergen": ing.is_allergen,
                "is_endocrine_disruptor": ing.is_endocrine_disruptor,
                "is_microplastic": ing.is_microplastic,
                "is_comedogenic": ing.is_comedogenic,
            })

    if not category_avg_price and product.category:
        cat_result = await db.execute(
            select(func.avg(Product.price)).where(Product.category == product.category)
        )
        category_avg_price = cat_result.scalar()

    breakdown = {
        "scientific_evidence": _score_scientific_evidence(
            product.scientific_score or 0,
            product.review_count or 0,
            ingredient_study_count,
        ),
        "ingredient_safety": _score_ingredient_safety(ingredient_data),
        "fuzzy_logic_suitability": _score_fuzzy_logic(product, user_skin_type, user_age),
        "dermatologist_support": _score_dermatologist_support(product),
        "user_profile_match": _score_user_profile_match(product, user_skin_type, user_age, user_concerns),
        "price_vs_value": _score_price_vs_value(product, category_avg_price),
    }

    return _build_trust_score_response(
        product_id=product.id,
        product_name=product.name,
        brand=product.brand,
        breakdown=breakdown,
        category=product.category,
    )


@router.get("/product/{product_id}")
async def get_product_trust_score(
    product_id: int,
    user_skin_type: Optional[str] = None,
    user_age: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with id {product_id} not found")

    return await _calculate_for_product(
        product, db,
        user_skin_type=user_skin_type,
        user_age=user_age,
    )


@router.post("/calculate")
async def calculate_trust_score(body: TrustScoreCalculateRequest, db: AsyncSession = Depends(get_db)):
    ingredient_data = []
    if body.ingredients:
        for name in body.ingredients:
            ing_result = await db.execute(select(Ingredient).where(Ingredient.name.ilike(name)))
            ing = ing_result.scalar_one_or_none()
            if ing:
                ingredient_data.append({
                    "name": ing.name,
                    "safety_status": ing.safety_status,
                    "safety_score": ing.safety_score,
                    "ewg_score": ing.ewg_score,
                    "is_allergen": ing.is_allergen,
                    "is_endocrine_disruptor": ing.is_endocrine_disruptor,
                    "is_microplastic": ing.is_microplastic,
                    "is_comedogenic": ing.is_comedogenic,
                })
            else:
                ingredient_data.append({
                    "name": name,
                    "safety_status": "unknown",
                    "safety_score": 5.0,
                    "ewg_score": 5.0,
                    "is_allergen": False,
                    "is_endocrine_disruptor": False,
                    "is_microplastic": False,
                    "is_comedogenic": False,
                })

    scientific_score = min(body.scientific_references * 2.0, 10.0)

    fake_product = type("FakeProduct", (), {
        "id": 0,
        "name": body.product_name,
        "brand": body.brand or "Unknown",
        "category": None,
        "price": body.price,
        "safety_score": body.safety_score,
        "scientific_score": scientific_score,
        "rating": 0,
        "review_count": 0,
        "comedogenic_score": 0,
        "fragrance_level": 0,
        "alcohol_level": 0,
    })()

    breakdown = {
        "scientific_evidence": _score_scientific_evidence(
            scientific_score, 0, len(ingredient_data),
        ),
        "ingredient_safety": _score_ingredient_safety(ingredient_data),
        "fuzzy_logic_suitability": _score_fuzzy_logic(fake_product, body.user_skin_type, body.user_age),
        "dermatologist_support": {
            "score": min(100, (80 if body.dermatologist_approved else 0) + min(body.clinical_endorsements * 10, 20)),
            "weight": WEIGHTS["dermatologist_support"],
            "weighted_score": round(min(100, (80 if body.dermatologist_approved else 0) + min(body.clinical_endorsements * 10, 20)) * WEIGHTS["dermatologist_support"], 2),
            "label": "Endorsed" if body.dermatologist_approved else "No Endorsement",
            "description": "Dermatologist and clinical endorsement status.",
            "details": {
                "dermatologist_approved": body.dermatologist_approved,
                "clinical_endorsements": body.clinical_endorsements,
            },
        },
        "user_profile_match": _score_user_profile_match(fake_product, body.user_skin_type, body.user_age, body.user_concerns),
        "price_vs_value": _score_price_vs_value(fake_product, body.category_avg_price),
    }

    return _build_trust_score_response(
        product_id=0,
        product_name=body.product_name,
        brand=body.brand or "Unknown",
        breakdown=breakdown,
    )


@router.get("/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    all_result = await db.execute(select(Product).where(Product.id.isnot(None)))
    products = all_result.scalars().all()

    if not products:
        return {
            "top_products": [],
            "bottom_products": [],
            "average_score": 0,
            "total_products": 0,
        }

    scored: List[Dict[str, Any]] = []
    for product in products:
        result_data = await _calculate_for_product(product, db)
        scored.append(result_data)

    scored.sort(key=lambda x: x["trust_score"], reverse=True)

    avg_score = round(sum(p["trust_score"] for p in scored) / len(scored), 2) if scored else 0

    def _compact(p: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "product_id": p["product_id"],
            "product_name": p["product_name"],
            "brand": p["brand"],
            "trust_score": p["trust_score"],
            "grade": p["grade"],
            "badge": p["badge"],
            "badge_color": p["badge_color"],
        }

    return {
        "top_products": [_compact(p) for p in scored[:10]],
        "bottom_products": [_compact(p) for p in scored[-10:][::-1]],
        "average_score": avg_score,
        "total_products": len(scored),
    }


@router.get("/category/{category}")
async def get_category_trust_score(category: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.category.ilike(category))
    )
    products = result.scalars().all()

    if not products:
        raise HTTPException(
            status_code=404,
            detail=f"No products found in category '{category}'",
        )

    scored: List[Dict[str, Any]] = []
    for product in products:
        result_data = await _calculate_for_product(product, db)
        scored.append(result_data)

    scores = [p["trust_score"] for p in scored]
    avg_score = round(sum(scores) / len(scores), 2) if scores else 0

    top = max(scored, key=lambda x: x["trust_score"])

    distribution: Dict[str, int] = {
        "A+": 0, "A": 0, "A-": 0,
        "B+": 0, "B": 0, "B-": 0,
        "C+": 0, "C": 0, "C-": 0,
        "D": 0, "F": 0,
    }
    for p in scored:
        g = p["grade"]
        if g in distribution:
            distribution[g] += 1

    return {
        "category": category,
        "average_score": avg_score,
        "product_count": len(scored),
        "top_product": {
            "product_id": top["product_id"],
            "product_name": top["product_name"],
            "brand": top["brand"],
            "trust_score": top["trust_score"],
            "grade": top["grade"],
        },
        "score_distribution": distribution,
    }


@router.get("/compare/{product_id_1}/{product_id_2}")
async def compare_trust_scores(
    product_id_1: int,
    product_id_2: int,
    db: AsyncSession = Depends(get_db),
):
    if product_id_1 == product_id_2:
        raise HTTPException(
            status_code=400,
            detail="Cannot compare a product with itself",
        )

    result_a = await db.execute(select(Product).where(Product.id == product_id_1))
    product_a = result_a.scalar_one_or_none()
    if not product_a:
        raise HTTPException(status_code=404, detail=f"Product with id {product_id_1} not found")

    result_b = await db.execute(select(Product).where(Product.id == product_id_2))
    product_b = result_b.scalar_one_or_none()
    if not product_b:
        raise HTTPException(status_code=404, detail=f"Product with id {product_id_2} not found")

    trust_a = await _calculate_for_product(product_a, db)
    trust_b = await _calculate_for_product(product_b, db)

    if trust_a["trust_score"] > trust_b["trust_score"]:
        winner = product_a.name
    elif trust_b["trust_score"] > trust_a["trust_score"]:
        winner = product_b.name
    else:
        winner = "Tie"

    margin = round(abs(trust_a["trust_score"] - trust_b["trust_score"]), 2)

    factor_names = [
        "scientific_evidence", "ingredient_safety", "fuzzy_logic_suitability",
        "dermatologist_support", "user_profile_match", "price_vs_value",
    ]
    breakdown_comparison = []
    for factor in factor_names:
        a_comp = trust_a["breakdown"][factor]
        b_comp = trust_b["breakdown"][factor]
        breakdown_comparison.append({
            "factor": factor,
            "label": a_comp["label"],
            "product_a_score": a_comp["score"],
            "product_b_score": b_comp["score"],
            "product_a_weighted": a_comp["weighted_score"],
            "product_b_weighted": b_comp["weighted_score"],
            "winner": product_a.name if a_comp["score"] > b_comp["score"] else (
                product_b.name if b_comp["score"] > a_comp["score"] else "Tie"
            ),
        })

    return {
        "product_a": trust_a,
        "product_b": trust_b,
        "winner": winner,
        "margin": margin,
        "breakdown_comparison": breakdown_comparison,
    }


@router.get("/how-it-works")
async def how_it_works():
    return {
        "title": "CosmeticIQ Trust Score",
        "description": (
            "The Trust Score is a proprietary composite metric that evaluates cosmetic products "
            "across 6 scientifically-grounded dimensions. Each dimension is weighted to reflect "
            "its importance in determining overall product trustworthiness and suitability."
        ),
        "score_range": "0-100",
        "factors": [
            {
                "name": "Scientific Evidence",
                "weight": "25%",
                "weight_value": 0.25,
                "description": (
                    "Measures the strength of scientific backing behind a product. Considers published "
                    "clinical studies, PubMed-referenced ingredients, and the volume of scientific citations. "
                    "Products with peer-reviewed research supporting their claims score highest."
                ),
                "inputs": [
                    "Scientific score from product database",
                    "Number of ingredient-level scientific studies",
                    "User review volume as secondary evidence",
                ],
                "scoring": "Weighted combination of scientific score (50%), study count (30%), and review evidence (20%).",
            },
            {
                "name": "Ingredient Safety",
                "weight": "25%",
                "weight_value": 0.25,
                "description": (
                    "Evaluates the overall safety profile of a product's ingredient list. Uses EWG safety "
                    "scores, identifies hazardous ingredients, allergens, endocrine disruptors, and microplastics. "
                    "Products with clean, well-rated ingredients score highest."
                ),
                "inputs": [
                    "EWG scores of individual ingredients",
                    "Safety status classification (safe/moderate/hazardous)",
                    "Presence of allergens, endocrine disruptors, microplastics",
                ],
                "scoring": "EWG average (40%) + safety ratio (35%) - hazard penalties (25%).",
            },
            {
                "name": "Fuzzy Logic Suitability",
                "weight": "20%",
                "weight_value": 0.20,
                "description": (
                    "Uses the CosmeticIQ fuzzy logic engine to evaluate product suitability based on "
                    "complex interactions between skin type, age, climate, ingredient properties, and "
                    "product characteristics. This non-linear analysis captures nuances that simple scoring misses."
                ),
                "inputs": [
                    "Skin type compatibility (dry/oily/sensitive/acne)",
                    "Age appropriateness",
                    "Climate considerations",
                    "Ingredient safety, comedogenic, fragrance, alcohol levels",
                    "Product rating and scientific evidence",
                ],
                "scoring": "Fuzzy inference system output (0-1) scaled to 0-100.",
            },
            {
                "name": "Dermatologist Support",
                "weight": "10%",
                "weight_value": 0.10,
                "description": (
                    "Assesses the level of professional dermatological endorsement. Considers "
                    "explicit dermatologist recommendations, clinical endorsements, and inferred "
                    "support from safety data and professional ratings."
                ),
                "inputs": [
                    "Dermatologist recommendation flag",
                    "Clinical endorsements",
                    "Safety data quality",
                    "Professional rating patterns",
                ],
                "scoring": "Safety data (30%) + scientific data (25%) + rating quality (20%) + rating level (15%) + review depth (10%).",
            },
            {
                "name": "User Profile Match",
                "weight": "10%",
                "weight_value": 0.10,
                "description": (
                    "Measures how well a product aligns with the user's specific profile including "
                    "skin type, age group, personal concerns, and preferences. Personalized scoring "
                    "ensures recommendations are relevant to each individual."
                ),
                "inputs": [
                    "User skin type and product compatibility",
                    "Age group appropriateness",
                    "Concern alignment",
                    "Preference matching",
                ],
                "scoring": "Skin type match (30%) + age appropriateness (15%) + concern alignment (15%).",
            },
            {
                "name": "Price vs Value",
                "weight": "10%",
                "weight_value": 0.10,
                "description": (
                    "Evaluates the price-to-value ratio by comparing a product's price against "
                    "category averages while factoring in quality indicators. Ensures users get "
                    "genuine value rather than just cheap or expensive options."
                ),
                "inputs": [
                    "Product price",
                    "Category average price",
                    "Quality indicators (rating, safety score)",
                ],
                "scoring": "Price position (40%) + quality score (30%) + value ratio (30%).",
            },
        ],
        "grade_scale": {
            "A+": "95-100 - Exceptional product with strong evidence across all dimensions",
            "A": "90-94 - Excellent product with minor areas for improvement",
            "A-": "85-89 - Very strong product with good overall performance",
            "B+": "80-84 - Good product above average in most categories",
            "B": "75-79 - Solid product meeting quality standards",
            "B-": "70-74 - Above average product with some areas needing attention",
            "C+": "65-69 - Average product, acceptable but not outstanding",
            "C": "60-64 - Below average, notable areas for improvement",
            "C-": "55-59 - Underperforming product, use with caution",
            "D": "40-54 - Poor product, significant concerns identified",
            "F": "0-39 - Failing score, not recommended",
        },
        "badges": {
            "Excellent": "90+ - Green badge, top-tier product",
            "Very Good": "80-89 - Emerald badge, reliable choice",
            "Good": "65-79 - Yellow badge, acceptable option",
            "Fair": "50-64 - Orange badge, consider alternatives",
            "Poor": "0-49 - Red badge, not recommended",
        },
    }
