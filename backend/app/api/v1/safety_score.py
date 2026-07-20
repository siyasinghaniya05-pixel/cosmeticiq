from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import math

router = APIRouter(prefix="/safety-score", tags=["Cosmetic Safety Score"])

# ── Fuzzy Logic Engine ──────────────────────────────────────────────

# Membership functions for fuzzy inputs
def _trapezoidal(x: float, a: float, b: float, c: float, d: float) -> float:
    if x <= a or x >= d: return 0.0
    if b <= x <= c: return 1.0
    if a < x < b: return (x - a) / (b - a) if b != a else 0.0
    if c < x < d: return (d - x) / (d - c) if d != c else 0.0
    return 0.0

def _triangular(x: float, a: float, b: float, c: float) -> float:
    if x <= a or x >= c: return 0.0
    if x == b: return 1.0
    if a < x < b: return (x - a) / (b - a) if b != a else 0.0
    if b < x < c: return (c - x) / (c - b) if c != b else 0.0
    return 0.0

def _sigmoid(x: float, center: float, steepness: float = 5) -> float:
    return 1 / (1 + math.exp(-steepness * (x - center)))

# Fuzzy sets for output scoring
def _fuzzy_safe(score: float) -> float:
    return _trapezoidal(score, 80, 90, 100, 100)

def _fuzzy_caution(score: float) -> float:
    return _triangular(score, 50, 70, 90)

def _fuzzy_risky(score: float) -> float:
    return _trapezoidal(score, 0, 0, 30, 60)


# ── Ingredient Safety Database ──────────────────────────────────────

