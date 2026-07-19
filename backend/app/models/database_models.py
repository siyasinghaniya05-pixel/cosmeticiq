from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class SkinType(str, enum.Enum):
    DRY = "dry"
    OILY = "oily"
    COMBINATION = "combination"
    SENSITIVE = "sensitive"
    ACNE_PRONE = "acne_prone"
    NORMAL = "normal"


class IngredientSafety(str, enum.Enum):
    SAFE = "safe"
    MODERATE = "moderate"
    HAZARDOUS = "hazardous"
    UNKNOWN = "unknown"


class ClaimVerdict(str, enum.Enum):
    SUPPORTED = "supported"
    PARTIALLY_SUPPORTED = "partially_supported"
    MISLEADING = "misleading"
    NO_EVIDENCE = "no_evidence"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    reviews = relationship("Review", back_populates="user")
    recommendations = relationship("Recommendation", back_populates="user")
    skin_history = relationship("SkinHistory", back_populates="user")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    skin_type = Column(String(20), default="normal")
    age = Column(Integer)
    climate = Column(String(100))
    city = Column(String(100))
    budget_min = Column(Float, default=0)
    budget_max = Column(Float, default=1000)
    allergies = Column(JSON, default=[])
    concerns = Column(JSON, default=[])
    is_pregnant = Column(Boolean, default=False)
    is_vegan = Column(Boolean, default=False)
    is_cruelty_free = Column(Boolean, default=False)
    hormonal_concerns = Column(JSON, default=[])
    routine = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_brand_category", "brand", "category"),
        Index("ix_products_safety_score", "safety_score"),
        Index("ix_products_rating", "rating"),
        Index("ix_products_is_organic", "is_organic"),
        Index("ix_products_price", "price"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), nullable=False)
    brand = Column(String(255), nullable=False)
    category = Column(String(100))
    subcategory = Column(String(100))
    description = Column(Text)
    price = Column(Float)
    currency = Column(String(10), default="USD")
    barcode = Column(String(50), unique=True)
    image_url = Column(String(1000))
    rating = Column(Float, default=0)
    review_count = Column(Integer, default=0)
    is_vegan = Column(Boolean, default=False)
    is_cruelty_free = Column(Boolean, default=False)
    is_organic = Column(Boolean, default=False)
    comedogenic_score = Column(Float, default=0)
    fragrance_level = Column(Float, default=0)
    alcohol_level = Column(Float, default=0)
    scientific_score = Column(Float, default=0)
    safety_score = Column(Float, default=0)
    data_source = Column(String(100))
    external_id = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ingredients = relationship("ProductIngredient", back_populates="product")
    reviews = relationship("Review", back_populates="product")
    recommendations = relationship("Recommendation", back_populates="product")


class Ingredient(Base):
    __tablename__ = "ingredients"
    __table_args__ = (
        Index("ix_ingredients_safety_status", "safety_status"),
        Index("ix_ingredients_ewg_score", "ewg_score"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    inci_name = Column(String(255))
    scientific_name = Column(String(255))
    description = Column(Text)
    safety_score = Column(Float, default=0)
    safety_status = Column(String(20), default="unknown")
    is_comedogenic = Column(Boolean, default=False)
    comedogenic_rating = Column(Float, default=0)
    is_fragrance = Column(Boolean, default=False)
    is_allergen = Column(Boolean, default=False)
    is_endocrine_disruptor = Column(Boolean, default=False)
    is_pregnancy_unsafe = Column(Boolean, default=False)
    is_microplastic = Column(Boolean, default=False)
    is_animal_derived = Column(Boolean, default=False)
    is_irritant = Column(Boolean, default=False)
    ewg_score = Column(Float, default=0)
    fda_status = Column(String(100))
    eu_approved = Column(Boolean, default=True)
    cosdna_id = Column(String(100))
    pubchem_id = Column(String(100))
    functions = Column(JSON, default=[])
    synonyms = Column(JSON, default=[])
    warnings = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    products = relationship("ProductIngredient", back_populates="ingredient")
    studies = relationship("IngredientStudy", back_populates="ingredient")


class ProductIngredient(Base):
    __tablename__ = "product_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))
    concentration = Column(Float)
    position = Column(Integer)

    product = relationship("Product", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="products")


class ScientificStudy(Base):
    __tablename__ = "scientific_studies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    abstract = Column(Text)
    authors = Column(JSON, default=[])
    journal = Column(String(255))
    publication_date = Column(DateTime)
    doi = Column(String(255))
    pubmed_id = Column(String(100))
    url = Column(String(1000))
    source = Column(String(100))
    findings = Column(JSON, default=[])
    ingredients_studied = Column(JSON, default=[])
    evidence_level = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)


class IngredientStudy(Base):
    __tablename__ = "ingredient_studies"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))
    study_id = Column(Integer, ForeignKey("scientific_studies.id"))
    relevance_score = Column(Float, default=0)
    findings_summary = Column(Text)

    ingredient = relationship("Ingredient", back_populates="studies")
    study = relationship("ScientificStudy")


class FuzzyRule(Base):
    __tablename__ = "fuzzy_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    conditions = Column(JSON, nullable=False)
    output = Column(JSON, nullable=False)
    weight = Column(Float, default=1.0)
    is_active = Column(Boolean, default=True)
    category = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        Index("ix_reviews_user_product", "user_id", "product_id"),
        Index("ix_reviews_rating", "rating"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    rating = Column(Float, nullable=False)
    title = Column(String(255))
    content = Column(Text)
    skin_type = Column(String(20))
    would_recommend = Column(Boolean)
    verified_purchase = Column(Boolean, default=False)
    helpful_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")


class Influencer(Base):
    __tablename__ = "influencers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    platform = Column(String(100))
    handle = Column(String(255))
    followers_count = Column(Integer, default=0)
    credibility_score = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    claims = relationship("Claim", back_populates="influencer")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    influencer_id = Column(Integer, ForeignKey("influencers.id"))
    content = Column(Text, nullable=False)
    product_name = Column(String(255))
    ingredients_mentioned = Column(JSON, default=[])
    verdict = Column(String(30), default="no_evidence")
    confidence_score = Column(Float, default=0)
    evidence_sources = Column(JSON, default=[])
    analysis = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    influencer = relationship("Influencer", back_populates="claims")


class Recommendation(Base):
    __tablename__ = "recommendations"
    __table_args__ = (
        Index("ix_recommendations_user_product", "user_id", "product_id"),
        Index("ix_recommendations_score", "suitability_score"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    suitability_score = Column(Float, nullable=False)
    fuzzy_output = Column(JSON)
    triggered_rules = Column(JSON, default=[])
    explanation = Column(Text)
    confidence_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recommendations")
    product = relationship("Product", back_populates="recommendations")


class SkinHistory(Base):
    __tablename__ = "skin_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skin_type = Column(String(20))
    concerns = Column(JSON, default=[])
    notes = Column(Text)
    image_url = Column(String(1000))
    recorded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="skin_history")


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False, unique=True, index=True)
    country = Column(String(100), index=True)
    founded_year = Column(Integer)
    parent_company = Column(String(255))
    brand_type = Column(String(100), index=True)
    cruelty_free = Column(Boolean, default=False)
    vegan_products = Column(Boolean, default=False)
    dermatologist_recommended = Column(Boolean, default=False)
    official_website = Column(String(500))
    logo_url = Column(String(1000))
    description = Column(Text)
    popularity_score = Column(Float, default=0)
    sustainability_score = Column(Float, default=0)
    average_price_range = Column(String(50), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
