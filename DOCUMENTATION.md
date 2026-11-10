# Modern Kikubo — Technical Documentation

## Overview

Modern Kikubo is a full-stack multi-vendor marketplace for second-hand clothes in Uganda. It is built as a monorepo with a React frontend and an Express/Node.js backend, backed by a PostgreSQL database managed through Prisma ORM.

---

## Architecture

```
Browser (React SPA)
        │  HTTP/JSON
        ▼
Express REST API (port 5000)
        │
        ├── JWT middleware       — verifies token on protected routes
        ├── Role middleware      — guards routes by user role
        ├── Upload middleware    — Multer → Cloudinary
        │
        ├── Routes
        │   ├── /api/auth        — register, login
        │   ├── /api/products    — CRUD for listings
        │   ├── /api/vendors     — shop registration and management
        │   ├── /api/orders      — order placement and status
        │   ├── /api/delivery    — boda rider assignment and tracking
        │   ├── /api/subscriptions — vendor payment plans
        │   └── /api/admin       — platform management
        │
        └── Prisma ORM
                │
                └── PostgreSQL 15
```

In production/demo mode, Express also serves the built React frontend from `client/dist/`, so only one port (5000) needs to be exposed through ngrok or a deployment platform.

---

## Authentication

- **Registration** (`POST /api/auth/register`): password hashed with bcryptjs (10 rounds), user record created with a default `BUYER` role.
- **Login** (`POST /api/auth/login`): credentials verified, a signed JWT returned (expires in 7 days).
- **Protected routes**: every request carries the JWT in the `Authorization: Bearer <token>` header. The `auth` middleware verifies and decodes it, attaching `req.user` for downstream handlers.
- **Role guards**: the `roles(...allowedRoles)` middleware checks `req.user.role` against an allowlist. A mismatch returns `403 Forbidden`.

---

## Role System

| Role | Capabilities |
|---|---|
| **ADMIN** | Full read/write access to vendors, orders, riders, subscriptions |
| **VENDOR** | Register a shop, manage own listings, view own orders, pay subscription |
| **BUYER** | Browse products, place orders, track order history |
| **BODA** | View assigned deliveries, mark picked up / delivered |

Roles are set at registration (default: BUYER). An admin can be created directly in the database or via a seed script.

---

## Image Uploads

Product photos are uploaded through a `multipart/form-data` POST. The flow:

1. Browser sends the file in a form field named `photo`.
2. `multer` intercepts the stream.
3. `multer-storage-cloudinary` pipes it directly to Cloudinary — no temporary file on disk.
4. Cloudinary returns a secure URL, which is stored in the `Product.photos` array in PostgreSQL.

Configuration is in `server/middleware/upload.js`. Credentials come from `CLOUDINARY_*` environment variables.

---

## Payment Flow

### Mock (current)
1. Buyer fills in delivery address and selects MTN or Airtel MoMo.
2. Frontend simulates a 2.2-second processing delay.
3. An `Order` record is created in the database with status `PAID`.
4. The vendor receives an email notification.

### Live (planned — Flutterwave)
The same UI will trigger a Flutterwave API call with the buyer's phone number. Flutterwave pushes a MoMo prompt to the buyer's phone. On webhook confirmation, the order status updates to `PAID`. Implementation is pending Uganda merchant approval from Flutterwave. Fallback option: **Pesapal** (already operating in Uganda, same MoMo support).

---

## Vendor Subscription

Vendors must hold an active subscription for their shop to be visible to buyers.

| Plan | Price (UGX) | Duration |
|---|---|---|
| Monthly | 50,000 | 30 days |
| Quarterly | 120,000 | 90 days |
| Yearly | 400,000 | 365 days |

On payment:
1. Any existing active subscription is expired.
2. A new `Subscription` record is created.
3. `Vendor.isActive` is set to `true`.

---

## Email Notifications

Handled by `server/services/email.js` using Nodemailer with a Gmail App Password transport.

| Trigger | Recipient | Content |
|---|---|---|
| Buyer places an order | Vendor | Order summary, items, total, delivery address |
| Boda marks order `PICKED_UP` | Buyer | "Your order is on the way" |
| Boda marks order `DELIVERED` | Buyer | "Your order has been delivered" |

If `GMAIL_USER` or `GMAIL_APP_PASS` are not set, emails are silently skipped and logged to console — the app continues to work normally.

---

## Order Lifecycle

```
PENDING  →  PAID  →  PREPARING  →  PICKED_UP  →  DELIVERED
                                                      │
                                              CANCELLED (any stage)
```

| Status | Set by |
|---|---|
| PENDING | Created automatically on order placement |
| PAID | Set after MoMo payment confirmation |
| PREPARING | Vendor (once they begin packaging) |
| PICKED_UP | Boda rider |
| DELIVERED | Boda rider |
| CANCELLED | Admin |

---

## Database Migrations

Migrations are managed by Prisma and stored in `prisma/migrations/`. To apply all migrations on a fresh database:

```bash
npx prisma migrate dev
npx prisma generate
```

To view the database in a browser GUI:
```bash
npx prisma studio
```

---

## Environment Variables

See `.env.example` for the full list with descriptions. The `.env` file is never committed to version control.

---

## Running for a Live Demo (ngrok)

```bash
# 1. Build the frontend
cd client && npm run build

# 2. Start the backend (serves built frontend too)
cd ../server && node index.js

# 3. In a new terminal, start ngrok
ngrok http 5000
```

Share the ngrok URL — it forwards to both the API and the React app.

---

## Deployment (Render — planned for final exam)

1. Push to GitHub (already done).
2. Create a **Web Service** on [render.com](https://render.com) pointing to the repo.
3. Set build command: `cd client && npm install && npm run build && cd ../server && npm install && npx prisma generate`
4. Set start command: `node server/index.js`
5. Add all environment variables from `.env.example` in Render's dashboard.
6. Provision a **PostgreSQL** database on Render and copy the connection string to `DATABASE_URL`.
