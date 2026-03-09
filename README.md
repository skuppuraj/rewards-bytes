# 🎮 Rewards Bytes

A **multi-tenant game-based rewards SaaS platform** where businesses reward customers through interactive games and coupons.

## Architecture

```
rewards-bytes/
├── frontend/          # React + Tailwind + ShadCN UI
├── backend/           # Node.js + Express + MongoDB
└── package.json       # Monorepo root
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Tailwind CSS, ShadCN UI, React Router |
| Backend | Node.js, Express.js, JWT Auth |
| Database | MongoDB with Mongoose ODM |
| Notifications | Twilio WhatsApp API |
| Auth | JWT + Email OTP + WhatsApp OTP |

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development
npm run dev
```

## Features

- ✅ Multi-tenant architecture with data isolation
- ✅ Game-based customer engagement
- ✅ Coupon & offer management
- ✅ WhatsApp OTP verification
- ✅ Real-time game engine
- ✅ Staff role-based access
- ✅ Mobile responsive UI
- ✅ Fraud protection (IP + phone throttling)
