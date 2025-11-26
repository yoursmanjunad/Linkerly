# Quick Reference Guide

A quick reference for the most commonly used Linkerly API endpoints.

## Authentication

### Register
```bash
POST /api/users/register
{
  "userName": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Login
```bash
POST /api/users/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
# Returns: { token: "..." }
```

### Get Profile
```bash
GET /api/users/profile
Authorization: Bearer <token>
```

---

## URLs

### Create Short URL
```bash
POST /api/url/shorten
Authorization: Bearer <token>
{
  "originalUrl": "https://example.com/long-url",
  "customShortUrl": "my-link",  // Optional
  "title": "My Link"            // Optional
}
```

### Get My URLs
```bash
GET /api/url/user/links?page=1&limit=10
Authorization: Bearer <token>
```

### Get URL Analytics
```bash
GET /api/url/analytics/:id
Authorization: Bearer <token>
```

### Update URL
```bash
PUT /api/url/update/:id
Authorization: Bearer <token>
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

### Delete URL
```bash
DELETE /api/url/delete/:id
Authorization: Bearer <token>
```

---

## Collections

### Create Collection
```bash
POST /api/collections
Authorization: Bearer <token>
{
  "name": "My Collection",
  "description": "Description",
  "isPublic": true,
  "collectionShortUrl": "my-collection"  // Optional
}
```

### Get My Collections
```bash
GET /api/collections
Authorization: Bearer <token>
```

### Get Collection Details
```bash
GET /api/collections/:id
Authorization: Bearer <token>
```

### Add URL to Collection
```bash
POST /api/collections/:id/urls
Authorization: Bearer <token>
{
  "urlId": "url-id-here"
}
```

### Bulk Add URLs
```bash
POST /api/collections/:id/urls/bulk
Authorization: Bearer <token>
{
  "urlIds": ["id1", "id2", "id3"]
}
```

### Remove URL from Collection
```bash
DELETE /api/collections/:id/urls/:urlId
Authorization: Bearer <token>
```

### Delete Collection
```bash
DELETE /api/collections/:id
Authorization: Bearer <token>
```

---

## Bookmarks

### Toggle Bookmark
```bash
POST /api/collections/:id/bookmark
Authorization: Bearer <token>
# Returns: { bookmarked: true/false }
```

### Get My Bookmarks
```bash
GET /api/users/bookmarks
Authorization: Bearer <token>
```

---

## Profiles

### Get Public Profile
```bash
GET /api/profiles/:username
# No auth required
```

### Update My Profile
```bash
PUT /api/profiles/me
Authorization: Bearer <token>
{
  "displayName": "John Doe",
  "bio": "My bio",
  "profilePicUrl": "https://...",
  "socialLinks": [
    { "platform": "twitter", "url": "https://twitter.com/..." }
  ]
}
```

---

## Public Endpoints

### Get Public Collection
```bash
GET /c/:slug
# No auth required
# Returns collection with all URLs
```

### Redirect Short URL
```bash
GET /:shortUrl
# No auth required
# Redirects to original URL
```

---

## Upload

### Get Upload Signature
```bash
GET /api/upload/signature
# Returns ImageKit auth params
```

---

## Common Headers

```javascript
// For authenticated requests
{
  "Authorization": "Bearer <your-token>",
  "Content-Type": "application/json"
}

// For public requests
{
  "Content-Type": "application/json"
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

---

## Quick JavaScript Examples

### Login and Store Token
```javascript
const response = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});
const data = await response.json();
if (data.success) {
  localStorage.setItem('token', data.data.token);
}
```

### Create Short URL
```javascript
const token = localStorage.getItem('token');
const response = await fetch('/api/url/shorten', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    originalUrl: 'https://example.com/long-url',
    title: 'My Link'
  })
});
const data = await response.json();
console.log('Short URL:', data.data.shortUrl);
```

### Get Bookmarks
```javascript
const token = localStorage.getItem('token');
const response = await fetch('/api/users/bookmarks', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log('Bookmarks:', data.data);
```

---

## Environment Variables

```env
# Required
MONGODB_URI=mongodb://localhost:27017/linkerly
JWT_SECRET=your-secret-key
PORT=5000

# Optional
IMAGEKIT_PUBLIC_KEY=your_key
IMAGEKIT_PRIVATE_KEY=your_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

---

## Common Workflows

### 1. User Registration Flow
1. POST `/api/users/register`
2. Store token from response
3. Use token for authenticated requests

### 2. Create and Share Collection
1. POST `/api/collections` - Create collection
2. POST `/api/url/shorten` - Create URLs
3. POST `/api/collections/:id/urls` - Add URLs to collection
4. Set `isPublic: true` in collection
5. Share `/c/:collectionShortUrl`

### 3. Bookmark Workflow
1. GET `/api/profiles/:username` - Find collections
2. POST `/api/collections/:id/bookmark` - Bookmark collection
3. GET `/api/users/bookmarks` - View all bookmarks

---

## Tips

1. **Always check `success` field** in responses
2. **Store JWT token securely** (localStorage or httpOnly cookie)
3. **Handle token expiration** - re-login when needed
4. **Use pagination** for large lists
5. **Validate input** before sending requests
6. **Handle errors gracefully** with try-catch

---

## Need More Details?

- [Complete Documentation](./README.md)
- [User API](./user-api.md)
- [URL API](./url-api.md)
- [Collections API](./collections-api.md)
- [Bookmarks API](./bookmarks-api.md)
- [Profile API](./profile-api.md)
- [Upload API](./upload-api.md)
- [Testing Guide](./testing-guide.md)
