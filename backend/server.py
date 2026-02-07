from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
import httpx
from bs4 import BeautifulSoup
import re
from urllib.parse import urlparse
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'stash_db')]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'stash-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="Stash API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== Models ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    plan_type: str = "free"
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class SavedItemCreate(BaseModel):
    url: str
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    platform: Optional[str] = None
    content_type: Optional[str] = None
    notes: Optional[str] = ""
    tags: List[str] = []
    collections: List[str] = []

class SavedItemUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    collections: Optional[List[str]] = None

class SavedItemResponse(BaseModel):
    id: str
    user_id: str
    url: str
    title: str
    thumbnail_url: Optional[str] = None
    platform: str
    content_type: str
    notes: str = ""
    tags: List[str] = []
    collections: List[str] = []
    created_at: datetime
    ai_summary: Optional[List[str]] = None
    suggested_collection: Optional[str] = None

class CollectionCreate(BaseModel):
    name: str
    is_auto: bool = False

class CollectionUpdate(BaseModel):
    name: str

class CollectionResponse(BaseModel):
    id: str
    user_id: str
    name: str
    item_count: int = 0
    created_at: datetime
    is_auto: bool = False

class MetadataResponse(BaseModel):
    title: str
    thumbnail_url: Optional[str] = None
    platform: str
    content_type: str
    suggested_tags: List[str] = []

# New models for AI features
class UserPreferences(BaseModel):
    save_types: List[str] = []  # startup_ideas, content_inspiration, etc.
    usage_goals: List[str] = []  # organize_ideas, second_brain, etc.
    onboarding_completed: bool = False

class InsightsResponse(BaseModel):
    total_items: int
    items_this_week: int
    top_platforms: List[Dict[str, Any]]
    top_tags: List[Dict[str, Any]]
    collections_count: int
    weekly_summary: Optional[str] = None
    resurfaced_items: List[Dict[str, Any]] = []

class AISummaryRequest(BaseModel):
    item_id: str

class AutoCollectionSuggestion(BaseModel):
    collection_name: str
    reason: str
    is_new: bool = True
    existing_collection_id: Optional[str] = None

# ============== Auth Helpers ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except (jwt.PyJWTError, jwt.DecodeError, jwt.InvalidTokenError):
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== URL Metadata Extraction ==============

def detect_platform(url: str) -> tuple:
    """Detect platform and content type from URL"""
    domain = urlparse(url).netloc.lower()
    
    platform_map = {
        'youtube.com': ('YouTube', 'video'),
        'youtu.be': ('YouTube', 'video'),
        'twitter.com': ('X', 'post'),
        'x.com': ('X', 'post'),
        'instagram.com': ('Instagram', 'post'),
        'tiktok.com': ('TikTok', 'video'),
        'linkedin.com': ('LinkedIn', 'post'),
        'medium.com': ('Medium', 'article'),
        'reddit.com': ('Reddit', 'post'),
        'github.com': ('GitHub', 'article'),
        'substack.com': ('Substack', 'article'),
    }
    
    for key, value in platform_map.items():
        if key in domain:
            return value
    
    return ('Web', 'article')

def extract_suggested_tags(title: str) -> List[str]:
    """Extract suggested tags from title keywords"""
    if not title:
        return []
    
    # Common stop words to filter out
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'it', 'this', 'that', 'how', 'what', 'why', 'when', 'where', 'who'}
    
    # Extract words and filter
    words = re.findall(r'\b[a-zA-Z]{3,}\b', title.lower())
    tags = [word for word in words if word not in stop_words][:5]
    
    return list(set(tags))

