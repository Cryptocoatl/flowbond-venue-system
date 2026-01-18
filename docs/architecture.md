# FlowBond × DANZ Venue System - Architecture

## Overview

FlowBond × DANZ is a QR-based venue ordering system that enables sponsor-powered drink quests with multilingual support. The system allows venues to create engaging experiences where patrons complete tasks to earn drink rewards.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Mobile Web    │  │   Staff Portal  │  │   Admin Panel   │     │
│  │   (Next.js)     │  │   (Next.js)     │  │   (Next.js)     │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
└───────────┼────────────────────┼────────────────────┼───────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Gateway                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    NestJS API Server                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │   Auth   │ │  Users   │ │  Venues  │ │ Sponsors │       │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │    QR    │ │  Tasks   │ │ Rewards  │ │Analytics │       │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   PostgreSQL    │  │     Redis       │  │  File Storage   │     │
│  │   (Primary DB)  │  │  (Cache/Queue)  │  │   (S3/Local)    │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Components

### Frontend (Next.js)

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State Management**: React Context + TanStack Query
- **i18n**: Custom implementation with JSON locale files

### Backend (NestJS)

- **Framework**: NestJS 10
- **ORM**: Prisma
- **Authentication**: JWT with refresh tokens
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI

### Database (PostgreSQL)

- **Version**: PostgreSQL 16
- **ORM**: Prisma with migrations
- **Indexing**: Optimized for QR lookups and quest queries

## Data Model

### Entity Relationships

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │────<│QuestProg.│>────│  Quest   │
└──────────┘     └──────────┘     └──────────┘
     │                                  │
     │                                  │
     ▼                                  ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│DrinkPass │────>│DrinkRewd │<────│ Sponsor  │
└──────────┘     └──────────┘     └──────────┘
                                       │
                                       │
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Venue   │────<│   Zone   │────<│ QRPoint  │
└──────────┘     └──────────┘     └──────────┘
```

### Key Entities

| Entity | Description |
|--------|-------------|
| User | Patrons, staff, and admins |
| Venue | Physical locations with zones |
| Zone | Areas within a venue (e.g., Main Floor, VIP) |
| QRPoint | Scannable QR codes linked to zones/sponsors |
| Sponsor | Brands running quests |
| SponsorQuest | Time-limited challenges with tasks |
| Task | Individual actions to complete |
| DrinkReward | Prizes for completing quests |
| DrinkPass | Single-use redemption codes |

## Core Flows

### 1. QR Scan → Quest Activation

```
User Scans QR → Resolve QR Point → Get Zone/Venue/Sponsor Context
    → Display Available Quests → User Selects Quest
    → Create QuestProgress (IN_PROGRESS)
```

### 2. Task Completion

```
User Completes Task → Validate Task Data → Record TaskCompletion
    → Check All Required Tasks Complete
    → If Complete: Update QuestProgress (COMPLETED)
    → Generate DrinkReward Notification
```

### 3. DrinkPass Redemption

```
User Claims Reward → Generate Unique Code → Create DrinkPass (ACTIVE)
    → User Shows Code to Staff → Staff Scans/Enters Code
    → Verify Status & Expiry → Mark DrinkPass (REDEEMED)
```

## Task Validation System

The system supports pluggable task validation:

| Task Type | Validation |
|-----------|------------|
| QR_SCAN | Verify scanned code matches expected |
| SURVEY | Check all required fields present |
| CHECKIN | Validate GPS within radius of target |
| SOCIAL_SHARE | Verify platform in allowed list |
| CUSTOM | Accept any data (manual verification) |

## Internationalization

Three languages supported (EN, ES, FR) with:

- Server-side translation service
- Language preference stored per user
- Fallback chain: User Language → English → Key

## Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting via ThrottlerGuard
- CORS configuration
- Helmet security headers
- Input validation on all endpoints

## Deployment

### Docker Compose (Development)

```bash
cd infrastructure/docker
docker-compose up -d
```

### Production Considerations

1. Use managed PostgreSQL (AWS RDS, Supabase, etc.)
2. Configure Redis for session/cache
3. Set up SSL/TLS termination
4. Configure proper CORS origins
5. Use secrets management for JWT keys
6. Set up monitoring and logging

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | Secret for access tokens | - |
| JWT_REFRESH_SECRET | Secret for refresh tokens | - |
| CORS_ORIGIN | Allowed origins | http://localhost:3000 |
| PORT | API server port | 3001 |

## Performance Considerations

1. **QR Resolution**: Indexed by unique code for O(1) lookup
2. **Quest Queries**: Eager loading to minimize N+1 queries
3. **DrinkPass Codes**: Secure random generation with collision avoidance
4. **Rate Limiting**: 100 requests/minute per IP

## Future Enhancements

- Real-time notifications via WebSocket
- Push notifications (FCM/APNs)
- Analytics dashboard
- Sponsor portal for campaign management
- Integration with POS systems
- Blockchain-based reward verification (FlowBond Token)
