# ONE Group - Customer Portal

Post-booking CRM portal for real estate customers. Track payments, construction progress, documents, raise tickets, referrals, and more.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Generate Prisma client + create database
npx prisma generate
npx prisma migrate dev

# Seed demo data
npx tsx prisma/seed.ts

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role | Phone | OTP |
|------|-------|-----|
| Customer | 9876543210 | 123456 |
| Admin | 9999999999 | 123456 |

Admin Registration Code: `ONEGROUP2025`

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Database:** SQLite (dev) / PostgreSQL (prod) + Prisma ORM
- **Auth:** Phone OTP + JWT
- **Storage:** Local filesystem (dev) / S3 (prod)

## Features

### Customer Portal
- Payment schedule with progress tracking
- Construction progress with photo timeline
- Document vault with upload/download
- Support ticket system with chat
- Possession step tracker
- Referral program with rewards
- Loan assistance with EMI calculator
- Community announcements, FAQs, events
- Push notifications

### Admin Panel
- Customer management
- Booking import from PDF (human-in-the-loop)
- Payment recording
- Construction update upload
- Document management
- Analytics dashboard

## Project Structure

```
src/
  app/
    (auth)/         # Login page
    (portal)/       # Customer portal pages
    admin/          # Admin panel pages
    api/            # API routes
  components/
    shared/         # Sidebar, auth provider
    ui/             # shadcn/ui components
  lib/              # Utilities, Prisma, auth, S3
  hooks/            # React hooks
prisma/
  schema.prisma     # Database schema
  seed.ts           # Demo data
```
