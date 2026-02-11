# Stash - Content Saving & Organizing App

## Original Problem Statement
Build a cross-platform mobile app (iOS + Android) called "Stash" for saving and organizing content. The app should allow users to save URLs, organize them in collections, add notes/tags, and leverage AI features for smarter content management.

## Target Users
- Content collectors who save articles, videos, and social media posts
- Professionals who need to organize research and references
- Creators who gather inspiration from various platforms
- Anyone who wants a "second brain" for their saved content

## Tech Stack
- **Frontend**: React Native + Expo (TypeScript)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4 via emergentintegrations library
- **Auth**: JWT-based authentication

## Core Requirements

### Authentication (Completed)
- [x] User registration with email/password
- [x] User login
- [x] JWT token-based auth
- [x] Protected routes

### Content Management (Completed)
- [x] Save items via URL
- [x] Auto-extract metadata (title, thumbnail, platform)
- [x] Add notes to saved items
- [x] Tag system
- [x] Edit/delete items

### Collections (Completed)
- [x] Create collections
- [x] Edit/delete collections
- [x] Add items to collections
- [x] Collection limit enforcement (5 for free, unlimited for Pro)

### Search (Completed)
- [x] Basic search (titles, tags, notes, platform)
- [x] Advanced search (Pro feature) - search within notes & tags

### AI Features (Completed)
- [x] AI-powered summaries
- [x] Key idea extraction
- [x] Smart tag suggestions with clustering
- [x] Action item generation
- [x] Auto-collection suggestions

### Stash Pro - Subscription Tier (Completed - Feb 8, 2025)
- [x] Unlimited collections (free users limited to 5)
- [x] Advanced search (search within notes & tags)
- [x] Smart resurfacing reminders
- [x] Vault export (backup all data)
- [x] Priority performance & AI features access
- [x] Upgrade flow with plan selection (monthly/yearly)
- [x] Cancel subscription functionality
- [x] Pro status display in profile

### User Experience (Completed)
- [x] Multi-step onboarding flow for new users
- [x] Home dashboard with stats and quick actions
- [x] Insights (weekly digest, resurfaced items)
- [x] Tab-based navigation (Home, Inbox, Search, Collections, Profile)
- [x] Responsive UI

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Items
- `POST /api/items` - Create item
- `GET /api/items` - List items (with filters)
- `GET /api/items/{id}` - Get item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item

### Collections
- `POST /api/collections` - Create collection
- `GET /api/collections` - List collections
- `PUT /api/collections/{id}` - Update collection
- `DELETE /api/collections/{id}` - Delete collection

### AI Features
- `POST /api/items/{id}/ai-summary` - Generate AI summary
- `POST /api/items/{id}/extract-ideas` - Extract key ideas
- `POST /api/items/{id}/smart-tags` - Get smart tag suggestions
- `POST /api/items/{id}/action-items` - Generate action items
- `GET /api/items/{id}/suggest-collection` - Get collection suggestion

### Pro Features
- `GET /api/users/plan` - Get user's plan and limits
- `POST /api/users/upgrade-pro` - Upgrade to Pro (MOCKED)
- `POST /api/users/cancel-pro` - Cancel Pro subscription
- `GET /api/search/advanced` - Advanced search (Pro only)
- `GET /api/export/vault` - Export all data (Pro only)
- `GET /api/reminders` - Smart reminders (Pro only)

### Other
- `GET /api/insights` - Get user insights and weekly digest
- `GET /api/search` - Basic search
- `GET /api/tags` - Get all user tags
- `POST /api/extract-metadata` - Extract URL metadata

## Database Schema

### users
```json
{
  "id": "uuid",
  "email": "string",
  "password": "hashed",
  "name": "string",
  "plan_type": "free|pro",
  "is_pro": "boolean",
  "pro_expires_at": "datetime|null",
  "preferences": {
    "save_types": [],
    "usage_goals": [],
    "onboarding_completed": "boolean"
  },
  "created_at": "datetime"
}
```

### items
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "url": "string",
  "title": "string",
  "thumbnail_url": "string|null",
  "platform": "string",
  "content_type": "string",
  "notes": "string",
  "tags": ["string"],
  "collections": ["uuid"],
  "ai_summary": ["string"],
  "extracted_ideas": [{}],
  "action_items": [{}],
  "created_at": "datetime"
}
```

### collections
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "is_auto": "boolean",
  "created_at": "datetime"
}
```

## Plan Limits (Updated Feb 11, 2025)

### Free Plan
- Max 10 collections
- Max 500 saves (3 months of collecting)
- Basic search (find by title)
- 3 AI suggestions per month
- Every device sync
- **Psychological Trigger**: At 450+ saves, upgrade banner appears
- Free forever

### Pro Plan - $39.99/year or $4.99/month
- Unlimited saves & collections
- Advanced search (within notes & tags)
- AI suggests smart tags - user approves in 1 tap
- AI generates summaries - on demand
- AI recommends collections - one tap to add
- Smart resurfacing reminders
- Vault export
- Priority performance
- **Trial**: 14 days free (card required)

## File Structure
```
/app
├── backend/
│   ├── server.py          # Main FastAPI app
│   ├── .env               # Environment variables
│   ├── requirements.txt   # Python dependencies
│   └── tests/             # Backend tests
└── frontend/
    ├── app/
    │   ├── (tabs)/        # Tab screens
    │   │   ├── home.tsx
    │   │   ├── inbox.tsx
    │   │   ├── search.tsx
    │   │   ├── collections.tsx
    │   │   └── profile.tsx
    │   ├── item/[id].tsx  # Item detail
    │   ├── collection/[id].tsx
    │   ├── upgrade.tsx    # Pro paywall
    │   ├── onboarding.tsx # User onboarding
    │   ├── login.tsx
    │   └── register.tsx
    └── src/
        ├── components/    # UI components
        ├── store/         # Zustand stores
        ├── hooks/
        ├── types/
        └── utils/
```

## Testing
- Test file: `/app/backend/tests/test_pro_subscription.py`
- 16 tests covering Pro subscription features
- All tests passing (100%)

## Deployment Readiness (Feb 9, 2025)
All deployment blockers resolved:
- ✅ requirements.txt: Added httpx, beautifulsoup4, lxml
- ✅ Expo env: Added EXPO_PACKAGER_PROXY_URL
- ✅ JWT Secret: Added to backend/.env
- ✅ Database queries: Optimized with projections (exclude _id)
- ✅ N+1 query fix: Collections endpoint uses aggregation pipeline
- ✅ CORS: Properly configured
- ✅ Environment variables: All URLs/credentials from .env

## Known Limitations
1. Pro upgrade is MOCKED - no real payment integration
2. Pro subscription duration hardcoded to 30 days
3. No automatic Pro expiration enforcement

## Upcoming/Future Tasks

### P1 - High Priority
- None currently

### P2 - Medium Priority
- Dark mode implementation
- Share extension onboarding screen
- Push notifications for smart reminders

### P3 - Low Priority
- UI/UX polish and animations
- Real payment integration (Stripe/RevenueCat)
- Pro expiration enforcement