INGREDIENT_SAFETY: Dict[str, Dict[str, Any]] = {
    "water": {"safety": 100, "ewg": 1, "comedogenic": 0, "irritation": 0, "allergen": False, "environmental": 95, "evidence": 100, "cost_efficiency": 100, "category": "solvent"},
    "glycerin": {"safety": 98, "ewg": 1, "comedogenic": 0, "irritation": 0, "allergen": False, "environmental": 95, "evidence": 98, "cost_efficiency": 98, "category": "humectant"},
    "hyaluronic acid": {"safety": 97, "ewg": 1, "comedogenic": 0, "irritation": 0, "allergen": False, "environmental": 90, "evidence": 95, "cost_efficiency": 85, "category": "humectant"},
    "niacinamide": {"safety": 96, "ewg": 1, "comedogenic": 0, "irritation": 2, "allergen": False, "environmental": 92, "evidence": 94, "cost_efficiency": 95, "category": "active"},
    "ceramides": {"safety": 97, "ewg": 1, "comedogenic": 1, "irritation": 0, "allergen": False, "environmental": 88, "evidence": 93, "cost_efficiency": 70, "category": "emollient"},
    "retinol": {"safety": 72, "ewg": 3, "comedogenic": 0, "irritation": 35, "allergen": False, "environmental": 85, "evidence": 96, "cost_efficiency": 80, "category": "active"},
    "vitamin c": {"safety": 88, "ewg": 1, "comedogenic": 0, "irritation": 12, "allergen": False, "environmental": 88, "evidence": 95, "cost_efficiency": 75, "category": "antioxidant"},
    "glycolic acid": {"safety": 78, "ewg": 2, "comedogenic": 0, "irritation": 25, "allergen": False, "environmental": 85, "evidence": 92, "cost_efficiency": 88, "category": "exfoliant"},
    "salicylic acid": {"safety": 80, "ewg": 2, "comedogenic": 0, "irritation": 20, "allergen": True, "environmental": 82, "evidence": 94, "cost_efficiency": 90, "category": "exfoliant"},
    "benzoyl peroxide": {"safety": 68, "ewg": 4, "comedogenic": 0, "irritation": 40, "allergen": True, "environmental": 60, "evidence": 93, "cost_efficiency": 85, "category": "antibacterial"},
    "fragrance": {"safety": 45, "ewg": 8, "comedogenic": 0, "irritation": 50, "allergen": True, "environmental": 40, "evidence": 20, "cost_efficiency": 90, "category": "fragrance"},
    "parfum": {"safety": 45, "ewg": 8, "comedogenic": 0, "irritation": 50, "allergen": True, "environmental": 40, "evidence": 20, "cost_efficiency": 90, "category": "fragrance"},
    "paraben": {"safety": 62, "ewg": 5, "comedogenic": 0, "irritation": 8, "allergen": True, "environmental": 55, "evidence": 75, "cost_efficiency": 95, "category": "preservative"},
    "methylparaben": {"safety": 60, "ewg": 5, "comedogenic": 0, "irritation": 8, "allergen": True, "environmental": 55, "evidence": 75, "cost_efficiency": 95, "category": "preservative"},
    "phenoxyethanol": {"safety": 82, "ewg": 3, "comedogenic": 0, "irritation": 5, "allergen": False, "environmental": 78, "evidence": 80, "cost_efficiency": 90, "category": "preservative"},
    "sodium lauryl sulfate": {"safety": 50, "ewg": 5, "comedogenic": 0, "irritation": 45, "allergen": False, "environmental": 35, "evidence": 85, "cost_efficiency": 95, "category": "surfactant"},
    "sodium laureth sulfate": {"safety": 58, "ewg": 4, "comedogenic": 0, "irritation": 35, "allergen": False, "environmental": 38, "evidence": 85, "cost_efficiency": 95, "category": "surfactant"},
    "lanolin": {"safety": 55, "ewg": 3, "comedogenic": 35, "irritation": 30, "allergen": True, "environmental": 70, "evidence": 70, "cost_efficiency": 80, "category": "emollient"},
    "mineral oil": {"safety": 70, "ewg": 2, "comedogenic": 25, "irritation": 5, "allergen": False, "environmental": 30, "evidence": 75, "cost_efficiency": 95, "category": "emollient"},
    "petrolatum": {"safety": 65, "ewg": 2, "comedogenic": 30, "irritation": 3, "allergen": False, "environmental": 25, "evidence": 80, "cost_efficiency": 95, "category": "occlusive"},
    "coconut oil": {"safety": 60, "ewg": 1, "comedogenic": 45, "irritation": 8, "allergen": True, "environmental": 70, "evidence": 65, "cost_efficiency": 90, "category": "emollient"},
    "cocos nucifera oil": {"safety": 60, "ewg": 1, "comedogenic": 45, "irritation": 8, "allergen": True, "environmental": 70, "evidence": 65, "cost_efficiency": 90, "category": "emollient"},
    "alcohol denat": {"safety": 40, "ewg": 5, "comedogenic": 0, "irritation": 55, "allergen": False, "environmental": 60, "evidence": 70, "cost_efficiency": 90, "category": "solvent"},
    "witch hazel": {"safety": 72, "ewg": 3, "comedogenic": 0, "irritation": 18, "allergen": False, "environmental": 85, "evidence": 72, "cost_efficiency": 88, "category": "astringent"},
    "tea tree oil": {"safety": 68, "ewg": 4, "comedogenic": 0, "irritation": 30, "allergen": True, "environmental": 75, "evidence": 82, "cost_efficiency": 80, "category": "essential oil"},
    "lavender oil": {"safety": 55, "ewg": 5, "comedogenic": 0, "irritation": 35, "allergen": True, "environmental": 70, "evidence": 45, "cost_efficiency": 80, "category": "essential oil"},
    "eucalyptus oil": {"safety": 52, "ewg": 5, "comedogenic": 0, "irritation": 40, "allergen": True, "environmental": 70, "evidence": 40, "cost_efficiency": 80, "category": "essential oil"},
    "peppermint oil": {"safety": 50, "ewg": 5, "comedogenic": 0, "irritation": 42, "allergen": True, "environmental": 72, "evidence": 35, "cost_efficiency": 80, "category": "essential oil"},
    "formaldehyde": {"safety": 10, "ewg": 10, "comedogenic": 0, "irritation": 60, "allergen": True, "environmental": 10, "evidence": 100, "cost_efficiency": 95, "category": "preservative"},
    "dmdm hydantoin": {"safety": 30, "ewg": 7, "comedogenic": 0, "irritation": 25, "allergen": True, "environmental": 40, "evidence": 80, "cost_efficiency": 95, "category": "preservative"},
    "imidazolidinyl urea": {"safety": 35, "ewg": 6, "comedogenic": 0, "irritation": 20, "allergen": True, "environmental": 45, "evidence": 78, "cost_efficiency": 95, "category": "preservative"},
    "triclosan": {"safety": 25, "ewg": 7, "comedogenic": 0, "irritation": 15, "allergen": False, "environmental": 15, "evidence": 70, "cost_efficiency": 80, "category": "antibacterial"},
    "bht": {"safety": 45, "ewg": 6, "comedogenic": 0, "irritation": 5, "allergen": False, "environmental": 30, "evidence": 65, "cost_efficiency": 90, "category": "antioxidant"},
    "oxybenzone": {"safety": 30, "ewg": 8, "comedogenic": 0, "irritation": 15, "allergen": True, "environmental": 10, "evidence": 75, "cost_efficiency": 70, "category": "sunscreen filter"},
    "octinoxate": {"safety": 35, "ewg": 6, "comedogenic": 0, "irritation": 12, "allergen": True, "environmental": 20, "evidence": 75, "cost_efficiency": 75, "category": "sunscreen filter"},
    "zinc oxide": {"safety": 95, "ewg": 1, "comedogenic": 0, "irritation": 3, "allergen": False, "environmental": 85, "evidence": 98, "cost_efficiency": 75, "category": "sunscreen filter"},
    "titanium dioxide": {"safety": 93, "ewg": 1, "comedogenic": 0, "irritation": 2, "allergen": False, "environmental": 80, "evidence": 97, "cost_efficiency": 78, "category": "sunscreen filter"},
    "squalane": {"safety": 96, "ewg": 1, "comedogenic": 0, "irritation": 0, "allergen": False, "environmental": 88, "evidence": 88, "cost_efficiency": 72, "category": "emollient"},
    "centella asiatica": {"safety": 94, "ewg": 1, "comedogenic": 0, "irritation": 0, "allergen": False, "environmental": 90, "evidence": 85, "cost_efficiency": 78, "category": "botanical"},
    "bakuchiol": {"safety": 92, "ewg": 1, "comedogenic": 0, "irritation": 3, "allergen": False, "environmental": 90, "evidence": 80, "cost_efficiency": 65, "category": "active"},
    "kojic acid": {"safety": 82, "ewg": 2, "comedogenic": 0, "irritation": 15, "allergen": False, "environmental": 85, "evidence": 82, "cost_efficiency": 78, "category": "brightening"},
    "arbutin": {"safety": 90, "ewg": 1, "comedogenic": 0, "irritation": 3, "allergen": False, "environmental": 88, "evidence": 82, "cost_efficiency": 72, "category": "brightening"},
    "azelaic acid": {"safety": 85, "ewg": 2, "comedogenic": 0, "irritation": 10, "allergen": False, "environmental": 88, "evidence": 88, "cost_efficiency": 75, "category": "active"},
    "peptides": {"safety": 93, "ewg": 1, "comedogenic": 0, "irritation": 2, "allergen": False, "environmental": 85, "evidence": 82, "cost_efficiency": 60, "category": "active"},
    "panthenol": {"safety": 96, "ewg": 1, "comedogenic": 0, "irritation": 0, "allergen": False, "environmental": 92, "evidence": 90, "cost_efficiency": 85, "category": "hydrating"},
    "allantoin": {"safety": 95, "ewg": 1, "comedogenic": 0, "irritation": 0, "allergen": False, "environmental": 92, "evidence": 88, "cost_efficiency": 88, "category": "soothing"},
    "tocopherol": {"safety": 95, "ewg": 1, "comedogenic": 2, "irritation": 0, "allergen": False, "environmental": 90, "evidence": 90, "cost_efficiency": 82, "category": "antioxidant"},
    "ferulic acid": {"safety": 94, "ewg": 1, "comedogenic": 0, "irritation": 2, "allergen": False, "environmental": 88, "evidence": 88, "cost_efficiency": 72, "category": "antioxidant"},
    "collagen": {"safety": 90, "ewg": 1, "comedogenic": 0, "irritation": 0, "allergen": False, "environmental": 70, "evidence": 65, "cost_efficiency": 50, "category": "protein"},
    "dimethicone": {"safety": 82, "ewg": 2, "comedogenic": 15, "irritation": 2, "allergen": False, "environmental": 40, "evidence": 80, "cost_efficiency": 90, "category": "emollient"},
    "shea butter": {"safety": 92, "ewg": 1, "comedogenic": 20, "irritation": 2, "allergen": False, "environmental": 85, "evidence": 78, "cost_efficiency": 85, "category": "emollient"},
    "cocoa butter": {"safety": 88, "ewg": 1, "comedogenic": 40, "irritation": 2, "allergen": False, "environmental": 75, "evidence": 72, "cost_efficiency": 90, "category": "emollient"},
    "kaolin": {"safety": 90, "ewg": 1, "comedogenic": 0, "irritation": 3, "allergen": False, "environmental": 85, "evidence": 75, "cost_efficiency": 90, "category": "clay"},
    "talc": {"safety": 72, "ewg": 3, "comedogenic": 0, "irritation": 8, "allergen": False, "environmental": 60, "evidence": 70, "cost_efficiency": 95, "category": "mineral"},
    "iron oxide": {"safety": 88, "ewg": 1, "comedogenic": 0, "irritation": 0, "allergen": False, "environmental": 80, "evidence": 90, "cost_efficiency": 90, "category": "pigment"},
    "mica": {"safety": 85, "ewg": 2, "comedogenic": 0, "irritation": 5, "allergen": False, "environmental": 65, "evidence": 80, "cost_efficiency": 85, "category": "mineral"},
}

