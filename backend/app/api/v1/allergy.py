from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, List, Optional, Dict, Set

router = APIRouter(prefix="/allergy", tags=["Allergy Prediction"])

# ── Allergen Database ───────────────────────────────────────────────

ALLERGEN_CATEGORIES = {
    "fragrance": {
        "name": "Fragrance / Parfum",
        "description": "Synthetic and natural fragrance compounds used for scent. A top allergen in cosmetics — can cause contact dermatitis even at <1% concentration.",
        "icon": "Flower2",
        "color": "#E879A8",
        "severity": "high",
        "prevalence": "1-4% of general population",
        "alternative_tips": "Look for 'fragrance-free' labels. Avoid 'parfum', 'aroma', 'eau de toilette'. 'Unscented' may still contain masking fragrances.",
        "aliases": [
            "fragrance", "parfum", "perfume", "aroma", "eau de toilette", "eau de cologne",
            "linalool", "limonene", "geraniol", "citronellol", "citral", "eugenol",
            "cinnamal", "coumarin", "benzyl benzoate", "benzyl alcohol", "benzyl salicylate",
            "hexyl cinnamal", "hydroxycitronellal", "isoeugenol", "farnesol",
            "alpha-isomethyl ionone", "amyl cinnamal", "anise alcohol", "benzyl cinnamate",
            "benzyl phenylacetate", "cinnamyl alcohol", "d-limonene", "hydroperoxides of linalool",
            "hydroperoxides of limonene", "lyral", "oakmoss extract", "treemoss extract",
            "methyl heptine carbonate", "styrene allyl alcohol", "synthetic musk",
            "galaxolide", "habanolide", "phantolide", "tonalide", "versalide",
            "scent", "unscented fragrance",
        ],
    },
    "essential_oils": {
        "name": "Essential Oils",
        "description": "Concentrated plant extracts that contain allergenic terpenes and aromatic compounds. Even 'natural' oils can cause severe reactions.",
        "icon": "Leaf",
        "color": "#22C55E",
        "severity": "high",
        "prevalence": "1-3% of general population",
        "alternative_tips": "Avoid products listing specific essential oils. Synthetic alternatives or fragrance-free formulas are safer for sensitive skin.",
        "aliases": [
            "tea tree oil", "lavender oil", "eucalyptus oil", "peppermint oil",
            "rosemary oil", "citrus oil", "lemon oil", "orange oil", "bergamot oil",
            "ylang ylang oil", "geranium oil", "clary sage oil", "rose oil",
            "jasmine oil", "chamomile oil", "cedarwood oil", "sandalwood oil",
            "patchouli oil", "vetiver oil", "clove oil", "cinnamon oil",
            "thyme oil", "oregano oil", "pine oil", "fir needle oil",
            "tea tree extract", "mentha piperita oil", "melaleuca alternifolia",
            "citrus limon peel oil", "citrus aurantium dulcis peel oil",
            "citrus paradisi peel oil", "citrus bergamia peel oil",
            "salvia sclarea oil", "pelargonium graveolens oil",
            "rosa damascena flower oil", "jasminum officinale flower oil",
            "eucalyptus globulus leaf oil", "rosmarinus officinalis leaf oil",
            "mentha arvensis oil", "pogostemon cablin oil",
            "boswellia carterii oil", "commiphora myrrha resin extract",
            "essential oil blend", "essential oil complex",
        ],
    },
    "lanolin": {
        "name": "Lanolin (Wool Grease)",
        "description": "Wool wax from sheep's wool. Highly allergenic — one of the most common causes of allergic contact dermatitis in topical products.",
        "icon": "Shirt",
        "color": "#D97706",
        "severity": "high",
        "prevalence": "1-6% of dermatitis patients, up to 3% of general population",
        "alternative_tips": "Use plant-based emollients instead: shea butter, cocoa butter, mango butter, squalane (olive-derived), or jojoba oil.",
        "aliases": [
            "lanolin", "lanolin alcohol", "wool wax", "wool grease", "wool fat",
            "lanolin oil", "lanolin wax", "hydrogenated lanolin", "acetylated lanolin",
            "lanolin esters", "lanolin ricinoleate", "lanolin stearate",
            "lanolin acetate", "lanolin linoleate", "lanolin sulfonate",
            "wool wax alcohols", "lanolin alcohols", "cholesterol lanolate",
            "ethoxylated lanolin", "PEG-75 lanolin", "PEG-90 lanolin",
            "lanocerin", "lanogene", "lanogel", "lanocaine",
            "lanolin-derived", "sheep wool extract", "wool alcohols",
            "cholesterol", "cetyl esters", "cholesteryl esters",
        ],
    },
    "nickel": {
        "name": "Nickel & Metal Allergens",
        "description": "Trace nickel contamination in cosmetic ingredients. Nickel allergy affects 8-19% of the population and causes contact dermatitis.",
        "icon": "CircleDashed",
        "color": "#6B7280",
        "severity": "high",
        "prevalence": "8-19% of general population (higher in women)",
        "alternative_tips": "Avoid products with metallic pigments, mica, and certain clays. Choose nickel-tested products when available.",
        "aliases": [
            "nickel", "nickel sulfate", "nickel chloride", "nickel carbonate",
            "nickel hydroxide", "nickel oxide", "mica", "iron oxide",
            "titanium dioxide", "zinc oxide", "bismuth oxychloride",
            "chromium", "chromium oxide", "chromium hydroxide",
            "cobalt", "cobalt chloride", "cobalt sulfate",
            "palladium", "mercury", "gold", "silver",
            "aluminum", "aluminum chloride", "aluminum chlorohydrate",
            "talc", "kaolin", "bentonite", "magnesium stearate",
            "metallic pigment", "mineral pigment", "CI 77891", "CI 77491",
            "CI 77492", "CI 77499", "CI 77019", "CI 77004",
            "stannous chloride", "tin", "copper gluconate", "copper peptide",
        ],
    },
    "preservatives": {
        "name": "Preservatives",
        "description": "Chemical preservatives that prevent microbial growth. Many are known allergens, especially formaldehyde releasers and methylisothiazolinone.",
        "icon": "FlaskConical",
        "color": "#8B5CF6",
        "severity": "medium",
        "prevalence": "2-5% depending on specific preservative",
        "alternative_tips": "Look for preservative-free or naturally preserved products. Phenoxyethanol at <1% is generally well-tolerated. Airless packaging reduces preservative needs.",
        "aliases": [
            "methylisothiazolinone", "methylchloroisothiazolinone", "mi", "mci",
            "kathon", "formaldehyde", "formalin", "formaldehyde releaser",
            "dmdm hydantoin", "imidazolidinyl urea", "diazolidinyl urea",
            "quaternium-15", "bronopol", "2-bromo-2-nitropropane-1,3-diol",
            "sodium hydroxymethylglycinate", "hydroxymethylglycinate",
            "paraben", "methylparaben", "ethylparaben", "propylparaben",
            "butylparaben", "isobutylparaben", "isopropylparaben",
            "phenoxyethanol", "phenonip", "chlorphenesin",
            "benzyl alcohol", "potassium sorbate", "sodium benzoate",
            "sorbic acid", "caprylyl glycol", "ethylhexylglycerin",
            "dehydroacetic acid", "sodium dehydroacetate",
            "triethyleneglycol", "propylene glycol", "triclosan",
            "triclocarban", "chlorhexidine", "hexamidine",
            "povidone iodine", "bht", "bha", "propyl gallate",
            " EDTA", "disodium EDTA", "tetrasodium EDTA",
            "sodium EDTA", "phenoxyethanol blend",
            "cosgard", "geogard", "euxyl PE 9010",
            "suttocide A", "sodium percarbonate",
        ],
    },
    "dyes": {
        "name": "Synthetic Dyes & Colorants",
        "description": "Coal tar derivatives and synthetic colorants. FD&C and D&C dyes can cause allergic reactions and hyperactivity in sensitive individuals.",
        "icon": "Palette",
        "color": "#EC4899",
        "severity": "medium",
        "prevalence": "1-2% of general population",
        "alternative_tips": "Use mineral-based colorants (iron oxides, titanium dioxide) or products with no added colorants.",
        "aliases": [
            "fd&c red no. 3", "fd&c red no. 4", "fd&c yellow no. 5", "fd&c yellow no. 6",
            "fd&c blue no. 1", "fd&c green no. 3", "d&c red no. 7", "d&c red no. 17",
            "d&c red no. 21", "d&c red no. 27", "d&c red no. 33", "d&c orange no. 5",
            "d&c yellow no. 7", "d&c violet no. 2", "d&c blue no. 9",
            "CI 14700", "CI 15510", "CI 15525", "CI 15580", "CI 15620",
            "CI 15800", "CI 15850", "CI 15880", "CI 15985", "CI 16035",
            "CI 16185", "CI 16255", "CI 17200", "CI 18050", "CI 18690",
            "CI 19140", "CI 20040", "CI 42053", "CI 42090", "CI 42100",
            "CI 44045", "CI 45100", "CI 45170", "CI 45220", "CI 45350",
            "CI 45370", "CI 45380", "CI 45410", "CI 45430", "CI 47005",
            "CI 60725", "CI 60730", "CI 61565", "CI 61570", "CI 69800",
            "CI 73360", "CI 74100", "CI 74160", "CI 74180", "CI 74260",
            "CI 75100", "CI 75130", "CI 75170", "CI 75300", "CI 75470",
            "tartrazine", "allura red", "sunset yellow", "brilliant blue",
            "fast green", "erythrosine", "indigo carmine", "carmine",
            "cochineal", "colorant", "color index",
        ],
    },
    "sulfates": {
        "name": "Sulfates (SLS/SLES)",
        "description": "Harsh surfactants that strip natural oils. Can trigger eczema, disrupt skin barrier, and cause contact dermatitis.",
        "icon": "Droplets",
        "color": "#0EA5E9",
        "severity": "medium",
        "prevalence": "3-5% in eczema patients",
        "alternative_tips": "Switch to sulfate-free cleansers with gentle surfactants like cocamidopropyl betaine, decyl glucoside, or sodium cocoyl isethionate.",
        "aliases": [
            "sodium lauryl sulfate", "sls", "sodium laureth sulfate", "sles",
            "sodium lauryl ether sulfate", "ammonium lauryl sulfate",
            "ammonium laureth sulfate", "sodium dodecyl sulfate",
            "sodium lauryl sulfoacetate", "sodium cocoyl sarcosinate",
            "sodium alkylbenzene sulfonate", "sodium c14-16 olefin sulfonate",
            "sodium methyl cocoyl taurate", "lauryl glucoside",
            "sodium lauroyl methyl isethionate",
        ],
    },
    "formaldehyde": {
        "name": "Formaldehyde & Releasers",
        "description": "Known human carcinogen. Used as preservative or released slowly by other preservatives. Banned in EU cosmetics above certain limits.",
        "icon": "Skull",
        "color": "#EF4444",
        "severity": "very_high",
        "prevalence": "2-3% of dermatitis patients",
        "alternative_tips": "Avoid all formaldehyde-releasing preservatives. Choose products preserved with phenoxyethanol, ethylhexylglycerin, or airless packaging.",
        "aliases": [
            "formaldehyde", "formalin", "methanal", "methyl aldehyde",
            "formalin solution", "formic aldehyde", "oxymethane",
            "dmdm hydantoin", "imidazolidinyl urea", "diazolidinyl urea",
            "quaternium-15", "bronopol", "2-bromo-2-nitropropane-1,3-diol",
            "sodium hydroxymethylglycinate", "glyoxal", "glyoxal solid",
            "paraformaldehyde", "polyoxymethylene", "methanal sodium bisulfite",
        ],
    },
    "coconut_derived": {
        "name": "Coconut-Derived Ingredients",
        "description": "Many coconut-derived surfactants and emulsifiers cross-react with tree nut allergies. A growing allergen concern.",
        "icon": "CircleDot",
        "color": "#92400E",
        "severity": "medium",
        "prevalence": "1-2% of coconut-allergic individuals",
        "alternative_tips": "Choose products with sunflower-derived or synthetic alternatives to coconut-based surfactants and emulsifiers.",
        "aliases": [
            "cocamidopropyl betaine", "cocamide mea", "cocamide dea",
            "coconut oil", "cocos nucifera oil", "coconut water",
            "coconut milk", "copra oil", "virgin coconut oil",
            "cocoglycerides", "coco-glucoside", "coco-betaine",
            "sodium cocoyl glutamate", "sodium cocoyl isethionate",
            "sodium cocoyl sarcosinate", "sodium cocoyl threoninate",
            "lauryl glucoside", "decyl glucoside", "ceteareth-20",
            "PEG-7 glyceryl cocoate", "PEG-200 glyceryl stearate",
            "cocamidopropyl dimethylamine", "cocamidopropyl hydroxysultaine",
            "cocamidopropyl betaine hydrochloride",
            "cocoyl proline", "coco-caprylate", "coco-cabrylate",
        ],
    },
    "gluten": {
        "name": "Gluten / Wheat-Derived",
        "description": "Gluten in topical products can cause dermatitis herpetiformis in celiac patients. Not all celiacs react topically, but many do.",
        "icon": "Wheat",
        "color": "#CA8A04",
        "severity": "low",
        "prevalence": "Varies in celiac patients (8-50% topical sensitivity)",
        "alternative_tips": "Look for gluten-free certified products. Avoid wheat germ oil, hydrolyzed wheat protein, barley extract, and oat-derived ingredients unless certified gluten-free.",
        "aliases": [
            "wheat germ oil", "triticum vulgare germ oil", "wheat germ extract",
            "hydrolyzed wheat protein", "wheat amino acids", "wheat bran extract",
            "wheat lipids", "wheat starch", "wheat flour",
            "barley extract", "hordeum vulgare extract", "malt extract",
            "avena sativa", "oat extract", "colloidal oatmeal",
            "avena sativa kernel flour", "avena sativa kernel extract",
            "secale cereale seed extract", "rye seed extract",
            "hydrolyzed wheat gluten", "wheat betaine", "triticum vulgare",
            "gluten", "gliadin", "glutenin", "phytic acid",
        ],
    },
    "retinoid": {
        "name": "Retinoids (Vitamin A derivatives)",
        "description": "Teratogenic — pregnant women must avoid all retinoids. Can also cause irritation, peeling, and sun sensitivity.",
        "icon": "AlertTriangle",
        "color": "#DC2626",
        "severity": "very_high",
        "prevalence": "Irritation in 5-40% depending on concentration",
        "alternative_tips": "Pregnant women should use bakuchiol or vitamin C instead. For sensitive skin, use low-concentration retinyl palmitate (gentlest retinoid).",
        "aliases": [
            "retinol", "retinal", "retinaldehyde", "retinoic acid", "tretinoin",
            "adapalene", "tazarotene", "trifarotene", "bexarotene",
            "retinyl palmitate", "retinyl acetate", "retinyl linoleate",
            "hydroxypinacolone retinoate", "hpr", "granactive retinoid",
            "encapsulated retinol", "retinol palmitate",
            "vitamin a", "vitamin a acetate", "vitamin a palmitate",
            "all-trans retinoic acid", "atretinoin", "isotretinoin",
            "isotrexin", "roaccutane", "accutane",
            "retinyl retinoate", "retinyl propanoate",
        ],
    },
    "salicylates": {
        "name": "Salicylates (Aspirin-related)",
        "description": "Related to aspirin — can cause reactions in aspirin-sensitive individuals. BHA (butylated hydroxyanisole) is also a salicylate.",
        "icon": "Pill",
        "color": "#7C3AED",
        "severity": "medium",
        "prevalence": "1-3% in aspirin-sensitive individuals",
        "alternative_tips": "Aspirin-sensitive individuals should avoid BHA, salicylic acid, and willow bark extract. Use gentle alternatives like PHAs (polyhydroxy acids).",
        "aliases": [
            "salicylic acid", "salicylate", "methyl salicylate", "betaine salicylate",
            "salicyloyl phytosphingosine", "bha", "butylated hydroxyanisole",
            "willow bark extract", "salix alba bark extract",
            "wintergreen oil", "gaultheria procumbens leaf oil",
            "acetylsalicylic acid", "aspirin", "phenyl salicylate",
            "potassium salicylate", "calcium salicylate", "salol",
            "salicylanilide", "salicylamide", "salicylaldehyde",
        ],
    },
}

