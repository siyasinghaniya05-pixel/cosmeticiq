from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import re

router = APIRouter(prefix="/claims-check", tags=["Fake Claims Detector"])

# ── Known Claims Database ───────────────────────────────────────────

KNOWN_CLAIMS: List[Dict] = [
    {
        "id": "c1",
        "claim": "Removes acne in 2 days",
        "verdict": "false",
        "confidence": 95,
        "explanation": "No topical product can eliminate acne in 2 days. Acne lesions take 6-8 weeks to form beneath the skin surface. Even the most effective treatments (retinoids, benzoyl peroxide) require 4-12 weeks for visible improvement. Any product claiming overnight acne removal is misleading.",
        "evidence_level": "Strong evidence against",
        "category": "acne",
        "red_flags": ["Impossible timeline", "No clinical trial cited", "Overpromises results"],
        "scientific_consensus": "Dermatological consensus: acne treatment requires weeks to months for visible results.",
        "better_claims": ["May help reduce acne over 8-12 weeks", "Clinically shown to reduce breakouts with consistent use"],
    },
    {
        "id": "c2",
        "claim": "Clinically proven to reduce wrinkles by 50% in 4 weeks",
        "verdict": "misleading",
        "confidence": 72,
        "explanation": "The claim may be technically true for a specific study, but '50% reduction' depends entirely on how wrinkles were measured (instrument vs. self-assessment). Most 'clinical' studies are small (20-30 participants), industry-funded, and measure subtle changes invisible to the naked eye. The 4-week timeframe is unusually optimistic for wrinkle reduction.",
        "evidence_level": "Weak to moderate",
        "category": "anti-aging",
        "red_flags": ["Vague study details", "Specific percentage without context", "Industry-funded study likely"],
        "scientific_consensus": "Retinoids show measurable wrinkle reduction over 12-24 weeks in peer-reviewed studies.",
        "better_claims": ["Visibly reduces fine lines with 12 weeks of use", "Shown to improve skin texture in clinical studies"],
    },
    {
        "id": "c3",
        "claim": "All-natural ingredients — chemical-free formula",
        "verdict": "misleading",
        "confidence": 98,
        "explanation": "Everything is made of chemicals, including water (H2O). 'Natural' does not mean safer — arsenic, botulinum toxin, and poison ivy are all natural. This claim exploits the naturalistic fallacy. Many natural ingredients (essential oils, citrus extracts) cause more irritation than synthetic alternatives.",
        "evidence_level": "Scientific consensus",
        "category": "marketing",
        "red_flags": ["Naturalistic fallacy", "Chemical-free is chemically impossible", "Fear-mongering"],
        "scientific_consensus": "Safety depends on specific ingredients and concentrations, not whether they're natural or synthetic.",
        "better_claims": ["Formulated with plant-derived ingredients", "Made with gentle, skin-friendly formulations"],
    },
    {
        "id": "c4",
        "claim": "Detoxifies your skin and removes toxins",
        "verdict": "false",
        "confidence": 97,
        "explanation": "Skin is not a primary detoxification organ — your liver and kidneys handle that. 'Skin detox' has no scientific basis. Topical products cannot draw 'toxins' from the body. The liver processes all blood-borne toxins. This claim exploits pseudoscientific wellness trends.",
        "evidence_level": "No evidence supporting",
        "category": "detox",
        "red_flags": ["Pseudoscience term 'detox'", "No specific toxin named", "Biological mechanism impossible"],
        "scientific_consensus": "The concept of 'skin detox' has no basis in dermatology or toxicology.",
        "better_claims": ["Helps cleanse and purify the skin surface", "Supports skin's natural renewal process"],
    },
    {
        "id": "c5",
        "claim": "Hyaluronic acid holds 1000x its weight in water",
        "verdict": "supported",
        "confidence": 90,
        "explanation": "This is a well-established scientific fact. Hyaluronic acid (HA) is a glycosaminoglycan that can indeed hold up to 1000 times its weight in water due to its unique molecular structure with numerous hydroxyl groups that form hydrogen bonds with water molecules. However, this applies to pure HA in laboratory conditions — in skincare formulations, the actual hydration depends on molecular weight, concentration, and formulation.",
        "evidence_level": "Strong scientific evidence",
        "category": "hydration",
        "red_flags": [],
        "scientific_consensus": "Widely accepted in biochemistry. The 1000x figure is from in vitro studies and is a standard reference.",
        "better_claims": ["HA holds up to 1000x its weight in water, providing deep hydration", "Deeply hydrating hyaluronic acid formula"],
    },
    {
        "id": "c6",
        "claim": "Cures eczema permanently",
        "verdict": "false",
        "confidence": 99,
        "explanation": "Eczema (atopic dermatitis) is a chronic condition with no known cure. It can be managed and controlled with proper treatment, but no topical product or medication can permanently cure it. The condition has strong genetic components (filaggrin mutations) that cannot be reversed by any cream or serum.",
        "evidence_level": "Strong evidence against",
        "category": "eczema",
        "red_flags": ["No cure exists for eczema", "Chronic condition claim", "Permanent cure is impossible with topicals"],
        "scientific_consensus": "Eczema is a chronic condition. Management includes moisturizers, topical corticosteroids, and lifestyle changes.",
        "better_claims": ["Helps soothe and manage eczema symptoms", "Provides long-lasting relief for eczema-prone skin"],
    },
    {
        "id": "c7",
        "claim": "SPF 100 blocks 99% of UV rays",
        "verdict": "misleading",
        "confidence": 82,
        "explanation": "While technically SPF 100 blocks about 99% of UVB rays (vs. SPF 50 at 98%), the difference is marginal and misleading. The real issue is that high SPF gives false security — people apply less frequently and stay in the sun longer. No sunscreen blocks 100% of UV. Reapplication every 2 hours matters more than the SPF number.",
        "evidence_level": "Moderate evidence",
        "category": "sunscreen",
        "red_flags": ["Implies near-total protection", "Misleading precision", "Ignores UVA protection"],
        "scientific_consensus": "SPF 30-50 provides adequate protection when applied correctly. Higher SPF offers diminishing returns.",
        "better_claims": ["Broad spectrum SPF 50 for daily UV protection", "Provides high-level sun protection when applied as directed"],
    },
    {
        "id": "c8",
        "claim": "Vitamin C brightens skin and boosts collagen production",
        "verdict": "supported",
        "confidence": 88,
        "explanation": "L-ascorbic acid (Vitamin C) is a well-studied antioxidant with evidence supporting both brightening and collagen synthesis. It inhibits tyrosinase (reducing melanin production for brightening) and is a cofactor for prolyl hydroxylase (essential for collagen synthesis). Multiple peer-reviewed studies confirm these benefits at 10-20% concentration.",
        "evidence_level": "Strong scientific evidence",
        "category": "brightening",
        "red_flags": [],
        "scientific_consensus": "Vitamin C is one of the most evidence-backed topical ingredients for brightening and collagen support.",
        "better_claims": ["Vitamin C helps brighten skin tone and supports collagen production", "With clinically studied vitamin C"],
    },
    {
        "id": "c9",
        "claim": "This cream penetrates all 7 layers of skin",
        "verdict": "false",
        "confidence": 96,
        "explanation": "Skin has 3 main layers (epidermis, dermis, hypodermis), not 7. The '7 layers' myth comes from marketing, not anatomy. While some ingredients do penetrate the epidermis, most topical products primarily work on the outermost layer (stratum corneum). Only specific分子 sizes and delivery systems can penetrate deeper.",
        "evidence_level": "Anatomically incorrect",
        "category": "marketing",
        "red_flags": ["Incorrect anatomy", "Impossible penetration claim", "Marketing pseudoscience"],
        "scientific_consensus": "Skin has 3 layers. Topical products primarily affect the epidermis. Penetration depends on molecular weight and delivery system.",
        "better_claims": ["Formulated for effective skin absorption", "Targets the skin's surface and upper layers"],
    },
    {
        "id": "c10",
        "claim": "Doctor-recommended number 1 dermatologist brand",
        "verdict": "misleading",
        "confidence": 75,
        "explanation": "'Doctor-recommended' and '#1 brand' claims are often based on surveys of a small number of dermatologists, commissioned by the brand itself. The methodology is often cherry-picked. While some brands may have genuine dermatological backing, these marketing claims rarely tell the full story of the survey sample size or methodology.",
        "evidence_level": "Marketing claim",
        "category": "marketing",
        "red_flags": ["Self-funded survey", "Vague methodology", "Social proof manipulation"],
        "scientific_consensus": "Brand claims should be evaluated based on ingredient efficacy, not marketing surveys.",
        "better_claims": ["Recommended by dermatologists for sensitive skin", "Developed with dermatological expertise"],
    },
    {
        "id": "c11",
        "claim": "Retinol reverses aging",
        "verdict": "misleading",
        "confidence": 80,
        "explanation": "Retinol can improve visible signs of aging (fine lines, texture, pigmentation) by stimulating collagen production and cell turnover. However, it does not 'reverse' aging — it slows certain visible manifestations. Aging is a complex biological process influenced by genetics, environment, and time that cannot be reversed by any topical product.",
        "evidence_level": "Moderate evidence with overstatement",
        "category": "anti-aging",
        "red_flags": ["Overpromises ('reverses')", "Oversimplifies aging", "Conflates improvement with reversal"],
        "scientific_consensus": "Retinol reduces visible signs of aging but does not reverse the aging process itself.",
        "better_claims": ["Visibly reduces signs of aging", "Helps improve skin firmness and texture over time"],
    },
    {
        "id": "c12",
        "claim": "Parabens cause cancer",
        "verdict": "misleading",
        "confidence": 85,
        "explanation": "A single 2004 study found parabens in breast tumor tissue, but the study did NOT prove parabens caused the cancer. Subsequent large-scale reviews by the EU Scientific Committee on Consumer Safety and the American Cancer Society found no causal link at concentrations used in cosmetics. Parabens at approved levels (0.1-0.8%) are considered safe by regulatory bodies worldwide.",
        "evidence_level": "Inconclusive evidence, widely misinterpreted",
        "category": "safety",
        "red_flags": ["Correlation ≠ causation", "Single study extrapolation", "Regulatory bodies disagree"],
        "scientific_consensus": "Parabens at cosmetic concentrations are considered safe by major regulatory bodies (FDA, EU SCCS).",
        "better_claims": ["Paraben-free formula", "Preserved without parabens"],
    },
    {
        "id": "c13",
        "claim": "Collagen supplements rebuild your skin's collagen",
        "verdict": "insufficient",
        "confidence": 65,
        "explanation": "Oral collagen supplements are broken down into amino acids during digestion and do not directly become skin collagen. Some studies suggest hydrolyzed collagen peptides may stimulate fibroblasts, but the evidence is mixed. A few small studies show modest improvements in skin elasticity, but larger, independent studies are needed. The body synthesizes its own collagen from vitamin C and amino acids.",
        "evidence_level": "Limited and mixed evidence",
        "category": "supplements",
        "red_flags": ["Oversimplified mechanism", "Small study sizes", "Industry funding concerns"],
        "scientific_consensus": "Oral collagen is broken down during digestion. Some evidence for hydrolyzed peptides, but needs more research.",
        "better_claims": ["Contains hydrolyzed collagen peptides", "Supports skin nutrition from within"],
    },
    {
        "id": "c14",
        "claim": "Essential oils are safer than synthetic fragrances",
        "verdict": "false",
        "confidence": 88,
        "explanation": "Essential oils are complex mixtures of dozens of chemicals and are actually MORE likely to cause allergic reactions and contact dermatitis than many synthetic fragrances. Tea tree oil, lavender oil, and citrus oils are among the most common causes of cosmetic contact dermatitis. The concentration and specific compounds matter more than the source.",
        "evidence_level": "Strong evidence against",
        "category": "fragrance",
        "red_flags": ["Appeal to nature fallacy", "Essential oils are top allergens", "Ignores dose-dependent toxicity"],
        "scientific_consensus": "Essential oils are significant contact allergens. 'Natural' does not mean hypoallergenic.",
        "better_claims": ["Fragrance-free formula", "Gentle for sensitive skin"],
    },
    {
        "id": "c15",
        "claim": "Niacinamide shrinks pores permanently",
        "verdict": "misleading",
        "confidence": 78,
        "explanation": "Niacinamide can temporarily reduce the appearance of pores by regulating oil production and improving skin elasticity around pore openings. However, pore size is primarily determined by genetics and cannot be permanently altered by any topical product. The effect is temporary and requires continued use.",
        "evidence_level": "Moderate evidence with overstatement",
        "category": "pores",
        "red_flags": ["Permanent claim for temporary effect", "Genetically determined trait", "Requires continued use"],
        "scientific_consensus": "Niacinamide helps minimize the appearance of pores temporarily through oil regulation.",
        "better_claims": ["Helps minimize the appearance of pores", "Visibly reduces pore appearance with continued use"],
    },
    {
        "id": "c16",
        "claim": "This serum is clinically tested",
        "verdict": "insufficient",
        "confidence": 70,
        "explanation": "'Clinically tested' is not regulated and means almost nothing. It could mean the product was tested on 5 people for 1 day. Without knowing the study size, duration, methodology, control group, and whether results were peer-reviewed, this claim provides no useful information. Many products are 'clinically tested' but not 'clinically proven.'",
        "evidence_level": "Vague / unregulated claim",
        "category": "marketing",
        "red_flags": ["Unregulated term", "No study details provided", "Tested ≠ proven"],
        "scientific_consensus": "'Clinically tested' without specifics is a marketing claim, not evidence.",
        "better_claims": ["In a 12-week study with 50 participants, 85% showed improvement", "Dermatologist-tested for sensitive skin"],
    },
    {
        "id": "c17",
        "claim": "Witch hazel tones and tightens skin",
        "verdict": "supported",
        "confidence": 75,
        "explanation": "Witch hazel (Hamamelis virginiana) contains tannins that have astringent properties, which can temporarily tighten skin and reduce the appearance of pores. Studies show it has mild anti-inflammatory and antioxidant effects. However, it can be drying and irritating for sensitive skin. The 'toning' effect is real but temporary.",
        "evidence_level": "Moderate evidence",
        "category": "toning",
        "red_flags": [],
        "scientific_consensus": "Witch hazel has documented astringent and mild anti-inflammatory properties from its tannin content.",
        "better_claims": ["Natural astringent properties to help tone skin", "With witch hazel for a refreshed complexion"],
    },
    {
        "id": "c18",
        "claim": "Stem cell technology regenerates your skin cells",
        "verdict": "false",
        "confidence": 92,
        "explanation": "Plant stem cells in cosmetics are dead plant cells that cannot interact with human skin biology. They do not 'regenerate' anything. The plant stem cell extract may contain beneficial antioxidants, but the 'stem cell technology' branding is pure marketing. Human skin cell regeneration is controlled by human stem cells in the basal layer, not by plant extracts.",
        "evidence_level": "No evidence for claimed mechanism",
        "category": "marketing",
        "red_flags": ["Plant ≠ human biology", "Dead cells can't regenerate anything", "Marketing pseudoscience"],
        "scientific_consensus": "Plant stem cells in cosmetics do not interact with human skin biology in the way claimed.",
        "better_claims": ["Formulated with plant-derived antioxidants", "Helps support skin's natural renewal process"],
    },
    {
        "id": "c19",
        "claim": "Salicylic acid clears blackheads in one use",
        "verdict": "false",
        "confidence": 88,
        "explanation": "Salicylic acid is a BHA that does help clear pores by dissolving oil and dead skin cells. However, blackheads form over weeks as sebum oxidizes in pores. While a single use may make some surface blackheads less visible, deep blackheads require consistent use over 4-6 weeks. One-use claims are marketing hyperbole.",
        "evidence_level": "Strong evidence against timeline",
        "category": "acne",
        "red_flags": ["Impossible single-use timeline", "Deep blackheads take weeks to form", "Overpromises results"],
        "scientific_consensus": "Salicylic acid is effective for blackheads but requires consistent use over 4-6+ weeks.",
        "better_claims": ["Helps clear pores and prevent blackheads with regular use", "Salicylic acid gently exfoliates inside the pores"],
    },
    {
        "id": "c20",
        "claim": "Sunscreen causes vitamin D deficiency",
        "verdict": "misleading",
        "confidence": 72,
        "explanation": "While sunscreen does reduce vitamin D synthesis from UVB exposure, daily sunscreen use in real-world conditions does not typically cause deficiency. People don't apply enough sunscreen for complete UVB blockage (most apply 25-50% of the recommended amount), and incidental sun exposure still occurs. Studies show regular sunscreen users don't have significantly lower vitamin D levels.",
        "evidence_level": "Mixed evidence",
        "category": "sunscreen",
        "red_flags": ["Ignores real-world application", "Conflates theoretical with practical", "Anti-sunscreen agenda"],
        "scientific_consensus": "Real-world sunscreen use does not typically cause vitamin D deficiency. Supplementation addresses any potential gap.",
        "better_claims": ["Wear sunscreen daily and supplement with vitamin D if needed", "Broad spectrum protection without vitamin D concerns"],
    },
]

