# Modern Kikubo

A multi-vendor second-hand clothes marketplace for Uganda, built as part of the G-31 IT Project Management module at European Campus Rottal-Inn.

Vendors rent a virtual shop for **UGX 15,000/month**, list their clothes, and buyers order with **Safe Boda delivery**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL 15 + Prisma ORM |
| Auth | JWT + bcrypt |
| Payments | Flutterwave (MTN / Airtel Mobile Money) |
| Images | Cloudinary |

---

## Features

- Vendor registration and shop setup
- Product listings with category filters (Women, Men, Children, Sports)
- Buyer registration and browsing
- Safe Boda delivery assignment
- Admin dashboard
- UGX 15,000/month vendor subscription

---

## Setup Instructions

### Requirements
- Node.js 18+
- PostgreSQL 15

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd modern-kikubo
```

### 2. Create environment file
Create a `.env` file in the root folder:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/modern_kikubo"
JWT_SECRET="your_secret_key"
PORT=5000
CLIENT_URL="http://localhost:5173"
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
FLUTTERWAVE_SECRET_KEY=""
```

### 3. Install dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 4. Set up the database
```bash
# From project root
cd ..
server/node_modules/.bin/prisma migrate dev --name init
server/node_modules/.bin/prisma generate
```

### 5. Run the app
```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Project Structure

```
modern-kikubo/
├── client/          # React frontend
│   └── src/
│       ├── pages/   # Home, Category, Login, Register, VendorDashboard
│       ├── components/  # Navbar, ProductCard
│       ├── context/ # AuthContext
│       └── api/     # Axios instance
├── server/          # Express backend
│   ├── routes/      # auth, products, vendors, orders, delivery, admin
│   └── middleware/  # auth, roles
└── prisma/
    └── schema.prisma
```

---

## Team

- **Rebecca Nyandeng** — Development
- **Nambuusi Emily** — Business