# ── Fuzzy Rules (27 rules for 7 inputs) ────────────────────────────
# Inputs: ingredient_safety, ewg, comedogenic, irritation, allergen, environmental, evidence
# Each rule maps input fuzzy sets to output fuzzy sets with weights

def _fuzzy_safety_score(inputs: Dict[str, float]) -> Dict[str, Any]:
    """
    Fuzzy logic engine: takes 7 input dimensions, applies 27 rules, returns
    defuzzified safety score + component breakdown.
    """
    ing_safety = inputs.get("ingredient_safety", 50)
    ewg = inputs.get("ewg", 5)  # 1-10 scale, lower = better
    comedogenic = inputs.get("comedogenic", 0)  # 0-5
    irritation = inputs.get("irritation", 0)  # 0-100
    allergen = inputs.get("allergen", 0)  # 0 or 1
    environmental = inputs.get("environmental", 50)
    evidence = inputs.get("evidence", 50)

    # Normalize EWG to 0-100 (1=100, 10=0)
    ewg_norm = max(0, (10 - ewg) / 9 * 100)

    # Normalize comedogenic to 0-100 (0=100, 5=0)
    comedo_norm = max(0, (5 - comedogenic) / 5 * 100)

    # Irritation is already 0-100 (inverted: lower = better)
    irritation_norm = max(0, 100 - irritation)

    # Allergen: boolean -> 100 or 0
    allergen_norm = 0 if allergen else 100

    # ── Fuzzy Membership Calculations ──
    # Each variable gets fuzzy memberships for {safe, moderate, risky}
    memberships = {
        "ing_safety": {"safe": _trapezoidal(ing_safety, 80, 90, 100, 100), "moderate": _triangular(ing_safety, 40, 65, 85), "risky": _trapezoidal(ing_safety, 0, 0, 30, 55)},
        "ewg": {"safe": _trapezoidal(ewg_norm, 70, 85, 100, 100), "moderate": _triangular(ewg_norm, 30, 55, 75), "risky": _trapezoidal(ewg_norm, 0, 0, 30, 50)},
        "comedogenic": {"safe": _trapezoidal(comedo_norm, 80, 90, 100, 100), "moderate": _triangular(comedo_norm, 40, 60, 80), "risky": _trapezoidal(comedo_norm, 0, 0, 25, 45)},
        "irritation": {"safe": _trapezoidal(irritation_norm, 80, 90, 100, 100), "moderate": _triangular(irritation_norm, 40, 65, 85), "risky": _trapezoidal(irritation_norm, 0, 0, 25, 50)},
        "allergen": {"safe": allergen_norm / 100, "moderate": 0, "risky": (100 - allergen_norm) / 100},
        "environmental": {"safe": _trapezoidal(environmental, 75, 85, 100, 100), "moderate": _triangular(environmental, 35, 60, 80), "risky": _trapezoidal(environmental, 0, 0, 25, 45)},
        "evidence": {"safe": _trapezoidal(evidence, 80, 90, 100, 100), "moderate": _triangular(evidence, 40, 65, 85), "risky": _trapezoidal(evidence, 0, 0, 30, 50)},
    }

    # ── 27 Fuzzy Rules ──
    rules = [
        # Rule weights represent importance: (condition_fn, output_level, weight)
        # SAFE rules (push score higher)
        (min(memberships["ing_safety"]["safe"], memberships["ewg"]["safe"]), "safe", 1.0),
        (min(memberships["ing_safety"]["safe"], memberships["evidence"]["safe"]), "safe", 0.9),
        (min(memberships["environmental"]["safe"], memberships["evidence"]["safe"]), "safe", 0.7),
        (min(memberships["ing_safety"]["safe"], memberships["irritation"]["safe"]), "safe", 0.95),
        (min(memberships["allergen"]["safe"], memberships["comedogenic"]["safe"]), "safe", 0.8),
        (min(memberships["ewg"]["safe"], memberships["environmental"]["safe"]), "safe", 0.7),
        (min(memberships["irritation"]["safe"], memberships["allergen"]["safe"]), "safe", 0.85),
        (min(memberships["comedogenic"]["safe"], memberships["ewg"]["safe"]), "safe", 0.75),
        (min(memberships["evidence"]["safe"], memberships["allergen"]["safe"]), "safe", 0.7),

        # MODERATE rules (push score to middle)
        (min(memberships["ing_safety"]["moderate"], memberships["ewg"]["moderate"]), "moderate", 0.8),
        (min(memberships["irritation"]["moderate"], memberships["comedogenic"]["moderate"]), "moderate", 0.7),
        (min(memberships["evidence"]["moderate"], memberships["environmental"]["moderate"]), "moderate", 0.6),
        (min(memberships["ing_safety"]["moderate"], memberships["allergen"]["moderate"]), "moderate", 0.7),
        (min(memberships["ewg"]["moderate"], memberships["irritation"]["moderate"]), "moderate", 0.75),
        (min(memberships["environmental"]["moderate"], memberships["evidence"]["moderate"]), "moderate", 0.6),
        (min(memberships["comedogenic"]["moderate"], memberships["allergen"]["moderate"]), "moderate", 0.65),
        (min(memberships["ing_safety"]["moderate"], memberships["irritation"]["moderate"]), "moderate", 0.7),
        (min(memberships["ewg"]["moderate"], memberships["allergen"]["moderate"]), "moderate", 0.65),

        # RISKY rules (push score lower)
        (min(memberships["ing_safety"]["risky"], memberships["ewg"]["risky"]), "risky", 1.0),
        (min(memberships["irritation"]["risky"], memberships["allergen"]["risky"]), "risky", 0.95),
        (min(memberships["ing_safety"]["risky"], memberships["irritation"]["risky"]), "risky", 0.9),
        (min(memberships["ewg"]["risky"], memberships["allergen"]["risky"]), "risky", 0.85),
        (min(memberships["environmental"]["risky"], memberships["evidence"]["risky"]), "risky", 0.7),
        (min(memberships["comedogenic"]["risky"], memberships["ewg"]["risky"]), "risky", 0.8),
        (min(memberships["irritation"]["risky"], memberships["environmental"]["risky"]), "risky", 0.7),
        (min(memberships["ing_safety"]["risky"], memberships["environmental"]["risky"]), "risky", 0.75),
        (min(memberships["allergen"]["risky"], memberships["evidence"]["risky"]), "risky", 0.65),
    ]

    # ── Aggregation ──
    safe_agg = max(r[0] * r[2] for r in rules if r[1] == "safe") if any(r[1] == "safe" for r in rules) else 0
    moderate_agg = max(r[0] * r[2] for r in rules if r[1] == "moderate") if any(r[1] == "moderate" for r in rules) else 0
    risky_agg = max(r[0] * r[2] for r in rules if r[1] == "risky") if any(r[1] == "risky" for r in rules) else 0

    total_agg = safe_agg + moderate_agg + risky_agg
    if total_agg == 0:
        total_agg = 1

    # ── Defuzzification (weighted average) ──
    safe_centroid = 92
    moderate_centroid = 65
    risky_centroid = 25
    defuzzified_score = (
        (safe_agg * safe_centroid + moderate_agg * moderate_centroid + risky_agg * risky_centroid) / total_agg
    )

    # Clamp
    final_score = max(0, min(100, round(defuzzified_score, 1)))

    # Component scores
    components = {
        "ingredient_safety": round(ing_safety, 1),
        "toxicological_risk": round(ewg_norm, 1),
        "comedogenic_risk": round(comedo_norm, 1),
        "irritation_safety": round(irritation_norm, 1),
        "allergen_safety": round(allergen_norm, 1),
        "environmental_safety": round(environmental, 1),
        "evidence_strength": round(evidence, 1),
    }

    # Safety grade
    if final_score >= 90: grade = "A+"
    elif final_score >= 85: grade = "A"
    elif final_score >= 80: grade = "A-"
    elif final_score >= 75: grade = "B+"
    elif final_score >= 70: grade = "B"
    elif final_score >= 65: grade = "B-"
    elif final_score >= 60: grade = "C+"
    elif final_score >= 55: grade = "C"
    elif final_score >= 45: grade = "C-"
    elif final_score >= 35: grade = "D"
    else: grade = "F"

    # Fuzzy membership outputs
    fuzzy_output = {
        "safe_membership": round(_fuzzy_safe(final_score), 3),
        "caution_membership": round(_fuzzy_caution(final_score), 3),
        "risky_membership": round(_fuzzy_risky(final_score), 3),
    }

    return {
        "score": final_score,
        "grade": grade,
        "components": components,
        "fuzzy_output": fuzzy_output,
        "rule_activations": {
            "safe_rules": round(safe_agg, 3),
            "moderate_rules": round(moderate_agg, 3),
            "risky_rules": round(risky_agg, 3),
        },
    }