# Keyword patterns for claim detection
CLAIM_PATTERNS = {
    "instant": ["instant", "immediately", "overnight", "in minutes", "in hours", "right away", "instantly"],
    "cure": ["cure", "cures", "cured", "permanent", "permanently", "eliminate", "eliminates", "get rid of"],
    "timeline": ["in \d+ days", "in \d+ hours", "in one use", "in one wash", "in a week"],
    "detox": ["detox", "detoxif", "flush out toxins", "remove toxins", "purge toxins"],
    "no_side_effects": ["no side effects", "100% safe", "zero risk", "no irritation", "no allergic"],
    "doctor_claim": ["doctor", "dermatologist", "clinically proven", "clinically tested", "scientifically proven"],
    "natural": ["all-natural", "100% natural", "chemical-free", "pure natural", "nature's"],
    "reversal": ["reverse", "reverses", "reversing", "turn back time", "undo damage"],
}


# ── Pydantic Schemas ────────────────────────────────────────────────

class ClaimAnalysis(BaseModel):
    claim: str
    verdict: str  # supported, misleading, false, insufficient, unknown
    confidence: int
    explanation: str
    evidence_level: str
    category: str
    red_flags: List[str]
    scientific_consensus: str
    better_claims: List[str]
    detected_patterns: List[str]

