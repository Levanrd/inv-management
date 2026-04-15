# Application Documentation

## Overview

This project is an inventory management system with:

- An Express + MongoDB API in the repository root
- A Vue 2 + Element UI frontend in [`client`](../client)

The application supports:

- User authentication with JWT
- Admin and standard-user roles
- Product, category, supplier, order, and user management
- Inventory-aware order creation
- Dashboard reporting for stock and order activity

## Tech Stack

### Backend

- Node.js
- Express
- Mongoose
- JWT authentication
- `express-validator`
- `helmet`
- `cors`
- `express-rate-limit`

### Frontend

- Vue 2
- Vue Router
- Vuex
- Element UI
- Axios

## Project Structure

### Root

- [`server.js`](../server.js): API bootstrap, middleware, health check, and startup
- [`routes`](../routes): Express route modules
- [`models`](../models): Mongoose schemas
- [`middlewares`](../middlewares): auth and error middleware
- [`utils`](../utils): shared helpers for validation, errors, async handlers, serialization, and inventory logic
- [`scripts/resetDatabase.js`](../scripts/resetDatabase.js): database reset and seed script
- [`scripts/seedSampleData.js`](../scripts/seedSampleData.js): sample operational data seeder

### Frontend

- [`client/src/apps/ims`](../client/src/apps/ims): main authenticated workspace shell and route pages
- [`client/src/components/login`](../client/src/components/login): login screen
- [`client/src/components/register`](../client/src/components/register): registration screen
- [`client/src/api/ApiConnector.js`](../client/src/api/ApiConnector.js): Axios client and auth/error interceptors
- [`client/src/router/index.js`](../client/src/router/index.js): Vue Router routes and auth guards
- [`client/src/store/index.js`](../client/src/store/index.js): auth state storage

## Environment Variables

Use [`.env.example`](../.env.example) as the template for the backend environment.

Required values:

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: secret used for signing JWTs

Common values:

- `PORT`: backend API port. The provided `.env.example` sets this to `4000`; if it is unset, the server falls back to `5000`
- `NODE_ENV`: `development` or `production`
- `FRONTEND_URL`: allowed frontend origin for production CORS
- `SEED_ADMIN_PASSWORD`: optional override for admin seed password
- `SEED_TEST_PASSWORD`: optional override for test-user seed password

Frontend runtime/build value:

- `VUE_APP_API_URL`: optional client API base URL. The frontend defaults to `http://localhost:4000/api`

## Authentication and Roles

The system supports two roles:

- `admin`
- `user`

### Admin users can

- Create, update, and delete products
- Create, update, and delete categories
- Create, update, and delete suppliers
- View and manage all users
- View all orders
- Update or delete orders
- Create orders for other users

### Standard users can

- Register and log in
- View the dashboard
- View products, suppliers, categories, and their own orders
- Create orders for themselves

## Main Data Models

### User

Fields:

- `user_name`
- `first_name`
- `last_name`
- `email`
- `password`
- `role`

Notes:

- Passwords are hashed automatically before save/update
- Email and username are unique

### Product

Fields:

- `sku`
- `product_name`
- `description`
- `price`
- `stock_qty`
- `category`
- `supplier`

Notes:

- `category` references `Category`
- `supplier` references `Supplier`

### Category

Fields:

- `category_name`
- `description`

### Supplier

Fields:

- `supplier_name`
- `contact_info.address`
- `contact_info.phone`
- `contact_info.email`

### Order

Fields:

- `user`
- `order_items`
- `status`
- `total_amount`

Notes:

- Order items are embedded in the order document
- Order totals are calculated server-side
- Inventory stock is decremented when orders are created
- Inventory stock is restored when active orders are cancelled or deleted

## API Modules

The API base path is `/api`.

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/register-admin`

### Users

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

### Categories

- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`

### Suppliers

- `GET /suppliers`
- `POST /suppliers`
- `PUT /suppliers/:id`
- `DELETE /suppliers/:id`

### Products

- `GET /products`
- `GET /products/:id`
- `POST /products`
- `POST /products/bulk-upload`
- `PUT /products/:id`
- `DELETE /products/:id`

### Orders

- `GET /orders`
- `GET /orders/:id`
- `POST /orders`
- `PUT /orders/:id`
- `DELETE /orders/:id`

### Order Items

- `GET /orderitems`
- `GET /orderitems/:orderId`

### Reports

- `GET /reports`

Returns:

- summary stats
- low stock products
- recent orders
- order status summary

## Frontend Routes

### Public routes

- `/login`: validates email and password, stores auth state in Vuex and localStorage, and redirects authenticated users into the workspace
- `/register`: validates password strength, confirms password match, and creates a standard user account

### Authenticated workspace

The main workspace lives under `/ims` and uses sidebar navigation with nested child routes:

- `/ims/overview`: reporting, low-stock monitoring, recent orders, and summary cards
- `/ims/products`: product search, filtering, and inventory management
- `/ims/orders`: order creation plus status and fulfillment management
- `/ims/admin`: admin-only management for users, categories, and suppliers

Routing notes:

- `/` redirects to `/login`
- `/ims` redirects to `/ims/overview`

## Database Reset and Seed

To wipe the current database and seed a fresh admin and test user:

```sh
npm run db:reset
```

Default seeded users:

- `admin@example.com / Admin1234`
- `testuser@example.com / TestUser1234`

Optional password overrides:

```sh
set SEED_ADMIN_PASSWORD=YourAdminPassword
set SEED_TEST_PASSWORD=YourTestPassword
npm run db:reset
```

Important:

- This command drops the entire current database referenced by `MONGO_URI`
- Only run it against local/dev databases unless data loss is intended

## Sample Inventory Data

To populate inventory-related sample records without resetting users:

```sh
npm run db:seed
```

This script:

- ensures the default admin and test user exist
- clears existing categories, suppliers, products, and orders
- creates sample categories
- creates sample suppliers
- creates sample products
- creates sample orders with embedded order items
- adjusts product stock levels to reflect the seeded orders

Note:

- Order items are stored inside the `Order` document in this codebase, so there is no separate `orderitems` collection to seed

## Local Development

### Backend

```sh
npm install
npm run dev
```

### Frontend

```sh
cd client
npm install
npm run dev
```

With the current defaults, the frontend serves on `http://localhost:8080` and targets `http://localhost:4000/api`.

## Production Build

Build the frontend:

```sh
cd client
npm run build
```

## Operational Notes

- The backend exposes a health endpoint at `/health`
- Errors are centralized through [`middlewares/errorHandler.js`](../middlewares/errorHandler.js)
- Request payloads are sanitized before route handling
- Auth routes have stricter rate limiting
- The frontend build currently succeeds, but vendor bundle size is still large due to Element UI

## Known Improvement Areas

- Add automated backend and frontend tests
- Add API documentation with example request/response payloads
- Add pagination controls to more frontend tables
- Split the frontend vendor bundle for better performance
- Replace legacy Sass tooling over time
