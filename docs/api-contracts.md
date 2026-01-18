# FlowBond × DANZ - API Contracts

Base URL: `http://localhost:3001` (development) | `https://api.flowbond.io` (production)

## Authentication

All protected endpoints require Bearer token:
```
Authorization: Bearer <access_token>
```

---

## Auth Module

### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "language": "en"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "language": "en",
    "isGuest": false
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### POST /auth/login
Authenticate existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": { ... },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### POST /auth/guest
Create anonymous guest user.

**Request:**
```json
{
  "language": "es"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": null,
    "language": "es",
    "isGuest": true
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

---

## Users Module

### GET /users/me
Get current user profile. **🔒 Protected**

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "phone": "+1234567890",
  "language": "en",
  "isGuest": false,
  "isStaff": false,
  "isAdmin": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### PUT /users/me
Update user profile. **🔒 Protected**

**Request:**
```json
{
  "phone": "+1987654321"
}
```

### PUT /users/me/language
Update language preference. **🔒 Protected**

**Request:**
```json
{
  "language": "fr"
}
```

---

## Venues Module

### GET /venues
List all venues.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "DANZ Austin",
    "slug": "danz-austin",
    "address": "123 Music Lane, Austin, TX",
    "timezone": "America/Chicago",
    "logo": "https://...",
    "primaryColor": "#6366F1"
  }
]
```

### GET /venues/:id
Get venue details.

### GET /venues/slug/:slug
Get venue by slug.

