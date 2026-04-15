# Inventory Management System

An inventory management application with an Express/MongoDB backend and a Vue 2 frontend for catalog, supplier, order, and user operations.

## Stack

- Backend: Node.js, Express, Mongoose, JWT authentication
- Frontend: Vue 2, Vue Router, Vuex, Element UI
- Database: MongoDB

## Features

- Authenticated route-based workspace with overview, inventory, fulfillment, and admin areas
- Product, category, supplier, order, and user management
- Role-aware access control for admin-only actions
- Server-side validation, rate limiting, request sanitization, and centralized error handling
- Inventory-aware order creation with stock adjustment and reporting endpoints

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB

## Backend setup

1. Install dependencies:

```sh
npm install
```

2. Create a local environment file from the example:

```sh
copy .env.example .env
```

3. Update `.env` with your MongoDB connection string and a strong `JWT_SECRET`.

4. Start the API:

```sh
npm run dev
```

With the provided `.env.example`, the API runs on `http://localhost:4000`.
If `PORT` is unset, the server falls back to `http://localhost:5000`.

## Frontend setup

1. Install client dependencies:

```sh
cd client
npm install
```

2. Start the frontend:

```sh
npm run dev
```

The Vue app runs on `http://localhost:8080` by default.
It targets `http://localhost:4000/api` unless `VUE_APP_API_URL` is set for the client.

## Production build

Build the frontend for deployment:

```sh
cd client
npm run build
```

## API highlights

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/reports`
- `GET /api/products`
- `GET /api/orders`

## Seed commands

- `npm run db:reset`: drops the current database and seeds the default admin/test users
- `npm run db:seed`: repopulates categories, suppliers, products, and sample orders

## Notes

- Keep `.env` out of source control and rotate credentials immediately if they were ever committed.
- The current production bundle still includes the full Element UI vendor chunk, so bundle-size optimization is a good next step after this hardening pass.

## Documentation

Detailed application documentation is available in [docs/APP_DOCUMENTATION.md](docs/APP_DOCUMENTATION.md).
