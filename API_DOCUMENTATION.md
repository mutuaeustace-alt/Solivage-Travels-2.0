# Solivage Travels API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Obtain a token by posting to `/login` with username and password.

## Endpoints

### Authentication
#### POST /login
Login to obtain a JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token_string"
}
```

### Rates
#### GET /rates
Get all rates.

**Response:** Array of rate objects
```json
[
  {
    "id": number,
    "vehicle": "string",
    "service": "string",
    "base_price": number
  }
]
```

#### POST /rates
Create or update a rate (requires authentication).

**Request Body:**
```json
{
  "vehicle": "string",
  "service": "string",
  "base_price": number
}
```

**Response:**
```json
{
  "success": boolean
}
```

#### PATCH /rates/:id
Update a specific rate (requires authentication).

**Request Body:**
```json
{
  "vehicle": "string",
  "service": "string",
  "base_price": number
}
```

**Response:**
```json
{
  "success": boolean
}
```

#### DELETE /rates/:id
Delete a specific rate (requires authentication).

**Response:**
```json
{
  "success": boolean
}
```

### Bookings
#### GET /bookings
Get all bookings.

**Response:** Array of booking objects
```json
[
  {
    "id": number,
    "name": "string",
    "email": "string",
    "phone": "string",
    "vehicle": "string",
    "service": "string",
    "pickup": "string",
    "dropoff": "string",
    "date": "ISO date string",
    "notes": "string",
    "status": "string (pending|confirmed|completed|cancelled)",
    "created_at": "ISO date string"
  }
]
```

#### GET /bookings/:id
Get a specific booking (requires authentication).

**Response:** Booking object

#### POST /bookings
Create a new booking.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string",
  "vehicle": "string (required)",
  "service": "string (required)",
  "pickup": "string (required)",
  "dropoff": "string (required)",
  "date": "ISO date string (required)",
  "notes": "string"
}
```

**Response:**
```json
{
  "success": boolean,
  "id": number
}
```

#### PATCH /bookings/:id
Update booking status (requires authentication).

**Request Body:**
```json
{
  "status": "string (pending|confirmed|completed|cancelled)"
}
```

**Response:**
```json
{
  "success": boolean
}
```

#### DELETE /bookings/:id
Delete a booking (requires authentication).

**Response:**
```json
{
  "success": boolean
}
```

### Contacts
#### GET /contacts
Get all contact messages (requires authentication).

**Response:** Array of contact objects
```json
[
  {
    "id": number,
    "name": "string",
    "email": "string",
    "message": "string",
    "status": "string (unread|read)",
    "created_at": "ISO date string"
  }
]
```

#### POST /contacts
Create a new contact message.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "message": "string (required)"
}
```

**Response:**
```json
{
  "success": boolean,
  "id": number
}
```

#### PATCH /contacts/:id
Update contact status (requires authentication).

**Request Body:**
```json
{
  "status": "string (unread|read)"
}
```

**Response:**
```json
{
  "success": boolean
}
```

#### DELETE /contacts/:id
Delete a contact message (requires authentication).

**Response:**
```json
{
  "success": boolean
}
```

### Payments
#### POST /create-payment-intent
Create a payment intent for a booking (requires authentication).

**Request Body:**
```json
{
  "bookingId": "number",
  "amount": "number (in cents, optional)"
}
```

**Response:**
```json
{
  "success": boolean,
  "clientSecret": "string",
  "paymentIntentId": "string"
}
```

#### POST /stripe-webhook
Handle Stripe webhook events (no authentication required - uses webhook signing secret).

### File Upload
#### POST /upload
Upload a file (requires authentication).

**Request:** FormData with file input

**Response:**
```json
{
  "success": boolean,
  "filename": "string",
  "path": "string",
  "originalname": "string",
  "mimetype": "string",
  "size": number
}
```

## Error Responses
All endpoints may return error responses with the following format:
```json
{
  "error": "Error message string"
}
```

With appropriate HTTP status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting
API endpoints are rate-limited to prevent abuse. Default limits:
- 100 requests per 15 minutes per IP

## Security
- All API endpoints (except auth) require JWT authentication
- Passwords are hashed using bcrypt
- Helmet.js is used for security headers
- CORS is configured
- Input validation is performed on all endpoints