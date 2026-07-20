from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import re
from datetime import datetime

router = APIRouter(prefix="/beauty-coach", tags=["AI Beauty Coach"])

# ── Knowledge Base ──────────────────────────────────────────────────

SKINCARE_KB: Dict[str, Dict] = {
    "ingredients": {
        "retinol": {"type": "active", "ph": "acidic-friendly", "best_time": "night", "frequency": "start 1-2x/week", "pairs_with": ["hyaluronic acid", "ceramides", "niacinamide", "squalane"], "avoids": ["glycolic acid", "salicylic acid", "vitamin c", "benzoyl peroxide"], "skin_types": ["oily", "combination", "normal"], "caution": ["sensitive", "dry"], "spf_required": True},
        "vitamin c": {"type": "antioxidant", "ph": "low pH needed", "best_time": "morning", "frequency": "daily", "pairs_with": ["vitamin e", "ferulic acid", "hyaluronic acid", "niacinamide"], "avoids": ["retinol", "glycolic acid", "benzoyl peroxide"], "skin_types": ["all"], "caution": ["sensitive"], "spf_required": False},
        "niacinamide": {"type": "active", "ph": "any", "best_time": "morning or night", "frequency": "daily", "pairs_with": ["hyaluronic acid", "retinol", "vitamin c", "ceramides", "peptides"], "avoids": [], "skin_types": ["all"], "caution": [], "spf_required": False},
        "hyaluronic acid": {"type": "hydrating", "ph": "any", "best_time": "morning and night", "frequency": "daily", "pairs_with": ["retinol", "vitamin c", "niacinamide", "ceramides", "peptides", "squalane"], "avoids": [], "skin_types": ["all"], "caution": [], "spf_required": False},
        "glycolic acid": {"type": "exfoliant", "ph": "low pH", "best_time": "night", "frequency": "2-3x/week", "pairs_with": ["hyaluronic acid", "centella asiatica", "ceramides"], "avoids": ["retinol", "vitamin c", "salicylic acid"], "skin_types": ["oily", "normal", "combination"], "caution": ["sensitive", "dry"], "spf_required": True},
        "salicylic acid": {"type": "exfoliant", "ph": "low pH", "best_time": "night", "frequency": "1-2x/week", "pairs_with": ["hyaluronic acid", "niacinamide", "centella asiatica"], "avoids": ["retinol", "glycolic acid", "benzoyl peroxide"], "skin_types": ["oily", "combination"], "caution": ["sensitive", "dry"], "spf_required": True},
        "benzoyl peroxide": {"type": "antibacterial", "ph": "any", "best_time": "morning or night", "frequency": "daily or as needed", "pairs_with": ["hyaluronic acid", "ceramides", "centella asiatica", "niacinamide"], "avoids": ["retinol", "vitamin c"], "skin_types": ["oily", "combination"], "caution": ["sensitive", "dry"], "spf_required": False},
        "ceramides": {"type": "emollient", "ph": "any", "best_time": "morning and night", "frequency": "daily", "pairs_with": ["hyaluronic acid", "niacinamide", "retinol", "squalane", "peptides"], "avoids": [], "skin_types": ["all"], "caution": [], "spf_required": False},
        "aha": {"type": "exfoliant", "ph": "low pH", "best_time": "night", "frequency": "2-3x/week", "pairs_with": ["hyaluronic acid", "centella asiatica", "ceramides"], "avoids": ["retinol", "vitamin c", "salicylic acid"], "skin_types": ["oily", "normal", "combination"], "caution": ["sensitive", "dry"], "spf_required": True},
        "bha": {"type": "exfoliant", "ph": "low pH", "best_time": "night", "frequency": "1-2x/week", "pairs_with": ["hyaluronic acid", "niacinamide"], "avoids": ["retinol", "glycolic acid", "aha"], "skin_types": ["oily", "combination"], "caution": ["sensitive", "dry"], "spf_required": True},
        "peptides": {"type": "active", "ph": "any", "best_time": "night", "frequency": "daily", "pairs_with": ["hyaluronic acid", "retinol", "niacinamide", "ceramides", "vitamin e"], "avoids": ["aha", "bha"], "skin_types": ["all"], "caution": [], "spf_required": False},
        "centella asiatica": {"type": "soothing", "ph": "any", "best_time": "morning and night", "frequency": "daily", "pairs_with": ["retinol", "vitamin c", "hyaluronic acid", "ceramides", "niacinamide"], "avoids": [], "skin_types": ["all"], "caution": [], "spf_required": False},
        "squalane": {"type": "emollient", "ph": "any", "best_time": "morning and night", "frequency": "daily", "pairs_with": ["retinol", "hyaluronic acid", "ceramides", "peptides", "niacinamide"], "avoids": [], "skin_types": ["all"], "caution": [], "spf_required": False},
        "bakuchiol": {"type": "active", "ph": "any", "best_time": "morning and night", "frequency": "daily", "pairs_with": ["vitamin c", "hyaluronic acid", "niacinamide", "ceramides"], "avoids": ["retinol"], "skin_types": ["all"], "caution": [], "spf_required": False},
        "kojic acid": {"type": "brightening", "ph": "acidic", "best_time": "night", "frequency": "daily or every other day", "pairs_with": ["vitamin c", "niacinamide", "hyaluronic acid"], "avoids": ["glycolic acid", "retinol"], "skin_types": ["all"], "caution": ["sensitive"], "spf_required": True},
        "azelaic acid": {"type": "active", "ph": "acidic", "best_time": "morning or night", "frequency": "daily", "pairs_with": ["niacinamide", "hyaluronic acid", "retinol", "centella asiatica"], "avoids": [], "skin_types": ["all"], "caution": [], "spf_required": False},
        "tranexamic acid": {"type": "brightening", "ph": "any", "best_time": "morning or night", "frequency": "daily", "pairs_with": ["niacinamide", "vitamin c", "hyaluronic acid", "centella asiatica"], "avoids": [], "skin_types": ["all"], "caution": [], "spf_required": False},
        "panthenol": {"type": "hydrating", "ph": "any", "best_time": "morning and night", "frequency": "daily", "pairs_with": ["retinol", "hyaluronic acid", "ceramides", "niacinamide", "centella asiatica"], "avoids": [], "skin_types": ["all"], "caution": [], "spf_required": False},
        "allantoin": {"type": "soothing", "ph": "any", "best_time": "morning and night", "frequency": "daily", "pairs_with": ["retinol", "hyaluronic acid", "ceramides", "panthenol", "centella asiatica"], "avoids": [], "skin_types": ["all"], "caution": [], "spf_required": False},
        "tea tree oil": {"type": "antibacterial", "ph": "any", "best_time": "night", "frequency": "spot treatment as needed", "pairs_with": ["hyaluronic acid", "niacinamide", "centella asiatica"], "avoids": ["retinol", "glycolic acid"], "skin_types": ["oily", "combination"], "caution": ["sensitive", "dry"], "spf_required": False},
        "arbutin": {"type": "brightening", "ph": "any", "best_time": "morning or night", "frequency": "daily", "pairs_with": ["vitamin c", "niacinamide", "kojic acid", "hyaluronic acid"], "avoids": [], "skin_types": ["all"], "caution": [], "spf_required": True},
    },
    "routines": {
        "oily": {
            "morning": [
                {"step": 1, "product": "Gel or foaming cleanser", "why": "Removes excess oil without stripping"},
                {"step": 2, "product": "Niacinamide serum (5-10%)", "why": "Controls oil production and minimizes pores"},
                {"step": 3, "product": "Lightweight, oil-free moisturizer", "why": "Hydrates without adding shine"},
                {"step": 4, "product": "Broad spectrum SPF 30-50", "why": "Protects without clogging pores (look for 'non-comedogenic')"},
            ],
            "night": [
                {"step": 1, "product": "Oil cleanser or micellar water (to remove SPF)", "why": "Double cleansing ensures thorough SPF removal"},
                {"step": 2, "product": "Salicylic acid cleanser (2-3x/week) or regular cleanser", "why": "BHA clears pores and controls breakouts"},
                {"step": 3, "product": "BHA exfoliant or retinol (alternate nights)", "why": "Exfoliates and speeds cell turnover"},
                {"step": 4, "product": "Lightweight moisturizer or gel moisturizer", "why": "Maintains hydration balance overnight"},
            ],
        },
        "dry": {
            "morning": [
                {"step": 1, "product": "Cream or milky cleanser", "why": "Cleanses without stripping natural oils"},
                {"step": 2, "product": "Hyaluronic acid serum (on damp skin)", "why": "Draws moisture into the skin"},
                {"step": 3, "product": "Rich moisturizer with ceramides", "why": "Repairs and strengthens the skin barrier"},
                {"step": 4, "product": "Broad spectrum SPF 30+", "why": "Sun protection (use mineral/zinc-based for less irritation)"},
            ],
            "night": [
                {"step": 1, "product": "Gentle cream cleanser", "why": "Cleanses gently without overdrying"},
                {"step": 2, "product": "Hyaluronic acid serum", "why": "Deep hydration boost"},
                {"step": 3, "product": "Retinol (low concentration, 1-2x/week to start) or bakuchiol", "why": "Anti-aging with minimal irritation"},
                {"step": 4, "product": "Rich night cream or facial oil (squalane, rosehip)", "why": "Seals in moisture and supports barrier repair overnight"},
            ],
        },
        "combination": {
            "morning": [
                {"step": 1, "product": "Gentle foaming cleanser", "why": "Cleanses T-zone without overdrying cheeks"},
                {"step": 2, "product": "Vitamin C serum (T-zone and cheeks)", "why": "Antioxidant protection and brightening"},
                {"step": 3, "product": "Niacinamide serum (T-zone focus)", "why": "Controls oil in T-zone while hydrating cheeks"},
                {"step": 4, "product": "Lightweight moisturizer (different amounts by zone)", "why": "Less on T-zone, more on dry areas"},
                {"step": 5, "product": "Broad spectrum SPF 30-50", "why": "Daily sun protection"},
            ],
            "night": [
                {"step": 1, "product": "Gentle cleanser", "why": "Removes daily buildup"},
                {"step": 2, "product": "BHA on T-zone / AHA on cheeks (2-3x/week)", "why": "Zone-specific exfoliation"},
                {"step": 3, "product": "Retinol (2-3x/week)", "why": "Anti-aging and cell turnover"},
                {"step": 4, "product": "Moisturizer (lighter on T-zone)", "why": "Balanced hydration"},
            ],
        },
        "sensitive": {
            "morning": [
                {"step": 1, "product": "Micellar water or very gentle cleanser", "why": "Minimal irritation cleansing"},
                {"step": 2, "product": "Centella asiatica or panthenol serum", "why": "Soothes and calms redness"},
                {"step": 3, "product": "Barrier repair moisturizer (ceramides)", "why": "Strengthens fragile skin barrier"},
                {"step": 4, "product": "Mineral SPF 30-50 (zinc oxide/titanium dioxide)", "why": "Physical sunscreen is gentler than chemical"},
            ],
            "night": [
                {"step": 1, "product": "Very gentle, fragrance-free cleanser", "why": "Cleanses without disrupting barrier"},
                {"step": 2, "product": "Centella asiatica or allantoin treatment", "why": "Calms and repairs"},
                {"step": 3, "product": "Bakuchiol instead of retinol (if anti-aging needed)", "why": "Gentle retinol alternative without irritation"},
                {"step": 4, "product": "Rich, fragrance-free moisturizer", "why": "Overnight barrier repair"},
            ],
        },
        "normal": {
            "morning": [
                {"step": 1, "product": "Gentle cleanser", "why": "Maintains natural balance"},
                {"step": 2, "product": "Antioxidant serum (Vitamin C)", "why": "Environmental protection"},
                {"step": 3, "product": "Balanced moisturizer", "why": "Maintains hydration"},
                {"step": 4, "product": "Broad spectrum SPF 30+", "why": "Prevention is key"},
            ],
            "night": [
                {"step": 1, "product": "Cleanser", "why": "Removes the day"},
                {"step": 2, "product": "Exfoliant (AHA/BHA, 2-3x/week)", "why": "Cell turnover and texture"},
                {"step": 3, "product": "Retinol or niacinamide (alternate nights)", "why": "Anti-aging and maintenance"},
                {"step": 4, "product": "Moisturizer", "why": "Overnight hydration"},
            ],
        },
    },
}

