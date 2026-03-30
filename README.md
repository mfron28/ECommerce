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

- Auth pages with client-side validation (empty fields, invalid email) and API errors (e.g. wrong password).
- Product listing with search and filters; product detail; out-of-stock handling.
- Server-side cart (per user), line updates, removes, and totals.
- Checkout creates an order with server-side price and stock validation, then clears the cart.
- Order history, loading spinners, and empty/error states.

## Production build

```bash
cd frontend && npm run build
```

Serve the `frontend/dist` static files behind your host of choice and point `VITE_API_URL` (at build time) to your API origin.
