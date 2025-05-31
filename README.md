# ExpenseZ Backend

A production-ready backend API for the ExpenseZ expense tracking application.

## Features

- User authentication with JWT
- CRUD operations for transactions
- Category management
- User profile management
- Transaction analytics and summaries
- Secure password handling
- Input validation
- Error handling
- Rate limiting
- MongoDB integration
- Production-ready security measures

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Express Validator for input validation
- Bcrypt for password hashing
- Helmet for security headers
- CORS for cross-origin requests
- Morgan for logging
- Winston for error logging
- Express Rate Limit for rate limiting

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

## Deployment Options

### 1. Deploying to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy to Vercel:
```bash
npm run deploy
```

4. Set up environment variables in Vercel:
   - Go to your project settings in Vercel dashboard
   - Add the following environment variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - Add any other environment variables from your `.env` file

### 2. Traditional Server Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to your server:
```bash
npm run deploy:server
```

3. Set up environment variables on your server:
   - Create a `.env` file with all required environment variables
   - Make sure to set `NODE_ENV=production`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
# Add other environment variables as needed
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Seed initial data (if needed):
```bash
npm run seed
```

## Production

To run in production mode:

```bash
npm start
```

## API Documentation

API documentation will be available at `/api-docs` when the server is running.

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user

### Transactions
- GET /api/transactions - Get all transactions
- POST /api/transactions - Create transaction
- GET /api/transactions/:id - Get single transaction
- PUT /api/transactions/:id - Update transaction
- DELETE /api/transactions/:id - Delete transaction
- GET /api/transactions/summary - Get transaction summary

### Categories
- GET /api/categories - Get all categories
- POST /api/categories - Create category
- GET /api/categories/:id - Get single category
- PUT /api/categories/:id - Update category
- DELETE /api/categories/:id - Delete category

### Users
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile
- PUT /api/users/password - Update user password

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Rate limiting
- Input validation
- Security headers with Helmet
- CORS configuration
- Error handling
- MongoDB query sanitization

## Error Handling

The API uses a centralized error handling mechanism that:
- Catches all errors
- Formats error responses
- Handles different types of errors (validation, authentication, etc.)
- Provides meaningful error messages
- Logs errors for debugging

## Production Considerations

1. Set appropriate environment variables
2. Use a production MongoDB instance
3. Configure proper CORS settings
4. Set up proper logging
5. Use HTTPS
6. Implement proper security measures
7. Set up monitoring and error tracking
8. Configure rate limiting appropriately

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 