# ── Intent Detection ────────────────────────────────────────────────

INTENT_PATTERNS = {
    "safe_for_skin_type": [
        r"is .+ safe for .+ skin",
        r"can .+ use .+",
        r"good for .+ skin",
        r"works for .+ skin",
        r"should .+ use",
        r"is .+ (good|bad|ok|okay) for",
        r"(oily|dry|sensitive|combination|normal) skin",
        r"适合.*皮肤",
    ],
    "routine": [
        r"(routine|regimen|schedule|order|steps)",
        r"(morning|night|am|pm) routine",
        r"(what|how) (should|do) i (apply|use|layer|order)",
        r"(step|steps) (for|in|to)",
        r"(recommend|suggest|give me) .* routine",
        r"(beginner|basic|simple) routine",
    ],
    "can_use_together": [
        r"(can|could) i (use|mix|combine|layer)",
        r"(use|mix|combine|layer) .+ (with|and|together|alongside)",
        r"(go together|work together|compatible)",
        r"(ok|okay) to (use|mix|combine|layer)",
        r"(conflict|conflicting|interact|interaction)",
        r"combine .+ and .+",
        r"mix .+ with .+",
    ],
    "ingredient_info": [
        r"(what is|what does|tell me about|explain) .+",
        r"(benefit|benefits|help|helps) of .+",
        r"(how does|how do) .+ work",
        r"(retinol|vitamin c|niacinamide|hyaluronic|salicylic|glycolic|aha|bha|peptide|ceramide|squalane|bakuchiol|kojic|azelaic|tranexamic)",
    ],
    "recommendation": [
        r"(recommend|suggest|what (should|would))",
        r"(best|good|top) (product|serum|moisturizer|cleanser|exfoliant) for",
        r"(what|which) (product|serum|moisturizer|cleanser) (for|to)",
    ],
    "order_of_application": [
        r"(order|layer|apply|sequence)",
        r"(what|which) (comes|goes) first",
        r"(before|after) (applying|using|putting)",
        r"(thinnest|thickest|thin|thick)",
    ],
    "greeting": [
        r"^(hi|hello|hey|sup|yo|hola|howdy|greetings)",
        r"^(good )?(morning|afternoon|evening|night)",
    ],
    "thanks": [
        r"(thanks|thank you|thx|ty|tysm|appreciate)",
    ],
}


