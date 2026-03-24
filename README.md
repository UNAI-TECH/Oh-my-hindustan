<p align="center">
  <h1 align="center">🇮🇳 Oh My Hindustan — Jan Samvad</h1>
  <p align="center">
    <strong>A real-time citizen journalism and community engagement platform</strong>
  </p>
  <p align="center">
    Mobile App · Creator Studio · Admin Dashboard · REST API
  </p>
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Application Workflow](#application-workflow)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Projects](#running-the-projects)
- [API Reference](#api-reference)
- [Deployment](#deployment)

---

## Overview

**Oh My Hindustan (Jan Samvad)** is a full-stack digital media platform that enables citizen journalism, creator-driven content publishing, and real-time community engagement. The platform consists of four interconnected applications:

| Application | Purpose | Users |
|---|---|---|
| **Mobile App** | News feed, voting, commenting, saving, following | Citizens (Public) |
| **Creator Studio** | Content creation, analytics, audience management | Approved Creators |
| **Admin Dashboard** | Creator approvals, platform moderation, analytics | Administrators |
| **Backend API** | Authentication, data management, business logic | All applications |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE CLOUD                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ Postgres │  │   Auth   │  │ Storage  │  │   Realtime    │   │
│  │    DB    │  │ (JWT/    │  │ (Media   │  │  (WebSocket   │   │
│  │          │  │  OAuth)  │  │  Bucket) │  │   Listeners)  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬────────┘   │
│       │              │             │               │            │
└───────┼──────────────┼─────────────┼───────────────┼────────────┘
        │              │             │               │
   PostgREST      Supabase Auth   Storage API    Realtime API
        │              │             │               │
  ┌─────┴──────────────┴─────────────┴───────────────┴─────────┐
  │                    Supabase JS Client                       │
  └──────────┬─────────────────┬───────────────┬───────────────┘
             │                 │               │
     ┌───────┴───────┐ ┌──────┴──────┐ ┌──────┴──────┐
     │  Mobile App   │ │  Creator    │ │   Admin     │
     │  (Expo/RN)    │ │  Studio     │ │  Dashboard  │
     │  Port: 8081   │ │  Port: 3000 │ │  Port: 5173 │
     └───────────────┘ └─────────────┘ └─────────────┘
```

All three frontend applications connect **directly** to Supabase using the `@supabase/supabase-js` client. The backend REST API serves as an optional layer for complex business logic that cannot be handled through PostgREST alone.

---

## Tech Stack

### 📱 Mobile App (`/app`)
| Category | Technology | Version |
|---|---|---|
| Framework | React Native (Expo) | SDK 55 |
| Language | TypeScript | 5.9 |
| Navigation | React Navigation (Native Stack) | 7.x |
| State Management | React Context API | — |
| Database Client | Supabase JS | 2.99 |
| Authentication | Supabase Auth + Google OAuth | — |
| UI Components | Expo Vector Icons (Ionicons) | 15.x |
| Styling | React Native StyleSheet | — |
| Gradient Effects | expo-linear-gradient | 55.x |
| HTTP Client | Axios | 1.13 |
| Storage | AsyncStorage | 2.2 |

### 🎬 Creator Studio (`/Hindusthan_creators`)
| Category | Technology | Version |
|---|---|---|
| Framework | React | 19.0 |
| Build Tool | Vite | 6.2 |
| Language | TypeScript | 5.8 |
| Styling | Tailwind CSS | v4.1 |
| Charts | Recharts | 3.8 |
| Animations | Motion (Framer) | 12.x |
| Icons | Lucide React | 0.546 |
| Database Client | Supabase JS | 2.99 |
| AI Integration | Google GenAI SDK | 1.29 |
| CSS Utilities | clsx, tailwind-merge | — |

### 🛡️ Admin Dashboard (`/admin`)
| Category | Technology | Version |
|---|---|---|
| Framework | React | 19.2 |
| Build Tool | Vite | 8.0 |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS | v3.4 |
| Routing | React Router DOM | 7.13 |
| Animations | Framer Motion | 12.38 |
| Icons | Lucide React | 0.577 |
| Database Client | Supabase JS | 2.99 |

### ⚙️ Backend API (`/backend`)
| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20.x |
| Framework | Express.js | 4.19 |
| Language | TypeScript | 5.4 |
| ORM | Prisma Client | 5.11 |
| Database Driver | pg (PostgreSQL) | 8.20 |
| Authentication | JSON Web Tokens (JWT) | 9.0 |
| Password Hashing | bcryptjs | 2.4 |
| Validation | Zod | 3.22 |
| Security | Helmet, CORS, Rate Limiting | — |
| Logging | Morgan | 1.10 |

### 🗄️ Database & Infrastructure
| Category | Technology |
|---|---|
| Database | PostgreSQL (Supabase-managed) |
| Auth Provider | Supabase Auth (Email + Google OAuth) |
| File Storage | Supabase Storage (media bucket) |
| Real-Time | Supabase Realtime (WebSocket) |
| Schema Management | Prisma Migrate |
| Row Level Security | Supabase RLS Policies |

---

## Project Structure

```
Oh-My-Hindustan/
│
├── app/                              # 📱 Mobile Application (Expo/React Native)
│   ├── src/
│   │   ├── api/
│   │   │   └── services.ts           # Supabase data access layer
│   │   ├── components/
│   │   │   └── BottomNavBar.tsx       # Tab navigation (Home, Search, Library, Settings)
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Authentication state & flows
│   │   │   └── FeedContext.tsx        # Feed data & real-time subscriptions
│   │   ├── lib/
│   │   │   └── supabaseClient.ts     # Supabase client initialization
│   │   ├── navigation/
│   │   │   └── RootNavigator.tsx      # Stack navigator configuration
│   │   ├── screens/
│   │   │   ├── Auth/                  # Login, Signup, OTP, Onboarding
│   │   │   ├── Main/                  # HomeFeed, ArticleDetail
│   │   │   ├── Other/                 # Settings, Library, PersonalDetails, Notifications
│   │   │   ├── Profile/              # CreatorProfile, ProfileScreen
│   │   │   └── Home/                  # Home tab screens
│   │   ├── theme/
│   │   │   └── Theme.ts              # Design tokens & color palette
│   │   ├── types/                     # TypeScript type definitions
│   │   └── utils/
│   │       └── uuid.ts               # UUID generator (React Native compatible)
│   ├── app.json                       # Expo configuration
│   └── package.json
│
├── backend/                           # ⚙️ REST API (Express + Prisma)
│   ├── prisma/
│   │   └── schema.prisma             # Database schema (source of truth)
│   ├── src/
│   │   ├── controllers/              # Request handlers
│   │   ├── middleware/               # Auth, rate limiting, error handling
│   │   ├── routes/                   # API route definitions
│   │   ├── types/                    # TypeScript interfaces
│   │   └── index.ts                  # Express server entry point
│   ├── scripts/                      # Utility scripts (DB checks, seeding)
│   └── package.json
│
├── Hindusthan_creators/               # 🎬 Creator Studio (Vite + React)
│   ├── src/
│   │   ├── components/               # Reusable UI components (Sidebar, etc.)
│   │   ├── lib/
│   │   │   └── supabaseClient.ts     # Supabase client
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Creator analytics overview
│   │   │   ├── Content.tsx            # Post management (CRUD)
│   │   │   ├── Analytics.tsx          # Detailed engagement analytics
│   │   │   ├── Comments.tsx           # Comment moderation
│   │   │   ├── Notifications.tsx      # Real-time notifications
│   │   │   ├── Profile.tsx            # Creator profile (avatar + cover)
│   │   │   ├── Subtitles.tsx          # AI-powered subtitle generation
│   │   │   ├── Earn.tsx               # Monetization dashboard
│   │   │   ├── LandingPage.tsx        # Public creator landing page
│   │   │   ├── JoinForm.tsx           # Creator application form
│   │   │   ├── LoginPage.tsx          # Creator login
│   │   │   └── RequestPending.tsx     # Application status tracker
│   │   ├── services/
│   │   │   ├── contentService.ts      # Content CRUD + real-time subscriptions
│   │   │   ├── profileService.ts      # Profile management
│   │   │   ├── notificationService.ts # Notification handling
│   │   │   └── videoService.ts        # Video content management
│   │   └── App.tsx                    # Root component with routing
│   └── package.json
│
├── admin/                             # 🛡️ Admin Dashboard (Vite + React)
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.ts           # Supabase client
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Platform-wide analytics
│   │   │   ├── CreatorRequests.tsx     # Approve/reject creator applications
│   │   │   └── LoginPage.tsx          # Admin authentication
│   │   └── App.tsx                    # Root component with routing
│   └── package.json
│
└── supabase_rls_policies.sql          # Row Level Security policies
```

---

## Database Schema

The database uses **PascalCase** table names and **camelCase** column names (Prisma convention).

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     User     │    │     Post     │    │     Vote     │
├──────────────┤    ├──────────────┤    ├──────────────┤
│ id (PK)      │◄──┤ authorId(FK) │    │ id (PK)      │
│ email        │    │ id (PK)      │◄──┤ postId (FK)  │
│ username     │    │ title        │    │ userId (FK)──┼──► User
│ password     │    │ subtitle     │    │ type (1/-1)  │
│ role (enum)  │    │ content      │    │ createdAt    │
│ bio          │    │ type (enum)  │    └──────────────┘
│ avatarUrl    │    │ category     │
│ coverUrl     │    │ thumbnail    │    ┌──────────────┐
│ phone        │    │ videoDuration│    │   Comment    │
│ createdAt    │    │ isTrending   │    ├──────────────┤
│ updatedAt    │    │ createdAt    │    │ id (PK)      │
└──────┬───────┘    │ updatedAt    │    │ content      │
       │            └──────────────┘    │ postId (FK)──┼──► Post
       │                                │ userId (FK)──┼──► User
       │            ┌──────────────┐    │ createdAt    │
       │            │    Follow    │    │ updatedAt    │
       │            ├──────────────┤    └──────────────┘
       ├───────────►│ followerId   │
       ├───────────►│ followingId  │    ┌──────────────┐
       │            │ createdAt    │    │     Save     │
       │            └──────────────┘    ├──────────────┤
       │                                │ id (PK)      │
       │            ┌──────────────┐    │ userId (FK)──┼──► User
       │            │ Notification │    │ postId (FK)──┼──► Post
       │            ├──────────────┤    │ createdAt    │
       ├───────────►│ userId (FK)  │    └──────────────┘
       │            │ type         │
       │            │ title        │    ┌────────────────────┐
       │            │ message      │    │  CreatorRequest    │
       │            │ isRead       │    ├────────────────────┤
       │            │ targetId     │    │ id (PK, UUID)      │
       │            │ createdAt    │    │ name               │
       │            └──────────────┘    │ email (unique)     │
       │                                │ bio                │
       │                                │ portfolioUrl       │
       │                                │ status (enum)      │
       │                                │ adminMessage       │
       │                                │ created_at         │
       │                                │ updated_at         │
       │                                └────────────────────┘
       │
  Enums: Role (CITIZEN, ANALYST, ADMIN, CREATOR)
         PostType (NEWS, BLOG, VIDEO, FORUM, DEBATE, UPDATE, POLICY_TYPE, PROMO)
         RequestStatus (PENDING, APPROVED, REJECTED)
```

### Key Constraints
- `Vote`: Unique on `(userId, postId)` — one vote per user per post
- `Save`: Unique on `(userId, postId)` — one save per user per post
- `Follow`: Unique on `(followerId, followingId)` — no duplicate follows
- `User`: Unique on `email` and `username`

---

## Application Workflow

### 1. Creator Onboarding Flow
```
Citizen visits Creator Landing Page
        │
        ▼
Submits "Join as Creator" form
        │
        ▼
CreatorRequest created (status: PENDING)
        │
        ▼
Admin Dashboard receives request (real-time)
        │
        ├── APPROVE ──► Admin sets login credentials
        │                       │
        │                       ▼
        │               Supabase Auth user created
        │               User table row updated (role: ANALYST)
        │                       │
        │                       ▼
        │               Creator logs into Creator Studio
        │
        └── REJECT ──► Admin provides reason
                               │
                               ▼
                       Creator sees rejection message
```

### 2. Content Publishing Flow
```
Creator opens Creator Studio → Content page
        │
        ▼
Creates new post (title, content, category, thumbnail)
        │
        ▼
Post inserted into "Post" table via Supabase
        │
        ▼
Supabase Realtime triggers WebSocket event
        │
        ├──► Mobile App feed updates instantly
        ├──► Creator Dashboard stats update
        └──► Admin Dashboard analytics update
```

### 3. User Engagement Flow
```
Citizen opens article in Mobile App
        │
        ├── 👍 Upvote/👎 Downvote ──► Vote table (insert/update/delete)
        │                                    │
        ├── 💬 Comment ──────────────► Comment table (insert)
        │                                    │
        ├── 🔖 Save ─────────────────► Save table (insert/delete)
        │                                    │
        ├── ➕ Follow Creator ────────► Follow table (insert/delete)
        │                                    │
        └── All actions create ──────► Notification table (for creator)
                                             │
                                             ▼
                                   Creator Studio Notifications
                                   page updates in real-time
```

### 4. Authentication Flow
```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App                           │
│                                                         │
│   Email/Password Login ──► Supabase Auth                │
│   Google OAuth Login ──────► Supabase Auth via Proxy     │
│   Phone Number Login ──────► Lookup email → Supabase    │
│                                                         │
│   On success: Fetch User row → Set AuthContext          │
│   Role check: CREATOR/ADMIN blocked (app is for citizens)│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Creator Studio / Admin Dashboard            │
│                                                         │
│   Email/Password Login ──► Supabase Auth                │
│   Role check: Must be ANALYST (creator) or ADMIN        │
└─────────────────────────────────────────────────────────┘
```

---

## Setup & Installation

### Prerequisites
- **Node.js** ≥ 18.x
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Supabase** project (with Auth, Database, Storage enabled)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/UNAI-TECH/Oh-my-hindustan.git
cd Oh-my-hindustan
```

### 2. Install Dependencies

```bash
# Mobile App
cd app && npm install

# Backend API
cd ../backend && npm install

# Creator Studio (separate repo)
cd /path/to/Hindusthan_creators && npm install

# Admin Dashboard (separate repo)
cd /path/to/admin && npm install
```

### 3. Set Up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the Prisma migrations to create tables:
   ```bash
   cd backend
   npx prisma migrate dev
   ```
3. Run `supabase_rls_policies.sql` in the Supabase SQL Editor to set up Row Level Security
4. Create a `media` storage bucket for file uploads (set to public)
5. Disable "Confirm email" in Supabase Auth settings

---

## Environment Variables

### Backend (`/backend/.env`)
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
JWT_SECRET="your-jwt-secret"
PORT=5000
```

### Creator Studio (`.env`)
```env
VITE_SUPABASE_URL="https://[PROJECT_ID].supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### Admin Dashboard (`.env`)
```env
VITE_SUPABASE_URL="https://[PROJECT_ID].supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### Mobile App (`supabaseClient.ts`)
```typescript
const SUPABASE_URL = 'https://[PROJECT_ID].supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
```

---

## Running the Projects

### Mobile App
```bash
cd app
npx expo start -c          # Start with cache clear
# Press 'a' for Android, 'i' for iOS, 'w' for Web
```

### Backend API
```bash
cd backend
npx prisma generate        # Generate Prisma Client
npm run dev                # Start dev server (port 5000)
```

### Creator Studio
```bash
cd Hindusthan_creators
npm run dev                # Start dev server (port 3000)
```

### Admin Dashboard
```bash
cd admin
npm run dev                # Start dev server (port 5173)
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/register` | Register new citizen |
| GET | `/api/auth/profile` | Get current user profile |

### Posts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/posts` | Get all published posts |
| GET | `/api/posts/:id` | Get post by ID |
| POST | `/api/posts` | Create new post (creator only) |
| PUT | `/api/posts/:id` | Update post (author only) |
| DELETE | `/api/posts/:id` | Delete post (author only) |

### Interactions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/votes` | Vote on a post (1 or -1) |
| POST | `/api/comments` | Add comment to a post |
| POST | `/api/follows` | Follow a creator |
| POST | `/api/saves` | Save a post |

> **Note:** The mobile app and dashboards primarily use **Supabase PostgREST** (direct DB access via `@supabase/supabase-js`) rather than the Express API. The backend API is available for server-side logic and external integrations.

---

## Deployment

### Mobile App
```bash
cd app
npx expo build:android     # Build Android APK/AAB
npx expo build:ios         # Build iOS IPA
# Or use EAS Build:
npx eas build --platform android
```

### Web Dashboards (Vercel)
```bash
# Creator Studio
cd Hindusthan_creators
npm run build              # Output: dist/
# Deploy dist/ to Vercel

# Admin Dashboard
cd admin
npm run build              # Output: dist/
# Deploy dist/ to Vercel
```

Add `vercel.json` for SPA routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Backend API
```bash
cd backend
npm run build              # Compile TypeScript
npm start                  # Start production server
# Deploy to Railway, Render, or any Node.js host
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Supabase over custom backend** | Real-time WebSocket support, built-in Auth, PostgREST, and Storage reduce development time |
| **PascalCase tables** | Prisma convention ensures consistency between ORM and database |
| **Role-based app separation** | Citizens use the mobile app; creators and admins use dedicated web dashboards |
| **UUID text IDs** | Prisma generates UUIDs as text, compatible with all clients |
| **RLS policies** | Row Level Security ensures data isolation at the database level |
| **Direct Supabase client** | Eliminates API roundtrip for CRUD operations, enabling real-time subscriptions |

---

## License

This project is proprietary software developed by **UNAI TECH**.

---

<p align="center">
  Built with ❤️ for India's digital journalism ecosystem
</p>
