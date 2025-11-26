# User Management API

This document covers all user-related endpoints including registration, authentication, and profile management.

## Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/users/register`

**Authentication:** Not required

**Request Body:**

```json
{
  "userName": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe" // Optional
}
```

**Validation Rules:**
- `userName`: Required, 3-20 characters, alphanumeric and underscores only
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters
- `displayName`: Optional, max 50 characters

**Success Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "userName": "johndoe",
      "email": "john@example.com",
      "displayName": "John Doe",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

```json
// 409 - User already exists
{
  "success": false,
  "message": "Username or email already exists"
}

// 400 - Validation error
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format"
  }
}
```

---

### Login User

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/users/login`

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "userName": "johndoe",
      "email": "john@example.com",
      "displayName": "John Doe",
      "profilePicUrl": "https://example.com/pic.jpg",
      "isVerified": false,
      "isPremium": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

```json
// 401 - Invalid credentials
{
  "success": false,
  "message": "Invalid email or password"
}

// 404 - User not found
{
  "success": false,
  "message": "User not found"
}
```

---

### Logout User

Logout the current user (client-side token removal).

**Endpoint:** `POST /api/users/logout`

**Authentication:** Not required (handled client-side)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get Current User Profile

Get the authenticated user's profile information.

**Endpoint:** `GET /api/users/profile`

**Authentication:** 🔒 Required

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userName": "johndoe",
    "email": "john@example.com",
    "displayName": "John Doe",
    "bio": "Software developer and link enthusiast",
    "profilePicUrl": "https://example.com/pic.jpg",
    "coverImage": "https://example.com/cover.jpg",
    "isVerified": true,
    "isPremium": false,
    "socialLinks": [
      {
        "platform": "twitter",
        "url": "https://twitter.com/johndoe"
      },
      {
        "platform": "github",
        "url": "https://github.com/johndoe"
      }
    ],
    "bookmarks": ["collection_id_1", "collection_id_2"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

**Error Responses:**

```json
// 401 - Unauthorized
{
  "success": false,
  "message": "No token provided"
}

// 404 - User not found
{
  "success": false,
  "message": "User not found"
}
```

---

## User Model Schema

```javascript
{
  userName: String,        // Unique username
  email: String,          // Unique email
  password: String,       // Hashed password
  displayName: String,    // Display name
  bio: String,           // User biography
  profilePicUrl: String, // Profile picture URL
  coverImage: String,    // Cover image URL
  isVerified: Boolean,   // Verification status
  isPremium: Boolean,    // Premium account status
  socialLinks: [{
    platform: String,    // e.g., "twitter", "github"
    url: String         // Social profile URL
  }],
  bookmarks: [ObjectId], // Bookmarked collections
  createdAt: Date,
  updatedAt: Date
}
```

---

## Examples

### cURL Examples

**Register:**
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "displayName": "John Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Get Profile:**
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### JavaScript/Fetch Examples

**Register:**
```javascript
const response = await fetch('http://localhost:5000/api/users/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userName: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    displayName: 'John Doe'
  })
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('token', data.data.token);
  console.log('Registered successfully!');
}
```

**Login:**
```javascript
const response = await fetch('http://localhost:5000/api/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('token', data.data.token);
  console.log('Logged in successfully!');
}
```

**Get Profile:**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5000/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
if (data.success) {
  console.log('User profile:', data.data);
}
```

---

## Security Notes

1. **Password Hashing**: Passwords are hashed using bcrypt before storage
2. **JWT Tokens**: Tokens expire after a configured period
3. **Email Validation**: Email format is validated on registration
4. **Username Uniqueness**: Usernames and emails must be unique
5. **HTTPS**: Always use HTTPS in production to protect credentials

---

## Common Issues

### Issue: "Username or email already exists"
**Solution**: Choose a different username or email address

### Issue: "Invalid email or password"
**Solution**: Verify credentials are correct

### Issue: "No token provided"
**Solution**: Include the Authorization header with a valid JWT token

### Issue: "Token expired"
**Solution**: Login again to get a new token