# ── Response Generators ─────────────────────────────────────────────

def _detect_intent(text: str) -> str:
    lower = text.lower()
    for intent, patterns in INTENT_PATTERNS.items():
        for p in patterns:
            if re.search(p, lower):
                return intent
    return "general"


def _extract_ingredients(text: str) -> List[str]:
    lower = text.lower()
    found = []
    for ing in SKINCARE_KB["ingredients"]:
        if ing in lower or ing.replace(" ", "") in lower.replace(" ", ""):
            found.append(ing)
    # Also check common aliases
    aliases = {
        "vitamin a": "retinol", "b3": "niacinamide", "vitamin b3": "niacinamide",
        "ha": "hyaluronic acid", "salicyl": "salicylic acid",
        "bp": "benzoyl peroxide", "benzoyl": "benzoyl peroxide",
        "vitamin e": "squalane", "vit c": "vitamin c", "ascorbic": "vitamin c",
        "l-ascorbic": "vitamin c", "centella": "centella asiatica",
        "cica": "centella asiatica", "azelaic": "azelaic acid",
        "tranexamic": "tranexamic acid", "kojic": "kojic acid",
        "arbutin": "arbutin", "bakuchiol": "bakuchiol",
        "panthenol": "panthenol", "b5": "panthenol", "vitamin b5": "panthenol",
        "allantoin": "allantoin", "tea tree": "tea tree oil",
    }
    for alias, canonical in aliases.items():
        if alias in lower and canonical not in found:
            found.append(canonical)
    return found