# Common product ingredient lists for checking
SAMPLE_PRODUCTS = {
    "moisturizer_1": {
        "name": "Gentle Daily Moisturizer",
        "category": "moisturizer",
        "ingredients": ["water", "glycerin", "cetearyl alcohol", "shea butter", "hyaluronic acid", "niacinamide", "ceramides", "tocopherol", "phenoxyethanol"],
    },
    "anti_aging_serum": {
        "name": "Advanced Anti-Aging Serum",
        "category": "serum",
        "ingredients": ["water", "retinol", "hyaluronic acid", "vitamin c", "ferulic acid", "niacinamide", "fragrance", "paraben"],
    },
    "acne_wash": {
        "name": "Deep Clean Acne Wash",
        "category": "cleanser",
        "ingredients": ["water", "salicylic acid", "sodium lauryl sulfate", "tea tree oil", "eucalyptus oil", "mentha piperita oil", "fd&c blue no. 1"],
    },
    "body_lotion": {
        "name": "Rich Body Lotion",
        "category": "body care",
        "ingredients": ["water", "lanolin", "lanolin alcohol", "mineral oil", "petrolatum", "fragrance", "methylparaben", "propylparaben", "dmdm hydantoin", "fd&c yellow no. 5", "fd&c red no. 3", "mica"],
    },
    "bb_cream": {
        "name": "Tinted BB Cream SPF30",
        "category": "sunscreen",
        "ingredients": ["water", "titanium dioxide", "zinc oxide", "cetearyl alcohol", "niacinamide", "hyaluronic acid", "coconut oil", "cocos nucifera oil", "retinyl palmitate", "tocopherol", "phenoxyethanol"],
    },
    "lip_balm": {
        "name": "Hydrating Lip Balm",
        "category": "lip care",
        "ingredients": ["beeswax", "lanolin", "cocoa butter", "theobroma cacao seed butter", "wheat germ oil", "triticum vulgare germ oil", "coconut oil", "cocos nucifera oil", "fragrance", "methylparaben"],
    },
    "eye_cream": {
        "name": "Brightening Eye Cream",
        "category": "eye care",
        "ingredients": ["water", "caffeine", "peptides", "vitamin c", "kojic acid", "hyaluronic acid", "retinol", "ceramides", "phenoxyethanol", "ethylhexylglycerin"],
    },
    "sunscreen": {
        "name": "Mineral Sunscreen SPF50",
        "category": "sunscreen",
        "ingredients": ["zinc oxide", "titanium dioxide", "caprylic/capric triglyceride", "jojoba oil", "shea butter", "vitamin e", "green tea extract", "phenoxyethanol"],
    },
    "exfoliant": {
        "name": "AHA/BHA Exfoliating Toner",
        "category": "toner",
        "ingredients": ["water", "glycolic acid", "salicylic acid", "witch hazel", "alcohol denat", "fragrance", "sodium hydroxymethylglycinate", "fd&c green no. 3"],
    },
    "foundation": {
        "name": "Long-Wear Foundation",
        "category": "makeup",
        "ingredients": ["water", "dimethicone", "titanium dioxide", "iron oxide", "mica", "talc", "kaolin", "fragrance", "paraben", "phenoxyethanol"],
    },
    "shampoo": {
        "name": "Volumizing Shampoo",
        "category": "hair care",
        "ingredients": ["water", "sodium laureth sulfate", "sodium chloride", "cocamidopropyl betaine", "fragrance", "paraben", "fd&c yellow no. 5", "wheat amino acids", "hydrolyzed wheat protein"],
    },
    "safe_moisturizer": {
        "name": "Ultra Sensitive Moisturizer",
        "category": "moisturizer",
        "ingredients": ["water", "glycerin", "squalane", "ceramides", "centella asiatica extract", "panthenol", "allantoin", "phenoxyethanol", "ethylhexylglycerin"],
    },
}