### GET /venues/:id/quests
Get active quests at venue.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Topo Chico Explorer",
    "description": "...",
    "sponsor": {
      "id": "uuid",
      "name": "Topo Chico",
      "logo": "https://..."
    },
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-02-01T00:00:00.000Z",
    "taskCount": 3,
    "reward": {
      "name": "Free Topo Chico",
      "description": "..."
    }
  }
]
```

---

## QR Module

### GET /qr/resolve/:code
Resolve QR code to context.

**Response (200):**
```json
{
  "qrPoint": {
    "id": "uuid",
    "code": "ABC123XYZ",
    "label": "Main Floor - Topo Station"
  },
  "zone": {
    "id": "uuid",
    "name": "Main Floor"
  },
  "venue": {
    "id": "uuid",
    "name": "DANZ Austin",
    "slug": "danz-austin"
  },
  "sponsor": {
    "id": "uuid",
    "name": "Topo Chico",
    "logo": "https://..."
  },
  "availableQuests": [
    {
      "id": "uuid",
      "name": "Topo Chico Explorer",
      "taskCount": 3
    }
  ]
}
```

**Error (404):**
```json
{
  "statusCode": 404,
  "message": "QR code not found",
  "error": "Not Found"
}
```

---

## Sponsors Module

### GET /sponsors
List all sponsors.

### GET /sponsors/:id
Get sponsor details.

### GET /sponsors/:id/quests
Get sponsor's quests.

---

## Tasks Module

### GET /tasks/:id
Get task details.

**Response (200):**
```json
{
  "id": "uuid",
  "type": "QR_SCAN",
  "name": "Scan Main Floor Station",
  "description": "Find and scan the QR code...",
  "order": 1,
  "isRequired": true,
  "quest": {
    "id": "uuid",
    "name": "Topo Chico Explorer"
  }
}
```

### GET /tasks/quest/:questId
Get all tasks for a quest.

### GET /tasks/quest/:questId/progress
Get user's progress on quest tasks. **🔒 Protected**

**Response (200):**
```json
{
  "questId": "uuid",
  "status": "IN_PROGRESS",
  "tasks": [
    {
      "id": "uuid",
      "name": "Scan Main Floor Station",
      "type": "QR_SCAN",
      "isRequired": true,
      "isCompleted": true,
      "completedAt": "2024-01-15T12:00:00.000Z"
    },
    {
      "id": "uuid",
      "name": "Share on Social",
      "type": "SOCIAL_SHARE",
      "isRequired": true,
      "isCompleted": false,
      "completedAt": null
    }
  ],
  "completedCount": 1,
  "totalRequired": 2
}
```

### POST /tasks/:id/complete
Complete a task. **🔒 Protected**

**Request (QR_SCAN):**
```json
{
  "qrCode": "ABC123XYZ"
}
```

**Request (SURVEY):**
```json
{
  "favoriteFlavorField": "Lime",
  "ratingField": 5
}
```

**Request (CHECKIN):**
```json
{
  "latitude": 30.2672,
  "longitude": -97.7431
}
```

**Request (SOCIAL_SHARE):**
```json
{
  "platform": "instagram",
  "postUrl": "https://instagram.com/p/..."
}
```

**Response (200):**
```json
{
  "success": true,
  "taskCompletion": {
    "id": "uuid",
    "completedAt": "2024-01-15T12:00:00.000Z"
  },
  "questCompleted": false,
  "message": "Task completed! 1 of 3 tasks done."
}
```

**Response (Quest Completed):**
```json
{
  "success": true,
  "taskCompletion": { ... },
  "questCompleted": true,
  "message": "Congratulations! Quest completed!",
  "reward": {
    "id": "uuid",
    "name": "Free Topo Chico",
    "canClaim": true
  }
}
```

---

## Rewards Module

### POST /rewards/claim
Claim drink reward for completed quest. **🔒 Protected**

**Request:**
```json
{
  "questId": "uuid",
  "venueId": "uuid"
}
```

**Response (201):**
```json
{
  "drinkPass": {
    "id": "uuid",
    "code": "ABCD1234",
    "status": "ACTIVE",
    "expiresAt": "2024-01-16T12:00:00.000Z",
    "reward": {
      "name": "Free Topo Chico",
      "description": "..."
    }
  },
  "message": "Your drink pass is ready! Show code ABCD1234 to staff."
}
```

### GET /rewards/passes
Get user's drink passes. **🔒 Protected**

**Response (200):**
```json
[
  {
    "id": "uuid",
    "code": "ABCD1234",
    "status": "ACTIVE",
    "expiresAt": "2024-01-16T12:00:00.000Z",
    "reward": {
      "name": "Free Topo Chico"
    },
    "venue": {
      "name": "DANZ Austin"
    }
  }
]
```

### GET /rewards/passes/:id
Get specific drink pass. **🔒 Protected**

### GET /rewards/verify/:code
Verify drink pass code (staff view). **🔒 Staff Only**

**Response (200):**
```json
{
  "isValid": true,
  "drinkPass": {
    "id": "uuid",
    "code": "ABCD1234",
    "status": "ACTIVE",
    "expiresAt": "2024-01-16T12:00:00.000Z"
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "reward": {
    "name": "Free Topo Chico",
    "description": "...",
    "sponsor": "Topo Chico"
  }
}
```

**Response (Invalid):**
```json
{
  "isValid": false,
  "reason": "EXPIRED",
  "drinkPass": { ... }
}
```

### POST /rewards/redeem/:id
Redeem drink pass. **🔒 Staff Only**

**Response (200):**
```json
{
  "success": true,
  "drinkPass": {
    "id": "uuid",
    "code": "ABCD1234",
    "status": "REDEEMED",
    "redeemedAt": "2024-01-15T14:00:00.000Z"
  },
  "message": "Drink pass redeemed successfully!"
}
```

### POST /rewards/cancel/:id
Cancel own drink pass. **🔒 Protected**

**Response (200):**
```json
{
  "success": true,
  "message": "Drink pass cancelled."
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (e.g., task already completed) |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## Rate Limits

- **Default**: 100 requests per minute per IP
- **Auth endpoints**: 10 requests per minute per IP
- **Task completion**: 30 requests per minute per user

---

## Webhooks (Future)

Event webhooks for integrations:

- `quest.completed` - User completed a quest
- `drinkpass.redeemed` - Staff redeemed a drink pass
- `drinkpass.expired` - Drink pass expired unused