def _extract_skin_type(text: str) -> Optional[str]:
    lower = text.lower()
    for st in ["oily", "dry", "combination", "sensitive", "normal"]:
        if st in lower:
            return st
    return None


def _respond_safe_for_skin(ingredients: List[str], skin_type: str) -> str:
    if not ingredients:
        return f"I couldn't identify any specific ingredients in your question. Could you tell me which ingredient or product you're asking about?\n\nFor {skin_type} skin, some generally great ingredients are:\n- **Niacinamide**: Balances oil, minimizes pores\n- **Hyaluronic acid**: Universal hydrator\n- **Ceramides**: Barrier support"
    
    responses = []
    for ing in ingredients:
        info = SKINCARE_KB["ingredients"].get(ing, {})
        name = ing.replace("_", " ").title()
        if not info:
            responses.append(f"**{name}**: I don't have specific data on this ingredient in my database, but generally consult a patch test before using new products.")
            continue
        
        is_safe = skin_type in info.get("skin_types", []) or "all" in info.get("skin_types", [])
        is_caution = skin_type in info.get("caution", [])
        
        if is_safe and not is_caution:
            emoji = "✅"
            verdict = f"{name} is **excellent** for {skin_type} skin!"
        elif is_safe and is_caution:
            emoji = "⚠️"
            verdict = f"{name} can work for {skin_type} skin, but **use with caution**."
        elif is_caution:
            emoji = "⚠️"
            verdict = f"{name} may cause irritation on {skin_type} skin. **Patch test first**."
        else:
            emoji = "❌"
            verdict = f"{name} is generally **not recommended** for {skin_type} skin."
        
        tips = []
        if info.get("best_time"):
            tips.append(f"Best used: {info['best_time']}")
        if info.get("frequency"):
            tips.append(f"Frequency: {info['frequency']}")
        if info.get("spf_required"):
            tips.append("⚠️ SPF required when using this")
        
        tip_str = "\n".join(f"  • {t}" for t in tips) if tips else ""
        responses.append(f"{emoji} **{verdict}**\n{tip_str}")
    
    return "\n\n".join(responses)


