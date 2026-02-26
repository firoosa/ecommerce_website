# Baby Store - React Frontend

Modern, responsive frontend for the Newborn Baby eCommerce platform.

## Tech Stack

- React 18 + Vite
- React Router v6
- Redux Toolkit (auth & cart)
- Tailwind CSS
- Axios
- React Hot Toast
- React Icons

## Setup

```bash
# Install dependencies
npm install

# Start development server (runs on port 3000)
npm run dev
```

## Backend

Ensure the Django backend is running on **port 8005** (or update the proxy in `vite.config.js`).

```bash
cd ../backend
python manage.py runserver 8005
```

## Features

- **Home**: Hero, featured categories, featured products
- **Products**: Filter, search, sort
- **Product Detail**: Gallery, add to cart, reviews
- **Cart**: Update quantity, remove items, checkout
- **Checkout**: Address selection, place order
- **Auth**: Login, Register, Profile
- **Admin Panel**: Dashboard, Products, Categories, Orders (view only; full CRUD via Django Admin)

## Design

- **Primary**: Sky Blue (#0ea5e9)
- **Secondary**: Baby Pink (#ec4899)
- **Style**: Soft shadows, rounded corners (xl/2xl), pastel backgrounds

## Build

```bash
npm run build
npm run preview  # Preview production build
```