def _find_ingredient(name: str) -> Optional[Dict]:
    lower = name.lower().strip()
    if lower in INGREDIENT_SAFETY:
        return {"id": lower, **INGREDIENT_SAFETY[lower]}
    # Alias matching
    aliases = {
        "vitamin c": "vitamin c", "l-ascorbic acid": "vitamin c", "ascorbic acid": "vitamin c",
        "vitamin a": "retinol", "retinal": "retinol", "retinaldehyde": "retinol",
        "b3": "niacinamide", "vitamin b3": "niacinamide", "nicotinamide": "niacinamide",
        "ha": "hyaluronic acid", "sodium hyaluronate": "hyaluronic acid",
        "bha": "salicylic acid", "aha": "glycolic acid",
        "sls": "sodium lauryl sulfate", "sles": "sodium laureth sulfate",
        "bp": "benzoyl peroxide", "benzoyl": "benzoyl peroxide",
        "cica": "centella asiatica", "centella": "centella asiatica",
        "bakuchiol": "bakuchiol", "kojic": "kojic acid",
        "azelaic": "azelaic acid", "b5": "panthenol", "vitamin b5": "panthenol",
        "squalane": "squalane", "phytosphingosine": "ceramides",
        "zinc oxide sunscreen": "zinc oxide", "titanium dioxide sunscreen": "titanium dioxide",
        "parfum": "fragrance", "perfume": "fragrance",
        "tocopherol": "tocopherol", "vitamin e": "tocopherol",
        "ferulic": "ferulic acid", "allantoin": "allantoin",
        "dimethicone": "dimethicone", "silicone": "dimethicone",
        "mineral oil": "mineral oil", "petrolatum": "petrolatum",
        "vaseline": "petrolatum", "lanolin": "lanolin",
        "coconut oil": "coconut oil", "cocos nucifera": "coconut oil",
        "shea butter": "shea butter", "butyrospermum parkii": "shea butter",
        "cocoa butter": "cocoa butter", "theobroma cacao": "cocoa butter",
        "mica": "mica", "talc": "talc", "kaolin": "kaolin",
        "iron oxide": "iron oxide", "ci 77891": "titanium dioxide",
        "alcohol": "alcohol denat", "denatured alcohol": "alcohol denat",
        "witch hazel": "witch hazel", "hamamelis": "witch hazel",
        "tea tree": "tea tree oil", "melaleuca": "tea tree oil",
        "lavender": "lavender oil", "eucalyptus": "eucalyptus oil",
        "peppermint": "peppermint oil", "mentha piperita": "peppermint oil",
        "triclosan": "triclosan", "bht": "bht",
        "oxybenzone": "oxybenzone", "octinoxate": "octinoxate",
        "formaldehyde": "formaldehyde", "dmdm": "dmdm hydantoin",
        "imidazolidinyl": "imidazolidinyl urea",
        "collagen": "collagen", "peptides": "peptides",
        "retinyl palmitate": "retinol", "retinyl acetate": "retinol",
        "arbutin": "arbutin", "tranexamic": "azelaic acid",
    }
    canonical = aliases.get(lower)
    if canonical and canonical in INGREDIENT_SAFETY:
        return {"id": canonical, **INGREDIENT_SAFETY[canonical]}
    return None