# ── Pydantic Schemas ────────────────────────────────────────────────

class AllergenInfo(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    color: str
    severity: str
    prevalence: str
    alternative_tips: str
    alias_count: int

class AllergyCheckRequest(BaseModel):
    allergies: List[str] = Field(..., min_length=1, description="List of allergen category IDs")
    ingredients_text: Optional[str] = Field(None, description="Raw ingredient list text to check")

class FlaggedItem(BaseModel):
    ingredient: str
    allergen_category: str
    allergen_name: str
    severity: str
    color: str
    matched_aliases: List[str]

class ProductCheckResult(BaseModel):
    product_id: str
    product_name: str
    category: str
    is_safe: bool
    total_flags: int
    flags: List[FlaggedItem]
    risk_level: str  # safe, low, medium, high, severe

class AllergyProfile(BaseModel):
    allergies: List[str]
    flagged_products: List[ProductCheckResult]
    summary: Dict[str, int]

class IngredientCheckRequest(BaseModel):
    allergies: List[str] = Field(..., min_length=1)
    ingredient: str

class IngredientCheckResult(BaseModel):
    ingredient: str
    is_safe: bool
    flags: List[FlaggedItem]

class AllergyStats(BaseModel):
    total_allergens: int
    total_aliases: int
    total_products: int
    products_flagged: Dict[str, int]


# ── Helper ──────────────────────────────────────────────────────────

def _check_ingredient_list(
    ingredients: List[str], selected_allergies: List[str]
) -> List[FlaggedItem]:
    flags: List[FlaggedItem] = []
    seen: Set[str] = set()
    for ing in ingredients:
        ing_lower = ing.lower().strip()
        for allergy_id in selected_allergies:
            if allergy_id not in ALLERGEN_CATEGORIES:
                continue
            cat = ALLERGEN_CATEGORIES[allergy_id]
            matched = []
            for alias in cat["aliases"]:
                alias_lower = alias.lower()
                if alias_lower in ing_lower or ing_lower in alias_lower:
                    matched.append(alias)
            if matched:
                key = f"{ing_lower}:{allergy_id}"
                if key not in seen:
                    seen.add(key)
                    flags.append(FlaggedItem(
                        ingredient=ing,
                        allergen_category=allergy_id,
                        allergen_name=cat["name"],
                        severity=cat["severity"],
                        color=cat["color"],
                        matched_aliases=matched[:3],
                    ))
    return flags


def _risk_level(flags: List[FlaggedItem]) -> str:
    if not flags:
        return "safe"
    severity_order = {"very_high": 4, "high": 3, "medium": 2, "low": 1}
    max_sev = max(severity_order.get(f.severity, 0) for f in flags)
    if max_sev >= 4:
        return "severe"
    if max_sev >= 3:
        return "high"
    if max_sev >= 2:
        return "medium"
    return "low"


# ── Endpoints ───────────────────────────────────────────────────────

@router.get("/allergens", response_model=List[AllergenInfo])
async def get_all_allergens():
    result = []
    for key, data in ALLERGEN_CATEGORIES.items():
        result.append(AllergenInfo(
            id=key, name=data["name"], description=data["description"],
            icon=data["icon"], color=data["color"], severity=data["severity"],
            prevalence=data["prevalence"], alternative_tips=data["alternative_tips"],
            alias_count=len(data["aliases"]),
        ))
    return result


@router.post("/check-ingredients", response_model=IngredientCheckResult)
async def check_ingredients(req: IngredientCheckRequest):
    if not req.ingredient.strip():
        raise HTTPException(status_code=400, detail="Ingredient text cannot be empty")
    parts = [p.strip() for p in req.ingredient.replace("\n", ",").split(",") if p.strip()]
    flags = _check_ingredient_list(parts, req.allergies)
    return IngredientCheckResult(
        ingredient=req.ingredient,
        is_safe=len(flags) == 0,
        flags=flags,
    )


@router.post("/check-products", response_model=AllergyProfile)
async def check_products(req: AllergyCheckRequest):
    flagged_products = []
    for pid, pdata in SAMPLE_PRODUCTS.items():
        flags = _check_ingredient_list(pdata["ingredients"], req.allergies)
        flagged_products.append(ProductCheckResult(
            product_id=pid,
            product_name=pdata["name"],
            category=pdata["category"],
            is_safe=len(flags) == 0,
            total_flags=len(flags),
            flags=flags,
            risk_level=_risk_level(flags),
        ))
    safe_count = sum(1 for p in flagged_products if p.is_safe)
    flagged_count = len(flagged_products) - safe_count
    return AllergyProfile(
        allergies=req.allergies,
        flagged_products=flagged_products,
        summary={"total": len(flagged_products), "safe": safe_count, "flagged": flagged_count},
    )


@router.get("/products", response_model=Dict[str, Any])
async def get_all_products():
    products = []
    for pid, pdata in SAMPLE_PRODUCTS.items():
        products.append({
            "id": pid,
            "name": pdata["name"],
            "category": pdata["category"],
            "ingredients": pdata["ingredients"],
        })
    return {"products": products, "total": len(products)}


@router.get("/stats", response_model=AllergyStats)
async def get_stats():
    total_aliases = sum(len(c["aliases"]) for c in ALLERGEN_CATEGORIES.values())
    # Count flagged products for each allergen
    per_allergen = {}
    for key in ALLERGEN_CATEGORIES:
        count = 0
        for pdata in SAMPLE_PRODUCTS.values():
            flags = _check_ingredient_list(pdata["ingredients"], [key])
            if flags:
                count += 1
        per_allergen[key] = count
    return AllergyStats(
        total_allergens=len(ALLERGEN_CATEGORIES),
        total_aliases=total_aliases,
        total_products=len(SAMPLE_PRODUCTS),
        products_flagged=per_allergen,
    )
