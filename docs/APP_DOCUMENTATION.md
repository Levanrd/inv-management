# Application Documentation

## Overview

This project is an inventory management system with:

- An Express + MongoDB API in the repository root
- A Vue 2 + Element UI frontend in [`client`](/C:/Users/Lester/Documents/Repositories/inv-management/client)

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

- [`server.js`](/C:/Users/Lester/Documents/Repositories/inv-management/server.js): API bootstrap, middleware, health check, and startup
- [`routes`](/C:/Users/Lester/Documents/Repositories/inv-management/routes): Express route modules
- [`models`](/C:/Users/Lester/Documents/Repositories/inv-management/models): Mongoose schemas
- [`middlewares`](/C:/Users/Lester/Documents/Repositories/inv-management/middlewares): auth and error middleware
- [`utils`](/C:/Users/Lester/Documents/Repositories/inv-management/utils): shared helpers for validation, errors, async handlers, serialization, and inventory logic
- [`scripts/resetDatabase.js`](/C:/Users/Lester/Documents/Repositories/inv-management/scripts/resetDatabase.js): database reset and seed script

### Frontend

- [`client/src/apps/ims`](/C:/Users/Lester/Documents/Repositories/inv-management/client/src/apps/ims): main authenticated dashboard
- [`client/src/components/login`](/C:/Users/Lester/Documents/Repositories/inv-management/client/src/components/login): login screen
- [`client/src/components/register`](/C:/Users/Lester/Documents/Repositories/inv-management/client/src/components/register): registration screen
- [`client/src/api/ApiConnector.js`](/C:/Users/Lester/Documents/Repositories/inv-management/client/src/api/ApiConnector.js): Axios client and auth/error interceptors
- [`client/src/router/index.js`](/C:/Users/Lester/Documents/Repositories/inv-management/client/src/router/index.js): route guards
- [`client/src/store/index.js`](/C:/Users/Lester/Documents/Repositories/inv-management/client/src/store/index.js): auth state storage

## Environment Variables

Use [.env.example](/C:/Users/Lester/Documents/Repositories/inv-management/.env.example) as the template.

Required values:

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: secret used for signing JWTs

Common values:

- `PORT`: backend API port, default `4000`
- `NODE_ENV`: `development` or `production`
- `FRONTEND_URL`: allowed frontend origin for production CORS
- `SEED_ADMIN_PASSWORD`: optional override for admin seed password
- `SEED_TEST_PASSWORD`: optional override for test-user seed password

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

## Frontend Screens

### Login

The login page:

- validates email and password
- stores auth state in Vuex and localStorage
- redirects authenticated users into the dashboard

### Register

The register page:

- validates password strength
- confirms password match
- creates a standard user account

### Dashboard

The dashboard is divided into tabs:

- `Overview`: reporting, low stock, recent orders
- `Products`: product search and inventory management
- `Orders`: order creation and status management
- `Admin Setup`: category, supplier, and user management for admins

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

## Production Build

Build the frontend:

```sh
cd client
node_modules\.bin\vue-cli-service.cmd build
```

## Operational Notes

- The backend exposes a health endpoint at `/health`
- Errors are centralized through [`middlewares/errorHandler.js`](/C:/Users/Lester/Documents/Repositories/inv-management/middlewares/errorHandler.js)
- Request payloads are sanitized before route handling
- Auth routes have stricter rate limiting
- The frontend build currently succeeds, but vendor bundle size is still large due to Element UI

## Known Improvement Areas

- Add automated backend and frontend tests
- Add API documentation with example request/response payloads
- Add pagination controls to more frontend tables
- Split the frontend vendor bundle for better performance
- Replace legacy Sass tooling over time