class ClaimCheckRequest(BaseModel):
    claim: str = Field(..., min_length=3, max_length=1000)

class ClaimHistoryItem(BaseModel):
    id: str
    claim: str
    verdict: str
    confidence: int
    category: str

class ClaimsStats(BaseModel):
    total_known: int
    verdict_counts: Dict[str, int]
    category_counts: Dict[str, int]


# ── Helpers ─────────────────────────────────────────────────────────

def _detect_patterns(claim_text: str) -> List[str]:
    text = claim_text.lower()
    detected = []
    for pattern_key, keywords in CLAIM_PATTERNS.items():
        for kw in keywords:
            if re.search(kw, text):
                detected.append(pattern_key)
                break
    return detected


def _find_best_match(claim_text: str) -> Optional[Dict]:
    text = claim_text.lower().strip()
    best_match = None
    best_score = 0

    for known in KNOWN_CLAIMS:
        known_text = known["claim"].lower()
        # Exact match
        if text == known_text:
            return known
        # Word overlap scoring
        claim_words = set(text.split())
        known_words = set(known_text.split())
        if not claim_words or not known_words:
            continue
        overlap = len(claim_words & known_words)
        score = overlap / max(len(claim_words), len(known_words))
        if score > best_score and score > 0.4:
            best_score = score
            best_match = known

    return best_match