# ── Sample Products ─────────────────────────────────────────────────

PRODUCT_SAMPLES: List[Dict[str, Any]] = [
    {"id": "p1", "name": "Gentle Daily Cleanser", "brand": "CeraVe", "category": "cleanser", "price": 15.99,
     "ingredients": ["water", "glycerin", "ceramides", "hyaluronic acid", "niacinamide", "phenoxyethanol"]},
    {"id": "p2", "name": "Advanced Retinol Serum", "brand": "The Ordinary", "category": "serum", "price": 8.90,
     "ingredients": ["water", "retinol", "squalane", "glycerin", "hyaluronic acid"]},
    {"id": "p3", "name": "Brightening Vitamin C Serum", "brand": "SkinCeuticals", "category": "serum", "price": 166.00,
     "ingredients": ["water", "vitamin c", "ferulic acid", "tocopherol", "hyaluronic acid"]},
    {"id": "p4", "name": "Deep Clean Acne Wash", "brand": "Neutrogena", "category": "cleanser", "price": 9.99,
     "ingredients": ["water", "salicylic acid", "sodium laureth sulfate", "tea tree oil", "eucalyptus oil", "alcohol denat"]},
    {"id": "p5", "name": "Rich Body Lotion", "brand": "Jergens", "category": "body care", "price": 7.49,
     "ingredients": ["water", "lanolin", "mineral oil", "petrolatum", "fragrance", "methylparaben", "mica"]},
    {"id": "p6", "name": "Mineral Sunscreen SPF50", "brand": "EltaMD", "category": "sunscreen", "price": 38.00,
     "ingredients": ["zinc oxide", "titanium dioxide", "hyaluronic acid", "niacinamide", "tocopherol", "squalane"]},
    {"id": "p7", "name": "Ultra Sensitive Moisturizer", "brand": "Vanicream", "category": "moisturizer", "price": 14.99,
     "ingredients": ["water", "glycerin", "ceramides", "squalane", "panthenol", "allantoin", "centella asiatica"]},
    {"id": "p8", "name": "Anti-Aging Night Cream", "brand": "Olay", "category": "moisturizer", "price": 24.99,
     "ingredients": ["water", "retinol", "niacinamide", "peptides", "hyaluronic acid", "tocopherol", "dimethicone"]},
    {"id": "p9", "name": "Refreshing Toner", "brand": "Thayers", "category": "toner", "price": 11.95,
     "ingredients": ["water", "witch hazel", "glycerin", "aloe vera", "hyaluronic acid"]},
    {"id": "p10", "name": "BB Cream SPF30", "brand": "Missha", "category": "makeup", "price": 18.00,
     "ingredients": ["water", "titanium dioxide", "zinc oxide", "dimethicone", "niacinamide", "hyaluronic acid", "tocopherol"]},
    {"id": "p11", "name": "Acne Spot Treatment", "brand": "Clean & Clear", "category": "treatment", "price": 7.99,
     "ingredients": ["benzoyl peroxide", "water", "glycerin", "alcohol denat", "carbomer", "fragrance"]},
    {"id": "p12", "name": "Luxury Eye Cream", "brand": "La Mer", "category": "eye care", "price": 265.00,
     "ingredients": ["water", "dimethicone", "tocopherol", "peptides", "hyaluronic acid", "centella asiatica", "tocopherol"]},
]