def _respond_together(ingredients: List[str]) -> str:
    if len(ingredients) < 2:
        return "Please name at least **two ingredients** to check if they work together. For example: 'Can I use retinol and vitamin C together?'"
    
    pairs_checked = []
    for i in range(len(ingredients)):
        for j in range(i + 1, len(ingredients)):
            a, b = ingredients[i], ingredients[j]
            info_a = SKINCARE_KB["ingredients"].get(a, {})
            avoids_a = [x.lower() for x in info_a.get("avoids", [])]
            info_b = SKINCARE_KB["ingredients"].get(b, {})
            avoids_b = [x.lower() for x in info_b.get("avoids", [])]
            pairs_with_a = [x.lower() for x in info_a.get("pairs_with", [])]
            pairs_with_b = [x.lower() for x in info_b.get("pairs_with", [])]
            
            name_a = a.replace("_", " ").title()
            name_b = b.replace("_", " ").title()
            
            if b in avoids_a or a in avoids_b:
                pairs_checked.append(f"❌ **{name_a} + {name_b}**: **Avoid together!** These can cause irritation, reduce effectiveness, or destabilize each other.\n\n💡 **How to use both safely**: Use one in the morning and the other at night, on alternate days.")
            elif a in pairs_with_a or b in pairs_with_b or a in pairs_with_b or b in pairs_with_a:
                pairs_checked.append(f"✅ **{name_a} + {name_b}**: **Great combination!** These ingredients complement each other well.")
            else:
                pairs_checked.append(f"⚠️ **{name_a} + {name_b}**: No known conflict, but no strong evidence they enhance each other either. Patch test and monitor your skin.")
    
    return "\n\n".join(pairs_checked)


