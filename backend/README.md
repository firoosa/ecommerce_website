# Baby Shop - Django Backend

Production-ready backend for Newborn Baby eCommerce platform.

## Setup

### 1. Create virtual environment
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment variables
Create a `.env` file in the backend directory:

**For SQLite (default):**
```
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**For PostgreSQL:**
```
DB_ENGINE=postgresql
DB_NAME=baby_shop_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432

DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4. Create PostgreSQL database (if using PostgreSQL)
```bash
# Using psql (PostgreSQL CLI)
psql -U postgres -c "CREATE DATABASE baby_shop_db;"

# Or using pgAdmin: create a new database named baby_shop_db
```

### 5. Run migrations
```bash
python manage.py migrate
```

### 6. Create superuser
```bash
python manage.py createsuperuser
```
Use email as username when prompted.

### 7. Run server
```bash
python manage.py runserver
```

**Not seeing request logs in terminal?** Try:
- `python -u manage.py runserver` (unbuffered output)
- Or run `run.bat` on Windows
- Ensure you're in the `backend` folder and the server started successfully

## API Documentation

- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/accounts/register/` | Register new user |
| `/api/accounts/login/` | Login (JWT) |
| `/api/accounts/refresh/` | Refresh JWT token |
| `/api/accounts/profile/` | Get/Update profile |
| `/api/accounts/addresses/` | User addresses |
| `/api/categories/` | Categories (slug for detail) |
| `/api/products/` | Products (filter, search, order) |
| `/api/cart/` | Cart operations |
| `/api/orders/` | Orders |
| `/api/reviews/product/<id>/` | Product reviews |
| `/api/wishlist/` | Wishlist |
| `/api/coupons/validate/` | Validate coupon |
| `/api/payments/razorpay/create-order/` | Create Razorpay order |
| `/api/payments/razorpay/verify/` | Verify payment |

## JWT Authentication

Include the token in requests:
```
Authorization: Bearer <access_token>
```

## Deploy: Render Backend + Vercel Frontend

Use this when your frontend is deployed on Vercel and backend on Render.

### 1) Render (Django backend) environment variables

Set these in Render:

```env
DEBUG=False
SECRET_KEY=your-strong-secret

DB_ENGINE=postgresql
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=5432

ALLOWED_HOSTS=your-render-service.onrender.com
CORS_ALLOWED_ORIGINS=https://ecommercefrontend-psi-opal.vercel.app
CSRF_TRUSTED_ORIGINS=https://ecommercefrontend-psi-opal.vercel.app
```

After deploy, run migrations:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### 2) Vercel (React frontend) environment variables

Add this variable in Vercel project settings:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

Then redeploy frontend.

### 3) Quick connection test

- Open frontend: `https://ecommercefrontend-psi-opal.vercel.app`
- Try login/register; requests should go to your Render domain under `/api/...`
- If browser shows CORS error, recheck `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` values (must match exact frontend URL with `https`).