# ── Pydantic Schemas ────────────────────────────────────────────────

class IngredientSafetyRequest(BaseModel):
    ingredients: List[str] = Field(..., min_length=1)

class IngredientScore(BaseModel):
    id: str
    name: str
    category: str
    score: float
    grade: str
    components: Dict[str, float]
    fuzzy_output: Dict[str, float]
    details: Dict[str, Any]

class ProductSafetyRequest(BaseModel):
    product_id: Optional[str] = None
    ingredients: Optional[List[str]] = None
    product_name: Optional[str] = None

class ProductSafetyResult(BaseModel):
    product_name: str
    overall_score: float
    overall_grade: str
    ingredient_scores: List[IngredientScore]
    components: Dict[str, float]
    fuzzy_output: Dict[str, float]
    warnings: List[str]
    safe_for: List[str]
    avoid_if: List[str]

class LeaderboardEntry(BaseModel):
    product_id: str
    product_name: str
    brand: str
    category: str
    price: float
    score: float
    grade: str


# ── Endpoints ───────────────────────────────────────────────────────

@router.post("/check-ingredients", response_model=List[IngredientScore])
async def check_ingredients(req: IngredientSafetyRequest):
    results = []
    for ing_name in req.ingredients:
        ing = _find_ingredient(ing_name)
        if not ing:
            continue
        inputs = {
            "ingredient_safety": ing["safety"],
            "ewg": ing["ewg"],
            "comedogenic": ing["comedogenic"],
            "irritation": ing["irritation"],
            "allergen": float(ing["allergen"]),
            "environmental": ing["environmental"],
            "evidence": ing["evidence"],
        }
        fuzzy = _fuzzy_safety_score(inputs)
        results.append(IngredientScore(
            id=ing["id"], name=ing["id"].replace("_", " ").title(), category=ing["category"],
            score=fuzzy["score"], grade=fuzzy["grade"], components=fuzzy["components"],
            fuzzy_output=fuzzy["fuzzy_output"],
            details={"ewg": ing["ewg"], "comedogenic": ing["comedogenic"], "irritation": ing["irritation"],
                     "allergen": ing["allergen"], "cost_efficiency": ing["cost_efficiency"]},
        ))
    if not results:
        raise HTTPException(status_code=404, detail="No recognized ingredients found")
    return results


