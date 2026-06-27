# Vi Microsystems Backend API

Complete backend API for Vi Microsystems Pvt Ltd website - handles user accounts, orders, enquiries, products, blog posts, and newsletter subscriptions.

## Features

- **Authentication**: User registration, login, JWT-based session management
- **Orders**: Order creation, order history, order status management
- **Enquiries**: Product enquiry submission with email notifications
- **Products**: Full CRUD operations for product catalog
- **Blog**: Blog post management with publishing workflow
- **Newsletter**: Email subscription management
- **Admin Panel**: Web-based admin interface for managing all data

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (using Node's built-in `node:sqlite` module)
- **Authentication**: JWT (JSON Web Tokens) + bcryptjs for password hashing
- **Email**: Nodemailer (Gmail SMTP)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
PORT=3000
JWT_SECRET=your-secret-key-here
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
NOTIFY_EMAIL=your-notification-email@gmail.com
ALLOWED_ORIGIN=*
```

3. Initialize the database and seed initial data:
```bash
node seed.js
```

4. Start the server:
```bash
node server.js
```

The server will start on port 3000 (or the port specified in `.env`).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (requires auth)

### Orders

- `POST /api/orders` - Create a new order (guest or logged-in)
- `GET /api/orders/mine` - Get current user's order history (requires auth)
- `GET /api/orders/:id` - Get a specific order by ID

### Enquiries

- `POST /api/enquiries` - Submit a product enquiry

### Products

- `GET /api/products` - Get all active products (supports category & search filters)
- `GET /api/products/:id` - Get a specific product by ID
- `POST /api/products` - Create a new product (requires auth)
- `PUT /api/products/:id` - Update a product (requires auth)
- `DELETE /api/products/:id` - Deactivate a product (requires auth)

### Blog

- `GET /api/blog` - Get all published blog posts (supports category filter)
- `GET /api/blog/:slug` - Get a specific blog post by slug
- `POST /api/blog` - Create a new blog post (requires auth)
- `PUT /api/blog/:slug` - Update a blog post (requires auth)
- `DELETE /api/blog/:slug` - Delete a blog post (requires auth)
- `GET /api/blog/admin/all` - Get all blog posts including drafts (requires auth)

### Newsletter

- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `POST /api/newsletter/unsubscribe` - Unsubscribe from newsletter

### User Profile

- `GET /api/users/profile` - Get current user profile (requires auth)
- `PUT /api/users/profile` - Update current user profile (requires auth)
- `PUT /api/users/password` - Update current user password (requires auth)

### Admin

- `GET /api/admin/dashboard` - Get dashboard statistics (requires auth)
- `GET /api/admin/orders` - Get all orders (requires auth, supports status filter)
- `PUT /api/admin/orders/:id/status` - Update order status (requires auth)
- `GET /api/admin/enquiries` - Get all enquiries (requires auth, supports status filter)
- `PUT /api/admin/enquiries/:id/status` - Update enquiry status (requires auth)
- `GET /api/admin/users` - Get all users (requires auth)

## Admin Panel

Access the web-based admin panel by opening `admin.html` in your browser after starting the server.

**Features:**
- Dashboard with statistics (orders, enquiries, users, revenue)
- Order management with status updates
- Enquiry management with status tracking
- Product CRUD operations
- User listing

**Default Setup:**
1. Register a user account through the frontend
2. Use those credentials to login to the admin panel
3. For production, implement role-based access control to restrict admin access

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - User's email (unique)
- `password_hash` - Bcrypt hashed password
- `created_at` - Timestamp

### Orders Table
- `id` - Primary key
- `user_id` - Foreign key to users (nullable for guest orders)
- `customer_name` - Customer's name
- `customer_email` - Customer's email
- `customer_phone` - Customer's phone (optional)
- `shipping_address` - Shipping address (optional)
- `subtotal_inr` - Order total in INR
- `currency` - Currency code (default: INR)
- `status` - Order status (pending, confirmed, processing, shipped, delivered, cancelled)
- `created_at` - Timestamp

### Order Items Table
- `id` - Primary key
- `order_id` - Foreign key to orders
- `product_id` - Product identifier
- `product_name` - Product name at time of order
- `unit_price_inr` - Unit price at time of order
- `quantity` - Quantity ordered

### Enquiries Table
- `id` - Primary key
- `name` - Enquirer's name
- `email` - Enquirer's email
- `subject` - Enquiry subject (optional)
- `message` - Enquiry message
- `product_name` - Related product (optional)
- `status` - Enquiry status (new, in_progress, resolved, closed)
- `created_at` - Timestamp

### Products Table
- `id` - Primary key
- `product_id` - Unique product identifier (e.g., 'esp32')
- `name` - Product name
- `description` - Product description
- `price_inr` - Price in INR (nullable for "Price on Request")
- `is_placeholder` - Flag for placeholder pricing
- `image_url` - Product image URL
- `page_url` - Product page URL
- `category` - Product category
- `specifications` - Product specifications
- `stock_quantity` - Available stock
- `is_active` - Active flag (soft delete)
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Blog Posts Table
- `id` - Primary key
- `title` - Blog post title
- `slug` - URL-friendly slug (unique)
- `excerpt` - Short excerpt
- `content` - Full content
- `author` - Author name
- `image_url` - Featured image URL
- `category` - Blog category
- `is_published` - Published flag
- `published_at` - Publication timestamp
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Newsletter Subscribers Table
- `id` - Primary key
- `email` - Subscriber email (unique)
- `name` - Subscriber name (optional)
- `subscribed_at` - Subscription timestamp
- `is_active` - Active flag

## Security Notes

- Passwords are hashed using bcrypt before storage
- JWT tokens expire after 7 days
- CORS is configured - update `ALLOWED_ORIGIN` in production
- Email uses Gmail App Password (not regular password)
- For production, implement role-based access control for admin endpoints

## Deployment

This backend can be deployed to any Node.js hosting platform:

1. **Render**: Set environment variables in the Render dashboard
2. **Heroku**: Use Heroku Config Vars
3. **Railway**: Set environment variables in Railway dashboard
4. **VPS**: Use PM2 for process management

Make sure to:
- Set a strong `JWT_SECRET` in production
- Configure `ALLOWED_ORIGIN` to your frontend domain
- Set up Gmail App Password for email functionality
- Use HTTPS in production

## Frontend Integration

The frontend should be configured to use the backend API URL:

```javascript
const API_BASE_URL = 'https://your-backend-url.com';
```

Update this in:
- `frontend/js/Account.js`
- `frontend/js/cart.js`

## License

Proprietary - Vi Microsystems Pvt Ltd
