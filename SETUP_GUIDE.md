# AI Ready Studio - Full Stack Setup Guide

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+
- Docker & Docker Compose (optional)
- Git

### 1. Get API Credentials

Before starting, gather:

#### Supabase
1. Go to https://supabase.com
2. Create a project or use existing
3. Get `SUPABASE_URL` and `SUPABASE_KEY` from Project Settings → API

#### Stripe
1. Go to https://dashboard.stripe.com
2. Get `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY` from API Keys
3. Get `STRIPE_WEBHOOK_SECRET` from Webhooks (create endpoint for `/api/webhooks/stripe`)

#### Firebase
1. Go to https://console.firebase.google.com
2. Create project or use existing
3. Generate service account key: Settings → Service Accounts → Generate New Private Key
4. Get `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`

#### OpenAI
1. Go to https://platform.openai.com/account/api-keys
2. Create API key, copy as `OPENAI_API_KEY`

#### DeepAR (optional)
1. Go to https://www.deepar.ai
2. Get `DEEPAR_SDK_KEY` from dashboard

---

## Local Development Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/ai-ready-studio.git
cd ai-ready-studio
```

### Step 2: Setup Frontend

```bash
# Install frontend dependencies
npm install

# Create frontend .env
cat > .env.local << EOF
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
EOF

# Start frontend
npm run dev
# Frontend runs at http://localhost:5173
```

### Step 3: Setup Backend

```bash
cd server

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLIC_KEY=your_stripe_public
STRIPE_WEBHOOK_SECRET=your_webhook_secret

FIREBASE_PROJECT_ID=your_firebase_id
FIREBASE_PRIVATE_KEY=your_firebase_key
FIREBASE_CLIENT_EMAIL=your_firebase_email

OPENAI_API_KEY=your_openai_key
DEEPAR_SDK_KEY=your_deepar_key
EOF

# Run database migrations
npm run migrate

# Start backend
npm run dev
# Backend runs at http://localhost:3000
```

### Step 4: Test the Stack

```bash
# In a new terminal, test API
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2026-02-24T...",
#   "uptime": 1.23
# }
```

---

## Docker Compose Setup (Recommended)

### One-Command Start

```bash
# 1. Create .env file in root with all credentials
cp server/.env.example .env
# Edit .env with your credentials

# 2. Start full stack
docker-compose up

# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# API Health: http://localhost:3000/health
```

---

## Database Migrations

### Run Migrations

```bash
# From server directory
npm run migrate

# Or from root with Docker:
docker-compose exec backend npm run migrate
```

### Manual Migration (if needed)

Log into Supabase dashboard and run these SQL queries:

```sql
-- Create all required tables
-- See migration code in src/db/migrations.ts
```

---

## Stripe Webhook Setup

### Local Testing with Stripe CLI

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhook to local backend
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will output a webhook secret
# Copy it to your .env as STRIPE_WEBHOOK_SECRET

# In another terminal, test webhook:
stripe trigger payment_intent.succeeded
```

### Production Webhook Setup

1. Go to https://dashboard.stripe.com/webhooks
2. Create endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `charge.refunded`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Firebase Setup

### Local Testing

```bash
# Set environment variable with service account
export FIREBASE_PRIVATE_KEY='your-firebase-private-key'
```

### Production Deployment

1. Go to Firebase Console
2. Settings → Service Accounts
3. Generate new private key
4. Store in environment variables (not in code)

---

## Testing Payment Flow

### 1. Test Card Numbers

```
Visa:           4242 4242 4242 4242
Visa (debit):   4000 0566 5566 5556
Mastercard:     5555 5555 5555 4444
Amex:           3782 822463 10005
```

### 2. Test Flow

```bash
# 1. Open frontend at http://localhost:5173
# 2. Go to Credits modal
# 3. Click "Buy Credits"
# 4. Use test card above
# 5. Expiry: any future date
# 6. CVC: any 3 digits
# 7. Check that credits were awarded
```

---

## Environment Variables Reference

| Variable | Purpose | Required |
|----------|---------|----------|
| `SUPABASE_URL` | Database endpoint | ✅ |
| `SUPABASE_KEY` | Database API key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe API key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing | ✅ |
| `FIREBASE_PROJECT_ID` | Firebase project | ⚠️ (for push) |
| `FIREBASE_PRIVATE_KEY` | Firebase credentials | ⚠️ (for push) |
| `FIREBASE_CLIENT_EMAIL` | Firebase email | ⚠️ (for push) |
| `OPENAI_API_KEY` | Whisper & GPT API | ⚠️ (for analysis) |
| `DEEPAR_SDK_KEY` | 3D filters | ⚠️ (optional) |
| `FRONTEND_URL` | Frontend address | ✅ (default: http://localhost:5173) |
| `NODE_ENV` | Environment mode | ✅ (default: development) |

---

## Deployment

### Heroku

```bash
# 1. Create Heroku account at heroku.com

# 2. Install Heroku CLI
npm install -g heroku

# 3. Login
heroku login

# 4. Create app
heroku create your-app-name

# 5. Set environment variables
heroku config:set SUPABASE_URL=...
heroku config:set STRIPE_SECRET_KEY=...
# ... set all required vars

# 6. Deploy
git push heroku main
```

### AWS (Elastic Beanstalk)

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
eb init -p node.js-20

# 3. Set environment variables in .ebextensions/env-variables.config
# See AWS documentation

# 4. Deploy
eb create
eb deploy
```

### Google Cloud Run

```bash
# 1. Build image
docker build -f server/Dockerfile -t ai-ready-backend .

# 2. Tag for GCR
docker tag ai-ready-backend gcr.io/YOUR_PROJECT/ai-ready-backend

# 3. Push to GCR
docker push gcr.io/YOUR_PROJECT/ai-ready-backend

# 4. Deploy
gcloud run deploy ai-ready-backend \
  --image gcr.io/YOUR_PROJECT/ai-ready-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Troubleshooting

### Frontend can't reach backend

```bash
# Check backend is running
curl http://localhost:3000/health

# Check VITE_API_URL is set correctly
echo $VITE_API_URL

# Update .env.local if needed
VITE_API_URL=http://localhost:3000
```

### Stripe webhook not working

```bash
# Verify webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Test with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check logs for errors
# Backend should log webhook events
```

### Database migrations failing

```bash
# Verify Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_KEY

# Check Supabase is accessible
curl $SUPABASE_URL

# Run migrations manually if needed
npm run migrate -- --force
```

### Firebase push notifications not working

```bash
# Verify Firebase credentials are set
env | grep FIREBASE_

# Check backend logs for Firebase errors
docker-compose logs backend

# Test Firebase connection
# See Firebase console for errors
```

---

## Next Steps

1. ✅ Run local development stack
2. ✅ Test payment flow
3. ✅ Test push notifications
4. ✅ Configure Stripe webhooks
5. ⬜ Set up monitoring (Sentry, DataDog)
6. ⬜ Configure SSL/TLS certificates
7. ⬜ Deploy to production
8. ⬜ Set up CI/CD pipeline

---

## Support & Documentation

- **API Docs**: See `API_DOCUMENTATION.md`
- **Frontend Docs**: See `IMPLEMENTATION_SUMMARY.md`
- **Issue Tracker**: GitHub Issues
- **Email Support**: support@legroupeds.com

---

*Last Updated: 2026-02-24*
