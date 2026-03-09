# 🏆 Rewards Bytes

A multi-tenant game-based rewards platform. Organizations can engage their customers through games like Spin Wheel, Scratch Card, and Quiz — rewarding them with points redeemable for coupons.

## Tech Stack
- **Frontend:** React + Vite + ShadCN UI + Tailwind CSS
- **Backend:** Node.js + Express + MongoDB
- **Auth:** JWT + bcrypt + Email Verification
- **Monorepo:** pnpm workspaces

## Getting Started

### Prerequisites
- Node.js >= 18
- pnpm >= 8
- MongoDB (local or Atlas)

### Installation
```bash
git clone https://github.com/skuppuraj/rewards-bytes.git
cd rewards-bytes
pnpm install
```

### Environment Setup
```bash
cp apps/backend/.env.example apps/backend/.env
# Fill in MONGO_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASS, CLIENT_URL
```

### Run Development
```bash
pnpm dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:5000
```

## Features
- ✅ Multi-tenant organization signup with email verification
- ✅ JWT authentication with role-based access
- ✅ Player management with points & level system
- ✅ Game engine (Spin Wheel, Scratch Card, Quiz, Points Tap)
- ✅ Coupon creation and point-based redemption
- ✅ Mobile responsive dashboard with ShadCN UI
- ✅ Canvas-based Spin Wheel game UI
