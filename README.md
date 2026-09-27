# E-commerce application

Full-stack demo with a **Node.js + Express + MongoDB** REST API and a **React (Vite)** storefront. Cart totals, stock checks, and checkout run on the server.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) running locally (default URI below) or a hosted cluster

## Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env if needed (MONGODB_URI, JWT_SECRET)
npm install
npm run seed
npm run dev
```

API base: `http://localhost:5050` (port **5050** avoids macOS Control Center / AirPlay using **5000**)

Endpoints include:

- `POST /api/register`, `POST /api/login`, `POST /api/logout` (JWT)
- `GET /api/products`, `GET /api/products/:id` (optional query: `q`, `category`, `minPrice`, `maxPrice`)
- `GET|POST /api/cart`, `PUT|DELETE /api/cart/:productId` (authenticated)
- `GET|POST /api/orders`, `GET /api/orders/:id` (authenticated)

Errors use `{ "status": "error", "message": "..." }`.

## Frontend setup

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api` to the backend on port 5050.

Optional: set `VITE_API_URL=http://localhost:5050` in `frontend/.env` if you prefer absolute API URLs (no proxy).

## What’s included

- Auth: login, register, profile (password + email change with verification link), forgot/reset password.
- Products: search/filters, image gallery, reviews & star ratings, wishlist.
- Server-side cart, **15-minute stock reservation** at checkout, coupons, shipping by region.
- Orders with status (`pending` → `shipped` → `delivered`), shipping address, order detail page.
- **Admin dashboard** (`/admin`): product CRUD, order status, low-stock alerts, sales summary.

After `npm run seed`, admin login: **admin@shop.com** / **Admin12345!** (override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`).  
Test coupons: **SAVE10**, **FLAT5**, **WELCOME20**.

Email (Resend): set `RESEND_API_KEY` and `APP_URL` in `backend/.env`; without it, reset/verify links print in the API console.

## Production build

```bash
cd frontend && npm run build
```

Serve the `frontend/dist` static files behind your host of choice and point `VITE_API_URL` (at build time) to your API origin.
