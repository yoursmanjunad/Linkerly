# URL Shortening API

This document covers all URL shortening and management endpoints.

## Endpoints

### Create Short URL

Create a new shortened URL.

**Endpoint:** `POST /api/url/shorten`

**Authentication:** 🔒 Required

**Request Body:**

```json
{
  "originalUrl": "https://example.com/very-long-url-that-needs-shortening",
  "customShortUrl": "my-link", // Optional
  "title": "My Example Link", // Optional
  "description": "A description of the link", // Optional
  "image": "https://example.com/image.jpg", // Optional
  "collectionId": "507f1f77bcf86cd799439011" // Optional
}
```

**Validation Rules:**
- `originalUrl`: Required, must be a valid URL
- `customShortUrl`: Optional, 3-50 characters, alphanumeric and hyphens only
- `title`: Optional, max 200 characters
- `description`: Optional, max 500 characters
- `image`: Optional, must be a valid URL
- `collectionId`: Optional, valid MongoDB ObjectId

**Success Response (201):**

```json
{
  "success": true,
  "message": "URL shortened successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "originalUrl": "https://example.com/very-long-url-that-needs-shortening",
    "shortUrl": "abc123",
    "customShortUrl": "my-link",
    "title": "My Example Link",
    "description": "A description of the link",
    "image": "https://example.com/image.jpg",
    "userId": "507f1f77bcf86cd799439012",
    "clicks": 0,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 - Invalid URL
{
  "success": false,
  "message": "Invalid URL format"
}

// 409 - Custom short URL already exists
{
  "success": false,
  "message": "Custom short URL already taken"
}
```

---

### Get User URLs

Get all URLs created by the authenticated user.

**Endpoint:** `GET /api/url/user/links`

**Authentication:** 🔒 Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (default: "createdAt")
- `order` (optional): Sort order "asc" or "desc" (default: "desc")

**Example Request:**
```
GET /api/url/user/links?page=1&limit=10&sortBy=clicks&order=desc
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "urls": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "originalUrl": "https://example.com/page",
        "shortUrl": "abc123",
        "customShortUrl": "my-link",
        "title": "My Example Link",
        "description": "A description",
        "image": "https://example.com/image.jpg",
        "clicks": 42,
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUrls": 47,
      "hasMore": true
    }
  }
}
```

---

### Get URL Details

Get detailed information about a specific URL.

**Endpoint:** `GET /api/url/details/:id`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: URL document ID

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "originalUrl": "https://example.com/page",
    "shortUrl": "abc123",
    "customShortUrl": "my-link",
    "title": "My Example Link",
    "description": "A description",
    "image": "https://example.com/image.jpg",
    "userId": "507f1f77bcf86cd799439012",
    "clicks": 42,
    "isActive": true,
    "collections": ["507f1f77bcf86cd799439013"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

**Error Responses:**

```json
// 404 - URL not found
{
  "success": false,
  "message": "URL not found"
}

// 403 - Unauthorized access
{
  "success": false,
  "message": "You don't have permission to access this URL"
}
```

---

### Get URL Analytics

Get analytics data for a specific URL.

**Endpoint:** `GET /api/url/analytics/:id`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: URL document ID

**Query Parameters:**
- `period` (optional): Time period - "7d", "30d", "90d", "all" (default: "30d")

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "urlId": "507f1f77bcf86cd799439011",
    "totalClicks": 1247,
    "uniqueVisitors": 892,
    "clicksByDate": [
      {
        "date": "2024-01-15",
        "clicks": 45
      },
      {
        "date": "2024-01-16",
        "clicks": 67
      }
    ],
    "topReferrers": [
      {
        "referrer": "google.com",
        "count": 234
      },
      {
        "referrer": "twitter.com",
        "count": 156
      }
    ],
    "deviceBreakdown": {
      "mobile": 678,
      "desktop": 456,
      "tablet": 113
    },
    "countryBreakdown": [
      {
        "country": "United States",
        "count": 456
      },
      {
        "country": "United Kingdom",
        "count": 234
      }
    ]
  }
}
```

---

### Update URL

Update an existing URL's metadata.

**Endpoint:** `PUT /api/url/update/:id`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: URL document ID

**Request Body:**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "image": "https://example.com/new-image.jpg",
  "customShortUrl": "new-custom-url", // Optional
  "isActive": true // Optional
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "URL updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "originalUrl": "https://example.com/page",
    "shortUrl": "abc123",
    "customShortUrl": "new-custom-url",
    "title": "Updated Title",
    "description": "Updated description",
    "image": "https://example.com/new-image.jpg",
    "isActive": true,
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

**Error Responses:**

```json
// 409 - Custom URL already taken
{
  "success": false,
  "message": "Custom short URL already exists"
}
```

---

### Delete URL

Delete a URL permanently.

**Endpoint:** `DELETE /api/url/delete/:id`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: URL document ID

**Success Response (200):**

```json
{
  "success": true,
  "message": "URL deleted successfully"
}
```

**Error Responses:**

```json
// 404 - URL not found
{
  "success": false,
  "message": "URL not found"
}

