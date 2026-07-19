from pydantic import BaseModel, EmailStr, field_validator, model_validator, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import re


class SkinType(str, Enum):
    DRY = "dry"
    OILY = "oily"
    COMBINATION = "combination"
    SENSITIVE = "sensitive"
    ACNE_PRONE = "acne_prone"
    NORMAL = "normal"


CLIMATE_LIST = ["humid", "dry", "cold", "temperate", "tropical", "moderate", "continental", "arid", "mediterranean"]


class UserCreate(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: Optional[str] = Field(None, max_length=255)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        v = v.strip().lower()
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        if re.match(r"^[0-9]", v):
            raise ValueError("Username must start with a letter")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Name must be at least 2 characters")
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class UserProfileUpdate(BaseModel):
    skin_type: Optional[SkinType] = None
    age: Optional[int] = Field(None, ge=10, le=120)
    climate: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    allergies: Optional[List[str]] = None
    concerns: Optional[List[str]] = None
    is_pregnant: Optional[bool] = None
    is_vegan: Optional[bool] = None
    is_cruelty_free: Optional[bool] = None
    hormonal_concerns: Optional[List[str]] = None

    @field_validator("climate")
    @classmethod
    def validate_climate(cls, v):
        if v is not None and v.lower() not in CLIMATE_LIST:
            raise ValueError(f"Invalid climate. Choose from: {', '.join(CLIMATE_LIST)}")
        return v.lower() if v else v

    @field_validator("budget_max")
    @classmethod
    def validate_budget(cls, v, info):
        if v is not None and "budget_min" in info.data and info.data["budget_min"] is not None:
            if v < info.data["budget_min"]:
                raise ValueError("Max budget must be greater than min budget")
        return v

    @field_validator("allergies", "concerns", "hormonal_concerns")
    @classmethod
    def validate_list_items(cls, v):
        if v is not None:
            return [item.strip() for item in v if item.strip()][:20]
        return v


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    brand: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=5000)
    price: Optional[float] = Field(None, ge=0, le=100000)
    currency: str = Field("USD", max_length=3)
    barcode: Optional[str] = Field(None, max_length=50)
    image_url: Optional[str] = Field(None, max_length=1000)
    is_vegan: bool = False
    is_cruelty_free: bool = False
    is_organic: bool = False

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v):
        return v.upper().strip()

    @field_validator("barcode")
    @classmethod
    def validate_barcode(cls, v):
        if v is not None:
            v = v.strip()
            if v and not v.isdigit():
                raise ValueError("Barcode must contain only digits")
            if v and len(v) not in [8, 12, 13, 14]:
                raise ValueError("Barcode must be 8, 12, 13, or 14 digits")
        return v or None


class ProductResponse(BaseModel):
    id: int
    name: str
    brand: str
    category: Optional[str]
    subcategory: Optional[str]
    description: Optional[str]
    price: Optional[float]
    currency: str
    barcode: Optional[str]
    image_url: Optional[str]
    rating: float
    review_count: int
    is_vegan: bool
    is_cruelty_free: bool
    is_organic: bool
    comedogenic_score: float
    fragrance_level: float
    alcohol_level: float
    scientific_score: float
    safety_score: float
    
    class Config:
        from_attributes = True


class IngredientResponse(BaseModel):
    id: int
    name: str
    inci_name: Optional[str]
    scientific_name: Optional[str]
    description: Optional[str]
    safety_score: float
    safety_status: str
    is_comedogenic: bool
    comedogenic_rating: float
    is_fragrance: bool
    is_allergen: bool
    is_endocrine_disruptor: bool
    is_pregnancy_unsafe: bool
    is_microplastic: bool
    is_animal_derived: bool
    is_irritant: bool
    ewg_score: float
    fda_status: Optional[str]
    eu_approved: bool
    functions: List[str]
    warnings: List[str]
    
    class Config:
        from_attributes = True


class FuzzyRuleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    conditions: Dict[str, Any]
    output: Dict[str, Any]
    weight: float
    is_active: bool
    category: Optional[str]
    
    class Config:
        from_attributes = True


class FuzzyInput(BaseModel):
    skin_type: str = Field(..., min_length=1)
    age: int = Field(..., ge=10, le=120)
    climate: str = Field(..., min_length=1)
    budget: float = Field(..., ge=0, le=100000)
    ingredient_safety: float = Field(0.7, ge=0, le=1)
    comedogenic_rating: float = Field(0, ge=0, le=5)
    fragrance_level: float = Field(0.2, ge=0, le=1)
    alcohol_presence: float = Field(0.1, ge=0, le=1)
    product_rating: float = Field(3.5, ge=0, le=5)
    scientific_evidence: float = Field(0.7, ge=0, le=1)
    dermatologist_approval: float = Field(0.6, ge=0, le=1)
    user_preferences: Dict[str, Any] = {}