@router.post("/check-product", response_model=ProductSafetyResult)
async def check_product(req: ProductSafetyRequest):
    if req.product_id:
        product = next((p for p in PRODUCT_SAMPLES if p["id"] == req.product_id), None)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        ingredients_list = product["ingredients"]
        name = product["name"]
    elif req.ingredients and req.product_name:
        ingredients_list = req.ingredients
        name = req.product_name
    else:
        raise HTTPException(status_code=400, detail="Provide product_id or ingredients + product_name")

    ingredient_scores = []
    for ing_name in ingredients_list:
        ing = _find_ingredient(ing_name)
        if not ing:
            continue
        inputs = {
            "ingredient_safety": ing["safety"], "ewg": ing["ewg"],
            "comedogenic": ing["comedogenic"], "irritation": ing["irritation"],
            "allergen": float(ing["allergen"]), "environmental": ing["environmental"],
            "evidence": ing["evidence"],
        }
        fuzzy = _fuzzy_safety_score(inputs)
        ingredient_scores.append(IngredientScore(
            id=ing["id"], name=ing["id"].replace("_", " ").title(), category=ing["category"],
            score=fuzzy["score"], grade=fuzzy["grade"], components=fuzzy["components"],
            fuzzy_output=fuzzy["fuzzy_output"],
            details={"ewg": ing["ewg"], "comedogenic": ing["comedogenic"], "irritation": ing["irritation"],
                     "allergen": ing["allergen"], "cost_efficiency": ing["cost_efficiency"]},
        ))

    if not ingredient_scores:
        raise HTTPException(status_code=404, detail="No recognized ingredients found")

    # Overall score: weighted by ingredient importance (last = most concentrated usually)
    n = len(ingredient_scores)
    weights = [0.8 + 0.4 * (i / max(n - 1, 1)) for i in range(n)]
    total_weight = sum(weights)
    overall = sum(s.score * w for s, w in zip(ingredient_scores, weights)) / total_weight

    # Aggregate components
    agg_components = {}
    for key in ingredient_scores[0].components:
        agg_components[key] = round(sum(s.components[key] for s in ingredient_scores) / len(ingredient_scores), 1)

    # Aggregate fuzzy output
    agg_fuzzy = {}
    for key in ingredient_scores[0].fuzzy_output:
        agg_fuzzy[key] = round(max(s.fuzzy_output[key] for s in ingredient_scores), 3)

    overall = round(max(0, min(100, overall)), 1)
    if overall >= 90: grade = "A+"
    elif overall >= 85: grade = "A"
    elif overall >= 80: grade = "A-"
    elif overall >= 75: grade = "B+"
    elif overall >= 70: grade = "B"
    elif overall >= 65: grade = "B-"
    elif overall >= 60: grade = "C+"
    elif overall >= 55: grade = "C"
    elif overall >= 45: grade = "C-"
    elif overall >= 35: grade = "D"
    else: grade = "F"

    # Warnings
    warnings = []
    for s in ingredient_scores:
        if s.score < 50:
            warnings.append(f"{s.name} scored {s.score}/100 — may be harmful")
        if s.details.get("allergen"):
            warnings.append(f"{s.name} is a known allergen")
        if s.details.get("irritation", 0) > 30:
            warnings.append(f"{s.name} has high irritation potential ({s.details['irritation']}%)")
    if agg_components.get("environmental_safety", 100) < 50:
        warnings.append("Low environmental safety score — consider eco-friendly alternatives")

    # Safe for / avoid if
    has_allergen = any(s.details.get("allergen") for s in ingredient_scores)
    has_irritant = any(s.details.get("irritation", 0) > 20 for s in ingredient_scores)
    has_comedogenic = any(s.details.get("comedogenic", 0) > 15 for s in ingredient_scores)
    has_evidence = agg_components.get("evidence_strength", 0) > 75

    safe_for = ["All skin types"] if not has_comedogenic and not has_irritant else []
    if has_comedogenic:
        safe_for = ["Dry", "Normal"] if not has_irritant else ["Normal only"]
    if has_evidence:
        safe_for.append("Evidence-based routine")

    avoid_if = []
    if has_allergen: avoid_if.append("Known fragrance/allergen sensitivities")
    if has_comedogenic: avoid_if.append("Acne-prone or oily skin")
    if has_irritant: avoid_if.append("Sensitive or compromised skin barrier")

    return ProductSafetyResult(
        product_name=name, overall_score=overall, overall_grade=grade,
        ingredient_scores=ingredient_scores, components=agg_components,
        fuzzy_output=agg_fuzzy, warnings=warnings,
        safe_for=safe_for, avoid_if=avoid_if,
    )