def _generate_analysis(claim_text: str, match: Optional[Dict], patterns: List[str]) -> ClaimAnalysis:
    if match:
        verdict = match["verdict"]
        confidence = match["confidence"]
        explanation = match["explanation"]
        evidence_level = match["evidence_level"]
        category = match["category"]
        red_flags = match["red_flags"]
        consensus = match["scientific_consensus"]
        better = match["better_claims"]
    else:
        # Generate analysis based on detected patterns
        if "cure" in patterns or "timeline" in patterns:
            verdict = "false"
            confidence = 70
            explanation = "This claim uses language associated with impossible timelines or cure promises. No topical cosmetic product can cure medical conditions or deliver permanent results. Be skeptical of claims that promise dramatic results in short timeframes."
            evidence_level = "No evidence for extreme claims"
            category = "general"
            red_flags = ["Uses exaggerated language", "May overpromise results", "No clinical evidence cited"]
            consensus = "Dermatological science does not support instant or permanent cure claims for topical products."
            better = ["Consult a dermatologist for persistent skin concerns", "Results may vary; consistent use recommended"]
        elif "detox" in patterns:
            verdict = "false"
            confidence = 85
            explanation = "The concept of 'skin detox' has no scientific basis. Your liver and kidneys handle detoxification. This is a marketing term, not a medical one."
            evidence_level = "Pseudoscientific concept"
            category = "detox"
            red_flags = ["Pseudoscience term", "No biological mechanism", "Marketing buzzword"]
            consensus = "Dermatology and toxicology do not recognize 'skin detox' as a valid concept."
            better = ["Helps cleanse and refresh the skin", "Supports skin's natural processes"]
        elif "instant" in patterns:
            verdict = "misleading"
            confidence = 65
            explanation = "Instant results claims are typically misleading. Even fast-acting ingredients like hyaluronic acid or caffeine show temporary effects that last hours, not permanent improvements. Most skincare benefits require weeks of consistent use."
            evidence_level = "Limited evidence for instant claims"
            category = "general"
            red_flags = ["Unrealistic timeline", "Temporary effect presented as permanent"]
            consensus = "Most skincare ingredients require 4-12 weeks of consistent use for visible, lasting results."
            better = ["May provide temporary improvement", "Visible results with continued use"]
        elif "natural" in patterns:
            verdict = "misleading"
            confidence = 75
            explanation = "The 'natural = safe' assumption is a logical fallacy. Many natural substances are potent allergens and irritants. Safety depends on specific ingredients and concentrations, not their origin."
            evidence_level = "Scientific consensus"
            category = "marketing"
            red_flags = ["Naturalistic fallacy", "Oversimplification", "Fear-based marketing"]
            consensus = "Ingredient safety is determined by concentration, formulation, and individual sensitivity — not natural vs. synthetic origin."
            better = ["Formulated with gentle, effective ingredients", "Dermatologist-tested for safety"]
        elif "doctor" in patterns:
            verdict = "insufficient"
            confidence = 60
            explanation = "Doctor and dermatologist claims vary widely in credibility. Without knowing the specific study methodology, sample size, and whether results were independently verified, these claims provide limited useful information."
            evidence_level = "Vague claim"
            category = "marketing"
            red_flags = ["Vague authority claim", "No study details", "Marketing language"]
            consensus = "Credible clinical claims should cite specific studies, sample sizes, and peer-reviewed publications."
            better = ["In a clinical study, X% of participants showed improvement", "Developed with board-certified dermatologists"]
        else:
            verdict = "insufficient"
            confidence = 50
            explanation = "This claim cannot be verified with the available evidence. Without specific clinical data, ingredient concentrations, or peer-reviewed studies, it's impossible to assess the validity of this claim."
            evidence_level = "Insufficient data"
            category = "general"
            red_flags = ["Cannot verify", "More information needed"]
            consensus = "Claims should be backed by specific, verifiable clinical evidence."
            better = ["Look for products with peer-reviewed clinical studies", "Consult a dermatologist for personalized advice"]

    return ClaimAnalysis(
        claim=claim_text,
        verdict=verdict,
        confidence=confidence,
        explanation=explanation,
        evidence_level=evidence_level,
        category=category,
        red_flags=red_flags,
        scientific_consensus=consensus,
        better_claims=better,
        detected_patterns=patterns,
    )