async def fetch_url_metadata(url: str) -> dict:
    """Fetch metadata from URL using OpenGraph tags"""
    platform, content_type = detect_platform(url)
    
    default_result = {
        "title": url,
        "thumbnail_url": None,
        "platform": platform,
        "content_type": content_type,
        "suggested_tags": []
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                return default_result
            
            soup = BeautifulSoup(response.text, 'lxml')
            
            # Extract title
            title = None
            og_title = soup.find('meta', property='og:title')
            if og_title and og_title.get('content'):
                title = og_title['content']
            elif soup.title:
                title = soup.title.string
            
            if not title:
                title = url
            
            # Extract thumbnail
            thumbnail = None
            og_image = soup.find('meta', property='og:image')
            if og_image and og_image.get('content'):
                thumbnail = og_image['content']
            
            # Extract suggested tags
            suggested_tags = extract_suggested_tags(title)
            
            return {
                "title": title.strip()[:200] if title else url,
                "thumbnail_url": thumbnail,
                "platform": platform,
                "content_type": content_type,
                "suggested_tags": suggested_tags
            }
    except Exception as e:
        logger.error(f"Error fetching metadata: {e}")
        return default_result

# ============== Auth Routes ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email.lower(),
        "password": hash_password(user_data.password),
        "name": user_data.name or user_data.email.split('@')[0],
        "plan_type": "free",
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user)
    
    token = create_access_token(user_id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            plan_type=user["plan_type"],
            created_at=user["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email.lower()})
    
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(user["id"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user.get("name"),
            plan_type=user.get("plan_type", "free"),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user.get("name"),
        plan_type=current_user.get("plan_type", "free"),
        created_at=current_user["created_at"]
    )

# ============== URL Metadata Route ==============

@api_router.post("/extract-metadata", response_model=MetadataResponse)
async def extract_metadata(data: dict, current_user: dict = Depends(get_current_user)):
    url = data.get("url", "")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    metadata = await fetch_url_metadata(url)
    return MetadataResponse(**metadata)

# ============== Saved Items Routes ==============

@api_router.post("/items", response_model=SavedItemResponse)
async def create_item(item_data: SavedItemCreate, current_user: dict = Depends(get_current_user)):
    # Fetch metadata if not provided
    if not item_data.title or not item_data.platform:
        metadata = await fetch_url_metadata(item_data.url)
        if not item_data.title:
            item_data.title = metadata["title"]
        if not item_data.platform:
            item_data.platform = metadata["platform"]
        if not item_data.content_type:
            item_data.content_type = metadata["content_type"]
        if not item_data.thumbnail_url:
            item_data.thumbnail_url = metadata["thumbnail_url"]
    
    item_id = str(uuid.uuid4())
    item = {
        "id": item_id,
        "user_id": current_user["id"],
        "url": item_data.url,
        "title": item_data.title or item_data.url,
        "thumbnail_url": item_data.thumbnail_url,
        "platform": item_data.platform or "Web",
        "content_type": item_data.content_type or "article",
        "notes": item_data.notes or "",
        "tags": item_data.tags or [],
        "collections": item_data.collections or [],
        "created_at": datetime.utcnow()
    }
    
    await db.items.insert_one(item)
    
    return SavedItemResponse(**item)

@api_router.get("/items", response_model=List[SavedItemResponse])
async def get_items(
    sort: str = "newest",
    platform: Optional[str] = None,
    collection: Optional[str] = None,
    tag: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}
    
    if platform:
        query["platform"] = platform
    if collection:
        query["collections"] = collection
    if tag:
        query["tags"] = tag
    
    sort_order = -1 if sort == "newest" else 1
    
    items = await db.items.find(query).sort("created_at", sort_order).to_list(1000)
    return [SavedItemResponse(**item) for item in items]

@api_router.get("/items/{item_id}", response_model=SavedItemResponse)
async def get_item(item_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"id": item_id, "user_id": current_user["id"]})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return SavedItemResponse(**item)

@api_router.put("/items/{item_id}", response_model=SavedItemResponse)
async def update_item(item_id: str, update_data: SavedItemUpdate, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"id": item_id, "user_id": current_user["id"]})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if update_dict:
        await db.items.update_one({"id": item_id}, {"$set": update_dict})
    
    updated_item = await db.items.find_one({"id": item_id})
    return SavedItemResponse(**updated_item)

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.items.delete_one({"id": item_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

# ============== Collections Routes ==============

@api_router.post("/collections", response_model=CollectionResponse)
async def create_collection(data: CollectionCreate, current_user: dict = Depends(get_current_user)):
    # Check collection limit for free users
    if current_user.get("plan_type", "free") == "free":
        count = await db.collections.count_documents({"user_id": current_user["id"]})
        if count >= 5:
            raise HTTPException(status_code=403, detail="Free plan limited to 5 collections. Upgrade to Pro for unlimited.")
    
    collection_id = str(uuid.uuid4())
    collection = {
        "id": collection_id,
        "user_id": current_user["id"],
        "name": data.name,
        "created_at": datetime.utcnow()
    }
    
    await db.collections.insert_one(collection)
    
    return CollectionResponse(**collection, item_count=0)

@api_router.get("/collections", response_model=List[CollectionResponse])
async def get_collections(current_user: dict = Depends(get_current_user)):
    collections = await db.collections.find({"user_id": current_user["id"]}).to_list(100)
    
    result = []
    for col in collections:
        item_count = await db.items.count_documents({
            "user_id": current_user["id"],
            "collections": col["id"]
        })
        result.append(CollectionResponse(**col, item_count=item_count))
    
    return result

@api_router.put("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection(collection_id: str, data: CollectionUpdate, current_user: dict = Depends(get_current_user)):
    collection = await db.collections.find_one({"id": collection_id, "user_id": current_user["id"]})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    await db.collections.update_one({"id": collection_id}, {"$set": {"name": data.name}})
    
    updated = await db.collections.find_one({"id": collection_id})
    item_count = await db.items.count_documents({
        "user_id": current_user["id"],
        "collections": collection_id
    })
    
    return CollectionResponse(**updated, item_count=item_count)

@api_router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.collections.delete_one({"id": collection_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Remove collection from all items
    await db.items.update_many(
        {"user_id": current_user["id"], "collections": collection_id},
        {"$pull": {"collections": collection_id}}
    )
    
    return {"message": "Collection deleted"}

# ============== Search Route ==============

@api_router.get("/search", response_model=List[SavedItemResponse])
async def search_items(q: str, current_user: dict = Depends(get_current_user)):
    if not q or len(q) < 2:
        return []
    
    # Create text search query
    query = {
        "user_id": current_user["id"],
        "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"notes": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
            {"platform": {"$regex": q, "$options": "i"}},
            {"url": {"$regex": q, "$options": "i"}}
        ]
    }
    
    items = await db.items.find(query).sort("created_at", -1).to_list(100)
    return [SavedItemResponse(**item) for item in items]

# ============== Tags Route ==============

@api_router.get("/tags", response_model=List[str])
async def get_all_tags(current_user: dict = Depends(get_current_user)):
    """Get all unique tags for the user"""
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags"}},
        {"$sort": {"_id": 1}}
    ]
    
    result = await db.items.aggregate(pipeline).to_list(100)
    return [r["_id"] for r in result]

# ============== AI Features ==============

# Platform to auto-collection mapping
PLATFORM_COLLECTIONS = {
    'YouTube': 'Videos',
    'TikTok': 'Videos',
    'Instagram': 'Social',
    'X': 'Social',
    'LinkedIn': 'Professional',
    'Medium': 'Articles',
    'Substack': 'Articles',
    'Reddit': 'Discussions',
    'GitHub': 'Tech & Code',
    'Web': 'Web Saves'
}

async def generate_ai_summary(title: str, url: str, platform: str) -> List[str]:
    """Generate AI summary using GPT-4"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return []
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"summary-{uuid.uuid4()}",
            system_message="You are a helpful assistant that creates concise bullet-point summaries. Always respond with exactly 3-5 bullet points, each starting with '•'. Keep each point under 15 words."
        ).with_model("openai", "gpt-4")
        
        user_message = UserMessage(
            text=f"Create a brief summary of this saved content:\nTitle: {title}\nPlatform: {platform}\nURL: {url}\n\nProvide 3-5 key bullet points about what this content likely covers based on the title."
        )
        
        response = await chat.send_message(user_message)
        
        # Parse bullet points from response
        lines = response.strip().split('\n')
        bullets = []
        for line in lines:
            line = line.strip()
            if line.startswith('•') or line.startswith('-') or line.startswith('*'):
                bullet = line.lstrip('•-* ').strip()
                if bullet:
                    bullets.append(bullet)
        
        return bullets[:5] if bullets else []
    except Exception as e:
        logger.error(f"AI summary error: {e}")
        return []

async def suggest_auto_collection(title: str, platform: str, user_id: str) -> Optional[Dict]:
    """Suggest auto-collection based on platform and AI analysis"""
    try:
        # First try platform-based suggestion
        platform_collection = PLATFORM_COLLECTIONS.get(platform, 'General')
        
        # Check if user has this collection
        existing = await db.collections.find_one({
            "user_id": user_id,
            "name": platform_collection
        })
        
        if existing:
            return {
                "collection_name": platform_collection,
                "reason": f"Based on {platform} content",
                "is_new": False,
                "existing_collection_id": existing["id"]
            }
        
        # Try AI-based suggestion for more specific categorization
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if api_key:
            chat = LlmChat(
                api_key=api_key,
                session_id=f"collection-{uuid.uuid4()}",
                system_message="You are a content organizer. Suggest ONE collection name (2-3 words max) for organizing content. Just respond with the collection name, nothing else."
            ).with_model("openai", "gpt-4")
            
            user_message = UserMessage(
                text=f"Suggest a collection name for: '{title}' from {platform}"
            )
            
            response = await chat.send_message(user_message)
            ai_suggestion = response.strip().strip('"\'')
            
            if ai_suggestion and len(ai_suggestion) < 30:
                # Check if this collection exists
                existing_ai = await db.collections.find_one({
                    "user_id": user_id,
                    "name": {"$regex": f"^{ai_suggestion}$", "$options": "i"}
                })
                
                if existing_ai:
                    return {
                        "collection_name": existing_ai["name"],
                        "reason": f"AI suggested based on content",
                        "is_new": False,
                        "existing_collection_id": existing_ai["id"]
                    }
                
                return {
                    "collection_name": ai_suggestion,
                    "reason": f"AI suggested based on content",
                    "is_new": True,
                    "existing_collection_id": None
                }
        
        return {
            "collection_name": platform_collection,
            "reason": f"Based on {platform} content",
            "is_new": True,
            "existing_collection_id": None
        }
    except Exception as e:
        logger.error(f"Auto-collection suggestion error: {e}")
        return None

async def generate_weekly_summary(user_id: str, items: List[dict]) -> Optional[str]:
    """Generate weekly digest summary"""
    try:
        if not items:
            return None
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return None
        
        # Prepare items summary
        items_text = "\n".join([f"- {item.get('title', 'Untitled')} ({item.get('platform', 'Web')})" for item in items[:10]])
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"digest-{uuid.uuid4()}",
            system_message="You are a helpful assistant that creates brief, encouraging weekly summaries. Keep it under 50 words, friendly and motivational."
        ).with_model("openai", "gpt-4")
        
        user_message = UserMessage(
            text=f"Create a brief weekly summary for someone who saved these items:\n{items_text}\n\nMention the themes and encourage them to review their saves."
        )
        
        response = await chat.send_message(user_message)
        return response.strip()
    except Exception as e:
        logger.error(f"Weekly summary error: {e}")
        return None

# ============== AI Endpoints ==============

@api_router.post("/items/{item_id}/ai-summary")
async def generate_item_summary(item_id: str, current_user: dict = Depends(get_current_user)):
    """Generate AI summary for an item"""
    item = await db.items.find_one({"id": item_id, "user_id": current_user["id"]})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    summary = await generate_ai_summary(item.get("title", ""), item.get("url", ""), item.get("platform", "Web"))
    
    if summary:
        await db.items.update_one({"id": item_id}, {"$set": {"ai_summary": summary}})
    
    return {"summary": summary}

@api_router.get("/items/{item_id}/suggest-collection")
async def get_collection_suggestion(item_id: str, current_user: dict = Depends(get_current_user)):
    """Get AI collection suggestion for an item"""
    item = await db.items.find_one({"id": item_id, "user_id": current_user["id"]})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    suggestion = await suggest_auto_collection(
        item.get("title", ""),
        item.get("platform", "Web"),
        current_user["id"]
    )
    
    return suggestion or {"collection_name": "General", "reason": "Default suggestion", "is_new": True}

@api_router.get("/insights", response_model=InsightsResponse)
async def get_insights(current_user: dict = Depends(get_current_user)):
    """Get user insights and weekly digest"""
    user_id = current_user["id"]
    
    # Total items
    total_items = await db.items.count_documents({"user_id": user_id})
    
    # Items this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    items_this_week = await db.items.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": week_ago}
    })
    
    # Top platforms
    platform_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$platform", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_platforms = await db.items.aggregate(platform_pipeline).to_list(5)
    
    # Top tags
    tags_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_tags = await db.items.aggregate(tags_pipeline).to_list(5)
    
    # Collections count
    collections_count = await db.collections.count_documents({"user_id": user_id})
    
    # Resurfaced items (saved 30+ days ago)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    old_items = await db.items.find({
        "user_id": user_id,
        "created_at": {"$lte": thirty_days_ago}
    }).sort("created_at", 1).limit(3).to_list(3)
    
    resurfaced = []
    for item in old_items:
        days_ago = (datetime.utcnow() - item["created_at"]).days
        resurfaced.append({
            "id": item["id"],
            "title": item.get("title", "Untitled"),
            "thumbnail_url": item.get("thumbnail_url"),
            "platform": item.get("platform", "Web"),
            "days_ago": days_ago,
            "message": f"You saved this {days_ago} days ago"
        })
    
    # Generate weekly summary
    recent_items = await db.items.find({
        "user_id": user_id,
        "created_at": {"$gte": week_ago}
    }).to_list(10)
    
    weekly_summary = await generate_weekly_summary(user_id, recent_items)
    
    return InsightsResponse(
        total_items=total_items,
        items_this_week=items_this_week,
        top_platforms=[{"platform": p["_id"], "count": p["count"]} for p in top_platforms],
        top_tags=[{"tag": t["_id"], "count": t["count"]} for t in top_tags],
        collections_count=collections_count,
        weekly_summary=weekly_summary,
        resurfaced_items=resurfaced
    )

@api_router.get("/resurfaced")
async def get_resurfaced_items(current_user: dict = Depends(get_current_user)):
    """Get items to resurface (saved 30+ days ago)"""
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    items = await db.items.find({
        "user_id": current_user["id"],
        "created_at": {"$lte": thirty_days_ago}
    }).sort("created_at", 1).limit(5).to_list(5)
    
    result = []
    for item in items:
        days_ago = (datetime.utcnow() - item["created_at"]).days
        result.append({
            **SavedItemResponse(**item).dict(),
            "days_ago": days_ago,
            "resurface_message": f"You saved this {days_ago} days ago"
        })
    
    return result

# ============== User Preferences ==============

@api_router.put("/users/preferences")
async def update_preferences(preferences: UserPreferences, current_user: dict = Depends(get_current_user)):
    """Update user preferences from onboarding"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "preferences": preferences.dict(),
            "onboarding_completed": preferences.onboarding_completed
        }}
    )
    return {"message": "Preferences updated"}

@api_router.get("/users/preferences")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    """Get user preferences"""
    user = await db.users.find_one({"id": current_user["id"]})
    return user.get("preferences", {
        "save_types": [],
        "usage_goals": [],
        "onboarding_completed": False
    })

# ============== Health Check ==============

@api_router.get("/")
async def root():
    return {"message": "Stash API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
