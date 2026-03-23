# Oh My Hindustan Backend

Production-ready Node.js/Express backend for the Oh My Hindustan political forum.

## Tech Stack
- **Node.js + Express** (Fast, scalable API)
- **TypeScript** (Strong typing)
- **Prisma + PostgreSQL** (Relational database with type-safe ORM)
- **JWT** (Authentication)
- **Docker** (Containerization)

## Folder Structure
```
backend/
├── prisma/               # Prisma schema & migrations
├── src/
│   ├── config/           # General configurations
│   ├── controllers/      # Route handlers (Auth, Post, Interaction, Notification)
│   ├── middleware/       # JWT and Role-based access control
│   ├── routes/           # API endpoints routing
│   ├── types/            # TypeScript type definitions
│   └── index.ts          # Express root application
├── Dockerfile            # Container build instructions
└── package.json          # Dependencies and scripts
```

## Running the System

### 1. Prerequisites
- Docker & Docker Compose installed

### 2. Start Everything
From the project root:
```bash
docker-compose up --build
```
This will:
1. Start the PostgreSQL database.
2. Build the backend container.
3. Run database migrations.
4. Start the server on `http://localhost:3001`.

### 3. API Documentation (Endpoints)
...
#### Auth
- `POST /api/auth/register` - Create a new account
- `POST /api/auth/login` - Login and get JWT
- `GET /api/auth/me` - Get current user profile

#### Content
- `GET /api/posts` - Get home feed (paginated)
- `GET /api/posts/:id` - Get article detail
- `POST /api/posts` - Create post (Analyst required)

#### Interactions
- `POST /api/interactions/vote` - Upvote/Downvote ({ postId, type: 1/-1/0 })
- `POST /api/interactions/comment` - Add comment ({ postId, content })
- `POST /api/interactions/follow` - Follow analyst ({ followingId })
- `POST /api/interactions/save` - Save article ({ postId })

#### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read

## Development (Local)
If you want to run without Docker:
1. Copy `.env` from the project root into `backend/.env`.
2. Update `DATABASE_URL` to point to a local Postgres instance.
3. In `backend/`:
   ```bash
   npm install
   npx prisma generate
   npm run dev
   ```