def _respond_routine(skin_type: str) -> str:
    routine = SKINCARE_KB["routines"].get(skin_type)
    if not routine:
        return f"I don't have a specific routine for {skin_type} skin type yet. Try one of: oily, dry, combination, sensitive, or normal."
    
    lines = [f"## Your {skin_type.title()} Skin Routine\n"]
    lines.append("### 🌅 Morning\n")
    for step in routine["morning"]:
        lines.append(f"**Step {step['step']}**: {step['product']}")
        lines.append(f"  _{step['why']}_\n")
    
    lines.append("### 🌙 Night\n")
    for step in routine["night"]:
        lines.append(f"**Step {step['step']}**: {step['product']}")
        lines.append(f"  _{step['why']}_\n")
    
    lines.append("---\n💡 **Key tips for {} skin:**".format(skin_type))
    tips_map = {
        "oily": ["Don't skip moisturizer — dehydrated skin produces more oil", "Use SPF daily, even if oily", "Don't over-wash — 2x/day max"],
        "dry": ["Apply products to damp skin to lock in moisture", "Use a humidifier in winter", "Avoid hot water on face"],
        "combination": ["Zone-treat: different products for T-zone vs. cheeks", "Don't over-exfoliate — stick to 2-3x/week"],
        "sensitive": ["Always patch test new products for 48 hours", "Avoid fragrance, alcohol, and essential oils", "Less is more — minimal routine is best"],
        "normal": ["Prevention is key — sunscreen daily", "Don't fix what isn't broken", "Consistency beats complexity"],
    }
    for tip in tips_map.get(skin_type, []):
        lines.append(f"- {tip}")
    
    return "\n".join(lines)


def _respond_ingredient_info(ingredients: List[str]) -> str:
    if not ingredients:
        return "Which ingredient would you like to know about? I can tell you about:\n\n" + "\n".join(f"- **{ing.replace('_', ' ').title()}**" for ing in list(SKINCARE_KB["ingredients"].keys())[:10]) + "\n\nJust ask something like 'What is niacinamide?' or 'Tell me about retinol'."
    
    responses = []
    for ing in ingredients:
        info = SKINCARE_KB["ingredients"].get(ing)
        if not info:
            responses.append(f"**{ing.replace('_', ' ').title()}**: I don't have detailed info on this ingredient yet.")
            continue
        
        name = ing.replace("_", " ").title()
        lines = [f"## {name}\n"]
        lines.append(f"**Type**: {info['type'].title()}")
        lines.append(f"**Best time**: {info['best_time']}")
        lines.append(f"**Frequency**: {info['frequency']}")
        lines.append(f"**pH consideration**: {info['ph']}")
        
        if info["pairs_with"]:
            lines.append(f"\n✅ **Pairs well with**: {', '.join(x.title() for x in info['pairs_with'][:5])}")
        if info["avoids"]:
            lines.append(f"❌ **Avoid combining with**: {', '.join(x.title() for x in info['avoids'][:5])}")
        if info["skin_types"] == ["all"]:
            lines.append(f"👤 **Suitable for**: All skin types")
        else:
            lines.append(f"👤 **Best for**: {', '.join(x.title() for x in info['skin_types'])}")
        if info["caution"]:
            lines.append(f"⚠️ **Use with caution**: {', '.join(x.title() for x in info['caution'])}")
        if info["spf_required"]:
            lines.append(f"\n☀️ **Important**: Always wear SPF when using {name} — it increases sun sensitivity!")
        
        responses.append("\n".join(lines))
    
    return "\n\n---\n\n".join(responses)