// 403 - Unauthorized
{
  "success": false,
  "message": "You don't have permission to delete this URL"
}
```

---

## URL Model Schema

```javascript
{
  originalUrl: String,      // Original long URL
  shortUrl: String,        // Generated short code
  customShortUrl: String,  // Custom short code (optional)
  title: String,          // Link title
  description: String,    // Link description
  image: String,         // Preview image URL
  userId: ObjectId,      // Owner user ID
  clicks: Number,        // Total click count
  isActive: Boolean,     // Active status
  collections: [ObjectId], // Collections containing this URL
  createdAt: Date,
  updatedAt: Date
}
```

---

## Examples

### cURL Examples

**Create Short URL:**
```bash
curl -X POST http://localhost:5000/api/url/shorten \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://example.com/very-long-url",
    "customShortUrl": "my-link",
    "title": "My Example Link"
  }'
```

**Get User URLs:**
```bash
curl -X GET "http://localhost:5000/api/url/user/links?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update URL:**
```bash
curl -X PUT http://localhost:5000/api/url/update/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description"
  }'
```

**Delete URL:**
```bash
curl -X DELETE http://localhost:5000/api/url/delete/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript/Fetch Examples

**Create Short URL:**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5000/api/url/shorten', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    originalUrl: 'https://example.com/very-long-url',
    customShortUrl: 'my-link',
    title: 'My Example Link',
    description: 'A great link'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Short URL:', data.data.shortUrl);
}
```

**Get User URLs with Pagination:**
```javascript
const token = localStorage.getItem('token');
const page = 1;
const limit = 10;

const response = await fetch(
  `http://localhost:5000/api/url/user/links?page=${page}&limit=${limit}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
if (data.success) {
  console.log('URLs:', data.data.urls);
  console.log('Total pages:', data.data.pagination.totalPages);
}
```

---

## Best Practices

1. **URL Validation**: Always validate URLs on the client side before submission
2. **Custom Short URLs**: Check availability before attempting to create
3. **Pagination**: Use pagination for large lists to improve performance
4. **Error Handling**: Always check the `success` field in responses
5. **Analytics**: Regularly check analytics to understand link performance
6. **Inactive URLs**: Set `isActive: false` instead of deleting to preserve analytics

---

## Common Issues

### Issue: "Custom short URL already taken"
**Solution**: Choose a different custom short URL or let the system generate one

### Issue: "Invalid URL format"
**Solution**: Ensure the URL includes the protocol (http:// or https://)

### Issue: "URL not found"
**Solution**: Verify the URL ID is correct and belongs to your account

### Issue: "You don't have permission"
**Solution**: You can only modify URLs you created
