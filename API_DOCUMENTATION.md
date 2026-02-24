# AI Ready Studio - Backend API Documentation

## Overview

Backend API for the AI Ready Studio app. Handles payments (Stripe), push notifications (Firebase), and AI analysis (OpenAI Whisper).

## Base URL

- Development: `http://localhost:3000`
- Production: `https://api.aireadystudio.com`

---

## Authentication

All requests should include the user ID and optional authentication token:

```headers
Authorization: Bearer {supabase_jwt_token}
Content-Type: application/json
```

---

## API Endpoints

### Stripe Payment APIs

#### 1. Create Checkout Session
**POST** `/api/stripe/create-checkout-session`

Creates a Stripe checkout session for credit purchases.

**Request Body:**
```json
{
  "userId": "uuid",
  "credits": 100,
  "price": 1.99,
  "customerEmail": "user@example.com"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_...",
  "success": true
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing required fields
- `500`: Server error

---

#### 2. Get Session Details
**GET** `/api/stripe/session/:sessionId`

Retrieve details of a Stripe checkout session.

**Response:**
```json
{
  "session": {...},
  "status": "paid",
  "success": true
}
```

---

#### 3. Stripe Webhook
**POST** `/api/webhooks/stripe`

Webhook for Stripe events. Handles:
- `checkout.session.completed` - Awards credits on payment
- `charge.refunded` - Processes refunds

**Headers:**
```
stripe-signature: t=timestamp,v1=signature
```

**Request Body:** Raw Stripe event JSON

---

### Push Notifications APIs

#### 1. Register Device
**POST** `/api/notifications/register-device`

Register a device for push notifications.

**Request Body:**
```json
{
  "userId": "uuid",
  "token": "device_token_from_fcm",
  "platform": "ios|android|web"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device registered for notifications"
}
```

---

#### 2. Send Notification
**POST** `/api/notifications/send`

Send a push notification to a user.

**Request Body:**
```json
{
  "userId": "uuid",
  "templateType": "videoVoted|newSeminar|declarationApproved|creditsEarned|newFollower",
  "data": {
    "args": ["voter_name", 100]
  }
}
```

**Available Templates:**

1. **videoVoted**: `args: [voterName, totalVotes]`
2. **newSeminar**: `args: [seminarName, date]`
3. **declarationApproved**: `args: []`
4. **creditsEarned**: `args: [creditsAmount]`
5. **newFollower**: `args: [followerName]`

**Response:**
```json
{
  "success": true,
  "sentCount": 2,
  "message": "Notification sent to 2 device(s)"
}
```

---

## Database Tables

### credit_transactions
Tracks all credit purchases and earning activities.

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount INT,
  type VARCHAR(50),
  description TEXT,
  stripe_session_id VARCHAR(255),
  timestamp TIMESTAMP
);
```

### device_tokens
Stores device tokens for push notifications.

```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  token TEXT UNIQUE,
  platform VARCHAR(20),
  created_at TIMESTAMP,
  last_used TIMESTAMP
);
```

### seminar_bookings
Records seminar registrations and credit usage.

```sql
CREATE TABLE seminar_bookings (
  id UUID PRIMARY KEY,
  seminar_id UUID,
  user_id UUID REFERENCES auth.users(id),
  booking_type VARCHAR(20),
  credits_used INT,
  discount_amount DECIMAL,
  final_price DECIMAL,
  status VARCHAR(20),
  booking_date TIMESTAMP
);
```

### readiness_scores
Stores AI readiness analysis results.

```sql
CREATE TABLE readiness_scores (
  id UUID PRIMARY KEY,
  user_id UUID,
  video_id UUID,
  overall_score INT,
  clarity INT,
  confidence INT,
  articulation INT,
  pacing INT,
  keyword_relevance INT,
  transcription TEXT,
  keywords TEXT[],
  insights TEXT[],
  recommendations TEXT[],
  created_at TIMESTAMP
);
```

### referral_codes
Manages referral system.

```sql
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY,
  user_id UUID,
  code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP
);

CREATE TABLE referral_history (
  id UUID PRIMARY KEY,
  referrer_id UUID,
  referee_id UUID,
  redeemed_at TIMESTAMP,
  UNIQUE(referrer_id, referee_id)
);
```

---

## Environment Variables

Required environment variables (see `.env.example`):

```
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...gserviceaccount.com

# OpenAI
OPENAI_API_KEY=sk-...

# DeepAR (optional)
DEEPAR_SDK_KEY=your-deepar-key
```

---

## Error Handling

All errors return JSON with the following structure:

```json
{
  "error": "Error message",
  "timestamp": "2026-02-24T01:00:00Z"
}
```

---

## Rate Limiting

Currently no rate limiting. Production deployment should implement:
- 100 requests/minute per IP
- 1000 requests/minute per authenticated user

---

## CORS

Configured to accept requests from `FRONTEND_URL` environment variable.

---

## Security

- All Stripe webhooks verify signature
- Firebase credentials use service account authentication
- Supabase uses JWT tokens for database access
- CORS enabled for frontend only

---

## Deployment

### Using Docker Compose

```bash
docker-compose up
```

### Production Deployment

1. Set up environment variables on hosting platform
2. Build Docker image: `docker build -f server/Dockerfile .`
3. Deploy using your preferred platform (AWS ECS, Google Cloud Run, Heroku, etc.)

---

## Monitoring & Logs

Monitor these key metrics:

- Stripe webhook failures
- Payment conversion rate
- Push notification delivery rate
- API response times
- Database query performance

---

## Support

For API issues, check:
1. Environment variables are set correctly
2. Firewall allows external requests
3. Backend server is running (`/health` endpoint)
4. Database migrations have been run (`npm run migrate`)

---

*Last Updated: 2026-02-24*