def _respond_order(ingredients: List[str]) -> str:
    if not ingredients:
        return """The general rule for layering skincare is **thinnest to thickest**:

1. **Cleanser** → Start with clean skin
2. **Toners / Exfoliants** (BHA, AHA) → Water-thin liquids first
3. **Serums** (Vitamin C, Niacinamide, Retinol) → Active treatments
4. **Eye cream** → Targeted treatment
5. **Moisturizer** → Lock everything in
6. **Facial oil** (if using) → Seal the deal
7. **Sunscreen** (AM only) → Always last in the morning

⏰ **AM vs PM split**:
- **Morning**: Cleanser → Vitamin C → Niacinamide → Moisturizer → SPF
- **Night**: Cleanser → Exfoliant/Retinol → Moisturizer → Oil

⚠️ **Never layer**: Retinol + AHA/BHA at the same time (alternate nights)"""
    
    sorted_ings = []
    priority = {
        "salicylic acid": 1, "glycolic acid": 1, "aha": 1, "bha": 1,
        "vitamin c": 2, "kojic acid": 2, "arbutin": 2, "tranexamic acid": 2,
        "niacinamide": 3, "hyaluronic acid": 3, "retinol": 3, "azelaic acid": 3,
        "peptides": 4, "bakuchiol": 4, "tea tree oil": 4,
        "ceramides": 5, "squalane": 5, "panthenol": 5, "allantoin": 5, "centella asiatica": 5,
    }
    for ing in ingredients:
        p = priority.get(ing, 3)
        sorted_ings.append((p, ing.replace("_", " ").title()))
    sorted_ings.sort()
    
    lines = [f"Here's how to layer **{', '.join(name for _, name in sorted_ings)}**:\n"]
    step = 1
    for _, name in sorted_ings:
        lines.append(f"**Step {step}**: Apply {name}")
        step += 1
    lines.append(f"\n**Step {step}**: Follow with moisturizer to seal everything in")
    lines.append(f"**Step {step + 1}**: SPF (if morning)")
    
    return "\n".join(lines)


def _respond_recommendation(text: str) -> str:
    lower = text.lower()
    if "oily" in lower or "acne" in lower or "pore" in lower:
        return """For **oily/acne-prone skin**, here are evidence-based recommendations:

**Cleanser**: Foaming or gel cleanser (CeraVe Foaming, La Roche-Posay Effaclar)
**Serum**: Niacinamide 10% + Zinc 1% (oil control, pore minimizing)
**Exfoliant**: Salicylic acid 2% (BHA) — clears pores from inside
**Moisturizer**: Lightweight gel (CeraVe PM, Neutrogena Hydro Boost)
**SPF**: Non-comedogenic (EltaMD UV Clear, Biore Watery Essence)

💡 **Avoid**: Heavy creams, coconut oil, mineral oil, comedogenic ingredients"""
    
    elif "dry" in lower or "hydration" in lower or "moisture" in lower:
        return """For **dry skin**, focus on barrier repair and deep hydration:

**Cleanser**: Cream or milky cleanser (CeraVe Hydrating, Cetaphil Gentle)
**Serum**: Hyaluronic acid (apply on damp skin!)
**Moisturizer**: Rich cream with ceramides (CeraVe Moisturizing Cream, Cetaphil)
**Oil**: Squalane or rosehip oil (seal in moisture)
**SPF**: Mineral sunscreen (gentler on dry skin)

💡 **Extra tips**: Use a humidifier, avoid hot water, apply to damp skin"""
    
    elif "sensitive" in lower or "redness" in lower or "rosacea" in lower:
        return """For **sensitive skin**, less is more:

**Cleanser**: Micellar water or ultra-gentle cleanser (Vanicream, La Roche-Posay Toleriane)
**Serum**: Centella asiatica / CICA (calms redness and irritation)
**Moisturizer**: Fragrance-free with ceramides (Vanicream, First Aid Beauty)
**SPF**: Mineral only (zinc oxide / titanium dioxide)

💡 **Avoid**: Fragrance, essential oils, alcohol, AHAs/BHAs until barrier is strong"""
    
    return """I can recommend products based on your skin type! Tell me:
- Your skin type (oily, dry, combination, sensitive, normal)
- Your main concern (acne, aging, hydration, dark spots, etc.)
- Budget range (drugstore, mid-range, luxury)

Some universally loved products:
- **Niacinamide 10%** (The Ordinary) — affordable, versatile
- **Hyaluronic Acid** — any brand, deeply hydrating
- **CeraVe Moisturizing Cream** — barrier repair for all skin types
- **EltaMD UV Clear SPF 46** — best daily sunscreen"""


# ── Chat History Store ──────────────────────────────────────────────

chat_history: List[Dict[str, str]] = []


# ── Main Response Logic ────────────────────────────────────────────

