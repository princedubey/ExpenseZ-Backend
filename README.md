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

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ExpenseZ_Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/expensez
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

4. Seed default categories:
```bash
node src/utils/seedCategories.js
```

## Running the Application

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

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