# ── Endpoints ───────────────────────────────────────────────────────

@router.post("/analyze", response_model=ClaimAnalysis)
async def analyze_claim(req: ClaimCheckRequest):
    text = req.claim.strip()
    patterns = _detect_patterns(text)
    match = _find_best_match(text)
    analysis = _generate_analysis(text, match, patterns)
    return analysis


@router.get("/known-claims", response_model=List[ClaimHistoryItem])
async def get_known_claims():
    return [
        ClaimHistoryItem(
            id=c["id"], claim=c["claim"], verdict=c["verdict"],
            confidence=c["confidence"], category=c["category"],
        )
        for c in KNOWN_CLAIMS
    ]


@router.get("/known-claims/{claim_id}")
async def get_known_claim(claim_id: str):
    claim = next((c for c in KNOWN_CLAIMS if c["id"] == claim_id), None)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


@router.get("/stats", response_model=ClaimsStats)
async def get_stats():
    verdict_counts = {}
    category_counts = {}
    for c in KNOWN_CLAIMS:
        verdict_counts[c["verdict"]] = verdict_counts.get(c["verdict"], 0) + 1
        category_counts[c["category"]] = category_counts.get(c["category"], 0) + 1
    return ClaimsStats(
        total_known=len(KNOWN_CLAIMS),
        verdict_counts=verdict_counts,
        category_counts=category_counts,
    )
