# Stash Pro - Product Requirements Document

## Original Problem Statement
Build a cross-platform mobile app (iOS + Android) called "Stash Pro" for saving and organizing content with AI-powered suggestions.

## Core Product Vision
A private content vault where users save content from anywhere, organize with collections, and get AI-powered suggestions (that users approve, not auto-apply).

**Key Principle**: "AI suggests, User approves" - All AI features require explicit user action.

---

## What's Been Implemented

### Completed Features (as of Feb 2025)

#### Onboarding & Authentication
- [x] New 5-screen onboarding flow with personalization
- [x] JWT-based authentication (login/register)
- [x] "Free Forever" vs "Pro Trial" choice at end of onboarding

#### Paywall & Pricing
- [x] Redesigned paywall with 14-day free trial
- [x] New pricing: $39.99/year or $4.99/month
- [x] Social proof elements (user count, progress bar)
- [x] Trust elements (no charge for 14 days, cancel anytime)

#### Core Functionality
- [x] Save items (URLs with metadata)
- [x] Create and manage collections
- [x] Delete items from collections
- [x] Search functionality
- [x] Item detail view with AI Suggestions panel

#### AI Features (via Emergent LLM Key + GPT-4)
- [x] Smart tag suggestions (user must approve)
- [x] AI summaries (generate on-demand)
- [x] Key Ideas extraction
- [x] Collection recommendations

#### Free Tier Limits
- 500 saves
- 10 collections  
- 3 AI actions/month

#### Branding
- [x] App renamed to "Stash Pro" throughout

---

## Bug Fixes Applied

### Session: Feb 12, 2025
- [x] Fixed missing color references (`gray300`, `gray400`, `gray600`) in `upgrade.tsx` and `onboarding.tsx`

### Previous Sessions
- [x] Fixed `generateSummary` not defined error
- [x] Fixed `colors.white` undefined crash on item detail page
- [x] Fixed unresponsive delete button in collection detail
- [x] Fixed `import json` missing in backend for Key Ideas feature
- [x] Replaced emojis with Ionicons for professional look

---

## Prioritized Backlog

### P0 - Critical (Current Sprint)
1. **Complete Share Extension Implementation** - IN PROGRESS
   - Build share panel UI
   - Implement URL metadata extraction
   - Connect to itemsStore
   - Handle offline queuing

2. **Post-Signup "First Save" Tutorial Screen**
   - Guide new users after account creation

### P1 - High Priority
3. **Free Tier AI Action Counter**
   - Display "X/3 this month" for free users
   - Show upsell message when exhausted

4. **Analytics Events**
   - Track: onboarding completion, AI usage, paywall views, conversions

5. **Marketing Copy Update**
   - Add "Save from anywhere in 2 taps" messaging

### P2 - Medium Priority
6. **Dark Mode**
   - Theme switcher in settings
   - Full dark color palette

7. **Real Payment Integration**
   - Stripe or RevenueCat for actual subscriptions

### P3 - Nice to Have
8. **Push Notifications for Smart Reminders**
9. **Haptic Feedback & Animations Polish**

---

## Technical Architecture

```
/app
├── backend/
│   ├── server.py         # FastAPI, all API endpoints, AI integration
│   ├── .env              # MONGO_URL, EMERGENT_API_KEY
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── (tabs)/       # Tab navigation screens
    │   ├── onboarding.tsx
    │   ├── upgrade.tsx   # Paywall
    │   ├── item/[id].tsx # Item detail with AI Suggestions
    │   ├── collection/[id].tsx
    │   ├── share.tsx     # Share Extension UI (WIP)
    │   └── ...
    ├── src/
    │   ├── store/        # Zustand stores
    │   ├── hooks/        # useTheme, etc.
    │   ├── api/          # metadataService.ts
    │   └── utils/        # theme.ts, config.ts
    └── app.json          # Expo config
```

## Key Integrations
- **AI**: OpenAI GPT-4 via `emergentintegrations` library with Emergent LLM Key
- **Database**: MongoDB
- **Framework**: Expo (React Native) + FastAPI

---

## Test Credentials
- Register new user: Any email/password (e.g., `test@test.com` / `password`)
- New users start on "Free" plan with 500 saves, 10 collections
