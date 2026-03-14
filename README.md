# Inventrix

A modern, full-stack inventory management platform built with:

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, React Hook Form + Zod, Recharts, Sonner
- **Backend**: Node.js, Express.js, Prisma ORM, SQLite (local), JWT Auth, bcryptjs, Zod

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env    # then fill in DATABASE_URL and JWT_SECRET
npx prisma db push
npx tsx src/index.ts
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL="file:./dev.db"
PORT=5000
JWT_SECRET="your_secret_here"
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Key Features

- 🔐 JWT Authentication (Register / Login)
- 📦 Product Catalogue (CRUD)
- 🏭 Multi-Warehouse Management
- 📥 Goods Receipts (confirm to update stock)
- 🚚 Delivery Orders
- 🔄 Stock Transfers between warehouses
- 📊 Stock Adjustment with history
- 📜 Full Stock Ledger (audit trail)
- 📈 KPI Dashboard with charts