def _generate_response(user_message: str) -> str:
    intent = _detect_intent(user_message)
    ingredients = _extract_ingredients(user_message)
    skin_type = _extract_skin_type(user_message)
    
    if intent == "greeting":
        return """Hey there! 👋 I'm your **AI Beauty Coach**. I can help you with:

🧴 **Ingredient Safety**: "Is retinol safe for sensitive skin?"
🔗 **Combinations**: "Can I use vitamin C and niacinamide together?"
📋 **Routines**: "What's a good routine for oily skin?"
💡 **Ingredient Info**: "Tell me about hyaluronic acid"
📐 **Layering Order**: "What order should I apply products?"
🎯 **Recommendations**: "What's good for acne?"

Just ask me anything about skincare!"""
    
    elif intent == "thanks":
        return "You're welcome! 😊 Remember, consistency is key in skincare. Feel free to ask if you have more questions!"
    
    elif intent == "safe_for_skin_type":
        if not skin_type:
            skin_type = _extract_skin_type(user_message) or "normal"
        return _respond_safe_for_skin(ingredients, skin_type)
    
    elif intent == "can_use_together":
        return _respond_together(ingredients)
    
    elif intent == "routine":
        if skin_type:
            return _respond_routine(skin_type)
        return "Which skin type should I design a routine for?\n\nTell me: oily, dry, combination, sensitive, or normal."
    
    elif intent == "ingredient_info":
        return _respond_ingredient_info(ingredients)
    
    elif intent == "order_of_application":
        return _respond_order(ingredients)
    
    elif intent == "recommendation":
        return _respond_recommendation(user_message)
    
    else:
        # General response with helpful suggestions
        if ingredients:
            if len(ingredients) > 1:
                return _respond_together(ingredients)
            return _respond_ingredient_info(ingredients)
        
        return """I'd love to help! Here are some things I can assist with:

- **"Is [ingredient] safe for [skin type] skin?"** — I'll evaluate ingredient safety
- **"Can I use [X] and [Y] together?"** — I'll check for conflicts
- **"What's a routine for [skin type]?"** — I'll build a full AM/PM routine
- **"What is [ingredient]?"** — I'll explain how it works
- **"What order should I apply products?"** — Layering guide

Try asking one of these!"""


# ── Pydantic Schemas ────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)

class ChatResponse(BaseModel):
    user_message: str
    bot_response: str
    intent: str
    detected_ingredients: List[str]
    detected_skin_type: Optional[str]
    timestamp: str

class QuickAction(BaseModel):
    label: str
    message: str
    icon: str


# ── Endpoints ───────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(msg: ChatMessage):
    text = msg.message.strip()
    intent = _detect_intent(text)
    ingredients = _extract_ingredients(text)
    skin_type = _extract_skin_type(text)
    response = _generate_response(text)
    
    chat_history.append({"role": "user", "content": text})
    chat_history.append({"role": "bot", "content": response})
    # Keep last 20 messages
    if len(chat_history) > 20:
        chat_history.pop(0)
        chat_history.pop(0)
    
    return ChatResponse(
        user_message=text,
        bot_response=response,
        intent=intent,
        detected_ingredients=ingredients,
        detected_skin_type=skin_type,
        timestamp=datetime.now().isoformat(),
    )


@router.get("/quick-actions", response_model=List[QuickAction])
async def get_quick_actions():
    return [
        QuickAction(label="Oily skin routine", message="What's a good routine for oily skin?", icon="Droplets"),
        QuickAction(label="Dry skin routine", message="What's a good routine for dry skin?", icon="Sun"),
        QuickAction(label="Retinol safety", message="Is retinol safe for sensitive skin?", icon="Shield"),
        QuickAction(label="Vitamin C + Niacinamide", message="Can I use vitamin C and niacinamide together?", icon="Sparkles"),
        QuickAction(label="Layering order", message="What order should I apply my products?", icon="Layers"),
        QuickAction(label="What is hyaluronic acid?", message="Tell me about hyaluronic acid", icon="Droplets"),
    ]


@router.get("/ingredients")
async def get_available_ingredients():
    return [
        {"id": k, "name": v["name"] if "name" in v else k.replace("_", " ").title(), "type": v["type"]}
        for k, v in SKINCARE_KB["ingredients"].items()
    ]


@router.delete("/history")
async def clear_history():
    chat_history.clear()
    return {"message": "Chat history cleared"}