class FuzzyOutput(BaseModel):
    suitability_score: float
    confidence: float
    triggered_rules: List[Dict[str, Any]]
    linguistic_output: str
    membership_values: Dict[str, float]


class RecommendationRequest(BaseModel):
    product_id: Optional[int] = Field(None, gt=0)
    barcode: Optional[str] = Field(None, max_length=50)
    image_url: Optional[str] = Field(None, max_length=1000)
    ingredients_text: Optional[str] = Field(None, max_length=10000)

    @model_validator(mode="after")
    def validate_at_least_one(self):
        if not any([self.product_id, self.barcode, self.image_url, self.ingredients_text]):
            raise ValueError("At least one of product_id, barcode, image_url, or ingredients_text is required")
        return self


class RecommendationResponse(BaseModel):
    product: ProductResponse
    fuzzy_output: FuzzyOutput
    explanation: str
    confidence_score: float
    ingredients_analysis: List[IngredientResponse]
    scientific_references: List[Dict[str, Any]]
    alternatives: List[ProductResponse]


class ProductCompareRequest(BaseModel):
    product_ids: List[int] = Field(..., min_length=2, max_length=5)

    @field_validator("product_ids")
    @classmethod
    def validate_ids(cls, v):
        if len(v) != len(set(v)):
            raise ValueError("Duplicate product IDs not allowed")
        if any(id <= 0 for id in v):
            raise ValueError("Product IDs must be positive integers")
        return v


class ProductCompareResponse(BaseModel):
    products: List[ProductResponse]
    ingredient_comparison: Dict[str, Any]
    safety_comparison: Dict[str, Any]
    fuzzy_comparison: List[FuzzyOutput]
    recommendation: str


class ClaimAnalysisRequest(BaseModel):
    content: str = Field(..., min_length=10, max_length=5000)
    product_name: Optional[str] = Field(None, max_length=255)
    influencer_id: Optional[int] = Field(None, gt=0)


class ClaimAnalysisResponse(BaseModel):
    verdict: str
    confidence_score: float
    evidence: List[Dict[str, Any]]
    explanation: str
    scientific_references: List[Dict[str, Any]]


class IngredientAnalysisRequest(BaseModel):
    ingredients_text: str = Field(..., min_length=2, max_length=10000)
    product_name: Optional[str] = Field(None, max_length=255)


class IngredientAnalysisResponse(BaseModel):
    ingredients: List[IngredientResponse]
    safety_score: float
    warnings: List[str]
    recommendations: List[str]
    scientific_summary: Dict[str, Any]


class DashboardResponse(BaseModel):
    skin_profile: Dict[str, Any]
    routine: Dict[str, Any]
    current_products: List[ProductResponse]
    warnings: List[str]
    weekly_analysis: Dict[str, Any]
    monthly_improvement: Dict[str, Any]
    budget_tracker: Dict[str, Any]


class AdminProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=500)
    brand: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    price: Optional[float] = Field(None, ge=0, le=100000)
    is_flagged: Optional[bool] = None
    flag_reason: Optional[str] = Field(None, max_length=500)


class BrandCreate(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    country: Optional[str] = Field(None, max_length=100)
    founded_year: Optional[int] = Field(None, ge=1800, le=2030)
    parent_company: Optional[str] = Field(None, max_length=255)
    brand_type: Optional[str] = Field(None, max_length=100)
    cruelty_free: bool = False
    vegan_products: bool = False
    dermatologist_recommended: bool = False
    official_website: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = Field(None, max_length=1000)
    description: Optional[str] = Field(None, max_length=5000)
    popularity_score: float = Field(0, ge=0, le=100)
    sustainability_score: float = Field(0, ge=0, le=100)
    average_price_range: Optional[str] = Field(None, max_length=50)

    @field_validator("official_website")
    @classmethod
    def validate_website(cls, v):
        if v is not None:
            v = v.strip()
            if v and not v.startswith(("http://", "https://")):
                v = "https://" + v
        return v or None


class BrandResponse(BaseModel):
    id: int
    company_name: str
    country: Optional[str]
    founded_year: Optional[int]
    parent_company: Optional[str]
    brand_type: Optional[str]
    cruelty_free: bool
    vegan_products: bool
    dermatologist_recommended: bool
    official_website: Optional[str]
    logo_url: Optional[str]
    description: Optional[str]
    popularity_score: float
    sustainability_score: float
    average_price_range: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class BrandListResponse(BaseModel):
    brands: List[BrandResponse]
    total: int
    page: int
    per_page: int