@router.get("/products")
async def get_products():
    return {"products": [{"id": p["id"], "name": p["name"], "brand": p["brand"],
                          "category": p["category"], "price": p["price"],
                          "ingredients": p["ingredients"]} for p in PRODUCT_SAMPLES]}


@router.post("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard():
    entries = []
    for p in PRODUCT_SAMPLES:
        inputs_sum = {"ingredient_safety": 0, "ewg": 0, "comedogenic": 0, "irritation": 0, "allergen": 0, "environmental": 0, "evidence": 0}
        count = 0
        for ing_name in p["ingredients"]:
            ing = _find_ingredient(ing_name)
            if ing:
                inputs_sum["ingredient_safety"] += ing["safety"]
                inputs_sum["ewg"] += ing["ewg"]
                inputs_sum["comedogenic"] += ing["comedogenic"]
                inputs_sum["irritation"] += ing["irritation"]
                inputs_sum["allergen"] += float(ing["allergen"])
                inputs_sum["environmental"] += ing["environmental"]
                inputs_sum["evidence"] += ing["evidence"]
                count += 1
        if count == 0:
            continue
        avg_inputs = {k: v / count for k, v in inputs_sum.items()}
        fuzzy = _fuzzy_safety_score(avg_inputs)
        entries.append(LeaderboardEntry(
            product_id=p["id"], product_name=p["name"], brand=p["brand"],
            category=p["category"], price=p["price"],
            score=fuzzy["score"], grade=fuzzy["grade"],
        ))
    entries.sort(key=lambda x: x.score, reverse=True)
    return entries


@router.get("/ingredient/{ingredient_name}")
async def get_ingredient_detail(ingredient_name: str):
    ing = _find_ingredient(ingredient_name)
    if not ing:
        raise HTTPException(status_code=404, detail=f"Ingredient '{ingredient_name}' not found in database")
    inputs = {
        "ingredient_safety": ing["safety"], "ewg": ing["ewg"],
        "comedogenic": ing["comedogenic"], "irritation": ing["irritation"],
        "allergen": float(ing["allergen"]), "environmental": ing["environmental"],
        "evidence": ing["evidence"],
    }
    fuzzy = _fuzzy_safety_score(inputs)
    return {
        "id": ing["id"], "name": ing["id"].replace("_", " ").title(),
        "category": ing["category"], "raw_data": {
            "safety": ing["safety"], "ewg": ing["ewg"], "comedogenic": ing["comedogenic"],
            "irritation": ing["irritation"], "allergen": ing["allergen"],
            "environmental": ing["environmental"], "evidence": ing["evidence"],
            "cost_efficiency": ing["cost_efficiency"],
        },
        "score": fuzzy["score"], "grade": fuzzy["grade"],
        "components": fuzzy["components"], "fuzzy_output": fuzzy["fuzzy_output"],
    }


@router.get("/how-it-works")
async def how_it_works():
    return {
        "title": "How the Cosmetic Safety Score Works",
        "description": "A patent-pending fuzzy logic engine that evaluates cosmetic safety across 7 dimensions.",
        "dimensions": [
            {"name": "Ingredient Safety", "weight": "Primary", "description": "Overall safety profile based on toxicological data, EWG ratings, and clinical studies", "range": "0-100"},
            {"name": "Toxicological Risk (EWG)", "weight": "High", "description": "Environmental Working Group safety rating inverted to a 0-100 scale (EWG 1=100, EWG 10=0)", "range": "0-100"},
            {"name": "Comedogenic Risk", "weight": "Medium", "description": "Pore-clogging potential inverted (0=comedogenic=0, 5=comedogenic=100 safe)", "range": "0-100"},
            {"name": "Irritation Safety", "weight": "High", "description": "Inverted irritation potential — higher score means less irritation risk", "range": "0-100"},
            {"name": "Allergen Safety", "weight": "High", "description": "Boolean: 100 if not a known allergen, 0 if it is", "range": "0 or 100"},
            {"name": "Environmental Safety", "weight": "Medium", "description": "Environmental impact of ingredient production and disposal", "range": "0-100"},
            {"name": "Evidence Strength", "weight": "Medium", "description": "Strength of clinical evidence supporting the ingredient's efficacy", "range": "0-100"},
        ],
        "fuzzy_logic": {
            "description": "Each input is fuzzified into 3 membership sets: Safe, Moderate, and Risky. 27 rules combine these memberships using MIN aggregation. The output is defuzzified using weighted average centroid method.",
            "rule_count": 27,
            "membership_functions": "Trapezoidal + Triangular",
            "defuzzification": "Weighted average centroid",
        },
        "grading": {
            "A+": "90-100 — Excellent safety profile",
            "A": "85-89 — Very safe",
            "A-": "80-84 — Safe with minor considerations",
            "B+": "75-79 — Generally safe",
            "B": "70-74 — Safe with some caveats",
            "B-": "65-69 — Moderate safety",
            "C+": "60-64 — Use with caution",
            "C": "55-59 — Significant concerns",
            "C-": "45-54 — High risk",
            "D": "35-44 — Very high risk",
            "F": "0-34 — Avoid",
        },
    }
