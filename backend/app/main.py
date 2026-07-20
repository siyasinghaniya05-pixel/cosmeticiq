from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import auth, products, recommendations, ingredients, claims, users, admin, brands, skin_analysis, interactions, trust_score, knowledge_graph, allergy, community, claims_detector, beauty_coach, safety_score
from app.middleware import RateLimitMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan
)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)

# CORS - added last so it is outermost and handles preflight OPTIONS first
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(ingredients.router, prefix="/api/v1")
app.include_router(claims.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(brands.router, prefix="/api/v1")
app.include_router(skin_analysis.router, prefix="/api/v1")
app.include_router(interactions.router, prefix="/api/v1")
app.include_router(trust_score.router, prefix="/api/v1")
app.include_router(knowledge_graph.router, prefix="/api/v1")
app.include_router(allergy.router, prefix="/api/v1")
app.include_router(community.router, prefix="/api/v1")
app.include_router(claims_detector.router, prefix="/api/v1")
app.include_router(beauty_coach.router, prefix="/api/v1")
app.include_router(safety_score.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
