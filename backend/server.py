from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
import httpx
from bs4 import BeautifulSoup
import re
from urllib.parse import urlparse

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

class CollectionCreate(BaseModel):
    name: str

class CollectionUpdate(BaseModel):
    name: str

class CollectionResponse(BaseModel):
    id: str
    user_id: str
    name: str
    item_count: int = 0
    created_at: datetime

class MetadataResponse(BaseModel):
    title: str
    thumbnail_url: Optional[str] = None
    platform: str
    content_type: str
    suggested_tags: List[str] = []

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
