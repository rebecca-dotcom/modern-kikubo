# Modern Kikubo 🛍️

**A multi-vendor second-hand clothes marketplace built for Uganda.**

Modern Kikubo connects buyers, vendors, and boda riders in a single platform. Vendors list second-hand clothes from physical markets like Owino; buyers browse and pay via Mobile Money (MTN MoMo / Airtel Money); boda riders handle last-mile delivery.

---

## Features

| Feature | Description |
|---|---|
| **Role-based authentication** | Four roles: Admin, Vendor, Buyer, Boda Rider — each with its own dashboard |
| **Product listings** | Vendors upload clothes with photos (Cloudinary), price, size, condition and category |
| **Mobile Money payment** | MTN MoMo & Airtel Money checkout flow (mock; Flutterwave live integration pending Uganda approval) |
| **Vendor subscriptions** | Monthly / Quarterly / Yearly plans paid via MoMo to activate a vendor shop |
| **Boda delivery tracking** | Admin assigns a rider to a paid order; rider updates status (Picked Up → Delivered) |
| **Email notifications** | Vendor emailed on new order; buyer emailed when order is picked up and delivered |
| **Search & browse** | Search across all categories or filter within Women / Men / Children / Sports |
| **Admin dashboard** | Manage vendors, orders, riders, and subscriptions with an SVG bar chart overview |

---

## Tech Stack

### Frontend
- **React 19** + Vite 8
- React Router v7 (client-side routing)
- Axios (API calls)
- CSS Modules (no UI library — all custom)

### Backend
- **Node.js 20** + Express 4
- **PostgreSQL 15** + Prisma ORM 5
- JWT authentication + bcryptjs
- Multer + multer-storage-cloudinary (image uploads)
- Nodemailer (email notifications)

### Services
- **Cloudinary** — product photo storage
- **Gmail** (via Nodemailer) — transactional email
- **Flutterwave** (planned) — live MoMo payments

---

## Project Structure

```
modern-kikubo/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── api/             # Axios instance
│       ├── components/      # Navbar, DashboardLayout, ProductCard
│       ├── context/         # AuthContext (JWT + user state)
│       └── pages/           # Home, Category, ProductDetail, dashboards
├── server/                  # Express backend
│   ├── middleware/          # auth.js, roles.js, upload.js
│   ├── routes/              # auth, products, vendors, orders, delivery, admin, subscriptions
│   └── services/            # email.js (Nodemailer)
├── prisma/
│   ├── schema.prisma        # Data models
│   └── migrations/          # Migration history
└── .env                     # Environment variables (never committed)
```

---

## Data Models

```
User        — id, name, email, phone, password, role
Vendor      — shopName, location, description, isActive
Product     — title, description, price, category, size, condition, photos[]
Order       — buyer, vendor, boda, status, totalAmount, deliveryAddress, items[]
OrderItem   — product, quantity, price
Subscription— vendor, plan, amount, expiresAt, status
Payment     — order, amount, method, status, reference
Boda        — plateNo, isActive
```

---

## User Roles

| Role | Access |
|---|---|
| **ADMIN** | Full platform management — vendors, orders, riders, subscriptions |
| **VENDOR** | Register a shop, upload listings, view orders, subscribe to activate |
| **BUYER** | Browse, search, buy, track orders |
| **BODA** | View assigned deliveries, mark picked up / delivered |

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15
- A [Cloudinary](https://cloudinary.com) account (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/rebecca-dotcom/modern-kikubo.git
cd modern-kikubo
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` and fill in your values (see `.env.example` for all required keys).

### 3. Install dependencies
```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 4. Set up the database
```bash
cd ..
npx prisma migrate dev
npx prisma generate
```

### 5. Create an admin account
```bash
cd server
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
p.user.create({ data: { name: 'Admin', email: 'admin@kikubo.ug', phone: '0700000000', password: bcrypt.hashSync('Admin1234!', 10), role: 'ADMIN' } }).then(() => { console.log('Admin created'); p.disconnect(); });
"
```

### 6. Run the app
```bash
# Terminal 1 — backend (port 5000)
cd server && npm run dev

# Terminal 2 — frontend (port 5173)
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/products` | — | List products (supports `?category=&search=&page=`) |
| GET | `/api/products/:id` | — | Single product detail |
| POST | `/api/products` | VENDOR | Create a listing (multipart/form-data) |
| DELETE | `/api/products/:id` | VENDOR/ADMIN | Delete a listing |
| POST | `/api/vendors/register` | VENDOR | Register a shop |
| GET | `/api/vendors/me` | VENDOR | Get own shop + products + orders |
| POST | `/api/orders` | BUYER | Place an order |
| GET | `/api/orders/my` | BUYER | Buyer's order history |
| PATCH | `/api/orders/:id/status` | VENDOR/BODA/ADMIN | Update order status |
| POST | `/api/subscriptions/pay` | VENDOR | Pay for a subscription plan |
| PATCH | `/api/delivery/:id/assign` | ADMIN | Assign a boda rider to an order |
| GET | `/api/delivery/my` | BODA | Rider's assigned deliveries |
| GET | `/api/admin/stats` | ADMIN | Platform stats |
| GET | `/api/admin/vendors` | ADMIN | All vendors |
| GET | `/api/admin/orders` | ADMIN | All orders |
| GET | `/api/admin/bodas` | ADMIN | All boda riders |
| GET | `/api/admin/subscriptions` | ADMIN | All subscriptions |
| PATCH | `/api/admin/vendors/:id/activate` | ADMIN | Activate / deactivate a vendor |

---

## Live Demo

> Run with ngrok for a shareable URL:
> ```bash
> cd client && npm run build
> cd ../server && node index.js   # serves built frontend on port 5000
> ngrok http 5000
> ```

---

## Roadmap

- [ ] Live Flutterwave MoMo integration (pending Uganda approval)
- [ ] Product ratings and reviews after delivery
- [ ] Vendor order status updates (mark as Preparing)
- [ ] Subscription renewal reminder emails
- [ ] Mobile responsiveness polish
- [ ] Deploy to Render

---

## Author

**Rebecca Nyandeng**  
Health Informatics · European Campus Rottal-Inn  
[github.com/rebecca-dotcom](https://github.com/rebecca-dotcom)
