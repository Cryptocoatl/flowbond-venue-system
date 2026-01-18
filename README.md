# FlowBond × DANZ Venue System

A production-ready QR-based venue ordering system with sponsor-powered drink quests, multilingual UX, and secure reward redemption.

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT FLOW                          │
│  Scan QR → Language Select → Quest Activation → Redeem     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      NEXT.JS FRONTEND                       │
│  Mobile-first PWA • i18n • Real-time updates               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       NESTJS API                            │
│  REST • JWT Auth • Prisma ORM • Rate Limiting              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      POSTGRESQL                             │
│  Venues • Users • Quests • DrinkPasses                     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/flowbond-venue-system.git
cd flowbond-venue-system

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL with Docker
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres

# Run database migrations
cd apps/api && pnpm prisma migrate dev && cd ../..

# Seed the database
pnpm seed

# Start development servers
pnpm dev
```

### Access Points

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api

## 📦 Project Structure

```
flowbond-venue-system/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── prisma/          # Database schema & migrations
│   │   └── src/
│   │       ├── config/      # Environment & security config
│   │       ├── modules/     # Feature modules
│   │       ├── common/      # Shared utilities
│   │       └── locales/     # i18n translations
│   │
│   └── web/                 # Next.js frontend
│       ├── app/             # App Router pages
│       ├── lib/             # Utilities & API client
│       └── public/          # Static assets
│
├── infrastructure/
│   ├── docker/              # Docker configurations
│   └── scripts/             # Utility scripts
│
└── docs/                    # Documentation
```

## 🔑 Core Features

### QR Code System
- Each venue has zones with QR points
- Scanning resolves venue, zone, and available quests
- Supports deep linking for direct quest access

### Sponsor Quests
- Sponsors create quests with configurable tasks
- Tasks support pluggable validation strategies
- Completion unlocks drink rewards

### DrinkPass System
- Secure single-use redemption tokens
- Time-limited validity
- Staff verification interface

### Multilingual Support
- Language selection on first load
- Persisted per user
- Notifications in user's language
- Currently: English, Spanish, French

## 🔧 Available Scripts

```bash
# Development
pnpm dev          # Start all services
pnpm dev:api      # Start API only
pnpm dev:web      # Start web only

# Database
pnpm prisma:migrate  # Run migrations
pnpm prisma:studio   # Open Prisma Studio
pnpm seed            # Seed database

# Build
pnpm build        # Build all apps
pnpm build:api    # Build API
pnpm build:web    # Build web

# Testing
pnpm test         # Run tests
pnpm test:e2e     # Run E2E tests

# Utilities
pnpm generate:qr  # Generate QR codes
pnpm lint         # Lint all code
```

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose -f infrastructure/docker/docker-compose.yml up --build

# Production build
docker-compose -f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.prod.yml up --build -d
```

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token

### QR & Venues
- `GET /qr/resolve/:code` - Resolve QR code context
- `GET /venues` - List venues
- `GET /venues/:id` - Get venue details

### Quests & Tasks
- `GET /sponsors/:id/quests` - Get sponsor quests
- `POST /quests/:id/activate` - Activate quest
- `POST /tasks/:id/complete` - Complete task
- `GET /quests/:id/progress` - Get quest progress

### Rewards
- `POST /rewards/claim` - Claim drink reward
- `GET /rewards/passes` - Get user's drink passes
- `POST /rewards/redeem/:passId` - Redeem drink pass

See [API Contracts](docs/api-contracts.md) for complete documentation.

## 🔐 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/flowbond

# API
API_PORT=3001
API_PREFIX=api
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Web
NEXT_PUBLIC_API_URL=http://localhost:3001

# Security
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

## 📱 User Flow

1. **Scan**: User scans QR code at venue
2. **Language**: First-time users select preferred language
3. **Quest**: Browse available sponsor quests
4. **Tasks**: Complete quest tasks (surveys, check-ins, etc.)
5. **Reward**: Receive DrinkPass upon quest completion
6. **Redeem**: Present DrinkPass to staff for free drink

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ by the FlowBond team
